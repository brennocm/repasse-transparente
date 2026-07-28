'use client';

import Link from 'next/link';
import { useApp } from '@/app/provedor';
import { Botao } from '@/components/ui/button';

/**
 * Rodapé com a declaração de simulação (FR-054) e o comando de restauração
 * (FR-048), acessível de qualquer página.
 */
export function Rodape() {
  const { despachar } = useApp();

  return (
    <footer className="mt-16 border-t border-regua bg-placa">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="sobrescrito">Sobre esta demonstração</p>
          <p className="max-w-prose text-xs text-grafite">
            A lógica do programa inteligente é <strong className="text-tinta">simulada
            em software</strong>. Nenhuma transação toca a rede Solana e nenhum BRZ real é
            movimentado. Município, escolas, fornecedores e pessoas são fictícios.
          </p>
          <p className="max-w-prose text-xs text-grafite">
            O código do programa e a auditoria das suas limitações estão em{' '}
            <Link href="/programa" className="text-indice underline underline-offset-2">
              Programa
            </Link>
            .
          </p>
        </div>

        <div className="space-y-2 sm:justify-self-end sm:text-right">
          <p className="sobrescrito">Dados</p>
          <p className="max-w-prose text-xs text-grafite">
            Suas alterações ficam salvas neste navegador.
          </p>
          <Botao
            tamanho="sm"
            variante="contorno"
            onClick={() => despachar({ tipo: 'restaurar-tudo' })}
          >
            Restaurar dados de demonstração
          </Botao>
        </div>
      </div>

      <div className="border-t border-regua-forte/30">
        <p className="mx-auto max-w-6xl px-4 py-3 text-2xs text-grafite">
          Protótipo para o UNICEF Youth Challenge Blockchain 2026 · Ideathon UNICEF x
          Superteam Brasil / Blockchain.RIO
        </p>
      </div>
    </footer>
  );
}
