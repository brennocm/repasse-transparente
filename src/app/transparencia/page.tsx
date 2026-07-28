'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, FilterX } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { consultar, alertas, nomeEscola, nomeFornecedor, nomeItem, unidadeItem } from '@/adapter/consultas';
import { sobreprecoPercentual } from '@/adapter/impacto';
import {
  formatarData,
  formatarInteiro,
  formatarPercentual,
  formatarQuantidade,
  formatarReais,
} from '@/adapter/formato';
import { Indicador, GradeIndicadores } from '@/components/dados/indicador';
import { Selo } from '@/components/ui/selo';
import { Selecao, Rotulo } from '@/components/ui/campo';
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
import { ITENS } from '@/mocks/itens';
import { ESCOLAS, MUNICIPIO } from '@/mocks/municipio';
import { calcularLimite } from '@/core/contrato';
import type { SituacaoRepasse } from '@/dominio/tipos';

const SITUACOES: readonly (SituacaoRepasse | 'todas')[] = [
  'todas',
  'Rejeitado',
  'Retido',
  'Liberado',
  'Divergente',
];

const SELO: Record<SituacaoRepasse, { situacao: 'bloqueado' | 'liberado' | 'retido' | 'divergente' | 'neutro'; rotulo: string }> = {
  Rejeitado: { situacao: 'bloqueado', rotulo: 'Bloqueado' },
  Liberado: { situacao: 'liberado', rotulo: 'Pago' },
  Retido: { situacao: 'retido', rotulo: 'Retido' },
  Divergente: { situacao: 'divergente', rotulo: 'Divergência' },
  Proposto: { situacao: 'neutro', rotulo: 'Proposto' },
};

export default function PainelPublico() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-xs text-grafite">Carregando…</div>}>
      <Painel />
    </Suspense>
  );
}

