# Modelo de Dados — Fase 1

**Funcionalidade:** 001-repasse-transparente
**Data:** 2026-07-28

Toda quantia monetária é `bigint` em **centavos**. `number` para valor monetário é bug
(FR-007). Horários são `number` em milissegundos desde a época, para permitir semeadura
determinística.

---

## Tipos Base

```ts
/** Valor monetário em centavos. Nunca number. */
type Centavos = bigint;

/** Milissegundos desde a época. Determinístico na semeadura. */
type Instante = number;

/** Identificador estável de entidade. */
type Id = string;

/** Endereço simulado de participante — análogo a Pubkey na Solana. */
type Endereco = string; // formato "0x" + 40 hexadecimais
```

---

## Núcleo — espelham o contrato

### `ItemPreco`

Espelha a conta `ItemPreco` do programa Anchor.

| Campo | Tipo | Invariante |
|---|---|---|
| `nomeItem` | `string` | O contrato sempre grava `"Alimento/Insumo"` (MED-05). Preservado |
| `precoMediana` | `Centavos` | `> 0n` indica referência estabelecida |
| `ultimaAtualizacao` | `Instante` | Gravado, nunca lido pelo contrato (ALTA-02) |

### `EstadoPrograma`

Espelha o storage do contrato.

| Campo | Tipo | Nota |
|---|---|---|
| `gestor` | `Endereco` | Declarado, nunca usado pelo contrato (ALTA-01) |
| `toleranciaPercentual` | `bigint` | Inicia em `15n` (FR-010) |
| `fontesAutorizadas` | `Map<Endereco, boolean>` | Populado na gênese (CRIT-02) |
| `tabelaPrecos` | `Map<Id, ItemPreco>` | Chave equivale a `bytes32 itemId` |
| `cotacoesOraculo` | `Map<Id, Map<Endereco, Centavos>>` | Reporte mais recente por fonte |
| `listaFontes` | `Endereco[]` | Populado na gênese (CRIT-02) |

**Invariantes:**
- Recalcular referência exige ao menos 3 cotações (FR-002)
- `precoMediana === 0n` significa ausência de referência, não preço zero (FR-006)
- Uma fonte tem no máximo uma cotação vigente por item; reporte novo substitui o anterior

### `Evento`

União discriminada, equivalente aos `event` do contrato.

```ts
type Evento =
  | { tipo: 'PrecoReportado';     itemId: Id; fonte: Endereco; preco: Centavos }
  | { tipo: 'MedianaAtualizada';  itemId: Id; novaMediana: Centavos }
  | { tipo: 'RepasseAprovado';    repasseId: bigint; valorTotal: Centavos };
```

`RepasseAprovado.repasseId` é sempre `1n` no contrato original (ALTA-03). O núcleo emite
`1n`; o adaptador atribui o identificador real para uso da interface.

### `ErroPrograma`

Equivalente a um `revert`. Carrega a mensagem exata do `require` correspondente.

| Código | Mensagem do contrato | Origem |
|---|---|---|
| `FONTE_NAO_AUTORIZADA` | `Fonte nao autorizada` | `reportarPreco` |
| `MINIMO_TRES_FONTES` | `Minimo de 3 fontes requeridas` | `atualizarPrecoReferencia` |
| `SEM_PRECO_REFERENCIA` | `Sem preco de referencia` | `proporRepasse` |
| `ACIMA_DO_LIMITE` | `ALERTA: Valor acima do limite permitido!` | `proporRepasse` |
| `DIVISAO_POR_ZERO` | *panic 0x12* | `valorProposto / qtd` com `qtd === 0n` |

---

## Registro Encadeado

### `Registro`

