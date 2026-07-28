/**
 * Transliteração do programa `repasse_transparente` (FR-002 a FR-009, FR-032,
 * FR-037, FR-038).
 *
 * Toda divergência do programa original é testada como comportamento
 * **esperado**. Se algum destes testes começar a falhar porque alguém
 * "consertou" o núcleo, o conserto é que está errado: correções vão para a v0.2
 * do programa e para o `research.md`, nunca para `src/core/` (Princípio II).
 */

import { describe, it, expect } from 'vitest';
import {
  autorizarFonte,
  reportarPreco,
  atualizarPrecoReferencia,
  proporRepasse,
  confirmarEntrega,
  calcularLimite,
  saldoBrz,
} from '@/core/contrato';
import { ErroPrograma } from '@/core/erros';
import { TOLERANCIA_PERCENTUAL, CONTA_CUSTODIA } from '@/core/tipos';
import {
  estadoDeTeste,
  FONTE_A,
  FONTE_B,
  FONTE_C,
  INTRUSO,
  PREFEITURA,
  FORNECEDOR,
  CONSELHO_1,
  INSTANTE_BASE,
  SALDO_INICIAL,
} from '../ajuda';

const LEITE = 'leite-uht';
const R1 = 'repasse-0001';

// ---------------------------------------------------------------------------
// autorizar_fonte
// ---------------------------------------------------------------------------

