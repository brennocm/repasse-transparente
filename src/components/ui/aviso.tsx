import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Info, TriangleAlert, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Aviso.
 *
 * Falha e vazio são momentos de direção, não de humor: explicam o que aconteceu
 * e como resolver, na voz da interface. Avisos não pedem desculpas e nunca são
 * vagos sobre o que houve.
 */

const variantesAviso = cva('rounded-ficha border p-4 text-xs', {
  variants: {
    tom: {
      informativo: 'border-indice/25 bg-placa text-tinta',
      atencao: 'border-retido/30 bg-retido-tenue text-tinta',
      bloqueio: 'border-bloqueio/30 bg-bloqueio-tenue text-tinta',
    },
  },
  defaultVariants: { tom: 'informativo' },
});

const icones = {
  informativo: Info,
  atencao: TriangleAlert,
  bloqueio: Ban,
} as const;

const coresIcone = {
  informativo: 'text-indice',
  atencao: 'text-retido',
  bloqueio: 'text-bloqueio',
} as const;

export interface AvisoProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof variantesAviso> {
  titulo?: string;
}

export function Aviso({ className, tom = 'informativo', titulo, children, ...props }: AvisoProps) {
  const chave = tom ?? 'informativo';
  const Icone = icones[chave];
  return (
    <div role="note" className={cn(variantesAviso({ tom }), className)} {...props}>
      <div className="flex gap-3">
        <Icone aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', coresIcone[chave])} />
        <div className="min-w-0 space-y-1">
          {titulo ? <p className="font-semibold">{titulo}</p> : null}
          <div className="text-grafite [&_strong]:text-tinta">{children}</div>
        </div>
      </div>
    </div>
  );
}

export { variantesAviso };
