# Especificação de Funcionalidade: RepasseTransparente — Protótipo Navegável

**Branch:** `001-repasse-transparente`
**Criada em:** 2026-07-28
**Status:** Pronta para planejamento
**Entrada:** "prototipar a ideia com dados mock; nível simulado; landing page com autenticação fake, pensando que seria de fato o site real"
**Origem:** `RepasseTransparente_Proposta.docx` — proposta submetida ao UNICEF Youth Challenge Blockchain 2026
**Supera:** `proposta_repasse_transparente.pdf` (versão Ethereum/Solidity), mantido como registro histórico

---

## Contexto

O RepasseTransparente é uma infraestrutura de auditoria preventiva de verbas públicas
destinadas à alimentação escolar (PNAE) e à infraestrutura escolar (Fundeb). Em vez de
auditar o desvio anos depois, o sistema **bloqueia o repasse antes do desembolso** quando o
preço proposto excede a mediana de cotações reportadas por fontes independentes além de uma
tolerância configurável.

Esta funcionalidade entrega o **protótipo navegável** dessa infraestrutura: um site público
que a banca avaliadora acessa por link, opera sozinha e entende sem explicação prévia.

A liquidação ocorre em **BRZ**, stablecoin pareada 1:1 ao Real: o valor sai da conta da
prefeitura e fica custodiado até que a entrega física seja confirmada. Registro contábil e
movimento financeiro passam a ser a mesma operação — não existe a diferença entre os dois
onde a fraude costuma se alojar.

A lógica do programa inteligente é **simulada em software**, não executada na rede Solana.
Essa é uma decisão consciente de escopo, não uma limitação escondida: o produto declara
essa condição ao usuário e demonstra a mecânica com fidelidade ao código Anchor da
proposta.

---

## Esclarecimentos

### Sessão 2026-07-28

- **P: Blockchain real ou simulada?** → Simulada em software. Sem RPC, sem carteira, sem
  testnet. A cadeia de registros é reproduzida localmente com encadeamento por hash.
- **P: Como a banca acessa?** → Site estático em hospedagem gratuita, acessível por URL
  pública, sem instalação e sem cadastro para a parte pública.
- **P: Autenticação real?** → Não. Seleção de perfil de demonstração, encenando um login de
  produto real, sem coleta de credencial e sem imitar identidade visual de provedor real.
- **P: Dados reais de algum município?** → Não. Todo o dataset é fictício.

### Sessão 2026-07-28 — migração para Solana

A proposta foi reescrita: `RepasseTransparente_Proposta.docx` substitui o PDF anterior.

- **P: Qual programa é a referência normativa?** → O programa Anchor/Rust
  `repasse_transparente`, seção 5 do `.docx`. O `RepasseTransparente.sol` fica como registro
  histórico.
- **P: A aritmética mudou?** → Não. Mediana por `ordenado[len / 2]`, limite por
  `ref + ref * 15 / 100`, fronteira `<=`, mínimo de três fontes — tudo idêntico. Todos os
  números do dataset permanecem válidos.
- **P: O escrow ainda é extensão da simulação?** → Não. Passou a fazer parte do programa,
  com custódia em PDA e quórum de duas confirmações.
- **P: O que fazer com as falhas encontradas na auditoria do novo programa?** → Preservá-las
  no núcleo e expô-las na página do programa, como já se faz com as demais (Princípio II).

---

## Cenários de Usuário e Testes

### História 1 — A banca entende a proposta em 60 segundos (Prioridade: P1)

Um avaliador do ideathon abre o link no celular, sem contexto prévio, e precisa entender o
problema, a solução e o impacto antes de decidir se explora mais.

**Por que esta prioridade:** é a porta de entrada. Se a primeira tela não convencer, o
resto do protótipo não será visto.

**Teste independente:** abrir a raiz do site em uma janela anônima, em viewport de 360px, e
verificar se problema, solução, números de impacto e caminhos de acesso estão
compreensíveis sem rolar mais de três telas.

