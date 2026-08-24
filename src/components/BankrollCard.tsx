// src/components/BankrollCard.tsx
// Gestão dos movimentos da banca em Configurações. Só se registam entradas e
// saídas de dinheiro real - o efeito das apostas no saldo vem sozinho, do
// histórico que a app já tem (ver src/lib/bankroll.ts).

import React, { useState } from "react";
import { AlertCircle, Check, PiggyBank, Pencil, Plus, Trash2, X } from "lucide-react";
import { BankrollMovement, BankrollMovementKind, BankrollSummary } from "../types";
import { BankrollMovementInput } from "../lib/bankrollApi";
import { useI18n } from "../lib/i18n";

interface BankrollCardProps {
  movements: BankrollMovement[];
  summary: BankrollSummary;
  currency: string;
  error: string | null;
  clearError: () => void;
  onAdd: (input: BankrollMovementInput) => Promise<BankrollMovement | null>;
  onEdit: (id: string, input: BankrollMovementInput) => Promise<BankrollMovement | null>;
  onDelete: (id: string) => Promise<boolean>;
}

const KINDS: BankrollMovementKind[] = ["DEPOSITO", "LEVANTAMENTO", "AJUSTE"];

const inputClasses =
  "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BankrollCard({
  movements,
  summary,
  currency,
  error,
  clearError,
  onAdd,
  onEdit,
  onDelete,
}: BankrollCardProps) {
  const { t, formatMoney, formatSignedMoney } = useI18n();

  const [newKind, setNewKind] = useState<BankrollMovementKind>("DEPOSITO");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayKey());
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const kindLabel = (kind: BankrollMovementKind) =>
    kind === "DEPOSITO"
      ? t("settings.bankroll.kindDeposit")
      : kind === "LEVANTAMENTO"
        ? t("settings.bankroll.kindWithdrawal")
        : t("settings.bankroll.kindAdjustment");

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseFloat(newAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount === 0) return;
    setSaving(true);
    const created = await onAdd({
      kind: newKind,
      amount,
      occurredAt: newDate || null,
      note: newNote.trim() || null,
    });
    setSaving(false);
    if (created) {
      setNewAmount("");
      setNewNote("");
    }
  };

  const startEdit = (movement: BankrollMovement) => {
    clearError();
    setConfirmDeleteId(null);
    setEditingId(movement.id);
    setEditingAmount(String(Math.abs(movement.amount)));
    setEditingNote(movement.note ?? "");
  };

  const submitEdit = async (movement: BankrollMovement) => {
    const amount = parseFloat(editingAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount === 0) return;
    const updated = await onEdit(movement.id, {
      kind: movement.kind,
      // No ajuste o sinal original manda; nos outros o kind decide.
      amount: movement.kind === "AJUSTE" && movement.amount < 0 ? -Math.abs(amount) : amount,
      occurredAt: movement.occurredAt,
      note: editingNote.trim() || null,
    });
    if (updated) setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await onDelete(id);
    if (ok) setConfirmDeleteId(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div>
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
          <PiggyBank size={18} className="text-emerald-600 dark:text-emerald-400" />{" "}
          {t("settings.bankroll.title")}
        </h4>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {t("settings.bankroll.desc")}
        </p>
      </div>

      {/* Resumo, para se ver o efeito de cada movimento sem sair daqui */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: t("settings.bankroll.balance"), value: formatMoney(summary.balance, currency) },
          { label: t("settings.bankroll.deposited"), value: formatMoney(summary.deposited, currency) },
          { label: t("settings.bankroll.withdrawn"), value: formatMoney(summary.withdrawn, currency) },
          { label: t("settings.bankroll.available"), value: formatMoney(summary.available, currency) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 px-2.5 py-2"
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {item.label}
            </p>
            <p className="text-sm font-mono font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-sm flex items-center gap-2 text-xs font-medium">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* Registar movimento */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as BankrollMovementKind)}
          aria-label={t("settings.bankroll.kindAria")}
          className={inputClasses}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabel(kind)}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder={t("settings.bankroll.amountPlaceholder")}
          aria-label={t("settings.bankroll.amountAria")}
          className={`w-full sm:w-28 ${inputClasses}`}
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          aria-label={t("settings.bankroll.dateAria")}
          className={inputClasses}
        />
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t("settings.bankroll.notePlaceholder")}
          maxLength={200}
          className={`flex-1 ${inputClasses}`}
        />
        <button
          type="submit"
          disabled={!newAmount.trim() || saving}
          className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={13} /> {t("settings.bankroll.addShort")}
        </button>
      </form>

      {movements.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
          {t("settings.bankroll.empty")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {movements.map((movement) => (
            <li
              key={movement.id}
              className="flex items-center gap-2 p-2.5 rounded-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
            >
              {editingId === movement.id ? (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount}
                    onChange={(e) => setEditingAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitEdit(movement);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    aria-label={t("settings.bankroll.amountAria")}
                    className="w-24 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="text"
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitEdit(movement);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    maxLength={200}
                    placeholder={t("settings.bankroll.notePlaceholder")}
                    aria-label={t("settings.bankroll.noteAria")}
                    className="flex-1 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={() => submitEdit(movement)}
                    title={t("common.save")}
                    className="p-1.5 rounded-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    title={t("common.cancel")}
                    className="p-1.5 rounded-sm text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                      {kindLabel(movement.kind)}
                      {movement.note && (
                        <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">
                          {movement.note}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {movement.occurredAt.split(" ")[0]}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold shrink-0 ${
                      movement.amount >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatSignedMoney(movement.amount, currency)}
                  </span>
                  {confirmDeleteId === movement.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">
                        {t("settings.bankroll.deleteConfirm")}
                      </span>
                      <button
                        onClick={() => handleDelete(movement.id)}
                        className="px-2 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {t("common.yes")}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {t("common.no")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(movement)}
                        title={t("common.edit")}
                        className="p-1.5 rounded-sm text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          clearError();
                          setEditingId(null);
                          setConfirmDeleteId(movement.id);
                        }}
                        title={t("common.delete")}
                        className="p-1.5 rounded-sm text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
        {t("settings.bankroll.hint")}
      </p>
    </div>
  );
}
