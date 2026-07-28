# Pesquisa — Fase 0

**Funcionalidade:** 001-repasse-transparente
**Data:** 2026-07-28

Cada entrada registra o que foi decidido, por quê, e o que foi descartado.

---

## 1. Auditoria do programa `repasse_transparente` (Anchor/Rust)

**Referência normativa:** `RepasseTransparente_Proposta.docx`, seção 5 — programa Anchor
para a rede Solana, com custódia em BRZ. Substitui o `RepasseTransparente.sol` do PDF
anterior, que fica como registro histórico.

O programa foi auditado antes de ser transliterado. As divergências **não são corrigidas**
no núcleo (Princípio II); são documentadas aqui, expostas na página `/contrato` e propostas
para a v0.2.

Esta auditoria alimenta o critério **Risco** da banca: reconhecer as limitações do próprio
artefato vale mais do que apresentá-lo como pronto. O próprio documento já adota esse tom
ao afirmar que a mitigação do problema do oráculo "não é completa".

### O que a versão Solana corrigiu

Seis defeitos da versão Solidity deixaram de existir. Registrado porque a evolução entre as
duas versões é, ela própria, argumento de maturidade técnica.

| Antes (Solidity) | Agora (Anchor) |
|---|---|
| Nenhuma função autorizava fontes; o contrato era inoperante | `autorizar_fonte` existe |
| Escrow prometido na matriz de riscos e ausente do código | Custódia em PDA, com liberação por quórum |
| `emit RepasseAprovado(1, ...)` — identificador fixo | `repasse.key()` — identificador real |
| Repasse não persistia; só havia evento | Conta `repasse` com fornecedor, valor, quantidade, estado |
| Bubble sort quadrático | `ordenado.sort()` nativo |
| Divisão por zero causava panic sem mensagem | `checked_div(...).ok_or(Erro::QuantidadeInvalida)?` |

### Divergências críticas

**CRIT-01 — `atualizar_preco_referencia` continua ignorando as cotações registradas.**
A função recebe `precos: Vec<u64>` por parâmetro e calcula a mediana sobre esse vetor.
`reportar_preco` grava cada cotação em uma conta `cotacao` própria — e
`atualizar_preco_referencia` **nunca as lê**. Quem chama informa o vetor que quiser.

Toda a arquitetura de oráculos da seção 4 é contornável por esse caminho. É a mesma falha
da versão Solidity, sobrevivendo à migração.

*Proposta v0.2:* iterar as contas `cotacao` das fontes autorizadas via `remaining_accounts`,
filtrar por frescor, e calcular a mediana sobre esse conjunto — sem parâmetro externo.
*Tratamento na simulação:* assinatura mantida idêntica; a camada adaptadora sempre alimenta
o vetor a partir das cotações efetivamente registradas.

**CRIT-02 — O quórum de entrega é burlável por uma única carteira.**
`confirmar_entrega` faz `repasse.confirmacoes += 1` **sem registrar quem confirmou**. A
mesma carteira chama a instrução duas vezes, `confirmacoes` atinge
`CONFIRMACOES_NECESSARIAS`, e o BRZ é liberado ao fornecedor.

Isso anula exatamente a mitigação que a Tabela 4 promete para o risco de "registro de
entrega fictícia" — a confirmação "por múltiplas partes independentes na ponta". Na prática,
uma parte basta.

*Proposta v0.2:* uma conta `Confirmacao` derivada de `(repasse, confirmador)`, cuja
inicialização falha na segunda tentativa do mesmo signatário; e uma lista de confirmadores
elegíveis por escola.
*Tratamento na simulação:* o núcleo replica a falha. A camada adaptadora impede a repetição,
e existe um modo de demonstração que permite exibi-la — ver a decisão 13.

**CRIT-03 — Não há prazo nem caminho de reembolso. O dinheiro pode ficar preso.**
`propor_repasse` transfere o BRZ da conta da prefeitura para a PDA de custódia. A única
saída é `confirmar_entrega` atingindo o quórum. Se as confirmações nunca vierem — fornecedor
desaparece, conselho não se reúne, escola fecha — **o valor fica permanentemente
imobilizado**, sob controle de um programa que não tem instrução para devolvê-lo.