| Campo | Tipo | Invariante |
|---|---|---|
| `numero` | `number` | Sequencial a partir de 0, sem lacuna |
| `horario` | `Instante` | Monotônico não-decrescente |
| `tipo` | `TipoRegistro` | ver abaixo |
| `autor` | `Endereco` | quem originou a operação |
| `dados` | `Record<string, unknown>` | serializável de forma estável |
| `hashAnterior` | `string` | hash do registro `numero - 1`; do gênese é 64 zeros |
| `hash` | `string` | `sha256(numero‖horario‖tipo‖autor‖serializar(dados)‖hashAnterior)` |
| `sucesso` | `boolean` | `false` para operação revertida (FR-013) |
| `motivoFalha` | `string \| null` | mensagem do `ErroPrograma` quando `sucesso === false` |

**Tipos de registro:** `Genese`, `FonteAutorizada`, `PrecoReportado`,
`MedianaAtualizada`, `RepasseProposto`, `RepasseAprovado`, `RepasseRejeitado`,
`EntregaConfirmada`, `DivergenciaRegistrada`.

**Invariantes:**
- Somente-anexação em operação normal (FR-016)
- `registro[n].hashAnterior === registro[n-1].hash` para todo `n > 0`
- Operação revertida também gera registro, com `sucesso: false` (FR-013)
- A serialização de `dados` ordena chaves alfabeticamente e converte `bigint` para string
  decimal, de modo que o hash seja reprodutível

### `ResultadoVerificacao`

```ts
type ResultadoVerificacao =
  | { integra: true; total: number }
  | { integra: false; total: number; primeiroInvalido: number; esperado: string; obtido: string };
```

Cobre FR-014. O modo de adulteração (FR-015) altera `dados` de um registro sem recalcular
o hash, o que faz o próprio registro falhar e propaga a falha para todos os subsequentes.

---

## Domínio da Aplicação

### `Municipio`

`id`, `nome`, `uf`, `populacao`, `totalEscolas`, `totalAlunos`,
`custoRefeicaoCentavos` — parâmetro declarado na interface, base da conversão de impacto
(FR-025).

### `Escola`

`id`, `municipioId`, `nome`, `alunos`, `refeicoesDia`, `bairro`.

### `Item`

`id`, `nome`, `unidade` (`kg` | `L` | `dz` | `un`), `categoria`, `perecivel`,
`descricao`. O preço vive no `EstadoPrograma`, não aqui — o item de domínio é catálogo.

### `Fonte`

| Campo | Tipo | Nota |
|---|---|---|
| `endereco` | `Endereco` | chave em `fontesAutorizadas` |
| `nome` | `string` | fictício |
| `categoria` | `'oficial' \| 'intermunicipal' \| 'sociedade-civil'` | seção 4 do PDF |
| `autorizada` | `boolean` | |
| `descricao` | `string` | explica a legitimidade da fonte ao leitor |

**Invariante de diversidade:** o conjunto semeado contém ao menos uma fonte de cada
categoria. É a mitigação do risco de colusão descrita na seção 7 do PDF.

### `Fornecedor`

`id`, `nome` (fictício), `cnpjFicticio`, `porte`. O CNPJ é sintaticamente válido e
semanticamente inexistente; nunca corresponde a empresa real (FR-046).

### `Repasse`

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `Id` | atribuído pelo adaptador, não pelo contrato |
| `itemId` | `Id` | |
| `fornecedorId` | `Id` | |
| `escolaId` | `Id` | |
| `quantidade` | `bigint` | em unidades do item |
| `valorTotal` | `Centavos` | |
| `precoUnitarioEfetivo` | `Centavos` | `valorTotal / quantidade`, divisão inteira (MED-03) |
| `medianaAplicada` | `Centavos` | congelada no momento da decisão |
| `limiteAplicado` | `Centavos` | `mediana + (mediana * tolerancia) / 100n` |
| `toleranciaAplicada` | `bigint` | congelada no momento da decisão |
| `situacao` | `SituacaoRepasse` | ver máquina de estados |
| `motivoRejeicao` | `string \| null` | |
| `criadoEm` | `Instante` | |
| `registros` | `number[]` | números dos registros da cadeia relacionados |

