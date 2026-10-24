// lib/sport.ts
// Um nome por desporto, venha ele de onde vier.
//
// Cada fonte escreve o desporto à sua maneira: a Betclic manda "Futebol" (ou
// "Football", conforme a língua da conta), a Betano "FOOTBALL", a Solverde um
// código ("FOOT") e os CSV antigos "FUTEBOL". Gravado tal como veio, o filtro
// mostrava três futebóis e o retrato do CLV partia o mesmo desporto em linhas
// que nunca chegavam à amostra mínima.
//
// Partilhado pelo backend, que normaliza ao gravar, e pelo frontend, que
// normaliza ao ler. A migração 027 faz o mesmo às apostas já gravadas, com uma
// cópia desta tabela - o teste test/server/sport.test.ts garante que as duas
// não divergem.

/**
 * O nome que fica, e as formas que lá vão dar. As formas estão já como a
 * `chave` as deixa: sem acentos, em minúsculas e sem espaços nem pontuação.
 */
export const SPORT_ALIASES: ReadonlyArray<readonly [string, readonly string[]]> = [
    ["Futebol", ["futebol", "football", "soccer", "futbol", "foot"]],
    ["Futsal", ["futsal"]],
    ["Futebol americano", ["futebolamericano", "americanfootball"]],
    ["Ténis", ["tenis", "tennis", "tenn"]],
    ["Ténis de mesa", ["tenisdemesa", "tabletennis"]],
    ["Basquetebol", ["basquetebol", "basketball", "basket", "basquete", "bask"]],
    ["Andebol", ["andebol", "handball"]],
    ["Voleibol", ["voleibol", "volleyball", "volei"]],
    ["Hóquei no gelo", ["hoqueinogelo", "icehockey"]],
    ["Hóquei em patins", ["hoqueiempatins", "rinkhockey", "rollerhockey"]],
    ["Basebol", ["basebol", "baseball"]],
    ["Râguebi", ["raguebi", "rugby", "rugbyunion", "rugbyleague"]],
    // O nome que a Betclic dá ao MMA, que é de onde vem quase tudo.
    ["Artes marciais", ["artesmarciais", "artesmarciaismistas", "mma", "ufc"]],
    ["Boxe", ["boxe", "boxing"]],
    ["Fórmula 1", ["formula1", "f1"]],
    ["Automobilismo", ["automobilismo", "motorsport", "motorsports"]],
    ["Ciclismo", ["ciclismo", "cycling"]],
    ["Golfe", ["golfe", "golf"]],
    ["Snooker", ["snooker"]],
    ["Dardos", ["dardos", "darts"]],
    ["eSports", ["esports", "esport"]],
    ["Badminton", ["badminton"]],
    ["Críquete", ["criquete", "cricket"]],
    ["Polo aquático", ["poloaquatico", "waterpolo"]],
];

const POR_CHAVE = new Map<string, string>();
for (const [nome, formas] of SPORT_ALIASES) {
    POR_CHAVE.set(chave(nome), nome);
    for (const forma of formas) POR_CHAVE.set(forma, nome);
}

/** O nome reduzido ao que interessa para comparar: "Ténis" e "TENIS" dão o mesmo. */
export function chave(raw: string): string {
    return raw
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

/**
 * O desporto como fica gravado, ou undefined quando não há desporto nenhum.
 *
 * Um desporto que a tabela não conhece não se perde: fica o nome como veio, só
 * com a caixa arrumada, para "CURLING" e "Curling" darem um só. Siglas curtas
 * ficam em maiúsculas.
 */
export function normalizeSport(raw: unknown): string | undefined {
    if (typeof raw !== "string") return undefined;
    const limpo = raw.trim().replace(/\s+/g, " ");
    const k = chave(limpo);
    // "undefined" e "null" chegaram a ser gravados como texto por exportações
    // antigas. Um número sozinho é o id de uma casa que não sabemos ler, não
    // um nome que se possa mostrar.
    if (k === "" || k === "undefined" || k === "null" || /^[0-9]+$/.test(k)) return undefined;

    const conhecido = POR_CHAVE.get(k);
    if (conhecido) return conhecido;

    if (limpo.length <= 3) return limpo.toUpperCase();
    return limpo.charAt(0).toUpperCase() + limpo.slice(1).toLowerCase();
}
