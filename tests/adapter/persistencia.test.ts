/**
 * T047 — persistência local (FR-007, FR-048, FR-049).
 *
 * O par replacer/reviver é o ponto de maior risco desta camada: uma falha aqui
 * corrompe valores monetários **em silêncio**, sem lançar erro. Um repasse de
 * R$ 396.000,00 voltaria como outra coisa e ninguém notaria.
 */

import { describe, it, expect } from 'vitest';
import {
  CHAVE,
  carregar,
  desserializar,
  limpar,
  salvar,
  serializar,
  type Armazenamento,
} from '@/adapter/persistencia';
import { VERSAO_ESTADO, estadoInicial } from '@/adapter/estado';
import { verificarIntegridade } from '@/core/registro';
import { CONTA_CUSTODIA } from '@/core/tipos';
import { saldoBrz } from '@/core/contrato';

function memoria(inicial: Record<string, string> = {}): Armazenamento {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (c) => dados.get(c) ?? null,
    setItem: (c, v) => void dados.set(c, v),
    removeItem: (c) => void dados.delete(c),
  };
}

describe('serialização de bigint', () => {
  it('preserva o valor exato na ida e volta', () => {
    const original = { valor: 39_600_000n };
    const volta = JSON.parse(serializar(original as never), (_k, v) =>
      typeof v === 'object' && v !== null && '__bigint' in v ? BigInt(v.__bigint) : v,
    ) as { valor: bigint };

    expect(volta.valor).toBe(39_600_000n);
    expect(typeof volta.valor).toBe('bigint');
  });

  it('preserva inteiros além do limite seguro de number', () => {
    const grande = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
    const texto = serializar({ v: grande } as never);
    expect(desserializar(texto)).toEqual({ v: grande });
  });

  it('não converte bigint para number em nenhum ponto', () => {
    const texto = serializar({ v: 520n } as never);
    // Se virasse number, apareceria como `"v":520` em vez do envelope.
    expect(texto).toContain('__bigint');
    expect(texto).not.toMatch(/"v":520(?!")/);
  });
});

describe('serialização de Map', () => {
  it('preserva chaves, valores e ordem', () => {
    const m = new Map([
      ['a', 1n],
      ['b', 2n],
    ]);
    const volta = desserializar(serializar({ m } as never)) as unknown as {
      m: Map<string, bigint>;
    };

    expect(volta.m).toBeInstanceOf(Map);
    expect(volta.m.get('a')).toBe(1n);
    expect(volta.m.get('b')).toBe(2n);
    expect([...volta.m.keys()]).toEqual(['a', 'b']);
  });

  it('preserva Map aninhado em Map — cotacoesOraculo é assim', () => {
    const aninhado = new Map([['leite-uht', new Map([['0xa1', 498n]])]]);
    const volta = desserializar(serializar({ aninhado } as never)) as unknown as {
      aninhado: Map<string, Map<string, bigint>>;
    };

    expect(volta.aninhado.get('leite-uht')?.get('0xa1')).toBe(498n);
  });
});

describe('ida e volta do estado completo', () => {
  const app = estadoInicial();
  const volta = desserializar(serializar(app));

  it('preserva a cadeia hash a hash', () => {
    expect(volta.cadeia.map((r) => r.hash)).toEqual(app.cadeia.map((r) => r.hash));
  });

  it('mantém a cadeia íntegra depois de persistida', () => {
    // Se a serialização alterasse qualquer campo que entra no hash, a
    // verificação passaria a falhar — este é o teste que pega isso.
    expect(verificarIntegridade(volta.cadeia).integra).toBe(true);
  });

  it('preserva os saldos de BRZ', () => {
    expect(saldoBrz(volta.programa, volta.programa.prefeitura)).toBe(
      saldoBrz(app.programa, app.programa.prefeitura),
    );
    expect(saldoBrz(volta.programa, CONTA_CUSTODIA)).toBe(
      saldoBrz(app.programa, CONTA_CUSTODIA),
    );
  });

  it('preserva a tabela de preços como Map de bigint', () => {
    expect(volta.programa.tabelaPrecos.get('leite-uht')?.precoMediana).toBe(520n);
  });

  it('preserva os 40 repasses com seus valores', () => {
    expect(volta.repasses).toHaveLength(40);
    const leite = volta.repasses.find((r) => r.situacao === 'Rejeitado');
    expect(leite?.valorTotal).toBe(39_600_000n);
  });
});

describe('carregamento', () => {
  it('semeia quando não há nada salvo', () => {
    const r = carregar(memoria());
    expect(r.origem).toBe('semeadura');
    expect(r.aviso).toBeNull();
  });

  it('semeia quando não há armazenamento — renderização no servidor', () => {
    expect(carregar(null).origem).toBe('semeadura');
  });

  it('devolve o estado salvo quando a versão confere', () => {
    const arm = memoria();
    salvar(arm, estadoInicial());
    const r = carregar(arm);

    expect(r.origem).toBe('armazenado');
    expect(r.app.repasses).toHaveLength(40);
  });

  it('descarta estado de versão anterior, avisando o usuário', () => {
    const antigo = { ...estadoInicial(), versao: VERSAO_ESTADO - 1 };
    const arm = memoria({ [CHAVE]: serializar(antigo) });
    const r = carregar(arm);

    expect(r.origem).toBe('semeadura');
    expect(r.aviso).toContain('versão anterior');
    expect(arm.getItem(CHAVE)).toBeNull();
  });

  it('descarta dado corrompido, avisando o usuário', () => {
    const arm = memoria({ [CHAVE]: '{ isto não é json' });
    const r = carregar(arm);

    expect(r.origem).toBe('semeadura');
    expect(r.aviso).toContain('corrompidos');
    expect(arm.getItem(CHAVE)).toBeNull();
  });

  it('não migra: prefere estado limpo a estado meio-migrado', () => {
    const arm = memoria({ [CHAVE]: serializar({ ...estadoInicial(), versao: 99 }) });
    expect(carregar(arm).app.repasses).toHaveLength(40);
  });
});

describe('escrita', () => {
  it('salva e recupera', () => {
    const arm = memoria();
    expect(salvar(arm, estadoInicial())).toBe(true);
    expect(arm.getItem(CHAVE)).not.toBeNull();
  });

  it('falha em silêncio quando o armazenamento recusa — cota cheia, modo privativo', () => {
    // Salvar nunca pode derrubar a demonstração durante o pitch.
    const recusa: Armazenamento = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };

    expect(salvar(recusa, estadoInicial())).toBe(false);
  });

  it('não faz nada sem armazenamento', () => {
    expect(salvar(null, estadoInicial())).toBe(false);
    expect(() => limpar(null)).not.toThrow();
  });

  it('usa chave versionada, para que versões não colidam', () => {
    expect(CHAVE).toContain(`v${VERSAO_ESTADO}`);
  });
});
