# Contrato de Interface — Rotas e Telas

Cada rota declara: acesso exigido, história de usuário atendida, requisitos, conteúdo
mínimo e estados vazios.

**Restrição estrutural:** exportação estática não gera páginas para entidades criadas em
runtime. Detalhes de entidade usam **parâmetro de consulta**, resolvido no cliente. Nenhum
segmento dinâmico `[id]` no roteador.

---

## Públicas

### `/` — Landing

**Acesso:** aberto · **História:** US1 · **Requisitos:** FR-047, FR-051, FR-054

| Seção | Conteúdo mínimo |
|---|---|
| Topo | Nome, uma frase do que o sistema faz, dois caminhos de acesso rotulados: painel público e entrar na plataforma |
| Impacto | Três números do caso demonstrado: valor bloqueado, refeições preservadas, alunos alcançados |
| Problema | O que acontece hoje: auditoria posterior, insumo subpadronizado, opacidade — seção 2 do PDF |
| Como funciona | Três passos: fontes reportam preço → mediana forma a referência → trava bloqueia acima da tolerância |
| Por que blockchain | Comparação com banco centralizado, seção 3 do PDF, em linguagem acessível |
| Atores | Os quatro papéis e o que cada um faz |
| Honestidade | Declaração de que a execução é simulada e o que faltaria para operar em rede real |

Deve ser compreensível em 60 segundos, em 360px, sem mais de três telas de rolagem
(SC-001).

### `/entrar` — Acesso

**Acesso:** aberto · **História:** US2 · **Requisitos:** FR-017, FR-018, FR-019, FR-022

Quatro cartões de perfil. Ver `acesso-simulado.md` para o que é proibido.

### `/transparencia` — Painel Público

**Acesso:** aberto · **História:** US4 · **Requisitos:** FR-023 a FR-029

| Bloco | Conteúdo |
|---|---|
| Indicadores | Proposto, aprovado, bloqueado, refeições preservadas, escolas, alunos. Cada valor monetário acompanhado da tradução em impacto |
| Filtros | Situação, item, período. Recalculam os indicadores (FR-026) |
| Lista de repasses | Item, fornecedor, escola, quantidade, valor, situação, data. Situação com ícone e rótulo (FR-029) |
| Alertas | Rejeições recentes em destaque, com sobrepreço percentual |
| Preços de referência | Por item: mediana vigente, limite, número de fontes, última atualização |

**Estado vazio de filtro:** informa que nenhum repasse corresponde ao recorte e oferece
limpar os filtros. Nunca uma tabela vazia sem explicação.

### `/transparencia/repasse?id=` — Detalhe do Repasse

**Acesso:** aberto · **História:** US4 · **Requisitos:** FR-027, FR-032

Dados da proposta; painel da decisão com preço proposto, mediana aplicada, limite e
diferença percentual; **barra de custódia** com os saldos das três contas e o marcador de
quórum; as cotações que formaram a mediana, com a fonte de cada uma; histórico de registros
da cadeia; e, quando rejeitado, valor preservado, refeições equivalentes e a declaração de
que nenhum BRZ saiu da conta da prefeitura (FR-039, FR-040).

**`id` ausente ou inexistente:** mensagem de repasse não encontrado com retorno ao painel.

### `/transparencia/item?id=` — Série de Preços

**Acesso:** aberto · **História:** US4 · **Requisitos:** FR-028, FR-053

Série temporal em SVG com cotações por fonte, mediana e faixa de tolerância; tabela das
cotações vigentes com destaque para discrepantes; comparação numérica entre mediana e média
aritmética, com a explicação de por que a mediana é usada.

### `/explorador` — Registros

**Acesso:** aberto · **História:** US6 · **Requisitos:** FR-011 a FR-016

| Elemento | Comportamento |
|---|---|
| Lista sequencial | Número, horário, tipo, autor, resumo legível, hash abreviado, indicador de sucesso ou falha |
| Detalhe | Expansão com dados completos, hash anterior e hash próprio |
| Verificar integridade | Recalcula a cadeia e informa o resultado; se quebrada, aponta o registro e mostra hash esperado contra obtido |
| Demonstrar adulteração | Permite alterar um registro gravado; a interface avisa o que vai acontecer antes de executar |
| Restaurar | Desfaz a adulteração e volta ao estado semeado (FR-048) |
| Nota de honestidade | Explica que encadeamento por hash prova integridade, e que descentralização exigiria replicação entre nós independentes |

Registros de falha aparecem com a mesma proeminência dos de sucesso — a tentativa
bloqueada é o produto (FR-013).

### `/programa` — Programa e Auditoria

**Acesso:** aberto · **História:** US8 · **Requisitos:** FR-052, FR-054, FR-055, FR-056,
FR-057, FR-058

| Bloco | Conteúdo |
|---|---|
| Código | Programa Anchor/Rust da proposta, com realce |
| O que a migração corrigiu | Os seis defeitos que a versão Solidity tinha e a versão Solana não tem (FR-056) |
| Divergências abertas | Tabela do `research.md` por severidade: o que é, o impacto, a correção proposta para a v0.2 (FR-055) |
| Demonstrar a falha de quórum | O visitante confirma a mesma entrega duas vezes pela mesma parte e vê o valor ser liberado (FR-057) |
| Caminho para a rede real | O que faltaria para operar na Solana |

