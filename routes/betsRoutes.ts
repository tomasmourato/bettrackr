import { Router } from "express";
import { BET_SELECT_COLUMNS } from "../db/betColumns.js";
import pool from "../db/pool.js";
import {
    AuthenticatedRequest,
    authenticateToken,
} from "../middleware/authMiddleware.js";
import { requireSubscriptionForExtension } from "../middleware/accessMiddleware.js";
import { normalizeBetStatus } from "../src/lib/betStatus.js";

// Mantém esta regra dentro do bundle backend. A rota é compilada pela Vercel
// separadamente do frontend; não deve depender de módulos da camada `src` nem
// de uma resolução de imports TypeScript adicional para arrancar.
function combineClosingOdds(
    selections: Array<{ closingOdd?: unknown; result?: unknown }> | undefined,
): number | null {
    if (!Array.isArray(selections) || selections.length === 0) return null;

    // Uma perna anulada sai do produto, tal como ja saiu da odd da aposta: a
    // casa devolve-lhe o valor 1 quando o jogo nao se realiza. Manter-la aqui
    // punha o preco de uma perna a ser dividido pela linha de duas. A razao
    // longa esta em lib/clvClosingOdds.ts, que tem a copia irma desta regra.
    const contam = selections.filter((selection) => selection?.result !== "ANULADA");
    if (contam.length === 0) return null;

    let product = 1;
    for (const selection of contam) {
        const odd = Number(selection?.closingOdd);
        if (!Number.isFinite(odd) || odd <= 1) return null;
        product *= odd;
    }

    return Number(product.toFixed(2));
}

// ============================================================
// Preservar a odd de fecho quando quem grava não sabe dela
//
// A odd de fecho não existe do lado da casa de apostas: é a linha lida pouco
// antes do apito e guardada pela extensão. A importação, essa, reescreve a
// aposta inteira a partir do que a casa devolve - e a casa devolve seleções
// sem odd de fecho nenhuma. Sem as regras abaixo, o PUT da importação apagava
// o CLV exatamente no momento em que a aposta se resolvia, que é quando a
// extensão volta a mandá-la por o estado ter mudado.
//
// Quem manda a chave `closingOdd` no corpo está a falar de odds de fecho e
// manda nelas (é o site, que também precisa de as poder LIMPAR). Quem não a
// manda não lhes toca. É a mesma convenção do PATCH /:id/ignore, que só mexe
// no comentário quando o campo vem no corpo.
// ============================================================

/** Marca de captura escrita pelo PATCH /:id/closing-odd, não pela casa. */
const CLOSING_ODD_META_KEYS = [
    "closingOddSource",
    "closingOddCapturedAt",
    "closingOddLeadMinutes",
] as const;

export function ownsClosingOdds(body: any): boolean {
    return Object.prototype.hasOwnProperty.call(body ?? {}, "closingOdd");
}

/**
 * Identidade estável de uma perna: o id da casa quando existe, a posição quando
 * não. Sem o id, uma múltipla que voltasse com as pernas por outra ordem colava
 * a odd de fecho de um jogo a outro - um erro pior do que não ter odd nenhuma.
 */
function legKey(selection: any, index: number): string {
    const ref = selection?.sourceRef?.selectionId;
    return ref === undefined || ref === null || ref === ""
        ? `#${index}`
        : `id:${String(ref)}`;
}

