# Direção Visual — Fase 1

**Funcionalidade:** 001-repasse-transparente
**Data:** 2026-07-28
**Escopo:** define os tokens implementados em `src/app/globals.css` (T002). Toda tela das
Fases 6 a 9 deriva daqui. Divergir desta direção exige emendar este documento primeiro.

---

## Aterramento no assunto

**Produto:** conferência de preço de merenda escolar antes do pagamento.
**Público:** avaliadores do UNICEF Youth Challenge — parte técnica, parte de impacto social —
abrindo o link no celular, sem contexto.
**Trabalho da página:** fazer acreditar que dinheiro público da merenda pode ser travado
antes do desvio.

O mundo material do assunto não é o das criptomoedas. É o da **conferência**: a ficha de
recebimento na porta da cozinha, a tabela de preços afixada na parede da secretaria, a
planilha de cotação, o carimbo de conferido, a balança, a régua. O sistema é um servidor
público conferindo um número contra outro número — só que executado por código e visível
para qualquer cidadão.

A identidade visual sai daí, não de blockchain.

## Paleta

Seis valores nomeados, mais duas superfícies. Todos os contrastes foram medidos, não
estimados.

| Token | Hex | Papel | Aplicação |
|---|---|---|---|
| `papel` | `#F1F3EE` | — | fundo; branco com viés verde-frio |
| `placa` | `#E4E8DF` | — | superfície elevada, cabeçalho de tabela |
| `tinta` | `#14181A` | **15,99:1** | texto principal; preto de carbono, subtom frio |
| `grafite` | `#5A625E` | **5,62:1** | texto secundário |
| `indice` | `#1B3A57` | **10,50:1** | estrutura, links, navegação |
| `bloqueio` | `#A03328` | **6,27:1** | rejeitado; vermelho de carimbo, puxado ao sangue-de-boi |
| `liberado` | `#2E6A4F` | **5,71:1** | liberado; verde institucional |
| `retido` | `#8A5F14` | **5,04:1** | retido; ocre, dinheiro parado |
| `regua-forte` | `#748073` | 3,70:1 | bordas funcionais — mínimo 3:1 da WCAG 1.4.11 |
| `regua` | `#CBD2C7` | 1,38:1 | fios e marcas de régua; decorativo, nunca texto |

O fundo é deliberadamente **creme deslocado para o frio e o verde**. O creme quente
(`#F4F1EA`) com serifa de alto contraste e acento terracota é hoje o visual padrão de
página gerada por IA; o desvio para o verde-acinzentado evoca papel almaço e pasta de
processo, que é o material certo para este assunto.

Três estados de situação — bloqueio, liberado, retido — são **cores de carimbo**, não cores
de alerta de software. Todas passam AA sobre as duas superfícies. Nenhuma delas transmite
informação sozinha: sempre acompanhadas de ícone e rótulo (FR-029).

## Tipografia

**A decisão tipográfica é a oposição entre duas vozes**, ambas do sistema operacional —
custo zero de carregamento, exigido pelo Princípio III.

| Papel | Família | Uso |
|---|---|---|
| Voz do texto | pilha sans do sistema | prosa, títulos, rótulos, botões |
| Voz do dado | pilha mono do sistema | **todo número**: dinheiro, quantidade, percentual, hash, identificador, data |

A regra é literal: se é um número que alguém poderia conferir, é monoespaçado, com
`font-variant-numeric: tabular-nums` e alinhado à direita em coluna. Um valor em reais
nunca aparece em fonte proporcional.

Isso não é economia de bytes disfarçada de decisão. É o que uma ficha de conferência faz:
as colunas de número alinham na vertical para que o olho compare sem esforço. É também o
que torna a régua de tolerância legível — os três valores comparados precisam ocupar a
mesma largura por dígito.

**Escala:** `0.75 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.25 · 3 · 4rem`, com
entreletramento negativo crescente acima de 1.75rem e `font-weight` 600 nos títulos. Os
sobrescritos (eyebrows) são mono, caixa alta, `letter-spacing: 0.12em`.

## Layout

**Conceito: ficha de conferência.**

