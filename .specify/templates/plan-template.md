# Plano de Implementação: [NOME]

**Branch:** `[###-nome-curto]` · **Spec:** `spec.md` · **Data:** [DATA]
**Entrada:** especificação em `specs/[###-nome]/spec.md`

## Resumo

[Uma ou duas frases: o que será construído e com qual abordagem técnica principal.]

## Contexto Técnico

| Item | Decisão |
|---|---|
| Linguagem / versão | [ou NECESSITA ESCLARECIMENTO] |
| Dependências principais | |
| Armazenamento | |
| Testes | |
| Plataforma alvo | |
| Tipo de projeto | |
| Metas de desempenho | |
| Restrições | |
| Escala | |

## Checagem Constitucional

*Portão obrigatório. Preenchido antes da Fase 0 e revalidado após a Fase 1.*

| Princípio | Conformidade | Observação |
|---|---|---|
| I. Dados fictícios rotulados | ✅ / ⚠️ / ❌ | |
| II. Simulação é transliteração | | |
| III. Zero dependência de rede | | |
| IV. Impacto em 30 segundos | | |
| V. Autenticação é cenografia | | |
| VI. Spec antes de código | | |
| VII. Responsivo e acessível | | |

**Violações:** [nenhuma / listar e justificar na tabela de Rastreamento de Complexidade]

## Estrutura do Projeto

```
[árvore de diretórios relevante — apenas o que esta funcionalidade cria ou toca]
```

## Fase 0 — Pesquisa

Saída: `research.md`

- Cada `NECESSITA ESCLARECIMENTO` do Contexto Técnico vira uma pergunta de pesquisa
- Cada decisão registra: **o que foi decidido**, **por quê**, **quais alternativas foram
  descartadas e por quê**

## Fase 1 — Design

Saídas: `data-model.md`, `contracts/`, `quickstart.md`

- Entidades, campos, invariantes e transições de estado
- Contratos de interface entre módulos
- Roteiro de verificação manual

## Fase 2 — Abordagem de Tarefas

*Descreve como `/speckit:tasks` deve gerar as tarefas. Não gera as tarefas aqui.*

- Ordem: modelo → testes → implementação → integração → polimento
- Marcar `[P]` tarefas paralelizáveis (arquivos distintos, sem dependência mútua)
- Cada tarefa cita o `FR-###` que atende

## Rastreamento de Complexidade

*Só preencher se a Checagem Constitucional acusou violação.*

| Violação | Por que é necessária | Alternativa mais simples rejeitada, e por quê |
|---|---|---|
| | | |

## Progresso

- [ ] Fase 0 — Pesquisa concluída
- [ ] Fase 1 — Design concluído
- [ ] Fase 2 — Abordagem de tarefas definida
- [ ] Checagem Constitucional inicial
- [ ] Checagem Constitucional pós-design
