# Contrato de Interface — Acesso Simulado

**Fronteira ética inegociável (Princípio V, FR-018, FR-019):** este módulo encena um login.
Ele nunca solicita, aceita, transmite ou armazena credencial real, e nunca reproduz a
identidade visual de um provedor de identidade real.

---

## O que é proibido implementar

Registrado explicitamente porque o pedido é que o site pareça real, e a tentação de
aumentar o realismo leva direto à violação.

| Proibido | Por quê |
|---|---|
| Campo de senha, mesmo com valor de demonstração | Um campo de senha em site público é superfície de phishing, independentemente da intenção |
| Botão "Entrar com gov.br" com a marca oficial | Imitação de identidade governamental; o projeto é avaliado pelo UNICEF |
| Logotipo, paleta ou tipografia do UNICEF, TransfereGov ou FNDE | Sugere endosso institucional inexistente |
| Campo de CPF, mesmo sem validação | Induz o usuário a digitar dado pessoal real |
| Qualquer envio de dado a servidor | O Princípio III já proíbe rede; aqui a razão é adicional |

## O que substitui, mantendo o realismo

A tela de acesso apresenta os quatro perfis como **cartões de identidade de demonstração** —
nome fictício, cargo, instituição fictícia e descrição do que aquele ator faz no sistema.
Selecionar um cartão é o ato de entrar.

O fluxo de identidade pretendido em produção (login social sem manipulação de chaves
privadas, como descrito na seção 6 do PDF) é comunicado por **texto explicativo**, não por
imitação de interface.

---

## `adapter/sessao.ts`

### `listarPerfis(): Perfil[]`

Devolve os quatro perfis de demonstração, cada um com nome, cargo, instituição, papel e
descrição da função no ecossistema.

- **Requisito:** FR-017

### `entrar(perfilId: Id): Sessao`

- **Pré-condição:** `perfilId` existe entre os perfis de demonstração
- **Efeito:** grava `Sessao` em `localStorage` sob a chave versionada
- **Pós-condição:** nenhum dado além de `perfilId`, `iniciadaEm` e `versaoEstado` é
  persistido
- **Requisitos:** FR-018, FR-020

### `sair(): void`

Remove a sessão. O estado do domínio — repasses, cotações, cadeia — **permanece**. Sair não
é restaurar dados; a restauração é comando próprio (FR-048).

- **Requisito:** FR-020

### `sessaoAtual(): Sessao | null`

Lê do `localStorage`. Sessão de versão de estado incompatível é descartada.

- **Requisito:** FR-020

### `podeExecutar(perfil: Perfil | null, permissao: Permissao): boolean`

Consulta a matriz de permissões do `data-model.md`. `null` só tem
`ver_painel_publico`.

- **Requisito:** FR-021

---

## Guarda de Rota — `app/plataforma/layout.tsx`

Componente cliente que envolve toda a área autenticada.

| Situação | Comportamento |
|---|---|
| Sem sessão | Redireciona a `/entrar`, com explicação do motivo e retorno após entrar |
| Sessão com papel incorreto para a rota | **Não** redireciona silenciosamente. Exibe página explicando qual perfil tem acesso àquela função e oferece a troca de perfil |
| Sessão válida | Renderiza, com nome e instituição do perfil no cabeçalho |

O redirecionamento silencioso é proibido: um avaliador que digitar `/plataforma/oraculo`
logado como gestor precisa **entender** o que aconteceu, não ser jogado em outra tela. A
segregação de papéis é parte do que está sendo demonstrado; escondê-la desperdiça a
demonstração (FR-021).

---

## Rótulo de Ambiente

Componente persistente, presente em todas as rotas, incluindo as públicas.

- Texto: identifica ambiente de demonstração e dados fictícios
- Posição: fixa, visível sem rolagem, sem obstruir conteúdo em 360px
- Não dispensável: não há botão de fechar
- **Requisito:** FR-047

Na tela de acesso, além do rótulo global, há declaração específica de que nenhuma
credencial real é solicitada ou aceita (FR-022).
