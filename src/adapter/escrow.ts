import type { Endereco, Instante } from '@/core/tipos';
import type { Entrega, Repasse, SituacaoRepasse } from '@/dominio/tipos';

/**
 * Custódia e confirmação de entrega — a camada que corrige, **fora do programa**,
 * o que o programa não garante.
 *
 * O quórum de duas confirmações só significa alguma coisa se as duas vierem de
 * partes distintas. `confirmar_entrega` não registra quem confirmou (CRIT-02),
 * então a unicidade é imposta aqui. É exatamente a correção que a v0.2 precisa
 * levar para dentro do programa — e enquanto ela viver só aqui, um chamador que
 * fale direto com a rede continua podendo burlar o quórum.
 */

export interface VeredictoConfirmacao {
  readonly pode: boolean;
  readonly motivo: string;
}

const PODE: VeredictoConfirmacao = { pode: true, motivo: '' };

export function podeConfirmar(
  entrega: Entrega,
  confirmador: Endereco,
): VeredictoConfirmacao {
  if (entrega.situacao === 'confirmada') {
    return {
      pode: false,
      motivo: 'Esta entrega já atingiu o quórum e o valor foi liberado.',
    };
  }

  if (entrega.situacao === 'divergente') {
    return {
      pode: false,
      motivo:
        'Há divergência aberta nesta entrega. Resolva a ocorrência antes de confirmar.',
    };
  }

  if (entrega.confirmadoPor.includes(confirmador)) {
    return {
      pode: false,
      motivo:
        'Você já confirmou esta entrega. O quórum exige confirmação de partes independentes — é essa a proteção contra registro de entrega fictícia.',
    };
  }

  return PODE;
}

// ---------------------------------------------------------------------------
// Máquina de estados (data-model.md)
// ---------------------------------------------------------------------------

/**
 * `Retido` não tem transição de devolução — e isso não é modelagem incompleta.
 *
 * O programa não possui instrução capaz de mover o BRZ da custódia de volta à
 * prefeitura (CRIT-03). Um repasse cujo quórum nunca se complete permanece
 * retido para sempre, com o valor imobilizado. A interface precisa nomear isso
 * em vez de sugerir uma saída que não existe.
 */
const TRANSICOES: Readonly<Record<SituacaoRepasse, readonly SituacaoRepasse[]>> = {
  Proposto: ['Rejeitado', 'Retido'],
  // Terminal: a tentativa bloqueada permanece no histórico (FR-013).
  Rejeitado: [],
  Retido: ['Liberado', 'Divergente'],
  Divergente: ['Liberado', 'Rejeitado'],
  // Terminal.
  Liberado: [],
};

export function transicaoPermitida(de: SituacaoRepasse, para: SituacaoRepasse): boolean {
  return TRANSICOES[de].includes(para);
}

// ---------------------------------------------------------------------------
// Prazos
// ---------------------------------------------------------------------------

export function entregaVencida(entrega: Entrega, agora: Instante): boolean {
  return entrega.situacao === 'pendente' && entrega.prazoLimite < agora;
}

export function diasAteVencimento(entrega: Entrega, agora: Instante): number {
  return Math.ceil((entrega.prazoLimite - agora) / 86_400_000);
}

export interface ResumoCustodia {
  readonly retidoNoPrazo: number;
  readonly retidoVencido: number;
  readonly divergente: number;
  readonly confirmado: number;
}

export function resumirCustodia(
  entregas: readonly Entrega[],
  agora: Instante,
): ResumoCustodia {
  return {
    retidoNoPrazo: entregas.filter(
      (e) => e.situacao === 'pendente' && !entregaVencida(e, agora),
    ).length,
    retidoVencido: entregas.filter((e) => entregaVencida(e, agora)).length,
    divergente: entregas.filter((e) => e.situacao === 'divergente').length,
    confirmado: entregas.filter((e) => e.situacao === 'confirmada').length,
  };
}

/** Progresso do quórum de uma entrega, para o marcador `●○`. */
export function progressoQuorum(
  entrega: Entrega,
  quorum: number,
): { readonly feitas: number; readonly faltam: number; readonly quorum: number } {
  const feitas = Math.min(entrega.confirmadoPor.length, quorum);
  return { feitas, faltam: Math.max(0, quorum - feitas), quorum };
}

/** Entregas pendentes de uma escola, vencidas primeiro. */
export function pendenciasDaEscola(
  entregas: readonly Entrega[],
  escolaId: string,
  agora: Instante,
): readonly Entrega[] {
  return entregas
    .filter((e) => e.escolaId === escolaId && e.situacao !== 'confirmada')
    .sort((a, b) => {
      const va = entregaVencida(a, agora) ? 0 : 1;
      const vb = entregaVencida(b, agora) ? 0 : 1;
      return va !== vb ? va - vb : a.prazoLimite - b.prazoLimite;
    });
}

/** Repasses cujo valor está imobilizado em custódia. */
export function repassesEmCustodia(repasses: readonly Repasse[]): readonly Repasse[] {
  return repasses.filter(
    (r) => r.situacao === 'Retido' || r.situacao === 'Divergente',
  );
}
