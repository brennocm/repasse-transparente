# Plano de Implementação: RepasseTransparente — Protótipo Navegável

**Branch:** `001-repasse-transparente` · **Spec:** `spec.md` · **Data:** 2026-07-28
**Entrada:** `specs/001-repasse-transparente/spec.md`

## Resumo

Site estático em Next.js que encena o produto RepasseTransparente com dados fictícios. O
núcleo de regras é uma transliteração fiel do programa Anchor `repasse_transparente` da
proposta para TypeScript, operando sobre `bigint` em centavos de BRZ, sem blockchain.
Saldos são simulados em três contas — prefeitura, custódia e fornecedor — de modo que o
registro e o pagamento sejam a mesma operação, como na proposta. Sobre ele, um registro
somente-anexação encadeado por SHA-256 dá materialidade auditável à alegação de
imutabilidade. A interface expõe quatro perfis de acesso simulado, um painel público sem
autenticação e um explorador de registros com verificação de integridade.

## Contexto Técnico

| Item | Decisão |
|---|---|
| Linguagem / versão | TypeScript 5.9, `strict` + `noUncheckedIndexedAccess`, alvo ES2022 (`bigint` nativo) |
| Framework | Next.js 16.2, App Router, `output: 'export'` (Turbopack) |
| Estilo | Tailwind CSS + shadcn/ui (componentes copiados, não instalados) |
| Estado | React Context + `useReducer`, espelhado em `localStorage` versionado |
| Gráficos | SVG próprio, sem biblioteca |
| Ícones | `lucide-react` — compilado no bundle, sem requisição em runtime |
| Criptografia | SHA-256 síncrono vendorizado em `src/core/` |
| Testes | Vitest sobre o núcleo — TypeScript puro, sem DOM |
| Armazenamento | Nenhum servidor. `localStorage` do navegador |
| Plataforma alvo | Navegadores modernos, 360px a 2560px |
| Hospedagem | Vercel Hobby (estático; portável para qualquer host de arquivos) |
| Desempenho | Interativo em menos de 2,5s em 4G simulada; bundle inicial abaixo de 300KB |
| Restrições | Custo zero, sem rede em runtime, sem backend, sem variável de ambiente |
| Escala | Um município, 12 escolas, 10 itens, 5 fontes, ~40 repasses semeados |
| Rede de referência | Solana · programa Anchor · liquidação em BRZ — **simulada**, não executada |

## Checagem Constitucional — Inicial

| Princípio | Conformidade | Observação |
|---|---|---|
| I. Dados fictícios rotulados | ✅ | Dataset inteiramente fabricado; faixa de demonstração em todo layout |
| II. Simulação é transliteração | ✅ | `src/core/` isolado e proibido de conter lógica de conveniência |
| III. Zero dependência de rede | ✅ | Exportação estática, fontes do sistema, ícones inline, sem fetch |
| IV. Impacto em 30 segundos | ✅ | Conversão para refeições preservadas é requisito de núcleo (FR-025) |
| V. Autenticação é cenografia | ✅ | Seleção de perfil, sem campo de senha, sem marca de terceiros |
| VI. Spec antes de código | ✅ | Toda tarefa referencia um `FR-###` |
| VII. Responsivo e acessível | ✅ | shadcn/ui como base acessível; situação por ícone e texto |

**Violações:** nenhuma.

## Estrutura do Projeto