**Cenários de aceitação:**

1. **Dado** um visitante que nunca ouviu falar do projeto, **quando** ele abre a página
   inicial, **então** vê o nome do projeto, uma frase que explica o que ele faz, e os três
   números de impacto do caso demonstrado.
2. **Dado** um visitante na página inicial, **quando** ele procura acessar o sistema,
   **então** encontra dois caminhos distintos e rotulados: consultar o painel público sem
   login, ou entrar na plataforma escolhendo um perfil.
3. **Dado** um visitante em qualquer página, **quando** a página carrega, **então** um
   indicador persistente informa que se trata de ambiente de demonstração com dados
   fictícios.
4. **Dado** um visitante sem conexão de rede, **quando** ele navega pelo site já carregado,
   **então** todas as telas continuam funcionais.

---

### História 2 — Acesso por perfil simulado (Prioridade: P1)

O visitante escolhe um dos quatro papéis do ecossistema e passa a ver a plataforma pelos
olhos daquele ator, como faria em um produto real.

**Por que esta prioridade:** os quatro atores da proposta só ficam tangíveis se for
possível experimentá-los. É também o que transforma um site de apresentação em um produto.

**Teste independente:** entrar com cada um dos quatro perfis e confirmar que cada um vê um
conjunto distinto de funcionalidades e não alcança as dos outros.

**Cenários de aceitação:**

1. **Dado** um visitante na tela de acesso, **quando** ele vê as opções, **então** encontra
   os quatro perfis descritos por função — Gestor Municipal, Fonte Oracular, Conselho de
   Alimentação Escolar e Órgão de Controle — cada um com o nome fictício da pessoa e da
   instituição que representa.
2. **Dado** um visitante que escolheu um perfil, **quando** o acesso se completa, **então**
   ele chega a um painel específico daquele papel e seu nome e instituição aparecem no
   cabeçalho.
3. **Dado** um usuário autenticado como Fonte Oracular, **quando** tenta acessar a área do
   Gestor Municipal por URL direta, **então** é impedido e recebe explicação do motivo.
4. **Dado** um usuário autenticado, **quando** recarrega a página ou volta depois de fechar
   a aba, **então** continua no mesmo perfil até sair explicitamente.
5. **Dado** um visitante na tela de acesso, **quando** ele inspeciona a tela, **então**
   encontra declaração explícita de que nenhuma credencial real é solicitada ou aceita.

---

### História 3 — A trava bloqueia o superfaturamento (Prioridade: P1)

O Gestor Municipal propõe uma compra de merenda. O sistema compara o preço unitário
efetivo com a mediana das cotações e **rejeita a proposta antes do desembolso** se o valor
exceder a tolerância.

**Por que esta prioridade:** é a tese inteira do projeto. Sem esta demonstração, não há
protótipo.

**Teste independente:** propor uma compra com preço acima da tolerância e confirmar que ela
é bloqueada, com o motivo quantificado; repetir com preço dentro da tolerância e confirmar
aprovação.

**Cenários de aceitação:**

1. **Dado** um item com preço de referência estabelecido, **quando** o gestor propõe uma
   compra cujo preço unitário efetivo excede a mediana em mais que a tolerância vigente,
   **então** a proposta é rejeitada, nenhum valor é liberado, e a tela informa o preço
   proposto, a mediana, o limite máximo e a diferença percentual.
2. **Dado** a mesma situação, **quando** a rejeição ocorre, **então** o sistema exibe
   quanto dinheiro público foi preservado e a quantas refeições escolares esse valor
   equivale.
3. **Dado** um item com preço de referência estabelecido, **quando** o gestor propõe uma
   compra dentro da tolerância, **então** a proposta é aprovada e registrada.
4. **Dado** um item **sem** preço de referência, **quando** o gestor tenta propor uma
   compra, **então** a operação é recusada por ausência de referência, e não por preço.
