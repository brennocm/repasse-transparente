'use client';

import Link from 'next/link';
import { ArrowRight, Ban, Clock, TriangleAlert } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { GuardaPapel } from '@/components/plataforma/guarda';
import {
  alertas,
  divergenciasAbertas,
  nomeEscola,
  nomeFornecedor,
  nomeItem,
  pendenciasVencidas,
  repassePorId,
  unidadeItem,
} from '@/adapter/consultas';
import { calcularImpacto } from '@/adapter/impacto';
import { diasAteVencimento } from '@/adapter/escrow';
import {
  formatarData,
  formatarInteiro,
  formatarPercentual,
  formatarReais,
} from '@/adapter/formato';
import { Indicador, GradeIndicadores } from '@/components/dados/indicador';
import { Botao } from '@/components/ui/button';
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
import { MUNICIPIO } from '@/mocks/municipio';

/**
 * Painel do órgão de controle (FR-036).
 *
 * O que um promotor abre primeiro: o que foi bloqueado, o que está imobilizado
 * além do prazo, e o que tem divergência aberta.
 */
export default function PaginaControle() {
  return (
    <GuardaPapel papel="controle">
      <Controle />
    </GuardaPapel>
  );
}

function Controle() {
  const { app } = useApp();

  const impacto = calcularImpacto(app.repasses);
  const rejeicoes = alertas(app.repasses);
  const vencidas = pendenciasVencidas(app.entregas, app.instanteAtual);
  const divergencias = divergenciasAbertas(app.entregas);

  const imobilizadoVencido = vencidas.reduce((soma, e) => {
    const r = repassePorId(app.repasses, e.repasseId);
    return soma + (r?.valorTotal ?? 0n);
  }, 0n);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="sobrescrito">
        Órgão de controle · {MUNICIPIO.nome} / {MUNICIPIO.uf}
      </p>
      <h1 className="mt-1">Auditoria em tempo real</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Tudo aqui também está no painel público — auditoria que depende de acesso
        privilegiado é auditoria que o auditado controla.
      </p>

      <section className="mt-8 border-y border-regua py-6">
        <GradeIndicadores>
          <Indicador
            rotulo="Bloqueado pela trava"
            valor={formatarReais(impacto.valorBloqueado)}
            tom="bloqueio"
            destaque
            impacto={`${formatarInteiro(impacto.refeicoesPreservadas)} refeições preservadas`}
            nota={`${impacto.totalBloqueados} compras recusadas`}
          />
          <Indicador
            rotulo="Imobilizado além do prazo"
            valor={formatarReais(imobilizadoVencido)}
            tom="retido"
            destaque
            nota={`${vencidas.length} entregas sem confirmação`}
          />
          <Indicador
            rotulo="Divergências abertas"
            valor={formatarInteiro(divergencias.length)}
            tom="retido"
            nota="valor retido até resolução"
          />
        </GradeIndicadores>
      </section>

      {/* --- Rejeições ------------------------------------------------------- */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Ban aria-hidden="true" className="size-5 text-bloqueio" />
          <h2>Alertas de superfaturamento</h2>
        </div>
        <div className="mt-4 rounded-ficha border border-regua">
          <Tabela>
            <TabelaCabecalho>
              <TabelaLinha>
                <TabelaTitulo>Item</TabelaTitulo>
                <TabelaTitulo>Fornecedor</TabelaTitulo>
                <TabelaTitulo numerica>Proposto</TabelaTitulo>
                <TabelaTitulo numerica>Limite</TabelaTitulo>
                <TabelaTitulo numerica>Sobrepreço</TabelaTitulo>
                <TabelaTitulo numerica>Data</TabelaTitulo>
                <TabelaTitulo />
              </TabelaLinha>
            </TabelaCabecalho>
            <TabelaCorpo>
              {rejeicoes.length === 0 ? (
                <TabelaVazia colSpan={7}>
                  Nenhuma compra foi bloqueada no período.
                </TabelaVazia>
              ) : (
                rejeicoes.map(({ repasse, sobrepreco }) => (
                  <TabelaLinha key={repasse.id} className="hover:bg-placa">
                    <TabelaCelula>{nomeItem(repasse.itemId)}</TabelaCelula>
                    <TabelaCelula className="text-grafite">
                      {nomeFornecedor(repasse.fornecedorId)}
                    </TabelaCelula>
                    <TabelaCelula numerica>
                      {formatarReais(repasse.precoUnitarioEfetivo)}/
                      {unidadeItem(repasse.itemId)}
                    </TabelaCelula>
                    <TabelaCelula numerica className="text-grafite">
                      {formatarReais(repasse.limiteAplicado)}
                    </TabelaCelula>
                    <TabelaCelula numerica className="font-semibold text-bloqueio">
                      {formatarPercentual(sobrepreco)}
                    </TabelaCelula>
                    <TabelaCelula numerica className="whitespace-nowrap text-grafite">
                      {formatarData(repasse.criadoEm)}
                    </TabelaCelula>
                    <TabelaCelula>
                      <Link
                        href={{ pathname: '/transparencia/repasse', query: { id: repasse.id } }}
                        className="text-indice underline-offset-2 hover:underline"
                      >
                        abrir
                      </Link>
                    </TabelaCelula>
                  </TabelaLinha>
                ))
              )}
            </TabelaCorpo>
          </Tabela>
        </div>
      </section>

      {/* --- Pendências vencidas ---------------------------------------------- */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-5 text-retido" />
          <h2>Entregas sem confirmação além do prazo</h2>
        </div>
        <p className="mt-2 max-w-3xl text-xs text-grafite">
          O valor saiu da conta da prefeitura e está sob controle do programa. Como não
          existe instrução de devolução, ele permanece imobilizado enquanto o quórum não se
          completar — falha CRIT-03, descrita na{' '}
          <Link href="/programa" className="text-indice underline underline-offset-2">
            página do programa
          </Link>
          .
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {vencidas.length === 0 ? (
            <p className="text-xs text-grafite">Nenhuma pendência vencida.</p>
          ) : (
            vencidas.map((e) => {
              const r = repassePorId(app.repasses, e.repasseId);
              if (r === undefined) return null;
              return (
                <Ficha key={e.repasseId} trilho="retido">
                  <FichaCabecalho>
                    <FichaSobrescrito>
                      {r.id} · {nomeEscola(e.escolaId)}
                    </FichaSobrescrito>
                    <FichaTitulo className="text-sm">{nomeItem(r.itemId)}</FichaTitulo>
                  </FichaCabecalho>
                  <FichaCorpo className="space-y-2">
                    <p className="dado text-md font-semibold text-retido">
                      {formatarReais(r.valorTotal)}
                    </p>
                    <p className="text-2xs text-grafite">
                      vencido há {Math.abs(diasAteVencimento(e, app.instanteAtual))} dias ·{' '}
                      {e.confirmadoPor.length} de {app.programa.confirmacoesNecessarias}{' '}
                      confirmações
                    </p>
                    <Botao asChild tamanho="sm" variante="discreto" className="-ml-3">
                      <Link href={{ pathname: '/transparencia/repasse', query: { id: r.id } }}>
                        Ver detalhe <ArrowRight className="size-4" />
                      </Link>
                    </Botao>
                  </FichaCorpo>
                </Ficha>
              );
            })
          )}
        </div>
      </section>

      {/* --- Divergências ------------------------------------------------------ */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <TriangleAlert aria-hidden="true" className="size-5 text-bloqueio" />
          <h2>Divergências abertas</h2>
        </div>
        <p className="mt-2 max-w-3xl text-xs text-grafite">
          <strong className="text-tinta">Extensão desta simulação.</strong> O programa
          publicado não modela divergência — a instrução existente só confirma entrega. Este
          fluxo mostra o que a v0.2 precisa incluir para que a recusa na ponta tenha efeito
          on-chain.
        </p>
        <div className="mt-4 space-y-3">
          {divergencias.length === 0 ? (
            <p className="text-xs text-grafite">Nenhuma divergência registrada.</p>
          ) : (
            divergencias.map((e) => {
              const r = repassePorId(app.repasses, e.repasseId);
              if (r === undefined) return null;
              return (
                <Ficha key={e.repasseId} trilho="bloqueio">
                  <FichaCabecalho>
                    <FichaSobrescrito>
                      {r.id} · {nomeEscola(e.escolaId)} · {formatarReais(r.valorTotal)} retidos
                    </FichaSobrescrito>
                    <FichaTitulo className="text-sm">{nomeItem(r.itemId)}</FichaTitulo>
                  </FichaCabecalho>
                  <FichaCorpo>
                    <p className="text-xs text-grafite">{e.descricaoDivergencia}</p>
                    <p className="mt-2 text-2xs text-grafite">
                      Registrada pelo conselho escolar. O valor permanece retido até a
                      ocorrência ser resolvida.
                    </p>
                  </FichaCorpo>
                </Ficha>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