function asSelections(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * O corpo recebido, com as odds de fecho (e a marca de captura) que já estavam
 * gravadas. Só preenche o que vier vazio: uma perna que traga odd de fecho
 * própria continua a mandar, e a combinada é derivada a jusante como sempre.
 */
export function withStoredClosingOdds(body: any, stored: any): any {
    const incoming = asSelections(body?.selections);
    const previous = asSelections(stored?.selections);

    const byKey = new Map<string, number>();
    previous.forEach((selection, index) => {
        const odd = Number(selection?.closingOdd);
        if (Number.isFinite(odd) && odd > 1) byKey.set(legKey(selection, index), odd);
    });

    const selections = incoming.map((selection, index) => {
        if (selection?.closingOdd !== undefined && selection?.closingOdd !== null) {
            return selection;
        }
        const odd = byKey.get(legKey(selection, index));
        return odd === undefined ? selection : { ...selection, closingOdd: odd };
    });

    // A metadata da aposta é substituída por inteiro pela importação; só a
    // marca de captura é nossa e é a única que se traz de volta.
    const storedMeta =
        stored?.metadata && typeof stored.metadata === "object" ? stored.metadata : {};
    const carried: Record<string, unknown> = {};
    for (const key of CLOSING_ODD_META_KEYS) {
        if (storedMeta[key] !== undefined) carried[key] = storedMeta[key];
    }

    const metadata =
        Object.keys(carried).length === 0
            ? body?.metadata
            : { ...carried, ...(body?.metadata ?? {}) };

    return { ...body, selections, metadata };
}

const router = Router();

// Todas as rotas de bets exigem autenticação
router.use(authenticateToken);
// A extensão é funcionalidade paga; o registo manual de apostas não. Só os
// pedidos feitos com um token da extensão passam pelo portão da subscrição.
router.use(requireSubscriptionForExtension);

// Colunas devolvidas ao frontend - lista única partilhada com o SSR (server.ts).
const BET_COLUMNS = BET_SELECT_COLUMNS;

const VALID_FREEBET_TYPES = ["SNR", "SR"];
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================
// Garante que todos os accountIds enviados pertencem ao utilizador.
// Devolve null se ok, ou a mensagem de erro (a rota responde 400).
// Sem isto, um payload podia associar apostas à conta de outro user.
// ============================================================
async function validateAccountOwnership(
    db: { query: (text: string, params?: any[]) => Promise<any> },
    userId: string,
    accountIds: (string | null)[],
): Promise<string | null> {
    const unique = [
        ...new Set(accountIds.filter((id): id is string => id !== null)),
    ];
    if (unique.length === 0) return null;
    const result = await db.query(
        "SELECT id FROM bookie_accounts WHERE user_id = $1 AND id = ANY($2::uuid[])",
        [userId, unique],
    );
    if (result.rows.length !== unique.length) {
        return "Conta de casa de apostas inválida ou inexistente.";
    }
    return null;
}

// ============================================================
// parseBetPayload
// Normaliza o corpo do pedido para os valores a gravar na BD.
// Devolve { error } quando algo é inválido (a rota responde 400)
// ou { values } com o array de valores prontos para o INSERT/UPDATE,
// pela mesma ordem das colunas.
// ============================================================
interface ParsedPayload {
    error?: string;
    values?: any[];
    accountId?: string | null;
}

function trimOrNull(value: any): string | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    return str === "" ? null : str;
}

