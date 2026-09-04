import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  HelpCircle,
  Award,
  Percent,
  Layers,
  ArrowUpRight,
  PiggyBank,
  Crosshair
} from "lucide-react";
import { Bet, BetStatus, BookieAccount, BankrollMovement, DashboardStats } from "../types";
import { calculateDashboardStats, safeNum } from "../utils";
import { calculateBankroll } from "../lib/bankroll";
import { calculateClv } from "../lib/clv";
import { ClvLockPanel } from "./ClvLock";
import ClosingOddsModal from "./ClosingOddsModal";
import type { ClosingOddInput } from "../lib/betsApi";
import { useI18n } from "../lib/i18n";
import FilterDropdown from "./FilterDropdown";
import FiltersBar from "./FiltersBar";
import TimeframeFilter, {
  EMPTY_TIMEFRAME_FILTER,
  fromLocalDateKey,
  rangeSpansAtLeastTwoMonths,
  resolveTimeframeRange,
  type Timeframe,
  type TimeframeFilterValue,
} from "./TimeframeFilter";
import { EMPTY_BET_FILTERS, readFilters, serializeFilters } from "../lib/filterParams";
import { useUrlFilterSync } from "../hooks/useUrlFilterSync";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  LineChart,
  Line
} from "recharts";

interface DashboardProps {
  bets: Bet[];
  currency: string;
  isDark: boolean;
  // Contas por casa do utilizador; ausente/vazio na vista de um amigo
  // (não conhecemos as contas dele) - o filtro de conta fica escondido.
  accounts?: BookieAccount[];
  // Opcional: drill-down para a lista de apostas filtrada. Ausente na vista
  // read-only de um amigo (não há BetsManager próprio para onde navegar).
  onOpenBets?: (filters: DashboardBetsFilters) => void;
  // Query string inicial ("?account=..."), vinda do SSR ou do URL no arranque.
  initialSearch?: string;
  // Movimentos da banca. Ausente na vista de um amigo: o saldo é privado e a
  // secção da banca simplesmente não aparece.
  bankrollMovements?: BankrollMovement[];
  // O CLV é funcionalidade paga. A false, a secção inteira dá lugar ao cartão
  // que a explica - incluindo o apelo a preencher odds de fecho, que não faz
  // sentido oferecer a quem não as pode gravar. Omitido = ligado, para a vista
  // de um amigo e o SSR não terem de saber disto.
  clvEnabled?: boolean;
  // Leva à subscrição. Sem isto o cadeado informa mas não resolve.
  onSubscribe?: () => void;
  // Gravar a odd de fecho a partir da caixa de entrada do CLV. Ausente na
  // vista de um amigo, que é só de leitura - aí a secção mostra os números
  // mas não oferece o preenchimento.
  onSetClosingOdd?: (id: string, input: ClosingOddInput) => Promise<void>;
}

