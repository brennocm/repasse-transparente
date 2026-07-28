# Dados Semeados — Fase 1

**Funcionalidade:** 001-repasse-transparente
**Data:** 2026-07-28

Todo dado aqui é **fabricado** (Princípio I, FR-045, FR-046). Nenhum município, escola,
empresa ou pessoa corresponde a entidade real.

**Determinismo:** a semeadura não usa `Date.now()` nem geração aleatória. Todos os
horários derivam de `INSTANTE_BASE = 2026-02-02T09:00:00-03:00` por deslocamentos fixos.
Duas execuções produzem a mesma cadeia e os mesmos hashes — condição necessária para que a
verificação de integridade seja significativa.

---

## Município

| Campo | Valor |
|---|---|
| Nome | **Serra do Cedro** |
| Unidade federativa | **Vale Norte (VN)** — estado fictício |
| População | 78.400 |
| Escolas na rede | 12 |
| Alunos atendidos | 9.850 |
| Refeições servidas por dia | 14.450 |
| Custo de referência por refeição | **R$ 2,10** (`210` centavos) |

O estado é deliberadamente fictício. Um município inventado dentro de um estado real
convidaria à associação com localidades existentes; um estado inventado remove a
ambiguidade (FR-046).

**Sobre o custo por refeição:** é parâmetro de demonstração, exibido junto de toda métrica
derivada. Não é afirmação sobre o valor per capita oficial do PNAE (Premissa da spec).

---

## Escolas (12)

Nomes derivados de topônimos fictícios, evitando homenagem a pessoas — reduz a chance de
coincidência com instituição real.

| Id | Nome | Alunos | Refeições/dia |
|---|---|---:|---:|
| `esc-01` | EM Serra Azul | 1.340 | 1.875 |
| `esc-02` | EM Córrego Fundo | 1.060 | 1.475 |
| `esc-03` | EM Vila Nova do Cedro | 1.180 | 1.640 |
| `esc-04` | EM Jardim das Acácias | 940 | 1.305 |
| `esc-05` | EM Boa Fonte | 820 | 1.140 |
| `esc-06` | EM Alto da Pedreira | 740 | 1.030 |
| `esc-07` | EM Ribeirão Claro | 670 | 930 |
| `esc-08` | CMEI Girassol | 440 | 880 |
| `esc-09` | CMEI Bem-Me-Quer | 410 | 820 |
| `esc-10` | CMEI Pitangueira | 375 | 750 |
| `esc-11` | EM Morro Branco | 1.105 | 1.535 |
| `esc-12` | EM Campo Verde | 770 | 1.070 |
| | **Total** | **9.850** | **14.450** |

CMEIs servem duas refeições por aluno; escolas municipais, cerca de 1,4.

**Os totais do município são derivados desta tabela, nunca escritos à mão.** A primeira
versão deste documento trazia totais digitados que não fechavam com a soma das linhas — erro
de mil alunos, exatamente o tipo de detalhe que uma banca atenta encontra. `TOTAL_ALUNOS` e
`TOTAL_REFEICOES_DIA` agora são calculados a partir da lista, e há teste conferindo os dois.

---

## Itens da Merenda (10)

Preços de referência iniciais, em centavos. Plausíveis para 2026, porém fictícios.

| Id | Nome | Unidade | Mediana inicial | Limite (+15%) |
|---|---|---|---:|---:|
| `arroz-tipo-1` | Arroz tipo 1 | kg | 640 | 736 |
| `feijao-carioca` | Feijão carioca | kg | 890 | 1023 |
| `leite-uht` | Leite integral UHT | L | 520 | 598 |
| `banana-prata` | Banana prata | kg | 580 | 667 |
| `tomate` | Tomate | kg | 730 | 839 |
| `frango-file` | Filé de frango congelado | kg | 1240 | 1426 |
| `oleo-soja` | Óleo de soja 900ml | un | 790 | 908 |
| `farinha-trigo` | Farinha de trigo | kg | 460 | 529 |
| `ovos` | Ovos | dz | 1120 | 1288 |
| `cenoura` | Cenoura | kg | 490 | 563 |

**Conferir a aritmética inteira ao implementar.** O limite usa
`mediana + (mediana * 15n) / 100n` com truncamento, não arredondamento:

- `tomate`: `730 * 15 / 100 = 109` (não `109,5`) → limite `839`
- `oleo-soja`: `790 * 15 / 100 = 118` (não `118,5`) → limite `908`
- `banana-prata`: `580 * 15 / 100 = 87` → limite `667`

Se algum desses limites divergir na implementação, o núcleo não está truncando e o
FR-004 está violado.