**Por que congelar mediana, limite e tolerância:** a referência muda ao longo do tempo. Um
repasse decidido em março precisa ser auditável contra a referência de março, não contra a
atual. Sem esse congelamento, o histórico se torna irreproduzível.

### Máquina de estados de `SituacaoRepasse`

```
                    ┌──────────────┐
                    │   Proposto   │
                    └──────┬───────┘
                 avaliação pela trava
              ┌────────────┴────────────┐
              ▼                         ▼
      ┌───────────────┐         ┌───────────────┐
      │   Rejeitado   │         │    Retido     │
      │   (terminal)  │         │  (aprovado,   │
      └───────────────┘         │  não pago)    │
                                └───────┬───────┘
              confirmação do Conselho — quórum de 2
                     ┌──────────────────┴─────────────────┐
                     ▼                                    ▼
             ┌───────────────┐                   ┌────────────────┐
             │   Liberado    │                   │  Divergente    │
             │  (terminal)   │                   │ (retido, com   │
             └───────────────┘                   │  ocorrência)   │
                                                 └────────┬───────┘
                                                     resolução
                                                          ▼
                                                   Liberado | Rejeitado
```

**Transições permitidas:**

| De | Para | Gatilho | Requisito |
|---|---|---|---|
| `Proposto` | `Rejeitado` | preço acima do limite, ou item sem referência | FR-005, FR-006 |
| `Proposto` | `Retido` | preço dentro do limite | FR-005, FR-037 |
| `Retido` | `Retido` | 1ª confirmação — contador sobe, valor não se move | FR-038 |
| `Retido` | `Liberado` | 2ª confirmação — quórum atingido, BRZ vai ao fornecedor | FR-038 |
| `Retido` | `Divergente` | divergência registrada pelo Conselho | FR-039 |
| `Divergente` | `Liberado` \| `Rejeitado` | resolução da ocorrência | FR-039 |

`Rejeitado` e `Liberado` são terminais. Nenhuma transição sai de `Rejeitado` — a tentativa
permanece no histórico (FR-013).

**Estado sem saída (CRIT-03).** `Retido` não tem transição de devolução: o programa não
possui instrução capaz de mover o BRZ da custódia de volta à prefeitura. Um repasse cujo
quórum nunca se complete permanece em `Retido` **para sempre**, com o valor imobilizado.
Isso não é modelagem incompleta — é fidelidade a um defeito do programa, e a interface
precisa nomeá-lo (FR-044).

### `ContaRepasse` — espelha a conta on-chain

| Campo | Tipo | Nota |
|---|---|---|
| `fornecedor` | `Endereco` | destinatário do BRZ ao atingir o quórum |
| `valor` | `Centavos` | montante custodiado |
| `quantidade` | `bigint` | |
| `liberado` | `boolean` | terminal: uma vez `true`, `confirmar_entrega` reverte |
| `confirmacoes` | `number` | **contador puro, sem registro de quem confirmou (CRIT-02)** |

**Invariante que o programa NÃO garante:** `confirmacoes` deveria contar partes distintas.
Como não há registro de identidade, a mesma carteira pode incrementá-lo duas vezes. O
adaptador impõe unicidade em uso normal; o núcleo não (FR-057, FR-058).

### Saldos de BRZ

`Map<Endereco, Centavos>` sobre três contas relevantes: a da prefeitura, a de custódia
(`CONTA_CUSTODIA`, análoga à PDA `b"custodia"`) e a de cada fornecedor.

**Invariante de conservação (FR-041):** a soma dos saldos é constante em toda operação.
Valor não é criado nem destruído, apenas transferido. Uma operação que altere o total é bug.

**Invariante de ordem (FR-039):** a transferência ocorre **depois** de todos os `require!`.
Uma proposta rejeitada deixa os saldos intactos.

### `Entrega`

