import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Ban, CircleCheck, Clock, CircleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Selo de situação — carimbo.
 *
 * FR-029: situação NUNCA é transmitida só por cor. Todo selo carrega ícone e
 * rótulo textual, e permanece legível em escala de cinza.
 */

const variantesSelo = cva(
  'inline-flex items-center gap-1.5 rounded-selo border px-2 py-0.5 ' +
    'font-dado text-2xs font-medium uppercase tracking-wider [&_svg]:size-3.5',
  {
    variants: {
      situacao: {
        bloqueado: 'border-bloqueio/30 bg-bloqueio-tenue text-bloqueio',
        liberado: 'border-liberado/30 bg-liberado-tenue text-liberado',
        retido: 'border-retido/30 bg-retido-tenue text-retido',
        divergente: 'border-retido/30 bg-retido-tenue text-retido',
        neutro: 'border-regua-forte/40 bg-placa text-grafite',
      },
    },
    defaultVariants: { situacao: 'neutro' },
  },
);

const icones = {
  bloqueado: Ban,
  liberado: CircleCheck,
  retido: Clock,
  divergente: CircleAlert,
  neutro: Info,
} as const;

export interface SeloProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantesSelo> {
  /** Rótulo textual. Obrigatório: a cor sozinha não comunica (FR-029). */
  children: React.ReactNode;
}

export function Selo({ className, situacao = 'neutro', children, ...props }: SeloProps) {
  const Icone = icones[situacao ?? 'neutro'];
  return (
    <span className={cn(variantesSelo({ situacao }), className)} {...props}>
      <Icone aria-hidden="true" />
      {children}
    </span>
  );
}

export { variantesSelo };
