/**
 * Auxiliares de teste. Não termina em `.test.ts`, logo não é coletado como suíte.
 */

import type { EstadoPrograma, Endereco, Id, Centavos, Instante } from '@/core/tipos';
import { TOLERANCIA_PERCENTUAL, CONFIRMACOES_NECESSARIAS } from '@/core/tipos';

export const PREFEITURA: Endereco = '0x' + '9'.repeat(40);
export const FORNECEDOR: Endereco = '0x' + 'de'.repeat(20);

export const FONTE_A: Endereco = '0x' + 'a1'.repeat(20);
export const FONTE_B: Endereco = '0x' + 'a2'.repeat(20);
export const FONTE_C: Endereco = '0x' + 'b1'.repeat(20);
export const FONTE_D: Endereco = '0x' + 'c1'.repeat(20);
export const FONTE_E: Endereco = '0x' + 'c2'.repeat(20);
export const INTRUSO: Endereco = '0x' + 'ff'.repeat(20);

export const FONTES = [FONTE_A, FONTE_B, FONTE_C, FONTE_D, FONTE_E] as const;

/** Conselheiros que confirmam entrega. */
export const CONSELHO_1: Endereco = '0x' + '11'.repeat(20);
export const CONSELHO_2: Endereco = '0x' + '22'.repeat(20);

/** Instante fixo. O núcleo nunca lê o relógio (determinismo da semeadura). */
export const INSTANTE_BASE: Instante = 1770033600000; // 2026-02-02T09:00:00-03:00

/** Saldo inicial de BRZ da prefeitura: R$ 2.000.000,00. */
export const SALDO_INICIAL: Centavos = 200_000_000n;

/**
 * Estado de gênese mínimo.
 *
 * As autorizações de fonte são configuração de implantação, feitas por
 * `autorizar_fonte` no programa real.
 */
export function estadoDeTeste(
  opcoes: {
    fontesAutorizadas?: readonly Endereco[];
    tolerancia?: bigint;
    precos?: Readonly<Record<Id, Centavos>>;
    saldoPrefeitura?: Centavos;
  } = {},
): EstadoPrograma {
  const autorizadas = opcoes.fontesAutorizadas ?? FONTES;

  const estado: EstadoPrograma = {
    prefeitura: PREFEITURA,
    toleranciaPercentual: opcoes.tolerancia ?? TOLERANCIA_PERCENTUAL,
    confirmacoesNecessarias: CONFIRMACOES_NECESSARIAS,
    fontesAutorizadas: new Map(autorizadas.map((f) => [f, true])),
    tabelaPrecos: new Map(),
    cotacoesOraculo: new Map(),
    listaFontes: [...autorizadas],
    saldosBrz: new Map([[PREFEITURA, opcoes.saldoPrefeitura ?? SALDO_INICIAL]]),
    repasses: new Map(),
  };

  for (const [itemId, mediana] of Object.entries(opcoes.precos ?? {})) {
    estado.tabelaPrecos.set(itemId, {
      precoMediana: mediana,
      atualizadoEm: INSTANTE_BASE,
    });
  }

  return estado;
}

/** Acesso a índice com falha explícita — `noUncheckedIndexedAccess` está ligado. */
export function em<T>(arr: readonly T[], i: number): T {
  const v = arr[i];
  if (v === undefined) throw new Error(`índice ${i} ausente em arranjo de ${arr.length}`);
  return v;
}
