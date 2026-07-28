'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, QrCode, TriangleAlert } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { GuardaPapel } from '@/components/plataforma/guarda';
import { diasAteVencimento, entregaVencida, podeConfirmar } from '@/adapter/escrow';
import { nomeEscola, nomeFornecedor, nomeItem, repassePorId } from '@/adapter/consultas';
import { formatarData, formatarReais } from '@/adapter/formato';
import { MarcadorQuorum } from '@/components/dominio/barra-custodia';
import { Botao } from '@/components/ui/button';
import { AuxilioCampo, Entrada, Rotulo } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';
import { Ficha, FichaCabecalho, FichaCorpo, FichaRodape, FichaSobrescrito, FichaTitulo, LinhaDado } from '@/components/ui/ficha';
import type { Entrega } from '@/dominio/tipos';

/**
 * Painel do Conselho de Alimentação Escolar (US7, FR-035, FR-038, FR-043, FR-044).
 *
 * O CAE é órgão municipal cujos membros fiscalizam as unidades da rede — a lista
 * cobre o município inteiro, com a escola do perfil em primeiro lugar.
 */
export default function PaginaConselho() {
  return (
    <GuardaPapel papel="conselho">
      <Conselho />
    </GuardaPapel>
  );
}

function Conselho() {
  const { app, perfil } = useApp();

  const pendentes = app.entregas
    .filter((e) => e.situacao !== 'confirmada')
    .sort((a, b) => {
      const minhaA = a.escolaId === perfil?.escolaId ? 0 : 1;
      const minhaB = b.escolaId === perfil?.escolaId ? 0 : 1;
      if (minhaA !== minhaB) return minhaA - minhaB;
      const vencA = entregaVencida(a, app.instanteAtual) ? 0 : 1;
      const vencB = entregaVencida(b, app.instanteAtual) ? 0 : 1;
      return vencA !== vencB ? vencA - vencB : a.prazoLimite - b.prazoLimite;
    });

  const vencidas = pendentes.filter((e) => entregaVencida(e, app.instanteAtual));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="sobrescrito">Conselho de Alimentação Escolar</p>
      <h1 className="mt-1">Confirmação de entregas</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        O fornecedor só recebe depois que <strong className="text-tinta">duas partes
        independentes</strong> confirmarem que os alimentos chegaram. Até lá, o valor fica
        retido em custódia — a compra pode ter preço justo e mercadoria que nunca chegou.
      </p>

      {vencidas.length > 0 && (
        <Aviso tom="atencao" className="mt-6" titulo={`${vencidas.length} entregas com prazo vencido`}>
          O programa publicado <strong>não tem instrução de devolução</strong>: enquanto o
          quórum não se completar, o valor permanece imobilizado na custódia, sem caminho de
          volta para a prefeitura. É a falha CRIT-03, descrita na{' '}
          <Link href="/programa" className="text-indice underline underline-offset-2">
            página do programa
          </Link>
          .
        </Aviso>
      )}

      <section className="mt-8 space-y-4">
        {pendentes.length === 0 ? (
          <Ficha trilho="liberado">
            <FichaCabecalho>
              <FichaSobrescrito>Nada pendente</FichaSobrescrito>
              <FichaTitulo>Todas as entregas foram confirmadas</FichaTitulo>
            </FichaCabecalho>
            <FichaCorpo>
              <p className="text-xs text-grafite">
                Nenhum valor aguarda confirmação neste momento.
              </p>
              <Botao asChild variante="contorno" className="mt-4">
                <Link href="/transparencia">Ver o painel público</Link>
              </Botao>
            </FichaCorpo>
          </Ficha>
        ) : (
          pendentes.map((e) => <CartaoEntrega key={e.repasseId} entrega={e} />)
        )}
      </section>

      <section className="mt-10">
        <Ficha>
          <FichaCabecalho>
            <div className="flex items-center gap-2">
              <QrCode aria-hidden="true" className="size-5 text-grafite" />
              <FichaSobrescrito>Fluxo pretendido em produção</FichaSobrescrito>
            </div>
            <FichaTitulo>Conferência na porta da cozinha</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            <p className="text-xs text-grafite">
              A proposta prevê um aplicativo móvel em que o conselheiro lê o QR Code da nota
              fiscal e registra foto da entrega, no momento em que os alimentos chegam. Isso
              está descrito aqui e <strong className="text-tinta">não implementado</strong> —
              fica fora do escopo deste protótipo, que simula a lógica de custódia, não a
              captura em campo.
            </p>
          </FichaCorpo>
        </Ficha>
      </section>
    </main>
  );
}

