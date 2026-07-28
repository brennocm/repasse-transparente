/**
 * Reducer, impacto, consultas e formatação.
 *
 * O núcleo muta seu estado no lugar; React precisa do oposto. O teste de
 * imutabilidade é o que garante que a conciliação por clonagem não vazou.
 */

import { describe, it, expect } from 'vitest';
import { estadoInicial, reduzir, cotacoesRegistradas } from '@/adapter/estado';
import { calcularImpacto, valorBloqueado, sobreprecoPercentual } from '@/adapter/impacto';
import { consultar, filtrarRepasses, alertas, mediaAritmetica, ehDiscrepante } from '@/adapter/consultas';
import {
  formatarReais,
  formatarValor,
  formatarPercentual,
  abreviarHash,
  parsearReais,
  parsearInteiro,
} from '@/adapter/formato';
import { verificarIntegridade } from '@/core/registro';
import { saldoBrz } from '@/core/contrato';
import { CONTA_CUSTODIA } from '@/core/tipos';
import { PERFIS, CONSELHEIRO_SECUNDARIO } from '@/mocks/perfis';

const APP = estadoInicial();
const GESTOR = PERFIS.find((p) => p.papel === 'gestor')!.endereco;
const CONSELHO_1 = PERFIS.find((p) => p.papel === 'conselho')!.endereco;
const CONSELHO_2 = CONSELHEIRO_SECUNDARIO.endereco;

// ---------------------------------------------------------------------------
// Imutabilidade
// ---------------------------------------------------------------------------

describe('reducer é imutável', () => {
  it('não altera o estado anterior ao propor um repasse', () => {
    const antes = {
      repasses: APP.repasses.length,
      cadeia: APP.cadeia.length,
      saldo: saldoBrz(APP.programa, APP.programa.prefeitura),
    };

    reduzir(APP, {
      tipo: 'propor-repasse',
      itemId: 'leite-uht',
      fornecedorId: 'for-01',
      escolaId: 'esc-01',
      quantidade: 1_000n,
      valorTotal: 500_000n,
      autor: GESTOR,
    });

    expect(APP.repasses).toHaveLength(antes.repasses);
    expect(APP.cadeia).toHaveLength(antes.cadeia);
    expect(saldoBrz(APP.programa, APP.programa.prefeitura)).toBe(antes.saldo);
  });

  it('não compartilha os Maps do programa entre estados', () => {
    const depois = reduzir(APP, {
      tipo: 'reportar-cotacao',
      itemId: 'leite-uht',
      fonte: APP.programa.listaFontes[0]!,
      preco: 777n,
    });

    expect(depois.programa.cotacoesOraculo).not.toBe(APP.programa.cotacoesOraculo);
    expect(
      APP.programa.cotacoesOraculo.get('leite-uht')?.get(APP.programa.listaFontes[0]!),
    ).not.toBe(777n);
  });
});

// ---------------------------------------------------------------------------
// Proposta de repasse
// ---------------------------------------------------------------------------