5. **Dado** qualquer proposta submetida, **quando** ela é processada, **então** um registro
   é gravado na cadeia — aprovada ou rejeitada, ambas visíveis.
6. **Dado** o gestor preenchendo o formulário, **quando** ele informa quantidade e valor
   total, **então** o preço unitário efetivo e a situação prevista aparecem antes do envio.

---

### História 4 — Painel público de transparência (Prioridade: P1)

Qualquer cidadão, jornalista ou órgão de controle acompanha em tempo real o fluxo de
repasses, os alertas de rejeição e os preços de referência, **sem cadastro**.

**Por que esta prioridade:** é o que diferencia a proposta de um sistema interno de
prefeitura. Também é a tela que a banca mais provavelmente vai explorar sozinha.

**Teste independente:** acessar o painel em janela anônima, sem autenticar, e conseguir
identificar quanto foi bloqueado, quais propostas foram rejeitadas e por quê.

**Cenários de aceitação:**

1. **Dado** um visitante não autenticado, **quando** acessa o painel público, **então** vê
   os indicadores agregados do município: valor total proposto, valor aprovado, valor
   bloqueado, refeições preservadas e escolas alcançadas.
2. **Dado** o painel carregado, **quando** o visitante observa a lista de repasses,
   **então** cada linha mostra item, fornecedor, quantidade, valor, situação e data, com a
   situação distinguível por ícone e texto além da cor.
3. **Dado** o painel carregado, **quando** o visitante filtra por situação, item ou
   período, **então** os indicadores agregados se recalculam para o recorte filtrado.
4. **Dado** um repasse na lista, **quando** o visitante o seleciona, **então** vê a página
   de detalhe com o histórico completo de eventos daquele repasse e as cotações que
   formaram a mediana usada.
5. **Dado** o painel carregado, **quando** o visitante observa a evolução de preços de um
   item, **então** vê a comparação entre as cotações das fontes, a mediana e o limite de
   tolerância ao longo do tempo.

---

### História 5 — A mediana se forma a partir de fontes independentes (Prioridade: P2)

Uma Fonte Oracular reporta sua cotação para um item. Quando há pelo menos três cotações, o
preço de referência é recalculado pela mediana.

**Por que esta prioridade:** responde à pergunta técnica que a banca vai fazer — de onde
vem o preço justo, e por que uma fonte corrompida não consegue manipulá-lo.

**Teste independente:** reportar uma cotação absurdamente alta por uma fonte e confirmar
que a mediana praticamente não se move.

**Cenários de aceitação:**

1. **Dado** uma fonte autorizada, **quando** ela reporta uma cotação para um item,
   **então** a cotação é registrada e associada àquela fonte e horário.
2. **Dado** um item com menos de três cotações, **quando** se tenta recalcular a
   referência, **então** a operação é recusada por número insuficiente de fontes.
3. **Dado** um item com três ou mais cotações, **quando** a referência é recalculada,
   **então** o novo preço é a mediana das cotações e o limite de tolerância é atualizado.
4. **Dado** um item com referência estabelecida, **quando** uma única fonte reporta valor
   extremamente distante das demais, **então** a mediana permanece próxima das cotações
   honestas, e a interface sinaliza a cotação discrepante.
5. **Dado** um usuário que não é fonte autorizada, **quando** tenta reportar cotação,
   **então** a operação é recusada por falta de autorização.
6. **Dado** a interface de comparação, **quando** o visitante examina o cálculo, **então**
   vê lado a lado o resultado pela mediana e o que teria sido pela média aritmética,
   evidenciando a resistência a manipulação.

---

### História 6 — Registro auditável e verificação de integridade (Prioridade: P2)

Todo evento do sistema entra em um registro sequencial encadeado. Qualquer pessoa pode
percorrer os registros e verificar que nenhum foi alterado retroativamente.

**Por que esta prioridade:** materializa a alegação central de "alterações retroativas são
matematicamente impossíveis", que em um banco de dados centralizado não seria verificável.

