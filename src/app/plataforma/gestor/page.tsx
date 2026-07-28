'use client';

import Link from 'next/link';
import { ArrowRight, Ban, Plus } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { GuardaPapel } from '@/components/plataforma/guarda';
import { alertas, nomeEscola, nomeFornecedor, nomeItem, unidadeItem } from '@/adapter/consultas';
import { calcularImpacto } from '@/adapter/impacto';
import {
  formatarData,
  formatarInteiro,
  formatarPercentual,
  formatarQuantidade,
  formatarReais,
} from '@/adapter/formato';
import { Botao } from '@/components/ui/button';
import { Selo } from '@/components/ui/selo';
import { Indicador, GradeIndicadores } from '@/components/dados/indicador';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import {
  Tabela,
  TabelaCabecalho,
  TabelaCelula,
  TabelaCorpo,
  TabelaLinha,
  TabelaTitulo,
  TabelaVazia,
} from '@/components/ui/tabela';
import type { SituacaoRepasse } from '@/dominio/tipos';

const SELO: Record<SituacaoRepasse, { situacao: 'bloqueado' | 'liberado' | 'retido' | 'divergente' | 'neutro'; rotulo: string }> = {
  Rejeitado: { situacao: 'bloqueado', rotulo: 'Bloqueado' },
  Liberado: { situacao: 'liberado', rotulo: 'Pago' },
  Retido: { situacao: 'retido', rotulo: 'Retido' },
  Divergente: { situacao: 'divergente', rotulo: 'Divergência' },
  Proposto: { situacao: 'neutro', rotulo: 'Proposto' },
};

export default function PaginaGestor() {
  return (
    <GuardaPapel papel="gestor">
      <Gestor />
    </GuardaPapel>
  );
}

function Gestor() {
  const { app } = useApp();
  const impacto = calcularImpacto(app.repasses);
  const rejeicoes = alertas(app.repasses, 3);
  const recentes = [...app.repasses].sort((a, b) => b.criadoEm - a.criadoEm).slice(0, 15);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sobrescrito">Gestão municipal</p>
          <h1 className="mt-1">Compras de merenda</h1>
        </div>
        <Botao asChild tamanho="lg">
          <Link href="/plataforma/gestor/nova-proposta">
            <Plus className="size-4" /> Nova proposta de compra
          </Link>
        </Botao>
      </div>

      <section className="mt-8 border-y border-regua py-6">
        <GradeIndicadores>
          <Indicador
            rotulo="Proposto"
            valor={formatarReais(impacto.valorProposto)}
            nota={`${impacto.totalRepasses} compras`}
          />
          <Indicador
            rotulo="Bloqueado pela trava"
            valor={formatarReais(impacto.valorBloqueado)}
            tom="bloqueio"
            destaque
            nota={`${impacto.totalBloqueados} recusas · ${formatarInteiro(impacto.refeicoesPreservadas)} refeições preservadas`}
          />
          <Indicador
            rotulo="Retido em custódia"
            valor={formatarReais(impacto.valorEmCustodia)}
            tom="retido"
            nota="aguardando confirmação do conselho escolar"
          />
        </GradeIndicadores>
      </section>

      {rejeicoes.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Ban aria-hidden="true" className="size-5 text-bloqueio" />
            <h2>Suas propostas bloqueadas</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs text-grafite">
            Estas compras foram recusadas antes do pagamento. Nenhum valor saiu da conta da
            prefeitura — a compra ainda precisa ser refeita pelo preço de referência.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {rejeicoes.map(({ repasse, sobrepreco }) => (
              <Ficha key={repasse.id} trilho="bloqueio">
                <FichaCabecalho>
                  <FichaSobrescrito>
                    {formatarData(repasse.criadoEm)} · {repasse.id}
                  </FichaSobrescrito>
                  <FichaTitulo className="text-sm">{nomeItem(repasse.itemId)}</FichaTitulo>
                </FichaCabecalho>
                <FichaCorpo className="space-y-2">
                  <p className="dado text-md font-semibold text-bloqueio">
                    {formatarPercentual(sobrepreco)}
                  </p>
                  <p className="text-2xs text-grafite">
                    {formatarReais(repasse.precoUnitarioEfetivo)} por{' '}
                    {unidadeItem(repasse.itemId)} contra limite de{' '}
                    {formatarReais(repasse.limiteAplicado)}
                  </p>
                  <Botao asChild tamanho="sm" variante="discreto" className="-ml-3">
                    <Link href={{ pathname: '/transparencia/repasse', query: { id: repasse.id } }}>
                      Ver comparação <ArrowRight className="size-4" />
                    </Link>
                  </Botao>
                </FichaCorpo>
              </Ficha>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2>Últimas compras</h2>
        <div className="mt-4 rounded-ficha border border-regua">
          <Tabela>
            <TabelaCabecalho>
              <TabelaLinha>
                <TabelaTitulo>Item</TabelaTitulo>
                <TabelaTitulo>Fornecedor</TabelaTitulo>
                <TabelaTitulo>Escola</TabelaTitulo>
                <TabelaTitulo numerica>Quantidade</TabelaTitulo>
                <TabelaTitulo numerica>Valor</TabelaTitulo>
                <TabelaTitulo>Situação</TabelaTitulo>
                <TabelaTitulo numerica>Data</TabelaTitulo>
              </TabelaLinha>
            </TabelaCabecalho>
            <TabelaCorpo>
              {recentes.length === 0 ? (
                <TabelaVazia colSpan={7}>
                  Nenhuma compra registrada. Comece por uma nova proposta.
                </TabelaVazia>
              ) : (
                recentes.map((r) => (
                  <TabelaLinha key={r.id} className="hover:bg-placa">
                    <TabelaCelula>
                      <Link
                        href={{ pathname: '/transparencia/repasse', query: { id: r.id } }}
                        className="font-medium text-indice underline-offset-2 hover:underline"
                      >
                        {nomeItem(r.itemId)}
                      </Link>
                    </TabelaCelula>
                    <TabelaCelula className="text-grafite">
                      {nomeFornecedor(r.fornecedorId)}
                    </TabelaCelula>
                    <TabelaCelula className="text-grafite">
                      {nomeEscola(r.escolaId)}
                    </TabelaCelula>
                    <TabelaCelula numerica>
                      {formatarQuantidade(r.quantidade, unidadeItem(r.itemId))}
                    </TabelaCelula>
                    <TabelaCelula numerica>{formatarReais(r.valorTotal)}</TabelaCelula>
                    <TabelaCelula>
                      <Selo situacao={SELO[r.situacao].situacao}>
                        {SELO[r.situacao].rotulo}
                      </Selo>
                    </TabelaCelula>
                    <TabelaCelula numerica className="whitespace-nowrap text-grafite">
                      {formatarData(r.criadoEm)}
                    </TabelaCelula>
                  </TabelaLinha>
                ))
              )}
            </TabelaCorpo>
          </Tabela>
        </div>
      </section>
    </main>
  );
}
