import { calcularMediana } from './mediana';
import { ErroPrograma } from './erros';
import {
  CONTA_CUSTODIA,
  MINIMO_FONTES,
  type Centavos,
  type Endereco,
  type EstadoPrograma,
  type EventoMedianaAtualizada,
  type EventoPrecoReportado,
  type EventoRepasseAprovado,
  type Id,
  type Instante,
  type ResultadoConfirmacao,
} from './tipos';

/**
 * Transliteração do programa `repasse_transparente` (Anchor/Rust).
 *
 * As divergências do programa original são preservadas de propósito. Ver a
 * auditoria em `research.md` e os testes em `tests/core/contrato.test.ts`, que as
 * travam como comportamento esperado. Correções pertencem à v0.2 do programa,
 * nunca a este arquivo (Princípio II).
 */

// ---------------------------------------------------------------------------
// Saldos de BRZ — simulam as contas SPL e o CPI `token::transfer`
// ---------------------------------------------------------------------------

export function saldoBrz(estado: EstadoPrograma, conta: Endereco): Centavos {
  return estado.saldosBrz.get(conta) ?? 0n;
}

/**
 * Equivale ao CPI `token::transfer`. Falha por saldo insuficiente vem do SPL
 * Token Program, não do `repasse_transparente`.
 */
function transferirBrz(
  estado: EstadoPrograma,
  de: Endereco,
  para: Endereco,
  valor: Centavos,
): void {
  const origem = saldoBrz(estado, de);
  if (origem < valor) throw new ErroPrograma('SaldoInsuficiente');

  estado.saldosBrz.set(de, origem - valor);
  estado.saldosBrz.set(para, saldoBrz(estado, para) + valor);
}

// ---------------------------------------------------------------------------
// autorizar_fonte
// ---------------------------------------------------------------------------

/**
 * ```rust
 * pub fn autorizar_fonte(ctx: Context<AutorizarFonte>) -> Result<()> {
 *     ctx.accounts.registro_fonte.autorizada = true;
 *     Ok(())
 * }
 * ```
 *
 * Não emite evento e não devolve nada — fiel ao programa. A instrução que
 * introduz uma nova fonte de verdade no sistema é silenciosa para quem observa
 * a rede apenas por eventos.
 */
export function autorizarFonte(estado: EstadoPrograma, fonte: Endereco): void {
  estado.fontesAutorizadas.set(fonte, true);
  if (!estado.listaFontes.includes(fonte)) estado.listaFontes.push(fonte);
}

// ---------------------------------------------------------------------------
// reportar_preco
// ---------------------------------------------------------------------------

/**
 * `require!(ctx.accounts.registro_fonte.autorizada, Erro::FonteNaoAutorizada)`,
 * grava a cotação na conta da fonte e emite `PrecoReportado`.
 *
 * Divergência MED-02 preservada: cotação zero é aceita — nenhum `require!` a impede.
 */
export function reportarPreco(
  estado: EstadoPrograma,
  itemId: Id,
  fonte: Endereco,
  preco: Centavos,
): EventoPrecoReportado {
  if (estado.fontesAutorizadas.get(fonte) !== true) {
    throw new ErroPrograma('FonteNaoAutorizada');
  }

  let porFonte = estado.cotacoesOraculo.get(itemId);
  if (porFonte === undefined) {
    porFonte = new Map();
    estado.cotacoesOraculo.set(itemId, porFonte);
  }
  porFonte.set(fonte, preco);

  return { tipo: 'PrecoReportado', itemId, fonte, preco };
}

// ---------------------------------------------------------------------------
// atualizar_preco_referencia
// ---------------------------------------------------------------------------

/**
 * `require!(precos.len() >= 3, Erro::FontesInsuficientes)`, calcula a mediana e
 * grava em `item_preco`.
 *
 * `agora` substitui `Clock::get()?.unix_timestamp`: o núcleo é determinístico e
 * não lê o relógio.
 *
 * **Divergência CRIT-01 preservada.** A função calcula sobre o vetor `precos`
 * recebido e **nunca lê** `estado.cotacoesOraculo`. Quem chama informa o conjunto
 * que quiser, contornando toda a arquitetura de oráculos. Cabe à camada
 * adaptadora alimentar o vetor a partir das cotações efetivamente registradas —
 * o programa não impõe isso.
 *
 * **Divergência ALTA-01 preservada.** `atualizadoEm` é gravado e nunca lido: não
 * há verificação de frescor.
 */
export function atualizarPrecoReferencia(
  estado: EstadoPrograma,
  itemId: Id,
  precos: readonly Centavos[],
  agora: Instante,
): EventoMedianaAtualizada {
  if (precos.length < MINIMO_FONTES) {
    throw new ErroPrograma('FontesInsuficientes');
  }

  const mediana = calcularMediana(precos);
  estado.tabelaPrecos.set(itemId, { precoMediana: mediana, atualizadoEm: agora });

  return { tipo: 'MedianaAtualizada', itemId, mediana };
}

