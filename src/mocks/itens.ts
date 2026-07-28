import type { Centavos, Id } from '@/core/tipos';
import type { Item } from '@/dominio/tipos';

/**
 * Catálogo de itens da merenda. O **preço não vive aqui** — vive na conta
 * `item_preco` do programa, dentro de `EstadoPrograma.tabelaPrecos`. Este
 * módulo é catálogo; `cotacoes.ts` é o que alimenta o oráculo.
 */

export const ITENS: readonly Item[] = [
  { id: 'arroz-tipo-1', nome: 'Arroz tipo 1', unidade: 'kg', categoria: 'Grãos', perecivel: false },
  { id: 'feijao-carioca', nome: 'Feijão carioca', unidade: 'kg', categoria: 'Grãos', perecivel: false },
  { id: 'leite-uht', nome: 'Leite integral UHT', unidade: 'L', categoria: 'Laticínios', perecivel: false },
  { id: 'banana-prata', nome: 'Banana prata', unidade: 'kg', categoria: 'Hortifrúti', perecivel: true },
  { id: 'tomate', nome: 'Tomate', unidade: 'kg', categoria: 'Hortifrúti', perecivel: true },
  { id: 'frango-file', nome: 'Filé de frango congelado', unidade: 'kg', categoria: 'Proteínas', perecivel: true },
  { id: 'oleo-soja', nome: 'Óleo de soja 900ml', unidade: 'un', categoria: 'Mercearia', perecivel: false },
  { id: 'farinha-trigo', nome: 'Farinha de trigo', unidade: 'kg', categoria: 'Mercearia', perecivel: false },
  { id: 'ovos', nome: 'Ovos', unidade: 'dz', categoria: 'Proteínas', perecivel: true },
  { id: 'cenoura', nome: 'Cenoura', unidade: 'kg', categoria: 'Hortifrúti', perecivel: true },
];

/**
 * Mediana alvo de cada item, em centavos, na rodada mais recente.
 *
 * Plausíveis para 2026, porém **fictícios**: não são cotação de mercado. As
 * cotações das cinco fontes são derivadas destes valores em `cotacoes.ts`, de
 * modo que `calcularMediana` devolva exatamente o número desta tabela.
 */
export const MEDIANA_ALVO: Readonly<Record<Id, Centavos>> = {
  'arroz-tipo-1': 640n,
  'feijao-carioca': 890n,
  'leite-uht': 520n,
  'banana-prata': 580n,
  'tomate': 730n,
  'frango-file': 1240n,
  'oleo-soja': 790n,
  'farinha-trigo': 460n,
  'ovos': 1120n,
  'cenoura': 490n,
};

export function itemPorId(id: string): Item | undefined {
  return ITENS.find((i) => i.id === id);
}
