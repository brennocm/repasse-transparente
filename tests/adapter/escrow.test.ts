/**
 * T054 — custódia, quórum e máquina de estados (FR-037 a FR-040, FR-058).
 *
 * A unicidade de confirmador vive nesta camada porque o programa não a garante
 * (CRIT-02). Estes testes travam a correção **e** documentam o seu limite: ela
 * protege quem passa pela aplicação, e ninguém mais.
 */

import { describe, it, expect } from 'vitest';
import {
  diasAteVencimento,
  entregaVencida,
  pendenciasDaEscola,
  podeConfirmar,
  progressoQuorum,
  repassesEmCustodia,
  resumirCustodia,
  transicaoPermitida,
} from '@/adapter/escrow';
import type { Entrega, SituacaoRepasse } from '@/dominio/tipos';
import { semear } from '@/mocks/seed';
import { INSTANTE_ATUAL } from '@/mocks/repasses';

const DIA = 86_400_000;
const AGORA = 1_000 * DIA;

function entrega(sobrescreve: Partial<Entrega> = {}): Entrega {
  return {
    repasseId: 'rep-0001',
    escolaId: 'esc-01',
    situacao: 'pendente',
    prazoLimite: AGORA + 5 * DIA,
    confirmadoPor: [],
    confirmadoEm: null,
    descricaoDivergencia: null,
    ...sobrescreve,
  };
}

// ---------------------------------------------------------------------------
// Unicidade de confirmador
// ---------------------------------------------------------------------------

describe('podeConfirmar', () => {
  it('permite a primeira confirmação', () => {
    expect(podeConfirmar(entrega(), '0xaa').pode).toBe(true);
  });

  it('permite a segunda, vinda de outra parte', () => {
    expect(podeConfirmar(entrega({ confirmadoPor: ['0xaa'] }), '0xbb').pode).toBe(true);
  });

  it('RECUSA a segunda confirmação da mesma parte', () => {
    // É a correção de CRIT-02. Sem ela, uma carteira atinge o quórum sozinha e a
    // proteção contra entrega fictícia vira ficção.
    const v = podeConfirmar(entrega({ confirmadoPor: ['0xaa'] }), '0xaa');
    expect(v.pode).toBe(false);
    expect(v.motivo).toContain('partes independentes');
  });

  it('recusa confirmação em entrega já confirmada', () => {
    const v = podeConfirmar(entrega({ situacao: 'confirmada' }), '0xbb');
    expect(v.pode).toBe(false);
    expect(v.motivo).toContain('quórum');
  });

  it('recusa confirmação enquanto há divergência aberta', () => {
    const v = podeConfirmar(entrega({ situacao: 'divergente' }), '0xbb');
    expect(v.pode).toBe(false);
    expect(v.motivo).toContain('divergência');
  });
});

// ---------------------------------------------------------------------------
// Máquina de estados
// ---------------------------------------------------------------------------

