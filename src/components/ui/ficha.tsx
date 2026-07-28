import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Ficha — o bloco de conteúdo do sistema.
 *
 * Carrega um trilho de estado de 3px na borda esquerda, como a aba colorida de
 * uma pasta de processo. A cor do trilho comunica a situação, sempre acompanhada
 * de ícone e rótulo no conteúdo (FR-029).
 *
 * Ver `design-direction.md`, seção Layout.
 */

export type TrilhoFicha = 'bloqueio' | 'liberado' | 'retido' | 'indice' | 'neutro';

const trilhos: Record<TrilhoFicha, string> = {
  bloqueio: 'ficha-bloqueio',
  liberado: 'ficha-liberado',
  retido: 'ficha-retido',
  indice: 'ficha-indice',
  neutro: '',
};

export interface FichaProps extends React.HTMLAttributes<HTMLDivElement> {
  trilho?: TrilhoFicha;
}

export const Ficha = React.forwardRef<HTMLDivElement, FichaProps>(
  ({ className, trilho = 'neutro', ...props }, ref) => (
    <div ref={ref} className={cn('ficha', trilhos[trilho], className)} {...props} />
  ),
);
Ficha.displayName = 'Ficha';

export const FichaCabecalho = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 p-4 sm:p-5', className)} {...props} />
));
FichaCabecalho.displayName = 'FichaCabecalho';

/** Sobrescrito: mono, caixa alta, entreletrado. */
export const FichaSobrescrito = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('sobrescrito', className)} {...props} />
));
FichaSobrescrito.displayName = 'FichaSobrescrito';

export const FichaTitulo = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-base font-semibold', className)} {...props} />
));
FichaTitulo.displayName = 'FichaTitulo';

export const FichaCorpo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
));
FichaCorpo.displayName = 'FichaCorpo';

export const FichaRodape = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-3 border-t border-regua p-4 sm:p-5', className)}
    {...props}
  />
));
FichaRodape.displayName = 'FichaRodape';

/**
 * Linha de dado: rótulo à esquerda, valor monoespaçado à direita.
 * É a unidade atômica da ficha de conferência.
 */
export function LinhaDado({
  rotulo,
  children,
  className,
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fio flex items-baseline justify-between gap-4 py-2 last:border-b-0',
        className,
      )}
    >
      <span className="min-w-0 text-xs text-grafite">{rotulo}</span>
      {/* O valor nunca encolhe: em telas estreitas o rótulo quebra, o número não. */}
      <span className="dado shrink-0 text-xs font-medium tabular-nums">{children}</span>
    </div>
  );
}
