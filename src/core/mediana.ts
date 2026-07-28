import type { Centavos } from './tipos';

/**
 * Transliteração de `atualizar_preco_referencia`, parte do cálculo:
 *
 * ```rust
 * let mut ordenado = precos.clone();
 * ordenado.sort();
 * let mediana = ordenado[ordenado.len() / 2];
 * ```
 */

/**
 * Ordena uma cópia e devolve `ordenado[len / 2]` com divisão inteira.
 *
 * **Não muta o parâmetro** — o programa clona antes de ordenar (`precos.clone()`).
 * A versão Solidity anterior ordenava no lugar; a migração mudou isso.
 *
 * Divergência MED-01 preservada: em conjunto par devolve o elemento central
 * **superior**, não a média dos dois centrais. Para `[400, 500, 600, 700]`
 * devolve `600`, enquanto a mediana estatística é `550`. Enviesa a referência
 * para cima, favorecendo o fornecedor.
 */
export function calcularMediana(precos: readonly Centavos[]): Centavos {
  const ordenado = [...precos].sort(comparar);
  const escolhido = ordenado[Math.floor(ordenado.length / 2)];

  if (escolhido === undefined) {
    // Vetor vazio. Em Rust seria pânico por índice fora dos limites. O guardião
    // é o `require!(precos.len() >= 3)` de `atualizar_preco_referencia`, que
    // nunca deixa chegar aqui em fluxo normal.
    throw new RangeError('calcularMediana recebeu um vetor vazio');
  }

  return escolhido;
}

/**
 * `bigint` precisa de comparador explícito: o `sort` padrão converte para string
 * e ordenaria `[100n, 20n]` como `[100n, 20n]`.
 */
function comparar(a: Centavos, b: Centavos): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
