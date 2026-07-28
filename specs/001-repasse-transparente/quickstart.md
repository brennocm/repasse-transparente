# Quickstart — Verificação Manual

**Funcionalidade:** 001-repasse-transparente

Roteiro executado por uma pessoa, do zero, antes de considerar qualquer onda concluída.
Cada passo tem resultado esperado verificável.

---

## Preparar

```bash
npm install
npm run test      # suíte do núcleo — precisa estar verde antes de qualquer outra coisa
npm run dev       # http://localhost:3000
```

**Esperado:** todos os testes passam. Se `sha256` ou `calcularMediana` falharem, pare — a
cadeia inteira e todas as decisões de aprovação estão comprometidas.

---

## 1 · Landing (US1)

1. Abra `/` em janela anônima, com a janela em **360px** de largura.
2. Confira: nome do projeto, frase do que faz, três números de impacto, dois caminhos de
   acesso rotulados.
3. Confira a faixa de ambiente de demonstração, visível sem rolar.
4. Role até o fim procurando a declaração de que a execução é simulada.

**Esperado:** os números são R$ 198.010,00 bloqueados, 94.290 refeições preservadas e
9.850 alunos alcançados. Nenhuma rolagem horizontal. Compreensível em 60 segundos
(SC-001).

---

## 2 · Painel Público sem Login (US4)

1. Vá a `/transparencia` sem autenticar.
2. Confira os seis indicadores.
3. Filtre por situação **Rejeitado**.
4. Confira que os indicadores se recalculam para o recorte.
5. Abra o repasse de **Leite integral UHT** de 40.000 L.

**Esperado:** o filtro devolve 5 repasses. O detalhe mostra preço proposto 990, mediana
520, limite 598, sobrepreço +90%, valor preservado R$ 156.800,00 e 74.666 refeições. As
cinco cotações que formaram a mediana aparecem com o nome de cada fonte.

---

## 3 · Acesso por Perfil (US2)

1. Vá a `/entrar`.
2. Confira os quatro cartões de perfil com nome, cargo e instituição.
3. **Confira que não existe nenhum campo de senha, de e-mail ou de CPF.**
4. **Confira que nenhuma marca do gov.br, UNICEF ou TransfereGov aparece.**
5. Entre como **Helena Braga** (gestor).
6. Recarregue a página.
7. Digite `/plataforma/oraculo` diretamente na barra de endereço.

**Esperado:** após entrar, nome e instituição aparecem no cabeçalho. Recarregar mantém a
sessão. A rota do oráculo exibe uma **explicação** de qual perfil tem acesso — não um
redirecionamento silencioso nem um erro genérico (FR-021).

**Se qualquer item de 3 ou 4 falhar, isso é violação constitucional. Pare e corrija antes
de publicar.**

---

## 4 · A Trava Bloqueando (US3) — o passo mais importante

1. Como gestor, vá a `/plataforma/gestor/nova-proposta`.
2. Escolha **Leite integral UHT**, qualquer fornecedor, qualquer escola.
3. Quantidade `40000`, valor total `396000,00`.
4. **Antes de enviar**, observe o painel de previsão.
5. Envie.
6. Agora corrija o valor total para `230000,00` e envie de novo.

**Esperado:**
- A previsão mostra unitário efetivo R$ 9,90, mediana R$ 5,20, tolerância 15%, limite
  R$ 5,98, diferença +90% e situação prevista **bloqueado**, tudo antes do envio (FR-031).
- O envio é rejeitado com o identificador do programa — `Erro::AcimaDoLimite` — a explicação
  em português claro, os quatro números e o impacto preservado.
- **A barra de custódia fica parada.** O saldo da prefeitura não muda: proposta bloqueada
  não move um centavo (FR-039).
- A segunda proposta, a R$ 5,75 por litro, é **aprovada**, e a barra anima o valor saindo da
  prefeitura para a custódia. Entra como **retida**, não como paga (FR-037).

Repita com quantidade `0`: a interface barra antes de chegar ao núcleo (FR-030).

---

## 5 · Oráculo e Mediana (US5)

1. Saia e entre como **Rafael Nunes** (oráculo).
2. Reporte cotação de `500,00` para o leite.
3. Observe a mediana.
4. Agora reporte `5000,00` — valor absurdo.
5. Observe a mediana de novo e o comparativo com a média.

**Esperado:** a mediana praticamente não se move com o valor absurdo, enquanto a média
salta. A cotação discrepante é sinalizada. O comparativo mostra os dois números lado a
lado (FR-034).

6. Escolha um item com menos de três cotações e tente recalcular a referência.

**Esperado:** a ação está desabilitada com explicação, e não um erro após o clique
(FR-002).

---

## 6 · Integridade da Cadeia (US6)

1. Vá a `/explorador`.
2. Acione **Verificar integridade**.
3. Confira que a rejeição do leite aparece na lista, com situação de falha e motivo.
4. Acione **Demonstrar adulteração** em um registro do meio da cadeia.
5. Verifique a integridade novamente.
6. Acione **Restaurar**.

**Esperado:** a primeira verificação diz íntegra. Após a adulteração, a verificação aponta
o **número exato** do registro alterado como primeiro inválido, mostrando hash esperado
contra obtido, e sinaliza os subsequentes. A restauração volta ao estado íntegro (SC-004).

Confira também a nota explicando que encadeamento por hash prova integridade, não
descentralização.

---

## 7 · Conselho, Quórum e Liberação (US7)