```
src/
  core/                          # PURO. Sem React, sem I/O, sem async.
    tipos.ts                     # Centavos, ItemPreco, ContaRepasse, Evento, Registro
    sha256.ts                    # SHA-256 síncrono vendorizado
    erros.ts                     # ErroPrograma — variantes Erro:: do Anchor
    mediana.ts                   # calcularMediana — clona, ordena, [len / 2]
    contrato.ts                  # autorizarFonte, reportarPreco, atualizarPrecoReferencia,
                                 # proporRepasse, confirmarEntrega, saldos BRZ
    registro.ts                  # cadeia encadeada, anexar, verificarIntegridade
  adapter/
    estado.ts                    # EstadoApp, reducer, ações
    persistencia.ts              # localStorage versionado
    consultas.ts                 # agregados, filtros, projeções para a UI
    impacto.ts                   # centavos → refeições, escolas, alunos
    formato.ts                   # bigint → texto em pt-BR
    escrow.ts                    # unicidade de confirmador — o que o programa não grava
  mocks/
    municipio.ts  escolas.ts  itens.ts  fontes.ts
    fornecedores.ts  cotacoes.ts  repasses.ts  perfis.ts
    seed.ts                      # monta o estado de gênese
  app/
    layout.tsx                   # faixa de demonstração, provedor de estado
    page.tsx                     # landing                          US1
    entrar/page.tsx              # acesso por perfil                US2
    transparencia/
      page.tsx                   # painel público                   US4
      repasse/page.tsx           # detalhe via ?id=
      item/page.tsx              # série de preços via ?id=
    explorador/page.tsx          # registros + integridade          US6
    programa/page.tsx            # Anchor + auditoria               US8
    plataforma/
      layout.tsx                 # guarda de perfil
      gestor/page.tsx            # propostas                        US3
      gestor/nova-proposta/page.tsx
      oraculo/page.tsx           # cotações e mediana               US5
      conselho/page.tsx          # confirmação de entrega           US7
      controle/page.tsx          # alertas e pendências
  components/
    ui/                          # shadcn
    layout/                      # cabeçalho, rodapé, faixa de demo
    dados/                       # indicadores, tabela, situação, gráficos
    dominio/                     # cartão de repasse, painel da trava, cotações
tests/
  core/                          # fidelidade ao programa — 109 asserções
```

## Fase 0 — Pesquisa

Concluída. Ver `research.md`. Quatorze decisões registradas, das quais três moldam o resto
do plano:

- A auditoria do programa Anchor encontrou três divergências críticas — duas delas novas,
  introduzidas pelo escrow — preservadas no núcleo e transformadas em conteúdo da página
  `/programa`.
- A exportação estática impede segmento dinâmico para entidades criadas em runtime, o que
  fixa o uso de parâmetro de consulta nas páginas de detalhe.
- O SHA-256 é vendorizado de forma síncrona para manter o núcleo puro e testável sem
  `Promise`.

## Fase 1 — Design

Saídas: `data-model.md`, `contracts/`, `mock-data.md`, `design-direction.md`, `quickstart.md`.

`design-direction.md` é normativo para as Fases 6 a 9: paleta com contrastes medidos, as
duas vozes tipográficas, o conceito de layout e o elemento assinatura. Divergir dele exige
emendá-lo primeiro.

Fronteiras de responsabilidade — a regra que sustenta o Princípio II:

```
   mocks/          →  estado de gênese: itens, fontes autorizadas, cotações iniciais
      ↓
   core/           →  decide aprovação e rejeição. Não conhece React, escolas, refeições
      ↓                nem formatação. Lança ErroPrograma onde o Anchor reverteria.
   adapter/        →  atribui identificadores, retém pagamento, calcula impacto,
      ↓                formata, consulta. Pode ser conveniente. Nunca decide preço.
   app/ components →  apresenta. Nenhuma regra de negócio.
```

Regra de revisão: qualquer `if` que decida aprovação ou rejeição de repasse fora de
`src/core/contrato.ts` é violação do Princípio II.

## Fase 2 — Abordagem de Tarefas

`/speckit:tasks` deve gerar tarefas nesta ordem:

1. **Fundação** — projeto, Tailwind, shadcn, tipos do núcleo, aliases
2. **Testes do núcleo primeiro** — um teste por requisito FR-001 a FR-010, mais os casos de
   borda da spec; confirmar que falham antes de implementar
