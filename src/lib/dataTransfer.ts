// src/lib/dataTransfer.ts
// Export/import de dados (CSV e backup JSON), extraído do Settings desktop
// para ser partilhado com o ecrã de definições mobile. A semântica é uma
// cópia fiel: mesmo cabeçalho/formato de CSV, mesma deteção de JSON vs CSV,
// mesma normalização de estados, freebets, contas e seleções múltiplas.

import { Bet, BankrollMovement, BankrollMovementKind, BookieAccount, Preferences, Selection, BetStatus, BetType, FreebetType } from "../types";
import { calculateBetReturnAndProfit, safeNum } from "../utils";
import { defaultFreebetTypeFor } from "./bookmakers";
import { normalizeBetStatus } from "./betStatus";
import { isNativeApp } from "./apiBase";

/**
 * Entrega um ficheiro de texto ao utilizador.
 *
 * - Na web: descarrega via blob + <a download> (funciona nos browsers).
 * - Na app nativa: o WebView do Android IGNORA o atributo download de blob
 *   URLs (o clique navegava o WebView para o blob e "partia" a UI). A via
 *   correta é escrever o ficheiro na cache e abrir o share sheet nativo, de
 *   onde o utilizador pode gravar em Ficheiros, enviar por email, etc.
 */
async function deliverTextFile(filename: string, content: string, mime: string): Promise<void> {
  if (isNativeApp()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({ title: filename, url: uri, dialogTitle: "Exportar" });
      return;
    } catch (err) {
      // Utilizador cancelou o share, ou plugin indisponível: sem crash.
      // (Cancelar o share sheet rejeita a promessa - é esperado.)
      return;
    }
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Exporta todas as apostas para CSV (formato próprio, round-trip seguro). */
export async function exportBetsCSV(bets: Bet[], accounts: BookieAccount[]): Promise<void> {
  const accountLabelById = new Map(accounts.map((a) => [a.id, a.label]));

  // RETURN = finalReturn; NET_PROFIT = netProfit. Ambos são exportados já
  // calculados para o import poder ser fiel (ver importBetsFromFile): sem o
  // NET_PROFIT, o import tinha de RECALCULAR a partir da odd e do tipo de
  // freebet, o que fazia o lucro divergir em meios-ganhos manuais e freebets
  // sem tipo guardado. A leitura é por nome de coluna, por isso CSVs antigos
  // (sem NET_PROFIT) continuam a importar.
  // CLOSING_ODDS fica vazia enquanto ninguém registar a odd de fecho: no CSV
  // "" e "ainda não sei" são a mesma coisa, e é assim que o import a lê.
  let csvContent = "DATE;TIME;GAME;BET;STAKE;ODDS;CLOSING_ODDS;STATUS;RETURN;NET_PROFIT;SPORT;BOOKIE;BETTYPE;FREEBET;FREEBET_TYPE;RISK_FREE;ACCOUNT;COMMENT;TAGS\n";

  bets.forEach((b) => {
    let dateVal = "";
    let timeVal = "";
    if (b.dateTime) {
      const parts = b.dateTime.split(" ");
      dateVal = parts[0] || "";
      timeVal = parts[1] || "";
    }

    const gameVal = b.selections.map((s) => s.event).join(" + ");
    const betVal = b.selections.map((s) => s.choice).join(" + ");
    const stakeVal = safeNum(b.stake).toFixed(2);
    const oddsVal = safeNum(b.odd).toFixed(3);
    const closingOddsVal = b.closingOdd ? safeNum(b.closingOdd).toFixed(3) : "";

    let statusVal = "PENDING";
    if (b.status === "GANHA") statusVal = "WON";
    else if (b.status === "PERDIDA") statusVal = "LOST";
    else if (b.status === "ANULADA") statusVal = "VOID";
    else if (b.status === "MEIO_GANHA") statusVal = "WON";
    else if (b.status === "MEIO_PERDIDA") statusVal = "LOST";
    else if (b.status === "CASHOUT") statusVal = "CASHOUT";
    else if (b.status === "POR_LIQUIDAR") statusVal = "POR_LIQUIDAR";

    const returnVal = safeNum(b.finalReturn).toFixed(2);
    const netProfitVal = safeNum(b.netProfit).toFixed(2);

    // Desporto: usa o campo; sem ele, heurística por palavras-chave (legado).
    let sportVal = b.selections.map((s) => s.sport || "FUTEBOL").join(" + ");
    if (!sportVal || sportVal.trim() === "" || sportVal.includes("undefined")) {
      const textToTest = (gameVal + " " + betVal + " " + (b.notes || "")).toLowerCase();
      if (textToTest.includes("nba") || textToTest.includes("knicks") || textToTest.includes("celtics") || textToTest.includes("lakers") || textToTest.includes("spurs") || textToTest.includes("basket") || textToTest.includes("basquet")) {
        sportVal = "BASQUETEBOL";
      } else if (textToTest.includes("alcaraz") || textToTest.includes("zverev") || textToTest.includes("sinner") || textToTest.includes("nadal") || textToTest.includes("borges") || textToTest.includes("tenis") || textToTest.includes("ténis") || textToTest.includes("set")) {
        sportVal = "TÉNIS";
      } else if (textToTest.includes("futsal") || textToTest.includes("sporting cp - cartenga")) {
        sportVal = "FUTSAL";
      } else {
        sportVal = "FUTEBOL";
      }
    }

    const bookieVal = b.bookmaker || "Outro";

    let betTypeVal = b.type === "MULTIPLA" ? "Múltipla" : (b.selections[0]?.betType || b.selections[0]?.market || "Simples");
    if (b.type === "MULTIPLA" && b.selections.length > 1) {
      betTypeVal = b.selections.map((s) => s.betType || s.market || "Simples").join(" + ");
    }

    const commentVal = b.comment || b.notes || "";
    const tagsVal = b.tags || "";

    const escapeField = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

    const freebetVal = b.isFreebet ? "SIM" : "NAO";
    const freebetTypeVal = b.isFreebet ? (b.freebetType || "") : "";
    const riskFreeVal = b.isRiskFree ? "SIM" : "NAO";
    const accountVal = b.accountId ? (accountLabelById.get(b.accountId) || "") : "";

    csvContent += `${dateVal};${timeVal};${escapeField(gameVal)};${escapeField(betVal)};${stakeVal};${oddsVal};${closingOddsVal};${statusVal};${returnVal};${netProfitVal};${sportVal};${bookieVal};${betTypeVal};${freebetVal};${freebetTypeVal};${riskFreeVal};${escapeField(accountVal)};${escapeField(commentVal)};${escapeField(tagsVal)}\n`;
  });

  await deliverTextFile("apostas_export.csv", csvContent, "text/csv;charset=utf-8;");
}

const BANKROLL_KINDS: BankrollMovementKind[] = ["DEPOSITO", "LEVANTAMENTO", "AJUSTE"];

/**
 * Movimentos da banca lidos de um backup. Só passa o que é reconstruível:
 * tipo conhecido, valor numérico diferente de zero e data.
 *
 * O id e o accountId do ficheiro são deitados fora de propósito - o servidor
 * gera um id novo, e um accountId de outra instalação não corresponde a conta
 * nenhuma desta (a banca é global, o campo está reservado para o futuro).
 */
function sanitizeBankrollMovements(raw: unknown): BankrollMovement[] {
  if (!Array.isArray(raw)) return [];

  const movements: BankrollMovement[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const kind = String((entry as any).kind ?? "").trim().toUpperCase();
    if (!(BANKROLL_KINDS as string[]).includes(kind)) continue;

    const amount = Number((entry as any).amount);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const occurredAt = String((entry as any).occurredAt ?? "").trim();
    if (!occurredAt) continue;

    const note = (entry as any).note;
    movements.push({
      id: `bk_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      kind: kind as BankrollMovementKind,
      amount,
      occurredAt,
      note: note ? String(note) : undefined,
    });
  }
  return movements;
}

/**
 * Backup JSON completo (apostas + banca + preferências).
 *
 * A banca vive num registo à parte das apostas (depósitos, levantamentos e
 * ajustes) e sem ela o saldo, o ROI real e a queda máxima não se reconstroem
 * a partir do ficheiro - o "backup completo" perdia-os em silêncio. Os
 * backups versão "1.0" não a trazem; o import trata a ausência como "nada a
 * restaurar", por isso continuam a importar.
 */
export async function exportBackupJSON(
  bets: Bet[],
  preferences: Preferences,
  bankrollMovements: BankrollMovement[] = [],
): Promise<void> {
  const backupData = {
    bets,
    bankrollMovements,
    preferences,
    version: "1.1",
    exportTime: new Date().toISOString(),
  };
  const str = JSON.stringify(backupData, null, 2);
  await deliverTextFile(
    `backup_gestao_apostas_${new Date().toISOString().split("T")[0]}.json`,
    str,
    "application/json",
  );
}

/** Parser de linha CSV com suporte a aspas duplas. */
function parseCSVRow(rowText: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((val) => {
    let cleaned = val;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    return cleaned.replace(/""/g, '"');
  });
}

/**
 * Lê um ficheiro de importação (backup JSON ou CSV), constrói as apostas e
 * entrega-as a `onImport`. Resolve com a mensagem de sucesso; rejeita com
 * Error de mensagem legível.
 *
 * `onImportBankroll` recebe os movimentos da banca quando o ficheiro é um
 * backup que os traz (versão "1.1" para cima). Um CSV nunca os tem, e um
 * backup antigo também não - nesses casos não é chamado.
 */
export function importBetsFromFile(
  file: File,
  accounts: BookieAccount[],
  onImport: (bets: Bet[]) => void,
  onImportBankroll?: (movements: BankrollMovement[]) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          const parsed = JSON.parse(text);
          // Um accountId de um backup pode já não existir; mantemos o id só
          // se a conta ainda existir, senão a aposta entra "sem conta" (um
          // único id inválido faria o servidor rejeitar TODO o lote).
          const validAccountIds = new Set(accounts.map((a) => a.id));
          const sanitizeAccounts = (list: any[]): any[] =>
            list.map((b) => {
              if (!b || typeof b !== "object") return b;
              if (b.accountId && !validAccountIds.has(b.accountId)) {
                return { ...b, accountId: undefined };
              }
              return b;
            });

          if (Array.isArray(parsed.bets)) {
            onImport(sanitizeAccounts(parsed.bets));

            // A banca só existe nos backups a partir da versão "1.1"; sem ela
            // o restauro é o de sempre, só com as apostas.
            const movements = sanitizeBankrollMovements(parsed.bankrollMovements);
            if (movements.length > 0 && onImportBankroll) {
              onImportBankroll(movements);
              resolve(`Backup importado com sucesso (apostas e ${movements.length} movimento(s) da banca)!`);
              return;
            }

            resolve("Backup importado com sucesso!");
          } else if (Array.isArray(parsed)) {
            onImport(sanitizeAccounts(parsed));
            resolve("Apostas importadas com sucesso!");
          } else {
            throw new Error("Formato inválido.");
          }
          return;
        }

        // CSV
        const cleanedText = text.replace(/^﻿/, "");
        const lines = cleanedText.split(/\r?\n/).filter((line) => line.trim() !== "");
        if (lines.length === 0) throw new Error("O ficheiro CSV está vazio.");

        const headerRow = parseCSVRow(lines[0]);
        const idx = (name: string) => headerRow.findIndex((h) => h.toUpperCase() === name);
        const dateIdx = idx("DATE");
        const timeIdx = idx("TIME");
        const gameIdx = idx("GAME");
        const betIdx = idx("BET");
        const stakeIdx = idx("STAKE");
        const oddsIdx = idx("ODDS");
        // Lida por nome: um CSV antigo, sem esta coluna, continua a importar.
        const closingOddsIdx = headerRow.findIndex((h) =>
          ["CLOSING_ODDS", "CLOSING_ODD", "CLV_ODD"].includes(h.toUpperCase())
        );
        const statusIdx = idx("STATUS");
        const returnIdx = headerRow.findIndex((h) => ["RETURN", "FINAL_RETURN", "CASHOUT_RETURN"].includes(h.toUpperCase()));
        const netProfitIdx = headerRow.findIndex((h) => ["NET_PROFIT", "PROFIT", "NETPROFIT"].includes(h.toUpperCase()));
        const sportIdx = idx("SPORT");
        const bookieIdx = idx("BOOKIE");
        const betTypeIdx = idx("BETTYPE");
        const freebetIdx = idx("FREEBET");
        const freebetTypeIdx = idx("FREEBET_TYPE");
        const riskFreeIdx = idx("RISK_FREE");
        const accountIdx = idx("ACCOUNT");
        const commentIdx = idx("COMMENT");
        const tagsIdx = idx("TAGS");

        const parseBool = (v: string) => ["SIM", "YES", "TRUE", "1"].includes(String(v || "").trim().toUpperCase());

        if (dateIdx === -1 || gameIdx === -1 || stakeIdx === -1 || oddsIdx === -1) {
          throw new Error("Formato de CSV inválido. Colunas obrigatórias DATE, GAME, STAKE, ODDS não encontradas.");
        }

        const parsedBets: Bet[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVRow(lines[i]);
          if (row.length < 4) continue;

          const dateVal = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : "";
          const timeVal = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : "00:00";
          const gameVal = gameIdx !== -1 && row[gameIdx] ? row[gameIdx] : "";
          const betVal = betIdx !== -1 && row[betIdx] ? row[betIdx] : "";

          const rawStake = stakeIdx !== -1 && row[stakeIdx] ? row[stakeIdx] : "1.00";
          const stakeVal = parseFloat(rawStake.replace(",", "."));

          const rawOdds = oddsIdx !== -1 && row[oddsIdx] ? row[oddsIdx] : "1.00";
          const oddsVal = parseFloat(rawOdds.replace(",", "."));

          const rawClosingOdds =
            closingOddsIdx !== -1 && row[closingOddsIdx] ? row[closingOddsIdx] : "";
          const parsedClosingOdds = parseFloat(rawClosingOdds.replace(",", "."));
          // Só uma odd decimal a sério conta; o resto é "ainda não sei".
          const closingOdd =
            Number.isFinite(parsedClosingOdds) && parsedClosingOdds > 1
              ? parsedClosingOdds
              : undefined;

          const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toUpperCase() : "PENDING";
          const rawReturn = returnIdx !== -1 && row[returnIdx] ? row[returnIdx] : "";
          const returnVal = parseFloat(rawReturn.replace(",", "."));
          const rawNetProfit = netProfitIdx !== -1 && row[netProfitIdx] ? row[netProfitIdx] : "";
          const netProfitVal = parseFloat(rawNetProfit.replace(",", "."));
          const sportVal = sportIdx !== -1 && row[sportIdx] ? row[sportIdx] : "FUTEBOL";
          const bookieVal = bookieIdx !== -1 && row[bookieIdx] ? row[bookieIdx] : "Outro";
          const betTypeVal = betTypeIdx !== -1 && row[betTypeIdx] ? row[betTypeIdx] : "Simples";
          const commentVal = commentIdx !== -1 && row[commentIdx] ? row[commentIdx] : "";
          const tagsVal = tagsIdx !== -1 && row[tagsIdx] ? row[tagsIdx] : "";

          const status: BetStatus = normalizeBetStatus(statusRaw);
          const combinedNotes = [commentVal, tagsVal].filter(Boolean).join(" | ");

          const isRiskFree = riskFreeIdx !== -1 ? parseBool(row[riskFreeIdx] || "") : false;

          let isFreebet: boolean;
          if (freebetIdx !== -1) {
            isFreebet = parseBool(row[freebetIdx] || "");
          } else {
            isFreebet =
              combinedNotes.toLowerCase().includes("freebet") ||
              combinedNotes.toLowerCase().includes("grátis") ||
              combinedNotes.toLowerCase().includes("gratis");
          }
          if (isRiskFree) isFreebet = false;

          let freebetType: FreebetType | undefined;
          if (isFreebet) {
            const raw = freebetTypeIdx !== -1 ? String(row[freebetTypeIdx] || "").trim().toUpperCase() : "";
            freebetType = raw === "SNR" || raw === "SR" ? (raw as FreebetType) : defaultFreebetTypeFor(bookieVal);
          }

          let accountId: string | undefined;
          const accountLabel = accountIdx !== -1 ? String(row[accountIdx] || "").trim() : "";
          if (accountLabel) {
            const match = accounts.find((a) => a.bookmaker === bookieVal && a.label === accountLabel);
            accountId = match?.id;
          }

          let games: string[] = [];
          if (gameVal.includes(" + ")) games = gameVal.split(" + ").map((g) => g.trim());
          else if (gameVal.includes(";")) games = gameVal.split(";").map((g) => g.trim());
          else if (gameVal.includes(",") && betTypeVal.toLowerCase().includes("múltipla")) games = gameVal.split(",").map((g) => g.trim());
          else games = [gameVal];

          let betsArr: string[] = [];
          if (betVal.includes(" + ")) betsArr = betVal.split(" + ").map((b) => b.trim());
          else if (betVal.includes(";")) betsArr = betVal.split(";").map((b) => b.trim());
          else if (betVal.includes(",") && games.length > 1) betsArr = betVal.split(",").map((b) => b.trim());
          else betsArr = [betVal];

          const sports = sportVal.includes(" + ") ? sportVal.split(" + ").map((s) => s.trim()) : [sportVal];
          const subBetTypes = betTypeVal.includes(" + ") ? betTypeVal.split(" + ").map((s) => s.trim()) : [betTypeVal];

          const selections: Selection[] = [];
          const betType: BetType = games.length > 1 ? "MULTIPLA" : "SIMPLES";
          const totalOdd = isNaN(oddsVal) ? 1.0 : oddsVal;

          for (let j = 0; j < games.length; j++) {
            const selOdd = games.length > 1 ? Number(Math.pow(totalOdd, 1 / games.length).toFixed(2)) : totalOdd;
            selections.push({
              id: `sel_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${j}`,
              event: games[j] || gameVal,
              market: subBetTypes[j] || betTypeVal || "Simples",
              choice: betsArr[j] || betVal || "Resultado",
              odd: selOdd,
              sport: sports[j] || sportVal || "FUTEBOL",
              betType: subBetTypes[j] || betTypeVal || "Simples",
            });
          }

          const stakeNumVal = isNaN(stakeVal) ? 1.0 : stakeVal;

          // Fidelidade do round-trip: quando o CSV traz os valores já
          // calculados (RETURN + NET_PROFIT, gerados pelo nosso export),
          // confiamos neles em vez de recalcular. Recalcular a partir da odd e
          // do tipo de freebet fazia o lucro divergir em meios-ganhos com
          // retorno manual e em freebets sem tipo guardado (ver bug reportado).
          // Só se recalcula quando faltam - CSVs antigos ou editados à mão.
          let potentialReturn: number;
          let finalReturn: number;
          let netProfit: number;

          const hasStoredResults =
            status !== "POR_LIQUIDAR" && !isNaN(returnVal) && !isNaN(netProfitVal);

          if (hasStoredResults) {
            finalReturn = Number(returnVal.toFixed(2));
            netProfit = Number(netProfitVal.toFixed(2));
            // potentialReturn não vem numa coluna própria do CSV, por isso
            // deriva-se sempre com a mesma regra da app - numa freebet SNR a
            // stake é promocional e não volta, logo não é stake × odd.
            potentialReturn = calculateBetReturnAndProfit(
              stakeNumVal,
              totalOdd,
              "POR_LIQUIDAR",
              isFreebet,
              undefined,
              freebetType,
              isRiskFree,
            ).potentialReturn;
          } else {
            ({ potentialReturn, finalReturn, netProfit } = calculateBetReturnAndProfit(
              stakeNumVal,
              totalOdd,
              status,
              isFreebet,
              status === "CASHOUT" && !isNaN(returnVal) ? returnVal : undefined,
              freebetType,
              isRiskFree,
            ));
          }

          parsedBets.push({
            id: `csv_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${i}`,
            type: betType,
            status,
            selections,
            stake: stakeNumVal,
            odd: totalOdd,
            closingOdd,
            isFreebet,
            freebetType,
            isRiskFree,
            accountId,
            potentialReturn,
            finalReturn,
            netProfit,
            bookmaker: bookieVal || "Outro",
            dateTime: timeVal ? `${dateVal} ${timeVal}` : `${dateVal} 00:00`,
            notes: combinedNotes || undefined,
            origin: "CSV",
            comment: commentVal || undefined,
            tags: tagsVal || undefined,
          });
        }

        if (parsedBets.length === 0) throw new Error("Nenhuma linha de aposta válida foi encontrada.");
        onImport(parsedBets);
        resolve(`${parsedBets.length} apostas importadas com sucesso!`);
      } catch (err: any) {
        reject(new Error(err?.message || "Erro ao ler ficheiro de importação. Verifica se é um ficheiro válido."));
      }
    };
    reader.readAsText(file);
  });
}
