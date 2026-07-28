/**
 * Tipos de domínio da aplicação.
 *
 * Distinto de `src/core/`: aquele espelha o programa Anchor; este descreve o
 * mundo — escolas, itens, fornecedores, pessoas. O núcleo nunca importa daqui.
 */

import type { Centavos, Endereco, Id, Instante } from '@/core/tipos';

export interface Municipio {
  readonly id: Id;
  readonly nome: string;
  /** Unidade federativa fictícia, para não associar entidade real a fraude (FR-046). */
  readonly uf: string;
  readonly ufNome: string;
  readonly populacao: number;
  /**
   * Custo de referência por refeição. Parâmetro de demonstração exibido junto de
   * toda métrica derivada — não é afirmação sobre o valor per capita do PNAE.
   */
  readonly custoRefeicaoCentavos: Centavos;
}

export interface Escola {
  readonly id: Id;
  readonly municipioId: Id;
  readonly nome: string;
  readonly bairro: string;
  readonly alunos: number;
  readonly refeicoesDia: number;
}

export type UnidadeItem = 'kg' | 'L' | 'dz' | 'un';

export interface Item {
  readonly id: Id;
  readonly nome: string;
  readonly unidade: UnidadeItem;
  readonly categoria: string;
  readonly perecivel: boolean;
}

/** As três origens exigidas pela seção 4 da proposta. */
export type CategoriaFonte = 'oficial' | 'intermunicipal' | 'sociedade-civil';

export interface Fonte {
  readonly endereco: Endereco;
  readonly nome: string;
  readonly nomeCurto: string;
  readonly categoria: CategoriaFonte;
  readonly descricao: string;
}

export type PorteFornecedor = 'pequeno' | 'medio' | 'grande';

export interface Fornecedor {
  readonly id: Id;
  readonly endereco: Endereco;
  readonly nome: string;
  /** CNPJ com dígito verificador **inválido por desenho** (FR-046). */
  readonly cnpjFicticio: string;
  readonly porte: PorteFornecedor;
}

export type Papel = 'gestor' | 'oraculo' | 'conselho' | 'controle';

export type Permissao =
  | 'propor_repasse'
  | 'reportar_cotacao'
  | 'atualizar_referencia'
  | 'confirmar_entrega'
  | 'registrar_divergencia'
  | 'ver_alertas'
  | 'ver_painel_publico';

export interface Perfil {
  readonly id: Id;
  readonly papel: Papel;
  readonly nome: string;
  readonly cargo: string;
  readonly instituicao: string;
  readonly endereco: Endereco;
  /** Apenas para o papel `conselho`. */
  readonly escolaId: Id | null;
  readonly permissoes: readonly Permissao[];
}

export type SituacaoRepasse =
  | 'Proposto'
  | 'Rejeitado'
  | 'Retido'
  | 'Liberado'
  | 'Divergente';

export interface Repasse {
  readonly id: Id;
  readonly itemId: Id;
  readonly fornecedorId: Id;
  readonly escolaId: Id;
  readonly quantidade: bigint;
  readonly valorTotal: Centavos;
  readonly precoUnitarioEfetivo: Centavos;
  /** Congelada no momento da decisão — o histórico precisa ser reproduzível. */
  readonly medianaAplicada: Centavos;
  readonly limiteAplicado: Centavos;
  readonly toleranciaAplicada: bigint;
  readonly situacao: SituacaoRepasse;
  readonly motivoRejeicao: string | null;
  readonly criadoEm: Instante;
  /** Números dos registros da cadeia relacionados a este repasse. */
  readonly registros: readonly number[];
}

/**
 * Sessão de demonstração.
 *
 * Nunca contém credencial: apenas qual perfil de demonstração está selecionado
 * (FR-018, Princípio V).
 */
export interface Sessao {
  readonly perfilId: Id;
  readonly iniciadaEm: Instante;
  readonly versaoEstado: number;
}

export type SituacaoEntrega = 'pendente' | 'confirmada' | 'divergente';

export interface Entrega {
  readonly repasseId: Id;
  readonly escolaId: Id;
  readonly situacao: SituacaoEntrega;
  readonly prazoLimite: Instante;
  /**
   * Quem confirmou. Existe apenas aqui, na camada de aplicação: é exatamente a
   * informação que o programa deixou de gravar on-chain (CRIT-02), e que a v0.2
   * precisa registrar.
   */
  readonly confirmadoPor: readonly Endereco[];
  readonly confirmadoEm: Instante | null;
  readonly descricaoDivergencia: string | null;
}
