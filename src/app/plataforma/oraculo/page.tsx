'use client';

import { useState } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { GuardaPapel } from '@/components/plataforma/guarda';
import { cotacoesRegistradas } from '@/adapter/estado';
import { calcularMediana } from '@/core/mediana';
import { calcularLimite } from '@/core/contrato';
import { MINIMO_FONTES } from '@/core/tipos';
import { ehDiscrepante, mediaAritmetica, nomeFonte } from '@/adapter/consultas';
import { formatarReais, parsearReais } from '@/adapter/formato';
import { FONTES } from '@/mocks/fontes';
import { ITENS } from '@/mocks/itens';
import { Botao } from '@/components/ui/button';
import { AuxilioCampo, Entrada, Rotulo, Selecao } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo, LinhaDado } from '@/components/ui/ficha';
import { cn } from '@/lib/utils';

/**
 * Painel da fonte oracular (US5, FR-033, FR-034).
 *
 * Duas coisas acontecem aqui: reportar cotação, e demonstrar por que a mediana
 * resiste a manipulação onde a média não resiste. A segunda é o argumento
 * técnico que a banca vai cobrar.
 */
export default function PaginaOraculo() {
  return (
    <GuardaPapel papel="oraculo">
      <Oraculo />
    </GuardaPapel>
  );
}

