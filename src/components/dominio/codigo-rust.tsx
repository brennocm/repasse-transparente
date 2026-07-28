import { cn } from '@/lib/utils';

/**
 * Realce de sintaxe para Rust, feito à mão.
 *
 * Uma biblioteca de realce custaria dezenas de KB no bundle para colorir um
 * único trecho de código. São quatro categorias e um tokenizador de trinta
 * linhas — e o controle total sobre as cores garante que o contraste continue
 * dentro do sistema de design.
 */

type Categoria = 'comentario' | 'texto' | 'macro' | 'palavra' | 'tipo' | 'normal';

const COR: Record<Categoria, string> = {
  comentario: 'var(--color-grafite)',
  texto: 'var(--color-liberado)',
  macro: 'var(--color-retido)',
  palavra: 'var(--color-indice)',
  tipo: 'var(--color-bloqueio)',
  normal: 'var(--color-tinta)',
};

const PADRAO = new RegExp(
  [
    '(?<comentario>\\/\\/[^\\n]*)',
    '(?<texto>"(?:[^"\\\\]|\\\\.)*")',
    '(?<macro>#\\[[^\\]]*\\]|\\b[a-z_]+!)',
    '(?<palavra>\\b(?:pub|fn|let|mut|use|const|struct|impl|mod|return|if|else|match|for|in|as|self|super|crate|true|false)\\b)',
    '(?<tipo>\\b(?:u8|u64|i64|bool|Result|Context|Vec|Pubkey|Ok|Err|String|Transfer|CpiContext|Clock|Token|TokenAccount|Erro)\\b)',
  ].join('|'),
  'g',
);

function categoria(grupos: Record<string, string | undefined>): Categoria {
  if (grupos['comentario'] !== undefined) return 'comentario';
  if (grupos['texto'] !== undefined) return 'texto';
  if (grupos['macro'] !== undefined) return 'macro';
  if (grupos['palavra'] !== undefined) return 'palavra';
  if (grupos['tipo'] !== undefined) return 'tipo';
  return 'normal';
}

function tokenizar(linha: string): readonly { texto: string; cat: Categoria }[] {
  const saida: { texto: string; cat: Categoria }[] = [];
  let ultimo = 0;

  for (const m of linha.matchAll(PADRAO)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) {
      saida.push({ texto: linha.slice(ultimo, inicio), cat: 'normal' });
    }
    saida.push({ texto: m[0], cat: categoria(m.groups ?? {}) });
    ultimo = inicio + m[0].length;
  }

  if (ultimo < linha.length) {
    saida.push({ texto: linha.slice(ultimo), cat: 'normal' });
  }
  return saida;
}

export function CodigoRust({
  fonte,
  className,
}: {
  fonte: string;
  className?: string;
}) {
  const linhas = fonte.split('\n');

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-ficha border border-regua bg-placa',
        className,
      )}
    >
      <pre className="dado min-w-max py-4 text-2xs leading-relaxed">
        <code>
          {linhas.map((linha, i) => (
            <span key={i} className="grid grid-cols-[3rem_1fr]">
              <span
                aria-hidden="true"
                className="pr-3 text-right select-none"
                style={{ color: 'var(--color-regua-forte)' }}
              >
                {i + 1}
              </span>
              <span className="pr-4">
                {tokenizar(linha).map((t, j) => (
                  <span key={j} style={{ color: COR[t.cat] }}>
                    {t.texto}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
