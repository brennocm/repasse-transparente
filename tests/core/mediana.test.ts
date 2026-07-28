/**
 * T009, T010 — `calcularMediana` (FR-001).
 *
 * Transliteração do cálculo de mediana do programa Anchor: clona, ordena e
 * `arr[arr.length / 2]` com divisão inteira. Os defeitos do contrato são
 * preservados e testados como comportamento esperado, não corrigidos
 * (Princípio II, FR-009).
 */

import { describe, it, expect } from 'vitest';
import { calcularMediana } from '@/core/mediana';

describe('calcularMediana — casos de referência', () => {
  it('devolve o elemento central de um conjunto ímpar já ordenado', () => {
    expect(calcularMediana([498n, 520n, 545n])).toBe(520n);
  });

  it('ordena antes de escolher', () => {
    expect(calcularMediana([545n, 498n, 520n])).toBe(520n);
  });

  it('devolve o único elemento de um conjunto unitário', () => {
    expect(calcularMediana([100n])).toBe(100n);
  });

  it('cobre as cinco cotações do leite do dataset semeado', () => {
    // [498, 512, 520, 528, 545] · arr[5/2] = arr[2] = 520
    expect(calcularMediana([528n, 498n, 545n, 512n, 520n])).toBe(520n);
  });
});

describe('calcularMediana — divergência MED-01, conjunto par', () => {
  it('devolve o central SUPERIOR, não a média dos dois centrais', () => {
    // Mediana estatística de [400,500,600,700] seria 550. O contrato usa
    // arr[4/2] = arr[2] = 600. Enviesa a referência para cima, favorecendo o
    // fornecedor. Preservado de propósito — corrigir aqui faria a demonstração
    // mentir sobre o que o programa faz.
    expect(calcularMediana([400n, 500n, 600n, 700n])).toBe(600n);
  });

  it('mantém o viés em conjunto par de duas cotações', () => {
    expect(calcularMediana([400n, 700n])).toBe(700n);
  });
});

describe('calcularMediana — resistência a manipulação', () => {
  it('ignora uma cotação absurdamente alta', () => {
    expect(calcularMediana([498n, 520n, 545n, 500000n])).toBe(545n);
  });

  it('mal se move quando uma fonte em cinco reporta valor absurdo', () => {
    const honesto = [498n, 512n, 520n, 528n, 545n];
    const comprometido = [498n, 512n, 520n, 528n, 5000n];

    expect(calcularMediana([...honesto])).toBe(520n);
    expect(calcularMediana([...comprometido])).toBe(520n);

    // A média aritmética, no mesmo conjunto, saltaria de 520 para 1411.
    const media = (a: bigint[]) => a.reduce((s, v) => s + v, 0n) / BigInt(a.length);
    expect(media(honesto)).toBe(520n);
    expect(media(comprometido)).toBe(1411n);
  });

  it('ignora uma cotação zero de fonte comprometida', () => {
    // MED-06: o contrato aceita reporte de zero. A mediana absorve o ataque
    // enquanto a maioria das fontes for honesta.
    expect(calcularMediana([0n, 498n, 520n, 528n, 545n])).toBe(520n);
  });
});

describe('calcularMediana — pureza', () => {
  it('não muta o vetor recebido: o programa clona antes de ordenar', () => {
    // `let mut ordenado = precos.clone(); ordenado.sort();`
    // A versão Solidity anterior ordenava no lugar, sobre o `memory`. A migração
    // para Anchor mudou isso, e o núcleo acompanha.
    const entrada = [545n, 498n, 520n];
    calcularMediana(entrada);
    expect(entrada).toEqual([545n, 498n, 520n]);
  });

  it('ordena numericamente, não lexicograficamente', () => {
    // O `sort` padrão do JavaScript compara como texto e devolveria 20n aqui.
    expect(calcularMediana([100n, 20n, 3n])).toBe(20n);
    expect(calcularMediana([1000n, 999n, 99n])).toBe(999n);
  });
});
