# RepasseTransparente

Auditoria criptográfica, oráculos de preço e rastreabilidade de verbas públicas para a
primeira infância e educação.

**Demo:** [repasse-transparente.vercel.app](https://repasse-transparente.vercel.app)

Protótipo desenvolvido para o **UNICEF Youth Challenge Blockchain 2026** — Ideathon UNICEF
x Superteam Brasil / Blockchain.RIO.

> **Este é um protótipo de demonstração.** Todos os dados são fictícios. Nenhum município,
> escola, empresa ou pessoa aqui representada existe. A lógica do programa inteligente é
> **simulada em software** — não há blockchain, carteira ou transação real.

---

## O problema

A merenda escolar está entre os alvos mais frequentes de superfaturamento em licitações
municipais. Quando a auditoria chega, anos depois, o recurso já foi consumido e a criança
já comeu — ou deixou de comer.

## A proposta

Trocar auditoria reativa por **trava preventiva**. Fontes independentes reportam preços de
mercado; o preço de referência é a **mediana** dessas cotações; qualquer proposta de compra
acima da mediana mais uma tolerância é **bloqueada antes do desembolso**.

A mediana, e não a média, porque uma única fonte comprometida reportando um valor absurdo
distorce a média inteira — e não move a mediana.

A liquidação acontece em **BRZ**, stablecoin pareada 1:1 ao Real. O lançamento contábil e o
pagamento passam a ser a mesma operação — não existe a diferença entre os dois onde a
fraude costuma se alojar.

## O que este protótipo demonstra

- A trava rejeitando uma compra de leite 90% acima do preço de referência, com o valor
  preservado convertido em refeições escolares
- A formação da mediana a partir de cinco fontes de categorias distintas, e sua resistência
  a manipulação
- Um registro encadeado por hash em que qualquer alteração retroativa é detectável — você
  pode adulterar um registro e ver a verificação apontá-lo
- Os quatro atores do ecossistema, cada um com sua visão do sistema
- Um painel público de transparência acessível sem cadastro
- A liquidação em BRZ: o valor sai da conta da prefeitura, fica custodiado, e só chega ao
  fornecedor após duas confirmações de entrega
- A auditoria do próprio programa Anchor, com as limitações que ele ainda tem — inclusive as
  duas falhas que o escrow introduziu

## O que ele não é

Não há blockchain — nenhuma transação toca a Solana, e nenhum BRZ real é movimentado. Não
há backend, banco de dados ou autenticação real. O login é encenação de produto, sem coleta
de credencial. Nada aqui está pronto para operar com dinheiro público.

---

## Metodologia

O projeto é construído por agentes de IA sob **Spec-Driven Development**, no formato do
GitHub Spec Kit adaptado ao Claude Code.

| Documento | Conteúdo |
|---|---|
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Os sete princípios inegociáveis |
| [`specs/001-repasse-transparente/spec.md`](specs/001-repasse-transparente/spec.md) | O quê e por quê — 8 histórias, 58 FRs e 8 NFRs |
| [`specs/001-repasse-transparente/research.md`](specs/001-repasse-transparente/research.md) | Decisões técnicas e a auditoria do programa Anchor |
| [`specs/001-repasse-transparente/plan.md`](specs/001-repasse-transparente/plan.md) | Como — stack, estrutura, sequenciamento |
| [`specs/001-repasse-transparente/data-model.md`](specs/001-repasse-transparente/data-model.md) | Entidades, invariantes, máquina de estados |
| [`specs/001-repasse-transparente/design-direction.md`](specs/001-repasse-transparente/design-direction.md) | Paleta com contrastes medidos, tipografia, layout, assinatura |
| [`specs/001-repasse-transparente/contracts/`](specs/001-repasse-transparente/contracts/) | Interfaces entre módulos |
| [`specs/001-repasse-transparente/mock-data.md`](specs/001-repasse-transparente/mock-data.md) | O dataset fictício, com os números conferidos |
| [`specs/001-repasse-transparente/tasks.md`](specs/001-repasse-transparente/tasks.md) | 85 tarefas, todas concluídas e rastreadas a requisitos |
| [`specs/001-repasse-transparente/quickstart.md`](specs/001-repasse-transparente/quickstart.md) | Roteiro de verificação manual |

### Comandos

```
/speckit:constitution   estabelece ou emenda os princípios
/speckit:specify        cria a especificação de uma funcionalidade
/speckit:clarify        extrai ambiguidades antes de planejar
/speckit:plan           decide a abordagem técnica
/speckit:tasks          quebra em tarefas executáveis
/speckit:analyze        audita consistência entre os artefatos
/speckit:implement      executa
```

---

## Executar

```bash
npm install
npm run test    # 254 asserções
npm run dev
```

## Stack

Next.js com exportação estática, TypeScript strict, Tailwind CSS, shadcn/ui, Vitest.
Sem backend, sem banco, sem variável de ambiente, sem dependência de rede em runtime.

## Licença

MIT.