**Teste independente:** abrir o explorador, rodar a verificação de integridade com
resultado íntegro, adulterar um registro pela ferramenta de demonstração e confirmar que a
verificação passa a apontar exatamente onde a cadeia quebrou.

**Cenários de aceitação:**

1. **Dado** o explorador de registros, **quando** o visitante o abre, **então** vê a lista
   sequencial de eventos, cada um com número, horário, tipo, autor, resumo legível e
   identificador do registro.
2. **Dado** um registro na lista, **quando** o visitante o seleciona, **então** vê os dados
   completos do evento, o identificador do registro anterior e o do próprio registro.
3. **Dado** o explorador, **quando** o visitante aciona a verificação de integridade,
   **então** o sistema recalcula a cadeia inteira e informa se está íntegra.
4. **Dado** o modo de demonstração de adulteração, **quando** o visitante altera o valor de
   um registro já gravado, **então** a verificação passa a falhar e aponta o primeiro
   registro inválido e todos os subsequentes.
5. **Dado** uma transação rejeitada pela trava, **quando** o visitante a procura no
   explorador, **então** ela aparece com a situação de falha e o motivo textual da
   rejeição — a tentativa fica registrada, não desaparece.

---

### História 7 — Confirmação de entrega pelo Conselho Escolar (Prioridade: P3)

O pagamento aprovado fica retido até que o Conselho de Alimentação Escolar confirme o
recebimento físico dos alimentos na escola.

**Por que esta prioridade:** é a mitigação do risco de "fraude de insumo" descrito na
proposta — preço correto, mercadoria que nunca chegou. Enriquece muito a demonstração, mas
a tese central sobrevive sem ela.

**Teste independente:** aprovar um repasse, verificar que o valor consta como retido,
confirmar a entrega pelo perfil do Conselho e verificar que o valor passa a liberado.

**Cenários de aceitação:**

1. **Dado** um repasse aprovado pela trava de preço, **quando** ele é registrado,
   **então** seu valor entra como retido e não como pago.
2. **Dado** um membro do Conselho, **quando** acessa seu painel, **então** vê a lista de
   entregas pendentes de confirmação na sua escola.
3. **Dado** uma entrega pendente, **quando** o membro do Conselho confirma o recebimento,
   **então** o valor passa a liberado e o evento é registrado com autor e horário.
4. **Dado** uma entrega pendente, **quando** o membro do Conselho registra divergência
   entre o pedido e o recebido, **então** o valor permanece retido e uma ocorrência é
   aberta e visível no painel público.
5. **Dado** uma entrega pendente há mais tempo que o prazo definido, **quando** o painel
   público é consultado, **então** ela aparece destacada como pendência vencida.

---

### História 8 — O contrato exposto e suas divergências (Prioridade: P3)

A banca técnica pode ler o programa Anchor da proposta e entender exatamente o que a
simulação reproduz — inclusive onde o contrato original tem limitações conhecidas.

**Por que esta prioridade:** transparência sobre a própria maturidade técnica é
diferencial diante de bancas avaliadoras. Também sustenta o critério de Risco.

**Teste independente:** abrir a página do contrato e confirmar que o código exibido
corresponde ao da proposta e que as divergências estão listadas com justificativa.

**Cenários de aceitação:**

1. **Dado** um visitante técnico, **quando** acessa a página do contrato, **então** vê o
   código-fonte Anchor/Rust da proposta com realce de sintaxe.
2. **Dado** a mesma página, **quando** o visitante rola até as observações, **então**
   encontra a lista de limitações conhecidas do contrato e o que está previsto para a
   próxima versão.
3. **Dado** a mesma página, **quando** o visitante procura entender o estado do projeto,
   **então** encontra declaração clara de que a lógica é executada em simulação e do que
   seria necessário para operar em rede real.

---

### Casos de Borda

- Proposta com quantidade zero: deve ser recusada antes de qualquer divisão.
- Proposta com valor total zero: preço unitário zero fica abaixo do limite e seria
  aprovada pela regra do contrato — comportamento preservado no núcleo, e sinalizado como
  anomalia pela camada de interface.
