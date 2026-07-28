import { FlaskConical } from 'lucide-react';

/**
 * Faixa de ambiente de demonstração.
 *
 * FR-047: presente em toda rota, incluindo as públicas. Não dispensável — não há
 * botão de fechar. Princípio I da Constituição: todo dado do protótipo é fictício
 * e isso precisa ser declarado onde o visitante não tenha como não ver.
 */
export function FaixaDemonstracao() {
  return (
    <div className="border-b border-retido/30 bg-retido-tenue">
      <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-2xs text-tinta">
        <FlaskConical aria-hidden="true" className="size-3.5 shrink-0 text-retido" />
        <span>
          <strong className="font-semibold">Ambiente de demonstração.</strong> Dados
          fictícios. Nenhum município, escola, empresa ou pessoa aqui é real, e não há
          blockchain — a lógica do contrato é simulada.
        </span>
      </p>
    </div>
  );
}
