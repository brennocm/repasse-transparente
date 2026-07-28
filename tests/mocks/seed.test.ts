/**
 * T043, T044 — semeadura determinística e agregados publicados.
 *
 * A semeadura processa todo o dataset **pelo núcleo**. As rejeições não são
 * marcadas como rejeitadas numa tabela: são rejeitadas pela mesma função que
 * rejeitaria em produção. Se a trava tiver um bug, estes testes acusam.
 */

import { describe, it, expect } from 'vitest';
import { semear, SALDO_INICIAL_PREFEITURA } from '@/mocks/seed';
import { verificarIntegridade } from '@/core/registro';
import { saldoBrz } from '@/core/contrato';
import { CONTA_CUSTODIA } from '@/core/tipos';
import { MUNICIPIO } from '@/mocks/municipio';
import { MEDIANA_ALVO } from '@/mocks/itens';
import { INSTANTE_ATUAL, PLANO_REPASSES } from '@/mocks/repasses';
import type { SituacaoRepasse } from '@/dominio/tipos';

const dados = semear();

function porSituacao(s: SituacaoRepasse) {
  return dados.repasses.filter((r) => r.situacao === s);
}

// ---------------------------------------------------------------------------
// T043 — determinismo
// ---------------------------------------------------------------------------

describe('semeadura determinística', () => {
  it('produz cadeias idênticas em duas execuções, hash a hash', () => {
    // Sem isso, a verificação de integridade perde o sentido: cada recarga da
    // página produziria hashes diferentes e tudo pareceria adulterado.
    const a = semear();
    const b = semear();

    expect(a.cadeia.length).toBe(b.cadeia.length);
    expect(a.cadeia.map((r) => r.hash)).toEqual(b.cadeia.map((r) => r.hash));
  });

  it('não usa o relógio: os horários são deslocamentos fixos da base', () => {
    const a = semear();
    const b = semear();
    expect(a.cadeia.map((r) => r.horario)).toEqual(b.cadeia.map((r) => r.horario));
  });

  it('gera uma cadeia íntegra', () => {
    const r = verificarIntegridade(dados.cadeia);
    expect(r.integra).toBe(true);
  });

  it('mantém horários monotônicos não-decrescentes na cadeia', () => {
    for (let i = 1; i < dados.cadeia.length; i++) {
      expect(dados.cadeia[i]!.horario).toBeGreaterThanOrEqual(
        dados.cadeia[i - 1]!.horario,
      );
    }
  });

  it('registra volume suficiente para o explorador parecer um sistema em operação', () => {
    expect(dados.cadeia.length).toBeGreaterThan(300);
  });
});

// ---------------------------------------------------------------------------
// T044 — agregados publicados
// ---------------------------------------------------------------------------

describe('agregados do dataset', () => {
  const rejeitados = porSituacao('Rejeitado');

  const valorBloqueado = rejeitados.reduce(
    (soma, r) => soma + (r.valorTotal - r.limiteAplicado * r.quantidade),
    0n,
  );

  it('bloqueia exatamente R$ 198.010,00 — o número da landing', () => {
    expect(valorBloqueado).toBe(19_801_000n);
  });

  it('equivale a 94.290 refeições preservadas', () => {
    expect(valorBloqueado / MUNICIPIO.custoRefeicaoCentavos).toBe(94_290n);
  });

  it('tem exatamente 40 repasses, 5 deles bloqueados pela trava', () => {
    expect(dados.repasses).toHaveLength(40);
    expect(rejeitados).toHaveLength(5);
  });

  it('distribui as situações conforme o plano', () => {
    expect(porSituacao('Liberado')).toHaveLength(28);
    expect(porSituacao('Retido')).toHaveLength(6);
    expect(porSituacao('Divergente')).toHaveLength(1);
    expect(porSituacao('Proposto')).toHaveLength(0);
  });

  it('bloqueia os cinco itens documentados, com os sobrepreços da tabela', () => {
    const esperado = [
      { itemId: 'leite-uht', unitario: 990n, limite: 598n, sobrepreco: 90n },
      { itemId: 'feijao-carioca', unitario: 1_200n, limite: 1_023n, sobrepreco: 34n },
      { itemId: 'oleo-soja', unitario: 1_100n, limite: 908n, sobrepreco: 39n },
      { itemId: 'tomate', unitario: 1_100n, limite: 839n, sobrepreco: 50n },
      { itemId: 'frango-file', unitario: 1_580n, limite: 1_426n, sobrepreco: 27n },
    ];

    for (const e of esperado) {
      const r = rejeitados.find((x) => x.itemId === e.itemId);
      expect(r, `rejeição de ${e.itemId} ausente`).toBeDefined();
      expect(r!.precoUnitarioEfetivo).toBe(e.unitario);
      expect(r!.limiteAplicado).toBe(e.limite);
      expect(
        ((r!.precoUnitarioEfetivo - r!.medianaAplicada) * 100n) / r!.medianaAplicada,
      ).toBe(e.sobrepreco);
      expect(r!.motivoRejeicao).toBe('Erro::AcimaDoLimite');
    }
  });

  it('congela mediana, limite e tolerância no momento da decisão', () => {
    // Um repasse decidido em março precisa ser auditável contra a referência de
    // março. Sem congelar, o histórico fica irreproduzível.
    for (const r of dados.repasses) {
      expect(r.toleranciaAplicada).toBe(15n);
      expect(r.limiteAplicado).toBe(
        r.medianaAplicada + (r.medianaAplicada * 15n) / 100n,
      );
    }
  });

  it('deixa a referência de cada item igual à mediana alvo publicada', () => {
    for (const [itemId, alvo] of Object.entries(MEDIANA_ALVO)) {
      expect(dados.estado.tabelaPrecos.get(itemId)?.precoMediana, itemId).toBe(alvo);
    }
  });
});

