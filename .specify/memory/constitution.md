# Constituição — RepasseTransparente

**Versão:** 1.0.0
**Ratificada em:** 2026-07-28
**Última emenda:** 2026-07-28
**Contexto:** Protótipo para o UNICEF Youth Challenge Blockchain 2026 (Ideathon UNICEF x Superteam Brasil / Blockchain.RIO)

Este documento é a autoridade máxima do projeto. Specs, planos, tarefas e código devem
obedecê-lo. Quando um plano de implementação conflitar com um princípio aqui, o princípio
vence — ou a Constituição é emendada explicitamente antes.

---

## Princípios Fundamentais

### I. Dados Fictícios, Sempre Rotulados (NÃO-NEGOCIÁVEL)

Todo dado exibido no protótipo é fabricado. Municípios, escolas, fornecedores, gestores,
notas fiscais e ocorrências de superfaturamento são **fictícios**.

- É **proibido** nomear município, órgão, empresa ou pessoa real como parte de um caso de
  fraude, suspeita ou rejeição. O protótipo acusa entidades inventadas, nunca reais.
- Instituições reais (CEASA, ComprasNet, SINAPI, TCU, TransfereGov) podem ser citadas em
  **texto narrativo** descrevendo a arquitetura pretendida, jamais como atores de dados
  fabricados.
- Toda tela carrega um indicador visual persistente de ambiente de demonstração.

**Por quê:** o projeto é sobre integridade pública. Um protótipo que difama um município
real destrói a própria tese. E a banca é UNICEF — reputação importa.

### II. A Simulação é Transliteração, Não Reinterpretação

O núcleo de regras de negócio (`core`) é uma tradução linha-a-linha de
`RepasseTransparente.sol` para TypeScript. Divergência de comportamento é **bug**, não
melhoria.

- Aritmética inteira apenas. Valores monetários em **centavos**, como `bigint`. Ponto
  flutuante em cálculo de mediana, limite ou tolerância é proibido.
- Peculiaridades do contrato são preservadas, inclusive as indesejáveis: `calcularMediana`
  retorna `arr[arr.length / 2]` com divisão inteira (não a média dos centrais em conjuntos
  pares), e `proporRepasse` emite `RepasseAprovado(1, ...)` com ID fixo.
- Correções ao contrato não são feitas silenciosamente no TypeScript. São registradas em
  `research.md` como divergências conhecidas e propostas para a v0.2 do `.sol`.
- Toda melhoria de usabilidade vive em uma camada `adapter` **acima** do `core`, nunca
  dentro dele.

**Por quê:** o valor da demo é a banca acreditar que aquilo é o contrato rodando. Se o
TypeScript "conserta" a lógica, a demo mente sobre o que foi especificado.

### III. Zero Dependência de Rede em Tempo de Demo (NÃO-NEGOCIÁVEL)

O protótipo funciona integralmente com a máquina em modo avião.

- Sem RPC, sem API externa, sem CDN, sem fonte remota, sem chamada de rede em runtime.
- Sem banco de dados e sem backend. Estado vive em memória e em `localStorage`.
- Toda dependência visual (fontes, ícones, imagens) é servida pelo próprio bundle.

**Por quê:** um pitch tem 5 minutos e uma chance. Wi-Fi de evento cai. O protótipo não pode
ter um único ponto de falha que não esteja sob controle de quem apresenta.

### IV. Impacto Legível em Trinta Segundos

Cada tela responde, sem exigir leitura de tabela, à pergunta: *o que isso muda para uma
criança?*

- Valor bloqueado é sempre convertido e exibido também em **refeições escolares
  preservadas** e **alunos alcançados**.
- Números-chave aparecem antes de qualquer tabela ou gráfico detalhado.
- Jargão de blockchain (hash, nonce, gas, ABI) nunca aparece sozinho: sempre acompanhado
  de tradução em linguagem simples, ou confinado à área técnica do explorador.

