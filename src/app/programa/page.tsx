'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleCheck, RotateCcw, ShieldAlert, Wrench } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { CodigoRust } from '@/components/dominio/codigo-rust';
import { MarcadorQuorum } from '@/components/dominio/barra-custodia';
import { saldoBrz } from '@/core/contrato';
import { CONTA_CUSTODIA } from '@/core/tipos';
import { nomeEscola, nomeItem, repassePorId } from '@/adapter/consultas';
import { formatarReais } from '@/adapter/formato';
import {
  CAMINHO_PARA_REDE_REAL,
  CODIGO_ANCHOR,
  CORRIGIDO_NA_MIGRACAO,
  DIVERGENCIAS,
  ROTULO_SEVERIDADE,
  type Severidade,
} from '@/dominio/programa';
import { Botao } from '@/components/ui/button';
import { Aviso } from '@/components/ui/aviso';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo, LinhaDado } from '@/components/ui/ficha';
import { PERFIS } from '@/mocks/perfis';
import { cn } from '@/lib/utils';

const TRILHO: Record<Severidade, 'bloqueio' | 'retido' | 'neutro'> = {
  critica: 'bloqueio',
  alta: 'retido',
  media: 'neutro',
};

/**
 * Programa e auditoria (US8, FR-052, FR-054 a FR-058).
 *
 * Reconhecer, entender e saber corrigir um defeito do próprio artefato pontua no
 * critério Risco. Esconder o defeito só adia a descoberta para o momento em que
 * alguém da banca ler o código.
 */
