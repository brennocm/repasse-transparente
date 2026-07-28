import {
  type Centavos,
  type Endereco,
  type EntradaRegistro,
  type EstadoPrograma,
  type Id,
  type Instante,
  type Registro,
  type ValorDado,
} from '@/core/tipos';
import {
  atualizarPrecoReferencia,
  calcularLimite,
  confirmarEntrega,
  proporRepasse,
  reportarPreco,
} from '@/core/contrato';
import { ehErroPrograma } from '@/core/erros';
import { adulterarParaDemonstracao, anexar } from '@/core/registro';
import type { Entrega, Repasse, Sessao, SituacaoRepasse } from '@/dominio/tipos';
import { semear } from '@/mocks/seed';
import { INSTANTE_ATUAL, PRAZO_ENTREGA_DIAS } from '@/mocks/repasses';
import { DIA } from '@/mocks/cotacoes';
import { podeConfirmar } from './escrow';

/**
 * Estado da aplicação e suas transições.
 *
 * O núcleo muta seu estado no lugar, como faria a conta on-chain. React precisa
 * do oposto. A conciliação é `clonarPrograma`: cada ação clona, aplica a
 * operação pelo núcleo, e devolve um estado novo. Clonar é barato nesta escala e
 * mantém o núcleo fiel ao programa.
 */

/** Incrementar invalida o estado persistido de versões anteriores. */
export const VERSAO_ESTADO = 1;

export interface EstadoApp {
  readonly versao: number;
  readonly programa: EstadoPrograma;
  readonly cadeia: readonly Registro[];
  readonly repasses: readonly Repasse[];
  readonly entregas: readonly Entrega[];
  readonly sessao: Sessao | null;
  /** Modo de demonstração da adulteração da cadeia (FR-015). */
  readonly adulteracaoAtiva: boolean;
  /** "Agora" da demonstração. Fixo — o dataset é determinístico. */
  readonly instanteAtual: Instante;
  /** Última mensagem para o usuário, consumida pela interface. */
  readonly aviso: string | null;
}

export function clonarPrograma(p: EstadoPrograma): EstadoPrograma {
  return {
    prefeitura: p.prefeitura,
    toleranciaPercentual: p.toleranciaPercentual,
    confirmacoesNecessarias: p.confirmacoesNecessarias,
    fontesAutorizadas: new Map(p.fontesAutorizadas),
    tabelaPrecos: new Map(p.tabelaPrecos),
    cotacoesOraculo: new Map(
      [...p.cotacoesOraculo].map(([k, v]) => [k, new Map(v)] as const),
    ),
    listaFontes: [...p.listaFontes],
    saldosBrz: new Map(p.saldosBrz),
    repasses: new Map(p.repasses),
  };
}

