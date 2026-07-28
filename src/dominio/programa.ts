/**
 * O programa `repasse_transparente` e a auditoria das suas limitações.
 *
 * Conteúdo normativo, extraído de `RepasseTransparente_Proposta.docx`, seção 5,
 * e de `specs/001-repasse-transparente/research.md`, decisão 1.
 *
 * Esta página existe para o critério **Risco**: reconhecer, entender e saber
 * corrigir um defeito do próprio artefato pontua. Esconder o defeito só adia a
 * descoberta para o momento em que alguém da banca ler o código.
 */

export const CODIGO_ANCHOR = `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("RepTransp1111111111111111111111111111111");

const TOLERANCIA_PERCENTUAL: u64 = 15;
const CONFIRMACOES_NECESSARIAS: u8 = 2;

#[program]
pub mod repasse_transparente {
    use super::*;

    /// Registra uma fonte de preco autorizada (ex: CEASA, prefeitura vizinha,
    /// cooperativa de agricultura familiar).
    pub fn autorizar_fonte(ctx: Context<AutorizarFonte>) -> Result<()> {
        ctx.accounts.registro_fonte.autorizada = true;
        Ok(())
    }

    /// Fonte autorizada reporta o preco de mercado observado para um item.
    pub fn reportar_preco(ctx: Context<ReportarPreco>, preco: u64) -> Result<()> {
        require!(ctx.accounts.registro_fonte.autorizada, Erro::FonteNaoAutorizada);
        ctx.accounts.cotacao.preco = preco;
        ctx.accounts.cotacao.fonte = ctx.accounts.autoridade.key();
        emit!(PrecoReportado {
            item: ctx.accounts.item_preco.key(),
            fonte: ctx.accounts.autoridade.key(),
            preco
        });
        Ok(())
    }

    /// Recalcula o preco de referencia como a mediana de >= 3 cotacoes
    /// independentes, reduzindo o efeito de uma unica fonte manipulada.
    pub fn atualizar_preco_referencia(
        ctx: Context<AtualizarPreco>,
        precos: Vec<u64>,
    ) -> Result<()> {
        require!(precos.len() >= 3, Erro::FontesInsuficientes);
        let mut ordenado = precos.clone();
        ordenado.sort();
        let mediana = ordenado[ordenado.len() / 2];
        ctx.accounts.item_preco.preco_mediana = mediana;
        ctx.accounts.item_preco.atualizado_em = Clock::get()?.unix_timestamp;
        emit!(MedianaAtualizada { item: ctx.accounts.item_preco.key(), mediana });
        Ok(())
    }

    /// Propoe um repasse em BRZ (SPL token). O valor sai da conta da
    /// prefeitura e fica custodiado em uma PDA ate a confirmacao de entrega.
    /// A transacao reverte se o preco unitario implicito exceder o limite.
    pub fn propor_repasse(
        ctx: Context<ProporRepasse>,
        quantidade: u64,
        valor_proposto: u64,
    ) -> Result<()> {
        let referencia = ctx.accounts.item_preco.preco_mediana;
        require!(referencia > 0, Erro::SemReferencia);

        let preco_unitario = valor_proposto
            .checked_div(quantidade)
            .ok_or(Erro::QuantidadeInvalida)?;

        let limite = referencia + (referencia * TOLERANCIA_PERCENTUAL / 100);
        require!(preco_unitario <= limite, Erro::AcimaDoLimite);

        // CPI: transfere BRZ da conta da prefeitura para a custodia (PDA)
        let cpi_accounts = Transfer {
            from: ctx.accounts.conta_prefeitura.to_account_info(),
            to: ctx.accounts.conta_custodia.to_account_info(),
            authority: ctx.accounts.prefeitura.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            valor_proposto,
        )?;

        let repasse = &mut ctx.accounts.repasse;
        repasse.fornecedor = ctx.accounts.fornecedor.key();
        repasse.valor = valor_proposto;
        repasse.quantidade = quantidade;
        repasse.liberado = false;
        repasse.confirmacoes = 0;

        emit!(RepasseAprovado { repasse: repasse.key(), valor: valor_proposto });
        Ok(())
    }

    /// Parte autorizada (diretor, conselho de pais, fiscal) confirma a
    /// entrega fisica. Ao atingir o quorum, libera BRZ ao fornecedor.
    pub fn confirmar_entrega(ctx: Context<ConfirmarEntrega>) -> Result<()> {
        let repasse = &mut ctx.accounts.repasse;
        require!(!repasse.liberado, Erro::JaLiberado);

        repasse.confirmacoes += 1;

        if repasse.confirmacoes >= CONFIRMACOES_NECESSARIAS {
            repasse.liberado = true;
            let seeds: &[&[u8]] = &[b"custodia", &[ctx.bumps.conta_custodia]];
            let signer = &[seeds];
            let cpi_accounts = Transfer {
                from: ctx.accounts.conta_custodia.to_account_info(),
                to: ctx.accounts.conta_fornecedor.to_account_info(),
                authority: ctx.accounts.conta_custodia.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer,
                ),
                repasse.valor,
            )?;
        }
        Ok(())
    }
}`;