export default function Programa() {
  const { app } = useApp();
  const criticas = DIVERGENCIAS.filter((d) => d.severidade === 'critica');

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="sobrescrito">Solana · Anchor · liquidação em BRZ</p>
      <h1 className="mt-1">O programa e suas limitações</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Este é o programa da proposta, com o que a migração corrigiu e o que continua em
        aberto. Auditamos o próprio artefato e encontramos {criticas.length} falhas
        críticas — duas delas introduzidas justamente pela custódia.
      </p>

      <Aviso tom="informativo" className="mt-6" titulo="A execução aqui é simulada">
        A lógica deste programa é reproduzida fielmente em TypeScript, incluindo os defeitos
        listados abaixo. Nenhuma transação toca a rede Solana e nenhum BRZ real é
        movimentado. O que o protótipo demonstra é a mecânica, não uma implantação.
      </Aviso>

      {/* --- O que a migração corrigiu --------------------------------------- */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <CircleCheck aria-hidden="true" className="size-5 text-liberado" />
          <h2>O que a migração para Solana corrigiu</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-grafite">
          A primeira versão da proposta usava um contrato Solidity. Seis defeitos daquela
          versão deixaram de existir — a evolução entre as duas é, ela própria, parte do
          argumento técnico.
        </p>

        <div className="mt-4 overflow-hidden rounded-ficha border border-regua">
          {CORRIGIDO_NA_MIGRACAO.map((c, i) => (
            <div
              key={i}
              className={cn(
                'grid gap-1 p-4 sm:grid-cols-2 sm:gap-6',
                i > 0 && 'border-t border-regua',
              )}
            >
              <p className="text-2xs text-grafite line-through decoration-bloqueio/50">
                {c.antes}
              </p>
              <p className="text-2xs">
                <span className="text-liberado">✓ </span>
                {c.agora}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Divergências abertas --------------------------------------------- */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <ShieldAlert aria-hidden="true" className="size-5 text-bloqueio" />
          <h2>O que continua em aberto</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-grafite">
          Cada item traz o que é, qual o impacto e qual a correção proposta para a próxima
          versão do programa.
        </p>

        <div className="mt-4 space-y-4">
          {DIVERGENCIAS.map((d) => (
            <Ficha key={d.id} trilho={TRILHO[d.severidade]}>
              <FichaCabecalho>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <FichaSobrescrito>{d.id}</FichaSobrescrito>
                  <span
                    className="sobrescrito"
                    style={{
                      color:
                        d.severidade === 'critica'
                          ? 'var(--color-bloqueio)'
                          : d.severidade === 'alta'
                            ? 'var(--color-retido)'
                            : 'var(--color-grafite)',
                    }}
                  >
                    {ROTULO_SEVERIDADE[d.severidade]}
                  </span>
                </div>
                <FichaTitulo className="text-sm">{d.titulo}</FichaTitulo>
              </FichaCabecalho>
              <FichaCorpo className="space-y-3 text-2xs text-grafite">
                <p>
                  <span className="sobrescrito block">O que é</span>
                  {d.oQueE}
                </p>
                <p>
                  <span className="sobrescrito block">Impacto</span>
                  {d.impacto}
                </p>
                <p>
                  <span className="sobrescrito block">Proposta para a v0.2</span>
                  {d.propostaV02}
                </p>
                {d.mitigacaoParcial !== undefined && (
                  <p className="rounded-ficha border border-retido/30 bg-retido-tenue p-3 text-tinta">
                    <span className="sobrescrito block">Mitigação nesta demonstração</span>
                    {d.mitigacaoParcial}
                  </p>
                )}
              </FichaCorpo>
            </Ficha>
          ))}
        </div>
      </section>

      {/* --- Demonstração da falha de quórum ---------------------------------- */}
      <DemonstracaoQuorum />

      {/* --- Código ------------------------------------------------------------ */}
      <section className="mt-10">
        <h2>O programa</h2>
        <p className="mt-2 max-w-2xl text-xs text-grafite">
          Seção 5 da proposta. O código tem caráter ilustrativo: as structs de{' '}
          <span className="dado">Context</span> foram omitidas pela proposta, o que impede
          verificar as constraints de conta.
        </p>
        <CodigoRust fonte={CODIGO_ANCHOR} className="mt-4" />
      </section>

      {/* --- Caminho para a rede real ------------------------------------------ */}
      <section className="mt-10">
        <h2>O que falta para sair da simulação</h2>
        <ol className="mt-4 space-y-3">
          {CAMINHO_PARA_REDE_REAL.map((passo, i) => (
            <li key={i} className="flex gap-3">
              <span className="dado shrink-0 text-xs font-semibold text-indice">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-xs text-grafite">{passo}</span>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-2xl text-2xs text-grafite">
          Sobre a escolha da rede: a proposta opta por Solana pelo custo de transação, pelo
          tempo de confirmação e pela disponibilidade nativa do BRZ, dispensando pontes
          entre cadeias. Sobre o Drex, a decisão foi não depender dele — o lançamento foi
          adiado, com escopo inicial interbancário e sem acesso do público. A arquitetura
          permanece compatível com uma migração futura, caso ele passe a oferecer
          programabilidade equivalente.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-regua pt-6">
        <Botao asChild variante="contorno">
          <Link href="/explorador">
            Ver os registros da cadeia <ArrowRight className="size-4" />
          </Link>
        </Botao>
        <Botao asChild variante="discreto">
          <Link href="/transparencia">Painel público</Link>
        </Botao>
      </div>
    </main>
  );
}

/**
 * Demonstração executável de CRIT-02 (FR-057, FR-058).
 *
 * O enquadramento antes e depois é obrigatório: sem ele, a demonstração vira
 * propaganda contra o próprio projeto. Uma falha que o avaliador reproduz com as
 * próprias mãos convence de um jeito que um parágrafo não convence — desde que
 * fique claro que ela é conhecida e tem correção proposta.
 */
function DemonstracaoQuorum() {
  const { app, despachar } = useApp();
  const [executada, setExecutada] = useState(false);
  /**
   * O alvo precisa ficar fixo depois de executado.
   *
   * Recalculá-lo como "pendente sem confirmação" faz a entrega sair do filtro
   * assim que o quórum é atingido — e a tela perderia justamente o resultado que
   * existe para mostrar.
   */
  const [alvoId, setAlvoId] = useState<string | null>(null);

  const conselheiro = PERFIS.find((p) => p.papel === 'conselho')?.endereco ?? '';

  const alvo =
    alvoId !== null
      ? app.entregas.find((e) => e.repasseId === alvoId)
      : app.entregas.find(
          (e) => e.situacao === 'pendente' && e.confirmadoPor.length === 0,
        );
  const repasse = alvo === undefined ? undefined : repassePorId(app.repasses, alvo.repasseId);
  const conta = alvo === undefined ? undefined : app.programa.repasses.get(alvo.repasseId);

  const liberado = repasse?.situacao === 'Liberado';

  function executar() {
    if (alvo === undefined) return;
    setAlvoId(alvo.repasseId);
    // Duas confirmações, mesma carteira, ignorando a unicidade que a aplicação
    // impõe — reproduz exatamente o que o programa permitiria em rede real.
    despachar({
      tipo: 'confirmar-entrega',
      repasseId: alvo.repasseId,
      confirmador: conselheiro,
      ignorarUnicidade: true,
    });
    despachar({
      tipo: 'confirmar-entrega',
      repasseId: alvo.repasseId,
      confirmador: conselheiro,
      ignorarUnicidade: true,
    });
    setExecutada(true);
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Wrench aria-hidden="true" className="size-5 text-retido" />
        <h2>Reproduza a falha de quórum</h2>
      </div>

      <Ficha trilho="bloqueio" className="mt-4">
        <FichaCabecalho>
          <FichaSobrescrito>CRIT-02 · demonstração</FichaSobrescrito>
          <FichaTitulo>Uma única parte libera o pagamento sozinha</FichaTitulo>
        </FichaCabecalho>

        <FichaCorpo className="space-y-4">
          <Aviso tom="atencao" titulo="Antes de executar, o enquadramento">
            <p>
              O que você está prestes a fazer é uma <strong>falha conhecida do programa</strong>,
              com correção já proposta para a v0.2 — não é comportamento pretendido. Em uso
              normal desta demonstração, a aplicação recusa a segunda confirmação da mesma
              parte; o botão abaixo ignora essa proteção de propósito, para mostrar o que o
              programa permitiria em rede real.
            </p>
          </Aviso>

          {repasse === undefined || alvo === undefined ? (
            <p className="text-xs text-grafite">
              Não há entrega pendente sem confirmação para demonstrar. Restaure os dados de
              demonstração pelo rodapé e volte aqui.
            </p>
          ) : (
            <>
              <div>
                <LinhaDado rotulo="Repasse">
                  {repasse.id} · {nomeItem(repasse.itemId)}
                </LinhaDado>
                <LinhaDado rotulo="Escola">{nomeEscola(repasse.escolaId)}</LinhaDado>
                <LinhaDado rotulo="Valor em custódia">
                  {formatarReais(repasse.valorTotal)}
                </LinhaDado>
                <LinhaDado rotulo="Saldo do fornecedor">
                  {formatarReais(saldoBrz(app.programa, enderecoFornecedor(repasse.fornecedorId)))}
                </LinhaDado>
                <LinhaDado rotulo="Custódia total">
                  {formatarReais(saldoBrz(app.programa, CONTA_CUSTODIA))}
                </LinhaDado>
              </div>

              <MarcadorQuorum
                confirmacoes={conta?.confirmacoes ?? 0}
                quorum={app.programa.confirmacoesNecessarias}
              />

              {liberado && executada ? (
                <Aviso tom="bloqueio" titulo="O valor foi liberado por uma parte só">
                  <p>
                    As duas confirmações vieram da <strong>mesma carteira</strong>. O
                    programa não registra quem confirmou, então o contador subiu de 0 para 2
                    e o BRZ saiu da custódia para o fornecedor.
                  </p>
                  <p className="mt-2">
                    É exatamente isso que anula a mitigação prometida contra registro de
                    entrega fictícia. A correção — uma conta <span className="dado">Confirmacao</span>{' '}
                    por par (repasse, confirmador) — está descrita em CRIT-02, acima.
                  </p>
                  <p className="mt-2">
                    Use <strong>Restaurar dados de demonstração</strong>, no rodapé, para
                    desfazer.
                  </p>
                </Aviso>
              ) : (
                <Botao variante="bloqueio" onClick={executar}>
                  <Wrench className="size-4" /> Confirmar duas vezes pela mesma parte
                </Botao>
              )}

              {executada && (
                <Botao
                  variante="contorno"
                  onClick={() => {
                    despachar({ tipo: 'restaurar-tudo' });
                    setExecutada(false);
                    setAlvoId(null);
                  }}
                >
                  <RotateCcw className="size-4" /> Restaurar dados
                </Botao>
              )}
            </>
          )}
        </FichaCorpo>
      </Ficha>
    </section>
  );
}

function enderecoFornecedor(fornecedorId: string): string {
  const n = Number(fornecedorId.slice(4));
  return '0x' + `d${n}`.repeat(20);
}
