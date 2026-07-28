import {
  CONFIRMACOES_NECESSARIAS,
  TOLERANCIA_PERCENTUAL,
  type Centavos,
  type EntradaRegistro,
  type EstadoPrograma,
  type Registro,
} from '@/core/tipos';
import {
  autorizarFonte,
  atualizarPrecoReferencia,
  calcularLimite,
  confirmarEntrega,
  proporRepasse,
  reportarPreco,
} from '@/core/contrato';
import { ehErroPrograma } from '@/core/erros';
import { anexar } from '@/core/registro';
import type { Entrega, Repasse, SituacaoRepasse } from '@/dominio/tipos';

import { ITENS } from './itens';
import { ENDERECOS_FONTES } from './fontes';
import { ENDERECO_PREFEITURA, PERFIS, CONSELHEIRO_SECUNDARIO } from './perfis';
import {
  COTACOES,
  DIA,
  ESCALA_RODADAS,
  INSTANTE_BASE,
  cotacoesDaRodada,
  horarioRecalculo,
} from './cotacoes';
import { PLANO_REPASSES, PRAZO_ENTREGA_DIAS } from './repasses';

/**
 * Estado de gênese: processa todo o dataset **pelo núcleo**, nunca fabricando
 * resultados à mão.
 *
 * É por isso que os números do protótipo são confiáveis: as rejeições não são
 * marcadas como rejeitadas em uma tabela, elas são rejeitadas pela mesma função
 * que rejeitaria em produção. Se a trava tiver um bug, a semeadura muda.
 */

/** Saldo inicial de BRZ da prefeitura: R$ 2.000.000,00. */
export const SALDO_INICIAL_PREFEITURA: Centavos = 200_000_000n;

export interface DadosSemeados {
  readonly estado: EstadoPrograma;
  readonly cadeia: readonly Registro[];
  readonly repasses: readonly Repasse[];
  readonly entregas: readonly Entrega[];
}

const CONSELHEIRO_1 = PERFIS.find((p) => p.papel === 'conselho')?.endereco ?? '0x0';
const CONSELHEIRO_2 = CONSELHEIRO_SECUNDARIO.endereco;

