'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { GuardaPapel } from '@/components/plataforma/guarda';
import { calcularLimite } from '@/core/contrato';
import { formatarReais, parsearInteiro, parsearReais } from '@/adapter/formato';
import { unidadeItem } from '@/adapter/consultas';
import { PainelTrava } from '@/components/dominio/painel-trava';
import { BarraCustodia } from '@/components/dominio/barra-custodia';
import { Botao } from '@/components/ui/button';
import { AuxilioCampo, Entrada, Rotulo, Selecao } from '@/components/ui/campo';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import { ITENS } from '@/mocks/itens';
import { FORNECEDORES } from '@/mocks/fornecedores';
import { ESCOLAS } from '@/mocks/municipio';

/**
 * Nova proposta de compra (US3, FR-030 a FR-032).
 *
 * O painel de previsão é o coração da demonstração: o gestor vê a situação
 * **antes** de enviar. Um sistema que só avisa depois do envio não é prevenção,
 * é notificação.
 */
export default function PaginaNovaProposta() {
  return (
    <GuardaPapel papel="gestor">
      <NovaProposta />
    </GuardaPapel>
  );
}

function NovaProposta() {
  const { app, perfil, despachar } = useApp();

  const [itemId, setItemId] = useState('leite-uht');
  const [fornecedorId, setFornecedorId] = useState('for-01');
  const [escolaId, setEscolaId] = useState('esc-01');
  const [quantidadeTexto, setQuantidadeTexto] = useState('40000');
  const [valorTexto, setValorTexto] = useState('396.000,00');
  const [indiceResultado, setIndiceResultado] = useState<number | null>(null);

  const quantidade = parsearInteiro(quantidadeTexto);
  const valorTotal = parsearReais(valorTexto);
  const unidade = unidadeItem(itemId);

  const mediana = app.programa.tabelaPrecos.get(itemId)?.precoMediana ?? 0n;
  const limite = calcularLimite(mediana, app.programa.toleranciaPercentual);

  // Validação da interface, antes do núcleo (FR-030). O programa reverteria com
  // `Erro::QuantidadeInvalida`, mas o usuário merece orientação em vez do
  // identificador cru.
  const erroQuantidade =
    quantidade === null
      ? 'Informe a quantidade a comprar.'
      : quantidade === 0n
        ? 'A quantidade não pode ser zero — sem ela não há preço por unidade a comparar.'
        : null;

  const erroValor =
    valorTotal === null
      ? 'Informe o valor total da compra.'
      : valorTotal === 0n
        ? 'O valor total não pode ser zero.'
        : null;

  const valido = erroQuantidade === null && erroValor === null;
  const precoUnitario =
    valido && quantidade !== null && valorTotal !== null && quantidade > 0n
      ? valorTotal / quantidade
      : 0n;

  const resultado =
    indiceResultado === null ? undefined : app.repasses[indiceResultado];

  function enviar() {
    if (!valido || quantidade === null || valorTotal === null || perfil === null) return;
    setIndiceResultado(app.repasses.length);
    despachar({
      tipo: 'propor-repasse',
      itemId,
      fornecedorId,
      escolaId,
      quantidade,
      valorTotal,
      autor: perfil.endereco,
    });
  }

  // --- Resultado ---------------------------------------------------------
  if (resultado !== undefined) {
    const conta = app.programa.repasses.get(resultado.id);
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="sobrescrito">{resultado.id}</p>
        <h1 className="mt-1">
          {resultado.situacao === 'Rejeitado'
            ? 'Compra bloqueada antes do pagamento'
            : 'Compra aprovada e valor custodiado'}
        </h1>

        <PainelTrava
          className="mt-6"
          mediana={resultado.medianaAplicada}
          limite={resultado.limiteAplicado}
          proposta={resultado.precoUnitarioEfetivo}
          quantidade={resultado.quantidade}
          valorTotal={resultado.valorTotal}
          tolerancia={resultado.toleranciaAplicada}
          unidade={unidadeItem(resultado.itemId)}
        />

        <Ficha className="mt-6">
          <FichaCabecalho>
            <FichaSobrescrito>Custódia em BRZ</FichaSobrescrito>
            <FichaTitulo>Onde está o dinheiro</FichaTitulo>
          </FichaCabecalho>
          <FichaCorpo>
            <BarraCustodia
              valor={resultado.valorTotal}
              situacao={resultado.situacao}
              confirmacoes={conta?.confirmacoes ?? 0}
              quorum={app.programa.confirmacoesNecessarias}
            />
          </FichaCorpo>
        </Ficha>

        <div className="mt-8 flex flex-wrap gap-3">
          <Botao onClick={() => setIndiceResultado(null)}>
            <Plus className="size-4" /> Fazer outra proposta
          </Botao>
          <Botao asChild variante="contorno">
            <Link href={{ pathname: '/transparencia/repasse', query: { id: resultado.id } }}>
              Ver no painel público <ArrowRight className="size-4" />
            </Link>
          </Botao>
          <Botao asChild variante="discreto">
            <Link href="/plataforma/gestor">Voltar às compras</Link>
          </Botao>
        </div>
      </main>
    );
  }

  // --- Formulário --------------------------------------------------------
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Botao asChild variante="discreto" tamanho="sm" className="-ml-3">
        <Link href="/plataforma/gestor">
          <ArrowLeft className="size-4" /> Compras
        </Link>
      </Botao>

      <p className="sobrescrito mt-4">Gestão municipal</p>
      <h1 className="mt-1">Nova proposta de compra</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        A avaliação acontece enquanto você digita. Nada é enviado até você confirmar — e,
        se o preço estiver acima do limite, o valor não sai da conta da prefeitura.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
        {/* Formulário */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
        >
          <div>
            <Rotulo htmlFor="item">Item</Rotulo>
            <Selecao
              id="item"
              className="mt-1"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              {ITENS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Selecao>
          </div>

          <div>
            <Rotulo htmlFor="fornecedor">Fornecedor</Rotulo>
            <Selecao
              id="fornecedor"
              className="mt-1"
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
            >
              {FORNECEDORES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Selecao>
          </div>

          <div>
            <Rotulo htmlFor="escola">Escola de destino</Rotulo>
            <Selecao
              id="escola"
              className="mt-1"
              value={escolaId}
              onChange={(e) => setEscolaId(e.target.value)}
            >
              {ESCOLAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Selecao>
          </div>

          <div>
            <Rotulo htmlFor="quantidade">Quantidade ({unidade})</Rotulo>
            <Entrada
              id="quantidade"
              numerica
              inputMode="numeric"
              className="mt-1"
              value={quantidadeTexto}
              onChange={(e) => setQuantidadeTexto(e.target.value)}
              aria-invalid={erroQuantidade !== null}
            />
            {erroQuantidade !== null && (
              <AuxilioCampo erro className="mt-1">
                {erroQuantidade}
              </AuxilioCampo>
            )}
          </div>

          <div>
            <Rotulo htmlFor="valor">Valor total (R$)</Rotulo>
            <Entrada
              id="valor"
              numerica
              inputMode="decimal"
              className="mt-1"
              value={valorTexto}
              onChange={(e) => setValorTexto(e.target.value)}
              aria-invalid={erroValor !== null}
            />
            {erroValor !== null ? (
              <AuxilioCampo erro className="mt-1">
                {erroValor}
              </AuxilioCampo>
            ) : (
              <AuxilioCampo className="mt-1">
                Use vírgula para os centavos, como em 396.000,00.
              </AuxilioCampo>
            )}
          </div>

          <Botao type="submit" tamanho="lg" className="w-full" disabled={!valido}>
            Enviar proposta
          </Botao>

          <p className="text-2xs text-grafite">
            O envio é avaliado pelo programa. Se o preço por {unidade} ultrapassar{' '}
            {formatarReais(limite)}, a transação é revertida.
          </p>
        </form>

        {/* Previsão ao vivo */}
        <div className="space-y-4">
          <p className="sobrescrito">Avaliação em tempo real</p>
          {valido ? (
            <PainelTrava
              previsao
              mediana={mediana}
              limite={limite}
              proposta={precoUnitario}
              quantidade={quantidade ?? 0n}
              valorTotal={valorTotal ?? 0n}
              tolerancia={app.programa.toleranciaPercentual}
              unidade={unidade}
            />
          ) : (
            <Ficha trilho="retido">
              <FichaCabecalho>
                <FichaSobrescrito>Aguardando os dados</FichaSobrescrito>
                <FichaTitulo>Informe quantidade e valor para ver a avaliação</FichaTitulo>
              </FichaCabecalho>
              <FichaCorpo>
                <p className="text-xs text-grafite">
                  O preço por unidade é o valor total dividido pela quantidade. Sem os
                  dois, não há o que comparar com a mediana de mercado.
                </p>
              </FichaCorpo>
            </Ficha>
          )}
        </div>
      </div>
    </main>
  );
}
