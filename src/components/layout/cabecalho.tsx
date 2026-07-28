'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/provedor';
import { cn } from '@/lib/utils';
import { Botao } from '@/components/ui/button';
import { ROTA_DO_PAPEL } from '@/adapter/sessao';

const PUBLICAS = [
  { href: '/transparencia', rotulo: 'Transparência' },
  { href: '/explorador', rotulo: 'Registros' },
  { href: '/programa', rotulo: 'Programa' },
] as const;

export function Cabecalho() {
  const { perfil, despachar } = useApp();
  const caminho = usePathname();

  return (
    <header className="border-b border-regua bg-papel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          Repasse<span className="text-indice">Transparente</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {PUBLICAS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'py-1 hover:text-indice',
                caminho.startsWith(l.href) ? 'font-medium text-indice' : 'text-grafite',
              )}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {perfil === null ? (
            <Botao asChild tamanho="sm" variante="contorno">
              <Link href="/entrar">Entrar na plataforma</Link>
            </Botao>
          ) : (
            <>
              <Link
                href={ROTA_DO_PAPEL[perfil.papel]}
                className="hidden text-right leading-tight sm:block"
              >
                <span className="block text-2xs font-medium">{perfil.nome}</span>
                <span className="block text-2xs text-grafite">{perfil.cargo}</span>
              </Link>
              <Botao
                tamanho="sm"
                variante="discreto"
                onClick={() => despachar({ tipo: 'sair' })}
              >
                Sair
              </Botao>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