function parseBetPayload(body: any): ParsedPayload {
    const b = body ?? {};

    // stake e odd são obrigatórios e têm de ser números finitos > 0
    const stake = Number(b.stake);
    const odd = Number(b.odd);
    if (!Number.isFinite(stake) || stake <= 0) {
        return { error: "stake tem de ser um número maior que 0." };
    }
    if (!Number.isFinite(odd) || odd <= 0) {
        return { error: "odd tem de ser um número maior que 0." };
    }

    // type: SIMPLES | MULTIPLA (default SIMPLES)
    let type =
        typeof b.type === "string" ? b.type.trim().toUpperCase() : "SIMPLES";
    if (type !== "SIMPLES" && type !== "MULTIPLA") type = "SIMPLES";

    // CASHOUT é um estado próprio. Além do valor explícito, aceitamos os nomes
    // usados pelas casas e corrigimos payloads legados cuja metadata ainda
    // acompanha MEIO_GANHA/MEIO_PERDIDA mas identifica um cashout real.
    const status = normalizeBetStatus(b.status, b.metadata);

    // Campos numéricos opcionais: NaN -> erro se enviados, senão null
    const numericOrNull = (
        raw: any,
        label: string,
    ): number | null | { error: string } => {
        if (raw === undefined || raw === null || raw === "") return null;
        const n = Number(raw);
        if (!Number.isFinite(n))
            return { error: `${label} não é um número válido.` };
        return n;
    };

    const potentialReturn = numericOrNull(b.potentialReturn, "potentialReturn");
    if (potentialReturn && typeof potentialReturn === "object")
        return { error: potentialReturn.error };
    const finalReturn = numericOrNull(b.finalReturn, "finalReturn");
    if (finalReturn && typeof finalReturn === "object")
        return { error: finalReturn.error };
    const netProfit = numericOrNull(b.netProfit, "netProfit");
    if (netProfit && typeof netProfit === "object")
        return { error: netProfit.error };

    // closingOdd: opcional. O limite é 1 e não 0 porque uma odd decimal abaixo
    // de 1 pagaria menos do que a stake; e nunca 0, senão o CLV dividia por zero.
    const closingOddRaw = b.closingOdd;
    let closingOdd: number | null = null;
    if (
        closingOddRaw !== undefined &&
        closingOddRaw !== null &&
        closingOddRaw !== ""
    ) {
        const n = Number(closingOddRaw);
        if (!Number.isFinite(n) || n <= 1) {
            return { error: "closingOdd tem de ser um número maior que 1." };
        }
        closingOdd = n;
    }

    // A combinada é DERIVADA das pernas sempre que todas a tenham: há dois
    // escritores (formulário e extensão) e a invariante "combinada = produto
    // das pernas" tem de ser garantida num sítio só. Sem pernas preenchidas
    // vale o que o cliente mandou - é o que mantém as apostas gravadas antes
    // das odds por perna existirem.
    const combined = combineClosingOdds(b.selections);
    if (combined !== null) closingOdd = combined;

    const isRiskFree = b.isRiskFree === true || b.isRiskFree === "true";
    // Freebet e "sem risco" são mutuamente exclusivos; sem risco tem prioridade.
    const isFreebet =
        !isRiskFree && (b.isFreebet === true || b.isFreebet === "true");

    // freebetType: SNR | SR, ou null (não-freebet ou desconhecido)
    let freebetType: string | null =
        typeof b.freebetType === "string"
            ? b.freebetType.trim().toUpperCase()
            : null;
    if (freebetType !== null && !VALID_FREEBET_TYPES.includes(freebetType))
        freebetType = null;

    // dateTime: string vazia -> null
    const dateTime = trimOrNull(b.dateTime);

    // bookmaker: mantém-se tal como enviado (pode ser string vazia)
    const bookmaker = b.bookmaker == null ? null : String(b.bookmaker);

    // Campos de texto nullable: '' -> null
    const notes = trimOrNull(b.notes);
    const comment = trimOrNull(b.comment);
    const tags = trimOrNull(b.tags);
    const origin = trimOrNull(b.origin);

    // accountId: UUID de uma conta do utilizador ou null ("sem conta").
    // A propriedade da conta é validada pela rota (validateAccountOwnership).
    const accountIdRaw = trimOrNull(b.accountId);
    if (accountIdRaw !== null && !UUID_RE.test(accountIdRaw)) {
        return { error: "accountId inválido." };
    }
    const accountId = accountIdRaw;

    // selections e metadata: JSON.stringify ou null
    const selections =
        b.selections === undefined || b.selections === null
            ? null
            : JSON.stringify(b.selections);
    const metadata =
        b.metadata === undefined || b.metadata === null
            ? null
            : JSON.stringify(b.metadata);

    // Ordem: type, status, stake, odd, is_freebet, potential_return,
    // final_return, net_profit, bookmaker, date_time, notes, origin,
    // selections, comment, tags, metadata, freebet_type, is_risk_free,
    // account_id, closing_odd
    return {
        values: [
            type,
            status,
            stake,
            odd,
            isFreebet,
            potentialReturn as number | null,
            finalReturn as number | null,
            netProfit as number | null,
            bookmaker,
            dateTime,
            notes,
            origin,
            selections,
            comment,
            tags,
            metadata,
            freebetType,
            isRiskFree,
            accountId,
            closingOdd,
        ],
        accountId,
    };
}

