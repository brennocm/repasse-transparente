---
description: Cria ou emenda a constituição do projeto, propagando as mudanças para templates e specs.
allowed-tools: Read, Write, Edit, Glob, Grep
---

Emenda solicitada: $ARGUMENTS

## Objetivo

Manter `.specify/memory/constitution.md` como fonte única de verdade sobre os princípios
inegociáveis do projeto, e garantir que nenhum artefato derivado fique contradizendo-a.

## Execução

1. **Leia** `.specify/memory/constitution.md` na íntegra. Se não existir, use
   `.specify/templates/` como referência de estilo e crie a partir do pedido.

2. **Colete o delta.** Determine exatamente quais princípios são adicionados, alterados ou
   removidos. Se o pedido for vago sobre um ponto que muda obrigações de código, pergunte
   antes de escrever — não deduza.

3. **Versione** segundo a regra de governança do próprio documento:
   - **MAJOR** — princípio removido ou redefinido de forma incompatível
   - **MINOR** — novo princípio ou nova seção obrigatória
   - **PATCH** — redação, exemplo ou tipografia, sem alterar obrigação

4. **Redija.** Cada princípio precisa de:
   - nome declarativo
   - regras em linguagem imperativa (DEVE / É PROIBIDO), não aspiracional
   - um bloco **Por quê** explicando o custo real de violá-lo

5. **Propague.** Verifique e atualize, se necessário:
   - `.specify/templates/plan-template.md` — a tabela de Checagem Constitucional precisa
     listar exatamente os princípios vigentes
   - `.specify/templates/spec-template.md` e `tasks-template.md`
   - `CLAUDE.md` — a seção "Regras que Você Não Pode Quebrar"
   - `specs/*/plan.md` já existentes — marque os que ficaram desatualizados

6. **Relate** ao final: versão antiga → nova, princípios tocados, arquivos propagados, e
   qualquer artefato que exija revisão manual.

## Restrições

- Não invente datas. Se a data de ratificação original for desconhecida, pergunte.
- Não deixe placeholder não preenchido no documento final.
- Princípio sem consequência verificável não é princípio — é slogan. Reescreva ou descarte.
