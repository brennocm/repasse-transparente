# Tarefas: RepasseTransparente — Protótipo Navegável

**Entrada:** `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `mock-data.md`
**Total:** 78 tarefas

## Convenções

- `[P]` — paralelizável: arquivo distinto, sem dependência de outra `[P]` do mesmo bloco
- Cada tarefa cita o requisito que atende
- Onda 1 = submissão (29/jul) · Onda 2 = Pitch Day (6/ago) · Onda 3 = folga

---

## Fase 1 — Fundação · Onda 1 ✅ concluída em 2026-07-28

- [X] **T001** Inicializar Next.js 16 com TypeScript strict e App Router na raiz do projeto; configurar `output: 'export'` em `next.config.ts` (NFR-005, NFR-006)
- [X] **T002** Configurar Tailwind CSS com as duas vozes tipográficas e tokens de cor com contraste medido em `src/app/globals.css`, derivados de `design-direction.md` (NFR-002, NFR-003)
- [X] **T003** Gerar os componentes base no idioma shadcn, escritos sobre os tokens do projeto: `Botao`, `Ficha`, `Entrada`/`Selecao`, `Tabela`, `Selo`, `Dialogo`, `Abas`, `Aviso` (NFR-004)
- [X] **T004** Configurar Vitest para `tests/` com alias `@/` apontando para `src/` em `vitest.config.ts` (NFR-008)
- [X] **T005** [P] Definir `Centavos`, `Instante`, `Id`, `Endereco`, `ItemPreco`, `EstadoPrograma`, `Evento` em `src/core/tipos.ts` (FR-007)
- [X] **T006** [P] Definir `ErroPrograma` e `CodigoErro` com as cinco mensagens exatas do Solidity em `src/core/erros.ts` (FR-032)
- [X] **T007** [P] Definir `Registro`, `TipoRegistro`, `ResultadoVerificacao` em `src/core/tipos.ts` (FR-011)

**Verificado:** `npm run build` conclui em exportação estática (840KB, 3 rotas);
`npm run typecheck` limpo; `scrollWidth` 345px contra viewport de 360px, sem estouro;
zero requisição de rede no bundle gerado; todos os tokens de cor presentes no CSS.

**Pendências herdadas da Fase 1:**
- `vitest.config.ts` está com `passWithNoTests: true`. **Remover ao concluir a Fase 2** —
  a linha existe só para que `npm run test` não falhe enquanto a suíte não existe.
- `src/app/page.tsx` e `src/app/layout.tsx` são andaimes. A T055 e a T057 os substituem.
- `npm audit` acusa 3 vulnerabilidades altas em `postcss` e `sharp`, ambas de build. A
  saída é estática e `images.unoptimized` desliga o `sharp`, então nada disso alcança o
  artefato publicado. Reavaliar se o projeto deixar de ser estático.

## Fase 2 — Testes do Núcleo Primeiro · Onda 1 ✅ concluída em 2026-07-28

Escrita e confirmada vermelha antes da Fase 3.

- [X] **T008** [P] Testar `sha256` contra os vetores de `""` e `"abc"` em `tests/core/sha256.test.ts` — ver `contracts/nucleo-contrato.md` (FR-012)
- [X] **T009** [P] Testar `calcularMediana` nos cinco casos de referência, incluindo conjunto par devolvendo o central superior, em `tests/core/mediana.test.ts` (FR-001, MED-01)
- [X] **T010** [P] Testar que `calcularMediana` resiste a discrepante: `[498,520,545,500000]` devolve `545` (FR-001)
- [X] **T011** [P] Testar `reportarPreco` recusando fonte não autorizada com o texto `Fonte nao autorizada` em `tests/core/contrato.test.ts` (FR-003)
- [X] **T012** [P] Testar `reportarPreco` substituindo cotação anterior da mesma fonte (FR-003)
- [X] **T013** [P] Testar `atualizarPrecoReferencia` recusando menos de 3 cotações com `Minimo de 3 fontes requeridas` (FR-002)
- [X] **T014** [P] Testar `atualizarPrecoReferencia` gravando `nomeItem` fixo `Alimento/Insumo` — divergência MED-05 preservada (FR-009)
- [X] **T015** [P] Testar `calcularLimite` com truncamento inteiro nos casos `tomate` (839), `oleo-soja` (908) e `banana-prata` (667) (FR-004)
- [X] **T016** [P] Testar `proporRepasse` recusando item sem referência com `Sem preco de referencia` (FR-006)
- [X] **T017** [P] Testar `proporRepasse` rejeitando o caso do leite: 40.000 L por R$ 396.000,00 contra limite 598 (FR-005)
- [X] **T018** [P] Testar `proporRepasse` aprovando exatamente no limite — `precoEfetivo === limiteMaximo` passa (FR-005)
- [X] **T019** [P] Testar `proporRepasse` emitindo `repasseId` fixo `1n` — divergência ALTA-03 preservada (FR-009)
- [X] **T020** [P] Testar `proporRepasse` com `qtd === 0n` lançando `DIVISAO_POR_ZERO` (FR-005)
- [X] **T021** [P] Testar as cinco rejeições de `mock-data.md`, conferindo unitário efetivo, limite, sobrepreço e valor bloqueado (FR-005, FR-032)
- [X] **T022** [P] Testar `anexar` produzindo encadeamento correto e cadeia de gênese com `hashAnterior` de 64 zeros em `tests/core/registro.test.ts` (FR-011, FR-012)
- [X] **T023** [P] Testar `serializarDados` determinístico: mesma entrada com chaves em ordem diferente produz o mesmo hash (FR-012)
- [X] **T024** [P] Testar `verificarIntegridade` devolvendo íntegro para cadeia válida e vazia (FR-014)
- [X] **T025** [P] Testar `adulterarParaDemonstracao` fazendo a verificação apontar o registro correto como primeiro inválido (FR-015)
- [X] **T026** [P] Testar que operação revertida também gera registro com `sucesso: false` e motivo textual (FR-013)

**Verificado:** 89 casos em 4 arquivos. **82 falham, 7 passam** — o vermelho correto.
Os 7 verdes são os que conferem a aritmética documentada em `mock-data.md` sem chamar o
núcleo: as cinco linhas de rejeição, o total de R$ 198.010,00 e as 94.290 refeições. São
legitimamente verdes porque não dependem de implementação alguma, e agora a tabela do
`mock-data.md` tem conferência executável.

**Esqueletos criados nesta fase.** `src/core/{sha256,mediana,contrato,registro}.ts` existem
com as assinaturas reais e corpos que lançam `não implementado — T0XX`. Sem eles, os quatro
arquivos falhariam no `import` e nenhum corpo de teste seria executado nem verificado por
tipo — um vermelho que não prova nada. Com eles, `npm run typecheck` valida os testes contra
as assinaturas de verdade, e a Fase 3 vira preenchimento de corpo.

**Emendas ao `contracts/nucleo-contrato.md` feitas antes de escrever os testes:**
- `atualizarPrecoReferencia` recebe `agora: Instante`. O núcleo é determinístico e não pode
  ler o relógio; `block.timestamp` vira parâmetro.
- `anexar` devolve `Registro[]`, uma cadeia nova, em vez de mutar a recebida. Somente-anexação
  (FR-016) fica garantida por estrutura, não por convenção.

**Divergências do contrato travadas como comportamento esperado.** Se algum destes testes
começar a falhar porque alguém "consertou" o núcleo, o conserto é que está errado: CRIT-01
(mediana calculada sobre o arranjo recebido, ignorando `cotacoesOraculo`), MED-01 (conjunto
par devolve o central superior), MED-03 (preço unitário truncado), MED-05 (`nomeItem` fixo),
MED-06 (cotação zero aceita), ALTA-01 (sem controle de acesso), ALTA-03 (`repasseId` fixo).

## Fase 3 — Núcleo · Onda 1 ✅ concluída em 2026-07-28

Sequencial: `registro` depende de `sha256`; `contrato` depende de `mediana`.

- [X] **T027** Implementar `sha256` síncrono e puro em `src/core/sha256.ts` (FR-012)
- [X] **T028** Implementar `calcularMediana` clonando antes de ordenar, com `[len / 2]`, em `src/core/mediana.ts` (FR-001)
- [X] **T029** Implementar `autorizarFonte` e `reportarPreco` em `src/core/contrato.ts` (FR-003, FR-008)
- [X] **T030** Implementar `atualizarPrecoReferencia` preservando CRIT-01 e ALTA-01 (FR-002, FR-008, FR-009)
- [X] **T031** Implementar `calcularLimite`, `proporRepasse` e a transferência de BRZ na ordem do programa (FR-004, FR-005, FR-006, FR-008, FR-037, FR-039)
- [X] **T031b** Implementar `confirmarEntrega` com quórum de 2 e liberação ao fornecedor, preservando CRIT-02 e ALTA-02 (FR-038, FR-040, FR-041)
- [X] **T032** Implementar `serializarDados`, `calcularHash` e `anexar` em `src/core/registro.ts` (FR-011, FR-012, FR-016)
- [X] **T033** Implementar `verificarIntegridade` e `adulterarParaDemonstracao` em `src/core/registro.ts` (FR-014, FR-015)
- [X] **T034** Confirmar a suíte verde; nenhum `number` em cálculo monetário no núcleo (FR-007, NFR-008)

**Verificado:** 109 asserções em 4 arquivos, todas passando. `npm run typecheck` limpo com
`noUncheckedIndexedAccess`. `npm run build` conclui em exportação estática.

**Migração para Solana aplicada nesta fase.** A referência normativa passou a ser o programa
Anchor `repasse_transparente` do `.docx`. A aritmética é idêntica à da versão Solidity —
mediana por `[len / 2]`, limite por `ref + ref * 15 / 100`, fronteira `<=` — então nenhum
número do `mock-data.md` mudou. O que mudou: nomes das variantes de erro, custódia em BRZ,
quórum de duas confirmações, e a mediana passa a clonar antes de ordenar.

**Divergências travadas por teste como comportamento esperado:** CRIT-01 (mediana sobre o
vetor recebido, ignorando as cotações registradas), CRIT-02 (quórum burlável por uma
carteira), CRIT-03 (sem devolução — valor pode ficar preso), ALTA-01 (sem verificação de
frescor), ALTA-02 (`confirmar_entrega` não emite evento), MED-01 (conjunto par devolve o
central superior), MED-02 (cotação zero aceita), MED-03 (preço unitário truncado), MED-05
(sem controle de quem propõe).

## Fase 4 — Dados Semeados · Onda 1 ✅ concluída em 2026-07-28

- [X] **T035** [P] Definir município Serra do Cedro e as 12 escolas em `src/mocks/municipio.ts`, com totais derivados (FR-045)
- [X] **T036** [P] Definir os 10 itens da merenda em `src/mocks/itens.ts` (FR-045)
- [X] **T037** [P] Definir as 5 fontes com diversidade de categoria em `src/mocks/fontes.ts` (FR-045)
- [X] **T038** [P] Definir os 5 fornecedores com CNPJ de dígito inválido em `src/mocks/fornecedores.ts` (FR-045, FR-046)
- [X] **T039** [P] Definir os 4 perfis e a matriz de permissões em `src/mocks/perfis.ts` (FR-017)
- [X] **T040** [P] Gerar cotações históricas determinísticas a partir de `INSTANTE_BASE`, sem `Date.now()` nem aleatoriedade, em `src/mocks/cotacoes.ts` (FR-045)
- [X] **T041** [P] Definir os 40 repasses, com as 5 rejeições exatas de `mock-data.md`, em `src/mocks/repasses.ts` (FR-045)
- [X] **T042** Montar o estado de gênese em `src/mocks/seed.ts`: autorizar fontes, aplicar cotações, recalcular medianas, processar repasses **pelo núcleo**, custodiar BRZ, confirmar entregas e construir a cadeia (FR-037, FR-038, FR-045)
- [X] **T043** Testar que a semeadura é determinística — duas execuções produzem hashes idênticos — em `tests/core/seed.test.ts` (FR-012)
- [X] **T044** Testar que os agregados semeados batem com `mock-data.md`: R$ 198.010,00 bloqueados e 94.290 refeições (FR-024, FR-025)
- [X] **T044b** Testar a integridade do dataset em `tests/mocks/dados.test.ts`: somas das escolas, diversidade das fontes, invalidez dos CNPJ, matriz de permissões (FR-045, FR-046)

**Verificado:** 159 asserções, todas verdes. 354 registros na cadeia, íntegra. Saldos de BRZ
conservados: R$ 2.000.000,00 antes e depois. Impacto derivado do núcleo, não digitado —
R$ 198.010,00 bloqueados, 94.290 refeições.

**A semeadura processa tudo pelo núcleo.** As cinco rejeições não são marcadas como
rejeitadas numa tabela: são rejeitadas por `proporRepasse`, a mesma função que rejeitaria em
produção. Se a trava tiver um bug, a semeadura muda e os testes acusam.

**Dois defeitos encontrados pelos próprios testes desta fase:**
- Os totais de alunos e refeições do `mock-data.md` estavam digitados e não fechavam com a
  soma das escolas — mil alunos a mais. Agora são derivados da lista, com teste.
- A cadeia andava para trás em dois pontos: as cotações começavam antes de as autorizações
  de fonte terminarem, e a confirmação de entrega de um repasse caía depois da proposta do
  seguinte. Corrigido deslocando as cotações em um dia e as confirmações para D+1 e D+2.

**Reconciliação do `mock-data.md`:** os valores dos 35 repasses aprovados eram ilustrativos e
foram substituídos pelos efetivamente derivados. Os números que sustentam a landing — as
cinco rejeições, R$ 198.010,00 e 94.290 refeições — não mudaram nem um centavo.

## Fase 5 — Adaptador · Onda 1 ✅ concluída em 2026-07-28

- [X] **T045** Definir `EstadoApp`, ações e reducer em `src/adapter/estado.ts` (FR-049)
- [X] **T046** Implementar persistência em `localStorage` com chave versionada e par replacer/reviver de `bigint` em `src/adapter/persistencia.ts` (FR-049)
- [X] **T047** Testar o ciclo de serialização preservando `bigint` sem perda em `tests/adapter/persistencia.test.ts` (FR-007, FR-049)
- [X] **T048** Implementar descarte de estado de versão incompatível com aviso, e restauração à semeadura, em `src/adapter/persistencia.ts` (FR-048)
- [X] **T049** [P] Implementar formatação pt-BR de `bigint` para moeda, quantidade e percentual em `src/adapter/formato.ts` (FR-007)
- [X] **T050** [P] Implementar métricas de impacto — valor bloqueado, refeições, alunos, dias — truncando uma única vez no agregado, em `src/adapter/impacto.ts` (FR-024, FR-025)
- [X] **T051** [P] Implementar consultas e filtros por situação, item e período em `src/adapter/consultas.ts` (FR-026)
- [X] **T052** Implementar sessão — `listarPerfis`, `entrar`, `sair`, `sessaoAtual`, `podeExecutar` — em `src/adapter/sessao.ts` (FR-017, FR-018, FR-020, FR-021)
- [X] **T053** Implementar unicidade de confirmador sobre `confirmarEntrega` — o que o programa não grava — em `src/adapter/escrow.ts` (FR-038, FR-058)
- [X] **T054** Testar as transições de `SituacaoRepasse`, rejeitando as não permitidas, em `tests/adapter/escrow.test.ts` (FR-037 a FR-040)

## Fase 6 — Interface Pública · Onda 1 ✅ concluída em 2026-07-28

- [X] **T055** Implementar `src/app/layout.tsx` com provedor de estado, faixa de demonstração não dispensável e rodapé com restauração de dados (FR-047, FR-048)
- [X] **T056** [P] Implementar componentes transversais — indicador, selo de situação, valor monetário, painel da trava, nota do simulado — em `src/components/dados/` (FR-024, FR-029, FR-031, FR-054)
- [X] **T056b** Implementar a **régua de tolerância** em SVG, elemento assinatura de `design-direction.md`, em `src/components/dominio/regua-tolerancia.tsx` (FR-031, FR-032)
- [X] **T056c** Implementar a **barra de custódia** com as três contas, movimentação animada e marcador de quórum `●○`, em `src/components/dominio/barra-custodia.tsx` (FR-037, FR-038, FR-040)
- [X] **T057** Implementar a landing em `src/app/page.tsx` com as sete seções de `contracts/rotas-e-telas.md` (FR-051, FR-054)
- [X] **T058** Implementar o painel público em `src/app/transparencia/page.tsx` com indicadores, filtros, lista e alertas (FR-023, FR-024, FR-026, FR-029)
- [X] **T059** [P] Implementar o detalhe do repasse em `src/app/transparencia/repasse/page.tsx`, lendo `?id=` (FR-027, FR-032)
- [X] **T060** [P] Implementar a série de preços em `src/app/transparencia/item/page.tsx` com gráfico SVG próprio (FR-028, FR-053)
- [X] **T061** Implementar estados vazios explicativos em toda listagem, incluindo filtro sem resultado (NFR-002)

**Verificado:** 245 asserções verdes, build estático com 9 rotas, `scrollWidth ≤ 360` em
todas elas — medido por iframe, não por captura de tela.

**Rotas de fases seguintes ficaram como andaimes honestos.** `typedRoutes` recusa link para
rota inexistente, o que é proteção útil contra link morto na demonstração. Em vez de
desligar a verificação, `/entrar`, `/explorador` e `/programa` existem com uma tela que diz
o que virá e em qual fase, e oferece caminho de volta. Serão substituídas pelas T062, T071 a
T074 e T077.

**Três defeitos encontrados na verificação visual:**
- Os traços da escala da régua estavam em `regua` puro e sumiam contra a superfície — a
  metáfora de régua se perdia. Traço maior passou a `regua-forte`.
- Os indicadores quebravam a linha entre `R$` e o número. `formatarReais` passou a usar
  espaço inseparável, e a grade caiu de seis para três colunas: valor em mono precisa de
  ~180px, e seis colunas davam 161px.
- As datas do dataset caíam em setembro de 2026, **depois** do Pitch Day. Um histórico que
  termina no futuro entrega a fabricação de graça para quem olhar as datas. `INSTANTE_BASE`
  recuou para 15/12/2025, e a última operação passou a cair em 17/07/2026.

## Fase 7 — Interface Autenticada · Onda 1 ✅ concluída em 2026-07-28

- [X] **T062** Implementar `/entrar` com os quatro cartões de perfil, sem campo de senha e sem marca de terceiros (FR-017, FR-018, FR-019, FR-022)
- [X] **T063** Implementar a guarda em `src/app/plataforma/layout.tsx`, com página explicativa para papel incorreto em vez de redirecionamento silencioso (FR-021)
- [X] **T064** Implementar `/plataforma/gestor` com a lista de propostas e destaque das rejeições (FR-030, FR-036)
- [X] **T065** Implementar `/plataforma/gestor/nova-proposta` com o painel de previsão atualizado a cada digitação (FR-030, FR-031)
- [X] **T066** Implementar o painel de rejeição com o texto exato do `require`, os quatro números da comparação, valor preservado e refeições (FR-032)
- [X] **T067** Implementar validação de quantidade e valor zero na interface, antes do núcleo (FR-030)
- [X] **T067b** Implementar `parsearReais` e `parsearInteiro` em `src/adapter/formato.ts`, com teste de ida e volta contra o formatador (FR-007, FR-030)

**Verificado por interação real, não por captura estática.** O fluxo autenticado não pode
ser conferido com `--screenshot`: é preciso clicar em "Entrar como Helena" para a área do
gestor sequer existir. Montei um driver mínimo do Chrome DevTools Protocol
(`scratchpad/cdp.mjs`) e percorri o caminho completo:

| Passo | Resultado |
|---|---|
| `/entrar` → clicar em Helena | chega em `/plataforma/gestor` |
| Formulário com 40.000 L por R$ 396.000,00 | previsão mostra `+90%` **antes** do envio |
| Enviar | "Compra bloqueada antes do pagamento" |
| Alterar para R$ 230.000,00 e enviar | "Compra aprovada e valor custodiado", `0 de 2` |
| Entrar como Rafael (oráculo) → `/plataforma/gestor` | "Esta área é de gestão municipal" |

`scrollWidth = 360` sem estouro nas sete rotas, medido a 360px reais.

**Onda 1 fechada.** US1 (landing), US2 (acesso por perfil), US3 (a trava) e US4 (painel
público) estão navegáveis.

**Fronteira ética cumprida na `/entrar`:** nenhum campo de senha, e-mail ou CPF; nenhuma
marca de provedor de identidade real. O fluxo pretendido em produção — login social sem
manuseio de chaves — é descrito em texto e deliberadamente **não** imitado em interface.

**Detalhe de tipagem que virou proteção:** `ROTA_DO_PAPEL` precisou de `as const satisfies`.
Com `Record<Papel, string>` os valores perdem o tipo literal e o roteador tipado recusa a
navegação — que é justamente a verificação que impede link para rota inexistente na
demonstração.

## Fase 8 — Oráculo e Explorador · Onda 2 ✅ concluída em 2026-07-28

- [X] **T068** Implementar `/plataforma/oraculo` com reporte de cotação e visão das cotações das demais fontes (FR-033)
- [X] **T069** Implementar o recálculo de referência, desabilitado com explicação abaixo de três cotações (FR-002, FR-033)
- [X] **T070** Implementar o comparativo mediana contra média, com simulação de fonte comprometida (FR-034, FR-053)
- [X] **T071** Implementar `/explorador` com lista sequencial, detalhe expansível e hashes (FR-011, FR-013)
- [X] **T072** Implementar a verificação de integridade com apontamento do primeiro registro inválido (FR-014)
- [X] **T073** Implementar o modo de adulteração, com aviso prévio e restauração (FR-015, FR-048)
- [X] **T074** Escrever a nota de honestidade do explorador — integridade não é descentralização (FR-054)

**Verificado por interação:**

| Passo | Resultado |
|---|---|
| `/explorador` → Verificar integridade | "Cadeia íntegra" |
| Adulterar registro Nº 29 → Verificar | "Cadeia rompida no registro **29**" |
| Restaurar dados → Verificar | "Cadeia íntegra" |
| Entrar como Rafael → `/plataforma/oraculo` | painel carrega, 5 cotações |
| Simular Associação de Produtores a R$ 5.000,00 | média salta a **R$ 1.004,11**, mediana fica em **R$ 5,20** |

`scrollWidth = 360` sem estouro em `/explorador` e `/plataforma/oraculo`.

**A simulação de fonte comprometida é o argumento inteiro em dois números.** Sob média, o
teto de compra subiria de R$ 5,98 para R$ 1.154,72 por litro — liberando exatamente o
superfaturamento que a trava existe para barrar. Sob mediana, o teto não se move. E o painel
declara o limite da proteção: se a **maioria** das fontes agir em conluio, a mediana também
cede, e por isso a autorização precisa exigir diversidade institucional.

**Nota de honestidade do explorador (FR-054):** o encadeamento por hash prova que ninguém
alterou o histórico sem que apareça. Não prova descentralização — um operador único ainda
poderia reescrever a cadeia inteira recalculando todos os hashes, e a verificação voltaria a
passar. O que impede isso em rede real é a replicação entre validadores, que é justamente a
parte simulada aqui.

**Falso alarme na verificação, causado pelo teste.** A primeira execução acusou "íntegra"
após a adulteração. O defeito era do roteiro: injetei o registro `66` no seletor, que só
oferece 11, 17, 23, 29… Com valor inválido o seletor ficou vazio, o botão permaneceu
desabilitado e o clique não fez nada — e o passo seguinte, "Restaurar dados", casou com o
botão do rodapé em vez do botão do explorador. Produto correto, roteiro errado.

## Fase 9 — Conselho, Controle e Programa · Onda 3 ✅ concluída em 2026-07-28

- [X] **T075** Implementar `/plataforma/conselho` com entregas pendentes, confirmação e registro de divergência (FR-035, FR-039, FR-040)
- [X] **T076** Implementar `/plataforma/controle` com alertas, pendências vencidas e divergências abertas (FR-036)
- [X] **T077** Implementar `/programa` com o código Anchor da proposta, o que a migração corrigiu e a tabela de divergências abertas de `research.md` (FR-052, FR-054, FR-055, FR-056)
- [X] **T077b** Implementar o modo de demonstração da falha de quórum, com enquadramento antes e depois de executar (FR-057, FR-058)

**Verificado por interação:**

| Passo | Resultado |
|---|---|
| `/programa` → "Confirmar duas vezes pela mesma parte" | fornecedor sai de R$ 80.373,00 para R$ 90.201,00 |
| Restaurar dados | volta a R$ 80.373,00 |
| Entrar como Cláudia → `/plataforma/conselho` | 7 entregas pendentes, 3 com prazo vencido |
| Confirmar recebimento | marcador vai a `●○ 1 de 2`, valor **não** se move |
| Confirmar de novo, mesmo perfil | recusado: "partes independentes" |
| Entrar como Otávio → `/plataforma/controle` | auditoria carrega |

`scrollWidth = 360` sem estouro nas três telas novas.

**A `/programa` é a peça do critério Risco.** Traz o que a migração de Solidity para Anchor
corrigiu (seis defeitos), as dez divergências abertas classificadas por severidade — cada
uma com o que é, o impacto e a correção proposta para a v0.2 —, o código com realce de
sintaxe escrito à mão, e o caminho para sair da simulação.

Onde a aplicação mitiga uma falha, isso é declarado **junto com o seu limite**: a unicidade
de confirmador e o recálculo a partir das cotações registradas protegem quem passa pela
interface, e ninguém mais. Um chamador que fale direto com a rede continua contornando as
duas — é por isso que a correção pertence ao programa, não a esta camada.

**Defeito encontrado pela verificação:** a demonstração de quórum recalculava o alvo como
"entrega pendente sem confirmação". Assim que o quórum era atingido, a entrega saía do
filtro e a tela perdia justamente o resultado que existe para mostrar — a mensagem de
sucesso nunca aparecia. O alvo passou a ser fixado em estado ao executar.

**Emenda de spec:** a lista do conselho passou a cobrir o município inteiro, com a escola do
perfil em primeiro lugar. O CAE é, pela Lei 11.947/2009, órgão **municipal** cujos membros
fiscalizam as unidades da rede — restringir a uma escola descrevia errado a instituição, e
deixava o painel com uma única pendência.

## Fase 10 — Polimento ✅ concluída em 2026-07-28

- [X] **T078** Executar o `quickstart.md` de ponta a ponta e a lista de verificação pré-publicação de `mock-data.md` (SC-001 a SC-008)
- [X] **T078b** Adicionar favicon em `src/app/icon.svg` e unificar o título de todas as páginas

**Quickstart executado por interação, passo a passo:**

| Critério | Verificação | Resultado |
|---|---|---|
| SC-001 | landing traz R$ 198.010,00 · 94.290 · 9.850 | ✅ |
| SC-002 | filtro Rejeitado devolve 5 repasses | ✅ |
| SC-003 | previsão da trava antes do envio, com `Erro::AcimaDoLimite` | ✅ |
| SC-004 | adulterar Nº 29 → "Cadeia rompida no registro 29" → restaurar → íntegra | ✅ |
| SC-005 | zero recursos fora da origem após o carregamento | ✅ |
| SC-006 | 254 asserções do núcleo verdes | ✅ |
| SC-008 | nenhum nome fictício colide com entidade real | ✅ |
| FR-018/019 | `/entrar` sem nenhum `<input>`, sem menção a gov.br | ✅ |
| FR-021 | oráculo em `/plataforma/gestor` recebe explicação, não redirecionamento | ✅ |
| FR-030 | quantidade zero desabilita o envio com mensagem específica | ✅ |
| NFR-002 | `scrollWidth ≤ 360` em todas as 14 rotas | ✅ |
| NFR-004 | ordem de foco percorrida por Tab, todos com foco visível | ✅ |

**Verificação de nomes (Princípio I), feita em busca pública:** o IBGE registra Cedro (CE),
Cedro (PE) e Cedro do Abaeté (MG) — nenhum "Serra do Cedro". "Vale Norte" não é unidade
federativa. Nenhuma correspondência para os fornecedores fabricados. Os nomes de pessoa são
comuns e não correspondem a figura pública no domínio retratado.

**Três falsos alarmes, todos do roteiro de verificação:**
- `tbody tr` contava as duas tabelas da página; a de repasses tem 5 linhas, a de preços de
  referência tem 10.
- As comparações de moeda falhavam porque `formatarReais` usa espaço **inseparável** de
  propósito. É preciso normalizar `\u00A0` antes de comparar.
- "CPF" e "UNICEF" apareciam na busca de texto de `/entrar`: o primeiro na frase que
  **declara** não haver campo de CPF, o segundo na atribuição do rodapé. Nenhum é
  reprodução de marca.

Os três estão registrados no `quickstart.md` para não voltarem a assustar.

---

## Grafo de Dependências

```
T001 ─→ T002 ─→ T003 ──────────────────┐
  └──→ T004                            │
