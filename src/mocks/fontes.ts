import type { Endereco } from '@/core/tipos';
import type { Fonte } from '@/dominio/tipos';

/**
 * Cinco fontes oraculares, **todas fictícias**.
 *
 * A diversidade institucional exigida pela seção 7 da proposta está satisfeita:
 * duas oficiais, uma intermunicipal, duas de sociedade civil. Nenhuma categoria
 * isolada forma maioria — é a mitigação do risco de conluio.
 *
 * Instituições reais (CEASA, ComprasNet, SINAPI) aparecem apenas em texto
 * descritivo da arquitetura pretendida, nunca como autoras de dado fabricado
 * (FR-046).
 */

function endereco(prefixo: string): Endereco {
  return '0x' + prefixo.repeat(20);
}

export const FONTES: readonly Fonte[] = [
  {
    endereco: endereco('a1'),
    nome: 'Central de Abastecimento do Vale Norte',
    nomeCurto: 'Central de Abastecimento',
    categoria: 'oficial',
    descricao:
      'Entreposto atacadista estadual. Publica preços praticados no mercado de abastecimento, com apuração diária.',
  },
  {
    endereco: endereco('a2'),
    nome: 'Observatório de Preços — Universidade Estadual do Vale Norte',
    nomeCurto: 'Observatório Universitário',
    categoria: 'oficial',
    descricao:
      'Grupo de pesquisa em economia agrícola. Coleta independente, com metodologia publicada e revisão acadêmica.',
  },
  {
    endereco: endereco('b1'),
    nome: 'Consórcio Intermunicipal de Compras da Região do Cedro',
    nomeCurto: 'Consórcio Intermunicipal',
    categoria: 'intermunicipal',
    descricao:
      'Reúne oito municípios vizinhos. Reporta preços de compras já homologadas na mesma região e no mesmo período.',
  },
  {
    endereco: endereco('c1'),
    nome: 'Cooperativa Agrofamiliar Serra Verde',
    nomeCurto: 'Cooperativa Agrofamiliar',
    categoria: 'sociedade-civil',
    descricao:
      'Cooperativa de agricultura familiar. Conhece o custo de produção local, o que a torna difícil de enganar sobre preço de hortifrúti.',
  },
  {
    endereco: endereco('c2'),
    nome: 'Associação de Produtores Rurais de Boa Fonte',
    nomeCurto: 'Associação de Produtores',
    categoria: 'sociedade-civil',
    descricao:
      'Associação comunitária de pequenos produtores. Fonte de contrapeso: não depende de contrato com a prefeitura.',
  },
];

export const ENDERECOS_FONTES: readonly Endereco[] = FONTES.map((f) => f.endereco);

/** Invariante da seção 7: pelo menos uma fonte de cada categoria. */
export function temDiversidadeInstitucional(): boolean {
  const categorias = new Set(FONTES.map((f) => f.categoria));
  return (
    categorias.has('oficial') &&
    categorias.has('intermunicipal') &&
    categorias.has('sociedade-civil')
  );
}
