'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Gavel,
  Scale,
  ShieldAlert,
  Store,
} from 'lucide-react';
import { useApp } from './provedor';
import { calcularImpacto } from '@/adapter/impacto';
import { formatarInteiro, formatarReais } from '@/adapter/formato';
import { Botao } from '@/components/ui/button';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import { ReguaTolerancia } from '@/components/dominio/regua-tolerancia';
import { MUNICIPIO, TOTAL_ALUNOS } from '@/mocks/municipio';

/**
 * Landing (US1, FR-051, FR-054).
 *
 * Precisa ser compreensível em 60 segundos, no celular, por quem nunca ouviu
 * falar do projeto. A régua de tolerância é o herói: a tese em uma imagem,
 * antes de qualquer texto explicativo.
 */
export default function Landing() {
  const { app } = useApp();
  const impacto = calcularImpacto(app.repasses);

  return (
    <main>
      {/* --- Topo ---------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:pt-16">
        <p className="sobrescrito">Auditoria preventiva de verbas da merenda escolar</p>
        <h1 className="mt-3 max-w-3xl">
          A merenda superfaturada é bloqueada{' '}
          <span className="text-bloqueio">antes do pagamento</span>, não auditada anos
          depois.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-grafite">
          Fontes independentes reportam o preço de mercado. A mediana dessas cotações vira
          a referência. Qualquer compra acima dela, além da tolerância, é recusada pelo
          programa — e o dinheiro nem sai da conta da prefeitura.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Botao asChild tamanho="lg">
            <Link href="/transparencia">
              Consultar painel público <ArrowRight className="size-4" />
            </Link>
          </Botao>
          <Botao asChild tamanho="lg" variante="contorno">
            <Link href="/entrar">Entrar na plataforma</Link>
          </Botao>
        </div>
        <p className="mt-3 text-2xs text-grafite">
          O painel público não exige cadastro. Entrar na plataforma é escolher um dos
          quatro perfis de demonstração — nenhuma credencial é solicitada.
        </p>
      </section>

      {/* --- A trava, em uma imagem ---------------------------------------- */}
      <section className="border-y border-regua bg-placa">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="sobrescrito">Caso real da demonstração</p>
              <h2 className="mt-2">
                Leite integral a R$ 9,90 o litro, contra um teto de R$ 5,98
              </h2>
              <p className="mt-3 max-w-prose text-xs text-grafite">
                Uma compra de 40.000 litros por R$ 396.000,00. A mediana das cinco fontes
                é R$ 5,20; com a tolerância de 15%, o teto é R$ 5,98. O programa recusou a
                transação.
              </p>
              <Botao asChild tamanho="sm" variante="discreto" className="mt-3 -ml-3">
                <Link href="/transparencia?situacao=Rejeitado">
                  Ver as cinco rejeições <ArrowRight className="size-4" />
                </Link>
              </Botao>
            </div>

            <div className="rounded-ficha border border-regua bg-papel p-4">
              <ReguaTolerancia
                mediana={520n}
                limite={598n}
                proposta={990n}
                unidade="L"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Impacto -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="sobrescrito">Sobrepreço bloqueado</p>
            <p className="dado mt-2 text-xl leading-none font-semibold text-bloqueio">
              {formatarReais(impacto.valorBloqueado)}
            </p>
            <p className="mt-2 text-xs text-grafite">
              Diferença entre o proposto e o teto aceitável, somando as
              {' '}{impacto.totalBloqueados} compras recusadas.
            </p>
          </div>
          <div>
            <p className="sobrescrito">Refeições preservadas</p>
            <p className="dado mt-2 text-xl leading-none font-semibold text-liberado">
              {formatarInteiro(impacto.refeicoesPreservadas)}
            </p>
            <p className="mt-2 text-xs text-grafite">
              A R$ 2,10 por refeição — cerca de {formatarInteiro(impacto.diasDeMerenda)}{' '}
              dias de merenda para a rede inteira.
            </p>
          </div>
          <div>
            <p className="sobrescrito">Alunos alcançados</p>
            <p className="dado mt-2 text-xl leading-none font-semibold text-indice">
              {formatarInteiro(TOTAL_ALUNOS)}
            </p>
            <p className="mt-2 text-xs text-grafite">
              Em {MUNICIPIO.nome}, município fictício de {formatarInteiro(MUNICIPIO.populacao)}{' '}
              habitantes, com 12 escolas na rede.
            </p>
          </div>
        </div>
      </section>

      {/* --- Problema ------------------------------------------------------- */}
      <section className="border-t border-regua">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="sobrescrito">O problema</p>
          <h2 className="mt-2 max-w-2xl">
            Quando a auditoria chega, a criança já deixou de comer
          </h2>
          <p className="mt-3 max-w-2xl text-xs text-grafite">
            A merenda escolar está entre os alvos mais frequentes de superfaturamento em
            licitações municipais. O desvio é descoberto anos depois, quando o recurso já
            foi consumido.
          </p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-ficha border border-regua bg-regua sm:grid-cols-2">
            <div className="bg-papel p-5">
              <p className="sobrescrito">Hoje</p>
              <ul className="mt-3 space-y-3 text-xs text-grafite">
                <li>
                  <strong className="text-tinta">Auditoria posterior.</strong> A
                  irregularidade aparece anos depois do desvio.
                </li>
                <li>
                  <strong className="text-tinta">Insumo subpadronizado.</strong> Alimento
                  de baixa qualidade comprado a preço inflacionado.
                </li>
                <li>
                  <strong className="text-tinta">Opacidade.</strong> Pais, professores e
                  conselhos não conseguem acompanhar.
                </li>
              </ul>
            </div>
            <div className="bg-papel p-5">
              <p className="sobrescrito">Com o RepasseTransparente</p>
              <ul className="mt-3 space-y-3 text-xs text-grafite">
                <li>
                  <strong className="text-tinta">Prevenção em tempo real.</strong> A
                  liberação é bloqueada antes da emissão do pagamento.
                </li>
                <li>
                  <strong className="text-tinta">Poder de compra preservado.</strong> O
                  município compra pelo preço de mercado real.
                </li>
                <li>
                  <strong className="text-tinta">Leitura pública.</strong> Qualquer pessoa
                  consulta os repasses sem cadastro.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Como funciona --------------------------------------------------- */}
      <section className="border-t border-regua bg-placa">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="sobrescrito">Como funciona</p>
          <h2 className="mt-2">Três passos, nesta ordem</h2>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                n: '01',
                titulo: 'As fontes reportam preços',
                texto:
                  'Cinco entidades independentes — órgão oficial, universidade, consórcio de municípios vizinhos e duas associações de produtores — informam o preço praticado.',
              },
              {
                n: '02',
                titulo: 'A mediana vira a referência',
                texto:
                  'O preço de referência é a mediana das cotações, não a média. Uma fonte comprometida que reporte um valor absurdo distorce a média inteira e não move a mediana.',
              },
              {
                n: '03',
                titulo: 'A trava recusa o excesso',
                texto:
                  'Proposta acima da mediana mais 15% é recusada pelo programa. O valor em BRZ sequer sai da conta da prefeitura.',
              },
            ].map((p) => (
              <li key={p.n}>
                <span className="dado text-md font-semibold text-indice">{p.n}</span>
                <h3 className="mt-1">{p.titulo}</h3>
                <p className="mt-2 text-xs text-grafite">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- Por que blockchain ---------------------------------------------- */}
      <section className="border-t border-regua">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="sobrescrito">A pergunta da banca</p>
          <h2 className="mt-2 max-w-2xl">
            Por que não um banco de dados com um portal público?
          </h2>
          <p className="mt-3 max-w-2xl text-xs text-grafite">
            Porque o problema é coordenar entidades com interesses potencialmente
            conflitantes e sem confiança mútua: prefeitura, fornecedor, escola e sociedade
            civil. Três diferenças concretas:
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Diferenca
              Icone={ShieldAlert}
              titulo="Custódia do registro"
              centralizado="Um único órgão controla o banco. Quem tem acesso privilegiado altera ou apaga."
              distribuido="Distribuído entre validadores. Alteração retroativa é computacionalmente inviável."
            />
            <Diferenca
              Icone={Scale}
              titulo="Lógica de execução"
              centralizado="Rotinas internas do servidor, que podem ser desligadas ou contornadas."
              distribuido="Programa autônomo: as regras executam de forma determinística e pública."
            />
            <Diferenca
              Icone={ClipboardCheck}
              titulo="Auditoria externa"
              centralizado="Depende de relatórios enviados pelo próprio auditado."
              distribuido="Qualquer cidadão consulta transações e registros de oráculo diretamente."
            />
          </div>

          <p className="mt-8 max-w-2xl text-xs text-grafite">
            A liquidação acontece em <strong className="text-tinta">BRZ</strong>, stablecoin
            pareada 1:1 ao Real. Isso faz do lançamento contábil o próprio pagamento — e
            elimina a diferença entre os dois, que é justamente onde a fraude costuma se
            alojar.
          </p>
        </div>
      </section>

      {/* --- Atores ---------------------------------------------------------- */}
      <section className="border-t border-regua bg-placa">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="sobrescrito">Quem usa</p>
          <h2 className="mt-2">Quatro atores, quatro visões do mesmo sistema</h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Ator
              Icone={Building2}
              papel="Gestor municipal"
              faz="Registra as compras de merenda e recebe o bloqueio na hora, com o motivo quantificado."
            />
            <Ator
              Icone={Store}
              papel="Fontes oraculares"
              faz="Reportam o preço praticado no mercado. Nenhuma sozinha define a referência."
            />
            <Ator
              Icone={ClipboardCheck}
              papel="Conselho escolar"
              faz="Confirma que os alimentos chegaram. Sem duas confirmações, o fornecedor não recebe."
            />
            <Ator
              Icone={Gavel}
              papel="Órgãos de controle"
              faz="Auditam em tempo real os alertas de rejeição e as pendências de entrega."
            />
          </div>

          <Botao asChild variante="contorno" className="mt-8">
            <Link href="/entrar">
              Experimentar os quatro perfis <ArrowRight className="size-4" />
            </Link>
          </Botao>
        </div>
      </section>

      {/* --- Honestidade ------------------------------------------------------ */}
      <section className="border-t border-regua">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Ficha trilho="retido" className="max-w-3xl">
            <FichaCabecalho>
              <FichaSobrescrito>O que este protótipo não é</FichaSobrescrito>
              <FichaTitulo>A execução é simulada, e isso é escopo, não omissão</FichaTitulo>
            </FichaCabecalho>
            <FichaCorpo className="space-y-3 text-xs text-grafite">
              <p>
                A lógica do programa Anchor é reproduzida fielmente em software, mas nenhuma
                transação toca a rede Solana e nenhum BRZ real é movimentado. Município,
                escolas, fornecedores e pessoas são fictícios.
              </p>
              <p>
                O encadeamento por hash do registro prova{' '}
                <strong className="text-tinta">integridade</strong>, não{' '}
                <strong className="text-tinta">descentralização</strong>: um operador único
                ainda poderia reescrever a cadeia inteira. O que impede isso em rede real é
                a replicação entre validadores independentes.
              </p>
              <p>
                Auditamos o próprio programa e encontramos três falhas críticas — duas delas
                introduzidas pela custódia. Estão listadas, com a correção proposta, na{' '}
                <Link
                  href="/programa"
                  className="text-indice underline underline-offset-2"
                >
                  página do programa
                </Link>
                .
              </p>
            </FichaCorpo>
          </Ficha>
        </div>
      </section>
    </main>
  );
}

function Diferenca({
  Icone,
  titulo,
  centralizado,
  distribuido,
}: {
  Icone: typeof ShieldAlert;
  titulo: string;
  centralizado: string;
  distribuido: string;
}) {
  return (
    <div>
      <Icone aria-hidden="true" className="size-5 text-indice" />
      <h3 className="mt-2 text-sm font-semibold">{titulo}</h3>
      <p className="mt-2 text-2xs text-grafite">
        <span className="sobrescrito block">Banco centralizado</span>
        {centralizado}
      </p>
      <p className="mt-2 text-2xs text-grafite">
        <span className="sobrescrito block">Programa em rede</span>
        {distribuido}
      </p>
    </div>
  );
}

function Ator({
  Icone,
  papel,
  faz,
}: {
  Icone: typeof Building2;
  papel: string;
  faz: string;
}) {
  return (
    <div className="rounded-ficha border border-regua bg-papel p-4">
      <Icone aria-hidden="true" className="size-5 text-indice" />
      <h3 className="mt-2 text-sm font-semibold">{papel}</h3>
      <p className="mt-1 text-2xs text-grafite">{faz}</p>
    </div>
  );
}