1. Entre como **Cláudia Ferraz** (conselho).
2. Confira as entregas pendentes da EM Serra Azul, com destaque para as vencidas.
3. Confirme uma entrega **uma vez**.
4. Tente confirmar a mesma entrega de novo, pelo mesmo perfil.
5. Em outra entrega, registre divergência.

**Esperado:** a primeira confirmação move o marcador para `●○ 1 de 2` e **não** libera o
valor — a barra de custódia não se mexe. A segunda tentativa pelo mesmo perfil é **recusada
pela aplicação**, com explicação de que o quórum exige partes distintas (FR-058). A
divergência mantém o valor retido e abre ocorrência no painel público (FR-043).

Confira também que uma pendência vencida nomeia a consequência: o programa não tem instrução
de devolução, então o valor permanece imobilizado (FR-044, CRIT-03).

---

## 8 · Programa e Auditoria (US8)

1. Vá a `/programa`.
2. Confira o código Anchor/Rust da proposta com realce.
3. Confira o bloco do que a migração de Solidity para Anchor **corrigiu**.
4. Confira a tabela de divergências abertas por severidade.
5. Acione **Demonstrar a falha de quórum**: confirme a mesma entrega duas vezes pela mesma
   parte.

**Esperado:** as três críticas (CRIT-01, CRIT-02, CRIT-03) aparecem com impacto e proposta
para a v0.2. A demonstração libera o valor ao fornecedor com uma única parte confirmando —
e a tela declara, **antes e depois**, que é falha conhecida com correção proposta, não
comportamento pretendido (FR-057, FR-058).

---

## 9 · Offline (Princípio III)

1. Com o site carregado, abra as ferramentas de desenvolvedor e ative o modo offline.
2. Navegue por todas as rotas.
3. Proponha um repasse.

**Esperado:** tudo funciona. Nenhuma requisição de rede na aba Network após o carregamento
inicial (SC-005).

---

## 10 · Responsividade e Acessibilidade

1. Percorra as rotas em 360px, 768px e 1440px.
2. Navegue a aplicação inteira **apenas com o teclado**.
3. Confira que aprovado, rejeitado e pendente são distinguíveis em escala de cinza.

**Esperado:** sem rolagem horizontal do corpo em nenhuma largura. Foco sempre visível.
Situação legível sem cor (NFR-002, NFR-004, FR-029).

### Medir 360px sem cair na armadilha do headless

O Chrome headless **fixa a viewport em 500px no mínimo**. `--window-size=360` renderiza a
500 e recorta a captura para 360: a imagem parece estourada quando não está, e esconde
estouros reais quando existem. Medir de verdade exige um iframe de 360px dentro de uma
página mais larga.

Sirva a saída estática e abra esta sonda:

```html
<!-- probe.html, dentro de out/ -->
<!doctype html><body style="margin:0">
<div id=o style="font:12px monospace"></div>
<iframe id=f src="/" style="width:360px;height:900px;border:0"></iframe>
<script>
f.onload = () => {
  const d = f.contentDocument, w = f.contentWindow;
  o.textContent = 'scrollWidth=' + d.documentElement.scrollWidth
    + ' innerWidth=' + w.innerWidth
    + ' ESTOURA=' + (d.documentElement.scrollWidth > w.innerWidth);
};
</script>
```

```bash
npm run build && (cd out && python3 -m http.server 8901 &)
google-chrome --headless --disable-gpu --no-sandbox \
  --window-size=900,1000 --virtual-time-budget=4000 \
  --dump-dom http://127.0.0.1:8901/probe.html | grep -o 'scrollWidth[^<]*'
```

**Esperado:** `ESTOURA=false` em toda rota. Apagar `probe.html` de `out/` antes de
publicar.

---

### Armadilha do espaço inseparável

`formatarReais` separa o símbolo do valor com `\u00A0`, não com espaço comum. Um teste que
procure `"R$ 198.010,00"` digitado normalmente **falha mesmo com o valor correto na tela**.
Normalize antes de comparar:

```js
document.body.innerText.replace(/\u00A0/g, ' ')
```

Pelo mesmo motivo, `innerText` devolve o texto **renderizado**: os sobrescritos aparecem em
caixa alta porque o CSS os transforma. Compare sem diferenciar maiúsculas.

---

## 11 · Antes de Publicar

Lista de `mock-data.md`, obrigatória. **Verificada em 28/07/2026:**

- [X] "Serra do Cedro" não é município brasileiro existente — o IBGE registra Cedro (CE),
      Cedro (PE) e Cedro do Abaeté (MG), nenhum "Serra do Cedro"
- [X] "Vale Norte" não é unidade federativa existente
- [X] Nenhum fornecedor corresponde a empresa real — busca sem correspondência para
      Distribuidora Vale Alimentos, Atacadão Cedro Norte e Hortifruti Boa Fonte
- [X] Nenhum nome de pessoa corresponde a figura pública — são nomes comuns, sem
      correspondência com pessoa notória no domínio retratado
- [ ] Todos os CNPJ têm dígito verificador inválido
- [ ] Nenhuma instituição real aparece como autora de dado fabricado

E ainda:

- [ ] `npm run build` conclui sem erro nem aviso de tipo
- [ ] Nenhuma variável de ambiente é necessária
- [ ] O nome do projeto na hospedagem está fixado — a URL não mudará depois de divulgada

---

## Publicar

```bash
npm run build
```

Conecte o repositório à Vercel. Como a saída é estática, Cloudflare Pages, Netlify e
GitHub Pages funcionam sem alteração de código.

**Depois do deploy:** abra a URL pública em um celular real, em rede móvel, e refaça os
passos 1, 2 e 4. É como a banca vai encontrar o protótipo.
