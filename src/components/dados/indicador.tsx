import { cn } from '@/lib/utils';

/**
 * Indicador — número grande com rótulo e, quando monetário, a tradução em
 * impacto (FR-024, FR-025, Princípio IV).
 *
 * Todo valor bloqueado aparece acompanhado de quantas refeições ele preserva.
 * Um número em reais sozinho não responde à pergunta que a banca faz: o que
 * isso muda para uma criança?
 */

export type TomIndicador = 'neutro' | 'bloqueio' | 'liberado' | 'retido' | 'indice';

const CORES: Record<TomIndicador, string> = {
  neutro: 'var(--color-tinta)',
  bloqueio: 'var(--color-bloqueio)',
  liberado: 'var(--color-liberado)',
  retido: 'var(--color-retido)',
  indice: 'var(--color-indice)',
};

export interface IndicadorProps {
  readonly rotulo: string;
  readonly valor: string;
  readonly impacto?: string;
  readonly nota?: string;
  readonly tom?: TomIndicador;
  readonly destaque?: boolean;
  readonly className?: string;
}

export function Indicador({
  rotulo,
  valor,
  impacto,
  nota,
  tom = 'neutro',
  destaque = false,
  className,
}: IndicadorProps) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="sobrescrito">{rotulo}</p>
      <p
        className={cn(
          'dado leading-none font-semibold',
          destaque ? 'text-lg' : 'text-md',
        )}
        style={{ color: CORES[tom] }}
      >
        {valor}
      </p>
      {impacto !== undefined && (
        <p className="text-2xs text-grafite">
          <span className="dado font-medium text-tinta">{impacto}</span>
        </p>
      )}
      {nota !== undefined && <p className="text-2xs text-grafite">{nota}</p>}
    </div>
  );
}

/** Grade de indicadores. Uma coluna no celular, sem apertar os números. */
export function GradeIndicadores({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Três por linha, não seis: valores em mono precisam de ~180px para
        // não quebrar, e seis colunas dariam 161px em telas grandes.
        'grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
