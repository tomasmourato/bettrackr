// src/lib/auditDisplay.ts
// Etiquetas do registo de alterações da sessão. Está à parte dos componentes
// pela mesma razão do adminDisplay: a versão desktop e a mobile dizem o mesmo,
// e as chaves ficam verificadas pelo tipo TKey num sítio só.
//
// O registo guarda a CHAVE e as variáveis, não a frase feita (ver
// src/hooks/useAuditLog.ts). Uma lista que vive em memória durante toda a
// sessão tem de mudar de língua quando a app muda - e isso só acontece se a
// tradução for feita aqui, na renderização, e não no momento em que se grava.

import type { AuditLog } from "../types";
import type { TFn, TKey } from "./i18n";

// Os códigos que o src/App.tsx grava. São identificadores, não texto: o que
// se mostra é a tradução.
const ACTION_KEYS: Record<string, TKey> = {
  SISTEMA: "audit.action.system",
  ADICIONAR_APOSTA: "audit.action.betAdd",
  ATUALIZAR_APOSTA: "audit.action.betUpdate",
  IGNORAR_APOSTA: "audit.action.betIgnore",
  REPOR_APOSTA: "audit.action.betRestore",
  ODD_DE_FECHO: "audit.action.closingOdd",
  REMOVER_APOSTA: "audit.action.betDelete",
  DUPLICAR_APOSTAS: "audit.action.betDuplicate",
  PREFERENCIAS: "audit.action.preferences",
  LIMPAR_DADOS: "audit.action.clearData",
  REPOR_DADOS: "audit.action.resetData",
  IMPORTACAO: "audit.action.import",
};

/** A etiqueta da operação. Um código sem tradução aparece cru, e não em branco. */
export function auditAction(log: AuditLog, t: TFn): string {
  const key = ACTION_KEYS[log.action];
  return key ? t(key) : t("audit.action.unknown", { action: log.action });
}

/** A frase da linha, na língua atual. */
export function auditDetails(log: AuditLog, t: TFn): string {
  return t(log.details.key, log.details.vars);
}
