import type { Centavos, Instante } from '@/core/tipos';

/**
 * Formatação pt-BR.
 *
 * **Nenhuma aritmética de ponto flutuante em nenhum ponto**, nem mesmo aqui: os
 * centavos são separados por divisão inteira e o agrupamento de milhar é feito
 * pelo `Intl` sobre um `bigint`. Converter para `number` funcionaria nesta escala
 * e abriria precedente para o mesmo atalho num cálculo — que é onde ele vira bug
 * (FR-007).
 */

const AGRUPAMENTO = new Intl.NumberFormat('pt-BR');

/** `19_801_000n` → `"198.010,00"` */
export function formatarValor(centavos: Centavos): string {
  const negativo = centavos < 0n;
  const absoluto = negativo ? -centavos : centavos;

  const reais = absoluto / 100n;
  const resto = absoluto % 100n;

  const texto = `${AGRUPAMENTO.format(reais)},${resto.toString().padStart(2, '0')}`;
  return negativo ? `-${texto}` : texto;
}

/**
 * `19_801_000n` → `"R$ 198.010,00"`, com espaço **inseparável**.
 *
 * Sem ele, o símbolo se separa do número na quebra de linha e o indicador exibe
 * "R$" sozinho numa linha — que foi exatamente o que aconteceu no painel.
 */
export function formatarReais(centavos: Centavos): string {
  return `R$\u00A0${formatarValor(centavos)}`;
}

/** `94_290n` → `"94.290"` */
export function formatarInteiro(valor: bigint | number): string {
  return AGRUPAMENTO.format(typeof valor === 'bigint' ? valor : BigInt(Math.trunc(valor)));
}

/** `90n` → `"+90%"`. O sinal é explícito: sobrepreço nunca deve parecer desconto. */
export function formatarPercentual(valor: bigint): string {
  const sinal = valor > 0n ? '+' : '';
  return `${sinal}${valor}%`;
}

/** Quantidade com unidade: `"40.000 L"` */
export function formatarQuantidade(quantidade: bigint, unidade: string): string {
  return `${AGRUPAMENTO.format(quantidade)} ${unidade}`;
}

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function formatarData(instante: Instante): string {
  return DATA.format(new Date(instante));
}

export function formatarDataHora(instante: Instante): string {
  return DATA_HORA.format(new Date(instante));
}

/** Hash abreviado para listagem: `"a3f91c…7b2e"` */
export function abreviarHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

/** Endereço abreviado: `"0xa1a1…a1a1"` */
export function abreviarEndereco(endereco: string): string {
  if (endereco.length <= 12) return endereco;
  return `${endereco.slice(0, 6)}…${endereco.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * `"396.000,00"` → `39_600_000n`. Devolve `null` quando não há dígito algum.
 *
 * Sem `parseFloat` em ponto nenhum: os dígitos são lidos como texto e
 * concatenados. `parseFloat('396000.00') * 100` já erra por arredondamento em
 * valores maiores, e este é o número que decide se um repasse passa.
 */
export function parsearReais(texto: string): Centavos | null {
  const limpo = texto.trim();
  if (limpo === '') return null;

  const negativo = limpo.startsWith('-');
  // Separador decimal é a última vírgula ou o último ponto seguido de 1–2 dígitos.
  const m = /^[^\d]*([\d.\s]*?)(?:([.,])(\d{1,2}))?[^\d]*$/.exec(limpo);
  if (m === null) return null;

  const inteiros = (m[1] ?? '').replace(/\D/g, '');
  const decimais = (m[3] ?? '').padEnd(2, '0');
  if (inteiros === '' && (m[3] ?? '') === '') return null;

  const valor = BigInt(`${inteiros === '' ? '0' : inteiros}${decimais}`);
  return negativo ? -valor : valor;
}

/** `"40.000"` → `40_000n`. Devolve `null` quando não há dígito algum. */
export function parsearInteiro(texto: string): bigint | null {
  const digitos = texto.replace(/\D/g, '');
  return digitos === '' ? null : BigInt(digitos);
}
