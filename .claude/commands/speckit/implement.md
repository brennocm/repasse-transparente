---
description: Executa as tarefas do tasks.md respeitando dependências e a constituição.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Escopo da execução: $ARGUMENTS (se vazio, execute a próxima fase pendente)

## Objetivo

Transformar tarefas em código, mantendo o rastro entre requisito, tarefa e arquivo, e sem
violar a constituição em nenhum passo.

## Execução

1. **Leia** `tasks.md`, `plan.md`, `data-model.md`, `contracts/` e a constituição.

2. **Confirme os pré-requisitos.** Se `tasks.md` não existir, pare e instrua a rodar
   `/speckit:tasks`.

3. **Execute fase a fase**, respeitando o grafo de dependências:
   - tarefas de um mesmo lote `[P]` podem rodar juntas
   - fases nunca se sobrepõem: conclua a anterior antes de iniciar a seguinte
   - nas fases de teste, confirme que o teste **falha** antes de implementar o
     comportamento, e passa depois

4. **Marque cada tarefa como `[X]` em `tasks.md` imediatamente após concluí-la**, não em
   lote no final. O arquivo é o estado da execução.

5. **Ao terminar cada fase**, rode as verificações do projeto (`npm run test`,
   `npm run typecheck`, `npm run build` conforme aplicável) e reporte o resultado real,
   incluindo falhas.

6. **Ao encontrar contradição com a spec**, pare. Não decida sozinho: relate a contradição
   e proponha a emenda da spec.

7. **Relate** ao final: tarefas concluídas, pendentes, bloqueadas com o motivo, e o
   resultado das verificações.

## Restrições

- **Nunca** invente um requisito para desbloquear uma tarefa. Pare e pergunte.
- **Nunca** introduza chamada de rede em runtime, dependência de blockchain real, dado de
  entidade real, ou coleta de credencial. São violações constitucionais inegociáveis.
- **Nunca** altere `src/core/` para melhorar usabilidade. Ele é transliteração do contrato;
  conveniência vive em `src/adapter/`.
- Não relate sucesso sem ter rodado a verificação. Se um teste falhou, diga qual e mostre a
  saída.