// ---------------------------------------------------------------------------
// Limite de tolerância
// ---------------------------------------------------------------------------

/**
 * `referencia + (referencia * TOLERANCIA_PERCENTUAL / 100)`, com truncamento.
 *
 * Extraída para que a interface exiba o limite antes do envio (FR-031). Sem
 * efeito colateral e sem decisão.
 */
export function calcularLimite(
  referencia: Centavos,
  toleranciaPercentual: bigint,
): Centavos {
  return referencia + (referencia * toleranciaPercentual) / 100n;
}

// ---------------------------------------------------------------------------
// propor_repasse
// ---------------------------------------------------------------------------

/**
 * A trava, seguida da custódia. Ordem idêntica à do programa — a sequência
 * determina qual erro o usuário vê quando mais de uma condição falha:
 *
 * 1. `require!(referencia > 0, Erro::SemReferencia)`
 * 2. `checked_div(quantidade).ok_or(Erro::QuantidadeInvalida)?`
 * 3. `require!(preco_unitario <= limite, Erro::AcimaDoLimite)`
 * 4. CPI `token::transfer`: prefeitura → custódia
 * 5. grava a conta `repasse` e emite `RepasseAprovado`
 *
 * **A transferência acontece depois da trava.** Uma proposta rejeitada não move
 * um centavo — o saldo da prefeitura fica intacto.
 *
 * Fronteira exata: preço unitário **igual** ao limite aprova.
 * Divergência MED-03 preservada: `checked_div` trunca o preço unitário.
 * Divergência MED-05: nenhuma verificação de quem propõe.
 */
export function proporRepasse(
  estado: EstadoPrograma,
  repasseId: Id,
  itemId: Id,
  fornecedor: Endereco,
  quantidade: bigint,
  valorProposto: Centavos,
): EventoRepasseAprovado {
  const referencia = estado.tabelaPrecos.get(itemId)?.precoMediana ?? 0n;
  if (referencia <= 0n) throw new ErroPrograma('SemReferencia');

  if (quantidade === 0n) throw new ErroPrograma('QuantidadeInvalida');
  const precoUnitario = valorProposto / quantidade;

  const limite = calcularLimite(referencia, estado.toleranciaPercentual);
  if (precoUnitario > limite) throw new ErroPrograma('AcimaDoLimite');

  transferirBrz(estado, estado.prefeitura, CONTA_CUSTODIA, valorProposto);

  estado.repasses.set(repasseId, {
    fornecedor,
    valor: valorProposto,
    quantidade,
    liberado: false,
    confirmacoes: 0,
  });

  return { tipo: 'RepasseAprovado', repasseId, valor: valorProposto };
}

// ---------------------------------------------------------------------------
// confirmar_entrega
// ---------------------------------------------------------------------------

/**
 * `require!(!repasse.liberado, Erro::JaLiberado)`, incrementa o contador e, ao
 * atingir o quórum, transfere o BRZ da custódia ao fornecedor.
 *
 * **Divergência CRIT-02 preservada — a falha mais grave desta versão.** O
 * programa **não registra quem confirmou**. Não há parâmetro de confirmador
 * porque não há uso para ele: o contador simplesmente sobe. A mesma carteira
 * chama a instrução duas vezes e libera o dinheiro sozinha, anulando a
 * mitigação que a matriz de riscos promete para entrega fictícia.
 *
 * A camada adaptadora impede a repetição em uso normal; o modo de demonstração
 * exibe a falha deliberadamente (research.md, decisão 14).
 *
 * **Divergência ALTA-02 preservada:** nenhum evento é emitido. A instrução que
 * libera o dinheiro é a única silenciosa, contradizendo a observação (iii) do
 * documento da proposta.
 */
export function confirmarEntrega(
  estado: EstadoPrograma,
  repasseId: Id,
): ResultadoConfirmacao {
  const repasse = estado.repasses.get(repasseId);
  if (repasse === undefined) {
    // Em Anchor, a resolução de contas falharia antes de entrar na instrução.
    // Não há variante de `Erro` para isto — é falha do runtime, não do programa.
    throw new Error(`conta de repasse inexistente: ${repasseId}`);
  }

  if (repasse.liberado) throw new ErroPrograma('JaLiberado');

  const confirmacoes = repasse.confirmacoes + 1;
  const quorumAtingido = confirmacoes >= estado.confirmacoesNecessarias;

  estado.repasses.set(repasseId, { ...repasse, confirmacoes, liberado: quorumAtingido });

  if (!quorumAtingido) {
    return { repasseId, confirmacoes, quorumAtingido: false, valorLiberado: null };
  }

  transferirBrz(estado, CONTA_CUSTODIA, repasse.fornecedor, repasse.valor);

  return {
    repasseId,
    confirmacoes,
    quorumAtingido: true,
    valorLiberado: repasse.valor,
  };
}
