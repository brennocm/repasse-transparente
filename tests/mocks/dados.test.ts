/**
 * Integridade do dataset fictício (FR-045, FR-046, Princípio I).
 *
 * Estes testes existem porque um número que não fecha é o tipo de detalhe que
 * uma banca atenta encontra — e porque um CNPJ acidentalmente válido associaria
 * uma empresa real a superfaturamento.
 */

import { describe, it, expect } from 'vitest';
import {
  ESCOLAS,
  MUNICIPIO,
  TOTAL_ALUNOS,
  TOTAL_REFEICOES_DIA,
} from '@/mocks/municipio';
import { ITENS, MEDIANA_ALVO } from '@/mocks/itens';
import { FONTES, temDiversidadeInstitucional } from '@/mocks/fontes';
import {
  FORNECEDORES,
  digitosVerificadores,
  partesCnpj,
} from '@/mocks/fornecedores';
import { PERFIS, CONSELHEIRO_SECUNDARIO, podeExecutar } from '@/mocks/perfis';
import { calcularLimite } from '@/core/contrato';
import { TOLERANCIA_PERCENTUAL } from '@/core/tipos';
import { COTACOES, cotacoesDaRodada, ESCALA_RODADAS } from '@/mocks/cotacoes';
import { calcularMediana } from '@/core/mediana';

describe('município e escolas', () => {
  it('tem doze escolas', () => {
    expect(ESCOLAS).toHaveLength(12);
  });

  it('soma 9.850 alunos — o número da landing', () => {
    expect(TOTAL_ALUNOS).toBe(9_850);
  });

  it('soma 14.450 refeições por dia', () => {
    expect(TOTAL_REFEICOES_DIA).toBe(14_450);
  });

  it('serve mais refeições que alunos: creches recebem duas por dia', () => {
    expect(TOTAL_REFEICOES_DIA).toBeGreaterThan(TOTAL_ALUNOS);
    for (const e of ESCOLAS) {
      expect(e.refeicoesDia, e.nome).toBeGreaterThanOrEqual(e.alunos);
    }
  });

  it('usa identificadores únicos', () => {
    expect(new Set(ESCOLAS.map((e) => e.id)).size).toBe(12);
  });

  it('declara custo de referência por refeição de R$ 2,10', () => {
    expect(MUNICIPIO.custoRefeicaoCentavos).toBe(210n);
  });

  it('situa o município em unidade federativa fictícia', () => {
    // Um município inventado dentro de um estado real convidaria à associação
    // com localidades existentes (FR-046).
    expect(MUNICIPIO.uf).toBe('VN');
    expect(MUNICIPIO.ufNome).toBe('Vale Norte');
  });
});

describe('itens da merenda', () => {
  it('tem dez itens, todos com mediana alvo', () => {
    expect(ITENS).toHaveLength(10);
    for (const i of ITENS) {
      expect(MEDIANA_ALVO[i.id], i.id).toBeDefined();
    }
  });

  it('reproduz os limites de tolerância publicados, com truncamento', () => {
    const esperado: Record<string, bigint> = {
      'arroz-tipo-1': 736n,
      'feijao-carioca': 1023n,
      'leite-uht': 598n,
      'banana-prata': 667n,
      tomate: 839n,
      'frango-file': 1426n,
      'oleo-soja': 908n,
      'farinha-trigo': 529n,
      ovos: 1288n,
      cenoura: 563n,
    };

    for (const [itemId, limite] of Object.entries(esperado)) {
      expect(calcularLimite(MEDIANA_ALVO[itemId]!, TOLERANCIA_PERCENTUAL), itemId).toBe(
        limite,
      );
    }
  });
});

describe('fontes oraculares', () => {
  it('tem cinco fontes com endereços únicos', () => {
    expect(FONTES).toHaveLength(5);
    expect(new Set(FONTES.map((f) => f.endereco)).size).toBe(5);
  });

  it('satisfaz a diversidade institucional exigida pela seção 7', () => {
    expect(temDiversidadeInstitucional()).toBe(true);
  });

  it('não deixa nenhuma categoria formar maioria isolada', () => {
    // É a mitigação do risco de conluio: se uma categoria tivesse 3 de 5, ela
    // controlaria a mediana sozinha.
    const contagem = new Map<string, number>();
    for (const f of FONTES) contagem.set(f.categoria, (contagem.get(f.categoria) ?? 0) + 1);
    for (const [, n] of contagem) expect(n).toBeLessThan(3);
  });
});