- Item com número par de cotações: a mediana segue a regra do contrato, que devolve o
  elemento central superior, e não a média dos dois centrais.
- Duas cotações da mesma fonte para o mesmo item: a mais recente substitui a anterior.
- Fonte que reporta cotação zero: aceita pelo contrato, mas destacada como discrepante.
- Cotação exatamente no limite da tolerância: aprovada — a comparação é "menor ou igual".
- Estado local corrompido ou de versão anterior: o sistema descarta e restaura os dados
  semeados, informando o usuário.
- Usuário que aciona a demonstração de adulteração e não a desfaz: deve haver um comando
  visível de restauração completa dos dados.

---

## Requisitos

### Núcleo de Regras — fidelidade ao programa Anchor

- **FR-001**: O sistema DEVE calcular o preço de referência de um item como a mediana das
  cotações reportadas, usando exatamente o algoritmo do programa: ordenação
  crescente de uma cópia e retorno do elemento de índice `tamanho / 2` com divisão
  inteira.
- **FR-002**: O sistema DEVE recusar o recálculo do preço de referência quando houver menos
  de três cotações para o item.
- **FR-003**: O sistema DEVE recusar cotação enviada por origem não autorizada.
- **FR-004**: O sistema DEVE calcular o limite máximo de um item como
  `mediana + (mediana × toleranciaPercentual) / 100`, com aritmética inteira.
- **FR-005**: O sistema DEVE recusar uma proposta de repasse cujo preço unitário efetivo
  (`valorProposto / quantidade`, divisão inteira) seja **maior** que o limite máximo, e
  DEVE aprová-la quando for menor ou igual.
- **FR-006**: O sistema DEVE recusar proposta para item sem preço de referência
  estabelecido, com motivo distinto do de preço excedido.
- **FR-007**: O sistema DEVE representar todo valor monetário como inteiro em centavos, sem
  aritmética de ponto flutuante em qualquer etapa de cálculo.
- **FR-008**: O sistema DEVE emitir, para cada operação, os mesmos eventos que o programa
  emite — e apenas esses. Em particular, `autorizar_fonte` e `confirmar_entrega` NÃO emitem
  evento algum, divergência que DEVE ser preservada e documentada.
- **FR-009**: O sistema DEVE preservar as peculiaridades do programa original mesmo quando
  indesejáveis, e DEVE documentá-las como divergências conhecidas em vez de corrigi-las
  silenciosamente.
- **FR-010**: A tolerância percentual DEVE ser um parâmetro do sistema, com valor inicial
  de 15%, e DEVE ser visível ao usuário em toda tela onde a trava é aplicada.

### Registro Encadeado

- **FR-011**: O sistema DEVE gravar cada operação como um registro sequencial contendo
  número, horário, tipo de evento, autor, dados do evento, identificador do registro
  anterior e identificador próprio.
- **FR-012**: O identificador de cada registro DEVE ser derivado deterministicamente do seu
  conteúdo somado ao identificador do registro anterior.
- **FR-013**: O sistema DEVE registrar também as operações **rejeitadas**, com a situação de
  falha e o motivo textual, sem removê-las do histórico.
- **FR-014**: O sistema DEVE oferecer uma verificação de integridade que recalcula a cadeia
  completa e identifica o primeiro registro divergente, se houver.
- **FR-015**: O sistema DEVE oferecer um modo de demonstração que permite adulterar um
  registro gravado, para evidenciar a detecção, e DEVE oferecer restauração ao estado
  original.
- **FR-016**: O registro DEVE ser somente-anexação em operação normal: nenhuma
  funcionalidade de produto pode editar ou apagar um registro existente.

### Acesso e Perfis

- **FR-017**: O sistema DEVE oferecer quatro perfis de acesso — Gestor Municipal, Fonte
  Oracular, Conselho de Alimentação Escolar e Órgão de Controle — cada um com identidade
  fictícia de pessoa e instituição.