```
┌─────────────────────────────────────────────────────┐
│ ▌ SITUAÇÃO · eyebrow em mono caixa alta             │  ← trilho de 3px na borda
│ ▌                                                    │    esquerda, na cor da situação
│ ▌ Título do bloco                                   │
│ ▌ ─────────────────────────────────────────────     │  ← fio de régua
│ ▌ rótulo ................................  1.234,00 │  ← mono, alinhado à direita
│ ▌ rótulo ................................    598,00 │
└─────────────────────────────────────────────────────┘
```

Cada bloco carrega um **trilho de estado** na borda esquerda, como a aba colorida de uma
pasta de processo. Áreas de dado usam fios de régua entre linhas; áreas de prosa não usam
fio algum. Raio de canto mínimo (2px) — papel não tem canto arredondado, mas zero radius
somado a fios finos cairia no visual de jornal, que é outro padrão de IA a evitar.

Grade de coluna única até 768px, duas colunas acima. Sem colunas de jornal.

## Elemento assinatura

**A régua de tolerância.** Escala horizontal medida, desenhada com marcas de régua real,
onde o preço proposto ultrapassa fisicamente a linha do limite:

```
  R$ 0,00        mediana        limite                    proposta
  ├──┴──┴──┴──┴──┴──┼──┴──┴──┴──┼──┴──┴──┴──┴──┴──┴──┴──┴──▼
                    │  5,20     │  5,98                     9,90
                    └── faixa tolerada ──┘   ultrapassou em +90%
```

É a tese do projeto em uma imagem: existe um limite, e a proposta o excedeu de forma
mensurável. Aparece em toda rejeição, na previsão antes do envio e no detalhe do repasse.
É o que a banca vai lembrar.

### Elemento companheiro — a barra de custódia

A régua responde "o preço é justo?". A barra de custódia responde "onde está o dinheiro?".
São as duas perguntas do produto, e a segunda só existe desde a migração para liquidação em
BRZ.

```
  PREFEITURA              CUSTÓDIA               FORNECEDOR
  ████████████████░░░░    ░░░░████░░░░           ░░░░░░░░░░
  R$ 1.500.000,00         R$ 500.000,00          R$ 0,00
                          └─ retido ─┘
                          ●○  1 de 2 confirmações
```

Três colunas, uma por conta, com o valor movimentado destacado. Ao aprovar um repasse, o
montante desliza visivelmente da prefeitura para a custódia; ao atingir o quórum, da
custódia para o fornecedor. Quando a trava bloqueia, **nada se move** — e a imobilidade é o
ponto: a barra fica parada e a interface nomeia isso.

O marcador de quórum usa círculos preenchidos, não um número solto: `●○` comunica "falta
uma" sem exigir leitura.

Ela é subordinada à régua. Aparece no detalhe do repasse, no painel do conselho e no
resultado da proposta — nunca na landing, onde a régua sozinha carrega a tese.

Toda a ousadia do projeto é gasta nesses dois elementos. O resto — cartões, tabelas,
navegação — permanece disciplinado e silencioso.

## Movimento

Contido, e reservado aos dois elementos assinatura. A régua anima o ponteiro da proposta
deslizando até sua posição; a barra de custódia anima o montante migrando entre colunas.
Ambas uma única vez, na entrada, com `prefers-reduced-motion` respeitado.

Nada mais anima. O movimento aqui carrega significado — é o dinheiro andando — e perde esse
significado se tudo na página também se mexer. Efeitos espalhados são o que faz uma
interface parecer gerada automaticamente.

## O que foi deliberadamente evitado

| Padrão | Por quê |
|---|---|
| Creme quente + serifa de alto contraste + terracota | Visual padrão de IA; sem relação com o assunto |
| Fundo quase-preto com acento verde-ácido | Estética de painel de criptomoeda; o produto é serviço público |
| Fios capilares, raio zero, colunas de jornal | Terceiro padrão de IA; densidade de jornal não serve a leitura no celular |
| Número grande com rótulo pequeno e gradiente | O herói aqui é a régua, não um contador |
| Marcadores numerados `01 / 02 / 03` | Só onde há sequência real — o fluxo de três passos da landing a tem; em nenhum outro lugar |
| Azul `#3B82F6` do Tailwind | É o azul do PDF original e o padrão de todo painel administrativo |

## Piso de qualidade

Não anunciado na interface, apenas cumprido: responsivo de 360px a 2560px; foco de teclado
sempre visível, em `indice` com deslocamento de 2px; `prefers-reduced-motion` respeitado;
situação legível em escala de cinza; nenhum texto abaixo de 4,5:1.