---

## Fontes Oraculares (5)

A diversidade institucional exigida pela seção 7 do PDF está satisfeita: duas oficiais, uma
intermunicipal, duas de sociedade civil. Nenhuma categoria isolada forma maioria.

| Endereço | Nome | Categoria |
|---|---|---|
| `0xA1...01` | Central de Abastecimento do Vale Norte | oficial |
| `0xA2...02` | Observatório de Preços — Universidade Estadual do Vale Norte | oficial |
| `0xB1...03` | Consórcio Intermunicipal de Compras da Região do Cedro | intermunicipal |
| `0xC1...04` | Cooperativa Agrofamiliar Serra Verde | sociedade-civil |
| `0xC2...05` | Associação de Produtores Rurais de Boa Fonte | sociedade-civil |

Todas autorizadas no estado de gênese (ver CRIT-02 em `research.md`).

### Cotações vigentes — exemplo do `leite-uht`

| Fonte | Cotação |
|---|---:|
| Central de Abastecimento | 498 |
| Observatório Universitário | 512 |
| Consórcio Intermunicipal | 520 |
| Cooperativa Agrofamiliar | 528 |
| Associação de Produtores | 545 |

Ordenado: `[498, 512, 520, 528, 545]` · `arr[5/2] = arr[2] = 520` → **mediana 520**.
Média aritmética: `2603 / 5 = 520`. Neste conjunto honesto, praticamente idênticas — é
exatamente o que a interface deve mostrar antes de introduzir a fonte comprometida.

**Cenário de manipulação, para a demonstração do FR-034:** substituindo a cotação da
Associação por `5000`, o conjunto vira `[498, 512, 520, 528, 5000]`. A mediana permanece
**520**; a média salta para **1411** (`7058 / 5`, truncado), elevando o limite de 598 para
**1622**. Uma fonte corrompida em cinco multiplicaria o teto por 2,7 sob média — e não move
a mediana em nada.

Cada item recebe cotações das 5 fontes, com dispersão entre −6% e +6% da mediana alvo, e
três atualizações históricas ao longo dos meses para alimentar a série temporal do FR-028.

---

## Fornecedores (5)

| Id | Nome | Porte |
|---|---|---|
| `for-01` | Distribuidora Vale Alimentos LTDA | médio |
| `for-02` | Atacadão Cedro Norte LTDA | grande |
| `for-03` | Comercial Bom Prato ME | pequeno |
| `for-04` | Hortifruti Boa Fonte EIRELI | pequeno |
| `for-05` | Cooperativa Agrofamiliar Serra Verde | pequeno |

**CNPJ:** exibido no formato brasileiro, com **dígitos verificadores deliberadamente
inválidos**. Um CNPJ sintaticamente válido poderia coincidir com empresa real, o que o
FR-046 proíbe. A página de detalhe do fornecedor declara que o número é fictício e inválido
por desenho.

---

## Perfis de Acesso (4)

Pessoas fictícias, instituições fictícias.

| Papel | Nome | Cargo | Instituição |
|---|---|---|---|
| `gestor` | Helena Braga | Nutricionista-chefe | Secretaria Municipal de Educação de Serra do Cedro |
| `oraculo` | Rafael Nunes | Analista de preços | Central de Abastecimento do Vale Norte |
| `conselho` | Cláudia Ferraz | Presidente do CAE | Conselho de Alimentação Escolar — EM Serra Azul (`esc-01`) |
| `controle` | Otávio Lins | Promotor de justiça | Ministério Público do Vale Norte |

---

## Repasses Semeados (40)

**Valores derivados da semeadura**, não digitados. Os 35 aprovados são gerados
deterministicamente: preço unitário entre 71% e 99% do limite de cada item, quantidades
plausíveis para uma rede de 12 escolas, ciclando itens, fornecedores e escolas. Todos passam
pela trava por construção.

| Situação | Quantidade | Valor total |
|---|---:|---:|
| Liberado | 28 | R$ 419.799,00 |
| Retido — 3 no prazo, 3 vencidos | 6 | R$ 92.105,00 |
| Divergente | 1 | R$ 40.640,00 |
| **Rejeitado** | **5** | **R$ 670.000,00** |
| **Total proposto** | **40** | **R$ 1.222.544,00** |

**Saldo inicial da prefeitura:** R$ 2.000.000,00 em BRZ. Após a semeadura: R$ 1.447.456,00
na prefeitura, R$ 132.745,00 em custódia, R$ 419.799,00 com os fornecedores. A soma é
constante — valor não é criado nem destruído (FR-041).