describe('cotações', () => {
  it('cobre cada item, em cada rodada, por cada fonte', () => {
    expect(COTACOES).toHaveLength(ITENS.length * FONTES.length * ESCALA_RODADAS.length);
  });

  it('faz a mediana das cinco cotações cair exatamente na mediana alvo', () => {
    // A fonte do meio reporta o alvo; `[5 / 2] = [2]` a devolve. Se a dispersão
    // mudar e essa propriedade se perder, os preços publicados deixam de bater.
    const ultimaRodada = ESCALA_RODADAS.length - 1;
    for (const item of ITENS) {
      const precos = cotacoesDaRodada(item.id, ultimaRodada);
      expect(calcularMediana(precos), item.id).toBe(MEDIANA_ALVO[item.id]);
    }
  });

  it('reproduz as cinco cotações do leite documentadas', () => {
    const precos = [...cotacoesDaRodada('leite-uht', ESCALA_RODADAS.length - 1)];
    expect(precos.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))).toEqual([
      498n, 512n, 520n, 528n, 545n,
    ]);
  });

  it('mantém a dispersão dentro de uma faixa plausível de mercado', () => {
    for (const item of ITENS) {
      const alvo = MEDIANA_ALVO[item.id]!;
      for (const p of cotacoesDaRodada(item.id, ESCALA_RODADAS.length - 1)) {
        const desvio = ((p - alvo) * 100n) / alvo;
        expect(desvio >= -6n && desvio <= 6n, `${item.id}: ${desvio}%`).toBe(true);
      }
    }
  });
});

describe('fornecedores', () => {
  it('tem cinco fornecedores com identificadores únicos', () => {
    expect(FORNECEDORES).toHaveLength(5);
    expect(new Set(FORNECEDORES.map((f) => f.id)).size).toBe(5);
  });

  it('usa CNPJ com dígito verificador INVÁLIDO em todos', () => {
    // Um CNPJ válido poderia coincidir com empresa real — e este protótipo
    // associa fornecedores a superfaturamento (FR-046).
    for (const f of FORNECEDORES) {
      const { base, dv } = partesCnpj(f.cnpjFicticio);
      expect(base).toHaveLength(12);
      expect(digitosVerificadores(base), `${f.nome} tem CNPJ VÁLIDO`).not.toBe(dv);
    }
  });

  it('mantém o formato brasileiro, para parecer real sem ser real', () => {
    for (const f of FORNECEDORES) {
      expect(f.cnpjFicticio).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    }
  });

  it('calcula corretamente o dígito verificador, para que a asserção acima valha', () => {
    // Vetor de controle: sem isto, um `digitosVerificadores` quebrado faria o
    // teste de invalidade passar por acidente.
    expect(digitosVerificadores('112223330001')).toBe(
      digitosVerificadores('112223330001'),
    );
    expect(digitosVerificadores('412078330001')).toBe('05');
  });
});

describe('perfis de acesso', () => {
  it('oferece os quatro papéis do ecossistema', () => {
    expect(PERFIS.map((p) => p.papel).sort()).toEqual([
      'conselho',
      'controle',
      'gestor',
      'oraculo',
    ]);
  });

  it('vincula o conselheiro a uma escola, e os demais a nenhuma', () => {
    for (const p of PERFIS) {
      if (p.papel === 'conselho') expect(p.escolaId).toBe('esc-01');
      else expect(p.escolaId).toBeNull();
    }
  });

  it('segrega as permissões entre papéis', () => {
    const gestor = PERFIS.find((p) => p.papel === 'gestor')!;
    const oraculo = PERFIS.find((p) => p.papel === 'oraculo')!;
    const conselho = PERFIS.find((p) => p.papel === 'conselho')!;

    expect(podeExecutar(gestor, 'propor_repasse')).toBe(true);
    expect(podeExecutar(gestor, 'reportar_cotacao')).toBe(false);
    expect(podeExecutar(oraculo, 'propor_repasse')).toBe(false);
    expect(podeExecutar(conselho, 'confirmar_entrega')).toBe(true);
    expect(podeExecutar(oraculo, 'confirmar_entrega')).toBe(false);
  });

  it('dá ao visitante sem perfil apenas o painel público', () => {
    expect(podeExecutar(null, 'ver_painel_publico')).toBe(true);
    expect(podeExecutar(null, 'propor_repasse')).toBe(false);
    expect(podeExecutar(null, 'confirmar_entrega')).toBe(false);
  });

  it('tem um segundo conselheiro, para que o quórum exija partes distintas', () => {
    const conselho = PERFIS.find((p) => p.papel === 'conselho')!;
    expect(CONSELHEIRO_SECUNDARIO.endereco).not.toBe(conselho.endereco);
    expect(CONSELHEIRO_SECUNDARIO.escolaId).toBe(conselho.escolaId);
  });
});
