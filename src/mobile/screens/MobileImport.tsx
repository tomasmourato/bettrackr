// src/mobile/screens/MobileImport.tsx
// Importador por fotografia mobile: "Tirar foto" / "Galeria" via
// @capacitor/camera na app nativa (fallback web = input de ficheiro), envia
// para /api/parse-screenshot (Gemini) e revê cada boletim detetado numa
// página-folha antes de gravar. Fluxo e regras espelham o ScreenshotImporter
// desktop (fila de vários boletins por imagem incluída).

import { useMemo, useRef, useState } from "react";
import { Camera as CameraIcon, Image as ImageIcon, Sparkles, X, PlusCircle } from "lucide-react";
import { Bet, Selection, BetStatus, BetType, FreebetType } from "../../types";
import { AVAILABLE_BOOKMAKERS, calculateBetReturnAndProfit } from "../../utils";
import { defaultFreebetTypeFor } from "../../lib/bookmakers";
import { authFetch, parseJsonResponse } from "../../lib/authApi";
import { matchBookmaker, matchStatus } from "../../lib/screenshotMatch";
import { isNativeApp } from "../../lib/apiBase";
import { useI18n, type TKey } from "../../lib/i18n";
import {
  MobileCard,
  SheetPage,
  Pressable,
  ChipGroup,
  SegmentedControl,
  useToast,
} from "../ui";

interface MobileImportProps {
  currency: string;
  onAddBet: (bet: Bet) => void | Promise<void>;
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const STATUS_FORM_OPTIONS: { value: string; key: TKey }[] = [
  { value: "POR_LIQUIDAR", key: "status.unsettled" },
  { value: "GANHA", key: "status.won" },
  { value: "PERDIDA", key: "status.lost" },
  { value: "MEIO_GANHA", key: "status.halfWon" },
  { value: "MEIO_PERDIDA", key: "status.halfLost" },
  { value: "CASHOUT", key: "status.cashout" },
  { value: "ANULADA", key: "status.void" },
];

const inputClasses =
  "w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500";

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

export default function MobileImport({ currency, onAddBet }: MobileImportProps) {
  const { t, formatMoney, formatSignedMoney } = useI18n();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fila de boletins detetados na mesma imagem (G1).
  const [detectedBets, setDetectedBets] = useState<any[]>([]);
  const [detectedIndex, setDetectedIndex] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Campos de revisão/edição.
  const [editBookmaker, setEditBookmaker] = useState("Betano");
  const [editType, setEditType] = useState<BetType>("SIMPLES");
  const [editStatus, setEditStatus] = useState<BetStatus>("POR_LIQUIDAR");
  const [editStake, setEditStake] = useState("10.00");
  const [editCashoutReturn, setEditCashoutReturn] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isFreebet, setIsFreebet] = useState(false);
  const [editFreebetType, setEditFreebetType] = useState<FreebetType>("SNR");
  const [editSelections, setEditSelections] = useState<Array<{ event: string; market: string; choice: string; odd: string }>>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDetectedBet = (data: any) => {
    const matchedBk = matchBookmaker(data.bookmaker);
    setEditBookmaker(matchedBk);
    setEditFreebetType(defaultFreebetTypeFor(matchedBk));
    setEditType(data.type === "SIMPLES" || data.type === "MULTIPLA" ? data.type : "SIMPLES");
    const status = matchStatus(data.status);
    setEditStatus(status);
    setIsFreebet(data.isFreebet === true);
    setEditStake(data.stake ? data.stake.toString() : "10.00");
    setEditCashoutReturn(status === "CASHOUT" ? String(data.cashoutReturn ?? data.finalReturn ?? "") : "");
    setEditDateTime(data.dateTime || new Date().toISOString().replace("T", " ").slice(0, 16));
    setEditSelections(
      (data.selections || []).map((s: any) => ({
        event: s.event || "",
        market: s.market || "",
        choice: s.choice || "",
        odd: s.odd ? s.odd.toString() : "1.50",
      })),
    );
    setEditNotes(t("import.aiNote"));
    setFormError(null);
  };

