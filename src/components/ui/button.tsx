import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Rótulo de ação sempre diz o que acontece: "Bloquear repasse", nunca "Enviar".
 * A ação mantém o mesmo nome por todo o fluxo (ver a seção de escrita da
 * direção visual).
 */
const variantesBotao = cva(
  'inline-flex items-center justify-center gap-2 rounded-selo font-texto font-medium ' +
    'transition-colors disabled:pointer-events-none disabled:opacity-50 ' +
    '[&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        principal: 'bg-indice text-papel hover:bg-indice-vivo',
        contorno:
          'border border-regua-forte bg-papel text-tinta hover:bg-placa',
        discreto: 'text-indice hover:bg-placa',
        bloqueio: 'bg-bloqueio text-papel hover:opacity-90',
        liberado: 'bg-liberado text-papel hover:opacity-90',
      },
      tamanho: {
        sm: 'h-8 px-3 text-2xs',
        md: 'h-10 px-4 text-xs',
        lg: 'h-12 px-6 text-sm',
      },
    },
    defaultVariants: { variante: 'principal', tamanho: 'md' },
  },
);

export interface BotaoProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBotao> {
  asChild?: boolean;
}

export const Botao = React.forwardRef<HTMLButtonElement, BotaoProps>(
  ({ className, variante, tamanho, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(variantesBotao({ variante, tamanho }), className)}
        {...props}
      />
    );
  },
);
Botao.displayName = 'Botao';

export { variantesBotao };