export interface Corrigido {
  readonly antes: string;
  readonly agora: string;
}

/** O que a migração de Solidity para Anchor resolveu. */
export const CORRIGIDO_NA_MIGRACAO: readonly Corrigido[] = [
  {
    antes: 'Nenhuma função autorizava fontes — o contrato era inoperante na prática',
    agora: '`autorizar_fonte` existe',
  },
  {
    antes: 'Escrow prometido na matriz de riscos e ausente do código',
    agora: 'Custódia em PDA, com liberação por quórum',
  },
  {
    antes: '`emit RepasseAprovado(1, ...)` — identificador fixo em todos os repasses',
    agora: '`repasse.key()` — identificador real',
  },
  {
    antes: 'Repasse não persistia; só havia evento',
    agora: 'Conta `repasse` com fornecedor, valor, quantidade e estado',
  },
  {
    antes: 'Ordenação por bubble sort, quadrática',
    agora: '`ordenado.sort()` nativo',
  },
  {
    antes: 'Divisão por zero causava panic sem mensagem',
    agora: '`checked_div(...).ok_or(Erro::QuantidadeInvalida)?`',
  },
];

export type Severidade = 'critica' | 'alta' | 'media';

export interface Divergencia {
  readonly id: string;
  readonly severidade: Severidade;
  readonly titulo: string;
  readonly oQueE: string;
  readonly impacto: string;
  readonly propostaV02: string;
  /** Onde a camada de aplicação mitiga — e por que isso não basta. */
  readonly mitigacaoParcial?: string;
}

