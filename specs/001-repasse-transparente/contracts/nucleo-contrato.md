# Contrato de Interface — `src/core/`

**Regra soberana:** este módulo é transliteração do programa `repasse_transparente`
(Anchor/Rust), seção 5 de `RepasseTransparente_Proposta.docx`. É puro, síncrono, sem I/O,
sem React, sem conhecimento de escolas, refeições ou formatação. Qualquer decisão de
aprovação ou rejeição de repasse que exista fora daqui é violação do Princípio II.

**Estado:** implementado e verde na Fase 3. As 109 asserções de `tests/core/` são a
especificação executável; este documento é a visão de conjunto.

---

## Modelo de contas

| Tipo | Espelha | Nota |
|---|---|---|
| `ItemPreco` | conta `item_preco` | `atualizadoEm` gravado e nunca lido (ALTA-01) |
| `ContaRepasse` | conta `repasse` | `confirmacoes` sem registro de quem confirmou (CRIT-02) |
| `EstadoPrograma` | estado on-chain agregado | inclui `saldosBrz`, que simula as contas SPL |
| `CONTA_CUSTODIA` | PDA `b"custodia"` | valor sob controle do programa, não de uma parte |

Constantes do programa: `TOLERANCIA_PERCENTUAL = 15n`, `CONFIRMACOES_NECESSARIAS = 2`,
`MINIMO_FONTES = 3`.

---

## `mediana.ts`

### `calcularMediana(precos: readonly Centavos[]): Centavos`

`let mut ordenado = precos.clone(); ordenado.sort(); ordenado[ordenado.len() / 2]`

- **Não muta o parâmetro** — o programa clona antes de ordenar. A versão Solidity anterior
  ordenava no lugar; a migração mudou isso.
- **Divergência MED-01 preservada:** conjunto par devolve o central **superior**, não a
  média dos dois centrais. `[400, 500, 600, 700]` → `600`, não `550`.
- Vetor vazio lança `RangeError`; o guardião é o `require!(precos.len() >= 3)`.
- **Requisito:** FR-001

---

## `contrato.ts`

### `autorizarFonte(estado, fonte): void`

Marca a fonte como autorizada e a inclui em `listaFontes`. **Não emite evento** — quem
observa a rede apenas por eventos nunca vê uma nova fonte de verdade entrar no sistema.

- **Requisito:** FR-003

### `reportarPreco(estado, itemId, fonte, preco): EventoPrecoReportado`

- `require!(registro_fonte.autorizada)` → `Erro::FonteNaoAutorizada`
- Reporte novo substitui o anterior da mesma fonte
- **Divergência MED-02 preservada:** cotação zero é aceita
- **Requisitos:** FR-003, FR-008

### `atualizarPrecoReferencia(estado, itemId, precos, agora): EventoMedianaAtualizada`

- `require!(precos.len() >= 3)` → `Erro::FontesInsuficientes`
- `agora` substitui `Clock::get()?` — o núcleo é determinístico e não lê o relógio
- **Divergência CRIT-01 preservada:** calcula sobre o vetor recebido e **nunca lê**
  `cotacoesOraculo`. Cabe ao adaptador alimentar o vetor a partir das cotações registradas;
  o programa não impõe isso
- **Requisitos:** FR-001, FR-002, FR-008

### `calcularLimite(referencia, toleranciaPercentual): Centavos`

`referencia + (referencia * tolerancia) / 100n`, truncando. Sem efeito colateral e sem
decisão — extraída para que a interface exiba o limite antes do envio.

- **Requisitos:** FR-004, FR-031

### `proporRepasse(estado, repasseId, itemId, fornecedor, quantidade, valorProposto)`

Ordem idêntica à do programa — a sequência determina qual erro o usuário vê quando mais de
uma condição falha:

1. `require!(referencia > 0)` → `Erro::SemReferencia`
2. `checked_div(quantidade)` → `Erro::QuantidadeInvalida` se zero
3. `require!(preco_unitario <= limite)` → `Erro::AcimaDoLimite`
4. CPI `token::transfer`: prefeitura → custódia
5. grava a conta `repasse` e emite `RepasseAprovado`