Um sistema criado para proteger verba escolar não pode ter um estado terminal em que a
verba evapora. É o defeito mais grave da versão Solana, e foi introduzido justamente pelo
escrow.

*Proposta v0.2:* `cancelar_repasse`, restrita à prefeitura, habilitada após um prazo
gravado na conta do repasse, devolvendo o BRZ à origem e registrando o motivo.
*Tratamento na simulação:* o núcleo não tem devolução. A interface destaca a pendência
vencida (FR-040) e nomeia a consequência.

### Divergências altas

**ALTA-01 — Sem verificação de frescor.** `atualizado_em` recebe `Clock::get()?` e nunca é
lido. Uma mediana de meses atrás é aceita como referência válida, o que anula a proteção em
cenário inflacionário. *Proposta v0.2:* rejeitar referência mais velha que uma janela de
validade por categoria de item.

**ALTA-02 — `confirmar_entrega` não emite evento.** A observação (iii) do próprio documento
afirma que "toda alteração de estado emite um evento indexável, permitindo a construção de
um painel público sem acesso privilegiado ao nó da rede". A instrução que **libera o
dinheiro** é a única que não emite nada. Um painel público construído apenas a partir de
eventos jamais saberia que o valor foi pago — que é precisamente o fato mais relevante para
quem audita. Contradição entre o texto e o código.

### Divergências médias

**MED-01 — Mediana de conjunto par.** `ordenado[ordenado.len() / 2]` usa divisão inteira e
devolve o elemento central **superior**, não a média dos dois centrais. Para
`[400, 500, 600, 700]` o programa devolve `600`, enquanto a mediana estatística é `550`.
Enviesa a referência para cima, favorecendo o fornecedor. Idêntico ao Solidity — a migração
não mudou nada aqui. *Preservado no núcleo e exibido na interface quando o conjunto for par.*

**MED-02 — Cotação zero é aceita.** Nenhum `require!` impede `reportar_preco(ctx, 0)`. Uma
fonte comprometida pode puxar a mediana para baixo e causar rejeição de compras legítimas —
negação de serviço orçamentária.

**MED-03 — Divisão inteira no preço unitário.** `checked_div` trunca. `R$ 1.000,00` para
`3` unidades resulta em `R$ 3,33` por unidade em vez de `R$ 3,3333`, subestimando
marginalmente o preço efetivo. Explorável apenas em margens desprezíveis, mas existe.

**MED-04 — `declare_id!` não é uma chave pública válida.** `"RepTransp1111..."` tem 40
caracteres; uma pubkey Solana em base58 tem 43 ou 44. É placeholder e não compila como está.
Sem impacto conceitual, mas a banca técnica vai notar.

**MED-05 — Sem controle explícito de quem propõe.** O documento não mostra as structs de
`Context`, então as constraints de conta ficam indeterminadas. Se `ProporRepasse` não
exigir que `prefeitura` seja signatária e autoridade da conta de origem, qualquer um propõe.
Provavelmente resolvido pelas constraints omitidas; registrado por não ser verificável a
partir do trecho publicado.

**Decisão:** transliterar tudo, inclusive os defeitos, e transformar a auditoria em conteúdo
da página `/contrato`. Alternativa descartada: implementar a versão corrigida e apresentá-la
como se fosse a da proposta — descartada porque a demonstração passaria a mentir sobre o
que foi especificado, e a banca que ler o documento notaria a discrepância.

---

## 2. Mediana em vez de média — a defesa quantitativa

**Decisão:** manter a mediana e demonstrar numericamente a diferença na interface.

Com cotações honestas `[498, 520, 545]`, mediana e média são próximas (`520` e `521`).
Introduzindo uma fonte comprometida que reporta `5000`, o conjunto vira
`[498, 520, 545, 5000]`: a média salta para `1640`, elevando o limite de tolerância para
`1886` e liberando praticamente qualquer superfaturamento. A mediana pela regra do contrato
vai para `545` — limite de `626`.

Uma única fonte corrompida em quatro multiplica o teto por três sob média aritmética, e o
move 4,8% sob mediana.

