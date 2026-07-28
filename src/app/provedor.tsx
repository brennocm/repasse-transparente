'use client';

import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { estadoInicial, reduzir, type Acao, type EstadoApp } from '@/adapter/estado';
import { armazenamentoPadrao, carregar, salvar } from '@/adapter/persistencia';
import { perfilDaSessao } from '@/adapter/sessao';
import type { Perfil } from '@/dominio/tipos';

interface Contexto {
  readonly app: EstadoApp;
  readonly perfil: Perfil | null;
  readonly hidratado: boolean;
  readonly despachar: (acao: Acao) => void;
}

const Ctx = createContext<Contexto | null>(null);

/**
 * Provedor de estado.
 *
 * A primeira renderização usa sempre a semeadura, igual no servidor e no
 * cliente — hidratar do `localStorage` antes disso causaria divergência de
 * marcação. O estado salvo entra no primeiro efeito, e só a partir daí o
 * armazenamento volta a ser escrito.
 */
export function Provedor({ children }: { children: React.ReactNode }) {
  const [app, despachar] = useReducer(reduzir, null, estadoInicial);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    const resultado = carregar(armazenamentoPadrao());
    if (resultado.origem === 'armazenado') {
      despachar({ tipo: 'hidratar', app: resultado.app });
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (hidratado) salvar(armazenamentoPadrao(), app);
  }, [app, hidratado]);

  return (
    <Ctx.Provider
      value={{ app, perfil: perfilDaSessao(app.sessao), hidratado, despachar }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): Contexto {
  const ctx = useContext(Ctx);
  if (ctx === null) throw new Error('useApp precisa estar dentro de <Provedor>');
  return ctx;
}
