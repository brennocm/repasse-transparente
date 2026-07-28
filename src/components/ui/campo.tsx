import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Campos de formulário.
 *
 * Entrada numérica usa a voz do dado — monoespaçada e tabular — porque é um
 * número conferível (ver `design-direction.md`, Tipografia).
 */

export interface EntradaProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Aplica a voz do dado. Use em toda entrada de valor, quantidade ou percentual. */
  numerica?: boolean;
}

export const Entrada = React.forwardRef<HTMLInputElement, EntradaProps>(
  ({ className, numerica = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-selo border border-regua-forte bg-papel px-3 text-xs',
        'placeholder:text-grafite/60 disabled:cursor-not-allowed disabled:opacity-50',
        numerica && 'dado text-right',
        className,
      )}
      {...props}
    />
  ),
);
Entrada.displayName = 'Entrada';

export const Selecao = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-selo border border-regua-forte bg-papel px-3 text-xs',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Selecao.displayName = 'Selecao';

export function Rotulo({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-xs font-medium text-tinta', className)} {...props} />
  );
}

/**
 * Auxílio ou erro do campo. Um erro explica o que aconteceu e como corrigir,
 * na voz da interface — nunca pede desculpas nem é vago.
 */
export function AuxilioCampo({
  erro = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { erro?: boolean }) {
  return (
    <p
      className={cn('text-2xs', erro ? 'text-bloqueio' : 'text-grafite', className)}
      {...props}
    />
  );
}