// ============================================================
// Erros do Postgres causados pelo payload (e não pelo servidor):
// devolvê-los como 400 com mensagem legível em vez de um 500 opaco.
// Foi um destes (23514, constraint de status desatualizada) que
// mascarou a falha da importação em bloco durante dias.
// ============================================================
function dbErrorMessage(error: any): string | null {
    switch (error?.code) {
        case "23514": // check_violation
            return "A aposta tem valores não permitidos pela base de dados (estado ou tipo). Corre as migrações em db/migrations/.";
        case "23502": // not_null_violation
            return `Campo obrigatório em falta na aposta (${error?.column ?? "desconhecido"}).`;
        case "22007": // invalid_datetime_format
        case "22008": // datetime_field_overflow
            return "Data/hora da aposta em formato inválido (usa YYYY-MM-DD HH:mm).";
        default:
            return null;
    }
}

// ============================================================
// GET /api/bets  -> lista só as bets do utilizador autenticado
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
    try {
        const result = await pool.query(
            `SELECT ${BET_COLUMNS}
       FROM bets
       WHERE user_id = $1
       ORDER BY date_time DESC NULLS LAST, created_at DESC`,
            [req.user!.id],
        );
        res.json({ bets: result.rows });
    } catch (error) {
        console.error("Erro ao listar bets:", error);
        res.status(500).json({ error: "Erro ao obter as bets." });
    }
});

// ============================================================
// POST /api/bets  -> cria uma bet associada ao utilizador autenticado
// ============================================================
router.post("/", async (req: AuthenticatedRequest, res) => {
    try {
        const parsed = parseBetPayload(req.body);
        if (parsed.error) {
            res.status(400).json({ error: parsed.error });
            return;
        }

        const accountError = await validateAccountOwnership(
            pool,
            req.user!.id,
            [parsed.accountId ?? null],
        );
        if (accountError) {
            res.status(400).json({ error: accountError });
            return;
        }

        const result = await pool.query(
            `INSERT INTO bets
         (user_id, type, status, stake, odd, is_freebet, potential_return,
          final_return, net_profit, bookmaker, date_time, notes, origin,
          selections, comment, tags, metadata, freebet_type, is_risk_free,
          account_id, closing_odd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING ${BET_COLUMNS}`,
            [req.user!.id, ...parsed.values!],
        );

        res.status(201).json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
        console.error("Erro ao criar bet:", error);
        res.status(500).json({ error: "Erro ao guardar a bet." });
    }
});

// ============================================================
// POST /api/bets/bulk  -> cria várias bets numa transação
// ============================================================
router.post("/bulk", async (req: AuthenticatedRequest, res) => {
    const { bets } = req.body ?? {};

    if (!Array.isArray(bets) || bets.length === 0) {
        res.status(400).json({
            error: "É necessário um array de bets não vazio.",
        });
        return;
    }
    if (bets.length > 1000) {
        res.status(400).json({
            error: "Não é possível importar mais de 1000 bets de uma vez.",
        });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Valida todos os payloads (e a propriedade das contas) antes de inserir.
        const parsedAll: any[][] = [];
        const accountIds: (string | null)[] = [];
        for (let i = 0; i < bets.length; i++) {
            const parsed = parseBetPayload(bets[i]);
            if (parsed.error) {
                // Lança para forçar o ROLLBACK de todo o lote.
                throw {
                    statusCode: 400,
                    message: `Bet inválida no índice ${i}: ${parsed.error}`,
                };
            }
            parsedAll.push(parsed.values!);
            accountIds.push(parsed.accountId ?? null);
        }
        const accountError = await validateAccountOwnership(
            client,
            req.user!.id,
            accountIds,
        );
        if (accountError) throw { statusCode: 400, message: accountError };

        const inserted: any[] = [];
        for (const values of parsedAll) {
            const result = await client.query(
                `INSERT INTO bets
           (user_id, type, status, stake, odd, is_freebet, potential_return,
            final_return, net_profit, bookmaker, date_time, notes, origin,
            selections, comment, tags, metadata, freebet_type, is_risk_free,
            account_id, closing_odd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         RETURNING ${BET_COLUMNS}`,
                [req.user!.id, ...values],
            );
            inserted.push(result.rows[0]);
        }

        await client.query("COMMIT");
        res.status(201).json({ success: true, bets: inserted });
    } catch (error: any) {
        await client.query("ROLLBACK");
        if (error && error.statusCode === 400) {
            res.status(400).json({ error: error.message });
            return;
        }
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
        console.error("Erro ao importar bets em lote:", error);
        res.status(500).json({ error: "Erro ao importar as bets." });
    } finally {
        client.release();
    }
});

