// src/components/PasswordCard.tsx
// Mudar a palavra-passe, nas Definições do desktop. A lógica toda vive no
// useChangePassword, partilhado com o ecrã mobile - aqui é só a forma.

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { useChangePassword } from "../hooks/useChangePassword";
import { useI18n } from "../lib/i18n";

const INPUT =
  "w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100";
const LABEL = "block text-zinc-500 dark:text-zinc-400 font-semibold mb-1";

interface PasswordCardProps {
  onSessionExpired: () => void;
}

export default function PasswordCard({ onSessionExpired }: PasswordCardProps) {
  const { t } = useI18n();
  const form = useChangePassword(onSessionExpired);
  // Um único interruptor para os três campos: quem quer confirmar o que
  // escreveu quer ver os três, e três olhinhos separados só davam trabalho.
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
      <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
        <KeyRound size={18} className="text-emerald-600 dark:text-emerald-400" /> {t("settings.password.title")}
      </h4>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("settings.password.desc")}</p>

      <form
        className="space-y-4 text-xs mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void form.submit();
        }}
      >
        {form.done && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 font-medium">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t("settings.password.done")}</span>
          </div>
        )}

        {form.error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center gap-2 font-medium">
            <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400" />
            <span>{form.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL} htmlFor="pw-current">
              {t("settings.password.current")}
            </label>
            <input
              id="pw-current"
              type={type}
              autoComplete="current-password"
              className={INPUT}
              value={form.current}
              onChange={(e) => form.setCurrent(e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="pw-new">
              {t("settings.password.new")}
            </label>
            <input
              id="pw-new"
              type={type}
              autoComplete="new-password"
              className={INPUT}
              value={form.next}
              onChange={(e) => form.setNext(e.target.value)}
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{t("settings.password.hint")}</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="pw-confirm">
              {t("settings.password.confirm")}
            </label>
            <input
              id="pw-confirm"
              type={type}
              autoComplete="new-password"
              className={INPUT}
              value={form.confirm}
              onChange={(e) => form.setConfirm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-semibold transition-colors cursor-pointer"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            {visible ? t("settings.password.hide") : t("settings.password.show")}
          </button>

          <button
            type="submit"
            disabled={!form.canSubmit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.saving && <Loader2 size={14} className="animate-spin" />}
            {form.saving ? t("settings.password.saving") : t("settings.password.submit")}
          </button>
        </div>

        {/* Dito de propósito: os tokens são JWT sem estado, por isso mudar a
            password aqui não fecha as sessões abertas noutros dispositivos. */}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("settings.password.otherDevices")}</p>
      </form>
    </div>
  );
}