function Painel() {
  const { app } = useApp();
  const params = useSearchParams();

  const [situacao, setSituacao] = useState<SituacaoRepasse | 'todas'>(
    (params.get('situacao') as SituacaoRepasse | null) ?? 'todas',
  );
  const [itemId, setItemId] = useState<string>('todos');
  const [escolaId, setEscolaId] = useState<string>('todas');

  const filtrado = useMemo(
    () => consultar(app.repasses, { situacao, itemId, escolaId }),
    [app.repasses, situacao, itemId, escolaId],
  );

  const temFiltro = situacao !== 'todas' || itemId !== 'todos' || escolaId !== 'todas';
  const listaAlertas = alertas(app.repasses, 3);
  const { impacto } = filtrado;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="sobrescrito">
        {MUNICIPIO.nome} · {MUNICIPIO.ufNome} · dados fictícios
      </p>
      <h1 className="mt-2">Painel público de transparência</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Acompanhamento aberto dos repasses da merenda escolar. Sem cadastro, sem login.
        Cada linha é uma compra proposta, e cada bloqueio é dinheiro que não saiu da conta
        da prefeitura.
      </p>

      {/* --- Indicadores ---------------------------------------------------- */}
      <section className="mt-8 border-y border-regua py-6">
        <GradeIndicadores>
          <Indicador
            rotulo="Proposto"
            valor={formatarReais(impacto.valorProposto)}
            nota={`${impacto.totalRepasses} repasses`}
          />
          <Indicador
            rotulo="Bloqueado"
            valor={formatarReais(impacto.valorBloqueado)}
            tom="bloqueio"
            destaque
            nota={`${impacto.totalBloqueados} compras recusadas`}
          />
          <Indicador
            rotulo="Refeições preservadas"
            valor={formatarInteiro(impacto.refeicoesPreservadas)}
            tom="liberado"
            destaque
            nota={`≈ ${formatarInteiro(impacto.diasDeMerenda)} dias de merenda`}
          />
          <Indicador
            rotulo="Em custódia"
            valor={formatarReais(impacto.valorEmCustodia)}
            tom="retido"
            nota="aguardando confirmação de entrega"
          />
          <Indicador
            rotulo="Pago a fornecedores"
            valor={formatarReais(impacto.valorLiberado)}
            tom="liberado"
            nota="após quórum de 2 confirmações"
          />
          <Indicador
            rotulo="Escolas alcançadas"
            valor={formatarInteiro(impacto.escolasAlcancadas)}
            nota={`${formatarInteiro(impacto.alunosAlcancados)} alunos na rede`}
          />
        </GradeIndicadores>
        {temFiltro && (
          <p className="mt-4 text-2xs text-grafite">
            Indicadores recalculados para o recorte filtrado.
          </p>
        )}
      </section>

      {/* --- Alertas -------------------------------------------------------- */}
      {listaAlertas.length > 0 && (
        <section className="mt-10">
          <h2>Alertas recentes</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {listaAlertas.map(({ repasse, sobrepreco }) => (
              <Ficha key={repasse.id} trilho="bloqueio">
                <FichaCabecalho>
                  <FichaSobrescrito>
                    {formatarData(repasse.criadoEm)} · {repasse.id}
                  </FichaSobrescrito>
                  <FichaTitulo className="text-sm">
                    {nomeItem(repasse.itemId)}
                  </FichaTitulo>
                </FichaCabecalho>
                <FichaCorpo className="space-y-2">
                  <p className="dado text-md font-semibold text-bloqueio">
                    {formatarPercentual(sobrepreco)}
                  </p>
                  <p className="text-2xs text-grafite">
                    acima da mediana, proposto por {nomeFornecedor(repasse.fornecedorId)}
                  </p>
                  <Botao asChild tamanho="sm" variante="discreto" className="-ml-3">
                    <Link href={{ pathname: '/transparencia/repasse', query: { id: repasse.id } }}>
                      Ver detalhe <ArrowRight className="size-4" />
                    </Link>
                  </Botao>
                </FichaCorpo>
              </Ficha>
            ))}
          </div>
        </section>
      )}

      {/* --- Filtros e lista -------------------------------------------------- */}
      <section className="mt-10">
        <h2>Repasses</h2>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-40 flex-1">
            <Rotulo htmlFor="f-situacao">Situação</Rotulo>
            <Selecao
              id="f-situacao"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value as SituacaoRepasse | 'todas')}
              className="mt-1"
            >
              {SITUACOES.map((s) => (
                <option key={s} value={s}>
                  {s === 'todas' ? 'Todas' : SELO[s].rotulo}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="min-w-40 flex-1">
            <Rotulo htmlFor="f-item">Item</Rotulo>
            <Selecao
              id="f-item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1"
            >
              <option value="todos">Todos</option>
              {ITENS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="min-w-40 flex-1">
            <Rotulo htmlFor="f-escola">Escola</Rotulo>
            <Selecao
              id="f-escola"
              value={escolaId}
              onChange={(e) => setEscolaId(e.target.value)}
              className="mt-1"
            >
              <option value="todas">Todas</option>
              {ESCOLAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Selecao>
          </div>
          {temFiltro && (
            <Botao
              variante="contorno"
              onClick={() => {
                setSituacao('todas');
                setItemId('todos');
                setEscolaId('todas');
              }}
            >
              <FilterX className="size-4" /> Limpar filtros
            </Botao>
          )}
        </div>

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
              {filtrado.repasses.length === 0 ? (
                <TabelaVazia colSpan={7}>
                  Nenhum repasse corresponde a este recorte. Limpe os filtros para ver
                  todos os {app.repasses.length}.
                </TabelaVazia>
              ) : (
                [...filtrado.repasses]
                  .sort((a, b) => b.criadoEm - a.criadoEm)
                  .map((r) => (
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

      {/* --- Preços de referência --------------------------------------------- */}
      <section className="mt-10">
        <h2>Preços de referência</h2>
        <p className="mt-2 max-w-2xl text-xs text-grafite">
          Mediana das cotações reportadas pelas cinco fontes independentes, e o teto que a
          trava aplica sobre ela.
        </p>

        <div className="mt-4 rounded-ficha border border-regua">
          <Tabela>
            <TabelaCabecalho>
              <TabelaLinha>
                <TabelaTitulo>Item</TabelaTitulo>
                <TabelaTitulo numerica>Mediana</TabelaTitulo>
                <TabelaTitulo numerica>Limite (+15%)</TabelaTitulo>
                <TabelaTitulo numerica>Fontes</TabelaTitulo>
                <TabelaTitulo numerica>Atualizado</TabelaTitulo>
              </TabelaLinha>
            </TabelaCabecalho>
            <TabelaCorpo>
              {ITENS.map((item) => {
                const preco = app.programa.tabelaPrecos.get(item.id);
                const cotacoes = app.programa.cotacoesOraculo.get(item.id)?.size ?? 0;
                if (preco === undefined) return null;
                return (
                  <TabelaLinha key={item.id} className="hover:bg-placa">
                    <TabelaCelula>
                      <Link
                        href={{ pathname: '/transparencia/item', query: { id: item.id } }}
                        className="font-medium text-indice underline-offset-2 hover:underline"
                      >
                        {item.nome}
                      </Link>
                    </TabelaCelula>
                    <TabelaCelula numerica>
                      {formatarReais(preco.precoMediana)}/{item.unidade}
                    </TabelaCelula>
                    <TabelaCelula numerica>
                      {formatarReais(
                        calcularLimite(preco.precoMediana, app.programa.toleranciaPercentual),
                      )}
                      /{item.unidade}
                    </TabelaCelula>
                    <TabelaCelula numerica>{cotacoes}</TabelaCelula>
                    <TabelaCelula numerica className="whitespace-nowrap text-grafite">
                      {formatarData(preco.atualizadoEm)}
                    </TabelaCelula>
                  </TabelaLinha>
                );
              })}
            </TabelaCorpo>
          </Tabela>
        </div>
      </section>
    </main>
  );
}