**Alternativas descartadas:** média aparada — mais robusta que a média simples, mas exige
mais fontes para ser significativa e é mais difícil de explicar a um avaliador
não-técnico. Média ponderada por reputação — introduz a questão de quem define reputação,
que é exatamente o poder que o projeto quer remover de um ator único.

---

## 3. Simulação da cadeia — encadeamento por hash

**Decisão:** registro somente-anexação em que cada entrada carrega
`hash = SHA-256(numero ‖ horario ‖ tipo ‖ autor ‖ dados ‖ hashAnterior)`, com verificação
que recalcula a cadeia inteira, e um modo de demonstração que adultera um registro para
evidenciar a detecção.

**Justificativa:** é o que torna verificável a alegação da seção 3 do PDF — "alterações
retroativas são matematicamente impossíveis". Sem isso, a simulação seria apenas uma lista
de eventos, indistinguível de um banco de dados, e a pergunta "por que não SQL?" ficaria
sem resposta demonstrável. Com isso, o avaliador pode ele mesmo tentar adulterar e ver a
detecção acontecer.

**Nota de honestidade:** encadeamento por hash prova **integridade**, não
**descentralização**. Um operador único ainda pode reescrever a cadeia inteira
recalculando todos os hashes. O que impede isso em blockchain real é a replicação entre nós
com interesses conflitantes. A interface declara essa distinção em vez de ocultá-la.

**Alternativas descartadas:** merkle tree — mais sofisticada, mas o ganho de prova de
inclusão não tem uso nesta demonstração e o custo de explicação é alto. Assinatura
digital por perfil — adicionaria autenticidade além de integridade, mas exigiria gestão de
chaves, que o Princípio V mantém fora de escopo.

**Implementação do SHA-256:** função síncrona pura vendorizada em `src/core/`, em vez de
`crypto.subtle`. A API nativa é assíncrona, o que contaminaria todo o núcleo com `Promise`
e impediria que ele permanecesse puro e sincronamente testável. Custo: cerca de cem linhas
vendorizadas. Sem dependência externa em nenhum dos casos.

---

## 4. Aritmética monetária

**Decisão:** `bigint` em centavos em todo o sistema. Conversão para texto apenas na
formatação final.

**Justificativa:** o contrato usa `uint256`. Reproduzir com `number` introduziria erro de
ponto flutuante justamente nas comparações que decidem aprovação e rejeição — o coração da
tese. Com `bigint`, a divisão já é truncada por padrão, o que replica gratuitamente o
comportamento do Solidity.

**Alternativa descartada:** biblioteca de decimal. Adiciona dependência e se afasta da
semântica de inteiro do contrato.

---

## 5. Stack

**Decisão:** Next.js (App Router) com `output: 'export'`, TypeScript strict, Tailwind CSS,
shadcn/ui, Vitest.

**Justificativa:** exportação estática satisfaz a restrição de custo zero e de ausência de
backend, e permite hospedar em Vercel, Cloudflare Pages, Netlify ou GitHub Pages sem
alteração. shadcn/ui entrega componentes acessíveis por padrão, copiados para o
repositório em vez de instalados — o que reduz superfície de dependência. Vitest cobre o
núcleo, que é TypeScript puro e não precisa de DOM.

**Consequência de projeto:** exportação estática não suporta segmento dinâmico para
entidades criadas em tempo de execução. Um repasse proposto pelo avaliador não teria página
pré-gerada em `/transparencia/repasse/[id]`. **Portanto, o detalhe de entidades usa
parâmetro de consulta** — `/transparencia/repasse?id=...` — resolvido no cliente.

**Alternativas descartadas:** SSR na Vercel — funcionaria e removeria a restrição de rota
dinâmica, mas introduz runtime de servidor e prende o projeto a um provedor. Vite + React —
igualmente válido e mais leve; descartado por preferência de ecossistema, não por
limitação técnica.

---

## 6. Estado e persistência

**Decisão:** estado em React Context com reducer, espelhado em `localStorage` sob uma
chave versionada. Sem biblioteca de gerenciamento de estado.

**Justificativa:** o volume de estado é pequeno e as mutações são poucas e bem definidas.
A persistência local atende ao FR-049 — o avaliador que propõe um repasse e recarrega a
página não perde o que fez.