describe('autorizarFonte', () => {
  it('habilita uma fonte a reportar preço', () => {
    const estado = estadoDeTeste({ fontesAutorizadas: [] });
    expect(() => reportarPreco(estado, LEITE, FONTE_A, 498n)).toThrow();

    autorizarFonte(estado, FONTE_A);
    expect(() => reportarPreco(estado, LEITE, FONTE_A, 498n)).not.toThrow();
  });

  it('registra a fonte na lista, sem duplicar em chamada repetida', () => {
    const estado = estadoDeTeste({ fontesAutorizadas: [] });
    autorizarFonte(estado, FONTE_A);
    autorizarFonte(estado, FONTE_A);
    expect(estado.listaFontes).toEqual([FONTE_A]);
  });

  it('não emite evento — a instrução é silenciosa na rede', () => {
    // Divergência: quem observa a rede só por eventos nunca vê uma nova fonte
    // de verdade entrar no sistema.
    const estado = estadoDeTeste({ fontesAutorizadas: [] });
    const retorno = autorizarFonte(estado, FONTE_A);
    expect(retorno).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// reportar_preco
// ---------------------------------------------------------------------------

describe('reportarPreco', () => {
  it('recusa fonte não autorizada com a variante Erro::FonteNaoAutorizada', () => {
    const estado = estadoDeTeste();
    try {
      reportarPreco(estado, LEITE, INTRUSO, 520n);
      expect.unreachable('deveria ter revertido');
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroPrograma);
      expect((erro as ErroPrograma).codigo).toBe('FonteNaoAutorizada');
      expect((erro as ErroPrograma).message).toBe('Erro::FonteNaoAutorizada');
    }
  });

  it('registra a cotação de fonte autorizada e emite PrecoReportado', () => {
    const estado = estadoDeTeste();
    const evento = reportarPreco(estado, LEITE, FONTE_A, 498n);

    expect(evento).toEqual({
      tipo: 'PrecoReportado',
      itemId: LEITE,
      fonte: FONTE_A,
      preco: 498n,
    });
    expect(estado.cotacoesOraculo.get(LEITE)?.get(FONTE_A)).toBe(498n);
  });

  it('substitui a cotação anterior da mesma fonte', () => {
    const estado = estadoDeTeste();
    reportarPreco(estado, LEITE, FONTE_A, 498n);
    reportarPreco(estado, LEITE, FONTE_A, 505n);

    expect(estado.cotacoesOraculo.get(LEITE)?.get(FONTE_A)).toBe(505n);
    expect(estado.cotacoesOraculo.get(LEITE)?.size).toBe(1);
  });

  it('mantém cotações de fontes distintas lado a lado', () => {
    const estado = estadoDeTeste();
    reportarPreco(estado, LEITE, FONTE_A, 498n);
    reportarPreco(estado, LEITE, FONTE_B, 512n);
    expect(estado.cotacoesOraculo.get(LEITE)?.size).toBe(2);
  });

  it('aceita cotação zero — divergência MED-02 preservada', () => {
    const estado = estadoDeTeste();
    expect(() => reportarPreco(estado, LEITE, FONTE_A, 0n)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// atualizar_preco_referencia
// ---------------------------------------------------------------------------

describe('atualizarPrecoReferencia', () => {
  it('recusa menos de três cotações com Erro::FontesInsuficientes', () => {
    const estado = estadoDeTeste();
    expect(() =>
      atualizarPrecoReferencia(estado, LEITE, [498n, 520n], INSTANTE_BASE),
    ).toThrowError('Erro::FontesInsuficientes');
  });

  it('aceita exatamente três cotações', () => {
    const estado = estadoDeTeste();
    const evento = atualizarPrecoReferencia(
      estado,
      LEITE,
      [498n, 520n, 545n],
      INSTANTE_BASE,
    );

    expect(evento).toEqual({ tipo: 'MedianaAtualizada', itemId: LEITE, mediana: 520n });
    expect(estado.tabelaPrecos.get(LEITE)?.precoMediana).toBe(520n);
  });

  it('grava o instante recebido, sem ler o relógio', () => {
    const estado = estadoDeTeste();
    atualizarPrecoReferencia(estado, LEITE, [498n, 520n, 545n], INSTANTE_BASE);
    expect(estado.tabelaPrecos.get(LEITE)?.atualizadoEm).toBe(INSTANTE_BASE);
  });

  it('calcula sobre o vetor recebido, ignorando as cotações registradas — CRIT-01', () => {
    // A falha mais persistente do projeto: sobreviveu à migração de Solidity
    // para Anchor. A função nunca lê as contas `cotacao` que `reportar_preco`
    // gravou. Quem chama informa o vetor que quiser.
    const estado = estadoDeTeste();
    reportarPreco(estado, LEITE, FONTE_A, 498n);
    reportarPreco(estado, LEITE, FONTE_B, 512n);
    reportarPreco(estado, LEITE, FONTE_C, 520n);

    atualizarPrecoReferencia(estado, LEITE, [9000n, 9500n, 9900n], INSTANTE_BASE);

    expect(estado.tabelaPrecos.get(LEITE)?.precoMediana).toBe(9500n);
  });
});

// ---------------------------------------------------------------------------
// Limite de tolerância
// ---------------------------------------------------------------------------

describe('calcularLimite — aritmética inteira, sem arredondamento', () => {
  const casos: ReadonlyArray<readonly [string, bigint, bigint]> = [
    ['arroz-tipo-1', 640n, 736n],
    ['feijao-carioca', 890n, 1023n],
    ['leite-uht', 520n, 598n],
    ['banana-prata', 580n, 667n], // 580*15/100 = 87
    ['tomate', 730n, 839n], // 730*15/100 = 109, não 109,5
    ['frango-file', 1240n, 1426n],
    ['oleo-soja', 790n, 908n], // 790*15/100 = 118, não 118,5
    ['farinha-trigo', 460n, 529n],
    ['ovos', 1120n, 1288n],
    ['cenoura', 490n, 563n], // 490*15/100 = 73, não 73,5
  ];

  it.each(casos)('%s: mediana %s → limite %s', (_item, mediana, esperado) => {
    expect(calcularLimite(mediana, TOLERANCIA_PERCENTUAL)).toBe(esperado);
  });

  it('trunca a parcela de tolerância antes de somar', () => {
    expect(calcularLimite(730n, 15n)).toBe(839n);
    expect(calcularLimite(730n, 15n)).not.toBe(840n);
  });

  it('devolve a própria referência quando a tolerância é zero', () => {
    expect(calcularLimite(520n, 0n)).toBe(520n);
  });
});

// ---------------------------------------------------------------------------
// propor_repasse — trava e custódia
// ---------------------------------------------------------------------------

describe('proporRepasse', () => {
  it('recusa item sem referência, com motivo distinto do de preço', () => {
    const estado = estadoDeTeste();
    try {
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 100n, 100_000n);
      expect.unreachable('deveria ter revertido');
    } catch (erro) {
      expect((erro as ErroPrograma).codigo).toBe('SemReferencia');
    }
  });

  it('bloqueia o caso do leite: 40.000 L por R$ 396.000,00', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    try {
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 40_000n, 39_600_000n);
      expect.unreachable('deveria ter bloqueado');
    } catch (erro) {
      expect((erro as ErroPrograma).codigo).toBe('AcimaDoLimite');
      expect((erro as ErroPrograma).message).toBe('Erro::AcimaDoLimite');
    }
  });

  it('aprova exatamente no limite — a comparação é menor OU IGUAL', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    const evento = proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 598_000n);
    expect(evento).toEqual({ tipo: 'RepasseAprovado', repasseId: R1, valor: 598_000n });
  });

  it('bloqueia um centavo acima do limite', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    expect(() =>
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 599_000n),
    ).toThrowError('Erro::AcimaDoLimite');
  });

  it('reverte com Erro::QuantidadeInvalida quando a quantidade é zero', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    try {
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 0n, 100_000n);
      expect.unreachable('deveria ter revertido');
    } catch (erro) {
      expect((erro as ErroPrograma).codigo).toBe('QuantidadeInvalida');
    }
  });

  it('verifica a referência ANTES de dividir — a ordem do programa importa', () => {
    const estado = estadoDeTeste();
    try {
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 0n, 100_000n);
      expect.unreachable('deveria ter revertido');
    } catch (erro) {
      expect((erro as ErroPrograma).codigo).toBe('SemReferencia');
    }
  });

  it('trunca o preço unitário efetivo — divergência MED-03 preservada', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 300n } });
    // limite = 345. 1000 / 3 = 333,33 → trunca para 333, que passa.
    expect(() => proporRepasse(estado, R1, LEITE, FORNECEDOR, 3n, 1_000n)).not.toThrow();
  });

  it('não impõe controle de acesso ao propositor — divergência MED-05', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    expect(() =>
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Custódia em BRZ (FR-037)
// ---------------------------------------------------------------------------

describe('custódia em BRZ', () => {
  it('move o valor da prefeitura para a custódia ao aprovar', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);

    expect(saldoBrz(estado, PREFEITURA)).toBe(SALDO_INICIAL - 500_000n);
    expect(saldoBrz(estado, CONTA_CUSTODIA)).toBe(500_000n);
    expect(saldoBrz(estado, FORNECEDOR)).toBe(0n);
  });

  it('NÃO move um centavo quando a trava bloqueia', () => {
    // A transferência acontece depois do require. É o que o avaliador precisa
    // ver: rejeitou, e o saldo da prefeitura ficou intacto.
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    expect(() =>
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 40_000n, 39_600_000n),
    ).toThrow();

    expect(saldoBrz(estado, PREFEITURA)).toBe(SALDO_INICIAL);
    expect(saldoBrz(estado, CONTA_CUSTODIA)).toBe(0n);
  });

  it('grava a conta do repasse com estado inicial não liberado', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);

    expect(estado.repasses.get(R1)).toEqual({
      fornecedor: FORNECEDOR,
      valor: 500_000n,
      quantidade: 1_000n,
      liberado: false,
      confirmacoes: 0,
    });
  });

  it('reverte se a prefeitura não tem BRZ suficiente', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n }, saldoPrefeitura: 1_000n });
    try {
      proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);
      expect.unreachable('deveria ter revertido');
    } catch (erro) {
      expect((erro as ErroPrograma).codigo).toBe('SaldoInsuficiente');
    }
  });

  it('conserva o total de BRZ em circulação em toda operação', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    const total = () =>
      saldoBrz(estado, PREFEITURA) +
      saldoBrz(estado, CONTA_CUSTODIA) +
      saldoBrz(estado, FORNECEDOR);

    expect(total()).toBe(SALDO_INICIAL);
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);
    expect(total()).toBe(SALDO_INICIAL);
    confirmarEntrega(estado, R1);
    confirmarEntrega(estado, R1);
    expect(total()).toBe(SALDO_INICIAL);
  });
});

