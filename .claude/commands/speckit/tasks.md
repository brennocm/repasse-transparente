---
description: Gera a lista de tarefas executáveis a partir dos artefatos de design.
allowed-tools: Read, Write, Edit, Glob, Grep
---

Contexto adicional: $ARGUMENTS

## Objetivo

Converter os artefatos de design em uma fila de tarefas tão específica que um agente possa
executar cada uma sem inferir nada.

## Execução

1. **Leia**, na ordem: `plan.md` (obrigatório), `data-model.md`, `contracts/`,
   `research.md`, `quickstart.md` e a `spec.md`.

2. **Derive as tarefas** a partir dos artefatos, não da imaginação:
   - cada entidade do `data-model.md` → tarefa de modelo
   - cada contrato em `contracts/` → tarefa de teste + tarefa de implementação
   - cada história de usuário da spec → tarefa de integração que a valida ponta a ponta
   - cada `FR-###` sem tarefa correspondente é uma falha de cobertura: corrija antes de
     concluir

3. **Ordene** por dependência real: modelo → testes → implementação → integração →
   polimento. Testes que verificam comportamento vêm antes do comportamento existir.

4. **Marque `[P]`** apenas quando as tarefas tocam arquivos distintos e não dependem uma da
   outra. Duas tarefas no mesmo arquivo nunca são `[P]`.

5. **Escreva cada tarefa** com: identificador `T###`, verbo de ação, caminho exato do
   arquivo, e o `(FR-###)` que ela atende. Uma tarefa sem caminho de arquivo é vaga demais
   para ser executada.

6. **Gere** o grafo de dependências e os lotes de execução paralela.

7. **Grave** em `specs/###-nome/tasks.md`.

8. **Relate** total de tarefas, contagem por fase, oportunidades de paralelismo, e a
   verificação de que todo `FR-###` tem cobertura.

## Restrições

- Não implemente. Este comando só planeja.
- Tarefa cujo critério de conclusão não é observável deve ser reescrita ou quebrada.
- Se o `plan.md` não existir, pare e instrua a rodar `/speckit:plan`.