**Migração de esquema:** a chave carrega versão. Estado de versão anterior é descartado com
aviso ao usuário e substituído pelos dados semeados, em vez de tentar migrar.

**Alternativa descartada:** zustand. Bom, mas é uma dependência para um problema que
`useReducer` resolve neste tamanho.

---

## 7. Gráficos

**Decisão:** SVG próprio para as duas visualizações necessárias — a série temporal de
cotações contra mediana e limite, e a barra comparativa de mediana contra média.

**Justificativa:** são duas visualizações de forma conhecida e dados pequenos. Uma
biblioteca de gráficos custa entre 50KB e 200KB no bundle para resolver problemas de
generalidade que não temos, e complica a garantia de contraste e de rotulagem textual
exigida pelo NFR-003 e pelo FR-029.

**Alternativa descartada:** Recharts. Seria mais rápido de escrever e não viola a
restrição de rede, mas o peso não se justifica para dois gráficos.

---

## 8. Tipografia e ícones

**Decisão:** duas vozes, ambas do sistema operacional — pilha sans para o texto e pilha
**mono para todo número conferível**. Ícones via `lucide-react`.

**Justificativa:** o Princípio III proíbe requisição de rede em runtime, o que exclui
Google Fonts e qualquer CDN de ícones. A oposição sans/mono não é economia disfarçada de
decisão: é o que uma ficha de conferência faz, alinhando colunas de número na vertical para
que o olho compare sem esforço. Detalhamento em `design-direction.md`.

**Sobre os ícones:** `lucide-react` é compilado no bundle e submetido a *tree-shaking*; não
há requisição em runtime, e portanto o Princípio III é respeitado. Emenda à redação
original desta decisão, que pedia SVG copiado à mão no repositório — o resultado é o mesmo
e a manutenção é melhor.

**Alternativa descartada:** auto-hospedar uma fonte variável via `next/font/local`.
Legítimo e compatível com a restrição; descartado por adicionar cerca de 100KB para ganho
estético marginal em um protótipo de prazo curto. Pode ser revisto após o Pitch Day.

---

## 9. Hospedagem e entrega

**Decisão:** Vercel no plano Hobby, com implantação automática a partir do repositório
Git. Como a saída é estática, migrar para Cloudflare Pages, Netlify ou GitHub Pages não
exige alteração de código.

**Justificativa:** custo zero, sem cadastro de meio de pagamento, HTTPS automático, URL
estável para colocar no material de submissão.

**Risco identificado:** URL de projeto gratuito muda se o projeto for renomeado. Fixar o
nome antes de divulgar o link à banca.

---

## 10. Fronteira ética do login simulado

**Decisão:** acesso por seleção de perfil, com identidades fictícias nomeadas, sem campo de
senha e sem qualquer marca de provedor real.

**Justificativa:** o pedido é que pareça o site real. A tensão é que uma tela de login
convincente que reproduza a identidade visual do gov.br é funcionalmente um kit de
phishing, ainda que sem intenção — e o projeto é avaliado pelo UNICEF. A saída é encenar o
produto com estética própria e profissional, deixando explícito que é demonstração.

O PDF menciona "Web3Auth/Social Login" como intenção de produto. Isso é representado por
uma explicação textual do fluxo pretendido, não pela imitação da tela de um provedor.

**Alternativa descartada:** formulário de e-mail e senha com credenciais de demonstração
pré-preenchidas. Mais realista, mas cria um campo de senha funcional em um site público —
risco desnecessário para ganho estético.

---

## 11. Fabricação dos dados

**Decisão:** município, escolas, fornecedores, conselheiros e gestores inteiramente
fictícios, com nomes que não colidem com entidades reais conhecidas. Instituições reais
aparecem somente em texto descritivo da arquitetura pretendida.

**Justificativa:** Princípio I. Um protótipo sobre integridade pública que exibe um
município real associado a superfaturamento fictício é um problema jurídico e reputacional,
e destrói a credibilidade da própria proposta.

**Verificação exigida:** antes da publicação, conferir que os nomes fabricados de município
e de empresas não correspondem a entidades reais existentes.

---

## 12. Escala tipográfica fluida — descoberta da Fase 1

