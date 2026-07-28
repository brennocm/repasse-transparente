import type { Municipio, Escola } from '@/dominio/tipos';

/**
 * Município e escolas — **inteiramente fictícios** (Princípio I, FR-045, FR-046).
 *
 * A unidade federativa também é inventada. Um município fictício dentro de um
 * estado real convidaria à associação com localidades existentes; um estado
 * inventado remove a ambiguidade.
 */

export const MUNICIPIO: Municipio = {
  id: 'mun-serra-do-cedro',
  nome: 'Serra do Cedro',
  uf: 'VN',
  ufNome: 'Vale Norte',
  populacao: 78_400,
  /** R$ 2,10 por refeição. Parâmetro de demonstração, declarado na interface. */
  custoRefeicaoCentavos: 210n,
};

/**
 * Doze escolas. Nomes derivados de topônimos fictícios, evitando homenagem a
 * pessoas — reduz a chance de coincidência com instituição real.
 *
 * CMEIs servem duas refeições por aluno; escolas municipais, cerca de 1,4.
 * Os totais do município são **derivados** desta lista, nunca escritos à mão:
 * ver `TOTAL_ALUNOS` e `TOTAL_REFEICOES_DIA`.
 */
export const ESCOLAS: readonly Escola[] = [
  { id: 'esc-01', municipioId: MUNICIPIO.id, nome: 'EM Serra Azul', bairro: 'Centro', alunos: 1340, refeicoesDia: 1875 },
  { id: 'esc-02', municipioId: MUNICIPIO.id, nome: 'EM Córrego Fundo', bairro: 'Córrego Fundo', alunos: 1060, refeicoesDia: 1475 },
  { id: 'esc-03', municipioId: MUNICIPIO.id, nome: 'EM Vila Nova do Cedro', bairro: 'Vila Nova', alunos: 1180, refeicoesDia: 1640 },
  { id: 'esc-04', municipioId: MUNICIPIO.id, nome: 'EM Jardim das Acácias', bairro: 'Jardim das Acácias', alunos: 940, refeicoesDia: 1305 },
  { id: 'esc-05', municipioId: MUNICIPIO.id, nome: 'EM Boa Fonte', bairro: 'Boa Fonte', alunos: 820, refeicoesDia: 1140 },
  { id: 'esc-06', municipioId: MUNICIPIO.id, nome: 'EM Alto da Pedreira', bairro: 'Alto da Pedreira', alunos: 740, refeicoesDia: 1030 },
  { id: 'esc-07', municipioId: MUNICIPIO.id, nome: 'EM Ribeirão Claro', bairro: 'Ribeirão Claro', alunos: 670, refeicoesDia: 930 },
  { id: 'esc-08', municipioId: MUNICIPIO.id, nome: 'CMEI Girassol', bairro: 'Centro', alunos: 440, refeicoesDia: 880 },
  { id: 'esc-09', municipioId: MUNICIPIO.id, nome: 'CMEI Bem-Me-Quer', bairro: 'Vila Nova', alunos: 410, refeicoesDia: 820 },
  { id: 'esc-10', municipioId: MUNICIPIO.id, nome: 'CMEI Pitangueira', bairro: 'Boa Fonte', alunos: 375, refeicoesDia: 750 },
  { id: 'esc-11', municipioId: MUNICIPIO.id, nome: 'EM Morro Branco', bairro: 'Morro Branco', alunos: 1105, refeicoesDia: 1535 },
  { id: 'esc-12', municipioId: MUNICIPIO.id, nome: 'EM Campo Verde', bairro: 'Campo Verde', alunos: 770, refeicoesDia: 1070 },
];

/** Derivado. Nunca escrever este número à mão — foi assim que ele deixou de fechar. */
export const TOTAL_ALUNOS = ESCOLAS.reduce((s, e) => s + e.alunos, 0);

/** Derivado, pelo mesmo motivo. */
export const TOTAL_REFEICOES_DIA = ESCOLAS.reduce((s, e) => s + e.refeicoesDia, 0);