function Oraculo() {
  const { app, perfil, despachar } = useApp();

  const [itemId, setItemId] = useState('leite-uht');
  const [cotacaoTexto, setCotacaoTexto] = useState('');
  const [fonteComprometida, setFonteComprometida] = useState(FONTES[4]?.endereco ?? '');
  const [valorAtaque, setValorAtaque] = useState('5.000,00');

  const item = ITENS.find((i) => i.id === itemId);
  const unidade = item?.unidade ?? 'un';

  const porFonte = app.programa.cotacoesOraculo.get(itemId);
  const cotacoes = [...(porFonte?.entries() ?? [])];
  const registradas = cotacoesRegistradas(app.programa, itemId);
  const mediana = app.programa.tabelaPrecos.get(itemId)?.precoMediana ?? 0n;
  const limite = calcularLimite(mediana, app.programa.toleranciaPercentual);

  const suficiente = registradas.length >= MINIMO_FONTES;
  const medianaPrevista = suficiente ? calcularMediana(registradas) : 0n;
  const mediaAtual = mediaAritmetica(registradas);

  // --- Simulação de fonte comprometida -----------------------------------
  const valorAtaqueCentavos = parsearReais(valorAtaque) ?? 0n;
  const sobAtaque = cotacoes.map(([fonte, v]) =>
    fonte === fonteComprometida ? valorAtaqueCentavos : v,
  );
  const medianaAtaque = sobAtaque.length > 0 ? calcularMediana(sobAtaque) : 0n;
  const mediaAtaque = mediaAritmetica(sobAtaque);
  const limitePorMediana = calcularLimite(medianaAtaque, app.programa.toleranciaPercentual);
  const limitePorMedia = calcularLimite(mediaAtaque, app.programa.toleranciaPercentual);

  const cotacaoCentavos = parsearReais(cotacaoTexto);
  const podeReportar = cotacaoCentavos !== null && perfil !== null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="sobrescrito">Fonte oracular</p>
      <h1 className="mt-1">Cotações de mercado</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Você reporta o preço praticado. O preço de referência do município é a mediana das
        cotações de todas as fontes autorizadas — nenhuma delas, sozinha, define o valor.
      </p>

      <div className="mt-6 max-w-sm">
        <Rotulo htmlFor="item">Item</Rotulo>
        <Selecao
          id="item"
          className="mt-1"
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value);
            setCotacaoTexto('');
          }}
        >
          {ITENS.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Selecao>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* --- Cotações e reporte ------------------------------------------ */}
        <Ficha>
          <FichaCabecalho>
            <FichaSobrescrito>{cotacoes.length} fontes autorizadas</FichaSobrescrito>
            <FichaTitulo>Cotações vigentes</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            {cotacoes
              .sort((a, b) => (a[1] < b[1] ? -1 : 1))
              .map(([fonte, valor]) => {
                const categoria = FONTES.find((f) => f.endereco === fonte)?.categoria;
                const eu = fonte === perfil?.endereco;
                return (
                  <LinhaDado
                    key={fonte}
                    rotulo={`${nomeFonte(fonte)}${eu ? ' (você)' : ''} · ${categoria ?? ''}`}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        ehDiscrepante(valor, mediana) && 'font-semibold text-bloqueio',
                      )}
                    >
                      {ehDiscrepante(valor, mediana) && (
                        <TriangleAlert aria-hidden="true" className="size-3.5" />
                      )}
                      {formatarReais(valor)}
                    </span>
                  </LinhaDado>
                );
              })}

            <div className="mt-5 space-y-3 border-t border-regua pt-5">
              <div>
                <Rotulo htmlFor="cotacao">
                  Sua cotação para {item?.nome} (R$ por {unidade})
                </Rotulo>
                <Entrada
                  id="cotacao"
                  numerica
                  inputMode="decimal"
                  className="mt-1"
                  placeholder={formatarReais(mediana)}
                  value={cotacaoTexto}
                  onChange={(e) => setCotacaoTexto(e.target.value)}
                />
                <AuxilioCampo className="mt-1">
                  Substitui sua cotação anterior para este item.
                </AuxilioCampo>
              </div>

              <Botao
                className="w-full"
                disabled={!podeReportar}
                onClick={() => {
                  if (cotacaoCentavos === null || perfil === null) return;
                  despachar({
                    tipo: 'reportar-cotacao',
                    itemId,
                    fonte: perfil.endereco,
                    preco: cotacaoCentavos,
                  });
                  setCotacaoTexto('');
                }}
              >
                Reportar cotação
              </Botao>
            </div>
          </FichaCorpo>
        </Ficha>

        {/* --- Recálculo da referência ------------------------------------- */}
        <Ficha trilho={suficiente ? 'liberado' : 'retido'}>
          <FichaCabecalho>
            <FichaSobrescrito>Preço de referência</FichaSobrescrito>
            <FichaTitulo>
              {item?.nome} · {formatarReais(mediana)}/{unidade}
            </FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo className="space-y-4">
            <div>
              <LinhaDado rotulo="Mediana vigente">{formatarReais(mediana)}</LinhaDado>
              <LinhaDado rotulo={`Limite (+${app.programa.toleranciaPercentual}%)`}>
                {formatarReais(limite)}
              </LinhaDado>
              <LinhaDado rotulo="Cotações registradas">
                {registradas.length} de {MINIMO_FONTES} mínimas
              </LinhaDado>
              {suficiente && medianaPrevista !== mediana && (
                <LinhaDado rotulo="Mediana após recálculo">
                  {formatarReais(medianaPrevista)}
                </LinhaDado>
              )}
            </div>

            <Botao
              className="w-full"
              disabled={!suficiente}
              onClick={() => despachar({ tipo: 'recalcular-referencia', itemId })}
            >
              <RefreshCw className="size-4" /> Recalcular referência
            </Botao>

            {!suficiente && (
              <Aviso tom="atencao" titulo="Faltam cotações independentes">
                O recálculo exige pelo menos {MINIMO_FONTES} cotações. Com menos que isso,
                uma fonte isolada teria poder de definir o preço do município sozinha — e é
                exatamente essa concentração que o mecanismo existe para impedir.
              </Aviso>
            )}

            <p className="text-2xs text-grafite">
              O recálculo usa as cotações efetivamente registradas. O programa, por si só,
              aceitaria qualquer conjunto de números informado por quem chama — essa
              verificação vive na aplicação, e precisa ir para dentro do programa na
              próxima versão.
            </p>
          </FichaCorpo>
        </Ficha>
      </div>

      {/* --- Mediana contra média ------------------------------------------- */}
      <section className="mt-10">
        <h2>Por que mediana, e não média</h2>
        <p className="mt-2 max-w-3xl text-xs text-grafite">
          Escolha uma fonte e simule que ela foi comprometida. Os números abaixo são
          recalculados na hora, sem alterar nada do sistema.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-56 flex-1">
            <Rotulo htmlFor="fonte-atacada">Fonte comprometida</Rotulo>
            <Selecao
              id="fonte-atacada"
              className="mt-1"
              value={fonteComprometida}
              onChange={(e) => setFonteComprometida(e.target.value)}
            >
              {FONTES.map((f) => (
                <option key={f.endereco} value={f.endereco}>
                  {f.nomeCurto}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="min-w-40 flex-1">
            <Rotulo htmlFor="valor-ataque">Valor que ela reportaria</Rotulo>
            <Entrada
              id="valor-ataque"
              numerica
              inputMode="decimal"
              className="mt-1"
              value={valorAtaque}
              onChange={(e) => setValorAtaque(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-ficha border border-regua bg-regua sm:grid-cols-2">
          <div className="bg-papel p-5">
            <p className="sobrescrito">Se a referência fosse a média</p>
            <p className="dado mt-2 text-lg leading-none font-semibold text-bloqueio">
              {formatarReais(mediaAtaque)}
            </p>
            <p className="mt-3 text-2xs text-grafite">
              Antes do ataque: {formatarReais(mediaAtual)}. O teto de compra subiria para{' '}
              <span className="dado font-medium text-tinta">
                {formatarReais(limitePorMedia)}
              </span>{' '}
              por {unidade} — liberando exatamente o superfaturamento que a trava deveria
              barrar.
            </p>
          </div>
          <div className="bg-papel p-5">
            <p className="sobrescrito">Como a referência é a mediana</p>
            <p className="dado mt-2 text-lg leading-none font-semibold text-liberado">
              {formatarReais(medianaAtaque)}
            </p>
            <p className="mt-3 text-2xs text-grafite">
              Antes do ataque: {formatarReais(mediana)}. O teto permanece em{' '}
              <span className="dado font-medium text-tinta">
                {formatarReais(limitePorMediana)}
              </span>{' '}
              por {unidade}. A cotação extrema é descartada por construção.
            </p>
          </div>
        </div>

        <Aviso tom="atencao" className="mt-4 max-w-3xl" titulo="O limite dessa proteção">
          A mediana resiste enquanto a maioria das fontes for honesta. Se a maioria agir em
          conluio, ela também é manipulável. Por isso a autorização de novas fontes precisa
          exigir diversidade institucional — origens públicas, acadêmicas e comunitárias —
          e não apenas quantidade.
        </Aviso>
      </section>
    </main>
  );
}
