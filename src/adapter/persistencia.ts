import type { EstadoApp } from './estado';
import { VERSAO_ESTADO, estadoInicial } from './estado';

/**
 * Persistência local (FR-048, FR-049).
 *
 * Sem servidor e sem banco: o estado vive no `localStorage` do navegador. O
 * avaliador que propõe um repasse e recarrega a página não perde o que fez.
 */

export const CHAVE = `repasse-transparente:v${VERSAO_ESTADO}`;

/** Subconjunto de `Storage` que usamos — permite testar sem navegador. */
export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

// ---------------------------------------------------------------------------
// Serialização
// ---------------------------------------------------------------------------

/**
 * `bigint` e `Map` não sobrevivem a `JSON.stringify`.
 *
 * Este par replacer/reviver é o ponto de maior risco da camada: uma falha aqui
 * corrompe **silenciosamente** valores monetários — um repasse de R$ 396.000,00
 * voltaria como outra coisa, sem erro algum. Daí o teste dedicado de ida e volta.
 */

interface BigIntSerializado {
  readonly __bigint: string;
}
interface MapSerializado {
  readonly __map: readonly (readonly [unknown, unknown])[];
}

export function substituir(_chave: string, valor: unknown): unknown {
  if (typeof valor === 'bigint') return { __bigint: valor.toString(10) };
  if (valor instanceof Map) return { __map: [...valor.entries()] };
  return valor;
}

export function reviver(_chave: string, valor: unknown): unknown {
  if (typeof valor === 'object' && valor !== null) {
    if ('__bigint' in valor) {
      return BigInt((valor as BigIntSerializado).__bigint);
    }
    if ('__map' in valor) {
      return new Map((valor as MapSerializado).__map as [unknown, unknown][]);
    }
  }
  return valor;
}

export function serializar(app: EstadoApp): string {
  return JSON.stringify(app, substituir);
}

export function desserializar(texto: string): EstadoApp {
  return JSON.parse(texto, reviver) as EstadoApp;
}

// ---------------------------------------------------------------------------
// Leitura e escrita
// ---------------------------------------------------------------------------

export interface ResultadoCarregamento {
  readonly app: EstadoApp;
  readonly origem: 'armazenado' | 'semeadura';
  readonly aviso: string | null;
}

/**
 * Carrega o estado. Versão incompatível ou dado corrompido é **descartado**, não
 * migrado.
 *
 * Migrar custa mais do que vale num protótipo, e um estado meio-migrado durante
 * o pitch é pior que um estado limpo. O usuário é avisado do descarte.
 */
export function carregar(armazenamento: Armazenamento | null): ResultadoCarregamento {
  if (armazenamento === null) {
    return { app: estadoInicial(), origem: 'semeadura', aviso: null };
  }

  const bruto = armazenamento.getItem(CHAVE);
  if (bruto === null) {
    return { app: estadoInicial(), origem: 'semeadura', aviso: null };
  }

  try {
    const app = desserializar(bruto);
    if (app.versao !== VERSAO_ESTADO) {
      armazenamento.removeItem(CHAVE);
      return {
        app: estadoInicial(),
        origem: 'semeadura',
        aviso:
          'Os dados salvos eram de uma versão anterior e foram substituídos pelos dados de demonstração.',
      };
    }
    return { app, origem: 'armazenado', aviso: null };
  } catch {
    armazenamento.removeItem(CHAVE);
    return {
      app: estadoInicial(),
      origem: 'semeadura',
      aviso:
        'Os dados salvos estavam corrompidos e foram substituídos pelos dados de demonstração.',
    };
  }
}

/** Salvar nunca pode derrubar a demonstração — cota cheia ou modo privativo falham em silêncio. */
export function salvar(armazenamento: Armazenamento | null, app: EstadoApp): boolean {
  if (armazenamento === null) return false;
  try {
    armazenamento.setItem(CHAVE, serializar(app));
    return true;
  } catch {
    return false;
  }
}

export function limpar(armazenamento: Armazenamento | null): void {
  armazenamento?.removeItem(CHAVE);
}

/** `localStorage` quando existir; `null` durante a renderização no servidor. */
export function armazenamentoPadrao(): Armazenamento | null {
  if (typeof globalThis === 'undefined') return null;
  const ls = (globalThis as { localStorage?: Armazenamento }).localStorage;
  return ls ?? null;
}
