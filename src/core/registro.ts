import { sha256 } from './sha256';
import {
  HASH_GENESE,
  type EntradaRegistro,
  type Registro,
  type ResultadoVerificacao,
  type ValorDado,
} from './tipos';

/**
 * Registro somente-anexação encadeado por SHA-256.
 *
 * Nota de honestidade que a interface precisa carregar: encadeamento por hash
 * prova **integridade**, não **descentralização**. Um operador único ainda pode
 * reescrever a cadeia inteira recalculando todos os hashes. O que impede isso em
 * blockchain real é a replicação entre validadores com interesses conflitantes.
 */

// ---------------------------------------------------------------------------
// Serialização estável
// ---------------------------------------------------------------------------

function etiquetar(valor: ValorDado): readonly [string, string] {
  if (valor === null) return ['n', ''];
  switch (typeof valor) {
    case 'bigint':
      return ['i', valor.toString(10)];
    case 'string':
      return ['s', valor];
    case 'boolean':
      return ['b', valor ? 'true' : 'false'];
    default:
      return ['f', String(valor)];
  }
}

/**
 * Serialização determinística: chaves ordenadas, tipo etiquetado, `bigint` em
 * string decimal.
 *
 * O determinismo aqui é o que torna o hash reprodutível. A etiqueta de tipo
 * evita colisão entre valores distintos que compartilham a mesma representação
 * textual — sem ela, `{v: 1}` e `{v: "1"}` produziriam o mesmo hash, e dois
 * eventos diferentes ficariam indistinguíveis na cadeia.
 */
export function serializarDados(dados: Readonly<Record<string, ValorDado>>): string {
  const partes = Object.keys(dados)
    .sort()
    .map((chave) => {
      const [tipo, texto] = etiquetar(dados[chave] as ValorDado);
      return `${JSON.stringify(chave)}:${tipo}:${JSON.stringify(texto)}`;
    });

  return `{${partes.join(',')}}`;
}

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

/**
 * `sha256(numero ‖ horario ‖ tipo ‖ autor ‖ dados ‖ sucesso ‖ motivoFalha ‖
 * hashAnterior)`, concatenado por `|`.
 *
 * `sucesso` e `motivoFalha` entram no hash de propósito: sem eles, uma rejeição
 * poderia ser reescrita como aprovação sem quebrar a cadeia — o que anularia a
 * tese inteira do projeto.
 */
export function calcularHash(registro: Omit<Registro, 'hash'>): string {
  return sha256(
    [
      registro.numero,
      registro.horario,
      registro.tipo,
      registro.autor,
      serializarDados(registro.dados),
      registro.sucesso ? '1' : '0',
      registro.motivoFalha ?? '',
      registro.hashAnterior,
    ].join('|'),
  );
}

// ---------------------------------------------------------------------------
// Anexação
// ---------------------------------------------------------------------------

/**
 * Devolve uma **nova** cadeia com o registro anexado. Não muta a recebida —
 * somente-anexação (FR-016) fica garantida por estrutura, não por convenção.
 */
export function anexar(
  cadeia: readonly Registro[],
  entrada: EntradaRegistro,
): Registro[] {
  const anterior = cadeia[cadeia.length - 1];
  const semHash: Omit<Registro, 'hash'> = {
    ...entrada,
    numero: cadeia.length,
    hashAnterior: anterior?.hash ?? HASH_GENESE,
  };

  return [...cadeia, { ...semHash, hash: calcularHash(semHash) }];
}

// ---------------------------------------------------------------------------
// Verificação
// ---------------------------------------------------------------------------

/**
 * Recalcula a cadeia inteira e devolve o **primeiro** índice divergente, com o
 * hash esperado e o obtido. Cadeia vazia é íntegra por vacuidade.
 */
export function verificarIntegridade(
  cadeia: readonly Registro[],
): ResultadoVerificacao {
  const total = cadeia.length;

  for (let i = 0; i < total; i++) {
    const r = cadeia[i]!;
    const hashAnteriorEsperado = i === 0 ? HASH_GENESE : cadeia[i - 1]!.hash;

    if (r.hashAnterior !== hashAnteriorEsperado) {
      return {
        integra: false,
        total,
        primeiroInvalido: i,
        esperado: hashAnteriorEsperado,
        obtido: r.hashAnterior,
      };
    }

    const { hash, ...semHash } = r;
    const recalculado = calcularHash({ ...semHash, numero: i });

    if (r.numero !== i || recalculado !== hash) {
      return {
        integra: false,
        total,
        primeiroInvalido: i,
        esperado: recalculado,
        obtido: hash,
      };
    }
  }

  return { integra: true, total };
}

// ---------------------------------------------------------------------------
// Demonstração de adulteração (FR-015)
// ---------------------------------------------------------------------------

/**
 * Altera `dados` do registro indicado **sem** recalcular seu hash — exatamente o
 * que uma alteração retroativa maliciosa produziria.
 *
 * Só pode ser chamada a partir do modo de demonstração da interface, nunca de
 * fluxo de produto (FR-015, FR-016). Devolve uma nova cadeia; a original
 * permanece íntegra, de modo que a restauração é sempre possível.
 */
export function adulterarParaDemonstracao(
  cadeia: readonly Registro[],
  numero: number,
  novosDados: Readonly<Record<string, ValorDado>>,
): Registro[] {
  return cadeia.map((r) =>
    r.numero === numero ? { ...r, dados: { ...r.dados, ...novosDados } } : r,
  );
}
