---
description: Identifica e resolve ambiguidades da spec por meio de perguntas estruturadas.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

Alvo: $ARGUMENTS (se vazio, use a spec mais recente em `specs/`)

## Objetivo

Reduzir a incerteza da spec antes do planejamento. Ambiguidade que sobrevive até a
implementação vira retrabalho ou um palpite silencioso do agente.

## Execução

1. **Leia** a spec alvo e a constituição.

2. **Varra por sub-especificação** nestas categorias, marcando cada uma como Clara,
   Parcial ou Ausente:

   | Categoria | O que procurar |
   |---|---|
   | Escopo | fronteiras, o que fica de fora, critério de sucesso |
   | Domínio | entidades, relações, cardinalidade, ciclo de vida |
   | Interação | fluxos, estados vazios, erros, confirmações |
   | Dados | volume, retenção, origem, formato, precisão numérica |
   | Não-funcional | desempenho, acessibilidade, offline, idioma |
   | Permissões | quem vê o quê, quem pode agir sobre o quê |
   | Borda | conflito, concorrência, entrada inválida, limite |
   | Risco ético | dado sensível, impersonação, viés, dano reputacional |

3. **Formule no máximo 5 perguntas**, ordenadas pelo impacto que a resposta tem sobre a
   arquitetura. Use `AskUserQuestion`, com opções concretas e mutuamente exclusivas —
   nunca perguntas abertas do tipo "como você quer isso?".

4. **Grave cada resposta imediatamente** na seção `## Esclarecimentos` da spec, sob a data
   da sessão, e **propague** para o requisito correspondente no mesmo passo. Não acumule
   respostas para gravar no fim.

5. **Remova** os marcadores `[NECESSITA ESCLARECIMENTO]` resolvidos.

6. **Relate**: categorias que continuam Parciais ou Ausentes e por quê, e se a spec já está
   pronta para `/speckit:plan`.

## Restrições

- Uma pergunta cuja resposta não muda nenhum requisito não deve ser feita.
- Não invente a resposta do usuário. Sem resposta, o marcador permanece.
- Pare em 5 perguntas por rodada. É melhor rodar duas vezes do que exaurir quem responde.
