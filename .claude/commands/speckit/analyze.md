---
description: Audita a consistência entre constituição, spec, plano e tarefas antes da implementação.
allowed-tools: Read, Glob, Grep
---

Escopo da análise: $ARGUMENTS (se vazio, use a spec mais recente)

## Objetivo

Encontrar contradições, lacunas e ambiguidades **antes** que virem código. Este comando é
somente-leitura: ele relata, não corrige.

## Execução

1. **Carregue** `constitution.md`, `spec.md`, `plan.md`, `tasks.md` e os artefatos de
   design da funcionalidade alvo.

2. **Construa o inventário de requisitos.** Extraia todo `FR-###`, `NFR-###` e `SC-###`.

3. **Rode as detecções:**

   | Detecção | O que procurar |
   |---|---|
   | Cobertura | requisito sem nenhuma tarefa que o atenda |
   | Órfã | tarefa que não rastreia para nenhum requisito |
   | Contradição | spec e plano afirmando coisas incompatíveis |
   | Duplicação | dois requisitos dizendo a mesma coisa com palavras diferentes |
   | Ambiguidade | adjetivo sem número: "rápido", "intuitivo", "seguro", "escalável" |
   | Constituição | decisão do plano que viola um princípio sem justificativa registrada |
   | Ordem | tarefa que depende de artefato produzido por tarefa posterior |
   | Vazamento | tecnologia mencionada na spec (que deveria ser agnóstica) |

4. **Classifique** cada achado como **Crítico** (bloqueia implementação), **Alto**
   (retrabalho provável), **Médio** ou **Baixo**.

5. **Relate** em tabela: ID, severidade, categoria, local (arquivo e seção), descrição,
   correção recomendada. Termine com a contagem por severidade e um veredito explícito:
   pronto para `/speckit:implement`, ou não, e o que falta.

## Restrições

- **Não altere nenhum arquivo.** Se identificar correções, descreva-as; a aplicação é
  decisão do usuário.
- Violação constitucional é sempre **Crítica**, mesmo que pareça inofensiva.
- Não relate estilo ou preferência pessoal. Só inconsistência verificável.
