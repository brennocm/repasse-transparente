import { Ban, CircleCheck } from 'lucide-react';
import type { Centavos } from '@/core/tipos';
import { formatarReais, formatarInteiro, formatarPercentual } from '@/adapter/formato';
import { refeicoesEquivalentes } from '@/adapter/impacto';
import { ReguaTolerancia } from './regua-tolerancia';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import { cn } from '@/lib/utils';

/**
 * Painel da trava — a comparação que decide o repasse.
 *
 * Reutilizado em três lugares: na previsão antes do envio, no resultado da
 * proposta e no detalhe do repasse. É o mesmo cálculo nos três, e mostrar o
 * mesmo painel evita que o avaliador tenha de reconstruir o raciocínio.
 */

export interface PainelTravaProps {
  readonly mediana: Centavos;
  readonly limite: Centavos;
  readonly proposta: Centavos;
  readonly quantidade: bigint;
  readonly valorTotal: Centavos;
  readonly tolerancia: bigint;
  readonly unidade: string;
  /** `true` na previsão, antes de existir decisão. */
  readonly previsao?: boolean;
  readonly className?: string;
}

export function PainelTrava({
  mediana,
  limite,
  proposta,
  quantidade,
  valorTotal,
  tolerancia,
  unidade,
  previsao = false,
  className,
}: PainelTravaProps) {
  const excedeu = proposta > limite;
  const semReferencia = mediana === 0n;

  const sobrepreco = semReferencia
    ? 0n
    : ((proposta - mediana) * 100n) / mediana;

  const teto = limite * quantidade;
  const preservado = excedeu && valorTotal > teto ? valorTotal - teto : 0n;

  if (semReferencia) {
    return (
      <Ficha trilho="retido" className={className}>
        <FichaCabecalho>
          <FichaSobrescrito>Sem preço de referência</FichaSobrescrito>
          <FichaTitulo>Este item ainda não pode ser avaliado</FichaTitulo>
        </FichaCabecalho>
        <FichaCorpo>
          <p className="text-xs text-grafite">
            O preço de referência exige pelo menos três cotações independentes. Sem
            parâmetro de comparação, nenhuma compra pode ser aprovada nem rejeitada.
          </p>
        </FichaCorpo>
      </Ficha>
    );
  }

  return (
    <Ficha trilho={excedeu ? 'bloqueio' : 'liberado'} className={className}>
      <FichaCabecalho>
        <FichaSobrescrito>
          {previsao ? 'Situação prevista' : excedeu ? 'Repasse bloqueado' : 'Repasse aprovado'}
        </FichaSobrescrito>
        <div className="flex items-start gap-2">
          {excedeu ? (
            <Ban aria-hidden="true" className="mt-1 size-5 shrink-0 text-bloqueio" />
          ) : (
            <CircleCheck aria-hidden="true" className="mt-1 size-5 shrink-0 text-liberado" />
          )}
          <FichaTitulo>
            {excedeu
              ? `Preço ${formatarPercentual(sobrepreco)} acima da mediana de mercado`
              : `Preço dentro da tolerância de ${tolerancia}%`}
          </FichaTitulo>
        </div>
      </FichaCabecalho>

      <FichaCorpo className="space-y-5">
        <ReguaTolerancia
          mediana={mediana}
          limite={limite}
          proposta={proposta}
          unidade={unidade}
          tolerancia={tolerancia}
        />

        {excedeu && (
          <div className="rounded-ficha border border-bloqueio/30 bg-bloqueio-tenue p-4">
            <p className="sobrescrito">Motivo devolvido pelo programa</p>
            <p className="dado mt-1 text-xs font-semibold text-bloqueio">
              Erro::AcimaDoLimite
            </p>
            <p className="mt-2 text-xs text-grafite">
              O preço proposto ultrapassa a mediana de mercado além da tolerância
              permitida.{' '}
              {previsao
                ? 'Se enviada, a proposta será bloqueada e nenhum valor sairá da conta da prefeitura.'
                : 'O repasse foi bloqueado e nenhum valor saiu da conta da prefeitura.'}
            </p>
          </div>
        )}

        {preservado > 0n && (
          <div
            className={cn(
              'grid gap-4 rounded-ficha border border-regua bg-placa p-4 sm:grid-cols-2',
            )}
          >
            <div>
              <p className="sobrescrito">
                {previsao ? 'Sobrepreço a preservar' : 'Dinheiro público preservado'}
              </p>
              <p className="dado mt-1 text-md font-semibold text-liberado">
                {formatarReais(preservado)}
              </p>
              <p className="mt-1 text-2xs text-grafite">
                Diferença entre o proposto e o teto aceitável — não o valor cheio da
                compra, que ainda precisa ser feita pelo preço justo.
              </p>
            </div>
            <div>
              <p className="sobrescrito">Refeições preservadas</p>
              <p className="dado mt-1 text-md font-semibold text-liberado">
                {formatarInteiro(refeicoesEquivalentes(preservado))}
              </p>
              <p className="mt-1 text-2xs text-grafite">
                A R$ 2,10 por refeição, custo de referência declarado nesta demonstração.
              </p>
            </div>
          </div>
        )}
      </FichaCorpo>
    </Ficha>
  );
}
