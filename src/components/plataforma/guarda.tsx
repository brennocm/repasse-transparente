'use client';

import Link from 'next/link';
import { Lock, UserRoundCog } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { DESCRICAO_PAPEL, perfilDoPapel, verificarAcesso } from '@/adapter/sessao';
import type { Papel } from '@/dominio/tipos';
import { Botao } from '@/components/ui/button';

/**
 * Guarda de papel (FR-021).
 *
 * Papel incorreto **não** redireciona em silêncio: explica o que aconteceu e
 * oferece a troca. A segregação de papéis é parte do que está sendo demonstrado
 * — escondê-la desperdiça a demonstração e deixa o avaliador sem entender por
 * que a tela mudou sozinha.
 */
export function GuardaPapel({
  papel,
  children,
}: {
  papel: Papel;
  children: React.ReactNode;
}) {
  const { perfil, despachar, hidratado } = useApp();
  const acesso = verificarAcesso(perfil, papel);

  // Antes da hidratação o estado ainda é o semeado, sem sessão. Bloquear aqui
  // faria a tela piscar "sem acesso" para quem está autenticado.
  if (!hidratado) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-xs text-grafite">Carregando…</main>
    );
  }

  if (acesso.permitido) return <>{children}</>;

  const sugerido = perfilDoPapel(papel);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Lock aria-hidden="true" className="size-6 text-retido" />
      <p className="sobrescrito mt-3">
        {acesso.motivo === 'sem-sessao' ? 'Acesso restrito' : 'Perfil incorreto'}
      </p>
      <h1 className="mt-2">
        Esta área é de {DESCRICAO_PAPEL[papel]}
      </h1>
      <p className="mt-4 text-xs text-grafite">{acesso.explicacao}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {sugerido !== undefined && (
          <Botao
            onClick={() => despachar({ tipo: 'entrar', perfilId: sugerido.id })}
          >
            <UserRoundCog className="size-4" />
            Entrar como {sugerido.nome}
          </Botao>
        )}
        <Botao asChild variante="contorno">
          <Link href="/entrar">Ver todos os perfis</Link>
        </Botao>
        <Botao asChild variante="discreto">
          <Link href="/transparencia">Painel público</Link>
        </Botao>
      </div>

      <p className="mt-6 text-2xs text-grafite">
        A separação de papéis é parte do que este protótipo demonstra: cada ator vê e
        pode fazer apenas o que lhe cabe. O painel público, por outro lado, não exige
        perfil algum.
      </p>
    </main>
  );
}
