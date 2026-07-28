import { Building2, Lock, Truck } from 'lucide-react';
import type { Centavos } from '@/core/tipos';
import type { SituacaoRepasse } from '@/dominio/tipos';
import { formatarReais } from '@/adapter/formato';
import { cn } from '@/lib/utils';

/**
 * Barra de custódia — elemento companheiro da régua.
 *
 * A régua responde "o preço é justo?". Esta responde "onde está o dinheiro?".
 * A segunda pergunta só existe desde a liquidação em BRZ: o valor sai da conta
 * da prefeitura de verdade, e o registro contábil passa a ser o próprio
 * pagamento.
 *
 * Quando a trava bloqueia, **nada se move** — e a imobilidade é o ponto.
 */

type Etapa = 'prefeitura' | 'custodia' | 'fornecedor';

const ETAPAS: readonly {
  readonly id: Etapa;
  readonly rotulo: string;
  readonly Icone: typeof Building2;
}[] = [
  { id: 'prefeitura', rotulo: 'Prefeitura', Icone: Building2 },
  { id: 'custodia', rotulo: 'Custódia', Icone: Lock },
  { id: 'fornecedor', rotulo: 'Fornecedor', Icone: Truck },
];

export interface BarraCustodiaProps {
  readonly valor: Centavos;
  readonly situacao: SituacaoRepasse;
  readonly confirmacoes: number;
  readonly quorum: number;
  readonly vencida?: boolean;
  readonly className?: string;
}

function etapaAtual(situacao: SituacaoRepasse): Etapa {
  if (situacao === 'Rejeitado') return 'prefeitura';
  if (situacao === 'Liberado') return 'fornecedor';
  return 'custodia';
}

export function BarraCustodia({
  valor,
  situacao,
  confirmacoes,
  quorum,
  vencida = false,
  className,
}: BarraCustodiaProps) {
  const atual = etapaAtual(situacao);
  const indiceAtual = ETAPAS.findIndex((e) => e.id === atual);
  const bloqueado = situacao === 'Rejeitado';

  const cor = bloqueado
    ? 'var(--color-bloqueio)'
    : situacao === 'Liberado'
      ? 'var(--color-liberado)'
      : 'var(--color-retido)';

  return (
    <div className={cn('space-y-3', className)}>
      <ol className="flex items-stretch gap-1">
        {ETAPAS.map((etapa, i) => {
          const alcancada = i <= indiceAtual;
          const eAtual = i === indiceAtual;
          return (
            <li key={etapa.id} className="min-w-0 flex-1">
              <div
                className="h-1.5 rounded-selo"
                style={{
                  backgroundColor: alcancada ? cor : 'var(--color-regua)',
                  opacity: alcancada && !eAtual ? 0.4 : 1,
                }}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <etapa.Icone
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  style={{ color: eAtual ? cor : 'var(--color-grafite)' }}
                />
                <span
                  className={cn(
                    'truncate text-2xs',
                    eAtual ? 'font-semibold text-tinta' : 'text-grafite',
                  )}
                >
                  {etapa.rotulo}
                </span>
              </div>
              {eAtual && (
                <p className="dado mt-1 text-xs font-semibold" style={{ color: cor }}>
                  {formatarReais(valor)}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-2xs text-grafite">
        {bloqueado ? (
          <>
            <strong className="text-tinta">Nenhum valor saiu da conta da prefeitura.</strong>{' '}
            A transferência só acontece depois da trava aprovar — a proposta foi
            bloqueada antes disso.
          </>
        ) : situacao === 'Liberado' ? (
          <>
            Valor liberado ao fornecedor após{' '}
            <strong className="text-tinta">{quorum} confirmações de entrega</strong>.
          </>
        ) : (
          <>
            Valor <strong className="text-tinta">retido em custódia</strong>, sob controle
            do programa. Só vai ao fornecedor com o quórum de confirmações.
          </>
        )}
      </p>

      {!bloqueado && situacao !== 'Liberado' && (
        <MarcadorQuorum
          confirmacoes={confirmacoes}
          quorum={quorum}
          vencida={vencida}
        />
      )}
    </div>
  );
}

/**
 * Marcador de quórum `●○`.
 *
 * Círculos preenchidos comunicam "falta uma" sem exigir leitura de número.
 */
export function MarcadorQuorum({
  confirmacoes,
  quorum,
  vencida = false,
}: {
  confirmacoes: number;
  quorum: number;
  vencida?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: quorum }, (_, i) => (
          <span
            key={i}
            className="size-2.5 rounded-full border"
            style={{
              backgroundColor:
                i < confirmacoes ? 'var(--color-retido)' : 'transparent',
              borderColor: 'var(--color-retido)',
            }}
          />
        ))}
      </span>
      <span className="dado text-2xs text-grafite">
        {confirmacoes} de {quorum} confirmações
      </span>
      {vencida && (
        <span className="text-2xs font-medium text-bloqueio">
          · prazo vencido — o programa não tem instrução de devolução, então o valor
          permanece imobilizado
        </span>
      )}
    </div>
  );
}