// ---------------------------------------------------------------------------
// confirmar_entrega — quórum (FR-038)
// ---------------------------------------------------------------------------

describe('confirmarEntrega', () => {
  function comRepasse() {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);
    return estado;
  }

  it('mantém o valor retido na primeira confirmação', () => {
    const estado = comRepasse();
    const r = confirmarEntrega(estado, R1);

    expect(r).toEqual({
      repasseId: R1,
      confirmacoes: 1,
      quorumAtingido: false,
      valorLiberado: null,
    });
    expect(saldoBrz(estado, CONTA_CUSTODIA)).toBe(500_000n);
    expect(saldoBrz(estado, FORNECEDOR)).toBe(0n);
  });

  it('libera ao fornecedor quando o quórum de 2 é atingido', () => {
    const estado = comRepasse();
    confirmarEntrega(estado, R1);
    const r = confirmarEntrega(estado, R1);

    expect(r.quorumAtingido).toBe(true);
    expect(r.valorLiberado).toBe(500_000n);
    expect(saldoBrz(estado, CONTA_CUSTODIA)).toBe(0n);
    expect(saldoBrz(estado, FORNECEDOR)).toBe(500_000n);
    expect(estado.repasses.get(R1)?.liberado).toBe(true);
  });

  it('recusa nova confirmação depois de liberado, com Erro::JaLiberado', () => {
    const estado = comRepasse();
    confirmarEntrega(estado, R1);
    confirmarEntrega(estado, R1);

    expect(() => confirmarEntrega(estado, R1)).toThrowError('Erro::JaLiberado');
  });

  it('não emite evento — divergência ALTA-02 preservada', () => {
    // A instrução que libera o dinheiro é a única silenciosa, contradizendo a
    // observação (iii) do documento da proposta. Um painel construído só a
    // partir de eventos jamais saberia que o valor foi pago.
    const estado = comRepasse();
    const r = confirmarEntrega(estado, R1);
    expect(r).not.toHaveProperty('tipo');
  });

  it('falha em repasse inexistente — o runtime Anchor nem entraria na instrução', () => {
    const estado = estadoDeTeste();
    expect(() => confirmarEntrega(estado, 'repasse-fantasma')).toThrowError(
      /conta de repasse inexistente/,
    );
  });
});