- **A transferência acontece depois da trava.** Proposta rejeitada não move um centavo
- Fronteira exata: preço unitário **igual** ao limite aprova
- **Divergência MED-03 preservada:** `checked_div` trunca
- **Divergência MED-05:** nenhuma verificação de quem propõe
- **Requisitos:** FR-004, FR-005, FR-006, FR-008, FR-037, FR-039

### `confirmarEntrega(estado, repasseId): ResultadoConfirmacao`

- `require!(!repasse.liberado)` → `Erro::JaLiberado`
- Incrementa o contador; ao atingir o quórum, transfere custódia → fornecedor
- **Divergência CRIT-02 preservada:** não há parâmetro de confirmador, porque o programa
  não registra quem confirmou. A mesma parte atinge o quórum sozinha. O adaptador impede a
  repetição em uso normal; o modo de demonstração a exibe (FR-057, FR-058)
- **Divergência ALTA-02 preservada:** não emite evento. Devolve `ResultadoConfirmacao`, que
  deliberadamente **não** é um `Evento`
- **Divergência CRIT-03:** não existe caminho de devolução. Sem quórum, o valor fica preso
- **Requisitos:** FR-038, FR-040

### `saldoBrz(estado, conta): Centavos`

Leitura do saldo simulado. `transferirBrz` é interno e lança `Erro::SaldoInsuficiente` —
falha que viria do SPL Token Program, não do `repasse_transparente`.

- **Requisitos:** FR-040, FR-041

---

## `registro.ts`

### `serializarDados(dados): string`

Chaves ordenadas, tipo etiquetado, `bigint` em string decimal. A etiqueta de tipo evita
colisão entre valores distintos com a mesma representação textual — sem ela, `{v: 1}` e
`{v: "1"}` produziriam o mesmo hash.

### `calcularHash(registro: Omit<Registro, 'hash'>): string`

`sha256(numero ‖ horario ‖ tipo ‖ autor ‖ dados ‖ sucesso ‖ motivoFalha ‖ hashAnterior)`,
concatenado por `|`. `sucesso` e `motivoFalha` entram de propósito: sem eles, uma rejeição
poderia ser reescrita como aprovação sem quebrar a cadeia.

- **Requisito:** FR-012

### `anexar(cadeia, entrada): Registro[]`

Devolve uma **nova** cadeia. Não muta a recebida — somente-anexação (FR-016) fica garantida
por estrutura, não por convenção.

- **Requisitos:** FR-011, FR-012, FR-016

### `verificarIntegridade(cadeia): ResultadoVerificacao`

Verifica, em ordem, o encadeamento, a numeração e o hash recalculado. Devolve o **primeiro**
índice divergente. Cadeia vazia é íntegra por vacuidade.

- **Requisito:** FR-014

### `adulterarParaDemonstracao(cadeia, numero, novosDados): Registro[]`

Altera `dados` **sem** recalcular o hash. Devolve nova cadeia; a original permanece íntegra,
de modo que a restauração é sempre possível.

- **Requisito:** FR-015

---

## `sha256.ts`

### `sha256(mensagem: string): string`

64 hexadecimais minúsculos, entrada tratada como UTF-8. Vendorizado e síncrono —
`crypto.subtle` é assíncrono e contaminaria o núcleo com `Promise`.

Conformidade obrigatória contra vetores conhecidos, incluindo mensagem de 56 bytes (força
segundo bloco de preenchimento) e texto acentuado. Um SHA-256 sutilmente errado produziria
uma cadeia internamente consistente e externamente inverificável — o pior modo de falha
possível para este projeto.

---

## `erros.ts`

### `class ErroPrograma extends Error`

`message` é `Erro::<Variante>`, o identificador do programa. Cada erro carrega também
`explicacao` em português claro (Princípio IV) e `origem`, o `require!` exato que o dispara.

Exibir o identificador original ao lado da explicação é o que convence a banca técnica de
que a simulação é o programa, e não uma reimplementação livre.

| Variante | Origem |
|---|---|
| `FonteNaoAutorizada` | `reportar_preco` |
| `FontesInsuficientes` | `atualizar_preco_referencia` |
| `SemReferencia` | `propor_repasse` |
| `QuantidadeInvalida` | `propor_repasse`, `checked_div` |
| `AcimaDoLimite` | `propor_repasse` |
| `JaLiberado` | `confirmar_entrega` |
| `SaldoInsuficiente` | CPI `token::transfer` — não é variante do programa |

- **Requisito:** FR-032