- **FR-018**: O sistema DEVE permitir o acesso por seleção de perfil, sem exigir, aceitar ou
  transmitir qualquer credencial real.
- **FR-019**: O sistema É PROIBIDO de reproduzir marca, logotipo, paleta institucional ou
  layout de provedor de identidade real, incluindo gov.br, UNICEF e TransfereGov.
- **FR-020**: O sistema DEVE persistir a sessão localmente entre recarregamentos e DEVE
  oferecer encerramento explícito de sessão.
- **FR-021**: O sistema DEVE impedir que um perfil acesse funcionalidades de outro,
  inclusive por navegação direta por URL, exibindo explicação em vez de erro genérico.
- **FR-022**: A tela de acesso DEVE declarar textualmente que se trata de ambiente
  simulado.

### Painel Público

- **FR-023**: O sistema DEVE oferecer painel público acessível sem autenticação.
- **FR-024**: O painel público DEVE exibir os agregados: valor proposto, valor aprovado,
  valor bloqueado, refeições preservadas, escolas alcançadas e alunos alcançados.
- **FR-025**: O sistema DEVE converter todo valor bloqueado em refeições escolares
  preservadas, usando um custo de referência por refeição declarado na própria interface.
- **FR-026**: O painel DEVE permitir filtro por situação, item e período, recalculando os
  agregados conforme o recorte.
- **FR-027**: O painel DEVE oferecer página de detalhe por repasse, com o histórico de
  eventos e as cotações que formaram a mediana aplicada.
- **FR-028**: O painel DEVE exibir, por item, a comparação entre cotações das fontes,
  mediana e limite de tolerância ao longo do tempo.
- **FR-029**: O sistema DEVE distinguir situações por ícone e rótulo textual, além da cor.

### Fluxos por Perfil

- **FR-030**: O Gestor Municipal DEVE conseguir submeter uma proposta de repasse informando
  item, fornecedor, escola, quantidade e valor total.
- **FR-031**: O formulário de proposta DEVE exibir, antes do envio, o preço unitário
  efetivo, a mediana vigente, o limite máximo e a situação prevista.
- **FR-032**: Ao ser rejeitada, a proposta DEVE informar preço proposto, mediana, limite,
  diferença percentual, valor preservado e refeições equivalentes.
- **FR-033**: A Fonte Oracular DEVE conseguir reportar cotação para os itens em que está
  autorizada, e visualizar as cotações das demais fontes.
- **FR-034**: O sistema DEVE apresentar, no fluxo do oráculo, a comparação entre mediana e
  média aritmética para o mesmo conjunto de cotações.
- **FR-035**: O Conselho de Alimentação Escolar DEVE conseguir confirmar recebimento ou
  registrar divergência para as entregas pendentes de sua escola.
- **FR-036**: O Órgão de Controle DEVE conseguir visualizar todos os alertas de rejeição e
  as pendências de entrega vencidas.

### Liquidação em BRZ e Custódia

- **FR-037**: Ao aprovar um repasse, o sistema DEVE transferir o valor em BRZ da conta da
  prefeitura para a conta de custódia, deixando-o retido e não pago.
- **FR-038**: A liberação do valor ao fornecedor DEVE exigir que o número de confirmações de
  entrega atinja o quórum de duas.
- **FR-039**: Quando a trava bloqueia uma proposta, o sistema É PROIBIDO de mover qualquer
  valor: o saldo da prefeitura DEVE permanecer intacto, e a interface DEVE evidenciá-lo.
- **FR-040**: O sistema DEVE exibir os saldos em BRZ das três contas envolvidas — prefeitura,
  custódia e fornecedor — e DEVE mostrar a movimentação decorrente de cada operação.
- **FR-041**: O sistema DEVE preservar o total de BRZ em circulação em toda operação: valor
  não é criado nem destruído, apenas transferido.
