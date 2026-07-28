/**
 * T022 a T026 — registro encadeado (FR-011 a FR-016).
 *
 * A cadeia é o que torna verificável a alegação de que alterações retroativas são
 * detectáveis. Se estes testes forem frouxos, a demonstração de integridade vira
 * teatro — e a pergunta "por que não um banco SQL?" fica sem resposta.
 */

import { describe, it, expect } from 'vitest';
import {
  anexar,
  serializarDados,
  calcularHash,
  verificarIntegridade,
  adulterarParaDemonstracao,
} from '@/core/registro';
import { HASH_GENESE, type EntradaRegistro, type Registro } from '@/core/tipos';
import { PREFEITURA, FONTE_A, INSTANTE_BASE, em } from '../ajuda';

const MINUTO = 60_000;

function entrada(sobrescreve: Partial<EntradaRegistro> = {}): EntradaRegistro {
  return {
    horario: INSTANTE_BASE,
    tipo: 'PrecoReportado',
    autor: FONTE_A,
    dados: { itemId: 'leite-uht', preco: 498n },
    sucesso: true,
    motivoFalha: null,
    ...sobrescreve,
  };
}

/** Cadeia de quatro registros, plausível e determinística. */
function cadeiaDeTeste(): Registro[] {
  let c: Registro[] = [];
  c = anexar(c, entrada({ tipo: 'Genese', autor: PREFEITURA, dados: { tolerancia: 15n } }));
  c = anexar(c, entrada({ horario: INSTANTE_BASE + MINUTO }));
  c = anexar(
    c,
    entrada({
      horario: INSTANTE_BASE + 2 * MINUTO,
      tipo: 'MedianaAtualizada',
      dados: { itemId: 'leite-uht', novaMediana: 520n },
    }),
  );
  c = anexar(
    c,
    entrada({
      horario: INSTANTE_BASE + 3 * MINUTO,
      tipo: 'RepasseRejeitado',
      autor: PREFEITURA,
      dados: { itemId: 'leite-uht', valorProposto: 39_600_000n },
      sucesso: false,
      motivoFalha: 'Erro::AcimaDoLimite',
    }),
  );
  return c;
}

// ---------------------------------------------------------------------------
// T022 — anexar (FR-011, FR-012, FR-016)
// ---------------------------------------------------------------------------