// ---------------------------------------------------------------------------
// Custódia em BRZ
// ---------------------------------------------------------------------------

describe('saldos de BRZ após a semeadura', () => {
  it('conserva o total em circulação', () => {
    const total = [...dados.estado.saldosBrz.values()].reduce((a, v) => a + v, 0n);
    expect(total).toBe(SALDO_INICIAL_PREFEITURA);
  });

  it('mantém em custódia exatamente o valor dos repasses retidos e divergentes', () => {
    const retido = dados.repasses
      .filter((r) => r.situacao === 'Retido' || r.situacao === 'Divergente')
      .reduce((a, r) => a + r.valorTotal, 0n);

    expect(saldoBrz(dados.estado, CONTA_CUSTODIA)).toBe(retido);
  });

  it('entrega aos fornecedores exatamente o valor dos repasses liberados', () => {
    const liberado = porSituacao('Liberado').reduce((a, r) => a + r.valorTotal, 0n);
    const aFornecedores = [...dados.estado.saldosBrz.entries()]
      .filter(([c]) => c !== dados.estado.prefeitura && c !== CONTA_CUSTODIA)
      .reduce((a, [, v]) => a + v, 0n);

    expect(aFornecedores).toBe(liberado);
  });

  it('não debita a prefeitura pelos repasses bloqueados', () => {
    const aprovados = dados.repasses
      .filter((r) => r.situacao !== 'Rejeitado')
      .reduce((a, r) => a + r.valorTotal, 0n);

    expect(saldoBrz(dados.estado, dados.estado.prefeitura)).toBe(
      SALDO_INICIAL_PREFEITURA - aprovados,
    );
  });

  it('tem saldo inicial suficiente para o dataset inteiro', () => {
    expect(saldoBrz(dados.estado, dados.estado.prefeitura)).toBeGreaterThan(0n);
  });
});

// ---------------------------------------------------------------------------
// Entregas e prazos
// ---------------------------------------------------------------------------

describe('entregas', () => {
  it('cria entrega para todo repasse que não foi bloqueado, e para nenhum bloqueado', () => {
    expect(dados.entregas).toHaveLength(35);
    const idsRejeitados = new Set(porSituacao('Rejeitado').map((r) => r.id));
    for (const e of dados.entregas) {
      expect(idsRejeitados.has(e.repasseId)).toBe(false);
    }
  });

  it('separa três pendências vencidas de três dentro do prazo', () => {
    const pendentes = dados.entregas.filter((e) => e.situacao === 'pendente');
    const vencidas = pendentes.filter((e) => e.prazoLimite < INSTANTE_ATUAL);
    const noPrazo = pendentes.filter((e) => e.prazoLimite >= INSTANTE_ATUAL);

    expect(vencidas).toHaveLength(3);
    expect(noPrazo).toHaveLength(3);
  });

  it('registra dois confirmadores distintos em cada entrega confirmada', () => {
    // O programa não grava quem confirmou (CRIT-02). A identidade existe só na
    // camada de aplicação — é exatamente o que a v0.2 precisa levar on-chain.
    const confirmadas = dados.entregas.filter((e) => e.situacao === 'confirmada');
    expect(confirmadas).toHaveLength(28);

    for (const e of confirmadas) {
      expect(e.confirmadoPor).toHaveLength(2);
      expect(new Set(e.confirmadoPor).size).toBe(2);
    }
  });

  it('mantém a divergência retida, com descrição', () => {
    const divergentes = dados.entregas.filter((e) => e.situacao === 'divergente');
    expect(divergentes).toHaveLength(1);
    expect(divergentes[0]!.descricaoDivergencia).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Coerência entre plano e resultado
// ---------------------------------------------------------------------------

describe('plano e resultado', () => {
  it('processa todos os repasses planejados, na mesma ordem', () => {
    expect(dados.repasses.map((r) => r.id)).toEqual(PLANO_REPASSES.map((p) => p.id));
  });

  it('gera identificadores únicos', () => {
    expect(new Set(dados.repasses.map((r) => r.id)).size).toBe(40);
  });

  it('associa cada repasse aos seus registros na cadeia', () => {
    for (const r of dados.repasses) {
      expect(r.registros.length).toBeGreaterThan(0);
      for (const n of r.registros) {
        expect(dados.cadeia[n]).toBeDefined();
        expect(dados.cadeia[n]!.numero).toBe(n);
      }
    }
  });

  it('grava a rejeição na cadeia com sucesso falso e motivo', () => {
    const falhas = dados.cadeia.filter((r) => !r.sucesso);
    expect(falhas).toHaveLength(5);
    for (const f of falhas) {
      expect(f.tipo).toBe('RepasseRejeitado');
      expect(f.motivoFalha).toBe('Erro::AcimaDoLimite');
    }
  });
});
