'use client';

import { useApp } from '@/app/provedor';
import { DESCRICAO_PAPEL } from '@/adapter/sessao';

/**
 * Moldura da área autenticada.
 *
 * A guarda de papel é aplicada por página, com `<GuardaPapel>` — cada rota sabe
 * qual papel exige, e um layout não teria como saber.
 */
export default function LayoutPlataforma({ children }: { children: React.ReactNode }) {
  const { perfil } = useApp();

  return (
    <>
      {perfil !== null && (
        <div className="border-b border-regua bg-placa">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2">
            <span className="sobrescrito">Você está como</span>
            <span className="text-xs font-medium">{perfil.nome}</span>
            <span className="text-2xs text-grafite">
              {perfil.cargo} · {DESCRICAO_PAPEL[perfil.papel]}
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