`repasseId`, `escolaId`, `situacao` (`pendente` | `confirmada` | `divergente`),
`prazoLimite`, `confirmadoPor`, `confirmadoEm`, `descricaoDivergencia`.

`confirmadoPor` existe apenas na camada adaptadora — é a informação que o programa deixou
de registrar, e que a v0.2 precisa gravar on-chain.

**Invariante:** existe uma `Entrega` para cada `Repasse` em `Retido` ou posterior, e
nenhuma para `Rejeitado`. Pendência com `prazoLimite` no passado é destacada como vencida
(FR-040).

### `Perfil`

| Campo | Tipo |
|---|---|
| `id` | `Id` |
| `papel` | `'gestor' \| 'oraculo' \| 'conselho' \| 'controle'` |
| `nome` | `string` fictício |
| `cargo` | `string` |
| `instituicao` | `string` fictícia |
| `endereco` | `Endereco` |
| `escolaId` | `Id \| null` — apenas para `conselho` |
| `permissoes` | `Permissao[]` |

**Matriz de permissões** (FR-021):

| Permissão | gestor | oraculo | conselho | controle |
|---|:--:|:--:|:--:|:--:|
| `propor_repasse` | ✅ | | | |
| `reportar_cotacao` | | ✅ | | |
| `atualizar_referencia` | | ✅ | | |
| `confirmar_entrega` | | | ✅ | |
| `registrar_divergencia` | | | ✅ | |
| `ver_alertas` | ✅ | | ✅ | ✅ |
| `ver_painel_publico` | ✅ | ✅ | ✅ | ✅ |

O painel público também é acessível sem perfil algum (FR-023).

### `Sessao`

`perfilId`, `iniciadaEm`, `versaoEstado`. Persistida em `localStorage`. Nunca contém
credencial (FR-018).

---

## Estado Persistido

```ts
interface EstadoPersistido {
  versao: number;             // incrementar invalida o estado anterior
  contrato: EstadoPrograma;
  repasses: Repasse[];
  entregas: Entrega[];
  cadeia: Registro[];
  sessao: Sessao | null;
  adulteracaoAtiva: boolean;  // FR-015
}
```

**Regra de migração:** `versao` diferente da esperada faz o estado ser descartado e
substituído pela semeadura, com aviso ao usuário. Não há tentativa de migração — o custo
não se justifica em um protótipo, e um estado meio-migrado durante o pitch é pior que um
estado limpo.

**Serialização:** `bigint` não sobrevive a `JSON.stringify`. O adaptador usa um par
replacer/reviver que converte `bigint` para `{"__bigint":"1234"}` na escrita e reconstrói
na leitura. Falha nesse par causa corrupção silenciosa de valores monetários — é o ponto
de maior risco da camada de persistência e precisa de teste dedicado.

---

## Derivações de Impacto

Calculadas em `adapter/impacto.ts`, nunca no núcleo.

| Métrica | Fórmula | Requisito |
|---|---|---|
| Valor bloqueado | `Σ (valorTotal − limiteAplicado × quantidade)` sobre os rejeitados | FR-024 |
| Refeições preservadas | `valorBloqueado / municipio.custoRefeicaoCentavos` | FR-025 |
| Alunos alcançados | `Σ escola.alunos` das escolas com ao menos um repasse | FR-024 |
| Dias de merenda | `refeicoesPreservadas / Σ escola.refeicoesDia` | FR-024 |
| Sobrepreço percentual | `(precoUnitarioEfetivo − medianaAplicada) × 100 / medianaAplicada` | FR-032 |

**Nota sobre "valor bloqueado":** é a diferença entre o que foi proposto e o teto que
teria sido aceitável, não o valor total da proposta rejeitada. Reportar o valor cheio
inflaria o impacto e seria desonesto — a compra legítima ainda precisaria ser feita pelo
preço justo. A interface explica essa definição junto ao número.