  const analyze = async (imageBase64: string) => {
    setIsLoading(true);
    setSelectedImage(imageBase64);
    setLoadingStep(t("import.step.upload"));

    const steps = [
      window.setTimeout(() => setLoadingStep(t("import.step.connect")), 1500),
      window.setTimeout(() => setLoadingStep(t("import.step.extract")), 3500),
    ];

    try {
      const response = await authFetch("/api/parse-screenshot", {
        method: "POST",
        body: JSON.stringify({ imageBase64 }),
      });
      const resData = await parseJsonResponse(response);
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || t("import.error.noData"));
      }

      const betsArr: any[] = Array.isArray(resData.data?.bets) ? resData.data.bets : resData.data ? [resData.data] : [];
      if (betsArr.length === 0) throw new Error(t("import.error.noBets"));

      setDetectedBets(betsArr);
      setDetectedIndex(0);
      setImportedCount(0);
      loadDetectedBet(betsArr[0]);
      setReviewOpen(true);
    } catch (error: any) {
      toast.show(error?.message || t("import.error.genericMobile"), "error");
      setSelectedImage(null);
    } finally {
      steps.forEach(clearTimeout);
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleNativePick = async (source: "camera" | "photos") => {
    try {
      const dataUrl = await pickNativePhoto(source);
      if (!dataUrl) return;
      // ~3MB de imagem ≈ 4MB de base64.
      if (dataUrl.length * 0.75 > MAX_IMAGE_BYTES) {
        toast.show(t("import.error.tooLargeMobile"), "error");
        return;
      }
      await analyze(dataUrl);
    } catch {
      /* utilizador cancelou a câmara/galeria — não é erro. */
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.show(t("import.error.notImageMobile"), "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.show(t("import.error.tooLargeCrop"), "error");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => void analyze(reader.result as string);
  };

  const calculatedTotalOdd = useMemo(() => {
    let multiplier = 1;
    let count = 0;
    editSelections.forEach((s) => {
      const parsed = parseFloat(s.odd);
      if (!isNaN(parsed) && parsed > 0) {
        multiplier *= parsed;
        count++;
      }
    });
    return count > 0 ? Number(multiplier.toFixed(2)) : 1.0;
  }, [editSelections]);

  const previewReturns = useMemo(
    () =>
      calculateBetReturnAndProfit(
        parseFloat(editStake) || 0,
        calculatedTotalOdd,
        editStatus,
        isFreebet,
        parseFloat(editCashoutReturn) || 0,
        editFreebetType,
      ),
    [editStake, calculatedTotalOdd, editStatus, isFreebet, editCashoutReturn, editFreebetType],
  );

  const changeSelection = (index: number, field: string, value: string) => {
    setEditSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const closeReview = () => {
    setReviewOpen(false);
    setDetectedBets([]);
    setSelectedImage(null);
  };

  const handleConfirmAndSave = async () => {
    const stakeNum = parseFloat(editStake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setFormError(t("import.error.stake"));
      return;
    }

    const finalSelections: Selection[] = [];
    let isValid = true;
    editSelections.forEach((s, idx) => {
      const oddNum = parseFloat(s.odd);
      if (!s.event.trim() || !s.market.trim() || !s.choice.trim() || isNaN(oddNum) || oddNum <= 1) {
        isValid = false;
      }
      finalSelections.push({
        id: `sel-import-${idx}-${Date.now()}`,
        event: s.event.trim(),
        market: s.market.trim(),
        choice: s.choice.trim(),
        odd: oddNum,
      });
    });

    if (!isValid) {
      setFormError(t("import.error.selections"));
      return;
    }
    setFormError(null);

    const { potentialReturn, finalReturn, netProfit } = calculateBetReturnAndProfit(
      stakeNum,
      calculatedTotalOdd,
      editStatus,
      isFreebet,
      parseFloat(editCashoutReturn) || 0,
      editFreebetType,
    );

    const parsedBet = detectedBets[detectedIndex];
    const confirmedBet: Bet = {
      id: "bet-" + Date.now(),
      type: editType,
      status: editStatus,
      selections: finalSelections,
      stake: stakeNum,
      odd: calculatedTotalOdd,
      isFreebet,
      freebetType: isFreebet ? editFreebetType : undefined,
      potentialReturn: Number(potentialReturn.toFixed(2)),
      finalReturn: Number(finalReturn.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      bookmaker: editBookmaker === "Outra" ? parsedBet?.bookmaker || "Betano" : editBookmaker,
      dateTime: editDateTime,
      notes: editNotes.trim() || undefined,
      origin: "SCREENSHOT",
      metadata: {
        screenshotConfidence: 0.9,
        detectedFields: ["bookmaker", "selections", "stake", "odd", "status", "isFreebet"],
        correctedFields: [],
        isCashout: editStatus === "CASHOUT",
        cashoutReturn: editStatus === "CASHOUT" ? finalReturn : null,
      },
    };

    await onAddBet(confirmedBet);
    const savedSoFar = importedCount + 1;
    setImportedCount(savedSoFar);

    const nextIndex = detectedIndex + 1;
    if (nextIndex < detectedBets.length) {
      setDetectedIndex(nextIndex);
      loadDetectedBet(detectedBets[nextIndex]);
      toast.show(t("import.savedNextShort", { n: savedSoFar, index: nextIndex + 1, total: detectedBets.length }), "success");
      return;
    }

    toast.show(savedSoFar === 1 ? t("import.savedOneMobile") : t("import.savedManyMobile", { n: savedSoFar }), "success");
    closeReview();
  };

  const native = isNativeApp();

  return (
    <div className="space-y-4">
      {/* Hero */}
      <MobileCard className="!p-5 text-center">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
          <Sparkles size={22} />
        </span>
        <h2 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
          {t("import.mobileTitle")}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
          {t("import.mobileSubtitle")}
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{loadingStep}</p>
          </div>
        ) : native ? (
          <div className="grid grid-cols-2 gap-3">
            <Pressable
              as="button"
              onClick={() => void handleNativePick("camera")}
              className="flex flex-col items-center gap-2 py-5 rounded-xl bg-emerald-600 text-white"
            >
              <CameraIcon size={22} />
              <span className="text-sm font-semibold">{t("import.takePhoto")}</span>
            </Pressable>
            <Pressable
              as="button"
              onClick={() => void handleNativePick("photos")}
              className="flex flex-col items-center gap-2 py-5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
            >
              <ImageIcon size={22} />
              <span className="text-sm font-semibold">{t("import.gallery")}</span>
            </Pressable>
          </div>
        ) : (
          <Pressable
            as="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
          >
            <ImageIcon size={18} /> {t("import.chooseImage")}
          </Pressable>
        )}

        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 font-mono">{t("import.fileTypesShort")}</p>
      </MobileCard>

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

      {/* Revisão em página-folha */}
      <SheetPage
        open={reviewOpen}
        onClose={closeReview}
        title={
          detectedBets.length > 1
            ? t("import.confirmBetN", { index: detectedIndex + 1, total: detectedBets.length })
            : t("import.confirmBet")
        }
        footer={
          <div className="space-y-2">
            {formError && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{formError}</p>}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {t("bets.field.totalOdd")} <strong className="font-mono text-zinc-800 dark:text-zinc-100">{calculatedTotalOdd.toFixed(2)}</strong>
              </span>
              <span>
                {editStatus === "POR_LIQUIDAR" ? t("bets.form.potentialReturn") : t("bets.sort.profit")}{" "}
                <strong
                  className={`font-mono ${
                    editStatus === "POR_LIQUIDAR"
                      ? "text-zinc-800 dark:text-zinc-100"
                      : previewReturns.netProfit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {editStatus === "POR_LIQUIDAR"
                    ? formatMoney(previewReturns.potentialReturn, currency)
                    : formatSignedMoney(previewReturns.netProfit, currency)}
                </strong>
              </span>
            </div>
            <Pressable
              as="button"
              onClick={() => void handleConfirmAndSave()}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
            >
              {t("import.confirmSaveShort")}
            </Pressable>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Miniatura da imagem analisada */}
          {selectedImage && (
            <img
              src={selectedImage}
              alt={t("import.screenshotAltMobile")}
              className="w-full max-h-40 object-contain rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
            />
          )}

          <SegmentedControl
            segments={[
              { value: "SIMPLES", label: t("filters.type.single") },
              { value: "MULTIPLA", label: t("filters.type.multiple") },
            ]}
            value={editType}
            onChange={setEditType}
          />

          <ChipGroup label={t("filters.status")} options={STATUS_FORM_OPTIONS.map((o) => ({ value: o.value, label: t(o.key) }))} value={editStatus} onChange={(v) => setEditStatus(v as BetStatus)} />

          {editStatus === "CASHOUT" && (
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                {t("bets.form.cashoutReceived")}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={editCashoutReturn}
                onChange={(e) => setEditCashoutReturn(e.target.value)}
                className={`mt-1 ${inputClasses}`}
              />
            </label>
          )}

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              {t("filters.bookmaker")}
            </span>
            <select value={editBookmaker} onChange={(e) => setEditBookmaker(e.target.value)} className={`mt-1 ${inputClasses}`}>
              {[...new Set([...AVAILABLE_BOOKMAKERS, "Outra"])].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          {/* Seleções */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono mb-1.5">
              {t("import.detectedSelectionsShort")}
            </p>
            <div className="space-y-3">
              {editSelections.map((s, i) => (
                <MobileCard key={i} className="!p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-400 dark:text-zinc-500">#{i + 1}</span>
                    {editSelections.length > 1 && (
                      <Pressable
                        as="button"
                        onClick={() => setEditSelections((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={t("bets.form.removeSelection")}
                        className="p-1 text-rose-500"
                      >
                        <X size={14} />
                      </Pressable>
                    )}
                  </div>
                  <input type="text" value={s.event} onChange={(e) => changeSelection(i, "event", e.target.value)} placeholder={t("import.eventPlaceholder")} className={inputClasses} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={s.market} onChange={(e) => changeSelection(i, "market", e.target.value)} placeholder={t("bets.field.market")} className={inputClasses} />
                    <input type="text" value={s.choice} onChange={(e) => changeSelection(i, "choice", e.target.value)} placeholder={t("bets.form.choicePlaceholderShort")} className={inputClasses} />
                  </div>
                  <input type="number" inputMode="decimal" step="0.01" min="1" value={s.odd} onChange={(e) => changeSelection(i, "odd", e.target.value)} placeholder={t("bets.field.odd")} className={inputClasses} />
                </MobileCard>
              ))}
              {editType === "MULTIPLA" && (
                <Pressable
                  as="button"
                  onClick={() => setEditSelections((prev) => [...prev, { event: "", market: "", choice: "", odd: "1.50" }])}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
                >
                  <PlusCircle size={14} /> {t("bets.form.addSelection")}
                </Pressable>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              {t("bets.form.stakeCurrency", { currency })}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={editStake}
              onChange={(e) => setEditStake(e.target.value)}
              className={`mt-1 ${inputClasses}`}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsFreebet(!isFreebet)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                isFreebet
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {t("filters.money.freebet")}
            </button>
          </div>

          {isFreebet && (
            <ChipGroup
              label={t("bets.form.freebetType")}
              options={[
                { value: "SNR", label: t("bets.form.snrShort") },
                { value: "SR", label: t("bets.form.srShort") },
              ]}
              value={editFreebetType}
              onChange={(v) => setEditFreebetType(v as FreebetType)}
            />
          )}

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              {t("bets.details.dateTime")}
            </span>
            <input
              type="datetime-local"
              value={editDateTime.replace(" ", "T")}
              onChange={(e) => setEditDateTime(e.target.value.replace("T", " "))}
              className={`mt-1 ${inputClasses}`}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              {t("bets.details.notes")}
            </span>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className={`mt-1 ${inputClasses} h-auto py-2.5`}
            />
          </label>
        </div>
      </SheetPage>
    </div>
  );
}