// ============================================================
// PUT /api/bets/:id  -> substitui os campos editáveis de uma bet
// (o frontend envia sempre a aposta completa)
// ============================================================
router.put("/:id", async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Só se abre transação quando há odds de fecho a salvar do payload. O
    // bloqueio da linha é preciso pela mesma razão do PATCH /:id/closing-odd:
    // a captura automática pode estar a escrever a odd de fecho no preciso
    // momento em que a importação reescreve a aposta.
    const client = ownsClosingOdds(req.body) ? null : await pool.connect();
    let committed = false;

    try {
        let body = req.body;
        if (client) {
            await client.query("BEGIN");
            const current = await client.query(
                "SELECT selections, metadata FROM bets WHERE id = $1 AND user_id = $2 FOR UPDATE",
                [id, req.user!.id],
            );
            if (current.rows.length === 0) {
                res.status(404).json({ error: "Bet não encontrada." });
                return;
            }
            body = withStoredClosingOdds(req.body, current.rows[0]);
        }

        const parsed = parseBetPayload(body);
        if (parsed.error) {
            res.status(400).json({ error: parsed.error });
            return;
        }

        const accountError = await validateAccountOwnership(
            client ?? pool,
            req.user!.id,
            [parsed.accountId ?? null],
        );
        if (accountError) {
            res.status(400).json({ error: accountError });
            return;
        }

        // A cláusula "AND user_id = $x" garante que um utilizador nunca
        // consegue editar a bet de outro, mesmo que adivinhe o ID.
        const result = await (client
            ? client.query.bind(client)
            : pool.query.bind(pool))(
            `UPDATE bets
       SET type = $1, status = $2, stake = $3, odd = $4, is_freebet = $5,
           potential_return = $6, final_return = $7, net_profit = $8,
           bookmaker = $9, date_time = $10, notes = $11, origin = $12,
           selections = $13, comment = $14, tags = $15, metadata = $16,
           freebet_type = $17, is_risk_free = $18, account_id = $19,
           closing_odd = $20,
           updated_at = timezone('utc', now())
       WHERE id = $21 AND user_id = $22
       RETURNING ${BET_COLUMNS}`,
            [...parsed.values!, id, req.user!.id],
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        if (client) {
            await client.query("COMMIT");
            committed = true;
        }
        res.json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
        console.error("Erro ao atualizar bet:", error);
        res.status(500).json({ error: "Erro ao atualizar a bet." });
    } finally {
        // Qualquer saida que nao tenha chegado ao COMMIT (400, 404, excecao)
        // desfaz-se aqui - assim nenhum return antecipado deixa a transacao
        // aberta a segurar o bloqueio da linha.
        if (client) {
            if (!committed) await client.query("ROLLBACK").catch(() => {});
            client.release();
        }
    }
});

// ============================================================
// PATCH /api/bets/:id/ignore  -> marca/desmarca a aposta como ignorada
// (excluída das estatísticas), com um motivo opcional em `comment`.
// Endpoint dedicado e leve: não revalida nem substitui a aposta toda como o
// PUT - só alterna a flag e (opcionalmente) o comentário.
// ============================================================
router.patch("/:id/ignore", async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const ignored =
            req.body?.ignored === true || req.body?.ignored === "true";
        // Só mexemos no comentário quando o campo vem no corpo - assim desmarcar
        // não apaga o motivo por acidente, mas o utilizador pode limpá-lo com "".
        const hasComment = Object.prototype.hasOwnProperty.call(
            req.body ?? {},
            "comment",
        );
        const comment = hasComment ? trimOrNull(req.body.comment) : null;

        const result = await pool.query(
            `UPDATE bets
       SET is_ignored = $1,
           comment = CASE WHEN $2::boolean THEN $3 ELSE comment END,
           updated_at = timezone('utc', now())
       WHERE id = $4 AND user_id = $5
       RETURNING ${BET_COLUMNS}`,
            [ignored, hasComment, comment, id, req.user!.id],
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        res.json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        if (error?.code === "22P02") {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        console.error("Erro ao ignorar bet:", error);
        res.status(500).json({ error: "Erro ao ignorar a aposta." });
    }
});