- **FR-042**: O sistema DEVE explicar, em linguagem acessível, que a liquidação em stablecoin
  faz do registro contábil e do pagamento a mesma operação, e por que isso remove o espaço
  onde a fraude se aloja.
- **FR-043**: Divergência registrada pelo Conselho DEVE manter o valor retido e abrir
  ocorrência visível no painel público. Esta é **extensão da simulação** além do programa
  publicado, e DEVE ser rotulada como tal.
- **FR-044**: Entrega pendente além do prazo definido DEVE ser destacada como vencida, e a
  interface DEVE nomear a consequência: o programa não tem instrução de devolução, então o
  valor permanece imobilizado.

### Dados e Ambiente

- **FR-045**: Todo dado exibido DEVE ser fictício: município, escolas, fornecedores,
  pessoas, notas e ocorrências.
- **FR-046**: O sistema É PROIBIDO de associar entidade real a suspeita, rejeição ou
  irregularidade.
- **FR-047**: Toda página DEVE exibir indicador persistente de ambiente de demonstração.
- **FR-048**: O sistema DEVE oferecer comando visível de restauração dos dados ao estado
  semeado original.
- **FR-049**: O estado alterado pelo usuário DEVE persistir localmente entre visitas, de
  modo que a exploração da banca não se perca ao recarregar.
- **FR-050**: O sistema DEVE funcionar integralmente sem conexão de rede após o
  carregamento inicial.

### Comunicação da Proposta

- **FR-051**: A página inicial DEVE apresentar problema, solução, números de impacto e os
  caminhos de acesso.
- **FR-052**: O sistema DEVE oferecer página com o código-fonte do programa Anchor da
  proposta, suas limitações conhecidas e o caminho para operação na rede Solana.
- **FR-053**: O sistema DEVE explicar, em linguagem acessível a não-técnicos, por que a
  mediana é usada no lugar da média.
- **FR-054**: O sistema DEVE declarar de forma inequívoca que a execução é simulada e não
  ocorre na rede Solana.

### Auditoria do Próprio Programa

- **FR-055**: A página do programa DEVE listar as divergências da auditoria classificadas por
  severidade, cada uma com o que é, qual o impacto e qual a correção proposta para a v0.2.
- **FR-056**: A página DEVE registrar o que a migração de Solidity para Anchor **corrigiu**,
  e não apenas o que resta em aberto — a evolução entre as versões é evidência de maturidade
  técnica.
- **FR-057**: O sistema DEVE oferecer um modo de demonstração da falha de quórum, no qual o
  visitante confirma a mesma entrega duas vezes pela mesma parte e observa o valor ser
  liberado ao fornecedor.
- **FR-058**: O modo de demonstração da falha DEVE deixar explícito, antes e depois da
  execução, que se trata de falha conhecida com correção proposta, e não de comportamento
  pretendido. Em uso normal, a camada de aplicação DEVE impedir a confirmação repetida.

### Requisitos Não-Funcionais

- **NFR-001**: A primeira tela DEVE tornar-se interativa em menos de 2,5 segundos em
  conexão 4G simulada.
- **NFR-002**: O layout DEVE ser funcional de 360px a 2560px de largura, sem rolagem
  horizontal do corpo da página.
- **NFR-003**: O contraste de texto DEVE atender ao mínimo de 4,5:1.
- **NFR-004**: Toda funcionalidade DEVE ser operável apenas por teclado.
- **NFR-005**: O sistema DEVE operar sem backend, sem banco de dados e sem variável de
  ambiente.
- **NFR-006**: A hospedagem DEVE ter custo zero e não exigir cadastro de meio de pagamento.
- **NFR-007**: Toda a interface DEVE estar em português do Brasil.
- **NFR-008**: O núcleo de regras DEVE ter cobertura de teste em todos os caminhos de
  aprovação e rejeição descritos nos requisitos FR-001 a FR-010.

---

## Entidades-Chave

