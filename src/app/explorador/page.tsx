'use client';

import { useMemo, useState } from 'react';
import {
  Ban,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Wrench,
} from 'lucide-react';
import { useApp } from '@/app/provedor';
import { verificarIntegridade } from '@/core/registro';
import type { Registro, ResultadoVerificacao, TipoRegistro } from '@/core/tipos';
import { ROTULO_TIPO, filtrarCadeia, resumirRegistro, nomeFonte } from '@/adapter/consultas';
import { abreviarEndereco, abreviarHash, formatarDataHora } from '@/adapter/formato';
import { Botao } from '@/components/ui/button';
import { Rotulo, Selecao } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import { cn } from '@/lib/utils';

const POR_PAGINA = 40;

/**
 * Explorador de registros (US6, FR-011 a FR-016, FR-054).
 *
 * É aqui que a alegação de imutabilidade deixa de ser texto e vira algo que o
 * avaliador testa com as próprias mãos: adultera um registro e vê a verificação
 * apontá-lo.
 */
export default function Explorador() {
  const { app, despachar } = useApp();

  const [tipo, setTipo] = useState<TipoRegistro | 'todos'>('todos');
  const [pagina, setPagina] = useState(0);
  const [abertos, setAbertos] = useState<ReadonlySet<number>>(new Set());
  const [veredito, setVeredito] = useState<ResultadoVerificacao | null>(null);
  const [alvoAdulteracao, setAlvoAdulteracao] = useState('');

  const filtrada = useMemo(
    () => [...filtrarCadeia(app.cadeia, tipo)].reverse(),
    [app.cadeia, tipo],
  );
  const paginas = Math.max(1, Math.ceil(filtrada.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas - 1);
  const visiveis = filtrada.slice(
    paginaAtual * POR_PAGINA,
    (paginaAtual + 1) * POR_PAGINA,
  );

  /** Candidatos à adulteração: eventos com número, cujo efeito é visível. */
  const candidatos = useMemo(
    () =>
      app.cadeia.filter(
        (r) => r.tipo === 'MedianaAtualizada' || r.tipo === 'RepasseAprovado',
      ),
    [app.cadeia],
  );

  function alternar(numero: number) {
    setAbertos((a) => {
      const novo = new Set(a);
      if (novo.has(numero)) novo.delete(numero);
      else novo.add(numero);
      return novo;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="sobrescrito">Registro auditável</p>
      <h1 className="mt-1">Explorador da cadeia</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Cada operação do sistema entra aqui, em sequência, encadeada por hash ao registro
        anterior. As tentativas bloqueadas também: elas não desaparecem do histórico.
      </p>

      {/* --- Verificação de integridade -------------------------------------- */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Ficha
          trilho={
            veredito === null ? 'indice' : veredito.integra ? 'liberado' : 'bloqueio'
          }
        >
          <FichaCabecalho>
            <FichaSobrescrito>{app.cadeia.length} registros</FichaSobrescrito>
            <FichaTitulo>Verificação de integridade</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo className="space-y-4">
            <p className="text-xs text-grafite">
              Recalcula o hash de cada registro a partir do seu conteúdo e do hash do
              anterior, do primeiro ao último. Qualquer alteração retroativa rompe a
              corrente a partir do ponto alterado.
            </p>

            <Botao
              onClick={() => setVeredito(verificarIntegridade(app.cadeia))}
              tamanho="lg"
            >
              <ShieldCheck className="size-4" /> Verificar integridade
            </Botao>

            {veredito !== null &&
              (veredito.integra ? (
                <div className="rounded-ficha border border-liberado/30 bg-liberado-tenue p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-liberado">
                    <CircleCheck aria-hidden="true" className="size-4" />
                    Cadeia íntegra
                  </p>
                  <p className="dado mt-1 text-2xs text-grafite">
                    {veredito.total} registros conferidos, nenhuma divergência.
                  </p>
                </div>
              ) : (
                <div className="rounded-ficha border border-bloqueio/30 bg-bloqueio-tenue p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-bloqueio">
                    <ShieldX aria-hidden="true" className="size-4" />
                    Cadeia rompida no registro {veredito.primeiroInvalido}
                  </p>
                  <dl className="mt-3 space-y-1 text-2xs">
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-grafite">hash esperado</dt>
                      <dd className="dado break-all text-liberado">{veredito.esperado}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-grafite">hash encontrado</dt>
                      <dd className="dado break-all text-bloqueio">{veredito.obtido}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-2xs text-grafite">
                    Todos os registros a partir do {veredito.primeiroInvalido} ficam
                    inválidos: cada um depende do hash do anterior.
                  </p>
                </div>
              ))}
          </FichaCorpo>
        </Ficha>

        {/* --- Demonstração de adulteração ---------------------------------- */}
        <Ficha trilho="retido">
          <FichaCabecalho>
            <FichaSobrescrito>Modo de demonstração</FichaSobrescrito>
            <FichaTitulo>Adulterar um registro</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo className="space-y-4">
            <p className="text-xs text-grafite">
              Altere o conteúdo de um registro já gravado, sem recalcular o hash — é o que
              uma alteração retroativa maliciosa faria. Depois, verifique a integridade e
              veja a detecção acontecer.
            </p>

            <div>
              <Rotulo htmlFor="alvo">Registro a adulterar</Rotulo>
              <Selecao
                id="alvo"
                className="mt-1"
                value={alvoAdulteracao}
                onChange={(e) => setAlvoAdulteracao(e.target.value)}
              >
                <option value="">Escolha um registro…</option>
                {candidatos.slice(0, 40).map((r) => (
                  <option key={r.numero} value={String(r.numero)}>
                    Nº {r.numero} · {ROTULO_TIPO[r.tipo]}
                  </option>
                ))}
              </Selecao>
            </div>

            {app.adulteracaoAtiva ? (
              <>
                <Aviso tom="bloqueio" titulo="Há uma adulteração ativa">
                  A cadeia está com um registro alterado. Restaure os dados para voltar ao
                  estado íntegro.
                </Aviso>
                <Botao
                  variante="contorno"
                  className="w-full"
                  onClick={() => {
                    despachar({ tipo: 'restaurar-tudo' });
                    setVeredito(null);
                  }}
                >
                  <RotateCcw className="size-4" /> Restaurar dados
                </Botao>
              </>
            ) : (
              <Botao
                variante="bloqueio"
                className="w-full"
                disabled={alvoAdulteracao === ''}
                onClick={() => {
                  despachar({
                    tipo: 'adulterar-registro',
                    numero: Number(alvoAdulteracao),
                    dados: { mediana: 99_900n, valor: 99_900n, adulterado: true },
                  });
                  setVeredito(null);
                }}
              >
                <Wrench className="size-4" /> Adulterar registro
              </Botao>
            )}

            <p className="text-2xs text-grafite">
              Nada aqui altera dados de terceiros: a cadeia vive apenas no seu navegador, e
              a restauração devolve tudo ao estado original.
            </p>
          </FichaCorpo>
        </Ficha>
      </section>

      {/* --- Nota de honestidade ---------------------------------------------- */}
      <Aviso
        tom="informativo"
        className="mt-6"
        titulo="Integridade não é o mesmo que descentralização"
      >
        <p>
          O encadeamento por hash prova que <strong>ninguém alterou o histórico sem que
          isso apareça</strong>. Ele não prova descentralização: um operador único ainda
          poderia reescrever a cadeia inteira recalculando todos os hashes, e a verificação
          voltaria a passar.
        </p>
        <p className="mt-2">
          O que impede essa reescrita em rede real é a replicação entre validadores com
          interesses conflitantes — que é justamente a parte simulada neste protótipo.
          Dizer o contrário seria vender como garantia algo que aqui é só demonstração.
        </p>
      </Aviso>

      {/* --- Lista ------------------------------------------------------------ */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2>Registros</h2>
          <div className="min-w-56">
            <Rotulo htmlFor="tipo">Tipo de evento</Rotulo>
            <Selecao
              id="tipo"
              className="mt-1"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoRegistro | 'todos');
                setPagina(0);
              }}
            >
              <option value="todos">Todos ({app.cadeia.length})</option>
              {(Object.keys(ROTULO_TIPO) as TipoRegistro[]).map((t) => {
                const n = app.cadeia.filter((r) => r.tipo === t).length;
                return n === 0 ? null : (
                  <option key={t} value={t}>
                    {ROTULO_TIPO[t]} ({n})
                  </option>
                );
              })}
            </Selecao>
          </div>
        </div>

        <ol className="mt-4 divide-y divide-regua rounded-ficha border border-regua">
          {visiveis.map((r) => (
            <LinhaRegistro
              key={r.numero}
              registro={r}
              aberto={abertos.has(r.numero)}
              alternar={() => alternar(r.numero)}
              invalido={
                veredito !== null &&
                !veredito.integra &&
                r.numero >= veredito.primeiroInvalido
              }
            />
          ))}
        </ol>

        {paginas > 1 && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <Botao
              variante="contorno"
              tamanho="sm"
              disabled={paginaAtual === 0}
              onClick={() => setPagina(paginaAtual - 1)}
            >
              Anterior
            </Botao>
            <span className="dado text-2xs text-grafite">
              página {paginaAtual + 1} de {paginas}
            </span>
            <Botao
              variante="contorno"
              tamanho="sm"
              disabled={paginaAtual >= paginas - 1}
              onClick={() => setPagina(paginaAtual + 1)}
            >
              Próxima
            </Botao>
          </div>
        )}
      </section>
    </main>
  );
}

function LinhaRegistro({
  registro,
  aberto,
  alternar,
  invalido,
}: {
  registro: Registro;
  aberto: boolean;
  alternar: () => void;
  invalido: boolean;
}) {
  const Chevron = aberto ? ChevronDown : ChevronRight;

  return (
    <li className={cn(invalido && 'bg-bloqueio-tenue')}>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-placa"
      >
        <Chevron aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-grafite" />
        <span className="dado w-12 shrink-0 text-2xs text-grafite">{registro.numero}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {registro.sucesso ? (
              <CircleCheck aria-hidden="true" className="size-3.5 shrink-0 text-liberado" />
            ) : (
              <Ban aria-hidden="true" className="size-3.5 shrink-0 text-bloqueio" />
            )}
            <span className="text-xs font-medium">{ROTULO_TIPO[registro.tipo]}</span>
            <span className="dado text-2xs text-grafite">
              {formatarDataHora(registro.horario)}
            </span>
            {invalido && (
              <span className="sobrescrito text-bloqueio">registro inválido</span>
            )}
          </span>
          <span className="mt-0.5 block text-2xs text-grafite">
            {resumirRegistro(registro)}
          </span>
          {!registro.sucesso && registro.motivoFalha !== null && (
            <span className="dado mt-1 block text-2xs font-medium text-bloqueio">
              {registro.motivoFalha}
            </span>
          )}
        </span>
        <span className="dado hidden shrink-0 text-2xs text-grafite sm:block">
          {abreviarHash(registro.hash)}
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-t border-regua bg-placa px-3 py-4 sm:pl-19">
          <div>
            <p className="sobrescrito">Autor</p>
            <p className="dado text-2xs break-all">
              {nomeFonte(registro.autor)} · {abreviarEndereco(registro.autor)}
            </p>
          </div>
          <div>
            <p className="sobrescrito">Dados</p>
            <dl className="mt-1 space-y-0.5">
              {Object.entries(registro.dados).map(([chave, valor]) => (
                <div key={chave} className="flex flex-wrap gap-2 text-2xs">
                  <dt className="text-grafite">{chave}</dt>
                  <dd className="dado break-all">{String(valor)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="sobrescrito">Hash do registro anterior</p>
            <p className="dado text-2xs break-all text-grafite">{registro.hashAnterior}</p>
          </div>
          <div>
            <p className="sobrescrito">Hash deste registro</p>
            <p className="dado text-2xs break-all">{registro.hash}</p>
          </div>
        </div>
      )}
    </li>
  );
}
