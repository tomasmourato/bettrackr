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
  "common.clear": "Clear",
  "common.clearAll": "Clear all",
  "common.confirm": "Confirm",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.filters": "Filters",
  "common.from": "From",
  "common.to": "To",

  // ----------------------------------------------------------------
  // Bet statuses (shared by the dashboard and the history)
  // ----------------------------------------------------------------
  "status.won": "Won",
  "status.halfWon": "Half won",
  "status.cashout": "Cashout",
  "status.void": "Void",
  "status.halfLost": "Half lost",
  "status.lost": "Lost",
  "status.pending": "Pending",
  "status.unsettled": "Unsettled",
  "status.unsettledLong": "Unsettled (pending)",
  "status.resolved": "Resolved",

  // ----------------------------------------------------------------
  // Betting vocabulary (fallbacks and loose labels)
  // ----------------------------------------------------------------
  "bet.multiple": "Multiple",
  "bet.various": "Various",
  "bet.otherBookmaker": "Other",
  "bet.noDate": "No date",
  "bet.noData": "No data",
  "bet.start": "Start",

  // ----------------------------------------------------------------
  // Filters (dashboard + history)
  // ----------------------------------------------------------------
  "filters.bookmaker": "Bookmaker",
  "filters.account": "Account",
  "filters.sport": "Sport",
  "filters.type": "Type",
  "filters.money": "Money",
  "filters.period": "Period",
  "filters.allFem": "All",
  "filters.allMasc": "All",
  "filters.allBookmakers": "All bookmakers",
  "filters.allAccounts": "All accounts",
  "filters.allSports": "All sports",
  "filters.noAccount": "No account",
  "filters.anyType": "Any type",
  "filters.allStatuses": "All statuses",
  "filters.status": "Status",
  "filters.statusAria": "Filter by status",
  "filters.type.single": "Single",
  "filters.type.multiple": "Multiple",
  "filters.money.all": "Cash and freebet",
  "filters.money.real": "Real money",
  "filters.money.freebet": "Freebet",
  "filters.money.riskFree": "Risk-free",
  "filters.bookmakerAria": "Filter by bookmaker",
  "filters.accountAria": "Filter by account",
  "filters.sportAria": "Filter by sport",
  "filters.typeAria": "Filter by bet type",
  "filters.moneyAria": "Filter by money type",

  // ----------------------------------------------------------------
  // Timeframes (mobile dashboard chips)
  // ----------------------------------------------------------------
  "timeframe.all": "All time",
  "timeframe.7days": "7 days",
  "timeframe.30days": "30 days",
  "timeframe.90days": "90 days",
  "timeframe.thisMonth": "This month",
  "timeframe.thisYear": "This year",
  "timeframe.custom": "Custom",

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
  // Bet history (desktop BetsManager + MobileBets)
  // ----------------------------------------------------------------
  "bets.searchPlaceholder": "Search team, market or notes...",
  "bets.countOf": "{shown} of {total} bets",
  "bets.new": "Add bet",
  "bets.empty": "No bets found with the selected filters.",
  "bets.addNew": "Add new bet",

  // Multi-select and bulk actions
  "bets.selectMultiple": "Select several",
  "bets.cancelSelection": "Cancel selection",
  "bets.deselectFiltered": "Deselect filtered",
  "bets.selectFiltered": "Select filtered ({n})",
  "bets.selectedSuffix": { one: "bet selected", other: "bets selected" },
  "bets.deleteConfirm": { one: "Delete {n} bet?", other: "Delete {n} bets?" },
  "bets.cancelDeleteAria": "Cancel deletion",
  "bets.restore": "Restore",
  "bets.ignore": "Ignore",
  "bets.duplicate": "Duplicate",

  "bets.bulkEdit.title": {
    one: "Edit {n} bet — shared fields only",
    other: "Edit {n} bets — shared fields only",
  },
  "bets.bulkEdit.close": "Close bulk edit",
  "bets.bulkEdit.hint":
    "Only the fields you change are applied. Each bet's stake, odds and selections stay untouched.",
  "bets.bulkEdit.sport": "Sport (empty = keep)",
  "bets.bulkEdit.keep": "Keep",
  "bets.bulkEdit.keepStatus": "Keep status",
  "bets.bulkEdit.keepBookmaker": "Keep bookmaker",
  "bets.bulkEdit.keepAccount": "Keep account",
  "bets.bulkEdit.keepMoney": "Keep type",
  "bets.bulkEdit.note": "Append note (optional)",
  "bets.bulkEdit.notePlaceholder": "Gets appended to the notes of every selected bet",
  "bets.bulkEdit.apply": "Apply to {n}",
  "bets.bulkIgnore.title": {
    one: "Ignore {n} bet — excluded from stats",
    other: "Ignore {n} bets — excluded from stats",
  },
  "bets.bulkIgnore.close": "Close bulk ignore",
  "bets.bulkIgnore.reason": "Reason (optional, applied to all)",
  "bets.bulkIgnore.reasonPlaceholder": "E.g. test bets, logging mistake…",
  "bets.bulkIgnore.confirm": "Ignore {n}",

  // Sorting
  "bets.sort.date": "Date",
  "bets.sort.stake": "Stake",
  "bets.sort.odd": "Odds",
  "bets.sort.profit": "Profit",
  "bets.sort.potential": "Potential",
  "bets.sort.aria": "Sort by {label}",
  "bets.sort.ariaActive": "Sort by {label}, {direction} direction",
  "bets.sort.asc": "ascending",
  "bets.sort.desc": "descending",

  // Bet card
  "bets.cardAriaSelect": "Select bet from {date}",
  "bets.cardAriaView": "View details of the bet from {date}",
  "bets.selectBet": "Select bet",
  "bets.ignored": "Ignored",
  "bets.ignoredTitle": "Excluded from statistics",
  "bets.deleteQ": "Delete?",
  "bets.confirmDelete": "Confirm delete",
  "bets.ignoreReasonPlaceholder": "Reason (optional)",
  "bets.ignoreReasonAria": "Reason for ignoring the bet",
  "bets.ignoreTitle": "Ignore bet (exclude from statistics)",
  "bets.duplicateTitle": "Duplicate bet",
  "bets.editTitle": "Edit bet",
  "bets.restoreTitle": "Restore bet into the statistics",
  "bets.deleteTitle": "Delete bet",

  // Notes generated when duplicating
  "bets.duplicatedNote": "Duplicated bet.",
  "bets.duplicatedPrefix": "[Duplicated] {notes}",

  // Bet details
  "bets.details.title": "Bet details",
  "bets.details.close": "Close bet details",
  "bets.details.bookmaker": "Bookmaker",
  "bets.details.dateTime": "Date and time",
  "bets.details.origin": "Origin",
  "bets.details.money": "Money",
  "bets.details.stats": "Statistics",
  "bets.details.ignoredValue": "Ignored (excluded)",
  "bets.details.financial": "Financial summary",
  "bets.details.selections": "Betslip selections",
  "bets.details.selectionN": "Selection {n}",
  "bets.details.noEvent": "Event unavailable",
  "bets.details.noSelections": "This bet has no saved selections.",
  "bets.details.notes": "Notes",
  "bets.details.comment": "Comment",
  "bets.details.tags": "Tags",

  // Shared fields (details + form)
  "bets.field.stake": "Stake",
  "bets.field.totalOdd": "Total odds",
  "bets.field.potential": "Potential",
  "bets.field.return": "Return",
  "bets.field.netProfit": "Net profit",
  "bets.field.market": "Market",
  "bets.field.choice": "Choice",
  "bets.field.odd": "Odds",
  "bets.field.moneyType": "Money type",

  // Add/edit form
  "bets.form.editTitle": "Edit bet record",
  "bets.form.newTitle": "Add new bet",
  "bets.form.type": "Bet type",
  "bets.form.settleStatus": "Settlement status",
  "bets.form.cashoutValue": "Cashout amount ({currency})",
  "bets.form.cashoutHint":
    "Amount actually received when cashing out (regardless of the result).",
  "bets.form.otherBookmaker": "Other (type it in...)",
  "bets.form.which": "Which one?",
  "bets.form.whichPlaceholder": "E.g. Betfair, Betclic.fr",
  "bets.form.dateTime": "Date / time",
  "bets.form.moneyKind": "Bet type",
  "bets.form.normal": "Normal",
  "bets.form.normalHint": "Real stake",
  "bets.form.freebetHint": "Free bet",
  "bets.form.riskFreeHint": "Real stake, loss refunded",
  "bets.form.freebetType": "Freebet type",
  "bets.form.snr": "Stake not returned — SNR (win = (odds−1)×stake)",
  "bets.form.sr": "Stake returned — SR (win = odds×stake)",
  "bets.form.freebetDefault":
    "Preset by the bookmaker ({bookmaker}). SNR is the default; Betclic uses SR.",
  "bets.form.riskFreeInfo":
    "Risk-free bet: the stake is real money and counts towards profit like a normal bet. If it wins, the profit is normal; if it loses, you lose the stake. Record the refunded freebet as a separate bet when you use it.",
  "bets.form.stake": "Bet amount (stake)",
  "bets.form.notes": "Additional notes (optional)",
  "bets.form.notesPlaceholder": "E.g. followed tipster X, key match",
  "bets.form.selections": "Betslip selections ({n})",
  "bets.form.addSelection": "Add selection",
  "bets.form.event": "Event / match",
  "bets.form.eventPlaceholder": "E.g. Benfica vs Porto",
  "bets.form.marketPlaceholder": "E.g. Full time result, total goals",
  "bets.form.choiceLabel": "Choice / prediction",
  "bets.form.choicePlaceholder": "E.g. Benfica, over 2.5",
  "bets.form.oddIndividual": "Individual odds",
  "bets.form.preview": "Betslip simulation",
  "bets.form.totalOdd": "Total odds: ",
  "bets.form.potentialReturn": "Potential return",
  "bets.form.settledReturn": "Settled return",
  "bets.form.settledReturnAria": "Settled return",
  "bets.form.save": "Save changes",
  "bets.form.submit": "Add bet",
  "bets.error.stake": "Please enter a valid stake.",
  "bets.error.bookmaker": "Please set the bookmaker.",
  "bets.error.selections":
    "Please fill in every selection field with valid values (odds must be greater than 1.0).",

  // ---- Mobile screen specific ----
  "bets.searchShort": "Search…",
  "bets.selectAria": "Select bets",
  "bets.day.today": "Today",
  "bets.day.yesterday": "Yesterday",
  "bets.selectedShort": "sel.",
  "bets.emptyNoBets": "You haven't recorded any bets yet.",
  "bets.emptyFiltered": "No bet matches the filters.",
  "bets.detailFallbackTitle": "Bet",
  "bets.potentialShort": "Pot. return",
  "bets.detailAccount": "Account {label}",
  "bets.detailIgnoredLine": "Ignored — excluded from statistics",
  "bets.bulk.editAria": "Edit selected",
  "bets.bulk.restoreAria": "Restore selected",
  "bets.bulk.ignoreAria": "Ignore selected",
  "bets.bulk.duplicateAria": "Duplicate selected",
  "bets.bulk.deleteAria": "Delete selected",

  "bets.ignoreSheet.title": "Ignore bet?",
  "bets.ignoreSheet.desc":
    "The bet on {event} stops counting towards the statistics and charts. It stays in the list and you can restore it whenever you want.",
  "bets.ignoreSheet.reasonPlaceholder": "E.g. test bet, logging mistake…",
  "bets.deleteSheet.title": "Delete bet?",
  "bets.deleteSheet.desc": "The bet on {event} will be permanently deleted.",
  "bets.bulkDelete.title": "Delete {n} bets?",
  "bets.bulkDelete.desc": "The {n} selected bets will be permanently deleted.",
  "bets.bulkDelete.confirm": "Delete {n}",
  "bets.bulkIgnore.sheetTitle": "Ignore {n} bets?",
  "bets.bulkIgnore.desc":
    "The selected bets stop counting towards the statistics and charts. They stay in the list and you can restore them whenever you want.",
  "bets.bulkEdit.sheetTitle": "Edit {n} bets",
  "bets.bulkEdit.applyN": { one: "Apply to {n} bet", other: "Apply to {n} bets" },
  "bets.bulkEdit.pickField": "Pick at least one field to change",
  "bets.filtersSheet.title": "Filters and sorting",
  "bets.sortBy": "Sort by",
  "bets.direction": "Direction",
  "bets.directionDesc": "Descending",
  "bets.directionAsc": "Ascending",

  "bets.form.cashoutReceived": "Amount received on cashout",
  "bets.form.settledOptional": "Settled return (optional)",
  "bets.form.automatic": "Automatic",
  "bets.form.bookmakerName": "Bookmaker name",
  "bets.form.bookmakerNamePlaceholder": "E.g. Bwin",
  "bets.form.accountOptional": "Account (optional)",
  "bets.form.selectionsShort": "Selections",
  "bets.form.removeSelection": "Remove selection",
  "bets.form.eventPlaceholderShort": "Event (e.g. Benfica vs Porto)",
  "bets.form.choicePlaceholderShort": "Choice",
  "bets.form.stakeCurrency": "Stake ({currency})",
  "bets.form.snrShort": "SNR (stake not returned)",
  "bets.form.srShort": "SR (stake returned)",
  "bets.form.notesOptional": "Notes (optional)",
  "bets.form.notesPlaceholderShort": "Notes about the bet…",

  "bets.toast.updated": "Bet updated",
  "bets.toast.added": "Bet recorded",
  "bets.toast.duplicated": "Bet duplicated",
  "bets.toast.ignored": "Bet ignored — excluded from statistics",
  "bets.toast.restored": "Bet restored into the statistics",
  "bets.toast.deleted": "Bet deleted",
  "bets.toast.bulkUpdated": { one: "{n} bet updated", other: "{n} bets updated" },
  "bets.toast.bulkIgnored": { one: "{n} bet ignored", other: "{n} bets ignored" },
  "bets.toast.bulkRestored": { one: "{n} bet restored", other: "{n} bets restored" },
  "bets.toast.bulkDuplicated": { one: "{n} bet duplicated", other: "{n} bets duplicated" },
  "bets.toast.bulkDeleted": { one: "{n} bet deleted", other: "{n} bets deleted" },

  // ----------------------------------------------------------------
  // Dashboard (desktop Dashboard + MobileDashboard)
  // ----------------------------------------------------------------
  "dashboard.betsOf": "{shown} of {total} bets",
  "dashboard.empty": "No bets match the selected filters.",
  "dashboard.noRecords": "No records.",
  "dashboard.viewBets": { one: "View {n} bet", other: "View {n} bets" },

  // KPI cards
  "dashboard.netProfit": "Net profit",
  "dashboard.return": "Return",
  "dashboard.roi": "ROI / Yield",
  "dashboard.volume": "Volume",
  "dashboard.totalVolume": "Total volume",
  "dashboard.efficiency": "Efficiency",
  "dashboard.winRate": "Win rate",
  "dashboard.totalBets": "Total bets",
  "dashboard.registered": "recorded",
  "dashboard.active": "Active",
  "dashboard.statWon": "{n} won",
  "dashboard.statResolved": "{n} resolved",
  "dashboard.statPending": "{n} pending",

  // Evolution chart
  "dashboard.evolution.title": "Net profit evolution",
  "dashboard.evolution.desc": "Cumulative evolution across resolved bets",
  "dashboard.cumulativeProfit": "Cumulative profit",
  "dashboard.profit": "Profit",
  "dashboard.evolution.tooltip": "Bet #{index} ({date}) - {event}",

  // Result distribution
  "dashboard.statusDistribution.title": "Result distribution",
  "dashboard.statusDistribution.desc": "Percentage by bet status",
  "dashboard.resolved": "Resolved",
  "dashboard.resolvedDrill": "View resolved bets in the history",
  "dashboard.viewBetsFor": "View bets: {name}",
  "dashboard.betsTooltip": "{n} bets",
  "dashboard.noResults": "No results recorded yet.",

  // Monthly performance
  "dashboard.monthly.title": "Monthly performance",
  "dashboard.monthly.desc": "Net profit within the selected period",
  "dashboard.monthly.tooltip": "{month}: {bets} bets | Volume: {volume}",
  "dashboard.monthlyProfit": "Profit by month",

  // Performance by bookmaker
  "dashboard.bookmakers.title": "Performance by bookmaker",
  "dashboard.bookmakers.titleShort": "Performance by bookmaker",
  "dashboard.bookmakers.desc": "Profitability and volume analysis by operator",
  "dashboard.bookmakers.subtitle": "{n} bets · Volume {volume}",
  "dashboard.table.operator": "Operator",
  "dashboard.table.bets": "Bets",

  // Freebet analysis
  "dashboard.freebets.title": "Freebet analysis",
  "dashboard.freebets.desc": "Performance statistics for freebet bets",
  "dashboard.freebets.count": "Freebets recorded",
  "dashboard.freebets.invested": "Total staked (freebet)",
  "dashboard.freebets.profit": "Net profit generated",
  "dashboard.freebets.winRate": "Win rate (freebets)",
  "dashboard.freebets.resolvedRatio": "Resolved / total",
  "dashboard.freebets.ofTotal": "{resolved} of {total}",

  // Insights
  "dashboard.insights.title": "Insights",
  "dashboard.insights.bestBookmaker": "Most profitable operator",
  "dashboard.insights.bestBookmakerHint": "Where you make the most money",
  "dashboard.insights.notEnoughData": "Not enough data",
  "dashboard.insights.avgOdd": "Average odds of winning bets",
  "dashboard.insights.avgOddShort": "Average winning odds",
  "dashboard.insights.avgOddHint": "Average level of winning risk",
  "dashboard.insights.biggestWin": "Biggest single profit",
  "dashboard.insights.biggestWinHint": "Your most successful betslip",
  "dashboard.insights.noWin": "No winnings yet.",

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