**Decisão:** os quatro tamanhos de exibição (`lg`, `xl`, `2xl`, `3xl`) usam `clamp()`.
Tamanhos de leitura permanecem fixos.

**Justificativa:** medido, não estimado. Com `--text-xl` fixo em `2.25rem`, o
`scrollWidth` do documento em viewport de 360px é **434px** contra `innerWidth` de 360 —
estouro real, violando a NFR-002. A causa é `RepasseTransparente`: dezoito caracteres sem
ponto de quebra natural, que forçam a largura mínima do bloco. Com a escala fluida, o
`scrollWidth` cai para **345px**.

**Consequência:** `overflow-x: hidden` foi **removido** do `body`. Esconder o estouro
satisfaz a NFR-002 na letra e mascara o defeito — o conteúdo continua mais largo que a
viewport, só que cortado e ilegível. O layout tem de caber de verdade.

**Armadilha de verificação registrada:** o Chrome headless **fixa a viewport em 500px no
mínimo**; `--window-size=360` renderiza a 500 e recorta a captura para 360, produzindo uma
imagem que parece estourada quando não está — e escondendo estouros reais quando existem.
Medir a 360px exige um `<iframe width="360">` dentro de uma página mais larga, lendo
`contentDocument.documentElement.scrollWidth`. O roteiro está no `quickstart.md`.

---

---

## 13. BRZ como unidade de liquidação — o registro e o pagamento são a mesma operação

**Decisão:** simular saldos em BRZ e mover valor de verdade entre três contas —
prefeitura → custódia → fornecedor — em vez de apenas marcar o repasse como aprovado.

**Justificativa:** é a mudança conceitual mais forte da versão Solana, e a que mais separa
a proposta de um portal de transparência comum. Em um sistema convencional, o registro
contábil e o movimento financeiro são artefatos distintos: alguém lança no sistema e alguém
paga no banco, e a fraude vive na diferença entre os dois. Com liquidação em stablecoin, o
lançamento **é** o pagamento — não existe a diferença onde a fraude se aloja.

Marcar "aprovado" sem mover valor jogaria fora exatamente esse argumento. A demonstração
precisa mostrar o saldo da prefeitura caindo, o saldo da custódia subindo, e o fornecedor
recebendo apenas depois do quórum.

**Ordem preservada do programa:** a transferência acontece **depois** da trava. Uma proposta
rejeitada não move um centavo. Isso importa para a demonstração: o avaliador vê os saldos
intactos após uma rejeição.

**Sobre o Drex:** a proposta justifica não depender dele — lançamento adiado para 2026, com
escopo interbancário e sem acesso público. A interface reproduz esse raciocínio na página do
programa, porque "por que não o Drex?" é pergunta provável de banca brasileira.

**Alternativa descartada:** representar valores apenas como números de um relatório, sem
contas nem saldos. Mais simples de implementar e conceitualmente mais pobre — reintroduz
justamente a separação entre registro e pagamento que a proposta elimina.

---

## 14. Demonstração da falha de quórum

**Decisão:** o núcleo replica a falha CRIT-02 fielmente — `confirmarEntrega` incrementa o
contador sem registrar quem confirmou. A camada adaptadora impede a repetição em uso normal,
e existe um modo de demonstração explícito que a exibe.

**Justificativa:** é o mesmo padrão já usado para a adulteração da cadeia (FR-015), e pelo
mesmo motivo. Uma falha que o avaliador **reproduz com as próprias mãos** convence de um
jeito que um parágrafo de texto não convence. E o efeito sobre a banca é o oposto do que a
intuição sugere: demonstrar que a equipe encontrou, entendeu e sabe corrigir um defeito do
próprio programa pontua no critério Risco, enquanto esconder o defeito só adia a descoberta
para o momento em que alguém da banca ler o código.

**Enquadramento obrigatório na interface:** a demonstração precisa deixar explícito que é
falha conhecida, com correção proposta para a v0.2, e não comportamento pretendido. Sem esse
enquadramento, a demonstração vira propaganda contra o próprio projeto.

**Alternativa descartada:** corrigir silenciosamente no núcleo e não mencionar. Viola o
Princípio II e faz a simulação divergir do programa que a proposta publica.