export const DIVERGENCIAS: readonly Divergencia[] = [
  {
    id: 'CRIT-01',
    severidade: 'critica',
    titulo: 'O recálculo da referência ignora as cotações registradas',
    oQueE:
      '`atualizar_preco_referencia` recebe `precos: Vec<u64>` por parâmetro e calcula a mediana sobre esse vetor. As contas `cotacao` que `reportar_preco` gravou nunca são lidas.',
    impacto:
      'Quem chama informa o vetor que quiser. Toda a arquitetura de oráculos da seção 4 é contornável por esse caminho — é a mesma falha da versão Solidity, sobrevivendo à migração.',
    propostaV02:
      'Iterar as contas `cotacao` das fontes autorizadas via `remaining_accounts`, filtrar por frescor, e calcular a mediana sobre esse conjunto — sem parâmetro externo.',
    mitigacaoParcial:
      'Nesta demonstração, a aplicação sempre alimenta o vetor a partir das cotações efetivamente gravadas. Isso protege quem passa pela interface, e ninguém mais: um chamador que fale direto com a rede continua contornando.',
  },
  {
    id: 'CRIT-02',
    severidade: 'critica',
    titulo: 'O quórum de entrega é burlável por uma única carteira',
    oQueE:
      '`confirmar_entrega` faz `repasse.confirmacoes += 1` sem registrar quem confirmou. Não há sequer parâmetro de confirmador — não há uso para ele.',
    impacto:
      'A mesma carteira chama a instrução duas vezes e o BRZ é liberado ao fornecedor. Isso anula exatamente a mitigação que a matriz de riscos promete para registro de entrega fictícia: "confirmação por múltiplas partes independentes na ponta".',
    propostaV02:
      'Uma conta `Confirmacao` derivada de `(repasse, confirmador)`, cuja inicialização falha na segunda tentativa do mesmo signatário, mais uma lista de confirmadores elegíveis por escola.',
    mitigacaoParcial:
      'A aplicação recusa a segunda confirmação da mesma parte. Você pode reproduzir a falha abaixo, ignorando essa verificação.',
  },
  {
    id: 'CRIT-03',
    severidade: 'critica',
    titulo: 'Não há prazo nem caminho de reembolso — o dinheiro pode ficar preso',
    oQueE:
      '`propor_repasse` transfere o BRZ da prefeitura para a PDA de custódia. A única saída é `confirmar_entrega` atingindo o quórum.',
    impacto:
      'Se as confirmações nunca vierem — fornecedor desaparece, conselho não se reúne, escola fecha — o valor fica permanentemente imobilizado, sob controle de um programa que não tem instrução para devolvê-lo. Um sistema criado para proteger verba escolar não pode ter estado terminal em que a verba evapora.',
    propostaV02:
      '`cancelar_repasse`, restrita à prefeitura, habilitada após um prazo gravado na conta do repasse, devolvendo o BRZ à origem e registrando o motivo.',
  },
  {
    id: 'ALTA-01',
    severidade: 'alta',
    titulo: 'Sem verificação de frescor da referência',
    oQueE:
      '`atualizado_em` recebe `Clock::get()?` e nunca é lido em lugar algum.',
    impacto:
      'Uma mediana de meses atrás é aceita como referência válida, o que anula a proteção em cenário inflacionário.',
    propostaV02:
      'Rejeitar referência mais velha que uma janela de validade, calibrada por categoria de item.',
  },
  {
    id: 'ALTA-02',
    severidade: 'alta',
    titulo: 'A instrução que libera o dinheiro não emite evento',
    oQueE:
      'A observação (iii) da proposta afirma que "toda alteração de estado emite um evento indexável, permitindo a construção de um painel público sem acesso privilegiado ao nó da rede". `confirmar_entrega` é a única instrução que não emite nada.',
    impacto:
      'Um painel público construído apenas a partir de eventos jamais saberia que o valor foi pago — que é precisamente o fato mais relevante para quem audita. Há contradição entre o texto da proposta e o código.',
    propostaV02:
      'Emitir `EntregaConfirmada` a cada confirmação e `ValorLiberado` ao atingir o quórum.',
  },
  {
    id: 'MED-01',
    severidade: 'media',
    titulo: 'Mediana de conjunto par devolve o central superior',
    oQueE:
      '`ordenado[ordenado.len() / 2]` usa divisão inteira. Para `[400, 500, 600, 700]` devolve `600`, enquanto a mediana estatística é `550`.',
    impacto:
      'Enviesa a referência para cima, favorecendo o fornecedor. Idêntico ao Solidity — a migração não mudou nada aqui.',
    propostaV02:
      'Para conjunto par, usar a média dos dois centrais, com a divisão explicitada em documentação.',
  },
  {
    id: 'MED-02',
    severidade: 'media',
    titulo: 'Cotação zero é aceita',
    oQueE: 'Nenhum `require!` impede `reportar_preco(ctx, 0)`.',
    impacto:
      'Uma fonte comprometida pode puxar a mediana para baixo e causar rejeição de compras legítimas — negação de serviço orçamentária.',
    propostaV02:
      'Exigir cotação dentro de uma faixa plausível em relação à referência vigente, rejeitando extremos em vez de apenas diluí-los.',
  },
  {
    id: 'MED-03',
    severidade: 'media',
    titulo: 'O preço unitário é truncado',
    oQueE:
      '`checked_div` trunca. `R$ 1.000,00` para `3` unidades resulta em `R$ 3,33` em vez de `R$ 3,3333`.',
    impacto:
      'Subestima marginalmente o preço efetivo. Explorável apenas em margens desprezíveis, mas existe.',
    propostaV02:
      'Comparar `valor_proposto` contra `limite * quantidade`, evitando a divisão.',
  },
  {
    id: 'MED-04',
    severidade: 'media',
    titulo: '`declare_id!` não é uma chave pública válida',
    oQueE:
      '`"RepTransp1111..."` tem 40 caracteres; uma pubkey Solana em base58 tem 43 ou 44.',
    impacto: 'É placeholder e não compila como está. Sem impacto conceitual.',
    propostaV02: 'Gerar o par de chaves do programa e fixar o identificador real.',
  },
  {
    id: 'MED-05',
    severidade: 'media',
    titulo: 'Controle de acesso indeterminado',
    oQueE:
      'A proposta não mostra as structs de `Context`, então as constraints de conta ficam indeterminadas.',
    impacto:
      'Se `ProporRepasse` não exigir que `prefeitura` seja signatária e autoridade da conta de origem, qualquer um propõe. Provavelmente resolvido pelas constraints omitidas.',
    propostaV02:
      'Publicar as structs de `Context` com as constraints explícitas, para que a verificação seja possível.',
  },
];

export const ROTULO_SEVERIDADE: Readonly<Record<Severidade, string>> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
};

/** O que falta para sair da simulação. */
export const CAMINHO_PARA_REDE_REAL: readonly string[] = [
  'Corrigir as três divergências críticas, especialmente a ausência de devolução do valor custodiado.',
  'Publicar as structs de `Context` com constraints de conta explícitas, hoje omitidas da proposta.',
  'Escrever a suíte de testes do programa em Anchor, cobrindo os mesmos casos que a simulação cobre hoje.',
  'Auditoria externa independente antes de qualquer piloto com dinheiro público real.',
  'Implantar em devnet com o Conselho de Alimentação Escolar de um município parceiro, sem valor real, por um ciclo completo de compra.',
];