describe('propor repasse', () => {
  it('aprova dentro do limite, custodia o valor e mantém a cadeia íntegra', () => {
    const d = reduzir(APP, {
      tipo: 'propor-repasse',
      itemId: 'leite-uht',
      fornecedorId: 'for-01',
      escolaId: 'esc-01',
      quantidade: 1_000n,
      valorTotal: 500_000n,
      autor: GESTOR,
    });

    const novo = d.repasses[d.repasses.length - 1]!;
    expect(novo.situacao).toBe('Retido');
    expect(saldoBrz(d.programa, CONTA_CUSTODIA)).toBe(
      saldoBrz(APP.programa, CONTA_CUSTODIA) + 500_000n,
    );
    expect(verificarIntegridade(d.cadeia).integra).toBe(true);
    expect(d.entregas).toHaveLength(APP.entregas.length + 1);
  });

  it('bloqueia acima do limite sem mover um centavo', () => {
    const d = reduzir(APP, {
      tipo: 'propor-repasse',
      itemId: 'leite-uht',
      fornecedorId: 'for-01',
      escolaId: 'esc-01',
      quantidade: 40_000n,
      valorTotal: 39_600_000n,
      autor: GESTOR,
    });

    const novo = d.repasses[d.repasses.length - 1]!;
    expect(novo.situacao).toBe('Rejeitado');
    expect(novo.motivoRejeicao).toBe('Erro::AcimaDoLimite');
    expect(saldoBrz(d.programa, d.programa.prefeitura)).toBe(
      saldoBrz(APP.programa, APP.programa.prefeitura),
    );
    // Rejeição não gera entrega: não há o que confirmar.
    expect(d.entregas).toHaveLength(APP.entregas.length);
  });

  it('grava a rejeição na cadeia, com sucesso falso', () => {
    const d = reduzir(APP, {
      tipo: 'propor-repasse',
      itemId: 'leite-uht',
      fornecedorId: 'for-01',
      escolaId: 'esc-01',
      quantidade: 40_000n,
      valorTotal: 39_600_000n,
      autor: GESTOR,
    });

    const ultimo = d.cadeia[d.cadeia.length - 1]!;
    expect(ultimo.tipo).toBe('RepasseRejeitado');
    expect(ultimo.sucesso).toBe(false);
    expect(verificarIntegridade(d.cadeia).integra).toBe(true);
  });

  it('explica a rejeição em português, não só com o identificador do programa', () => {
    const d = reduzir(APP, {
      tipo: 'propor-repasse',
      itemId: 'leite-uht',
      fornecedorId: 'for-01',
      escolaId: 'esc-01',
      quantidade: 40_000n,
      valorTotal: 39_600_000n,
      autor: GESTOR,
    });

    expect(d.aviso).toContain('tolerância');
    expect(d.aviso).not.toBe('Erro::AcimaDoLimite');
  });
});

// ---------------------------------------------------------------------------
// Oráculo
// ---------------------------------------------------------------------------

describe('recalcular referência', () => {
  it('usa as cotações registradas, não um vetor arbitrário — mitiga CRIT-01', () => {
    const precos = cotacoesRegistradas(APP.programa, 'leite-uht');
    expect(precos).toHaveLength(5);
    expect([...precos].sort((a, b) => (a < b ? -1 : 1))).toEqual([
      498n, 512n, 520n, 528n, 545n,
    ]);
  });

  it('move a referência quando uma fonte reporta valor novo', () => {
    const fonte = APP.programa.listaFontes[0]!;
    const comCotacao = reduzir(APP, {
      tipo: 'reportar-cotacao',
      itemId: 'leite-uht',
      fonte,
      preco: 600n,
    });
    const d = reduzir(comCotacao, {
      tipo: 'recalcular-referencia',
      itemId: 'leite-uht',
    });

    // [512, 520, 528, 545, 600] → mediana 528
    expect(d.programa.tabelaPrecos.get('leite-uht')?.precoMediana).toBe(528n);
  });

  it('resiste a uma fonte comprometida: a mediana quase não se move', () => {
    const fonte = APP.programa.listaFontes[0]!;
    const comAbsurdo = reduzir(APP, {
      tipo: 'reportar-cotacao',
      itemId: 'leite-uht',
      fonte,
      preco: 500_000n,
    });
    const d = reduzir(comAbsurdo, {
      tipo: 'recalcular-referencia',
      itemId: 'leite-uht',
    });

    // [512, 520, 528, 545, 500000] → mediana 528. A média iria a 100.421.
    expect(d.programa.tabelaPrecos.get('leite-uht')?.precoMediana).toBe(528n);
  });

  it('recusa cotação de fonte não autorizada, com explicação', () => {
    const d = reduzir(APP, {
      tipo: 'reportar-cotacao',
      itemId: 'leite-uht',
      fonte: '0xffff',
      preco: 500n,
    });

    expect(d.aviso).toContain('autorizadas');
    expect(d.cadeia).toHaveLength(APP.cadeia.length);
  });
});

// ---------------------------------------------------------------------------
// Quórum
// ---------------------------------------------------------------------------

