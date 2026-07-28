# Especificação de Funcionalidade: [NOME]

**Branch:** `[###-nome-curto]`
**Criada em:** [DATA]
**Status:** Rascunho
**Entrada:** "[descrição original do usuário]"

---

## Diretrizes de Preenchimento

- Descreva **o quê** e **por quê**. Nunca **como**.
- Proibido nesta camada: nome de framework, biblioteca, banco, endpoint, esquema, classe.
- Ambiguidade vira `[NECESSITA ESCLARECIMENTO: pergunta específica]`. Nunca um palpite.
- Todo requisito precisa ser testável por alguém que não leu o código.
- Remova esta seção antes de considerar a spec pronta.

---

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 — [título] (Prioridade: P1)

[Descrição em uma ou duas frases, na voz do usuário.]

**Por que esta prioridade:** [o que se perde se ela não existir]

**Teste independente:** [como validar esta história isoladamente, sem as demais]

**Cenários de aceitação:**

1. **Dado** [estado inicial], **quando** [ação], **então** [resultado observável]
2. **Dado** [...], **quando** [...], **então** [...]

---

### História de Usuário 2 — [título] (Prioridade: P2)

[idem]

---

### Casos de Borda

- O que acontece quando [condição limite]?
- Como o sistema responde a [entrada inválida]?

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: O sistema DEVE [capacidade observável]
- **FR-002**: O sistema DEVE [...]
- **FR-003**: Usuários DEVEM conseguir [...]

*Exemplo de marcação de ambiguidade:*

- **FR-00X**: O sistema DEVE reter registros por [NECESSITA ESCLARECIMENTO: período não
  informado]

### Requisitos Não-Funcionais

- **NFR-001**: [desempenho, acessibilidade, disponibilidade — sempre com número]

### Entidades-Chave *(se a funcionalidade envolve dados)*

- **[Entidade]**: o que representa, seus atributos conceituais, com quem se relaciona

## Critérios de Sucesso *(obrigatório)*

Mensuráveis e independentes de tecnologia. Descrevem resultado, não implementação.

- **SC-001**: [ex.: usuário conclui a tarefa em menos de 3 minutos na primeira tentativa]
- **SC-002**: [ex.: 100% das propostas acima da tolerância são bloqueadas]

## Premissas

- [decisão tomada na ausência de informação, e sua justificativa]

## Fora de Escopo

- [o que explicitamente não será feito, para evitar expansão silenciosa]

## Dependências

- [pré-requisito externo ou de outra funcionalidade]