**Por quê:** a banca avalia Impacto e Escalabilidade, não elegância de código. Quem julga
pode não ser técnico.

### V. Autenticação é Cenografia, Nunca Segurança

O login é encenação de um produto real e deve ser óbvio como tal para qualquer inspeção.

- **Proibido** coletar, transmitir ou persistir credencial real de qualquer serviço.
- **Proibido** reproduzir marca, logotipo, cor institucional ou layout do gov.br, do
  UNICEF, do TransfereGov ou de qualquer provedor de identidade real. Botões de login
  social usam rótulos genéricos e visualmente distintos dos originais.
- Nenhum campo de senha aceita entrada mascarada que possa ser confundida com login real;
  o acesso é por seleção de perfil de demonstração.
- A tela de login declara textualmente que é um ambiente simulado.

**Por quê:** uma tela de login convincente que imita o gov.br é um kit de phishing, mesmo
sem intenção. O protótipo precisa parecer profissional sem ser falsificável.

### VI. Spec Antes de Código

Nenhum arquivo de implementação nasce sem um requisito rastreável que o justifique.

- Todo requisito funcional tem ID (`FR-###`) e é referenciado pelas tarefas que o cumprem.
- Descoberta durante a implementação que contradiga a spec **para a implementação** e
  atualiza a spec primeiro.
- Ambiguidade encontrada por um agente vira `[NECESSITA ESCLARECIMENTO: ...]` na spec, não
  um palpite no código.

**Por quê:** o projeto será construído majoritariamente por agentes de IA. Sem rastro de
requisito, ninguém — humano ou agente — consegue auditar o que foi feito e por quê.

### VII. A Banca Vai Abrir no Celular

Responsividade e acessibilidade são requisito de aceitação, não polimento final.

- Layout funcional de 360px a 2560px. Nenhum scroll horizontal no corpo da página.
- Contraste mínimo AA (4.5:1 para texto). Navegação completa por teclado.
- Informação nunca é transmitida somente por cor: rejeição, aprovação e pendência têm
  ícone e rótulo textual além do vermelho/verde/âmbar.

**Por quê:** avaliadores acessam o link do celular, no intervalo, com a tela no sol.

---

## Restrições Técnicas

| Restrição | Valor |
|---|---|
| Hospedagem | Estática e gratuita (Vercel Hobby, alvo primário) |
| Custo de operação | R$ 0,00. Nenhum serviço com cartão, trial ou cota paga |
| Blockchain real | **Fora de escopo nesta versão.** A cadeia é simulada em TypeScript |
| Backend / banco | Inexistentes |
| Segredos / variáveis de ambiente | Nenhum. O repositório é integralmente público |
| Idioma da interface | Português do Brasil |
| Idioma do código | Identificadores e comentários em português, seguindo o `.sol` do PDF |

## Fluxo de Desenvolvimento

1. `/speckit:constitution` — estabelece ou emenda este documento
2. `/speckit:specify` — descreve **o quê** e **por quê**, sem decidir tecnologia
3. `/speckit:clarify` — extrai ambiguidades antes de planejar
4. `/speckit:plan` — decide **como**, sob checagem de conformidade constitucional
5. `/speckit:tasks` — quebra em tarefas executáveis e rastreáveis
6. `/speckit:analyze` — audita consistência entre spec, plano e tarefas
7. `/speckit:implement` — executa

Portões de qualidade: os passos 4 e 7 executam **Checagem Constitucional**. Uma violação
não documentada bloqueia o avanço. Uma violação justificada é registrada na tabela de
Rastreamento de Complexidade do `plan.md`.

## Governança

- Emendas exigem: nova versão semântica, justificativa registrada e propagação para
  templates e specs afetadas.
- Versionamento: **MAJOR** remove ou redefine um princípio; **MINOR** adiciona princípio ou
  seção; **PATCH** corrige redação sem alterar obrigação.
- Toda revisão de código — humana ou por agente — verifica conformidade com os sete
  princípios antes de aprovar.
