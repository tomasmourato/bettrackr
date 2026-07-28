// src/mobile/screens/MobileInsights.tsx
// AI Insights mobile, duas secções (SegmentedControl):
//  1) Dicas do dia (/api/insights, cacheadas por dia) com pull-to-refresh;
//  2) Avaliar aposta: print (câmara/galeria/ficheiro) e/ou texto -> a IA estima
//     o Valor Esperado, odd justa, edge e Kelly (POST /api/insights/evaluate).
// Mesma lógica e mesmos avisos do AIInsights desktop.

import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  Camera as CameraIcon,
  Image as ImageIcon,
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  ListChecks,
  Check,
} from "lucide-react";
import { authFetch, parseJsonResponse, SessionExpiredError } from "../../lib/authApi";
import { useI18n } from "../../lib/i18n";
import { useLoadingSteps, evalStepsFor, PICKS_STEPS, type LoadingStep } from "../../hooks/useLoadingSteps";
import { isNativeApp } from "../../lib/apiBase";
import {
  requestBetEvaluation,
  verdictTone,
  formatEvPct,
  type BetEvaluationResponse,
  type EvaluatedBet,
} from "../../lib/betEvaluation";
import { SectionHeader, MobileCard, Pressable, PullToRefresh, SegmentedControl, useToast } from "../ui";

interface Pick {
  sport: string;
  competition: string;
  match: string;
  kickoffLisbon: string;
  market: string;
  selection: string;
  approxOdd: number | null;
  confidence: number;
  rationale: string;
}

interface InsightsResponse {
  date: string;
  generatedAt: string;
  summary: string;
  picks: Pick[];
}

interface MobileInsightsProps {
  onSessionExpired: () => void;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function ConfidenceDots({ level }: { level: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-0.5" title={t("insights.confidenceLevel", { level })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`}></span>
      ))}
    </span>
  );
}

function toneClasses(bet: EvaluatedBet) {
  const tone = verdictTone(bet.verdict);
  if (tone === "positive")
    return {
      badge: "bg-emerald-600 text-white",
      soft: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
      Icon: TrendingUp,
    };
  if (tone === "negative")
    return {
      badge: "bg-rose-600 text-white",
      soft: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
      Icon: TrendingDown,
    };
  return {
    badge: "bg-zinc-600 text-white",
    soft: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
    Icon: Minus,
  };
}

/** Abre a câmara/galeria nativa e devolve a imagem como data URL. */
async function pickNativePhoto(source: "camera" | "photos"): Promise<string | null> {
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    quality: 85,
    width: 1600,
    correctOrientation: true,
  });
  return photo.dataUrl ?? null;
}