function CartaoEntrega({ entrega }: { entrega: Entrega }) {
  const { app, perfil, despachar } = useApp();
  const [abrindoDivergencia, setAbrindoDivergencia] = useState(false);
  const [descricao, setDescricao] = useState('');

  const repasse = repassePorId(app.repasses, entrega.repasseId);
  if (repasse === undefined || perfil === null) return null;

  const conta = app.programa.repasses.get(entrega.repasseId);
  const vencida = entregaVencida(entrega, app.instanteAtual);
  const dias = diasAteVencimento(entrega, app.instanteAtual);
  const veredito = podeConfirmar(entrega, perfil.endereco);
  const minhaEscola = entrega.escolaId === perfil.escolaId;

  return (
    <Ficha trilho={entrega.situacao === 'divergente' ? 'bloqueio' : vencida ? 'bloqueio' : 'retido'}>
      <FichaCabecalho>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <FichaSobrescrito>
            {repasse.id} · {nomeEscola(entrega.escolaId)}
          </FichaSobrescrito>
          {minhaEscola && <span className="sobrescrito text-indice">sua escola</span>}
        </div>
        <FichaTitulo>{nomeItem(repasse.itemId)}</FichaTitulo>
        <p className="text-2xs text-grafite">{nomeFornecedor(repasse.fornecedorId)}</p>
      </FichaCabecalho>

      <FichaCorpo className="space-y-4">
        <div>
          <LinhaDado rotulo="Valor retido em custódia">
            {formatarReais(repasse.valorTotal)}
          </LinhaDado>
          <LinhaDado rotulo="Prazo de confirmação">
            {formatarData(entrega.prazoLimite)}
            {vencida ? (
              <span className="ml-2 font-semibold text-bloqueio">
                vencido há {Math.abs(dias)} dias
              </span>
            ) : (
              <span className="ml-2 text-grafite">faltam {dias} dias</span>
            )}
          </LinhaDado>
        </div>

        <MarcadorQuorum
          confirmacoes={conta?.confirmacoes ?? entrega.confirmadoPor.length}
          quorum={app.programa.confirmacoesNecessarias}
          vencida={vencida}
        />

        {entrega.situacao === 'divergente' && (
          <Aviso tom="bloqueio" titulo="Divergência registrada">
            {entrega.descricaoDivergencia}
            <p className="mt-2">
              O valor permanece retido e a ocorrência é visível no painel público.
            </p>
            <p className="mt-2">
              <strong className="text-tinta">Extensão desta simulação:</strong> o programa
              publicado não modela divergência — a instrução existente só confirma entrega.
            </p>
          </Aviso>
        )}

        {!veredito.pode && entrega.situacao !== 'divergente' && (
          <Aviso tom="atencao" titulo="Você não pode confirmar esta entrega">
            {veredito.motivo}
          </Aviso>
        )}

        {abrindoDivergencia && (
          <div className="space-y-2 rounded-ficha border border-regua bg-placa p-4">
            <Rotulo htmlFor={`div-${entrega.repasseId}`}>
              O que estava diferente do pedido?
            </Rotulo>
            <Entrada
              id={`div-${entrega.repasseId}`}
              value={descricao}
              onChange={(ev) => setDescricao(ev.target.value)}
              placeholder="Ex.: recebidos 780 kg dos 900 kg da nota"
            />
            <AuxilioCampo>
              A descrição fica pública. O valor continua retido até a ocorrência ser
              resolvida.
            </AuxilioCampo>
            <AuxilioCampo>
              <strong className="text-tinta">Extensão desta simulação.</strong> O programa
              publicado não tem instrução de divergência — só confirmar entrega. Este fluxo
              mostra o que a v0.2 precisa incluir.
            </AuxilioCampo>
            <div className="flex flex-wrap gap-2 pt-1">
              <Botao
                variante="bloqueio"
                tamanho="sm"
                disabled={descricao.trim().length < 10}
                onClick={() => {
                  despachar({
                    tipo: 'registrar-divergencia',
                    repasseId: entrega.repasseId,
                    confirmador: perfil.endereco,
                    descricao: descricao.trim(),
                  });
                  setAbrindoDivergencia(false);
                  setDescricao('');
                }}
              >
                Registrar divergência
              </Botao>
              <Botao
                variante="discreto"
                tamanho="sm"
                onClick={() => setAbrindoDivergencia(false)}
              >
                Cancelar
              </Botao>
            </div>
          </div>
        )}
      </FichaCorpo>

      <FichaRodape className="flex-wrap">
        <Botao
          disabled={!veredito.pode}
          onClick={() =>
            despachar({
              tipo: 'confirmar-entrega',
              repasseId: entrega.repasseId,
              confirmador: perfil.endereco,
            })
          }
        >
          Confirmar recebimento
        </Botao>
        {entrega.situacao !== 'divergente' && !abrindoDivergencia && (
          <Botao variante="contorno" onClick={() => setAbrindoDivergencia(true)}>
            <TriangleAlert className="size-4" /> Registrar divergência
          </Botao>
        )}
        <Botao asChild variante="discreto">
          <Link href={{ pathname: '/transparencia/repasse', query: { id: repasse.id } }}>
            Detalhe <ArrowRight className="size-4" />
          </Link>
        </Botao>
      </FichaRodape>
    </Ficha>
  );
}