export function semear(): DadosSemeados {
  const estado: EstadoPrograma = {
    prefeitura: ENDERECO_PREFEITURA,
    toleranciaPercentual: TOLERANCIA_PERCENTUAL,
    confirmacoesNecessarias: CONFIRMACOES_NECESSARIAS,
    fontesAutorizadas: new Map(),
    tabelaPrecos: new Map(),
    cotacoesOraculo: new Map(),
    listaFontes: [],
    saldosBrz: new Map([[ENDERECO_PREFEITURA, SALDO_INICIAL_PREFEITURA]]),
    repasses: new Map(),
  };

  let cadeia: Registro[] = [];
  const registrar = (entrada: EntradaRegistro): number => {
    cadeia = anexar(cadeia, entrada);
    return cadeia.length - 1;
  };

  // --- Gênese ------------------------------------------------------------
  registrar({
    horario: INSTANTE_BASE,
    tipo: 'Genese',
    autor: ENDERECO_PREFEITURA,
    dados: {
      municipio: 'Serra do Cedro',
      toleranciaPercentual: TOLERANCIA_PERCENTUAL,
      confirmacoesNecessarias: CONFIRMACOES_NECESSARIAS,
      saldoInicial: SALDO_INICIAL_PREFEITURA,
    },
    sucesso: true,
    motivoFalha: null,
  });

  // --- Autorização das fontes -------------------------------------------
  ENDERECOS_FONTES.forEach((fonte, i) => {
    autorizarFonte(estado, fonte);
    registrar({
      horario: INSTANTE_BASE + i * 60_000,
      tipo: 'FonteAutorizada',
      autor: ENDERECO_PREFEITURA,
      dados: { fonte },
      sucesso: true,
      motivoFalha: null,
    });
  });

  // --- Cotações e medianas, rodada a rodada ------------------------------
  ESCALA_RODADAS.forEach((_, rodada) => {
    ITENS.forEach((item, iItem) => {
      COTACOES.filter((c) => c.itemId === item.id && c.rodada === rodada).forEach((c) => {
        reportarPreco(estado, c.itemId, c.fonte, c.preco);
        registrar({
          horario: c.horario,
          tipo: 'PrecoReportado',
          autor: c.fonte,
          dados: { itemId: c.itemId, preco: c.preco },
          sucesso: true,
          motivoFalha: null,
        });
      });

      // CRIT-01: o programa calcula sobre o vetor recebido, não sobre as
      // cotações registradas. A camada de aplicação é quem garante que o vetor
      // venha das cotações reais — o programa não impõe isso.
      const precos = cotacoesDaRodada(item.id, rodada);
      const horario = horarioRecalculo(iItem, rodada);
      const evento = atualizarPrecoReferencia(estado, item.id, precos, horario);

      registrar({
        horario,
        tipo: 'MedianaAtualizada',
        autor: ENDERECO_PREFEITURA,
        dados: { itemId: item.id, mediana: evento.mediana, fontes: precos.length },
        sucesso: true,
        motivoFalha: null,
      });
    });
  });

  // --- Repasses ----------------------------------------------------------
  const repasses: Repasse[] = [];
  const entregas: Entrega[] = [];

  for (const plano of PLANO_REPASSES) {
    const referencia = estado.tabelaPrecos.get(plano.itemId)?.precoMediana ?? 0n;
    const limite = calcularLimite(referencia, estado.toleranciaPercentual);
    const registros: number[] = [];

    registros.push(
      registrar({
        horario: plano.criadoEm,
        tipo: 'RepasseProposto',
        autor: ENDERECO_PREFEITURA,
        dados: {
          repasseId: plano.id,
          itemId: plano.itemId,
          quantidade: plano.quantidade,
          valorTotal: plano.valorTotal,
        },
        sucesso: true,
        motivoFalha: null,
      }),
    );

    let situacao: SituacaoRepasse;
    let motivoRejeicao: string | null = null;

    try {
      proporRepasse(
        estado,
        plano.id,
        plano.itemId,
        enderecoFornecedor(plano.fornecedorId),
        plano.quantidade,
        plano.valorTotal,
      );

      situacao = 'Retido';
      registros.push(
        registrar({
          horario: plano.criadoEm + 60_000,
          tipo: 'RepasseAprovado',
          autor: ENDERECO_PREFEITURA,
          dados: { repasseId: plano.id, valor: plano.valorTotal, custodiado: true },
          sucesso: true,
          motivoFalha: null,
        }),
      );
    } catch (erro) {
      if (!ehErroPrograma(erro)) throw erro;
      situacao = 'Rejeitado';
      motivoRejeicao = erro.message;

      registros.push(
        registrar({
          horario: plano.criadoEm + 60_000,
          tipo: 'RepasseRejeitado',
          autor: ENDERECO_PREFEITURA,
          dados: {
            repasseId: plano.id,
            valorProposto: plano.valorTotal,
            limiteAplicado: limite,
            medianaAplicada: referencia,
          },
          sucesso: false,
          motivoFalha: erro.message,
        }),
      );
    }

    // --- Entrega e liberação --------------------------------------------
    const prazoLimite = plano.criadoEm + PRAZO_ENTREGA_DIAS * DIA;
    const confirmadores: string[] = [];
    let confirmadoEm: number | null = null;
    let descricaoDivergencia: string | null = null;

    if (situacao === 'Retido') {
      const quantasConfirmacoes =
        plano.desfecho === 'liberado' ? 2 : plano.desfecho === 'retido-vencido' ? 1 : 0;

      for (let n = 0; n < quantasConfirmacoes; n++) {
        // Dois conselheiros distintos. O programa não registra quem confirmou
        // (CRIT-02); a identidade vive só aqui, na camada de aplicação.
        const autor = n === 0 ? CONSELHEIRO_1 : CONSELHEIRO_2;
        // Dentro da janela de três dias que separa um repasse do seguinte:
        // a cadeia exige horários não-decrescentes, e uma confirmação tardia
        // cairia depois da proposta do próximo repasse.
        const horario = plano.criadoEm + (n + 1) * DIA;
        const r = confirmarEntrega(estado, plano.id);
        confirmadores.push(autor);

        registros.push(
          registrar({
            horario,
            tipo: 'EntregaConfirmada',
            autor,
            dados: {
              repasseId: plano.id,
              confirmacoes: r.confirmacoes,
              quorum: estado.confirmacoesNecessarias,
            },
            sucesso: true,
            motivoFalha: null,
          }),
        );

        if (r.quorumAtingido) {
          situacao = 'Liberado';
          confirmadoEm = horario;
          registros.push(
            registrar({
              horario: horario + 60_000,
              tipo: 'ValorLiberado',
              autor: enderecoFornecedor(plano.fornecedorId),
              dados: { repasseId: plano.id, valor: r.valorLiberado },
              sucesso: true,
              motivoFalha: null,
            }),
          );
        }
      }

      if (plano.desfecho === 'divergente') {
        situacao = 'Divergente';
        descricaoDivergencia =
          'Recebidos 780 kg dos 900 kg constantes na nota. Diferença não justificada pelo entregador.';
        registros.push(
          registrar({
            horario: plano.criadoEm + 2 * DIA,
            tipo: 'DivergenciaRegistrada',
            autor: CONSELHEIRO_1,
            dados: { repasseId: plano.id, descricao: descricaoDivergencia },
            sucesso: true,
            motivoFalha: null,
          }),
        );
      }
    }

    repasses.push({
      id: plano.id,
      itemId: plano.itemId,
      fornecedorId: plano.fornecedorId,
      escolaId: plano.escolaId,
      quantidade: plano.quantidade,
      valorTotal: plano.valorTotal,
      precoUnitarioEfetivo:
        plano.quantidade === 0n ? 0n : plano.valorTotal / plano.quantidade,
      medianaAplicada: referencia,
      limiteAplicado: limite,
      toleranciaAplicada: estado.toleranciaPercentual,
      situacao,
      motivoRejeicao,
      criadoEm: plano.criadoEm,
      registros,
    });

    if (situacao !== 'Rejeitado') {
      entregas.push({
        repasseId: plano.id,
        escolaId: plano.escolaId,
        situacao:
          situacao === 'Liberado'
            ? 'confirmada'
            : situacao === 'Divergente'
              ? 'divergente'
              : 'pendente',
        prazoLimite,
        confirmadoPor: confirmadores,
        confirmadoEm,
        descricaoDivergencia,
      });
    }
  }

  return { estado, cadeia, repasses, entregas };
}

/** Endereço da conta SPL do fornecedor. */
function enderecoFornecedor(fornecedorId: string): string {
  const n = Number(fornecedorId.slice(4));
  return '0x' + `d${n}`.repeat(20);
}
