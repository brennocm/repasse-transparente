import type { Id } from '@/core/tipos';
import type { Papel, Perfil, Permissao, Sessao } from '@/dominio/tipos';
import { CONSELHEIRO_SECUNDARIO, PERFIS, podeExecutar as permitido } from '@/mocks/perfis';

/**
 * Sessão de demonstração (FR-017, FR-018, FR-020, FR-021).
 *
 * **Nenhuma credencial é solicitada, aceita ou armazenada.** Entrar é selecionar
 * um cartão de perfil. Ver `contracts/acesso-simulado.md` para o que é proibido
 * implementar aqui — em especial, qualquer coisa que se pareça com um formulário
 * de login real ou com a identidade visual de um provedor de identidade.
 */

/** Perfis oferecidos na tela de acesso. */
export function listarPerfis(): readonly Perfil[] {
  return PERFIS;
}

/** Inclui o segundo conselheiro, que não aparece na tela de acesso. */
export function todosOsPerfis(): readonly Perfil[] {
  return [...PERFIS, CONSELHEIRO_SECUNDARIO];
}

export function perfilDaSessao(sessao: Sessao | null): Perfil | null {
  if (sessao === null) return null;
  return todosOsPerfis().find((p) => p.id === sessao.perfilId) ?? null;
}

export function podeExecutar(perfil: Perfil | null, permissao: Permissao): boolean {
  return permitido(perfil, permissao);
}

// ---------------------------------------------------------------------------
// Guarda de rota
// ---------------------------------------------------------------------------

/**
 * `as const` de propósito: com `Record<Papel, string>` os valores perdem o tipo
 * literal e o roteador tipado do Next recusa a navegação, que é justamente a
 * verificação que impede link para rota inexistente.
 */
export const ROTA_DO_PAPEL = {
  gestor: '/plataforma/gestor',
  oraculo: '/plataforma/oraculo',
  conselho: '/plataforma/conselho',
  controle: '/plataforma/controle',
} as const satisfies Record<Papel, string>;

export type Acesso =
  | { readonly permitido: true }
  | {
      readonly permitido: false;
      readonly motivo: 'sem-sessao' | 'papel-incorreto';
      readonly explicacao: string;
      readonly papelNecessario: Papel;
    };

/**
 * Decide o acesso a uma área da plataforma.
 *
 * Papel incorreto **não** redireciona em silêncio: devolve uma explicação. A
 * segregação de papéis é parte do que está sendo demonstrado — escondê-la
 * desperdiça a demonstração e deixa o avaliador sem entender o que aconteceu
 * (FR-021).
 */
export function verificarAcesso(perfil: Perfil | null, papelNecessario: Papel): Acesso {
  if (perfil === null) {
    return {
      permitido: false,
      motivo: 'sem-sessao',
      papelNecessario,
      explicacao:
        'Esta área exige um perfil. Escolha um dos quatro perfis de demonstração para continuar.',
    };
  }

  if (perfil.papel !== papelNecessario) {
    return {
      permitido: false,
      motivo: 'papel-incorreto',
      papelNecessario,
      explicacao: `Você está como ${perfil.nome} (${DESCRICAO_PAPEL[perfil.papel]}). Esta área é de ${DESCRICAO_PAPEL[papelNecessario]}. Troque de perfil para continuar.`,
    };
  }

  return { permitido: true };
}

export const DESCRICAO_PAPEL: Readonly<Record<Papel, string>> = {
  gestor: 'gestão municipal',
  oraculo: 'fonte oracular',
  conselho: 'conselho de alimentação escolar',
  controle: 'órgão de controle',
};

/** Perfil que atende a um papel, para oferecer a troca na tela de bloqueio. */
export function perfilDoPapel(papel: Papel): Perfil | undefined {
  return PERFIS.find((p) => p.papel === papel);
}
