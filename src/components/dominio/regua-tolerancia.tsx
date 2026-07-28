import type { Centavos } from '@/core/tipos';
import { formatarReais } from '@/adapter/formato';
import { cn } from '@/lib/utils';

/**
 * Régua de tolerância — o elemento assinatura do produto.
 *
 * Escala medida onde o preço proposto ultrapassa fisicamente a linha do limite.
 * É a tese do projeto em uma imagem: existe um teto, e a proposta o excedeu de
 * forma mensurável.
 *
 * O gráfico carrega a **forma** — o quanto passou. Os números vêm logo abaixo em
 * HTML, na voz do dado: texto dentro de SVG escalado fica ilegível a 360px, e a
 * informação não pode depender só do desenho (FR-029).
 */

const LARGURA = 600;
const ALTURA = 96;
const MARGEM = 16;
const BASE = 62;

export interface ReguaToleranciaProps {
  readonly mediana: Centavos;
  readonly limite: Centavos;
  readonly proposta: Centavos;
  readonly unidade: string;
  /** Percentual de tolerância, apenas para rotular o limite. */
  readonly tolerancia?: bigint;
  readonly className?: string;
}

export function ReguaTolerancia({
  mediana,
  limite,
  proposta,
  unidade,
  tolerancia = 15n,
  className,
}: ReguaToleranciaProps) {
  const excedeu = proposta > limite;

  // A escala acomoda o maior valor com folga, para o ponteiro nunca colar na borda.
  const teto = (excedeu ? proposta : limite) * 115n;
  const x = (valor: Centavos): number => {
    if (teto === 0n) return MARGEM;
    const fracao = Number((valor * 10_000n * 100n) / teto) / 10_000;
    return MARGEM + fracao * (LARGURA - 2 * MARGEM);
  };

  const xMediana = x(mediana);
  const xLimite = x(limite);
  const xProposta = x(proposta);

  const marcas = Array.from({ length: 41 }, (_, i) => {
    const px = MARGEM + (i / 40) * (LARGURA - 2 * MARGEM);
    const maior = i % 5 === 0;
    return {
      px,
      altura: maior ? 11 : 6,
      // Traço maior em tom funcional: em `regua` puro a escala some contra a
      // superfície e a metáfora de régua se perde.
      cor: maior ? 'var(--color-regua-forte)' : 'var(--color-regua)',
      largura: maior ? 1.5 : 1,
    };
  });

  return (
    <figure className={cn('space-y-3', className)}>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        width="100%"
        role="img"
        aria-label={`Preço proposto ${formatarReais(proposta)} por ${unidade}, contra limite de ${formatarReais(limite)}. ${excedeu ? 'Ultrapassou o limite.' : 'Dentro do limite.'}`}
        className="block"
      >
        {/* Faixa tolerada: da mediana até o limite */}
        <rect
          x={xMediana}
          y={BASE - 18}
          width={Math.max(0, xLimite - xMediana)}
          height={18}
          style={{ fill: 'var(--color-liberado-tenue)' }}
        />

        {/* Excedente: do limite até a proposta */}
        {excedeu && (
          <rect
            x={xLimite}
            y={BASE - 18}
            width={xProposta - xLimite}
            height={18}
            style={{ fill: 'var(--color-bloqueio-tenue)' }}
          />
        )}

        {/* Régua */}
        <line
          x1={MARGEM}
          y1={BASE}
          x2={LARGURA - MARGEM}
          y2={BASE}
          style={{ stroke: 'var(--color-regua-forte)' }}
          strokeWidth={1.5}
        />
        {marcas.map((m, i) => (
          <line
            key={i}
            x1={m.px}
            y1={BASE}
            x2={m.px}
            y2={BASE + m.altura}
            style={{ stroke: m.cor }}
            strokeWidth={m.largura}
          />
        ))}

        {/* Mediana */}
        <line
          x1={xMediana}
          y1={BASE - 26}
          x2={xMediana}
          y2={BASE + 8}
          style={{ stroke: 'var(--color-liberado)' }}
          strokeWidth={2.5}
        />

        {/* Limite: a linha que não pode ser cruzada */}
        <line
          x1={xLimite}
          y1={BASE - 34}
          x2={xLimite}
          y2={BASE + 12}
          style={{ stroke: 'var(--color-bloqueio)' }}
          strokeWidth={2.5}
        />

        {/* Ponteiro da proposta */}
        <g
          className="ponteiro-regua"
          style={{ transform: `translateX(${xProposta}px)` }}
        >
          <path
            d="M -7 -14 L 7 -14 L 0 0 Z"
            transform={`translate(0 ${BASE - 36})`}
            style={{
              fill: excedeu ? 'var(--color-bloqueio)' : 'var(--color-liberado)',
            }}
          />
          <line
            x1={0}
            y1={BASE - 36}
            x2={0}
            y2={BASE}
            style={{
              stroke: excedeu ? 'var(--color-bloqueio)' : 'var(--color-liberado)',
            }}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        </g>
      </svg>

      <figcaption className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
        <Marca
          cor="var(--color-liberado)"
          rotulo="Mediana das fontes"
          valor={`${formatarReais(mediana)}/${unidade}`}
        />
        <Marca
          cor="var(--color-bloqueio)"
          rotulo={`Limite (+${tolerancia}%)`}
          valor={`${formatarReais(limite)}/${unidade}`}
        />
        <Marca
          cor={excedeu ? 'var(--color-bloqueio)' : 'var(--color-liberado)'}
          rotulo="Preço proposto"
          valor={`${formatarReais(proposta)}/${unidade}`}
          destaque
        />
      </figcaption>
    </figure>
  );
}

function Marca({
  cor,
  rotulo,
  valor,
  destaque = false,
}: {
  cor: string;
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span
        aria-hidden="true"
        className="mt-1 size-2 shrink-0 self-start rounded-full"
        style={{ backgroundColor: cor }}
      />
      <span className="min-w-0">
        <span className="block text-2xs text-grafite">{rotulo}</span>
        <span
          className={cn('dado block text-xs', destaque && 'font-semibold')}
          style={destaque ? { color: cor } : undefined}
        >
          {valor}
        </span>
      </span>
    </span>
  );
}