// ---------------------------------------------------------------------------
// CRIT-02 — o quórum é burlável por uma única carteira
// ---------------------------------------------------------------------------

describe('CRIT-02 — falha de quórum, preservada de propósito', () => {
  it('a mesma parte atinge o quórum sozinha e libera o dinheiro', () => {
    // `confirmar_entrega` faz `repasse.confirmacoes += 1` sem registrar QUEM
    // confirmou. Não há sequer parâmetro de confirmador — não há uso para ele.
    // Isso anula a mitigação que a matriz de riscos promete para entrega
    // fictícia: "confirmação por múltiplas partes independentes na ponta".
    //
    // Se este teste passar a falhar, alguém corrigiu o núcleo. A correção
    // pertence à v0.2 do programa, não aqui.
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);

    confirmarEntrega(estado, R1);
    confirmarEntrega(estado, R1);

    expect(estado.repasses.get(R1)?.liberado).toBe(true);
    expect(saldoBrz(estado, FORNECEDOR)).toBe(500_000n);
  });

  it('a assinatura não aceita confirmador — a falha é estrutural, não de uso', () => {
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);

    // `confirmarEntrega(estado, repasseId)` — dois parâmetros. Não há onde
    // informar CONSELHO_1 nem distinguir uma parte de outra.
    expect(confirmarEntrega.length).toBe(2);
    expect(CONSELHO_1).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CRIT-03 — sem prazo nem reembolso
// ---------------------------------------------------------------------------

describe('CRIT-03 — o valor pode ficar preso, preservado de propósito', () => {
  it('não existe caminho de devolução à prefeitura', () => {
    // Se as confirmações nunca vierem, o BRZ permanece na PDA de custódia sem
    // instrução alguma capaz de movê-lo de volta. Um sistema criado para
    // proteger verba escolar não pode ter estado terminal onde a verba evapora.
    const estado = estadoDeTeste({ precos: { [LEITE]: 520n } });
    proporRepasse(estado, R1, LEITE, FORNECEDOR, 1_000n, 500_000n);
    confirmarEntrega(estado, R1); // uma só; o quórum nunca se completa

    expect(saldoBrz(estado, CONTA_CUSTODIA)).toBe(500_000n);
    expect(saldoBrz(estado, PREFEITURA)).toBe(SALDO_INICIAL - 500_000n);
    expect(estado.repasses.get(R1)?.liberado).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// As cinco rejeições do dataset semeado (FR-005, FR-032)
// ---------------------------------------------------------------------------

interface CasoRejeicao {
  readonly item: string;
  readonly mediana: bigint;
  readonly quantidade: bigint;
  readonly valorProposto: bigint;
  readonly unitarioEfetivo: bigint;
  readonly limite: bigint;
  readonly sobreprecoPercentual: bigint;
  readonly valorBloqueado: bigint;
}

/**
 * Conferência independente de `mock-data.md`. Os valores estão inline de
 * propósito: este teste é a checagem externa da tabela, e não pode depender do
 * código de semeadura que ele existe para verificar.
 *
 * A migração de Solidity para Anchor não alterou nenhum destes números — a
 * aritmética inteira é idêntica nas duas linguagens.
 */
const REJEICOES: readonly CasoRejeicao[] = [
  {
    item: 'leite-uht',
    mediana: 520n,
    quantidade: 40_000n,
    valorProposto: 39_600_000n,
    unitarioEfetivo: 990n,
    limite: 598n,
    sobreprecoPercentual: 90n,
    valorBloqueado: 15_680_000n,
  },
  {
    item: 'feijao-carioca',
    mediana: 890n,
    quantidade: 8_000n,
    valorProposto: 9_600_000n,
    unitarioEfetivo: 1_200n,
    limite: 1_023n,
    sobreprecoPercentual: 34n,
    valorBloqueado: 1_416_000n,
  },
  {
    item: 'oleo-soja',
    mediana: 790n,
    quantidade: 6_000n,
    valorProposto: 6_600_000n,
    unitarioEfetivo: 1_100n,
    limite: 908n,
    sobreprecoPercentual: 39n,
    valorBloqueado: 1_152_000n,
  },
  {
    item: 'tomate',
    mediana: 730n,
    quantidade: 3_000n,
    valorProposto: 3_300_000n,
    unitarioEfetivo: 1_100n,
    limite: 839n,
    sobreprecoPercentual: 50n,
    valorBloqueado: 783_000n,
  },
  {
    item: 'frango-file',
    mediana: 1_240n,
    quantidade: 5_000n,
    valorProposto: 7_900_000n,
    unitarioEfetivo: 1_580n,
    limite: 1_426n,
    sobreprecoPercentual: 27n,
    valorBloqueado: 770_000n,
  },
];

describe('as cinco rejeições do dataset semeado', () => {
  it.each(REJEICOES)('$item é bloqueado pela trava', (caso) => {
    const estado = estadoDeTeste({ precos: { [caso.item]: caso.mediana } });
    expect(() =>
      proporRepasse(
        estado,
        R1,
        caso.item,
        FORNECEDOR,
        caso.quantidade,
        caso.valorProposto,
      ),
    ).toThrowError('Erro::AcimaDoLimite');
  });

  it.each(REJEICOES)('$item — nenhum BRZ sai da prefeitura', (caso) => {
    const estado = estadoDeTeste({ precos: { [caso.item]: caso.mediana } });
    try {
      proporRepasse(
        estado,
        R1,
        caso.item,
        FORNECEDOR,
        caso.quantidade,
        caso.valorProposto,
      );
    } catch {
      /* esperado */
    }
    expect(saldoBrz(estado, PREFEITURA)).toBe(SALDO_INICIAL);
  });

  it.each(REJEICOES)('$item — o limite do núcleo bate com a tabela', (caso) => {
    expect(calcularLimite(caso.mediana, TOLERANCIA_PERCENTUAL)).toBe(caso.limite);
  });

  it.each(REJEICOES)('$item — a aritmética documentada se sustenta', (caso) => {
    expect(caso.valorProposto / caso.quantidade).toBe(caso.unitarioEfetivo);

    expect(((caso.unitarioEfetivo - caso.mediana) * 100n) / caso.mediana).toBe(
      caso.sobreprecoPercentual,
    );

    // Valor bloqueado: diferença entre o proposto e o teto aceitável — NÃO o
    // valor cheio da proposta. A compra legítima ainda precisaria ser feita.
    expect(caso.valorProposto - caso.limite * caso.quantidade).toBe(caso.valorBloqueado);
  });

  it('soma R$ 198.010,00 bloqueados, o número da landing', () => {
    const total = REJEICOES.reduce((s, c) => s + c.valorBloqueado, 0n);
    expect(total).toBe(19_801_000n);
  });

  it('equivale a 94.290 refeições preservadas, truncando uma única vez no agregado', () => {
    const total = REJEICOES.reduce((s, c) => s + c.valorBloqueado, 0n);
    const CUSTO_REFEICAO = 210n;

    expect(total / CUSTO_REFEICAO).toBe(94_290n);

    // Truncar por rejeição e só então somar daria 94.287. A diferença de 3 é o
    // erro de implementação que o data-model.md manda evitar.
    const somaTruncadaPorCaso = REJEICOES.reduce(
      (s, c) => s + c.valorBloqueado / CUSTO_REFEICAO,
      0n,
    );
    expect(somaTruncadaPorCaso).toBe(94_287n);
  });
});
