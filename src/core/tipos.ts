/**
 * Tipos do núcleo — espelham o programa `repasse_transparente` (Anchor/Rust) da
 * seção 5 de `RepasseTransparente_Proposta.docx`.
 *
 * Este módulo é PURO: sem React, sem I/O, sem async, sem conhecimento de escolas,
 * refeições ou formatação. Ver `.specify/memory/constitution.md`, Princípio II.
 *
 * Requisitos: FR-007, FR-011.
 */

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

/**
 * Valor monetário em **centavos de BRZ**. Nunca `number` (FR-007).
 *
 * O programa usa `u64`. Reproduzir com ponto flutuante introduziria erro
 * justamente nas comparações que decidem aprovação e rejeição. Com `bigint`, a
 * divisão já trunca por padrão, replicando gratuitamente a semântica do Rust.
 *
 * O BRZ é pareado 1:1 ao Real, então um centavo de BRZ é um centavo de Real.
 */
export type Centavos = bigint;

/** Milissegundos desde a época. Determinístico na semeadura — nunca `Date.now()`. */
export type Instante = number;

/** Identificador estável de entidade. Equivale a uma chave de conta. */
export type Id = string;

/** Endereço simulado. Análogo a `Pubkey`, aqui no formato "0x" + 40 hexadecimais. */
export type Endereco = string;

/**
 * Conta de custódia — análoga à PDA `b"custodia"` do programa.
 *
 * O valor fica sob controle exclusivo do programa, e não de qualquer parte
 * individual. É o que distingue custódia programável de uma promessa de pagamento.
 */
export const CONTA_CUSTODIA: Endereco = '0x' + 'cd'.repeat(20);

// ---------------------------------------------------------------------------
// Estado do programa
// ---------------------------------------------------------------------------

/**
 * Espelha a conta `ItemPreco`.
 *
 * Divergência ALTA-01 preservada: `atualizadoEm` recebe o relógio e jamais é
 * lido — não há verificação de frescor, e uma mediana obsoleta é aceita.
 */
export interface ItemPreco {
  readonly precoMediana: Centavos;
  readonly atualizadoEm: Instante;
}

/**
 * Espelha a conta `Repasse`.
 *
 * Divergência CRIT-02 preservada: `confirmacoes` é um contador, sem registro de
 * **quem** confirmou. A mesma carteira pode atingir o quórum sozinha.
 */
export interface ContaRepasse {
  readonly fornecedor: Endereco;
  readonly valor: Centavos;
  readonly quantidade: bigint;
  readonly liberado: boolean;
  readonly confirmacoes: number;
}

/**
 * Espelha o estado on-chain do programa.
 *
 * `precoMediana === 0n` significa **ausência de referência**, não preço zero
 * (FR-006). É assim que `proporRepasse` distingue os dois casos.
 */
export interface EstadoPrograma {
  /** Autoridade de origem do BRZ. Equivale à conta `prefeitura`. */
  readonly prefeitura: Endereco;
  /** `TOLERANCIA_PERCENTUAL`, constante do programa: 15 (FR-010). */
  toleranciaPercentual: bigint;
  /** `CONFIRMACOES_NECESSARIAS`, constante do programa: 2 (FR-038). */
  confirmacoesNecessarias: number;
  readonly fontesAutorizadas: Map<Endereco, boolean>;
  readonly tabelaPrecos: Map<Id, ItemPreco>;
  /** itemId → fonte → cotação vigente. Reporte novo substitui o anterior. */
  readonly cotacoesOraculo: Map<Id, Map<Endereco, Centavos>>;
  readonly listaFontes: Endereco[];
  /** Saldos das contas SPL de BRZ, em centavos. */
  readonly saldosBrz: Map<Endereco, Centavos>;
  readonly repasses: Map<Id, ContaRepasse>;
}

// ---------------------------------------------------------------------------
// Eventos — espelham os `emit!` do programa (FR-008)
// ---------------------------------------------------------------------------

