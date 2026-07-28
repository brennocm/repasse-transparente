import type { Endereco } from '@/core/tipos';
import type { Papel, Perfil, Permissao } from '@/dominio/tipos';
import { FONTES } from './fontes';

/**
 * Quatro perfis de demonstração — pessoas fictícias, instituições fictícias.
 *
 * Selecionar um cartão é o ato de entrar. Nenhuma credencial é solicitada,
 * aceita ou armazenada (FR-018, Princípio V).
 */

function endereco(prefixo: string): Endereco {
  return '0x' + prefixo.repeat(20);
}

/** Autoridade de origem do BRZ. Equivale à conta `prefeitura` do programa. */
export const ENDERECO_PREFEITURA: Endereco = endereco('91');

/** Matriz de permissões do `data-model.md` (FR-021). */
export const PERMISSOES_POR_PAPEL: Readonly<Record<Papel, readonly Permissao[]>> = {
  gestor: ['propor_repasse', 'ver_alertas', 'ver_painel_publico'],
  oraculo: ['reportar_cotacao', 'atualizar_referencia', 'ver_painel_publico'],
  conselho: [
    'confirmar_entrega',
    'registrar_divergencia',
    'ver_alertas',
    'ver_painel_publico',
  ],
  controle: ['ver_alertas', 'ver_painel_publico'],
};

export const PERFIS: readonly Perfil[] = [
  {
    id: 'perfil-gestor',
    papel: 'gestor',
    nome: 'Helena Braga',
    cargo: 'Nutricionista-chefe',
    instituicao: 'Secretaria Municipal de Educação de Serra do Cedro',
    endereco: ENDERECO_PREFEITURA,
    escolaId: null,
    permissoes: PERMISSOES_POR_PAPEL.gestor,
  },
  {
    id: 'perfil-oraculo',
    papel: 'oraculo',
    nome: 'Rafael Nunes',
    cargo: 'Analista de preços',
    instituicao: 'Central de Abastecimento do Vale Norte',
    // Opera como a primeira fonte oracular.
    endereco: FONTES[0]?.endereco ?? endereco('a1'),
    escolaId: null,
    permissoes: PERMISSOES_POR_PAPEL.oraculo,
  },
  {
    id: 'perfil-conselho',
    papel: 'conselho',
    nome: 'Cláudia Ferraz',
    cargo: 'Presidente do CAE',
    instituicao: 'Conselho de Alimentação Escolar — EM Serra Azul',
    endereco: endereco('11'),
    escolaId: 'esc-01',
    permissoes: PERMISSOES_POR_PAPEL.conselho,
  },
  {
    id: 'perfil-controle',
    papel: 'controle',
    nome: 'Otávio Lins',
    cargo: 'Promotor de justiça',
    instituicao: 'Ministério Público do Vale Norte',
    endereco: endereco('c0'),
    escolaId: null,
    permissoes: PERMISSOES_POR_PAPEL.controle,
  },
];

/**
 * Segundo membro do conselho. Existe porque o quórum é de duas confirmações e o
 * programa não registra quem confirmou (CRIT-02): a camada de aplicação precisa
 * de pelo menos duas identidades distintas para impor unicidade.
 */
export const CONSELHEIRO_SECUNDARIO: Perfil = {
  id: 'perfil-conselho-2',
  papel: 'conselho',
  nome: 'Jorge Amaral',
  cargo: 'Representante de pais e responsáveis',
  instituicao: 'Conselho de Alimentação Escolar — EM Serra Azul',
  endereco: endereco('12'),
  escolaId: 'esc-01',
  permissoes: PERMISSOES_POR_PAPEL.conselho,
};

export function podeExecutar(perfil: Perfil | null, permissao: Permissao): boolean {
  if (perfil === null) return permissao === 'ver_painel_publico';
  return perfil.permissoes.includes(permissao);
}
