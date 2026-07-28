import type { Centavos, Id, Instante } from '@/core/tipos';
import { TOLERANCIA_PERCENTUAL } from '@/core/tipos';
import { calcularLimite } from '@/core/contrato';
import { MEDIANA_ALVO } from './itens';
import { ESCOLAS } from './municipio';
import { FORNECEDORES } from './fornecedores';
import { DIA, INSTANTE_BASE } from './cotacoes';

/**
 * Quarenta repasses — cinco bloqueados pela trava, trinta e cinco aprovados.
 *
 * Construídos deterministicamente. Nenhuma aleatoriedade, nenhum `Date.now()`.
 */

export type Desfecho =
  | 'liberado'
  | 'retido'
  | 'retido-vencido'
  | 'divergente'
  | 'rejeitado';

export interface PlanoRepasse {
  readonly id: Id;
  readonly itemId: Id;
  readonly fornecedorId: Id;
  readonly escolaId: Id;
  readonly quantidade: bigint;
  readonly valorTotal: Centavos;
  readonly desfecho: Desfecho;
  readonly criadoEm: Instante;
}

/** Primeiro repasse cinco dias após a última rodada de cotações. */
const INICIO_REPASSES = INSTANTE_BASE + 95 * DIA;

// ---------------------------------------------------------------------------
// As cinco rejeições — os números que sustentam a landing
// ---------------------------------------------------------------------------

/**
 * Valores exatos de `mock-data.md`. Estes **não** são gerados: são a
 * demonstração, e qualquer desvio quebraria os números publicados.
 */
const REJEICOES: readonly Omit<PlanoRepasse, 'criadoEm' | 'desfecho'>[] = [
  {
    id: 'rep-0006',
    itemId: 'leite-uht',
    fornecedorId: 'for-01',
    escolaId: 'esc-01',
    quantidade: 40_000n,
    valorTotal: 39_600_000n, // R$ 9,90/L contra limite de R$ 5,98 — +90%
  },
  {
    id: 'rep-0014',
    itemId: 'feijao-carioca',
    fornecedorId: 'for-02',
    escolaId: 'esc-03',
    quantidade: 8_000n,
    valorTotal: 9_600_000n, // R$ 12,00/kg contra limite de R$ 10,23 — +34%
  },
  {
    id: 'rep-0021',
    itemId: 'oleo-soja',
    fornecedorId: 'for-01',
    escolaId: 'esc-02',
    quantidade: 6_000n,
    valorTotal: 6_600_000n, // R$ 11,00/un contra limite de R$ 9,08 — +39%
  },
  {
    id: 'rep-0029',
    itemId: 'tomate',
    fornecedorId: 'for-04',
    escolaId: 'esc-11',
    quantidade: 3_000n,
    valorTotal: 3_300_000n, // R$ 11,00/kg contra limite de R$ 8,39 — +50%
  },
  {
    id: 'rep-0036',
    itemId: 'frango-file',
    fornecedorId: 'for-03',
    escolaId: 'esc-04',
    quantidade: 5_000n,
    valorTotal: 7_900_000n, // R$ 15,80/kg contra limite de R$ 14,26 — +27%
  },
];

// ---------------------------------------------------------------------------
// Os trinta e cinco aprovados
// ---------------------------------------------------------------------------

const ITENS_CICLO: readonly Id[] = [
  'arroz-tipo-1',
  'leite-uht',
  'banana-prata',
  'farinha-trigo',
  'ovos',
  'cenoura',
  'feijao-carioca',
  'frango-file',
  'tomate',
  'oleo-soja',
];

/** Quantidade por posição do ciclo. Compras plausíveis para uma rede de 12 escolas. */
const QUANTIDADES: readonly bigint[] = [
  2_500n, 8_000n, 1_800n, 1_200n, 900n, 1_400n, 2_000n, 1_500n, 1_100n, 3_000n,
];

/**
 * Preço unitário como percentual do limite. Todos abaixo de 100, logo todos
 * passam pela trava. A variação evita que o dataset pareça sintético demais.
 */
