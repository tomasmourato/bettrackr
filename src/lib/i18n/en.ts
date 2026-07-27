// src/lib/i18n/en.ts
// Dicionário inglês. Tipado como Record<TKey, Entry> contra o pt.ts: uma chave
// em falta OU uma chave a mais falham em `npm run lint` (tsc), por isso o
// inglês nunca fica silenciosamente incompleto.

import type { Entry, TKey } from "./pt";

export const EN: Record<TKey, Entry> = {
  // ----------------------------------------------------------------
  // Common
  // ----------------------------------------------------------------
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.yes": "Yes",
  "common.no": "No",
  "common.loading": "Loading…",

  // ----------------------------------------------------------------
  // Navigation / shell
  // ----------------------------------------------------------------
  "nav.overview": "Overview",
  "nav.bets": "My Bets",
  "nav.import": "AI Import",
  "nav.insights": "AI Insights",
  "footer.insights": "Tips",
  "nav.social": "Social",
  "nav.settings": "Settings",
  "nav.logout": "Log out",
  "nav.install": "Install",
  "footer.panel": "Dashboard",
  "footer.bets": "Bets",
  "footer.ai": "AI",
  "footer.social": "Social",
  "footer.settings": "Settings",
  "app.loadingBets": "Loading bets…",
  "app.brandTagline": "Bet Management",

  // ----------------------------------------------------------------
  // Account panel
  // ----------------------------------------------------------------
  "account.title": "My account",
  "account.open": "Open account panel",
  "account.close": "Close account panel",
  "account.username": "Username",
  "account.email": "Email",
  "account.userId": "User ID",
  "account.memberSince": "Member since",
  "account.copyId": "Copy ID",
  "account.copied": "Copied!",
  "account.logout": "Log out",
  "account.logoutHint":
    "Signs you out on this device. Your bets stay saved in your account.",
  "account.loadError": "Could not refresh the account details.",

  // ----------------------------------------------------------------
  // Settings — general preferences
  // ----------------------------------------------------------------
  "settings.general.title": "General preferences",
  "settings.save": "Save preferences",
  "settings.saved": "Preferences saved",
  "settings.errors.invalidStake": "Invalid default stake.",

  "settings.currency.label": "Currency",
  "settings.currency.aria": "Select currency",
  "settings.currency.eur": "Euro (€)",
  "settings.currency.usd": "Dollar ($)",
  "settings.currency.gbp": "Pound (£)",
  "settings.currency.brl": "Real (R$)",

  "settings.defaultBookmaker.label": "Default bookmaker",
  "settings.defaultStake.label": "Default stake ({currency})",

  // ----------------------------------------------------------------
  // Settings — appearance (theme + language)
  // ----------------------------------------------------------------
  "settings.appearance.title": "Appearance",
  "settings.theme.label": "Theme",
  "settings.theme.aria": "Select theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "settings.language.title": "Language",
  "settings.language.desc": "Choose the application language.",
  // Language names always stay in their own language — same values as pt.ts.
  "lang.pt": "Português",
  "lang.en": "English",

  // ----------------------------------------------------------------
  // Settings — enabled bookmakers
  // ----------------------------------------------------------------
  "settings.bookmakers.title": "Bookmakers",
  "settings.bookmakers.desc":
    "Pick the bookmakers you use. Only the selected ones show up — and get imported — on the site and in the browser extension.",
  "settings.bookmakers.none":
    "No bookmaker selected — you won't be able to import bets until you pick at least one.",
  "settings.bookmakers.loadError": "Could not load the enabled bookmakers.",
  "settings.bookmakers.saveError": "Could not save the enabled bookmakers.",

  // ----------------------------------------------------------------
  // Settings — bookmaker accounts
  // ----------------------------------------------------------------
  "settings.management.title": "Management",
  "settings.accounts.title": "Bookmaker accounts",
  "settings.accounts.desc":
    "Register your accounts at each bookmaker (you can have several at the same one). Then link bets to an account and filter the dashboard and list by account.",
  "settings.accounts.count": { one: "{n} account", other: "{n} accounts" },
  "settings.accounts.betCount": {
    one: "1 linked bet",
    other: "{n} linked bets",
  },
  "settings.accounts.new": "New account",
  "settings.accounts.add": "Add account",
  "settings.accounts.addShort": "Add",
  "settings.accounts.added": "Account added",
  "settings.accounts.updated": "Account updated",
  "settings.accounts.deleted": "Account deleted",
  "settings.accounts.empty": "You haven't registered any accounts yet.",
  "settings.accounts.emptyLong":
    "You haven't registered any accounts yet. Bets without an account keep working normally.",
  "settings.accounts.nameRequired": "Give the account a name.",
  "settings.accounts.namePlaceholder": "Account name",
  "settings.accounts.labelPlaceholder": "Label (e.g. Main account)",
  "settings.accounts.labelPlaceholderLong": "Account name (e.g. Main account)",
  "settings.accounts.usernamePlaceholder": "Bookmaker username (optional)",
  "settings.accounts.usernamePlaceholderShort": "Username (optional)",
  "settings.accounts.usernameHint":
    "The username you sign in with at the bookmaker. The extension uses it to route imported bets.",
  "settings.accounts.usernameHintLong":
    "The username you sign in with at the bookmaker. The extension uses it to route imported bets to this account.",
  "settings.accounts.usernameAria": "Bookmaker username",
  "settings.accounts.bookmakerAria": "Bookmaker",
  "settings.accounts.renameTitle": "Rename “{label}”",
  "settings.accounts.rename": "Rename account",
  "settings.accounts.renameAria": "Rename {label}",
  "settings.accounts.deleteTitle": "Delete account",
  "settings.accounts.deleteAria": "Delete {label}",
  "settings.accounts.deleteConfirm": "Delete?",
  "settings.accounts.deleteConfirmWithBets":
    "The {n} linked bets will be left without an account. Delete?",
  "settings.accounts.deleteHint":
    "Deleting an account does not delete its bets — they are just left \"without an account\", still linked to the bookmaker.",

  // ----------------------------------------------------------------
  // Settings — change log (audit)
  // ----------------------------------------------------------------
  "settings.audit.title": "Change log",
  "settings.audit.desc": "Detailed record of the operations done in this session",
  "settings.audit.count": {
    one: "{n} entry this session",
    other: "{n} entries this session",
  },
  "settings.audit.empty": "No changes in this session.",

  // ----------------------------------------------------------------
  // Settings — data (export / import)
  // ----------------------------------------------------------------
  "settings.data.title": "Data",
  "settings.data.cardTitle": "Backup, import and export",
  "settings.data.desc":
    "Keep your betting data safe. Download full backups as JSON or export your bets for external analysis in Excel/CSV spreadsheets.",

  "settings.export.title": "Export files",
  "settings.export.desc": "Export compatible structured tables or full copies.",
  "settings.export.csv.title": "Export CSV",
  "settings.export.csv.desc": "Every bet in CSV format",
  "settings.export.csvButton": "Download CSV (.csv)",
  "settings.export.backup.title": "Full backup (JSON)",
  "settings.export.backup.desc": "Bets + preferences",
  "settings.export.backupButton": "Download JSON backup",
  "settings.export.empty": "No bets to export",
  "settings.export.emptyToast": "There are no bets to export.",

  "settings.import.title": "Import file",
  "settings.import.desc": "JSON backup or CSV",
  "settings.import.cardTitle": "Restore / import",
  "settings.import.cardDesc": "Sync and restore old backups by dropping your file.",
  "settings.import.choose": "Choose file (.json, .csv)",

  // ----------------------------------------------------------------
  // Settings — danger zone
  // ----------------------------------------------------------------
  "settings.danger.title": "Danger zone",

  "settings.demo.title": "Restore demo data",
  "settings.demo.desc": "Replaces everything with the sample data",
  "settings.demo.button": "Load demo data",
  "settings.demo.confirmTitle": "Restore demo data?",
  "settings.demo.confirmDesc":
    "Your current bets will be replaced by the sample data. This cannot be undone.",
  "settings.demo.sure": "Replace current data?",
  "settings.demo.confirm": "Restore",
  "settings.demo.yes": "Yes, restore demo",
  "settings.demo.done": "Demo data restored",

  "settings.clear.title": "Delete all data",
  "settings.clear.desc": "Removes every bet from the database",
  "settings.clear.button": "Clear all data",
  "settings.clear.confirmTitle": "Delete all data?",
  "settings.clear.confirmDesc":
    "Every bet will be permanently removed from the database. Consider exporting a backup first.",
  "settings.clear.sure": "Are you absolutely sure?",
  "settings.clear.confirm": "Delete everything",
  "settings.clear.yes": "Yes, delete everything",
  "settings.clear.done": "Data deleted",

  // ----------------------------------------------------------------
  // Settings — about / updates
  // ----------------------------------------------------------------
  "settings.about.title": "About",
  "settings.about.version": "Frontend version",
  "settings.about.checking": "Checking…",
  "settings.about.checkUpdate": "Check for update",
  "settings.about.checkUpdateDesc": "Looks for a new bundle on the server",
  "settings.about.checkDone":
    "Check finished — it applies on the next launch if there is something new.",
};
