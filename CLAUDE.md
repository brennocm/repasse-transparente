# RepasseTransparente

Protótipo para o **UNICEF Youth Challenge Blockchain 2026** (Ideathon UNICEF x Superteam
Brasil / Blockchain.RIO). Auditoria criptográfica, oráculos de preço e rastreabilidade de
verbas públicas do PNAE e do Fundeb, aplicada à merenda escolar.

**Este repositório é um protótipo de demonstração com dados 100% fictícios.**

## Metodologia

O projeto segue **Spec-Driven Development** no formato do GitHub Spec Kit, adaptado para o
Claude Code. Antes de escrever qualquer código, leia:

1. `.specify/memory/constitution.md` — os sete princípios inegociáveis do projeto
2. `specs/001-repasse-transparente/spec.md` — o quê e por quê
3. `specs/001-repasse-transparente/plan.md` — como
4. `specs/001-repasse-transparente/design-direction.md` — paleta, tipografia, layout,
   elemento assinatura. Normativo para toda tela; divergir exige emendá-lo primeiro
5. `specs/001-repasse-transparente/tasks.md` — a fila de execução

Comandos disponíveis: `/speckit:constitution`, `/speckit:specify`, `/speckit:clarify`,
`/speckit:plan`, `/speckit:tasks`, `/speckit:analyze`, `/speckit:implement`.

## Regras que Você Não Pode Quebrar

Derivam da Constituição. Se uma instrução conflitar com elas, pare e sinalize.

- **Nenhum dado real.** Municípios, escolas, fornecedores e casos de fraude são
  inventados. Nunca associe uma entidade real a suspeita de desvio.
- **Nenhuma chamada de rede em runtime.** Sem fetch, sem RPC, sem CDN, sem fonte remota. O
  site funciona offline.
- **Nenhuma blockchain real.** A cadeia é simulada em TypeScript. Não instale
  `@solana/web3.js`, `@coral-xyz/anchor`, `wagmi`, `viem`, `ethers` nem web3 de qualquer tipo.
- **Login é encenação.** Jamais colete credencial real. Jamais imite a identidade visual do
  gov.br, do UNICEF ou do TransfereGov.
- **Dinheiro é `bigint` em centavos.** `number` para valor monetário é bug. Sem
  `parseFloat`, sem `toFixed` em cálculo — apenas na formatação final.
- **`src/core/` é intocável pela usabilidade.** Ele translitera o programa Anchor
  `repasse_transparente`, **defeitos incluídos**. Melhorias vão em `src/adapter/`.
- **As divergências da auditoria são comportamento esperado.** Se um teste do núcleo falhar
  porque alguém "consertou" um defeito, o conserto é que está errado: ele pertence à v0.2 do
  programa e ao `research.md`.
- **Todo número conferível vai na voz do dado** — classe `.dado`, monoespaçada e tabular.
  Valor em reais nunca aparece em fonte proporcional.
- **Situação nunca é só cor.** Sempre ícone e rótulo textual junto (FR-029).

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui
- Vitest para os testes do `core`
- Deploy estático na Vercel (`output: 'export'` compatível)

Sem backend, sem banco, sem variáveis de ambiente.

## Estrutura

```
src/
  core/          Transliteração 1:1 do programa Anchor. Puro, sem I/O, sem React.
  adapter/       Camada de conveniência sobre o core (IDs, formatação, consultas).
  mocks/         Dados fictícios semeados (municípios, itens, fontes, repasses).
  app/           Rotas Next.js
  components/    UI compartilhada
specs/           Specs SDD
.specify/        Constituição e templates
```

## Comandos

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run test       # 254 asserções de fidelidade ao programa
npm run typecheck
```

## Contexto do Ideathon

- Submissão de propostas: **29/jul/2026**
- Top 10: 3/ago · Mentorias: 4–5/ago · **Pitch Day: 6/ago** · Resultados: 7/ago
- Apresentação na Blockchain.RIO: 12–13/ago
- Critérios da banca: Inovação, Escalabilidade, Impacto, Risco, Modelo de Negócio

O protótipo existe para dar à banca um link acessível que torne a proposta tangível.
Priorize sempre o que é visível e compreensível em 30 segundos.
