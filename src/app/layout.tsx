import type { Metadata, Viewport } from 'next';
import { Provedor } from './provedor';
import { FaixaDemonstracao } from '@/components/layout/faixa-demonstracao';
import { Cabecalho } from '@/components/layout/cabecalho';
import { Rodape } from '@/components/layout/rodape';
import './globals.css';

export const metadata: Metadata = {
  /** Título único em todo o site. Nenhuma rota o complementa nem o substitui. */
  title: 'RepasseTransparente',
  description:
    'Protótipo de demonstração: oráculos de preço e trava criptográfica que bloqueiam repasses superfaturados do PNAE antes do pagamento. Dados fictícios.',
};

export const viewport: Viewport = {
  themeColor: '#F1F3EE',
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col antialiased">
        <Provedor>
          <FaixaDemonstracao />
          <Cabecalho />
          <div className="flex-1">{children}</div>
          <Rodape />
        </Provedor>
      </body>
    </html>
  );
}
