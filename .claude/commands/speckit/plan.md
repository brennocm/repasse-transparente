---
description: Gera o plano de implementação e os artefatos de design a partir da spec.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

Contexto adicional: $ARGUMENTS

## Objetivo

Decidir **como** construir o que a spec descreve, sob checagem explícita de conformidade
constitucional, produzindo artefatos de design suficientes para que as tarefas sejam
geradas mecanicamente.

## Execução

1. **Leia** a spec alvo, `.specify/memory/constitution.md` e
   `.specify/templates/plan-template.md`.

2. **Aborte se houver `[NECESSITA ESCLARECIMENTO]` não resolvido** que afete arquitetura.
   Instrua o usuário a rodar `/speckit:clarify` antes.

3. **Preencha o Contexto Técnico.** Toda lacuna vira uma pergunta de pesquisa da Fase 0.

4. **Execute a Checagem Constitucional inicial.** Preencha a tabela princípio a princípio.
   Violação sem justificativa registrada bloqueia o avanço.

5. **Fase 0 — `research.md`.** Uma entrada por decisão, no formato: decisão / justificativa
   / alternativas descartadas com o motivo. Decisão sem alternativa considerada é suspeita.

6. **Fase 1 — design:**
   - `data-model.md` — entidades, campos com tipo e unidade, invariantes, transições de estado
   - `contracts/` — a interface entre módulos, com pré-condições, pós-condições e erros
   - `quickstart.md` — roteiro de verificação manual ponta a ponta

7. **Revalide a Checagem Constitucional** após o design. Decisões da Fase 1 frequentemente
   introduzem violações que não existiam na Fase 0.

8. **Fase 2 — descreva a abordagem de tarefas.** Não gere as tarefas; isso é
   `/speckit:tasks`.

9. **Relate** os artefatos gerados e o estado de cada portão.

## Restrições

- O plano decide tecnologia; a spec não. Se você precisou alterar a spec para caber na
  tecnologia, a decisão está errada — ou a spec estava errada e precisa ser corrigida
  explicitamente, não de contrabando.
- Toda dependência nova exige justificativa contra a restrição de custo zero e de ausência
  de rede em runtime.
- Não escreva código de implementação neste comando.
