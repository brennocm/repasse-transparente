/**
 * Erros do núcleo — equivalem às variantes de `Erro` do programa Anchor e ao
 * `require!` que as dispara.
 *
 * A interface exibe o nome da variante ao lado da explicação em português claro.
 * Ver o identificador original é o que convence a banca técnica de que a
 * simulação é o programa, e não uma reimplementação livre (FR-032).
 */

export type CodigoErro =
  | 'FonteNaoAutorizada'
  | 'FontesInsuficientes'
  | 'SemReferencia'
  | 'QuantidadeInvalida'
  | 'AcimaDoLimite'
  | 'JaLiberado'
  | 'SaldoInsuficiente';

/** Origem de cada erro no programa `repasse_transparente`. */
export const ORIGEM_NO_PROGRAMA: Readonly<Record<CodigoErro, string>> = {
  FonteNaoAutorizada: 'require!(ctx.accounts.registro_fonte.autorizada, ...) em reportar_preco',
  FontesInsuficientes: 'require!(precos.len() >= 3, ...) em atualizar_preco_referencia',
  SemReferencia: 'require!(referencia > 0, ...) em propor_repasse',
  QuantidadeInvalida: 'checked_div(quantidade).ok_or(...) em propor_repasse',
  AcimaDoLimite: 'require!(preco_unitario <= limite, ...) em propor_repasse',
  JaLiberado: 'require!(!repasse.liberado, ...) em confirmar_entrega',
  /**
   * Não é uma variante de `Erro` do programa: representa a falha do CPI
   * `token::transfer` quando a conta de origem não tem BRZ suficiente. O erro
   * viria do SPL Token Program, não do `repasse_transparente`.
   */
  SaldoInsuficiente: 'falha do CPI token::transfer — saldo de BRZ insuficiente',
};

/** Explicação em português claro, para o público não-técnico (Princípio IV). */
export const EXPLICACAO_SIMPLES: Readonly<Record<CodigoErro, string>> = {
  FonteNaoAutorizada:
    'Somente entidades previamente autorizadas podem reportar preços de mercado.',
  FontesInsuficientes:
    'O preço de referência exige pelo menos três cotações independentes. Com menos que isso, uma fonte isolada teria poder de definir o preço sozinha.',
  SemReferencia:
    'Este item ainda não tem preço de referência. Sem parâmetro de comparação, nenhuma compra pode ser avaliada.',
  QuantidadeInvalida:
    'A quantidade informada é zero, o que torna impossível calcular o preço por unidade.',
  AcimaDoLimite:
    'O preço proposto ultrapassa a mediana de mercado além da tolerância permitida. O repasse foi bloqueado e nenhum valor saiu da conta da prefeitura.',
  JaLiberado:
    'Este repasse já teve o valor liberado ao fornecedor. Não há o que confirmar novamente.',
  SaldoInsuficiente:
    'A conta da prefeitura não tem BRZ suficiente para custodiar este repasse.',
};

/**
 * Equivalente a uma instrução revertida. Carrega o nome da variante do programa
 * em `message`.
 */
export class ErroPrograma extends Error {
  readonly codigo: CodigoErro;

  constructor(codigo: CodigoErro) {
    super(`Erro::${codigo}`);
    this.name = 'ErroPrograma';
    this.codigo = codigo;
    Object.setPrototypeOf(this, ErroPrograma.prototype);
  }

  /** Explicação em linguagem acessível, para exibir junto do nome da variante. */
  get explicacao(): string {
    return EXPLICACAO_SIMPLES[this.codigo];
  }

  /** Onde, no programa Anchor, este erro é disparado. */
  get origem(): string {
    return ORIGEM_NO_PROGRAMA[this.codigo];
  }
}

export function ehErroPrograma(erro: unknown): erro is ErroPrograma {
  return erro instanceof ErroPrograma;
}