const FATOR_DO_LIMITE: readonly bigint[] = [82n, 91n, 76n, 95n, 88n, 71n, 99n, 85n];

/**
 * Desfecho de cada aprovado, na ordem de criação:
 * 28 liberados, 3 retidos no prazo, 3 retidos vencidos, 1 divergente.
 *
 * Os retidos vencidos são posicionados **no começo** da série, para que o prazo
 * já tenha expirado em relação ao repasse mais recente — é o que torna a
 * pendência vencida visível sem depender do relógio real.
 */
function desfechoAprovado(indice: number): Desfecho {
  if (indice < 3) return 'retido-vencido';
  if (indice === 31) return 'divergente';
  if (indice >= 32) return 'retido';
  return 'liberado';
}

function planoAprovado(indice: number): Omit<PlanoRepasse, 'criadoEm' | 'desfecho'> {
  const itemId = ITENS_CICLO[indice % ITENS_CICLO.length] ?? 'arroz-tipo-1';
  const mediana = MEDIANA_ALVO[itemId] ?? 0n;
  const limite = calcularLimite(mediana, TOLERANCIA_PERCENTUAL);

  const fator = FATOR_DO_LIMITE[indice % FATOR_DO_LIMITE.length] ?? 90n;
  const precoUnitario = (limite * fator) / 100n;
  const quantidade = QUANTIDADES[indice % QUANTIDADES.length] ?? 1_000n;

  const fornecedor = FORNECEDORES[indice % FORNECEDORES.length];
  const escola = ESCOLAS[indice % ESCOLAS.length];

  return {
    id: `rep-${String(indice + 1).padStart(4, '0')}`,
    itemId,
    fornecedorId: fornecedor?.id ?? 'for-01',
    escolaId: escola?.id ?? 'esc-01',
    quantidade,
    // Múltiplo exato da quantidade: o preço unitário efetivo é o pretendido,
    // sem truncamento acidental mascarando a intenção do dado.
    valorTotal: precoUnitario * quantidade,
  };
}

// ---------------------------------------------------------------------------
// Montagem cronológica
// ---------------------------------------------------------------------------

/**
 * Os 40 repasses em ordem cronológica, um a cada três dias.
 *
 * As rejeições ocupam posições fixas na série para ficarem espalhadas pelo
 * histórico, e não agrupadas no fim.
 */
export const PLANO_REPASSES: readonly PlanoRepasse[] = (() => {
  const posicoesRejeicao = new Map(
    REJEICOES.map((r) => [Number(r.id.slice(4)) - 1, r] as const),
  );

  const planos: PlanoRepasse[] = [];
  let indiceAprovado = 0;

  for (let i = 0; i < 40; i++) {
    const criadoEm = INICIO_REPASSES + i * 3 * DIA;
    const rejeicao = posicoesRejeicao.get(i);

    if (rejeicao !== undefined) {
      planos.push({ ...rejeicao, desfecho: 'rejeitado', criadoEm });
      continue;
    }

    const base = planoAprovado(indiceAprovado);
    planos.push({
      ...base,
      id: `rep-${String(i + 1).padStart(4, '0')}`,
      desfecho: desfechoAprovado(indiceAprovado),
      criadoEm,
    });
    indiceAprovado++;
  }

  return planos;
})();

/** Prazo de confirmação de entrega: 15 dias após a proposta (FR-044). */
export const PRAZO_ENTREGA_DIAS = 15;

/**
 * Referência de "agora" na demonstração. Cinco dias após o último repasse.
 *
 * A posição importa: precisa ser tarde o bastante para que as três pendências do
 * início da série estejam vencidas, e cedo o bastante para que as três do fim
 * ainda estejam dentro do prazo de 15 dias. Sem isso, ou nada vence ou tudo
 * vence, e a distinção que o painel do conselho precisa mostrar desaparece.
 */
export const INSTANTE_ATUAL = INICIO_REPASSES + (40 * 3 + 5) * DIA;