**Enquadramento obrigatório da demonstração (FR-058):** antes e depois de executar, a tela
declara que é falha conhecida com correção proposta, e não comportamento pretendido. Sem
esse enquadramento, a demonstração vira propaganda contra o próprio projeto.

Esta página existe para o critério **Risco**. Reconhecer, entender e saber corrigir um
defeito do próprio programa pontua; esconder o defeito só adia a descoberta para o momento
em que alguém da banca ler o código.

---

## Autenticadas — `/plataforma/*`

Todas exigem sessão e passam pela guarda descrita em `acesso-simulado.md`.

### `/plataforma/gestor`

**Papel:** gestor · **História:** US3 · **Requisitos:** FR-030, FR-036

Lista das propostas do gestor com situação, atalho para nova proposta, e destaque das
rejeições recentes com o motivo.

### `/plataforma/gestor/nova-proposta`

**Papel:** gestor · **História:** US3 · **Requisitos:** FR-030, FR-031, FR-032

Formulário com item, fornecedor, escola, quantidade e valor total.

**Painel de previsão, atualizado a cada digitação** — é o coração da demonstração:

| Campo exibido | Origem |
|---|---|
| Preço unitário efetivo | `valorTotal / quantidade`, divisão inteira |
| Mediana vigente | `tabelaPrecos[itemId].precoMediana` |
| Tolerância | `toleranciaPercentual` |
| Limite máximo | `calcularLimite(mediana, tolerancia)` |
| Diferença percentual | `(efetivo − mediana) × 100 / mediana` |
| Situação prevista | Aprovado ou bloqueado, **antes** do envio |

Ao enviar:

- **Aprovado:** confirmação, e a **barra de custódia anima o valor saindo da prefeitura
  para a custódia**, com explicação de que o pagamento ao fornecedor aguarda duas
  confirmações de entrega
- **Bloqueado:** painel de rejeição com o identificador `Erro::AcimaDoLimite` do programa,
  a explicação em português claro, os quatro números da comparação, o valor preservado, as
  refeições equivalentes — e a barra de custódia **parada**, evidenciando que nenhum BRZ se
  moveu (FR-039)

**Validação de entrada:** quantidade zero e valor zero são barrados pela interface antes de
chegar ao núcleo, com mensagem específica. O núcleo preserva `Erro::QuantidadeInvalida`,
mas o usuário recebe orientação em vez de um identificador cru.

### `/plataforma/oraculo`

**Papel:** oraculo · **História:** US5 · **Requisitos:** FR-033, FR-034

Formulário de cotação por item; cotações vigentes de todas as fontes com categoria de cada
uma; ação de recalcular a referência, desabilitada com explicação quando há menos de três
cotações; e o comparativo mediana contra média, com simulação do efeito de uma fonte
comprometida.

### `/plataforma/conselho`

**Papel:** conselho · **História:** US7 · **Requisitos:** FR-035, FR-040

Entregas pendentes da escola do perfil, com prazo e destaque para vencidas; confirmação de
recebimento; e registro de divergência com descrição obrigatória.

A leitura de QR Code em nota fiscal, mencionada na seção 6 do PDF, é representada por uma
área explicativa do fluxo pretendido — não implementada (fora de escopo).

### `/plataforma/controle`

**Papel:** controle · **História:** US4 · **Requisitos:** FR-036

Todos os alertas de rejeição com sobrepreço; pendências de entrega vencidas; divergências
abertas; e indicadores consolidados do município.

---

## Componentes Transversais

| Componente | Responsabilidade | Requisito |
|---|---|---|
| Faixa de demonstração | Presente em toda rota, não dispensável | FR-047 |
| Indicador | Número grande, rótulo, e tradução de impacto quando monetário | FR-024, FR-025 |
| Selo de situação | Cor + ícone + texto, nunca só cor | FR-029 |
| Painel da trava | Comparação proposta contra limite, reutilizado na previsão, na rejeição e no detalhe | FR-031, FR-032 |
| Régua de tolerância | Elemento assinatura: escala medida onde a proposta ultrapassa o limite | FR-031, FR-032 |
| Barra de custódia | Elemento companheiro: saldos das três contas, movimentação e marcador de quórum | FR-037, FR-038, FR-040 |
| Valor monetário | Formatação pt-BR a partir de `bigint`; nunca aritmética na apresentação | FR-007 |
| Nota do simulado | Explica que a execução não ocorre em blockchain | FR-054 |
| Restaurar dados | Acessível do rodapé em qualquer página | FR-048 |

## Requisitos Transversais de Interface

- Nenhuma rolagem horizontal do corpo entre 360px e 2560px (NFR-002)
- Contraste mínimo 4,5:1 (NFR-003)
- Operável apenas por teclado, com foco visível (NFR-004)
- Toda tela tem estado vazio explicativo, nunca uma área em branco
- Jargão técnico sempre acompanhado de tradução, ou confinado ao explorador (Princípio IV)