// ============================================================
// PATCH /api/bets/:id/closing-odd  -> grava (ou limpa) a odd de fecho
//
// Endpoint dedicado e leve, como o /ignore acima: a caixa de entrada do CLV
// preenche dezenas de apostas de seguida e o PUT obrigaria a mandar a aposta
// inteira de volta - revalidando estado, seleções e metadata só para escrever
// um número. `closingOdd: null` limpa o valor (volta a "ainda não se sabe").
// ============================================================
router.patch("/:id/closing-odd", async (req: AuthenticatedRequest, res) => {
    const raw = req.body?.closingOdd;
    let closingOdd: number | null = null;
    if (raw !== undefined && raw !== null && raw !== "") {
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 1) {
            res.status(400).json({
                error: "closingOdd tem de ser um número maior que 1.",
            });
            return;
        }
        closingOdd = n;
    }

    // Pernas: [{ index, closingOdd }]. É por aqui que a extensão escreve, e
    // também o preenchimento de uma múltipla. As pernas mandam sobre o valor
    // ao nível da aposta, que fica para as simples e para o histórico.
    const rawLegs = req.body?.legs;
    // Por perna: a crua, e opcionalmente a justa (sem a margem da casa) com a
    // margem que a produziu. A justa nunca substitui a crua - andam a par.
    const legs = new Map<number, number>();
    const legsNoVig = new Map<number, { odd: number; margin: number }>();
    if (rawLegs !== undefined && rawLegs !== null) {
        if (!Array.isArray(rawLegs)) {
            res.status(400).json({ error: "legs tem de ser um array." });
            return;
        }
        for (const leg of rawLegs) {
            const index = Number(leg?.index);
            if (!Number.isInteger(index) || index < 0) {
                res.status(400).json({ error: "Índice de perna inválido." });
                return;
            }
            const value = leg?.closingOdd;
            if (value === undefined || value === null || value === "") continue;
            const n = Number(value);
            if (!Number.isFinite(n) || n <= 1) {
                res.status(400).json({
                    error: "A odd de fecho de uma perna tem de ser maior que 1.",
                });
                return;
            }
            legs.set(index, n);

            const justa = Number(leg?.closingOddNoVig);
            const margem = Number(leg?.closingOddMargin);
            // A justa tem de ser MAIOR do que a crua: tirar a margem so pode
            // subir a odd. Se vier ao contrario, e sinal de que quem a mandou
            // se enganou, e uma justa errada e pior do que justa nenhuma.
            if (Number.isFinite(justa) && justa > n && Number.isFinite(margem)) {
                legsNoVig.set(index, { odd: justa, margin: margem });
            }
        }
    }

    // Metadata da captura (origem, quando, e quantos minutos antes do apito).
    // Vai fundida, nunca substituída: por baixo está o importKey de que a
    // deduplicação da extensão depende.
    const capture: Record<string, unknown> = {};
    if (typeof req.body?.source === "string") {
        capture.closingOddSource = req.body.source.slice(0, 40);
    }
    if (typeof req.body?.capturedAt === "string") {
        capture.closingOddCapturedAt = req.body.capturedAt.slice(0, 40);
    }
    if (Number.isFinite(Number(req.body?.leadMinutes))) {
        capture.closingOddLeadMinutes = Math.round(Number(req.body.leadMinutes));
    }

    // Escrever pernas é ler-modificar-escrever, e vêm em paralelo: preencher
    // uma múltipla de 5 dispara 5 pedidos ao mesmo tempo, e a extensão pode
    // estar a escrever enquanto o utilizador escreve. Sem o bloqueio da linha,
    // cada pedido leria as seleções antes de os outros gravarem e o último a
    // escrever levava as outras pernas à frente - silenciosamente.
    const client = legs.size > 0 ? await pool.connect() : null;

    try {
        let selectionsJson: string | null = null;
        if (client) {
            await client.query("BEGIN");
            const current = await client.query(
                "SELECT selections, metadata FROM bets WHERE id = $1 AND user_id = $2 FOR UPDATE",
                [req.params.id, req.user!.id],
            );
            if (current.rows.length === 0) {
                await client.query("ROLLBACK");
                res.status(404).json({ error: "Bet não encontrada." });
                return;
            }
            const raw = current.rows[0].selections;
            const selections = Array.isArray(raw)
                ? raw
                : typeof raw === "string"
                  ? JSON.parse(raw || "[]")
                  : [];

            // A extensao nao passa por cima do que o servidor apanhou.
            //
            // As duas capturas nao valem o mesmo: o servidor le entre os 30 e
            // os 5 minutos do apito e tira a margem da casa; a extensao le a
            // zero minutos, dentro da janela em que as odds da Betclic desabam,
            // e sem de-vig. Como a extensao nao se atualiza sozinha, e aqui que
            // se arbitra - senao a leitura pior chegava depois e ganhava.
            const jaDoServidor =
                current.rows[0].metadata?.closingOddSource === "server";
            const daExtensao = req.body?.source === "betclic";
            if (jaDoServidor && daExtensao) {
                await client.query("ROLLBACK");
                res.json({ success: true, ignorado: "ja ha leitura do servidor" });
                return;
            }

            for (const [index, value] of legs) {
                if (!selections[index]) continue;
                const justa = legsNoVig.get(index);
                selections[index] = {
                    ...selections[index],
                    closingOdd: value,
                    ...(justa
                        ? { closingOddNoVig: justa.odd, closingOddMargin: justa.margin }
                        : {}),
                };
                // Sem justa nova, a antiga nao pode ficar ao lado de uma crua
                // nova - seria uma margem a dizer respeito a outro preco.
                if (!justa) {
                    delete selections[index].closingOddNoVig;
                    delete selections[index].closingOddMargin;
                }
            }
            selectionsJson = JSON.stringify(selections);
            // A combinada sai sempre do conjunto COMPLETO das pernas, já com
            // as que os outros pedidos gravaram - é o que o bloqueio garante.
            closingOdd = combineClosingOdds(selections);
        }

        // O union de tipos entre PoolClient e Pool não é chamável; ambos têm
        // o mesmo query() em runtime, por isso basta escolher um.
        const result = await (client
            ? client.query.bind(client)
            : pool.query.bind(pool))(
            `UPDATE bets
       SET closing_odd = $1,
           selections = COALESCE($2::jsonb, selections),
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = timezone('utc', now())
       WHERE id = $4 AND user_id = $5
       RETURNING ${BET_COLUMNS}`,
            [
                closingOdd,
                selectionsJson,
                JSON.stringify(capture),
                req.params.id,
                req.user!.id,
            ],
        );
        if (client) await client.query("COMMIT");

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        res.json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        if (error?.code === "22P02") {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
        console.error("Erro ao gravar a odd de fecho:", error);
        res.status(500).json({ error: "Erro ao gravar a odd de fecho." });
    } finally {
        client?.release();
    }
});

// ============================================================
// DELETE /api/bets/:id  -> apaga uma bet (só se pertencer ao utilizador)
// ============================================================
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "DELETE FROM bets WHERE id = $1 AND user_id = $2 RETURNING id",
            [id, req.user!.id],
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Erro ao apagar bet:", error);
        res.status(500).json({ error: "Erro ao apagar a bet." });
    }
});

// ============================================================
// DELETE /api/bets  -> apaga TODAS as bets do utilizador
// ============================================================
router.delete("/", async (req: AuthenticatedRequest, res) => {
    try {
        const result = await pool.query("DELETE FROM bets WHERE user_id = $1", [
            req.user!.id,
        ]);
        res.json({ success: true, deleted: result.rowCount });
    } catch (error) {
        console.error("Erro ao apagar todas as bets:", error);
        res.status(500).json({ error: "Erro ao apagar as bets." });
    }
});

export default router;