describe('anexar', () => {
  it('dá ao registro de gênese o predecessor de 64 zeros', () => {
    const cadeia = anexar([], entrada({ tipo: 'Genese', autor: PREFEITURA }));
    const genese = em(cadeia, 0);

    expect(genese.numero).toBe(0);
    expect(genese.hashAnterior).toBe(HASH_GENESE);
    expect(genese.hashAnterior).toBe('0'.repeat(64));
    expect(genese.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('numera em sequência, sem lacuna', () => {
    const cadeia = cadeiaDeTeste();
    expect(cadeia.map((r) => r.numero)).toEqual([0, 1, 2, 3]);
  });

  it('encadeia cada registro ao hash do anterior', () => {
    const cadeia = cadeiaDeTeste();
    for (let i = 1; i < cadeia.length; i++) {
      expect(em(cadeia, i).hashAnterior).toBe(em(cadeia, i - 1).hash);
    }
  });

  it('não muta a cadeia recebida — somente-anexação estrutural', () => {
    const original = cadeiaDeTeste();
    const antes = original.length;
    const nova = anexar(original, entrada({ horario: INSTANTE_BASE + 9 * MINUTO }));

    expect(original.length).toBe(antes);
    expect(nova.length).toBe(antes + 1);
    // Registros anteriores preservados por identidade referencial.
    for (let i = 0; i < antes; i++) {
      expect(em(nova, i)).toBe(em(original, i));
    }
  });

  it('produz hashes distintos para registros de conteúdo distinto', () => {
    const cadeia = cadeiaDeTeste();
    const hashes = new Set(cadeia.map((r) => r.hash));
    expect(hashes.size).toBe(cadeia.length);
  });
});

// ---------------------------------------------------------------------------
// T023 — serialização determinística (FR-012)
// ---------------------------------------------------------------------------

describe('serializarDados', () => {
  it('ordena as chaves, tornando a ordem de escrita irrelevante', () => {
    const a = serializarDados({ zebra: 1n, alfa: 'x', meio: true });
    const b = serializarDados({ meio: true, alfa: 'x', zebra: 1n });
    expect(a).toBe(b);
  });

  it('leva bigint a string decimal, sem notação científica nem perda', () => {
    const s = serializarDados({ valor: 39_600_000n });
    expect(s).toContain('39600000');
    expect(s).not.toContain('e+');
  });

  it('preserva a precisão de inteiros além do limite seguro de number', () => {
    const grande = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
    expect(serializarDados({ v: grande })).toContain('9007199254740993');
  });

  it('distingue null de ausência', () => {
    expect(serializarDados({ motivo: null })).not.toBe(serializarDados({}));
  });

  it('distingue o número 1 da string "1"', () => {
    // Sem essa distinção, dois eventos diferentes colidiriam no mesmo hash.
    expect(serializarDados({ v: 1 })).not.toBe(serializarDados({ v: '1' }));
  });

  it('leva o mesmo conteúdo ao mesmo hash em execuções distintas', () => {
    const dados = { itemId: 'leite-uht', preco: 498n, ativo: true };
    const r1 = anexar([], entrada({ dados }));
    const r2 = anexar([], entrada({ dados: { ativo: true, preco: 498n, itemId: 'leite-uht' } }));
    expect(em(r1, 0).hash).toBe(em(r2, 0).hash);
  });
});

// ---------------------------------------------------------------------------
// calcularHash — cobertura de cada campo (FR-012)
// ---------------------------------------------------------------------------

describe('calcularHash', () => {
  it('cobre todos os campos: alterar qualquer um muda o hash', () => {
    const cadeia = cadeiaDeTeste();
    const base = em(cadeia, 1);
    const { hash: _hash, ...semHash } = base;

    expect(calcularHash(semHash)).toBe(base.hash);

    const variacoes: ReadonlyArray<Partial<Registro>> = [
      { numero: 99 },
      { horario: INSTANTE_BASE + 1 },
      { tipo: 'MedianaAtualizada' },
      { autor: PREFEITURA },
      { dados: { itemId: 'leite-uht', preco: 499n } },
      { sucesso: false },
      { motivoFalha: 'outro' },
      { hashAnterior: HASH_GENESE },
    ];

    for (const v of variacoes) {
      expect(calcularHash({ ...semHash, ...v })).not.toBe(base.hash);
    }
  });

  it('inclui `sucesso` no hash — rejeição não pode virar aprovação sem detecção', () => {
    const cadeia = cadeiaDeTeste();
    const rejeitado = em(cadeia, 3);
    const { hash: _h, ...semHash } = rejeitado;

    expect(calcularHash({ ...semHash, sucesso: true, motivoFalha: null })).not.toBe(
      rejeitado.hash,
    );
  });
});

// ---------------------------------------------------------------------------
// T024 — verificarIntegridade (FR-014)
// ---------------------------------------------------------------------------

describe('verificarIntegridade', () => {
  it('considera íntegra a cadeia vazia, por vacuidade', () => {
    expect(verificarIntegridade([])).toEqual({ integra: true, total: 0 });
  });

  it('considera íntegra uma cadeia recém-construída', () => {
    const cadeia = cadeiaDeTeste();
    expect(verificarIntegridade(cadeia)).toEqual({ integra: true, total: 4 });
  });

  it('acusa encadeamento rompido', () => {
    const cadeia = cadeiaDeTeste();
    const quebrada = [...cadeia];
    quebrada[2] = { ...em(cadeia, 2), hashAnterior: HASH_GENESE };

    const r = verificarIntegridade(quebrada);
    expect(r.integra).toBe(false);
    if (!r.integra) expect(r.primeiroInvalido).toBe(2);
  });

  it('acusa numeração fora de sequência', () => {
    const cadeia = cadeiaDeTeste();
    const quebrada = [...cadeia];
    quebrada[1] = { ...em(cadeia, 1), numero: 7 };

    expect(verificarIntegridade(quebrada).integra).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T025 — adulteração para demonstração (FR-015)
// ---------------------------------------------------------------------------

describe('adulterarParaDemonstracao', () => {
  it('aponta exatamente o registro alterado como primeiro inválido', () => {
    const cadeia = cadeiaDeTeste();
    const adulterada = adulterarParaDemonstracao(cadeia, 2, {
      itemId: 'leite-uht',
      novaMediana: 9_900n,
    });

    const r = verificarIntegridade(adulterada);
    expect(r.integra).toBe(false);
    if (!r.integra) {
      expect(r.primeiroInvalido).toBe(2);
      expect(r.esperado).not.toBe(r.obtido);
      expect(r.total).toBe(4);
    }
  });

  it('altera os dados sem recalcular o hash — é o que uma alteração maliciosa faria', () => {
    const cadeia = cadeiaDeTeste();
    const adulterada = adulterarParaDemonstracao(cadeia, 2, { novaMediana: 9_900n });

    expect(em(adulterada, 2).dados['novaMediana']).toBe(9_900n);
    expect(em(adulterada, 2).hash).toBe(em(cadeia, 2).hash);
  });

  it('detecta a adulteração do registro de gênese', () => {
    const cadeia = cadeiaDeTeste();
    const adulterada = adulterarParaDemonstracao(cadeia, 0, { tolerancia: 999n });

    const r = verificarIntegridade(adulterada);
    expect(r.integra).toBe(false);
    if (!r.integra) expect(r.primeiroInvalido).toBe(0);
  });

  it('não muta a cadeia original — a restauração é sempre possível', () => {
    const cadeia = cadeiaDeTeste();
    adulterarParaDemonstracao(cadeia, 2, { novaMediana: 9_900n });
    expect(verificarIntegridade(cadeia).integra).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T026 — operações revertidas também entram na cadeia (FR-013)
// ---------------------------------------------------------------------------

describe('registro de operação revertida', () => {
  it('grava a rejeição com sucesso falso e o motivo textual', () => {
    const cadeia = cadeiaDeTeste();
    const rejeitado = em(cadeia, 3);

    expect(rejeitado.tipo).toBe('RepasseRejeitado');
    expect(rejeitado.sucesso).toBe(false);
    expect(rejeitado.motivoFalha).toBe('Erro::AcimaDoLimite');
  });

  it('mantém a rejeição na cadeia e íntegra, como qualquer outro registro', () => {
    // A tentativa bloqueada é o produto. Ela não desaparece do histórico.
    const cadeia = cadeiaDeTeste();
    expect(verificarIntegridade(cadeia).integra).toBe(true);
    expect(cadeia.filter((r) => !r.sucesso)).toHaveLength(1);
  });

  it('encadeia normalmente registros posteriores a uma rejeição', () => {
    const cadeia = anexar(
      cadeiaDeTeste(),
      entrada({ horario: INSTANTE_BASE + 4 * MINUTO, tipo: 'RepasseAprovado' }),
    );

    expect(em(cadeia, 4).hashAnterior).toBe(em(cadeia, 3).hash);
    expect(verificarIntegridade(cadeia).integra).toBe(true);
  });
});
