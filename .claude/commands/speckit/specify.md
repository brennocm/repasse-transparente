---
description: Cria a especificação de uma funcionalidade a partir de uma descrição em linguagem natural.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Descrição da funcionalidade: $ARGUMENTS

## Objetivo

Transformar uma descrição informal em uma especificação que descreve **o quê** e **por
quê**, testável por quem nunca leu o código, e livre de decisões de tecnologia.

## Execução

1. **Determine o diretório.** Encontre o maior prefixo `###` em `specs/` e use o próximo
   número, com um nome-curto derivado da descrição: `specs/###-nome-curto/`.

2. **Leia** `.specify/memory/constitution.md` e `.specify/templates/spec-template.md`.

3. **Escreva** `specs/###-nome-curto/spec.md` seguindo o template.

4. **Priorize as histórias de usuário.** P1 é o que, sozinho, já justifica a existência da
   funcionalidade. Cada história precisa de um teste independente — se duas histórias não
   podem ser validadas separadamente, provavelmente são uma só.

5. **Marque toda ambiguidade** como `[NECESSITA ESCLARECIMENTO: pergunta específica]`.
   Áreas onde palpites costumam se disfarçar de requisito: perfis de acesso e permissões,
   retenção e volume de dados, comportamento em erro, limites de desempenho, integrações
   externas, conformidade regulatória.

6. **Escreva critérios de sucesso mensuráveis** e independentes de tecnologia. "Rápido" não
   é critério; "resposta em menos de 200ms no percentil 95" é. "Fácil de usar" não é;
   "usuário novo conclui sem ajuda em menos de 3 minutos" é.

7. **Relate** o caminho do arquivo criado, as histórias por prioridade, e a lista de
   esclarecimentos pendentes.

## Restrições

- **Nenhuma tecnologia na spec.** Sem framework, biblioteca, banco, endpoint, esquema,
  nome de classe ou arquivo. Se você escreveu "React" ou "tabela", está no documento errado.
- Requisito que não pode ser verificado por observação externa deve ser reescrito.
- Não implemente nada. Este comando só produz a spec.