export interface EventoPrecoReportado {
  readonly tipo: 'PrecoReportado';
  readonly itemId: Id;
  readonly fonte: Endereco;
  readonly preco: Centavos;
}

export interface EventoMedianaAtualizada {
  readonly tipo: 'MedianaAtualizada';
  readonly itemId: Id;
  readonly mediana: Centavos;
}

export interface EventoRepasseAprovado {
  readonly tipo: 'RepasseAprovado';
  readonly repasseId: Id;
  readonly valor: Centavos;
}

export type Evento =
  | EventoPrecoReportado
  | EventoMedianaAtualizada
  | EventoRepasseAprovado;

/**
 * Resultado de `confirmarEntrega`.
 *
 * Não é um `Evento` porque o programa **não emite nada** nessa instrução —
 * divergência ALTA-02, em contradição com a observação (iii) do próprio
 * documento, que afirma que toda alteração de estado emite evento indexável.
 * A instrução que libera o dinheiro é a única silenciosa.
 */
export interface ResultadoConfirmacao {
  readonly repasseId: Id;
  readonly confirmacoes: number;
  readonly quorumAtingido: boolean;
  readonly valorLiberado: Centavos | null;
}

// ---------------------------------------------------------------------------
// Registro encadeado (FR-011 a FR-016)
// ---------------------------------------------------------------------------

export type TipoRegistro =
  | 'Genese'
  | 'FonteAutorizada'
  | 'PrecoReportado'
  | 'MedianaAtualizada'
  | 'RepasseProposto'
  | 'RepasseAprovado'
  | 'RepasseRejeitado'
  | 'EntregaConfirmada'
  | 'ValorLiberado'
  /** Extensão da simulação, além do programa publicado. Ver `data-model.md`. */
  | 'DivergenciaRegistrada';

/** Valor serializável de forma estável dentro de `Registro.dados`. */
export type ValorDado = string | number | bigint | boolean | null;

/**
 * Entrada da cadeia auditável.
 *
 * Somente-anexação em operação normal (FR-016). Operações revertidas também
 * entram, com `sucesso: false` — a tentativa bloqueada é o produto (FR-013).
 */
export interface Registro {
  /** Sequencial a partir de 0, sem lacuna. */
  readonly numero: number;
  /** Monotônico não-decrescente. */
  readonly horario: Instante;
  readonly tipo: TipoRegistro;
  readonly autor: Endereco;
  readonly dados: Readonly<Record<string, ValorDado>>;
  /** Hash do registro `numero - 1`. No gênese, 64 zeros. */
  readonly hashAnterior: string;
  /** SHA-256 do conteúdo somado a `hashAnterior` (FR-012). */
  readonly hash: string;
  readonly sucesso: boolean;
  /** Mensagem do `ErroPrograma` quando `sucesso === false`. */
  readonly motivoFalha: string | null;
}

/** Conteúdo de um registro antes de receber número, encadeamento e hash. */
export type EntradaRegistro = Omit<Registro, 'numero' | 'hashAnterior' | 'hash'>;

/** Hash do predecessor do registro de gênese. */
export const HASH_GENESE = '0'.repeat(64);

export type ResultadoVerificacao =
  | { readonly integra: true; readonly total: number }
  | {
      readonly integra: false;
      readonly total: number;
      readonly primeiroInvalido: number;
      readonly esperado: string;
      readonly obtido: string;
    };

// ---------------------------------------------------------------------------
// Constantes do programa
// ---------------------------------------------------------------------------

/** `const TOLERANCIA_PERCENTUAL: u64 = 15` (FR-010). */
export const TOLERANCIA_PERCENTUAL = 15n;

/** `const CONFIRMACOES_NECESSARIAS: u8 = 2` (FR-038). */
export const CONFIRMACOES_NECESSARIAS = 2;

/** `require!(precos.len() >= 3, Erro::FontesInsuficientes)` (FR-002). */
export const MINIMO_FONTES = 3;
