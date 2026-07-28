import type { Centavos } from '@/core/tipos';
import type { Repasse } from '@/dominio/tipos';
import { MUNICIPIO, TOTAL_ALUNOS, TOTAL_REFEICOES_DIA } from '@/mocks/municipio';

/**
 * Métricas de impacto — a tradução de dinheiro em criança alimentada (FR-024,
 * FR-025, Princípio IV).
 *
 * **Truncar uma única vez, no agregado.** Truncar por rejeição e depois somar dá
 * 94.287 em vez de 94.290 no dataset semeado. A diferença é pequena e o hábito é
 * o erro: em um sistema sobre integridade de números públicos, um agregado que
 * não fecha com suas partes é exatamente o que a banca vai apontar.
 */

/**
 * Diferença entre o proposto e o teto aceitável — **não** o valor cheio da
 * proposta rejeitada.
 *
 * Reportar os R$ 396.000,00 inteiros do caso do leite como economia seria
 * desonesto: a compra legítima ainda precisa ser feita, pelo preço justo. O que
 * o sistema preservou foi o sobrepreço.
 */
export function valorBloqueado(repasse: Repasse): Centavos {
  if (repasse.situacao !== 'Rejeitado') return 0n;
  const teto = repasse.limiteAplicado * repasse.quantidade;
  return repasse.valorTotal > teto ? repasse.valorTotal - teto : 0n;
}

export function sobreprecoPercentual(repasse: Repasse): bigint {
  if (repasse.medianaAplicada === 0n) return 0n;
  return (
    ((repasse.precoUnitarioEfetivo - repasse.medianaAplicada) * 100n) /
    repasse.medianaAplicada
  );
}

export interface Impacto {
  readonly valorProposto: Centavos;
  readonly valorAprovado: Centavos;
  readonly valorBloqueado: Centavos;
  readonly valorEmCustodia: Centavos;
  readonly valorLiberado: Centavos;
  readonly refeicoesPreservadas: bigint;
  readonly diasDeMerenda: bigint;
  readonly escolasAlcancadas: number;
  readonly alunosAlcancados: number;
  readonly totalRepasses: number;
  readonly totalBloqueados: number;
}

export function calcularImpacto(repasses: readonly Repasse[]): Impacto {
  let proposto = 0n;
  let aprovado = 0n;
  let bloqueado = 0n;
  let emCustodia = 0n;
  let liberado = 0n;
  let totalBloqueados = 0;

  const escolas = new Set<string>();

  for (const r of repasses) {
    proposto += r.valorTotal;
    escolas.add(r.escolaId);

    if (r.situacao === 'Rejeitado') {
      bloqueado += valorBloqueado(r);
      totalBloqueados++;
      continue;
    }

    aprovado += r.valorTotal;
    if (r.situacao === 'Liberado') liberado += r.valorTotal;
    else emCustodia += r.valorTotal;
  }

  // Truncamento único, sobre o total acumulado em centavos.
  const refeicoes = bloqueado / MUNICIPIO.custoRefeicaoCentavos;

  return {
    valorProposto: proposto,
    valorAprovado: aprovado,
    valorBloqueado: bloqueado,
    valorEmCustodia: emCustodia,
    valorLiberado: liberado,
    refeicoesPreservadas: refeicoes,
    diasDeMerenda: refeicoes / BigInt(TOTAL_REFEICOES_DIA),
    escolasAlcancadas: escolas.size,
    alunosAlcancados: TOTAL_ALUNOS,
    totalRepasses: repasses.length,
    totalBloqueados,
  };
}

/** Refeições equivalentes a um valor qualquer, para uso pontual na interface. */
export function refeicoesEquivalentes(centavos: Centavos): bigint {
  return centavos / MUNICIPIO.custoRefeicaoCentavos;
}
