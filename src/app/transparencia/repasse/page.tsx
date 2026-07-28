'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/app/provedor';
import {
  nomeEscola,
  nomeFonte,
  nomeFornecedor,
  nomeItem,
  registrosDoRepasse,
  repassePorId,
  unidadeItem,
} from '@/adapter/consultas';
import {
  abreviarHash,
  formatarDataHora,
  formatarQuantidade,
  formatarReais,
} from '@/adapter/formato';
import { PainelTrava } from '@/components/dominio/painel-trava';
import { BarraCustodia } from '@/components/dominio/barra-custodia';
import { entregaVencida } from '@/adapter/escrow';
import { Botao } from '@/components/ui/button';
import { Selo } from '@/components/ui/selo';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo, LinhaDado } from '@/components/ui/ficha';
import {
  Tabela,
  TabelaCabecalho,
  TabelaCelula,
  TabelaCorpo,
  TabelaLinha,
  TabelaTitulo,
} from '@/components/ui/tabela';

export default function DetalheRepasse() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-12 text-xs text-grafite">Carregando…</div>}>
      <Detalhe />
    </Suspense>
  );
}

function Detalhe() {
  const { app } = useApp();
  const id = useSearchParams().get('id');
  const repasse = id === null ? undefined : repassePorId(app.repasses, id);

  if (repasse === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1>Repasse não encontrado</h1>
        <p className="mt-3 text-xs text-grafite">
          {id === null
            ? 'Nenhum repasse foi informado no endereço.'
            : `Não existe repasse com o identificador ${id}.`}
        </p>
        <Botao asChild variante="contorno" className="mt-6">
          <Link href="/transparencia">
            <ArrowLeft className="size-4" /> Voltar ao painel
          </Link>
        </Botao>
      </main>
    );
  }

  const entrega = app.entregas.find((e) => e.repasseId === repasse.id);
  const conta = app.programa.repasses.get(repasse.id);
  const registros = registrosDoRepasse(app.cadeia, repasse);
  const cotacoes = app.programa.cotacoesOraculo.get(repasse.itemId);
  const unidade = unidadeItem(repasse.itemId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Botao asChild variante="discreto" tamanho="sm" className="-ml-3">
        <Link href="/transparencia">
          <ArrowLeft className="size-4" /> Painel público
        </Link>
      </Botao>

      <p className="sobrescrito mt-4">{repasse.id}</p>
      <h1 className="mt-1">{nomeItem(repasse.itemId)}</h1>
      <p className="mt-2 text-xs text-grafite">
        {nomeFornecedor(repasse.fornecedorId)} · {nomeEscola(repasse.escolaId)}
      </p>

      {/* --- A decisão da trava ---------------------------------------------- */}
      <PainelTrava
        className="mt-8"
        mediana={repasse.medianaAplicada}
        limite={repasse.limiteAplicado}
        proposta={repasse.precoUnitarioEfetivo}
        quantidade={repasse.quantidade}
        valorTotal={repasse.valorTotal}
        tolerancia={repasse.toleranciaAplicada}
        unidade={unidade}
      />

      {/* --- Onde está o dinheiro --------------------------------------------- */}
      <Ficha className="mt-6">
        <FichaCabecalho>
          <FichaSobrescrito>Custódia em BRZ</FichaSobrescrito>
          <FichaTitulo>Onde está o dinheiro deste repasse</FichaTitulo>
        </FichaCabecalho>
        <FichaCorpo>
          <BarraCustodia
            valor={repasse.valorTotal}
            situacao={repasse.situacao}
            confirmacoes={conta?.confirmacoes ?? entrega?.confirmadoPor.length ?? 0}
            quorum={app.programa.confirmacoesNecessarias}
            vencida={entrega !== undefined && entregaVencida(entrega, app.instanteAtual)}
          />
        </FichaCorpo>
      </Ficha>

      {/* --- Dados da proposta ------------------------------------------------ */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Ficha>
          <FichaCabecalho>
            <FichaSobrescrito>Proposta</FichaSobrescrito>
            <FichaTitulo>Dados da compra</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            <LinhaDado rotulo="Quantidade">
              {formatarQuantidade(repasse.quantidade, unidade)}
            </LinhaDado>
            <LinhaDado rotulo="Valor total">{formatarReais(repasse.valorTotal)}</LinhaDado>
            <LinhaDado rotulo={`Preço por ${unidade}`}>
              {formatarReais(repasse.precoUnitarioEfetivo)}
            </LinhaDado>
            <LinhaDado rotulo="Tolerância aplicada">
              {repasse.toleranciaAplicada.toString()}%
            </LinhaDado>
            <LinhaDado rotulo="Situação">
              <Selo
                situacao={
                  repasse.situacao === 'Rejeitado'
                    ? 'bloqueado'
                    : repasse.situacao === 'Liberado'
                      ? 'liberado'
                      : repasse.situacao === 'Divergente'
                        ? 'divergente'
                        : 'retido'
                }
              >
                {repasse.situacao}
              </Selo>
            </LinhaDado>
          </FichaCorpo>
        </Ficha>

        <Ficha>
          <FichaCabecalho>
            <FichaSobrescrito>Oráculo</FichaSobrescrito>
            <FichaTitulo>Cotações que formaram a mediana</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            {cotacoes === undefined || cotacoes.size === 0 ? (
              <p className="py-4 text-xs text-grafite">
                Nenhuma cotação registrada para este item.
              </p>
            ) : (
              [...cotacoes.entries()]
                .sort((a, b) => (a[1] < b[1] ? -1 : 1))
                .map(([fonte, preco]) => (
                  <LinhaDado key={fonte} rotulo={nomeFonte(fonte)}>
                    {formatarReais(preco)}/{unidade}
                  </LinhaDado>
                ))
            )}
            <p className="mt-3 text-2xs text-grafite">
              A mediana congela no momento da decisão: este repasse é auditável contra a
              referência vigente quando foi proposto, não contra a atual.
            </p>
          </FichaCorpo>
        </Ficha>
      </div>

      {/* --- Histórico na cadeia ---------------------------------------------- */}
      <section className="mt-6">
        <h2>Histórico na cadeia</h2>
        <div className="mt-3 rounded-ficha border border-regua">
          <Tabela>
            <TabelaCabecalho>
              <TabelaLinha>
                <TabelaTitulo numerica>Nº</TabelaTitulo>
                <TabelaTitulo numerica>Horário</TabelaTitulo>
                <TabelaTitulo>Evento</TabelaTitulo>
                <TabelaTitulo>Situação</TabelaTitulo>
                <TabelaTitulo numerica>Hash</TabelaTitulo>
              </TabelaLinha>
            </TabelaCabecalho>
            <TabelaCorpo>
              {registros.map((r) => (
                <TabelaLinha key={r.numero}>
                  <TabelaCelula numerica>{r.numero}</TabelaCelula>
                  <TabelaCelula numerica className="whitespace-nowrap text-grafite">
                    {formatarDataHora(r.horario)}
                  </TabelaCelula>
                  <TabelaCelula>{r.tipo}</TabelaCelula>
                  <TabelaCelula>
                    {r.sucesso ? (
                      <Selo situacao="liberado">Sucesso</Selo>
                    ) : (
                      <Selo situacao="bloqueado">{r.motivoFalha}</Selo>
                    )}
                  </TabelaCelula>
                  <TabelaCelula numerica className="text-grafite">
                    {abreviarHash(r.hash)}
                  </TabelaCelula>
                </TabelaLinha>
              ))}
            </TabelaCorpo>
          </Tabela>
        </div>
        <p className="mt-2 text-2xs text-grafite">
          A tentativa bloqueada permanece no histórico — ela não desaparece. É o registro
          de que a trava agiu.
        </p>
      </section>
    </main>
  );
}