### As cinco rejeições

Carregam a demonstração. Os números precisam bater exatamente.

| # | Item | Fornecedor | Qtd | Valor proposto | Unit. efetivo | Limite | Sobrepreço | Valor bloqueado |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Leite integral UHT | Vale Alimentos | 40.000 L | R$ 396.000,00 | 990 | 598 | **+90%** | **R$ 156.800,00** |
| 2 | Feijão carioca | Atacadão Cedro Norte | 8.000 kg | R$ 96.000,00 | 1200 | 1023 | +34% | R$ 14.160,00 |
| 3 | Óleo de soja | Vale Alimentos | 6.000 un | R$ 66.000,00 | 1100 | 908 | +39% | R$ 11.520,00 |
| 4 | Tomate | Hortifruti Boa Fonte | 3.000 kg | R$ 33.000,00 | 1100 | 839 | +50% | R$ 7.830,00 |
| 5 | Filé de frango | Comercial Bom Prato | 5.000 kg | R$ 79.000,00 | 1580 | 1426 | +27% | R$ 7.700,00 |
| | | | | **R$ 670.000,00** | | | | **R$ 198.010,00** |

**Verificação da linha 1**, que é o caso destaque da landing:

```
precoEfetivoUnitario = 39_600_000 / 40_000            = 990
limiteMaximo         = 520 + (520 * 15) / 100         = 598
990 > 598                                             → ACIMA_DO_LIMITE
sobrepreco           = (990 - 520) * 100 / 520        = 90 %
valorBloqueado       = 39_600_000 - (598 * 40_000)    = 15_680_000  → R$ 156.800,00
refeicoes            = 15_680_000 / 210               = 74_666
```

**Definição de "valor bloqueado":** diferença entre o proposto e o teto aceitável, **não** o
valor cheio da proposta. A compra legítima ainda precisaria ser feita pelo preço justo;
reportar os R$ 396.000,00 inteiros como economia seria desonesto. A interface explica a
definição ao lado do número (FR-025, `data-model.md`).

---

## Números da Landing

| Indicador | Valor |
|---|---:|
| Valor bloqueado | **R$ 198.010,00** |
| Refeições preservadas | **94.290** |
| Alunos alcançados | **9.850** |
| Dias de merenda para toda a rede | **6,5** |
| Rastreabilidade dos repasses | **100%** |

**Regra de cálculo agregado:** as refeições preservadas do agregado são calculadas a partir
do **total em centavos** (`19_801_000 / 210 = 94_290`), e não somando os valores já
truncados de cada rejeição (que dariam `94_287`). Truncar uma vez, no fim. Divergência
entre a soma dos cartões e o total é erro de implementação.

---

## Cadeia Semeada

Ordem de geração, para que a cadeia seja plausível:

1. `Genese` — parâmetros do município e tolerância de 15%
2. 5 × `FonteAutorizada` — uma por fonte
3. Para cada item, em ordem cronológica ao longo dos meses:
   - N × `PrecoReportado` — uma por fonte, com deslocamento de horário
   - 1 × `MedianaAtualizada`
4. Para cada repasse, em ordem cronológica:
   - `RepasseProposto`
   - `RepasseAprovado` (`sucesso: true`) ou `RepasseRejeitado` (`sucesso: false`, com o
     texto exato do `require`)
5. Para os repasses confirmados: `EntregaConfirmada`
6. Para o divergente: `DivergenciaRegistrada`

Volume efetivo: **354 registros**. Suficiente para o explorador parecer um sistema em
operação, e pequeno o bastante para a verificação de integridade rodar instantaneamente.

**Horários estritamente não-decrescentes.** A cadeia exige isso, e a primeira versão da
semeadura violava a regra em dois pontos: as cotações começavam antes das autorizações de
fonte terminarem, e a confirmação de entrega de um repasse caía depois da proposta do
seguinte. As cotações passaram a começar um dia após a base, e as confirmações ocorrem em
D+1 e D+2, dentro da janela de três dias que separa dois repasses.

---

## Verificações Antes de Publicar

Obrigatórias. Constam também do `quickstart.md`.

- [ ] "Serra do Cedro" não corresponde a município brasileiro existente
- [ ] "Vale Norte" não corresponde a unidade federativa existente
- [ ] Nenhum nome de fornecedor corresponde a empresa real
- [ ] Nenhum nome de pessoa corresponde a figura pública
- [ ] Todos os CNPJ têm dígito verificador inválido
- [ ] Nenhuma instituição real aparece como autora de dado fabricado
- [ ] Instituições reais citadas aparecem apenas em texto descritivo da arquitetura