export function estadoInicial(): EstadoApp {
  const { estado, cadeia, repasses, entregas } = semear();
  return {
    versao: VERSAO_ESTADO,
    programa: estado,
    cadeia,
    repasses,
    entregas,
    sessao: null,
    adulteracaoAtiva: false,
    instanteAtual: INSTANTE_ATUAL,
    aviso: null,
  };
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

export type Acao =
  | { readonly tipo: 'entrar'; readonly perfilId: Id }
  | { readonly tipo: 'sair' }
  | {
      readonly tipo: 'propor-repasse';
      readonly itemId: Id;
      readonly fornecedorId: Id;
      readonly escolaId: Id;
      readonly quantidade: bigint;
      readonly valorTotal: Centavos;
      readonly autor: Endereco;
    }
  | {
      readonly tipo: 'reportar-cotacao';
      readonly itemId: Id;
      readonly fonte: Endereco;
      readonly preco: Centavos;
    }
  | { readonly tipo: 'recalcular-referencia'; readonly itemId: Id }
  | {
      readonly tipo: 'confirmar-entrega';
      readonly repasseId: Id;
      readonly confirmador: Endereco;
      /**
       * Demonstração da falha CRIT-02: ignora a unicidade que a aplicação impõe
       * e deixa a mesma parte atingir o quórum sozinha (FR-057).
       */
      readonly ignorarUnicidade?: boolean;
    }
  | {
      readonly tipo: 'registrar-divergencia';
      readonly repasseId: Id;
      readonly confirmador: Endereco;
      readonly descricao: string;
    }
  | {
      readonly tipo: 'adulterar-registro';
      readonly numero: number;
      readonly dados: Readonly<Record<string, ValorDado>>;
    }
  | { readonly tipo: 'restaurar-tudo' }
  | { readonly tipo: 'limpar-aviso' }
  /** Substitui o estado pelo que veio do `localStorage`, após a hidratação. */
  | { readonly tipo: 'hidratar'; readonly app: EstadoApp };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function reduzir(app: EstadoApp, acao: Acao): EstadoApp {
  switch (acao.tipo) {
    case 'entrar':
      return {
        ...app,
        sessao: {
          perfilId: acao.perfilId,
          iniciadaEm: app.instanteAtual,
          versaoEstado: VERSAO_ESTADO,
        },
        aviso: null,
      };

    case 'sair':
      // Sair não restaura dados. A restauração é comando próprio (FR-048).
      return { ...app, sessao: null, aviso: null };

    case 'restaurar-tudo':
      return { ...estadoInicial(), sessao: app.sessao, aviso: 'Dados restaurados.' };

    case 'limpar-aviso':
      return { ...app, aviso: null };

    case 'hidratar':
      return acao.app;

    case 'propor-repasse':
      return aplicarProposta(app, acao);

    case 'reportar-cotacao':
      return aplicarCotacao(app, acao);

    case 'recalcular-referencia':
      return aplicarRecalculo(app, acao);

    case 'confirmar-entrega':
      return aplicarConfirmacao(app, acao);

    case 'registrar-divergencia':
      return aplicarDivergencia(app, acao);

    case 'adulterar-registro':
      return {
        ...app,
        cadeia: adulterarParaDemonstracao(app.cadeia, acao.numero, acao.dados),
        adulteracaoAtiva: true,
        aviso: `Registro ${acao.numero} adulterado. Verifique a integridade da cadeia.`,
      };
  }
}

// ---------------------------------------------------------------------------
// Aplicação das operações
// ---------------------------------------------------------------------------

function anexarEm(
  cadeia: readonly Registro[],
  entrada: EntradaRegistro,
): { cadeia: Registro[]; numero: number } {
  const nova = anexar(cadeia, entrada);
  return { cadeia: nova, numero: nova.length - 1 };
}

function aplicarProposta(
  app: EstadoApp,
  acao: Extract<Acao, { tipo: 'propor-repasse' }>,
): EstadoApp {
  const programa = clonarPrograma(app.programa);
  const referencia = programa.tabelaPrecos.get(acao.itemId)?.precoMediana ?? 0n;
  const limite = calcularLimite(referencia, programa.toleranciaPercentual);
  const id = `rep-${String(app.repasses.length + 1).padStart(4, '0')}`;
  const horario = app.instanteAtual;

  let cadeia: readonly Registro[] = app.cadeia;
  const registros: number[] = [];

  const proposta = anexarEm(cadeia, {
    horario,
    tipo: 'RepasseProposto',
    autor: acao.autor,
    dados: {
      repasseId: id,
      itemId: acao.itemId,
      quantidade: acao.quantidade,
      valorTotal: acao.valorTotal,
    },
    sucesso: true,
    motivoFalha: null,
  });
  cadeia = proposta.cadeia;
  registros.push(proposta.numero);

  let situacao: SituacaoRepasse;
  let motivoRejeicao: string | null = null;
  let aviso: string;

  try {
    proporRepasse(
      programa,
      id,
      acao.itemId,
      enderecoFornecedor(acao.fornecedorId),
      acao.quantidade,
      acao.valorTotal,
    );
    situacao = 'Retido';
    aviso = 'Repasse aprovado. Valor custodiado até a confirmação de entrega.';

    const r = anexarEm(cadeia, {
      horario: horario + 60_000,
      tipo: 'RepasseAprovado',
      autor: acao.autor,
      dados: { repasseId: id, valor: acao.valorTotal, custodiado: true },
      sucesso: true,
      motivoFalha: null,
    });
    cadeia = r.cadeia;
    registros.push(r.numero);
  } catch (erro) {
    if (!ehErroPrograma(erro)) throw erro;
    situacao = 'Rejeitado';
    motivoRejeicao = erro.message;
    aviso = erro.explicacao;

    const r = anexarEm(cadeia, {
      horario: horario + 60_000,
      tipo: 'RepasseRejeitado',
      autor: acao.autor,
      dados: {
        repasseId: id,
        valorProposto: acao.valorTotal,
        limiteAplicado: limite,
        medianaAplicada: referencia,
      },
      sucesso: false,
      motivoFalha: erro.message,
    });
    cadeia = r.cadeia;
    registros.push(r.numero);
  }

  const repasse: Repasse = {
    id,
    itemId: acao.itemId,
    fornecedorId: acao.fornecedorId,
    escolaId: acao.escolaId,
    quantidade: acao.quantidade,
    valorTotal: acao.valorTotal,
    precoUnitarioEfetivo:
      acao.quantidade === 0n ? 0n : acao.valorTotal / acao.quantidade,
    medianaAplicada: referencia,
    limiteAplicado: limite,
    toleranciaAplicada: programa.toleranciaPercentual,
    situacao,
    motivoRejeicao,
    criadoEm: horario,
    registros,
  };

  const entregas =
    situacao === 'Rejeitado'
      ? app.entregas
      : [
          ...app.entregas,
          {
            repasseId: id,
            escolaId: acao.escolaId,
            situacao: 'pendente' as const,
            prazoLimite: horario + PRAZO_ENTREGA_DIAS * DIA,
            confirmadoPor: [],
            confirmadoEm: null,
            descricaoDivergencia: null,
          },
        ];

  return {
    ...app,
    programa,
    cadeia,
    repasses: [...app.repasses, repasse],
    entregas,
    aviso,
  };
}

function aplicarCotacao(
  app: EstadoApp,
  acao: Extract<Acao, { tipo: 'reportar-cotacao' }>,
): EstadoApp {
  const programa = clonarPrograma(app.programa);

  try {
    reportarPreco(programa, acao.itemId, acao.fonte, acao.preco);
  } catch (erro) {
    if (!ehErroPrograma(erro)) throw erro;
    return { ...app, aviso: erro.explicacao };
  }

  const { cadeia } = anexarEm(app.cadeia, {
    horario: app.instanteAtual,
    tipo: 'PrecoReportado',
    autor: acao.fonte,
    dados: { itemId: acao.itemId, preco: acao.preco },
    sucesso: true,
    motivoFalha: null,
  });

  return { ...app, programa, cadeia, aviso: 'Cotação registrada.' };
}

/**
 * Recalcula a referência a partir das cotações **efetivamente registradas**.
 *
 * O programa aceita qualquer vetor (CRIT-01). Impedir que dados inventados
 * cheguem ao cálculo é responsabilidade desta camada — e é exatamente a
 * correção que a v0.2 precisa levar para dentro do programa.
 */
function aplicarRecalculo(
  app: EstadoApp,
  acao: Extract<Acao, { tipo: 'recalcular-referencia' }>,
): EstadoApp {
  const programa = clonarPrograma(app.programa);
  const precos = cotacoesRegistradas(programa, acao.itemId);

  try {
    const evento = atualizarPrecoReferencia(
      programa,
      acao.itemId,
      precos,
      app.instanteAtual,
    );

    const { cadeia } = anexarEm(app.cadeia, {
      horario: app.instanteAtual,
      tipo: 'MedianaAtualizada',
      autor: programa.prefeitura,
      dados: { itemId: acao.itemId, mediana: evento.mediana, fontes: precos.length },
      sucesso: true,
      motivoFalha: null,
    });

    return { ...app, programa, cadeia, aviso: 'Preço de referência atualizado.' };
  } catch (erro) {
    if (!ehErroPrograma(erro)) throw erro;
    return { ...app, aviso: erro.explicacao };
  }
}

/** As cotações vigentes de um item, apenas de fontes autorizadas. */
export function cotacoesRegistradas(
  programa: EstadoPrograma,
  itemId: Id,
): Centavos[] {
  const porFonte = programa.cotacoesOraculo.get(itemId);
  if (porFonte === undefined) return [];

  return [...porFonte.entries()]
    .filter(([fonte]) => programa.fontesAutorizadas.get(fonte) === true)
    .map(([, preco]) => preco);
}

function aplicarConfirmacao(
  app: EstadoApp,
  acao: Extract<Acao, { tipo: 'confirmar-entrega' }>,
): EstadoApp {
  const entrega = app.entregas.find((e) => e.repasseId === acao.repasseId);
  if (entrega === undefined) return { ...app, aviso: 'Entrega não encontrada.' };

  if (acao.ignorarUnicidade !== true) {
    const veredito = podeConfirmar(entrega, acao.confirmador);
    if (!veredito.pode) return { ...app, aviso: veredito.motivo };
  }

  const programa = clonarPrograma(app.programa);
  let resultado;
  try {
    resultado = confirmarEntrega(programa, acao.repasseId);
  } catch (erro) {
    if (!ehErroPrograma(erro)) throw erro;
    return { ...app, aviso: erro.explicacao };
  }

  let cadeia: readonly Registro[] = app.cadeia;
  const registros: number[] = [];

  const c = anexarEm(cadeia, {
    horario: app.instanteAtual,
    tipo: 'EntregaConfirmada',
    autor: acao.confirmador,
    dados: {
      repasseId: acao.repasseId,
      confirmacoes: resultado.confirmacoes,
      quorum: programa.confirmacoesNecessarias,
    },
    sucesso: true,
    motivoFalha: null,
  });
  cadeia = c.cadeia;
  registros.push(c.numero);

  if (resultado.quorumAtingido) {
    const l = anexarEm(cadeia, {
      horario: app.instanteAtual + 60_000,
      tipo: 'ValorLiberado',
      autor: acao.confirmador,
      dados: { repasseId: acao.repasseId, valor: resultado.valorLiberado },
      sucesso: true,
      motivoFalha: null,
    });
    cadeia = l.cadeia;
    registros.push(l.numero);
  }

  return {
    ...app,
    programa,
    cadeia,
    repasses: app.repasses.map((r) =>
      r.id === acao.repasseId
        ? {
            ...r,
            // Só o quórum libera. Uma confirmação isolada mantém o valor retido.
            situacao: resultado.quorumAtingido ? ('Liberado' as const) : r.situacao,
            registros: [...r.registros, ...registros],
          }
        : r,
    ),
    entregas: app.entregas.map((e) =>
      e.repasseId === acao.repasseId
        ? {
            ...e,
            situacao: resultado.quorumAtingido ? ('confirmada' as const) : e.situacao,
            confirmadoPor: [...e.confirmadoPor, acao.confirmador],
            confirmadoEm: resultado.quorumAtingido ? app.instanteAtual : e.confirmadoEm,
          }
        : e,
    ),
    aviso: resultado.quorumAtingido
      ? 'Quórum atingido. Valor liberado ao fornecedor.'
      : `Confirmação registrada: ${resultado.confirmacoes} de ${programa.confirmacoesNecessarias}.`,
  };
}

function aplicarDivergencia(
  app: EstadoApp,
  acao: Extract<Acao, { tipo: 'registrar-divergencia' }>,
): EstadoApp {
  const { cadeia } = anexarEm(app.cadeia, {
    horario: app.instanteAtual,
    tipo: 'DivergenciaRegistrada',
    autor: acao.confirmador,
    dados: { repasseId: acao.repasseId, descricao: acao.descricao },
    sucesso: true,
    motivoFalha: null,
  });

  return {
    ...app,
    cadeia,
    repasses: app.repasses.map((r) =>
      r.id === acao.repasseId ? { ...r, situacao: 'Divergente' as const } : r,
    ),
    entregas: app.entregas.map((e) =>
      e.repasseId === acao.repasseId
        ? { ...e, situacao: 'divergente' as const, descricaoDivergencia: acao.descricao }
        : e,
    ),
    aviso: 'Divergência registrada. O valor permanece retido em custódia.',
  };
}

function enderecoFornecedor(fornecedorId: string): Endereco {
  const n = Number(fornecedorId.slice(4));
  return '0x' + `d${n}`.repeat(20);
}