3. **Núcleo** — sha256, mediana, contrato, registro
4. **Dados** — mocks e semeadura
5. **Adaptador** — estado, persistência, consultas, impacto, formatação, escrow
6. **Interface pública** — landing, painel, detalhes, explorador, contrato
7. **Interface autenticada** — acesso, guarda, os quatro painéis de perfil
8. **Polimento** — responsividade, acessibilidade, estados vazios, restauração de dados

Paralelização: as tarefas de mocks são independentes entre si; as páginas públicas são
independentes entre si após o adaptador existir. As tarefas do núcleo são sequenciais —
`registro` depende de `sha256`, `contrato` depende de `mediana`.

Cada tarefa cita o `FR-###` que atende. Todo `FR-###` da spec precisa de ao menos uma
tarefa.

## Sequenciamento por Prazo

O ideathon impõe duas datas. O plano é fatiado para que exista algo publicável em cada uma.

| Marco | Data | Escopo mínimo |
|---|---|---|
| **Onda 1 — submissão** | 29/jul | US1, US2, US3, US4 (P1). Núcleo completo e testado, landing, acesso, trava funcionando, painel público. É o suficiente para a proposta ter link navegável. |
| **Onda 2 — Pitch Day** | 6/ago | US5, US6 (P2). Fluxo do oráculo, explorador com verificação de integridade. É o que responde às perguntas técnicas da banca. |
| **Onda 3 — se houver folga** | — | US7, US8 (P3). Escrow com confirmação do Conselho, página do contrato com a auditoria. |

A Onda 1 é publicável sozinha. As demais só adicionam.

## Riscos de Execução

| Risco | Mitigação |
|---|---|
| Prazo da Onda 1 é de horas, não dias | Núcleo e mocks primeiro; a interface da Onda 1 pode ser visualmente crua sem comprometer a tese |
| Núcleo divergir do contrato sem ninguém notar | NFR-008 exige teste em todos os caminhos de FR-001 a FR-010; a suíte é o portão |
| Estado local corrompido durante a demonstração | Chave versionada, descarte silencioso de versão antiga, e comando visível de restauração (FR-048) |
| Nome fabricado colidir com entidade real | Verificação explícita antes da publicação, listada em `quickstart.md` |
| URL da hospedagem mudar após divulgação | Fixar o nome do projeto antes de enviar o link |

## Checagem Constitucional — Pós-implementação (28/07/2026)

| Princípio | Conformidade | Evidência |
|---|---|---|
| I. Dados fictícios rotulados | ✅ | Faixa de demonstração em todas as 14 rotas; busca pública confirma que nenhum município, empresa ou pessoa fabricada corresponde a entidade real; CNPJ com dígito verificador inválido, garantido por teste |
| II. Simulação é transliteração | ✅ | `src/core/` sem React, I/O ou async; nove divergências do programa preservadas e travadas por teste; conveniência isolada em `src/adapter/` |
| III. Zero dependência de rede | ✅ | `performance.getEntriesByType('resource')` fora da origem devolve `[]` após o carregamento; exportação estática; fontes do sistema |
| IV. Impacto em 30 segundos | ✅ | Todo valor bloqueado acompanhado de refeições preservadas; jargão sempre com tradução ao lado |
| V. Autenticação é cenografia | ✅ | `/entrar` sem nenhum `<input>`; sem menção a gov.br; declaração explícita de que nenhuma credencial é aceita |
| VI. Spec antes de código | ✅ | 58 FRs e 8 NFRs, todos com tarefa que os cita |
| VII. Responsivo e acessível | ✅ | `scrollWidth ≤ 360` nas 14 rotas; ordem de foco percorrida por Tab com foco visível em todos os controles; situação sempre com ícone e rótulo |

**Violações:** nenhuma.

## Rastreamento de Complexidade

Sem violações constitucionais. Tabela vazia.

## Progresso

- [x] Fase 0 — Pesquisa concluída
- [x] Fase 1 — Design concluído
- [x] Fase 2 — Abordagem de tarefas definida
- [x] Checagem Constitucional inicial
- [x] Checagem Constitucional pós-implementação