describe('confirmação de entrega', () => {
  // Sem confirmação alguma. Parte das pendências semeadas já tem uma — são as
  // que aguardam o segundo confirmador —, e usá-las aqui mediria outra coisa.
  const pendente = APP.entregas.find(
    (e) => e.situacao === 'pendente' && e.confirmadoPor.length === 0,
  )!;

  /** Pendência que já recebeu a primeira confirmação, do conselheiro 1. */
  const meioCaminho = APP.entregas.find(
    (e) => e.situacao === 'pendente' && e.confirmadoPor.length === 1,
  )!;

  it('mantém retido após uma confirmação', () => {
    const d = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
    });

    const r = d.repasses.find((x) => x.id === pendente.repasseId)!;
    expect(r.situacao).toBe('Retido');
    expect(d.aviso).toContain('de 2');
  });

  it('libera ao fornecedor com duas partes distintas', () => {
    let d = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
    });
    d = reduzir(d, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_2,
    });

    expect(d.repasses.find((x) => x.id === pendente.repasseId)!.situacao).toBe('Liberado');
    expect(d.aviso).toContain('liberado');
    expect(verificarIntegridade(d.cadeia).integra).toBe(true);
  });

  it('RECUSA a segunda confirmação da mesma parte', () => {
    let d = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
    });
    const antes = d.cadeia.length;
    d = reduzir(d, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
    });

    expect(d.repasses.find((x) => x.id === pendente.repasseId)!.situacao).toBe('Retido');
    expect(d.cadeia).toHaveLength(antes);
    expect(d.aviso).toContain('partes independentes');
  });

  it('em pendência a meio caminho, recusa quem já confirmou e aceita o outro', () => {
    const jaConfirmou = meioCaminho.confirmadoPor[0]!;
    const outro = jaConfirmou === CONSELHO_1 ? CONSELHO_2 : CONSELHO_1;

    const repetido = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: meioCaminho.repasseId,
      confirmador: jaConfirmou,
    });
    expect(repetido.aviso).toContain('partes independentes');

    const completa = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: meioCaminho.repasseId,
      confirmador: outro,
    });
    expect(
      completa.repasses.find((x) => x.id === meioCaminho.repasseId)!.situacao,
    ).toBe('Liberado');
  });

  it('demonstra CRIT-02 quando a unicidade é explicitamente ignorada', () => {
    // FR-057: o avaliador reproduz a falha com as próprias mãos. É a mesma
    // parte confirmando duas vezes e liberando o dinheiro sozinha.
    let d = reduzir(APP, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
      ignorarUnicidade: true,
    });
    d = reduzir(d, {
      tipo: 'confirmar-entrega',
      repasseId: pendente.repasseId,
      confirmador: CONSELHO_1,
      ignorarUnicidade: true,
    });

    expect(d.repasses.find((x) => x.id === pendente.repasseId)!.situacao).toBe('Liberado');
    const entrega = d.entregas.find((e) => e.repasseId === pendente.repasseId)!;
    expect(new Set(entrega.confirmadoPor).size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Sessão e restauração
// ---------------------------------------------------------------------------

describe('sessão e restauração', () => {
  it('entra e sai sem tocar nos dados do domínio', () => {
    const dentro = reduzir(APP, { tipo: 'entrar', perfilId: 'perfil-gestor' });
    expect(dentro.sessao?.perfilId).toBe('perfil-gestor');

    const fora = reduzir(dentro, { tipo: 'sair' });
    expect(fora.sessao).toBeNull();
    expect(fora.repasses).toHaveLength(40);
  });

  it('restaura os dados mantendo a sessão aberta', () => {
    const usado = reduzir(
      reduzir(APP, { tipo: 'entrar', perfilId: 'perfil-gestor' }),
      {
        tipo: 'propor-repasse',
        itemId: 'leite-uht',
        fornecedorId: 'for-01',
        escolaId: 'esc-01',
        quantidade: 1_000n,
        valorTotal: 500_000n,
        autor: GESTOR,
      },
    );
    expect(usado.repasses).toHaveLength(41);

    const limpo = reduzir(usado, { tipo: 'restaurar-tudo' });
    expect(limpo.repasses).toHaveLength(40);
    expect(limpo.sessao?.perfilId).toBe('perfil-gestor');
    expect(limpo.aviso).toContain('restaurados');
  });

  it('adultera um registro e quebra a integridade, de propósito', () => {
    const d = reduzir(APP, {
      tipo: 'adulterar-registro',
      numero: 10,
      dados: { preco: 999_999n },
    });

    const v = verificarIntegridade(d.cadeia);
    expect(v.integra).toBe(false);
    if (!v.integra) expect(v.primeiroInvalido).toBe(10);
    expect(d.adulteracaoAtiva).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Impacto
// ---------------------------------------------------------------------------

describe('impacto', () => {
  const i = calcularImpacto(APP.repasses);

  it('reproduz os números da landing', () => {
    expect(i.valorBloqueado).toBe(19_801_000n);
    expect(i.refeicoesPreservadas).toBe(94_290n);
    expect(i.alunosAlcancados).toBe(9_850);
  });

  it('conta o valor bloqueado como sobrepreço, não como valor cheio da proposta', () => {
    const leite = APP.repasses.find(
      (r) => r.situacao === 'Rejeitado' && r.itemId === 'leite-uht',
    )!;
    expect(valorBloqueado(leite)).toBe(15_680_000n);
    expect(valorBloqueado(leite)).toBeLessThan(leite.valorTotal);
  });

  it('não conta nada como bloqueado em repasse aprovado', () => {
    const aprovado = APP.repasses.find((r) => r.situacao === 'Liberado')!;
    expect(valorBloqueado(aprovado)).toBe(0n);
  });

  it('separa custódia de valor já pago', () => {
    expect(i.valorEmCustodia + i.valorLiberado).toBe(i.valorAprovado);
  });

  it('calcula o sobrepreço do caso do leite em 90%', () => {
    const leite = APP.repasses.find(
      (r) => r.situacao === 'Rejeitado' && r.itemId === 'leite-uht',
    )!;
    expect(sobreprecoPercentual(leite)).toBe(90n);
  });
});

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

describe('consultas', () => {
  it('recalcula os indicadores para o recorte filtrado', () => {
    const total = consultar(APP.repasses, {});
    const so = consultar(APP.repasses, { situacao: 'Rejeitado' });

    expect(so.repasses).toHaveLength(5);
    expect(so.impacto.valorBloqueado).toBe(total.impacto.valorBloqueado);
    expect(so.impacto.valorProposto).toBeLessThan(total.impacto.valorProposto);
  });

  it('filtra por item', () => {
    const r = filtrarRepasses(APP.repasses, { itemId: 'leite-uht' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.itemId === 'leite-uht')).toBe(true);
  });

  it('filtra por período', () => {
    const ordenados = [...APP.repasses].sort((a, b) => a.criadoEm - b.criadoEm);
    const meio = ordenados[20]!.criadoEm;
    const r = filtrarRepasses(APP.repasses, { de: meio });
    expect(r.every((x) => x.criadoEm >= meio)).toBe(true);
  });

  it('lista os alertas do mais recente ao mais antigo', () => {
    const a = alertas(APP.repasses);
    expect(a).toHaveLength(5);
    for (let i = 1; i < a.length; i++) {
      expect(a[i - 1]!.repasse.criadoEm).toBeGreaterThanOrEqual(a[i]!.repasse.criadoEm);
    }
  });

  it('mostra a média disparando onde a mediana não se move', () => {
    const honesto = [498n, 512n, 520n, 528n, 545n];
    const comprometido = [498n, 512n, 520n, 528n, 5000n];

    expect(mediaAritmetica(honesto)).toBe(520n);
    expect(mediaAritmetica(comprometido)).toBe(1411n);
  });

  it('sinaliza cotação discrepante sem rejeitá-la', () => {
    expect(ehDiscrepante(5000n, 520n)).toBe(true);
    expect(ehDiscrepante(545n, 520n)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

describe('formatação', () => {
  it('formata centavos em reais com agrupamento de milhar', () => {
    expect(formatarReais(19_801_000n)).toBe('R$ 198.010,00');
    expect(formatarReais(39_600_000n)).toBe('R$ 396.000,00');
    expect(formatarReais(990n)).toBe('R$ 9,90');
    expect(formatarReais(598n)).toBe('R$ 5,98');
  });

  it('separa o símbolo do valor com espaço inseparável', () => {
    // Com espaço comum, o indicador quebrava a linha entre "R$" e o número.
    expect(formatarReais(19_801_000n)).toContain(' ');
    expect(formatarReais(19_801_000n)).not.toContain('R$ ');
  });

  it('preenche os centavos com zero à esquerda', () => {
    expect(formatarValor(105n)).toBe('1,05');
    expect(formatarValor(100n)).toBe('1,00');
    expect(formatarValor(5n)).toBe('0,05');
    expect(formatarValor(0n)).toBe('0,00');
  });

  it('formata valores negativos', () => {
    expect(formatarValor(-19_801_000n)).toBe('-198.010,00');
  });

  it('não perde precisão em valores grandes', () => {
    // Se em algum ponto virasse `number`, os últimos dígitos mudariam.
    expect(formatarValor(9_007_199_254_740_993n)).toBe('90.071.992.547.409,93');
  });

  it('explicita o sinal do sobrepreço', () => {
    expect(formatarPercentual(90n)).toBe('+90%');
    expect(formatarPercentual(-10n)).toBe('-10%');
  });

  it('abrevia hash mantendo início e fim', () => {
    const h = 'a'.repeat(64);
    expect(abreviarHash(h)).toBe('aaaaaa…aaaa');
    expect(abreviarHash('curto')).toBe('curto');
  });
});

// ---------------------------------------------------------------------------
// Entrada de moeda
// ---------------------------------------------------------------------------

describe('parsearReais', () => {
  it('lê o formato brasileiro com separador de milhar', () => {
    expect(parsearReais('396.000,00')).toBe(39_600_000n);
    expect(parsearReais('1.222.544,00')).toBe(122_254_400n);
    expect(parsearReais('9,90')).toBe(990n);
    expect(parsearReais('5,98')).toBe(598n);
  });

  it('aceita valor sem centavos', () => {
    expect(parsearReais('396000')).toBe(39_600_000n);
    expect(parsearReais('230.000')).toBe(23_000_000n);
  });

  it('completa um dígito decimal solto', () => {
    expect(parsearReais('9,9')).toBe(990n);
  });

  it('ignora símbolo de moeda e espaço', () => {
    expect(parsearReais('R$ 396.000,00')).toBe(39_600_000n);
    expect(parsearReais('  1.000,50  ')).toBe(100_050n);
  });

  it('devolve null quando não há dígito', () => {
    expect(parsearReais('')).toBeNull();
    expect(parsearReais('abc')).toBeNull();
    expect(parsearReais('R$')).toBeNull();
  });

  it('faz ida e volta com o formatador sem perder centavo', () => {
    // Se o par formatar/parsear divergir, o gestor digita um valor e o sistema
    // avalia outro — o pior modo de falha possível neste formulário.
    for (const v of [0n, 5n, 990n, 39_600_000n, 122_254_400n, 9_007_199_254_740_993n]) {
      expect(parsearReais(formatarValor(v)), v.toString()).toBe(v);
    }
  });

  it('não usa ponto flutuante: preserva valores acima do inteiro seguro', () => {
    expect(parsearReais('90.071.992.547.409,93')).toBe(9_007_199_254_740_993n);
  });
});

describe('parsearInteiro', () => {
  it('lê quantidade com separador de milhar', () => {
    expect(parsearInteiro('40.000')).toBe(40_000n);
    expect(parsearInteiro('40000')).toBe(40_000n);
  });

  it('distingue zero de ausência', () => {
    expect(parsearInteiro('0')).toBe(0n);
    expect(parsearInteiro('')).toBeNull();
  });
});
