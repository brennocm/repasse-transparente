import type { Id, Instante, Registro, TipoRegistro } from '@/core/tipos';
import type { Entrega, Repasse, SituacaoRepasse } from '@/dominio/tipos';
import { ITENS } from '@/mocks/itens';
import { FORNECEDORES } from '@/mocks/fornecedores';
import { ESCOLAS } from '@/mocks/municipio';
import { FONTES } from '@/mocks/fontes';
import { calcularImpacto, sobreprecoPercentual, type Impacto } from './impacto';
import { formatarReais } from './formato';
import { entregaVencida } from './escrow';

/**
 * Consultas e filtros do painel público (FR-026, FR-027, FR-028).
 *
 * Os agregados são sempre recalculados sobre o recorte filtrado — um indicador
 * que não acompanha o filtro engana quem lê.
 */

export interface Filtro {
  readonly situacao?: SituacaoRepasse | 'todas';
  readonly itemId?: Id | 'todos';
  readonly de?: Instante;
  readonly ate?: Instante;
  readonly escolaId?: Id | 'todas';
}

export function filtrarRepasses(
  repasses: readonly Repasse[],
  filtro: Filtro,
): readonly Repasse[] {
  return repasses.filter((r) => {
    if (filtro.situacao && filtro.situacao !== 'todas' && r.situacao !== filtro.situacao)
      return false;
    if (filtro.itemId && filtro.itemId !== 'todos' && r.itemId !== filtro.itemId)
      return false;
    if (filtro.escolaId && filtro.escolaId !== 'todas' && r.escolaId !== filtro.escolaId)
      return false;
    if (filtro.de !== undefined && r.criadoEm < filtro.de) return false;
    if (filtro.ate !== undefined && r.criadoEm > filtro.ate) return false;
    return true;
  });
}

/** Filtra e recalcula os indicadores para o recorte, nunca para o total. */
export function consultar(
  repasses: readonly Repasse[],
  filtro: Filtro,
): { readonly repasses: readonly Repasse[]; readonly impacto: Impacto } {
  const recorte = filtrarRepasses(repasses, filtro);
  return { repasses: recorte, impacto: calcularImpacto(recorte) };
}

export function repassePorId(
  repasses: readonly Repasse[],
  id: Id,
): Repasse | undefined {
  return repasses.find((r) => r.id === id);
}

/** Rejeições mais recentes primeiro — é o que o órgão de controle abre primeiro. */
export function alertas(repasses: readonly Repasse[], limite?: number) {
  const rejeitados = repasses
    .filter((r) => r.situacao === 'Rejeitado')
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .map((r) => ({ repasse: r, sobrepreco: sobreprecoPercentual(r) }));

  return limite === undefined ? rejeitados : rejeitados.slice(0, limite);
}

export function pendenciasVencidas(
  entregas: readonly Entrega[],
  agora: Instante,
): readonly Entrega[] {
  return entregas
    .filter((e) => entregaVencida(e, agora))
    .sort((a, b) => a.prazoLimite - b.prazoLimite);
}

export function divergenciasAbertas(entregas: readonly Entrega[]): readonly Entrega[] {
  return entregas.filter((e) => e.situacao === 'divergente');
}

// ---------------------------------------------------------------------------
// Cadeia
// ---------------------------------------------------------------------------

export function registrosDoRepasse(
  cadeia: readonly Registro[],
  repasse: Repasse,
): readonly Registro[] {
  return repasse.registros
    .map((n) => cadeia[n])
    .filter((r): r is Registro => r !== undefined);
}

/** Série de medianas de um item ao longo do tempo, para o gráfico (FR-028). */
export function serieDeMedianas(
  cadeia: readonly Registro[],
  itemId: Id,
): readonly { readonly horario: Instante; readonly mediana: bigint }[] {
  return cadeia
    .filter((r) => r.tipo === 'MedianaAtualizada' && r.dados['itemId'] === itemId)
    .map((r) => ({ horario: r.horario, mediana: BigInt(r.dados['mediana'] as bigint) }));
}

// ---------------------------------------------------------------------------
// Catálogo — resolução de identificadores para nomes
// ---------------------------------------------------------------------------

export function nomeItem(id: Id): string {
  return ITENS.find((i) => i.id === id)?.nome ?? id;
}

export function unidadeItem(id: Id): string {
  return ITENS.find((i) => i.id === id)?.unidade ?? 'un';
}

