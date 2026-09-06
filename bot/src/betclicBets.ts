// betclicBets.ts - leitura do historico de apostas da Betclic.
//
// Reaproveita a logica de paginacao ja provada na extensao (betclic-history.js):
// o /ended limita-se a ~3 meses e ignora filtros de data, por isso so ha
// paginacao por offset; o X-Total-Count nao e fiavel com cashouts, por isso so
// uma pagina vazia termina a leitura.
//
// A diferenca em relacao a extensao e a PARAGEM ANTECIPADA: numa passagem
// horaria nao interessa reler o historico todo, so as apostas novas no topo.
// Quem chama passa um `stopWhen(bet)` que devolve true quando reconhece uma
// aposta ja importada; a leitura para nessa pagina. De ~250 pedidos/dia (o
// varrimento completo) para ~1 quando nao ha nada novo.
//
// So le. Nunca aposta, nunca toca na carteira.

const BETS_BASE = "https://betting.begmedia.pt";

export interface FetchBetsOptions {
  base?: string;
  pageSize?: number;
  maxPages?: number;
  // Chamado por aposta, do topo (mais recente) para baixo. Devolver true assim
  // que se reconhece uma aposta ja conhecida faz a leitura parar nessa pagina.
  stopWhen?: (bet: any) => boolean;
  onPage?: (info: { lidas: number; parou: boolean }) => void;
}

// Uma pagina do /me/bets. Headers iguais aos da extensao (provados): o endpoint
// dos bets usa os nomes antigos X-Bg-Universe/X-Bg-Language, nao os do login.
async function fetchPage(
  accessToken: string,
  kind: "ended" | "ongoing",
  offset: number,
  limit: number,
  base: string,
): Promise<any[]> {
  const url =
    `${base}/api/v2/me/bets/${kind}` +
    `?cache-burst=${Date.now()}&limit=${limit}&offset=${offset}&embed=Metagame`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "X-Bg-Universe": "Sports",
      "X-Bg-Language": "pt",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Sessao Betclic expirada (${res.status}) ao ler ${kind}.`);
  }
  if (!res.ok) throw new Error(`Betclic respondeu ${res.status} ao ler ${kind}.`);
  const data: any = await res.json().catch(() => ({}));
  return Array.isArray(data.bets) ? data.bets : [];
}

// Le uma categoria (ended/ongoing) com paginacao e paragem antecipada.
export async function fetchBetclicBets(
  accessToken: string,
  kind: "ended" | "ongoing",
  options: FetchBetsOptions = {},
): Promise<any[]> {
  const base = options.base || BETS_BASE;
  const pageSize = options.pageSize || 20;
  const maxPages = options.maxPages || 250; // teto de seguranca (~5000 apostas)
  const out: any[] = [];
  let offset = 0;

  for (let page = 0; page < maxPages; page++) {
    const bets = await fetchPage(accessToken, kind, offset, pageSize, base);
    if (bets.length === 0) {
      options.onPage?.({ lidas: out.length, parou: false });
      break;
    }
    // Paragem antecipada: acumula ate encontrar uma aposta ja conhecida.
    let parou = false;
    for (const bet of bets) {
      if (options.stopWhen?.(bet)) {
        parou = true;
        break;
      }
      out.push(bet);
    }
    options.onPage?.({ lidas: out.length, parou });
    if (parou) break;

    offset += bets.length; // a API pode devolver menos que o pedido; avanca pelo real
  }
  return out;
}
