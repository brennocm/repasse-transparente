import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tabela de conferência.
 *
 * A tabela rola dentro do próprio contêiner; o corpo da página nunca rola na
 * horizontal (NFR-002). Colunas numéricas usam a voz do dado, alinhadas à
 * direita, para que os dígitos alinhem na vertical.
 */

export function Tabela({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-xs', className)}
        {...props}
      />
    </div>
  );
}

export function TabelaCabecalho({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-placa', className)} {...props} />;
}

export function TabelaCorpo({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TabelaLinha({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-regua last:border-b-0', className)} {...props} />
  );
}

export interface CelulaProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Coluna numérica: voz do dado, alinhada à direita. */
  numerica?: boolean;
}

export function TabelaTitulo({ className, numerica, ...props }: CelulaProps) {
  return (
    <th
      scope="col"
      className={cn(
        'sobrescrito px-3 py-2 text-left font-medium whitespace-nowrap',
        numerica && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

export function TabelaCelula({
  className,
  numerica,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle',
        numerica && 'dado text-right tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Estado vazio. Uma tela vazia é convite para agir, nunca uma área em branco
 * (ver a seção de escrita da direção visual).
 */
export function TabelaVazia({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-xs text-grafite">
        {children}
      </td>
    </tr>
  );
}
