'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { useApp } from '@/app/provedor';
import {
  ehDiscrepante,
  mediaAritmetica,
  nomeFonte,
  serieDeMedianas,
} from '@/adapter/consultas';
import { formatarData, formatarReais } from '@/adapter/formato';
import { calcularLimite } from '@/core/contrato';
import { itemPorId } from '@/mocks/itens';
import { FONTES } from '@/mocks/fontes';
import { Botao } from '@/components/ui/button';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo, LinhaDado } from '@/components/ui/ficha';
import { Aviso } from '@/components/ui/aviso';
import { cn } from '@/lib/utils';

export default function SeriePreco() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-xs text-grafite">Carregando…</div>}>
      <Serie />
    </Suspense>
  );
}

function Serie() {
  const { app } = useApp();
  const id = useSearchParams().get('id');
  const item = id === null ? undefined : itemPorId(id);

  const serie = useMemo(
    () => (item === undefined ? [] : serieDeMedianas(app.cadeia, item.id)),
    [app.cadeia, item],
  );

  if (item === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1>Item não encontrado</h1>
        <p className="mt-3 text-xs text-grafite">
          {id === null ? 'Nenhum item foi informado.' : `Não existe item ${id}.`}
        </p>
        <Botao asChild variante="contorno" className="mt-6">
          <Link href="/transparencia">
            <ArrowLeft className="size-4" /> Voltar ao painel
          </Link>
        </Botao>
      </main>
    );
  }

  const preco = app.programa.tabelaPrecos.get(item.id);
  const mediana = preco?.precoMediana ?? 0n;
  const limite = calcularLimite(mediana, app.programa.toleranciaPercentual);

  const cotacoes = [...(app.programa.cotacoesOraculo.get(item.id)?.entries() ?? [])];
  const valores = cotacoes.map(([, v]) => v);
  const media = mediaAritmetica(valores);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Botao asChild variante="discreto" tamanho="sm" className="-ml-3">
        <Link href="/transparencia">
          <ArrowLeft className="size-4" /> Painel público
        </Link>
      </Botao>

      <p className="sobrescrito mt-4">{item.categoria} · por {item.unidade}</p>
      <h1 className="mt-1">{item.nome}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Ficha trilho="liberado">
          <FichaCorpo className="pt-4 sm:pt-5">
            <p className="sobrescrito">Mediana vigente</p>
            <p className="dado mt-1 text-md font-semibold text-liberado">
              {formatarReais(mediana)}
            </p>
          </FichaCorpo>
        </Ficha>
        <Ficha trilho="bloqueio">
          <FichaCorpo className="pt-4 sm:pt-5">
            <p className="sobrescrito">Limite com tolerância</p>
            <p className="dado mt-1 text-md font-semibold text-bloqueio">
              {formatarReais(limite)}
            </p>
          </FichaCorpo>
        </Ficha>
        <Ficha>
          <FichaCorpo className="pt-4 sm:pt-5">
            <p className="sobrescrito">Atualizado em</p>
            <p className="dado mt-1 text-md font-semibold">
              {preco === undefined ? '—' : formatarData(preco.atualizadoEm)}
            </p>
          </FichaCorpo>
        </Ficha>
      </div>

      {/* --- Série histórica ---------------------------------------------------- */}
      <section className="mt-8">
        <h2>Evolução do preço de referência</h2>
        <p className="mt-2 max-w-2xl text-xs text-grafite">
          Cada ponto é um recálculo da mediana a partir das cotações reportadas. A faixa
          clara é o intervalo tolerado, entre a mediana e o teto.
        </p>
        <div className="mt-4 rounded-ficha border border-regua bg-papel p-4">
          <GraficoSerie
            serie={serie}
            tolerancia={app.programa.toleranciaPercentual}
            unidade={item.unidade}
          />
        </div>
      </section>

      {/* --- Cotações vigentes --------------------------------------------------- */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Ficha>
          <FichaCabecalho>
            <FichaSobrescrito>Cotações vigentes</FichaSobrescrito>
            <FichaTitulo>As {cotacoes.length} fontes independentes</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            {cotacoes
              .sort((a, b) => (a[1] < b[1] ? -1 : 1))
              .map(([fonte, valor]) => {
                const discrepante = ehDiscrepante(valor, mediana);
                const categoria = FONTES.find((f) => f.endereco === fonte)?.categoria;
                return (
                  <LinhaDado
                    key={fonte}
                    rotulo={`${nomeFonte(fonte)}${categoria ? ` · ${categoria}` : ''}`}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        discrepante && 'font-semibold text-bloqueio',
                      )}
                    >
                      {discrepante && <TriangleAlert aria-hidden="true" className="size-3.5" />}
                      {formatarReais(valor)}
                    </span>
                  </LinhaDado>
                );
              })}
            <p className="mt-3 text-2xs text-grafite">
              Cotações a mais de 25% da mediana são sinalizadas. O programa as aceita — a
              proteção não é recusar a cotação isolada, é a mediana ignorá-la.
            </p>
          </FichaCorpo>
        </Ficha>

        <Ficha trilho="indice">
          <FichaCabecalho>
            <FichaSobrescrito>Por que mediana</FichaSobrescrito>
            <FichaTitulo>Mediana contra média aritmética</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            <LinhaDado rotulo="Mediana das cotações">{formatarReais(mediana)}</LinhaDado>
            <LinhaDado rotulo="Média aritmética">{formatarReais(media)}</LinhaDado>

            <Aviso tom="informativo" className="mt-4">
              Com as cotações honestas, as duas praticamente coincidem. A diferença aparece
              sob ataque: se uma única fonte reportar um valor absurdo, a média inteira se
              desloca e o teto sobe junto — liberando o superfaturamento que a trava
              deveria barrar. A mediana descarta o extremo e quase não se move.
            </Aviso>

            <p className="mt-3 text-2xs text-grafite">
              A proteção depende de as fontes serem independentes. Se a maioria agir em
              conluio, a mediana também é manipulável — por isso a autorização exige
              diversidade institucional, e não apenas quantidade.
            </p>
          </FichaCorpo>
        </Ficha>
      </section>
    </main>
  );
}