export interface DashboardBetsFilters {
  // "RESOLVED" é um pseudo-estado (todas menos POR_LIQUIDAR) usado pelo
  // drill-down do gráfico "Resolvidas"; o histórico trata-o em matchesStatus.
  // "ALL" é a ausência de filtro de estado, para drill-downs que filtram por
  // outra coisa (ex.: as apostas sem odd de fecho, de qualquer estado).
  status: BetStatus | "RESOLVED" | "ALL";
  bookmaker?: string;
  sport?: string;
  type?: string;
  money?: string;
  // "TRACKED" (com odd de fecho) | "MISSING" (por preencher) - o atalho da
  // secção de CLV leva o utilizador direto às apostas que faltam preencher.
  clv?: string;
  timeframe?: Timeframe;
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function Dashboard({ bets: allBets, currency, isDark, onOpenBets, accounts = [], initialSearch, bankrollMovements, onSetClosingOdd, clvEnabled = true, onSubscribe }: DashboardProps) {
  const { t, formatMoney, formatSignedMoney, formatDate } = useI18n();
  // Filtros do dashboard (D2): recalculam TODAS as estatísticas/gráficos para o
  // subconjunto escolhido. As opções vêm da lista completa; o cálculo usa a
  // lista filtrada `bets` (sombreada abaixo).
  const initialFilters = useMemo(
    () => readFilters(new URLSearchParams(initialSearch ?? "")),
    [initialSearch]
  );

  const [filterBookmaker, setFilterBookmaker] = useState(initialFilters.bookmaker);
  // "ALL" | "NONE" (apostas sem conta) | id de uma conta
  const [filterAccount, setFilterAccount] = useState(initialFilters.account);
  const [filterSport, setFilterSport] = useState(initialFilters.sport);
  const [filterType, setFilterType] = useState(initialFilters.type);
  const [filterFreebet, setFilterFreebet] = useState(initialFilters.money);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilterValue>(initialFilters.timeframe);
  const [isClosingOddsOpen, setIsClosingOddsOpen] = useState(false);

  // Filtros <-> URL: cada alteração fica no histórico do browser e o
  // back/forward volta a aplicá-la sem remontar o dashboard.
  const filterSearch = useMemo(
    () => serializeFilters({
      ...EMPTY_BET_FILTERS,
      bookmaker: filterBookmaker,
      account: filterAccount,
      sport: filterSport,
      type: filterType,
      money: filterFreebet,
      timeframe: timeframeFilter,
    }),
    [filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeFilter]
  );

  useUrlFilterSync({
    path: "/dashboard",
    search: filterSearch,
    onExternalChange: (params) => {
      const next = readFilters(params);
      setFilterBookmaker(next.bookmaker);
      setFilterAccount(next.account);
      setFilterSport(next.sport);
      setFilterType(next.type);
      setFilterFreebet(next.money);
      setTimeframeFilter(next.timeframe);
    },
  });

  const bookmakerOptions = useMemo(
    () => Array.from(new Set(allBets.map(b => b.bookmaker).filter((b): b is string => !!b))).sort(),
    [allBets]
  );
  const sportOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allBets
            .flatMap(b => (b.selections || []).map(s => s.sport))
            .filter((s): s is string => !!s)
        )
      ).sort(),
    [allBets]
  );

  const timeframeRange = useMemo(() => resolveTimeframeRange(timeframeFilter), [timeframeFilter]);

  // `bets` sombreia a prop: é o subconjunto filtrado que todo o código abaixo usa.
  const bets = useMemo(
    () =>
      allBets.filter(b => {
        // Apostas ignoradas nunca contam para estatísticas/gráficos.
        if (b.isIgnored) return false;
        if (filterBookmaker !== "ALL" && b.bookmaker !== filterBookmaker) return false;
        if (filterAccount === "NONE" && b.accountId) return false;
        if (filterAccount !== "ALL" && filterAccount !== "NONE" && b.accountId !== filterAccount) return false;
        if (filterType !== "ALL" && b.type !== filterType) return false;
        // Mesma semântica do filtro de dinheiro do BetsManager, para o
        // drill-down mostrar exatamente as apostas contadas aqui.
        if (filterFreebet === "FREEBET" && !b.isFreebet) return false;
        if (filterFreebet === "RISK_FREE" && !b.isRiskFree) return false;
        if (filterFreebet === "NORMAL" && (b.isFreebet || b.isRiskFree)) return false;
        if (filterSport !== "ALL" && !(b.selections || []).some(s => s.sport === filterSport)) return false;
        if (timeframeRange.start || timeframeRange.end) {
          const betDate = b.dateTime?.slice(0, 10) || "";
          if (!betDate) return false;
          if (timeframeRange.start && betDate < timeframeRange.start) return false;
          if (timeframeRange.end && betDate > timeframeRange.end) return false;
        }
        return true;
      }),
    [allBets, filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeRange]
  );

  const activeFilterCount = [filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeFilter.timeframe]
    .filter(value => value !== "ALL").length;

  const clearFilters = () => {
    setFilterBookmaker("ALL");
    setFilterAccount("ALL");
    setFilterSport("ALL");
    setFilterType("ALL");
    setFilterFreebet("ALL");
    setTimeframeFilter({ ...EMPTY_TIMEFRAME_FILTER });
  };

  // Só o dono do painel pode navegar para o histórico (drill-down). Na vista
  // read-only do perfil de um amigo não há `onOpenBets`, por isso os gráficos
  // não devem parecer nem comportar-se como clicáveis.
  const canDrill = Boolean(onOpenBets);

  const openBetsForStatus = (status: BetStatus) => {
    onOpenBets?.({
      status,
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
      timeframe: timeframeFilter.timeframe !== "ALL" ? timeframeFilter.timeframe : undefined,
      dateFrom: timeframeRange.start || undefined,
      dateTo: timeframeRange.end || undefined
    });
  };

  // Drill-down do centro do donut: abre o histórico só com as apostas resolvidas
  // (todas menos POR_LIQUIDAR), respeitando os filtros ativos do painel.
  const openResolvedBets = () => {
    onOpenBets?.({
      status: "RESOLVED",
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
      timeframe: timeframeFilter.timeframe !== "ALL" ? timeframeFilter.timeframe : undefined,
      dateFrom: timeframeRange.start || undefined,
      dateTo: timeframeRange.end || undefined
    });
  };

  const stats = useMemo(() => calculateDashboardStats(bets), [bets]);

  // O Recharts é desenhado em SVG com cores explícitas, por isso não reage
  // às classes `dark:` do Tailwind - as cores dos eixos, grelha e tooltips
  // têm de ser trocadas manualmente conforme o tema efetivo.
  const chart = useMemo(
    () => ({
      grid: isDark ? "#27272a" : "#f4f4f5",
      axis: isDark ? "#71717a" : "#a1a1aa",
      dot: isDark ? "#18181b" : "#fff",
      tooltip: {
        backgroundColor: isDark ? "#18181b" : "#fff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        fontSize: "12px",
        color: isDark ? "#e4e4e7" : "#18181b"
      }
    }),
    [isDark]
  );

  // 1. Prepare data for profit history chart
  // A banca é dinheiro global: usa TODAS as apostas, não o subconjunto
  // filtrado. Filtrar por casa não muda o saldo que se tem no bolso.
  const bankroll = useMemo(
    () => (bankrollMovements ? calculateBankroll(bankrollMovements, allBets) : null),
    [bankrollMovements, allBets],
  );

  // O CLV é por aposta, por isso - ao contrário da banca, que é dinheiro
  // global - usa o subconjunto FILTRADO: faz todo o sentido perguntar "e na
  // Betano, estou a bater a linha?".
  const clv = useMemo(() => calculateClv(bets), [bets]);

  const clvChartData = useMemo(() => {
    if (!clv.hasData) return [];
    return [
      { data: t("bet.start"), clv: 0 },
      ...clv.series.map((point) => ({ data: point.at, clv: point.cumulative })),
    ];
  }, [clv, t]);

  const openClvPendingBets = () => {
    onOpenBets?.({
      status: "ALL",
      clv: "MISSING",
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
    });
  };

  const bankrollChartData = useMemo(() => {
    if (!bankroll) return [];
    return [
      { data: t("bet.start"), balance: 0 },
      ...bankroll.series.map((point) => ({ data: point.at, balance: point.balance })),
    ];
  }, [bankroll, t]);

  const profitChartData = useMemo(() => {
    // Sort settled bets chronologically by dateTime
    // "YYYY-MM-DD HH:mm" só é aceite pelo Date com o "T" - sem o replace o
    // Safari/iOS devolve Invalid Date e a ordenação do gráfico desfaz-se.
    const settledBets = bets
      .filter(b => b.status !== "POR_LIQUIDAR")
      .sort((a, b) => new Date(a.dateTime.replace(" ", "T")).getTime() - new Date(b.dateTime.replace(" ", "T")).getTime());

    let runningProfit = 0;
    const data = settledBets.map((bet, index) => {
      runningProfit += safeNum(bet.netProfit);
      return {
        index: index + 1,
        data: bet.dateTime ? bet.dateTime.split(" ")[0] : t("bet.noDate"), // Just date
        profit: Number(runningProfit.toFixed(2)),
        betProfit: safeNum(bet.netProfit),
        event: (bet.selections && bet.selections[0]?.event) || t("bet.various")
      };
    });

    // If empty, add a default start point
    if (data.length === 0) {
      return [{ index: 0, data: t("bet.noData"), profit: 0, betProfit: 0, event: "" }];
    }

    // Add initial 0 point
    return [{ index: 0, data: t("bet.start"), profit: 0, betProfit: 0, event: t("bet.start") }, ...data];
  }, [bets, t]);

  const monthlyChartBounds = useMemo(() => {
    const settledDates = bets
      .filter(b => b.status !== "POR_LIQUIDAR")
      .map(b => fromLocalDateKey(b.dateTime?.slice(0, 10) || ""))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    const fallback = new Date();
    const rangeStart = fromLocalDateKey(timeframeRange.start) || settledDates[0] || fallback;
    const rangeEnd = fromLocalDateKey(timeframeRange.end) || settledDates.at(-1) || rangeStart;
    const chronologicalStart = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const chronologicalEnd = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    return { start: chronologicalStart, end: chronologicalEnd };
  }, [bets, timeframeRange]);

  const showMonthlyPerformance = useMemo(() => {
    return rangeSpansAtLeastTwoMonths(monthlyChartBounds.start, monthlyChartBounds.end);
  }, [monthlyChartBounds]);

  // 1b. Prepare monthly buckets for the active timeframe. Empty months inside
  // the selected range stay visible with zero values, but months outside it do not.
  const monthlyPerformanceData = useMemo(() => {
    const monthsData: { year: number; month: number; label: string; profit: number; volume: number; betsCount: number }[] = [];
    const firstMonth = new Date(monthlyChartBounds.start.getFullYear(), monthlyChartBounds.start.getMonth(), 1);
    const lastMonth = new Date(monthlyChartBounds.end.getFullYear(), monthlyChartBounds.end.getMonth(), 1);

    for (let cursor = new Date(firstMonth); cursor <= lastMonth; cursor.setMonth(cursor.getMonth() + 1)) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      monthsData.push({
        year: y,
        month: m,
        label: `${formatDate(new Date(y, m, 1), { month: "short" })} ${String(y).substring(2)}`,
        profit: 0,
        volume: 0,
        betsCount: 0
      });
    }

    bets.forEach(b => {
      if (b.status === "POR_LIQUIDAR") return;
      if (!b.dateTime) return;
      
      const datePart = b.dateTime.split(" ")[0];
      const parts = datePart.split("-").map(Number);
      if (parts.length < 2) return;
      const year = parts[0];
      const month = parts[1];
      if (!year || !month) return;
      
      const betMonthIdx = month - 1;
      
      const found = monthsData.find(md => md.year === year && md.month === betMonthIdx);
      if (found) {
        found.profit += safeNum(b.netProfit);
        if (!b.isFreebet) {
          found.volume += safeNum(b.stake);
        }
        found.betsCount++;
      }
    });

    return monthsData.map(md => ({
      month: md.label,
      profit: Number(md.profit.toFixed(2)),
      volume: Number(md.volume.toFixed(2)),
      bets: md.betsCount
    }));
  }, [bets, monthlyChartBounds, formatDate]);

  // 2. Prepare data for Bookmaker distribution
  const bookmakerData = useMemo(() => {
    const counts: Record<string, { stake: number; profit: number; count: number }> = {};
    bets.forEach(b => {
      const bkm = b.bookmaker || t("bet.otherBookmaker");
      if (!counts[bkm]) {
        counts[bkm] = { stake: 0, profit: 0, count: 0 };
      }
      counts[bkm].count++;
      if (b.status !== "POR_LIQUIDAR") {
        if (!b.isFreebet) counts[bkm].stake += safeNum(b.stake);
        counts[bkm].profit += safeNum(b.netProfit);
      }
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      bets: data.count,
      volume: Number(safeNum(data.stake).toFixed(2)),
      profit: Number(safeNum(data.profit).toFixed(2))
    })).sort((a, b) => b.profit - a.profit);
  }, [bets, t]);

  // 3. Prepare data for Bet Status distribution.
  // "Distribuição de Resultados" mostra apenas apostas RESOLVIDAS - as
  // pendentes (POR_LIQUIDAR) não são um resultado. Antes eram incluídas como
  // fatia "Pendente", o que fazia a soma das fatias não bater certo com o
  // número central "Resolvidas". (correção do bug D1)
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      GANHA: 0,
      PERDIDA: 0,
      ANULADA: 0,
      MEIO_GANHA: 0,
      MEIO_PERDIDA: 0,
      CASHOUT: 0,
    };

    bets.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    });

    return [
      { name: t("status.won"), status: "GANHA" as BetStatus, value: statusCounts.GANHA, color: "#10B981" },
      { name: t("status.halfWon"), status: "MEIO_GANHA" as BetStatus, value: statusCounts.MEIO_GANHA, color: "#34D399" },
      { name: t("status.cashout"), status: "CASHOUT" as BetStatus, value: statusCounts.CASHOUT, color: "#8B5CF6" },
      { name: t("status.void"), status: "ANULADA" as BetStatus, value: statusCounts.ANULADA, color: "#9CA3AF" },
      { name: t("status.halfLost"), status: "MEIO_PERDIDA" as BetStatus, value: statusCounts.MEIO_PERDIDA, color: "#F87171" },
      { name: t("status.lost"), status: "PERDIDA" as BetStatus, value: statusCounts.PERDIDA, color: "#EF4444" },
    ].filter(item => item.value > 0);
  }, [bets, t]);

  // Freebet summary stats (calculated solely from registered bets)
  const freebetStats = useMemo(() => {
    const freebetBets = bets.filter(b => b.isFreebet);
    const resolvedFreebetBets = freebetBets.filter(b => b.status !== "POR_LIQUIDAR");
    const fbProfit = resolvedFreebetBets.reduce((sum, b) => sum + safeNum(b.netProfit), 0);
    const fbWins = resolvedFreebetBets.filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA").length;
    const totalStakeUsed = freebetBets.reduce((sum, b) => sum + safeNum(b.stake), 0);

    return {
      usageCount: freebetBets.length,
      resolvedCount: resolvedFreebetBets.length,
      totalStakeUsed,
      profit: fbProfit,
      winRate: resolvedFreebetBets.length > 0 ? (fbWins / resolvedFreebetBets.length) * 100 : 0
    };
  }, [bets]);

  // Insights helper
  const insights = useMemo(() => {
    const settled = bets.filter(b => b.status !== "POR_LIQUIDAR");
    if (settled.length === 0) return null;

    const highestWin = [...settled]
      .filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA")
      .sort((a, b) => safeNum(b.netProfit) - safeNum(a.netProfit))[0];

    const settledWins = settled.filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA");
    const averageWonOdd = settledWins.length > 0
      ? settledWins.reduce((acc, curr) => acc + safeNum(curr.odd), 0) / settledWins.length
      : 1.00;

    const bestBkm = bookmakerData[0];

    return {
      highestWin,
      averageWonOdd: Number(averageWonOdd.toFixed(2)),
      bestBkm
    };
  }, [bets, bookmakerData]);

  return (
    <div className="space-y-6" id="dashboard-tab">

      {/* Filtros (D2) */}
      <div className="overflow-visible rounded-sm border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900" id="dashboard-filters">
        <FiltersBar
          activeFilterCount={activeFilterCount}
          onClear={clearFilters}
          trailing={
            <span className="shrink-0 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {t("dashboard.betsOf", { shown: bets.length, total: allBets.length })}
            </span>
          }
        >
          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterBookmaker}
            options={[{ value: "ALL", label: t("filters.allBookmakers") }, ...bookmakerOptions.map(bookmaker => ({ value: bookmaker, label: bookmaker }))]}
            onChange={setFilterBookmaker}
            ariaLabel={t("filters.bookmakerAria")}
          />

          {accounts.length > 0 && (
            <FilterDropdown
              className="flex-1 min-w-40"
              value={filterAccount}
              options={[
                { value: "ALL", label: t("filters.allAccounts") },
                ...accounts.map(account => ({ value: account.id, label: `${account.bookmaker} · ${account.label}` })),
                { value: "NONE", label: t("filters.noAccount") }
              ]}
              onChange={setFilterAccount}
              ariaLabel={t("filters.accountAria")}
            />
          )}

          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterSport}
            options={[{ value: "ALL", label: t("filters.allSports") }, ...sportOptions.map(sport => ({ value: sport, label: sport }))]}
            onChange={setFilterSport}
            ariaLabel={t("filters.sportAria")}
          />

          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterType}
            options={[
              { value: "ALL", label: t("filters.anyType") },
              { value: "SIMPLES", label: t("filters.type.single") },
              { value: "MULTIPLA", label: t("filters.type.multiple") }
            ]}
            onChange={setFilterType}
            ariaLabel={t("filters.typeAria")}
          />

          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterFreebet}
            options={[
              { value: "ALL", label: t("filters.money.all") },
              { value: "NORMAL", label: t("filters.money.real") },
              { value: "FREEBET", label: t("filters.money.freebet") },
              { value: "RISK_FREE", label: t("filters.money.riskFree") }
            ]}
            onChange={setFilterFreebet}
            ariaLabel={t("filters.moneyAria")}
          />

          <TimeframeFilter
            className="flex-1 min-w-40"
            value={timeframeFilter}
            onChange={setTimeframeFilter}
          />
        </FiltersBar>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-net-profit">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("dashboard.netProfit")}</p>
              <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-mono ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatSignedMoney(stats.netProfit, currency)}
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{t("dashboard.return")}: <strong className="text-zinc-700 dark:text-zinc-200 font-medium">{formatMoney(stats.totalReturn, currency)}</strong></span>
            <span className={`font-semibold flex items-center gap-0.5 ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? "+" : ""}{stats.totalStake > 0 ? (safeNum(stats.netProfit / stats.totalStake) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>

        {/* ROI / Yield Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-roi">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("dashboard.roi")}</p>
              <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-mono ${stats.yield >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.yield >= 0 ? "+" : ""}{safeNum(stats.yield).toFixed(2)}%
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.yield >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{t("dashboard.volume")}: <strong className="text-zinc-700 dark:text-zinc-200 font-medium">{formatMoney(stats.totalStake, currency)}</strong></span>
            <span className="text-zinc-400 dark:text-zinc-500">{t("dashboard.efficiency")}</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-winrate">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("dashboard.winRate")}</p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-zinc-800 dark:text-zinc-100 font-mono">
                {safeNum(stats.winRate).toFixed(1)}%
              </h3>
            </div>
            <div className="p-2 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 text-xs">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              <span>{t("dashboard.statWon", { n: stats.wonBets })}</span>
              <span>{t("dashboard.statResolved", { n: bets.filter(b => b.status !== "POR_LIQUIDAR").length })}</span>
            </div>
          </div>
        </div>

        {/* Total Bets Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-totalbets">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("dashboard.totalBets")}</p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-zinc-800 dark:text-zinc-100 font-mono">
                {stats.totalBets} <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">{t("dashboard.registered")}</span>
              </h3>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {t("dashboard.statPending", { n: stats.pendingBets })}</span>
            <span className="text-zinc-400 dark:text-zinc-500">{t("dashboard.active")}</span>
          </div>
        </div>

      </div>

      {/* Banca. Só aparece a quem tem banca registada (e nunca na vista de um
          amigo, que não recebe os movimentos). */}
      {bankroll?.hasData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between" id="card-bankroll">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("dashboard.bankroll.title")}</p>
                <h3 className="text-2xl font-bold mt-1.5 tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
                  {formatMoney(bankroll.balance, currency)}
                </h3>
              </div>
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <PiggyBank size={18} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>{t("dashboard.bankroll.available")}</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-medium font-mono">{formatMoney(bankroll.available, currency)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.bankroll.exposure")}</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-medium font-mono">{formatMoney(bankroll.exposure, currency)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.bankroll.roi")}</span>
                <strong className={`font-medium font-mono ${bankroll.roi === null ? "text-zinc-400 dark:text-zinc-500" : bankroll.roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {bankroll.roi === null ? "-" : `${bankroll.roi >= 0 ? "+" : ""}${bankroll.roi.toFixed(2)}%`}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.bankroll.drawdown")}</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-medium font-mono">
                  {formatMoney(bankroll.maxDrawdown, currency)}
                  {bankroll.maxDrawdownPct !== null && ` (${bankroll.maxDrawdownPct.toFixed(1)}%)`}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px] lg:col-span-2" id="chart-bankroll-evolution">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("dashboard.bankroll.chartTitle")}</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.bankroll.chartDesc")}</p>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bankrollChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBankroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="data" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: chart.axis }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: chart.axis }} tickFormatter={(v) => `${v}${currency}`} />
                  <Tooltip
                    formatter={(value: any) => [formatMoney(Number(value), currency), t("dashboard.bankroll.title")]}
                    contentStyle={chart.tooltip}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBankroll)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CLV: a odd apanhada contra a linha de fecho. Ao contrário do resto do
          painel, inclui as apostas por liquidar - é essa a graça da métrica. */}
      {!clvEnabled ? (
        <ClvLockPanel onSubscribe={onSubscribe} />
      ) : clv.hasData ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between" id="card-clv">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("clv.avg")}</p>
                <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-mono ${clv.avgClvPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {clv.avgClvPct >= 0 ? "+" : ""}{clv.avgClvPct.toFixed(2)}%
                </h3>
              </div>
              <div className={`p-2 rounded ${clv.avgClvPct >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
                <Crosshair size={18} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>{t("clv.beatRate")}</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-medium font-mono">{clv.beatCloseRate.toFixed(1)}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("clv.money")}</span>
                <strong className={`font-medium font-mono ${clv.moneyClv >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatSignedMoney(clv.moneyClv, currency)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("clv.weighted")}</span>
                <strong className={`font-medium font-mono ${clv.weightedClvPct === null ? "text-zinc-400 dark:text-zinc-500" : clv.weightedClvPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {clv.weightedClvPct === null ? "-" : `${clv.weightedClvPct >= 0 ? "+" : ""}${clv.weightedClvPct.toFixed(2)}%`}
                </strong>
              </div>
              {clv.noVigBets > 0 && (
                <div className="flex items-center justify-between" title={t("clv.noVigHelp")}>
                  <span>{t("clv.noVig")}</span>
                  <strong className={`font-medium font-mono ${clv.noVigAvgClvPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {t("clv.noVigValue", {
                      n: clv.noVigBets,
                      pct: `${clv.noVigAvgClvPct >= 0 ? "+" : ""}${clv.noVigAvgClvPct.toFixed(1)}%`,
                    })}
                  </strong>
                </div>
              )}
              {clv.promoBets > 0 && (
                <div className="flex items-center justify-between" title={t("clv.promoHelp")}>
                  <span>{t("clv.promo")}</span>
                  <strong className="text-zinc-500 dark:text-zinc-400 font-medium font-mono">
                    {t("clv.promoValue", {
                      n: clv.promoBets,
                      pct: `${clv.promoAvgClvPct >= 0 ? "+" : ""}${clv.promoAvgClvPct.toFixed(1)}%`,
                    })}
                  </strong>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>{t("clv.coverage")}</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-medium font-mono">
                  {t("clv.coverageValue", { tracked: clv.trackedBets, eligible: clv.eligibleBets })}
                </strong>
              </div>
            </div>
            {/* Por casa: só faz sentido quando há mais do que uma para
                comparar - e é a comparação que diz onde vale a pena apostar. */}
            {clv.byBookmaker.length > 1 && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {t("clv.byBookmaker")}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {clv.byBookmaker.slice(0, 4).map((row) => (
                    <li key={row.bookmaker} className="flex items-center justify-between text-xs">
                      <span className="truncate text-zinc-500 dark:text-zinc-400">
                        {row.bookmaker || t("bet.otherBookmaker")}{" "}
                        <span className="text-zinc-300 dark:text-zinc-600">({row.bets})</span>
                      </span>
                      <strong className={`font-mono font-medium ${row.avgClvPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {row.avgClvPct >= 0 ? "+" : ""}{row.avgClvPct.toFixed(2)}%
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {clv.pendingFill > 0 && onSetClosingOdd && (
              <button
                type="button"
                onClick={() => setIsClosingOddsOpen(true)}
                className="mt-3 w-full rounded-sm bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
              >
                {t("clv.fill.cta", { n: clv.pendingFill })}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px] lg:col-span-2" id="chart-clv-evolution">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("clv.chartTitle")}</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("clv.chartDesc")}</p>
              </div>
              {clv.pendingFill > 0 && canDrill && (
                <button
                  type="button"
                  onClick={openClvPendingBets}
                  className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t("clv.fill.pending", { n: clv.pendingFill })}
                </button>
              )}
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clvChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                  <XAxis dataKey="data" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: chart.axis }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: chart.axis }} tickFormatter={(v) => `${v}${currency}`} />
                  <Tooltip
                    formatter={(value: any) => [formatSignedMoney(Number(value), currency), t("clv.money")]}
                    contentStyle={chart.tooltip}
                  />
                  <Area type="monotone" dataKey="clv" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorClv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">{t("clv.help")}</p>
          </div>
        </div>
      ) : (
        // Sem uma única odd de fecho a secção seria invisível. Este cartão
        // explica a métrica e dá o caminho mais curto para a experimentar.
        clv.pendingFill > 0 && onSetClosingOdd && (
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800" id="card-clv-empty">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
                <Crosshair size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("clv.empty.title")}</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("clv.empty.desc")}</p>
                <button
                  type="button"
                  onClick={() => setIsClosingOddsOpen(true)}
                  className="mt-3 rounded-sm bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
                >
                  {t("clv.fill.cta", { n: clv.pendingFill })}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {isClosingOddsOpen && clvEnabled && onSetClosingOdd && (
        <ClosingOddsModal
          bets={allBets}
          onClose={() => setIsClosingOddsOpen(false)}
          onSetClosingOdd={onSetClosingOdd}
        />
      )}

      {/* Main Charts Row */}
      <div className={`grid grid-cols-1 gap-6 ${showMonthlyPerformance ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        
        {/* Evolution Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-profit-evolution">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("dashboard.evolution.title")}</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.evolution.desc")}</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profitChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickFormatter={(v) => `${v}${currency}`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatMoney(Number(value), currency), t("dashboard.cumulativeProfit")]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const payloadData = payload[0].payload;
                      return t("dashboard.evolution.tooltip", {
                        index: payloadData.index,
                        date: payloadData.data,
                        event: payloadData.event,
                      });
                    }
                    return label;
                  }}
                  contentStyle={chart.tooltip}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-status-distribution">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-1">{t("dashboard.statusDistribution.title")}</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">{t("dashboard.statusDistribution.desc")}</p>
          
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {statusData.length > 0 ? (
              <>
                <div className="relative flex-1 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            onClick={canDrill ? () => openBetsForStatus(entry.status) : undefined}
                            className={`outline-none transition-opacity ${canDrill ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [t("dashboard.betsTooltip", { n: value })]}
                        contentStyle={chart.tooltip}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Text - clicável: leva ao histórico das resolvidas */}
                  <button
                    type="button"
                    onClick={openResolvedBets}
                    disabled={!onOpenBets}
                    title={onOpenBets ? t("dashboard.resolvedDrill") : undefined}
                    className={`group absolute flex flex-col items-center text-center bg-transparent border-0 outline-none rounded-sm ${onOpenBets ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className={`text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest transition-colors ${canDrill ? "group-hover:text-emerald-600 dark:group-hover:text-emerald-400" : ""}`}>{t("dashboard.resolved")}</span>
                    <span className={`text-2xl font-bold text-zinc-800 dark:text-zinc-100 font-mono mt-0.5 ${canDrill ? "group-hover:underline" : ""}`}>
                      {bets.filter(b => b.status !== "POR_LIQUIDAR").length}
                    </span>
                  </button>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  {statusData.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={canDrill ? () => openBetsForStatus(item.status) : undefined}
                      disabled={!canDrill}
                      className={`group flex items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-zinc-600 transition-colors dark:text-zinc-200 ${canDrill ? "hover:bg-zinc-50 hover:text-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer" : "cursor-default"}`}
                      title={canDrill ? t("dashboard.viewBetsFor", { name: item.name }) : undefined}
                    >
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                      <span className={`truncate ${canDrill ? "group-hover:underline" : ""}`}>{item.name} ({item.value})</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                <AlertCircle className="stroke-1 text-zinc-300 dark:text-zinc-600 mb-2" size={32} />
                <p className="text-xs">{t("dashboard.noResults")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Chart */}
        {showMonthlyPerformance && (
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-monthly-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("dashboard.monthly.title")}</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.monthly.desc")}</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyPerformanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickFormatter={(v) => `${v}${currency}`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatMoney(Number(value), currency), t("dashboard.netProfit")]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const payloadData = payload[0].payload;
                      return t("dashboard.monthly.tooltip", {
                        month: payloadData.month,
                        bets: payloadData.bets,
                        volume: formatMoney(payloadData.volume, currency),
                      });
                    }
                    return label;
                  }}
                  contentStyle={chart.tooltip}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: chart.dot }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

      </div>

      {/* Bookmaker Breakdown & Freebets Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookmaker Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 lg:col-span-2 flex flex-col" id="bookmakers-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{t("dashboard.bookmakers.title")}</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.bookmakers.desc")}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">{t("dashboard.table.operator")}</th>
                  <th className="py-2.5 text-center">{t("dashboard.table.bets")}</th>
                  <th className="py-2.5 text-right">{t("dashboard.volume")}</th>
                  <th className="py-2.5 text-right">{t("dashboard.netProfit")}</th>
                  <th className="py-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bookmakerData.map((bkm, idx) => {
                  const bkmRoi = bkm.volume > 0 ? (bkm.profit / bkm.volume) * 100 : 0;
                  return (
                    <tr key={idx} className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 font-medium text-zinc-800 dark:text-zinc-100">{bkm.name}</td>
                      <td className="py-2.5 text-center">{bkm.bets}</td>
                      <td className="py-2.5 text-right font-mono">{formatMoney(bkm.volume, currency)}</td>
                      <td className={`py-2.5 text-right font-semibold font-mono ${bkm.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {formatSignedMoney(bkm.profit, currency)}
                      </td>
                      <td className={`py-2.5 text-right font-medium font-mono ${bkmRoi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {bkmRoi >= 0 ? "+" : ""}{bkmRoi.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {bookmakerData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-400 dark:text-zinc-500">{t("dashboard.noRecords")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Freebets Overview card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between" id="freebets-performance-summary">
          <div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-1">{t("dashboard.freebets.title")}</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">{t("dashboard.freebets.desc")}</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{t("dashboard.freebets.count")}:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{freebetStats.usageCount}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{t("dashboard.freebets.invested")}:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{formatMoney(freebetStats.totalStakeUsed, currency)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">{t("dashboard.freebets.profit")}:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatSignedMoney(freebetStats.profit, currency)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{t("dashboard.freebets.winRate")}:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{safeNum(freebetStats.winRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
              <span>{t("dashboard.freebets.resolvedRatio")}:</span>
              <span>{t("dashboard.freebets.ofTotal", { resolved: freebetStats.resolvedCount, total: freebetStats.usageCount })}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${freebetStats.usageCount > 0 
                    ? (freebetStats.resolvedCount / freebetStats.usageCount) * 100 
                    : 0}%` 
                }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Insights Row */}
      {insights && (
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-insights">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded mt-0.5 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t("dashboard.insights.bestBookmaker")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.insights.bestBookmakerHint")}</p>
              {insights.bestBkm && insights.bestBkm.profit > 0 ? (
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1">
                  {insights.bestBkm.name} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">({formatSignedMoney(safeNum(insights.bestBkm.profit), currency)})</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">{t("dashboard.insights.notEnoughData")}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded mt-0.5 shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t("dashboard.insights.avgOdd")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.insights.avgOddHint")}</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1 font-mono">
                {insights.averageWonOdd > 1 ? safeNum(insights.averageWonOdd).toFixed(2) : "1.00"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded mt-0.5 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t("dashboard.insights.biggestWin")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("dashboard.insights.biggestWinHint")}</p>
              {insights.highestWin ? (
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1 truncate max-w-[200px]">
                  {formatSignedMoney(safeNum(insights.highestWin.netProfit), currency)}
                  <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1">
                    ({insights.highestWin.selections && insights.highestWin.selections[0]?.event || t("bet.multiple")})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">{t("dashboard.insights.noWin")}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
