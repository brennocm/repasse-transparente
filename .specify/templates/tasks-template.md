# Tarefas: [NOME]

**Entrada:** documentos de design em `specs/[###-nome]/`
**Pré-requisitos:** `plan.md`, `spec.md`

## Convenções

- `[P]` — paralelizável: arquivo distinto, sem dependência de outra tarefa `[P]` do mesmo bloco
- Toda tarefa cita o requisito que atende: `(FR-###)`
- Toda tarefa nomeia o caminho exato do arquivo que cria ou altera
- Uma tarefa que não pode ser verificada não é uma tarefa

---

## Fase 1 — Fundação

- [ ] **T001** [P] [descrição] em `caminho/do/arquivo` (FR-###)
- [ ] **T002** [P] [...]

## Fase 2 — Testes Primeiro

*Escreva os testes e confirme que falham antes de implementar.*

- [ ] **T00X** [P] Teste de [comportamento] em `caminho/do/teste` (FR-###)

## Fase 3 — Núcleo

- [ ] **T0XX** [...]

## Fase 4 — Interface

- [ ] **T0XX** [...]

## Fase 5 — Polimento

- [ ] **T0XX** [...]

---

## Grafo de Dependências

```
T001 ──┬── T003
T002 ──┘
```

## Exemplos de Execução Paralela

```
Lote 1 (independentes): T001, T002, T004
Lote 2 (após lote 1):   T005, T006
```

## Critérios de Pronto

- [ ] Todos os `FR-###` da spec têm ao menos uma tarefa
- [ ] Todos os testes passam
- [ ] Checagem Constitucional revalidada
- [ ] `quickstart.md` executado de ponta a ponta com sucesso