/**
 * Série temporal em SVG próprio.
 *
 * Duas visualizações de forma conhecida e dados pequenos não justificam uma
 * biblioteca de gráficos: 50KB a 200KB no bundle para resolver problemas de
 * generalidade que não temos, e mais difícil garantir contraste e rotulagem.
 */
function GraficoSerie({
  serie,
  tolerancia,
  unidade,
}: {
  serie: readonly { horario: number; mediana: bigint }[];
  tolerancia: bigint;
  unidade: string;
}) {
  if (serie.length < 2) {
    return (
      <p className="py-8 text-center text-xs text-grafite">
        São necessários pelo menos dois recálculos para desenhar a série.
      </p>
    );
  }

  const L = 600;
  const A = 180;
  const M = { topo: 12, dir: 12, base: 28, esq: 56 };

  const limites = serie.map((p) => calcularLimite(p.mediana, tolerancia));
  const maximo = limites.reduce((m, v) => (v > m ? v : m), 0n);
  const teto = (maximo * 115n) / 100n;

  const x = (i: number) =>
    M.esq + (i / (serie.length - 1)) * (L - M.esq - M.dir);
  const y = (v: bigint) => {
    const frac = teto === 0n ? 0 : Number((v * 10_000n) / teto) / 10_000;
    return A - M.base - frac * (A - M.topo - M.base);
  };

  const linha = (vals: readonly bigint[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  const area =
    serie.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.mediana)}`).join(' ') +
    ' ' +
    [...limites]
      .map((v, i) => ({ v, i }))
      .reverse()
      .map(({ v, i }) => `L ${x(i)} ${y(v)}`)
      .join(' ') +
    ' Z';

  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${L} ${A}`} width="100%" role="img" aria-label="Evolução da mediana e do limite ao longo do tempo" className="block">
        {/* Faixa tolerada */}
        <path d={area} style={{ fill: 'var(--color-liberado-tenue)' }} />

        {/* Eixo base */}
        <line
          x1={M.esq}
          y1={A - M.base}
          x2={L - M.dir}
          y2={A - M.base}
          style={{ stroke: 'var(--color-regua-forte)' }}
          strokeWidth={1}
        />

        {/* Limite */}
        <path
          d={linha(limites)}
          fill="none"
          style={{ stroke: 'var(--color-bloqueio)' }}
          strokeWidth={2}
          strokeDasharray="5 4"
        />

        {/* Mediana */}
        <path
          d={linha(serie.map((p) => p.mediana))}
          fill="none"
          style={{ stroke: 'var(--color-liberado)' }}
          strokeWidth={2.5}
        />

        {serie.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.mediana)}
            r={3.5}
            style={{ fill: 'var(--color-liberado)' }}
          />
        ))}

        {/* Rótulos do eixo horizontal */}
        {serie.map((p, i) => (
          <text
            key={i}
            x={x(i)}
            y={A - M.base + 16}
            textAnchor="middle"
            style={{ fill: 'var(--color-grafite)', fontSize: 11 }}
            className="dado"
          >
            {formatarData(p.horario).slice(0, 5)}
          </text>
        ))}

        {/* Extremos do eixo vertical */}
        <text
          x={M.esq - 8}
          y={y(serie[0]!.mediana) + 4}
          textAnchor="end"
          style={{ fill: 'var(--color-grafite)', fontSize: 11 }}
          className="dado"
        >
          {formatarReais(serie[0]!.mediana)}
        </text>
        <text
          x={M.esq - 8}
          y={y(limites[limites.length - 1]!) + 4}
          textAnchor="end"
          style={{ fill: 'var(--color-grafite)', fontSize: 11 }}
          className="dado"
        >
          {formatarReais(limites[limites.length - 1]!)}
        </text>
      </svg>

      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-2xs text-grafite">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-0.5 w-4"
            style={{ backgroundColor: 'var(--color-liberado)' }}
          />
          Mediana por {unidade}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-0.5 w-4"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, var(--color-bloqueio) 0 4px, transparent 4px 8px)',
            }}
          />
          Limite com tolerância de {tolerancia.toString()}%
        </span>
      </figcaption>
    </figure>
  );
}