describe('transições de SituacaoRepasse', () => {
  const permitidas: ReadonlyArray<readonly [SituacaoRepasse, SituacaoRepasse]> = [
    ['Proposto', 'Rejeitado'],
    ['Proposto', 'Retido'],
    ['Retido', 'Liberado'],
    ['Retido', 'Divergente'],
    ['Divergente', 'Liberado'],
    ['Divergente', 'Rejeitado'],
  ];

  const proibidas: ReadonlyArray<readonly [SituacaoRepasse, SituacaoRepasse]> = [
    ['Rejeitado', 'Retido'],
    ['Rejeitado', 'Liberado'],
    ['Liberado', 'Retido'],
    ['Liberado', 'Divergente'],
    ['Retido', 'Proposto'],
    ['Proposto', 'Liberado'],
  ];

  it.each(permitidas)('permite %s → %s', (de, para) => {
    expect(transicaoPermitida(de, para)).toBe(true);
  });

  it.each(proibidas)('proíbe %s → %s', (de, para) => {
    expect(transicaoPermitida(de, para)).toBe(false);
  });

  it('mantém Rejeitado e Liberado terminais', () => {
    const situacoes: SituacaoRepasse[] = [
      'Proposto',
      'Rejeitado',
      'Retido',
      'Liberado',
      'Divergente',
    ];
    for (const s of situacoes) {
      expect(transicaoPermitida('Rejeitado', s)).toBe(false);
      expect(transicaoPermitida('Liberado', s)).toBe(false);
    }
  });

  it('NÃO oferece caminho de devolução a partir de Retido — CRIT-03', () => {
    // O programa não tem instrução capaz de mover o BRZ da custódia de volta à
    // prefeitura. Modelar uma devolução aqui seria inventar uma saída que não
    // existe, e a interface passaria a mentir sobre o risco.
    expect(transicaoPermitida('Retido', 'Proposto')).toBe(false);
    expect(transicaoPermitida('Retido', 'Rejeitado')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Prazos
// ---------------------------------------------------------------------------

describe('prazos de entrega', () => {
  it('considera vencida a pendência com prazo no passado', () => {
    expect(entregaVencida(entrega({ prazoLimite: AGORA - DIA }), AGORA)).toBe(true);
  });

  it('não considera vencida a pendência dentro do prazo', () => {
    expect(entregaVencida(entrega({ prazoLimite: AGORA + DIA }), AGORA)).toBe(false);
  });

  it('não considera vencida uma entrega já confirmada', () => {
    const e = entrega({ situacao: 'confirmada', prazoLimite: AGORA - 30 * DIA });
    expect(entregaVencida(e, AGORA)).toBe(false);
  });

  it('conta os dias restantes', () => {
    expect(diasAteVencimento(entrega({ prazoLimite: AGORA + 5 * DIA }), AGORA)).toBe(5);
    expect(diasAteVencimento(entrega({ prazoLimite: AGORA - 3 * DIA }), AGORA)).toBe(-3);
  });

  it('ordena as pendências da escola com as vencidas primeiro', () => {
    const entregas = [
      entrega({ repasseId: 'a', prazoLimite: AGORA + 5 * DIA }),
      entrega({ repasseId: 'b', prazoLimite: AGORA - 2 * DIA }),
      entrega({ repasseId: 'c', prazoLimite: AGORA + 1 * DIA }),
    ];

    expect(pendenciasDaEscola(entregas, 'esc-01', AGORA).map((e) => e.repasseId)).toEqual(
      ['b', 'c', 'a'],
    );
  });
});

// ---------------------------------------------------------------------------
// Quórum
// ---------------------------------------------------------------------------

describe('progresso do quórum', () => {
  it('reporta zero de dois no início', () => {
    expect(progressoQuorum(entrega(), 2)).toEqual({ feitas: 0, faltam: 2, quorum: 2 });
  });

  it('reporta um de dois após a primeira confirmação', () => {
    expect(progressoQuorum(entrega({ confirmadoPor: ['0xaa'] }), 2)).toEqual({
      feitas: 1,
      faltam: 1,
      quorum: 2,
    });
  });

  it('não passa do quórum mesmo com confirmações extras', () => {
    const e = entrega({ confirmadoPor: ['0xaa', '0xbb', '0xcc'] });
    expect(progressoQuorum(e, 2)).toEqual({ feitas: 2, faltam: 0, quorum: 2 });
  });
});

// ---------------------------------------------------------------------------
// Sobre o dataset semeado
// ---------------------------------------------------------------------------

describe('custódia no dataset semeado', () => {
  const { repasses, entregas } = semear();

  it('resume três pendências no prazo e três vencidas', () => {
    const r = resumirCustodia(entregas, INSTANTE_ATUAL);
    expect(r.retidoNoPrazo).toBe(3);
    expect(r.retidoVencido).toBe(3);
    expect(r.divergente).toBe(1);
    expect(r.confirmado).toBe(28);
  });

  it('conta sete repasses com valor imobilizado em custódia', () => {
    expect(repassesEmCustodia(repasses)).toHaveLength(7);
  });

  it('deixa as entregas confirmadas com dois confirmadores distintos', () => {
    for (const e of entregas.filter((x) => x.situacao === 'confirmada')) {
      expect(new Set(e.confirmadoPor).size).toBe(2);
    }
  });
});