T005,T006,T007 ─→ Fase 2 (T008–T026)   │
                      │                │
                      ▼                │
        T027 ─→ T032 ─→ T033           │
        T028 ─→ T029,T030,T031         │
                      │                │
                      ▼                │
                    T034               │
                      │                │
                      ▼                │
   T035…T041 [P] ─→ T042 ─→ T043,T044  │
                      │                │
                      ▼                │
   T045 ─→ T046 ─→ T047,T048           │
     └──→ T049,T050,T051 [P]           │
     └──→ T052 ─→ T053 ─→ T054         │
                      │                │
                      ▼                ▼
                    T055 ─→ T056 ─→ T057,T058,T062,T063
                                        │
                                        ▼
                              T059,T060,T061,T064…T067
                                        │
                                        ▼
                              Fase 8 ─→ Fase 9 ─→ T078
```

## Lotes Paralelos

| Lote | Tarefas | Pré-requisito |
|---|---|---|
| A | T005, T006, T007 | T001 |
| B | T008 – T026 | Lote A |
| C | T035 – T041 | T034 |
| D | T049, T050, T051 | T045 |
| E | T059, T060, T061 | T058 |
| F | T068 – T074 | Onda 1 concluída |

## Critérios de Pronto

- [X] Todo `FR-001` a `FR-058` tem ao menos uma tarefa
- [X] Todo `NFR-001` a `NFR-008` tem verificação em T078
- [X] Suíte de testes verde
- [X] Checagem Constitucional revalidada em `plan.md`
- [X] `quickstart.md` executado de ponta a ponta
- [X] Lista de verificação pré-publicação de `mock-data.md` concluída

## Cobertura de Requisitos

| Faixa | Tarefas |
|---|---|
| FR-001 a FR-010 — núcleo | T009, T010, T013–T021, T027–T031b, T034 |
| FR-011 a FR-016 — registro | T008, T022–T026, T032, T033, T071–T073 |
| FR-017 a FR-022 — acesso | T039, T052, T062, T063 |
| FR-023 a FR-029 — painel | T050, T051, T056, T058, T059, T060 |
| FR-030 a FR-036 — perfis | T064–T070, T075, T076 |
| FR-037 a FR-042 — custódia em BRZ | T031, T031b, T053, T054, T056c, T057, T059 |
| FR-043, FR-044 — divergência e prazo | T075, T076 |
| FR-045 a FR-050 — dados e ambiente | T035–T048, T055, T078 |
| FR-051 a FR-054 — comunicação | T057, T060, T070, T074, T077 |
| FR-055 a FR-058 — auditoria do programa | T077, T077b |
| NFR-001 a NFR-006, NFR-008 | T001–T004, T034, T078 |
| NFR-007 — interface em pt-BR | T057 a T077b; verificado em T078 |