- **Município**: unidade administrativa fictícia que concentra a demonstração. Possui nome,
  UF fictícia, população estimada, número de escolas e de alunos atendidos.
- **Escola**: unidade de ensino do município. Possui nome, número de alunos e refeições
  servidas por dia.
- **Item**: insumo da merenda escolar. Possui identificador, nome, unidade de medida,
  preço de referência vigente, horário da última atualização e histórico de medianas.
- **Fonte Oracular**: entidade autorizada a reportar cotações. Possui nome, categoria
  (oficial, intermunicipal ou sociedade civil), situação de autorização e histórico de
  reportes.
- **Cotação**: preço reportado por uma fonte para um item em um momento. Possui fonte,
  item, valor em centavos e horário.
- **Fornecedor**: empresa fictícia que propõe fornecer um item.
- **Repasse**: proposta de compra. Possui item, fornecedor, escola, quantidade, valor
  total, preço unitário efetivo, mediana aplicada, limite aplicado, situação e histórico.
- **Registro**: entrada da cadeia auditável. Possui número sequencial, horário, tipo,
  autor, dados, identificador anterior, identificador próprio e situação de sucesso ou
  falha com motivo.
- **Perfil**: identidade de demonstração. Possui papel, nome fictício, instituição
  fictícia e conjunto de permissões.
- **Entrega**: confirmação física vinculada a um repasse aprovado. Possui situação, prazo,
  confirmador e eventual divergência.

---

## Critérios de Sucesso

- **SC-001**: Um avaliador que nunca viu o projeto identifica o problema, a solução e o
  impacto em menos de 60 segundos na página inicial.
- **SC-002**: 100% das propostas com preço unitário acima do limite de tolerância são
  bloqueadas, e 0% das que estão dentro do limite são bloqueadas.
- **SC-003**: Um avaliador consegue, sem instrução externa, reproduzir uma rejeição por
  superfaturamento em menos de 3 minutos a partir da página inicial.
- **SC-004**: A verificação de integridade detecta 100% das adulterações introduzidas pelo
  modo de demonstração, apontando o registro correto.
- **SC-005**: Toda tela do protótipo permanece funcional com a rede desligada.
- **SC-006**: O núcleo de regras produz resultado idêntico ao programa Anchor da proposta
  em todos os casos de teste, incluindo os de borda documentados.
- **SC-007**: O protótipo é acessível por URL pública em hospedagem de custo zero.
- **SC-008**: Nenhum dado exibido corresponde a município, órgão, empresa ou pessoa real.

---

## Premissas

- A banca acessará o protótipo majoritariamente por celular e sem contexto prévio além do
  PDF da proposta.
- O custo de referência por refeição escolar é um parâmetro de demonstração declarado na
  interface, não uma afirmação sobre valores oficiais do PNAE.
- Os preços dos itens são plausíveis para 2026, mas fictícios, e não devem ser lidos como
  cotação de mercado.
- A ausência de blockchain real é aceitável para o ideathon, que avalia a ideia e sua
  viabilidade, e não exige implantação em rede.
- O programa Anchor `repasse_transparente` da proposta é a referência normativa da lógica, mesmo onde
  contém imperfeições.

---

## Fora de Escopo

- Execução em blockchain real, testnet ou mainnet; carteiras; assinatura criptográfica de
  transações.
- Integração com TransfereGov, ComprasNet, SINAPI, CEASA ou qualquer sistema externo.
- Autenticação real, gestão de identidade, recuperação de acesso, controle de sessão
  servidor.
- Aplicativo móvel nativo e leitura real de QR Code em nota fiscal.
- Persistência compartilhada entre visitantes: o estado é local a cada navegador.
- Internacionalização.
- Módulo de Fundeb para obras escolares: a demonstração cobre apenas o PNAE.

---

## Dependências

- Conteúdo normativo: `RepasseTransparente_Proposta.docx`, em especial as seções 4, 5 e 6.
- Constituição do projeto: `.specify/memory/constitution.md`.