// Cartão de espera com os passos da IA (mesmo texto do desktop).
function AiProgress({ active, steps, hint }: { active: boolean; steps: LoadingStep[]; hint: string }) {
  const { t } = useI18n();
  const { index, elapsed, key } = useLoadingSteps(active, steps);

  return (
    <MobileCard className="!p-6 flex flex-col items-center gap-4 text-center">
      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>

      <div>
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{key ? t(key) : ""}</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{hint}</p>
      </div>

      <ul className="space-y-1.5 text-left w-full">
        {steps.slice(0, index + 1).map((step, i) => {
          const done = i < index;
          return (
            <li key={i} className="flex items-center gap-2 text-[11px]">
              {done ? (
                <Check size={12} className="text-emerald-500 shrink-0" strokeWidth={3} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mx-[3px]"></span>
              )}
              <span className={done ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-200 font-medium"}>
                {t(step.key)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums">{t("insights.elapsed", { n: elapsed })}</p>
    </MobileCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">{value}</p>
    </div>
  );
}

export default function MobileInsights({ onSessionExpired }: MobileInsightsProps) {
  const { t, lang, formatDate, formatTime } = useI18n();
  const toast = useToast();
  const [mode, setMode] = useState<"picks" | "evaluate">("picks");

  // ---- Dicas do dia ----
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await authFetch(`/api/insights?lang=${lang}`);
      const body = await parseJsonResponse(res);
      if (!res.ok) throw new Error(body.error || t("insights.error.picks"));
      setData(body as InsightsResponse);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      setError(err instanceof Error ? err.message : t("insights.error.unexpected"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Avaliar aposta ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evalText, setEvalText] = useState("");
  const [evalImage, setEvalImage] = useState<string | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<BetEvaluationResponse | null>(null);
  const native = isNativeApp();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setEvalError(t("insights.error.notImage"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setEvalError(t("insights.error.tooLargePrint"));
      return;
    }
    setEvalError(null);
    const reader = new FileReader();
    reader.onloadend = () => setEvalImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNativePick = async (source: "camera" | "photos") => {
    try {
      const dataUrl = await pickNativePhoto(source);
      if (!dataUrl) return;
      if (dataUrl.length * 0.75 > MAX_IMAGE_BYTES) {
        setEvalError(t("insights.error.tooLargePhoto"));
        return;
      }
      setEvalError(null);
      setEvalImage(dataUrl);
    } catch {
      /* utilizador cancelou — não é erro */
    }
  };

  const runEvaluation = async () => {
    if (!evalText.trim() && !evalImage) return;
    setEvalLoading(true);
    setEvalError(null);
    setEvaluation(null);
    try {
      const result = await requestBetEvaluation(
        {
          imageBase64: evalImage ?? undefined,
          text: evalText.trim() || undefined,
          lang,
        },
        t("ai.evalError"),
      );
      setEvaluation(result);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      const msg = err instanceof Error ? err.message : t("insights.error.unexpected");
      setEvalError(msg);
      toast.show(msg, "error");
    } finally {
      setEvalLoading(false);
    }
  };

  // Agrupa picks por desporto.
  const groups = new Map<string, Pick[]>();
  for (const pick of data?.picks ?? []) {
    const list = groups.get(pick.sport) || [];
    list.push(pick);
    groups.set(pick.sport, list);
  }

  const formattedDate = data?.date
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(new Date(`${data.date}T12:00:00`))
    : "";
  const generatedTime = data?.generatedAt
    ? new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.generatedAt))
    : "";

  const header = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" /> AI Insights
          </h3>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {mode === "picks"
              ? formattedDate
                ? `Dicas para ${formattedDate}${generatedTime ? ` · ${generatedTime}` : ""}`
                : t("insights.picksSubtitleShort")
              : "Print e/ou texto — a IA estima o Valor Esperado"}
          </p>
        </div>
        {mode === "picks" && (
          <Pressable
            as="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={loading}
            aria-label={t("insights.refreshAria")}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Pressable>
        )}
      </div>

      <SegmentedControl
        segments={[
          { value: "picks", label: t("insights.picksTab") },
          { value: "evaluate", label: t("insights.evaluateTab") },
        ]}
        value={mode}
        onChange={(v) => setMode(v as "picks" | "evaluate")}
      />

      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
        <ShieldAlert size={15} className="shrink-0 mt-0.5" />
        <span>{t("insights.disclaimer")}</span>
      </div>
    </div>
  );

  // ---------- MODO: DICAS DE HOJE ----------
  if (mode === "picks") {
    return (
      <PullToRefresh onRefresh={load}>
        <div className="space-y-4">
          {header}

          {loading && (
            <AiProgress
              active={loading}
              steps={PICKS_STEPS}
              hint={t("insights.picksHint")}
            />
          )}

          {!loading && error && (
            <MobileCard className="!p-6 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={20} className="text-rose-500" />
              <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
              <Pressable
                as="button"
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
              >
                {t("insights.retry")}
              </Pressable>
            </MobileCard>
          )}

          {!loading && !error && data && (
            <>
              {data.summary && (
                <MobileCard className="flex items-start gap-3">
                  <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{data.summary}</p>
                </MobileCard>
              )}

              {[...groups.entries()].map(([sport, picks]) => (
                <div key={sport}>
                  <SectionHeader>{sport}</SectionHeader>
                  <div className="space-y-3">
                    {picks.map((pick, i) => (
                      <MobileCard key={`${pick.match}-${i}`} className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{pick.match}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                              {pick.competition}
                              {pick.kickoffLisbon && (
                                <>
                                  <span>·</span>
                                  <Clock size={10} /> {pick.kickoffLisbon}
                                </>
                              )}
                            </p>
                          </div>
                          {pick.approxOdd !== null && (
                            <span className="shrink-0 text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2 py-1 rounded-lg">
                              @{pick.approxOdd.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                            {pick.market}: <span className="text-emerald-600 dark:text-emerald-300">{pick.selection}</span>
                          </span>
                          <ConfidenceDots level={pick.confidence} />
                        </div>

                        {pick.rationale && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{pick.rationale}</p>
                        )}
                      </MobileCard>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center pb-2">
                {t("insights.oddsNoteShort")}
              </p>
            </>
          )}
        </div>
      </PullToRefresh>
    );
  }

  // ---------- MODO: AVALIAR APOSTA ----------
  return (
    <div className="space-y-4">
      {header}

      <MobileCard className="space-y-3">
        <textarea
          value={evalText}
          onChange={(e) => setEvalText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("insights.evalPlaceholderShort")}
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 resize-y"
        />

        {native ? (
          <div className="grid grid-cols-2 gap-2">
            <Pressable
              as="button"
              onClick={() => void handleNativePick("camera")}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold"
            >
              <CameraIcon size={16} /> Foto
            </Pressable>
            <Pressable
              as="button"
              onClick={() => void handleNativePick("photos")}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold"
            >
              <ImageIcon size={16} /> Galeria
            </Pressable>
          </div>
        ) : (
          <Pressable
            as="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold"
          >
            <ImageIcon size={16} /> {evalImage ? "Trocar print" : "Anexar print"}
          </Pressable>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {evalImage && (
          <div className="relative">
            <img
              src={evalImage}
              alt={t("insights.printAlt")}
              className="w-full max-h-40 object-contain rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
            />
            <Pressable
              as="button"
              onClick={() => setEvalImage(null)}
              aria-label={t("insights.removeImage")}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-zinc-900/80 text-white flex items-center justify-center"
            >
              <X size={14} />
            </Pressable>
          </div>
        )}

        {evalError && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{evalError}</p>}

        <Pressable
          as="button"
          onClick={() => void runEvaluation()}
          disabled={evalLoading || (!evalText.trim() && !evalImage)}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          {evalLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></div>
              A avaliar…
            </>
          ) : (
            <>
              <Send size={15} /> {t("insights.evaluate")}
            </>
          )}
        </Pressable>
      </MobileCard>

      {evalLoading && (
        <AiProgress
          active={evalLoading}
          steps={evalStepsFor(Boolean(evalImage))}
          hint={t("insights.evalHint")}
        />
      )}

      {!evalLoading && evaluation && (
        <div className="space-y-4">
          {evaluation.summary && (
            <MobileCard className="flex items-start gap-3">
              <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{evaluation.summary}</p>
            </MobileCard>
          )}

          {evaluation.bets.map((bet, i) => {
            const tc = toneClasses(bet);
            const halfKellyPct = bet.kellyFraction > 0 ? (bet.kellyFraction * 50).toFixed(1) : null;
            return (
              <MobileCard key={i} className="!p-0 overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{bet.event}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {[bet.competition, bet.bookmaker].filter(Boolean).join(" · ")}
                      {bet.type === "MULTIPLA" && ` · ${t("filters.type.multiple")}`}
                    </p>
                    <p className="text-xs mt-1.5">
                      <span className="text-zinc-500 dark:text-zinc-400">{bet.market}: </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-300">{bet.selection}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold font-mono ${tc.badge}`}>
                      <tc.Icon size={14} /> {formatEvPct(bet.expectedValuePct)}
                    </span>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
                      {t("insights.expectedValue")}
                    </p>
                  </div>
                </div>

                <div className={`px-4 py-2 border-b text-[11px] font-semibold ${tc.soft}`}>
                  {t("insights.verdictLineShort", { verdict: bet.verdictLabel, ev: formatEvPct(bet.expectedValuePct) })}
                </div>

                <div className="p-4 grid grid-cols-3 gap-3 text-center">
                  <Metric label={t("insights.metric.offeredOddShort")} value={bet.offeredOdd.toFixed(2)} />
                  <Metric label={t("insights.metric.fairOdd")} value={bet.fairOdd.toFixed(2)} />
                  <Metric label={t("insights.metric.edge")} value={`${bet.edgePct >= 0 ? "+" : ""}${bet.edgePct.toFixed(1)}%`} />
                  <Metric label={t("insights.metric.estProbShort")} value={`${(bet.estimatedProbability * 100).toFixed(1)}%`} />
                  <Metric label={t("insights.metric.marketProbShort")} value={`${(bet.impliedProbability * 100).toFixed(1)}%`} />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t("insights.confidence")}</p>
                    <div className="mt-1.5 flex justify-center">
                      <ConfidenceDots level={bet.confidence} />
                    </div>
                  </div>
                </div>

                {halfKellyPct && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t("insights.kellyLabel")}{" "}
                      {t("insights.kellyNote", { pct: halfKellyPct })}
                    </p>
                  </div>
                )}

                <div className="px-4 pb-4 space-y-3">
                  {bet.justification && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{bet.justification}</p>
                  )}

                  {bet.keyFactors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                        <ListChecks size={12} /> Fatores-chave
                      </p>
                      <ul className="space-y-1">
                        {bet.keyFactors.map((f, j) => (
                          <li key={j} className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-1 shrink-0">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {bet.risks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                        <AlertTriangle size={12} /> Riscos
                      </p>
                      <ul className="space-y-1">
                        {bet.risks.map((r, j) => (
                          <li key={j} className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-1 shrink-0">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {bet.legs && bet.legs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                        {t("insights.legs")}
                      </p>
                      <div className="space-y-1">
                        {bet.legs.map((leg, j) => (
                          <div
                            key={j}
                            className="flex items-center justify-between gap-2 text-[11px] bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5"
                          >
                            <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-200">
                              {leg.event} — <span className="text-emerald-600 dark:text-emerald-300">{leg.selection}</span>
                            </span>
                            <span className="shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                              {(leg.estimatedProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
