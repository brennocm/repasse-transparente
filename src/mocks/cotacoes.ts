import type { Centavos, Endereco, Id, Instante } from '@/core/tipos';
import { ENDERECOS_FONTES } from './fontes';
import { ITENS, MEDIANA_ALVO } from './itens';

/**
 * Cotações históricas — determinísticas, sem `Date.now()` e sem aleatoriedade.
 *
 * Determinismo é requisito, não estilo: duas execuções precisam produzir a mesma
 * cadeia e os mesmos hashes, ou a verificação de integridade perde o sentido.
 */

/**
 * 2025-12-15T09:00:00-03:00. Toda data do dataset é um deslocamento fixo daqui.
 *
 * A base foi escolhida para que a última operação caia por volta de 17/07/2026 —
 * antes do Pitch Day. Um histórico que termina no futuro entrega a fabricação do
 * dataset de graça para quem olhar as datas.
 */
export const INSTANTE_BASE: Instante = 1_765_800_000_000;

export const DIA = 86_400_000;
export const HORA = 3_600_000;

/**
 * As cotações começam um dia após a base.
 *
 * O intervalo não é estético: os registros de gênese e de autorização das cinco
 * fontes ocupam os primeiros minutos, e a cadeia exige horários não-decrescentes.
 * Sem a folga, a primeira cotação cairia antes da autorização que a permitiu.
 */
export const INICIO_COTACOES: Instante = INSTANTE_BASE + DIA;

/**
 * Dispersão de cada fonte em relação à mediana da rodada, em **permilhagem**.
 *
 * A fonte do meio reporta exatamente a mediana alvo, de modo que
 * `calcularMediana` — que devolve `ordenado[5 / 2] = ordenado[2]` — retorne o
 * número publicado em `MEDIANA_ALVO`.
 *
 * Os valores foram escolhidos para reproduzir exatamente as cotações do leite
 * documentadas em `mock-data.md`: 498, 512, 520, 528, 545.
 */
export const DISPERSAO_PERMILHE: readonly bigint[] = [-43n, -16n, 0n, 16n, 49n];

/**
 * Três rodadas de atualização ao longo de três meses, em percentual da mediana
 * alvo. A última rodada é a vigente e vale 100%.
 */
export const ESCALA_RODADAS: readonly bigint[] = [92n, 96n, 100n];

export interface Cotacao {
  readonly itemId: Id;
  readonly fonte: Endereco;
  readonly preco: Centavos;
  readonly horario: Instante;
  readonly rodada: number;
}

/** Mediana de um item em uma rodada, truncando como o programa faria. */
export function medianaDaRodada(itemId: Id, rodada: number): Centavos {
  const alvo = MEDIANA_ALVO[itemId] ?? 0n;
  const escala = ESCALA_RODADAS[rodada] ?? 100n;
  return (alvo * escala) / 100n;
}

/** As cinco cotações de um item em uma rodada, na ordem das fontes. */
export function cotacoesDaRodada(itemId: Id, rodada: number): readonly Centavos[] {
  const mediana = medianaDaRodada(itemId, rodada);
  return DISPERSAO_PERMILHE.map((off) => mediana + (mediana * off) / 1000n);
}

/**
 * Todas as cotações do dataset, em ordem cronológica.
 *
 * Cada rodada ocorre 45 dias após a anterior; dentro de uma rodada, cada fonte
 * reporta com uma hora de diferença, e cada item com um deslocamento próprio —
 * o suficiente para que o explorador pareça um sistema em operação.
 */
export const COTACOES: readonly Cotacao[] = ESCALA_RODADAS.flatMap((_, rodada) =>
  ITENS.flatMap((item, iItem) => {
    const precos = cotacoesDaRodada(item.id, rodada);
    return ENDERECOS_FONTES.map((fonte, iFonte) => ({
      itemId: item.id,
      fonte,
      preco: precos[iFonte] ?? 0n,
      rodada,
      horario:
        INICIO_COTACOES + rodada * 45 * DIA + iItem * 2 * HORA + iFonte * 15 * 60_000,
    }));
  }),
);

/** Instante em que a referência de um item é recalculada, após todas as cotações. */
export function horarioRecalculo(iItem: number, rodada: number): Instante {
  return INICIO_COTACOES + rodada * 45 * DIA + iItem * 2 * HORA + 90 * 60_000;
}
