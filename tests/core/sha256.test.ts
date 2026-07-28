/**
 * T008 — conformidade do SHA-256 (FR-012).
 *
 * Um SHA-256 sutilmente errado produziria uma cadeia internamente consistente e
 * externamente inverificável: a verificação de integridade passaria, e ninguém de
 * fora conseguiria confirmar nada. É o pior modo de falha possível para este
 * projeto — daí a exigência de vetores conhecidos.
 */

import { describe, it, expect } from 'vitest';
import { sha256 } from '@/core/sha256';

describe('sha256', () => {
  it('confere com o vetor da cadeia vazia', () => {
    expect(sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('confere com o vetor "abc"', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('confere com mensagem de 56 bytes, que força um segundo bloco de preenchimento', () => {
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('trata acento e símbolo como UTF-8', () => {
    // Os dados do protótipo são em português e contêm cifrão e travessão. Uma
    // implementação que truncasse para Latin-1 passaria nos vetores ASCII acima
    // e quebraria em produção.
    expect(sha256('ação escolar — R$ 5,20')).toBe(
      'ae728394ac7e1bd1b40699d013c3f4200b1ba7fd13584768d4f090e079d0e06c',
    );
  });

  it('devolve sempre 64 caracteres hexadecimais minúsculos', () => {
    for (const entrada of ['', 'a', 'x'.repeat(1000), 'ção']) {
      expect(sha256(entrada)).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('é determinístico', () => {
    expect(sha256('mesma entrada')).toBe(sha256('mesma entrada'));
  });

  it('muda por completo com alteração de um único bit', () => {
    const a = sha256('repasse 396000');
    const b = sha256('repasse 396001');
    expect(a).not.toBe(b);
  });
});