export function nomeFornecedor(id: Id): string {
  return FORNECEDORES.find((f) => f.id === id)?.nome ?? id;
}

export function nomeEscola(id: Id): string {
  return ESCOLAS.find((e) => e.id === id)?.nome ?? id;
}

export function nomeFonte(endereco: string): string {
  return FONTES.find((f) => f.endereco === endereco)?.nomeCurto ?? endereco;
}

/**
 * Uma cotação é discrepante se estiver a mais de 25% da mediana vigente.
 *
 * O limiar é de apresentação, não de regra: o programa aceita qualquer cotação
 * (MED-02). Sinalizar é da interface; rejeitar seria decidir preço fora do
 * núcleo, o que o Princípio II proíbe.
 */
export function ehDiscrepante(preco: bigint, mediana: bigint): boolean {
  if (mediana === 0n) return false;
  const desvio = ((preco - mediana) * 100n) / mediana;
  return desvio > 25n || desvio < -25n;
}

/** Média aritmética, para o comparativo contra a mediana (FR-034). */
export function mediaAritmetica(valores: readonly bigint[]): bigint {
  if (valores.length === 0) return 0n;
  return valores.reduce((s, v) => s + v, 0n) / BigInt(valores.length);
}

// ---------------------------------------------------------------------------
// Leitura da cadeia por humanos
// ---------------------------------------------------------------------------

/** Rótulo curto de cada tipo de evento, para a lista do explorador. */
export const ROTULO_TIPO: Readonly<Record<TipoRegistro, string>> = {
  Genese: 'Gênese',
  FonteAutorizada: 'Fonte autorizada',
  PrecoReportado: 'Preço reportado',
  MedianaAtualizada: 'Mediana atualizada',
  RepasseProposto: 'Repasse proposto',
  RepasseAprovado: 'Repasse aprovado',
  RepasseRejeitado: 'Repasse rejeitado',
  EntregaConfirmada: 'Entrega confirmada',
  ValorLiberado: 'Valor liberado',
  DivergenciaRegistrada: 'Divergência registrada',
};

/**
 * Frase legível do que aconteceu num registro.
 *
 * O explorador precisa ser lido por um conselheiro escolar, não só por quem
 * entende de hash. Jargão sem tradução ao lado viola o Princípio IV.
 */
export function resumirRegistro(r: Registro): string {
  const d = r.dados;
  const n = (chave: string): bigint =>
    typeof d[chave] === 'bigint' ? (d[chave] as bigint) : 0n;
  const t = (chave: string): string => String(d[chave] ?? '');

  switch (r.tipo) {
    case 'Genese':
      return `Município ${t('municipio')} · tolerância de ${n('toleranciaPercentual')}% · quórum de ${d['confirmacoesNecessarias']} confirmações`;
    case 'FonteAutorizada':
      return `${nomeFonte(t('fonte'))} passou a poder reportar preços`;
    case 'PrecoReportado':
      return `${nomeFonte(r.autor)} reportou ${formatarReais(n('preco'))} para ${nomeItem(t('itemId'))}`;
    case 'MedianaAtualizada':
      return `${nomeItem(t('itemId'))} passou a valer ${formatarReais(n('mediana'))}, mediana de ${d['fontes']} cotações`;
    case 'RepasseProposto':
      return `${t('repasseId')} · ${nomeItem(t('itemId'))} · ${formatarReais(n('valorTotal'))}`;
    case 'RepasseAprovado':
      return `${t('repasseId')} aprovado · ${formatarReais(n('valor'))} transferidos à custódia`;
    case 'RepasseRejeitado':
      return `${t('repasseId')} bloqueado · proposto ${formatarReais(n('valorProposto'))} contra limite de ${formatarReais(n('limiteAplicado'))} por unidade`;
    case 'EntregaConfirmada':
      return `${t('repasseId')} · confirmação ${d['confirmacoes']} de ${d['quorum']}`;
    case 'ValorLiberado':
      return `${t('repasseId')} · ${formatarReais(n('valor'))} pagos ao fornecedor`;
    case 'DivergenciaRegistrada':
      return `${t('repasseId')} · ${t('descricao')}`;
  }
}

/** Registros de um tipo, do mais recente ao mais antigo. */
export function filtrarCadeia(
  cadeia: readonly Registro[],
  tipo: TipoRegistro | 'todos',
): readonly Registro[] {
  return tipo === 'todos' ? cadeia : cadeia.filter((r) => r.tipo === tipo);
}
