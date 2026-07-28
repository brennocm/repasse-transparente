import type { Endereco } from '@/core/tipos';
import type { Fornecedor } from '@/dominio/tipos';

/**
 * Cinco fornecedores, **todos fictícios** (FR-045, FR-046).
 *
 * Os CNPJ têm **dígito verificador deliberadamente inválido**. Um CNPJ
 * sintaticamente válido poderia coincidir com empresa real — e este protótipo
 * associa fornecedores a superfaturamento. A invalidade é garantida por teste em
 * `tests/mocks/fornecedores.test.ts`, não por confiança.
 */

function endereco(prefixo: string): Endereco {
  return '0x' + prefixo.repeat(20);
}

export const FORNECEDORES: readonly Fornecedor[] = [
  {
    id: 'for-01',
    endereco: endereco('d1'),
    nome: 'Distribuidora Vale Alimentos LTDA',
    cnpjFicticio: '41.207.833/0001-17',
    porte: 'medio',
  },
  {
    id: 'for-02',
    endereco: endereco('d2'),
    nome: 'Atacadão Cedro Norte LTDA',
    cnpjFicticio: '58.914.702/0001-49',
    porte: 'grande',
  },
  {
    id: 'for-03',
    endereco: endereco('d3'),
    nome: 'Comercial Bom Prato ME',
    cnpjFicticio: '27.036.451/0001-83',
    porte: 'pequeno',
  },
  {
    id: 'for-04',
    endereco: endereco('d4'),
    nome: 'Hortifruti Boa Fonte EIRELI',
    cnpjFicticio: '63.285.190/0001-26',
    porte: 'pequeno',
  },
  {
    id: 'for-05',
    endereco: endereco('d5'),
    nome: 'Cooperativa Agrofamiliar Serra Verde',
    cnpjFicticio: '19.470.368/0001-55',
    porte: 'pequeno',
  },
];

/**
 * Calcula os dois dígitos verificadores de um CNPJ pelo algoritmo oficial.
 * Existe para **provar a invalidade** dos CNPJ fictícios, não para validar
 * entrada de usuário — não há entrada de CNPJ neste protótipo.
 */
export function digitosVerificadores(base12: string): string {
  const calcular = (digitos: string, pesos: readonly number[]): number => {
    const soma = digitos
      .split('')
      .reduce((s, d, i) => s + Number(d) * (pesos[i] ?? 0), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcular(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcular(`${base12}${d1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${d1}${d2}`;
}

/** `41.207.833/0001-17` → `{ base: '412078330001', dv: '17' }` */
export function partesCnpj(cnpj: string): { base: string; dv: string } {
  const digitos = cnpj.replace(/\D/g, '');
  return { base: digitos.slice(0, 12), dv: digitos.slice(12) };
}
