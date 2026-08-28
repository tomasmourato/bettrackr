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
  "common.loading": "Loading...",
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
  "status.unknown": "Unknown",
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
  "timeframe.last7": "Last 7 days",
  "timeframe.last30": "Last 30 days",
  "timeframe.last90": "Last 90 days",
  "timeframe.customRange": "Custom period",
  "timeframe.aria": "Filter by period",
  "timeframe.pickerAria": "Choose a custom period",
  "timeframe.rangeHint": "The start and end dates are both included.",
  "timeframe.startDate": "Start date",
  "timeframe.endDate": "End date",
  "timeframe.datePlaceholder": "dd/mm/yyyy",
  "timeframe.prevMonth": "Previous month",
  "timeframe.nextMonth": "Next month",

  // ----------------------------------------------------------------
  // Authentication (login/signup screen)
  // ----------------------------------------------------------------
  "auth.login": "Log in",
  "auth.signup": "Sign up",
  "auth.usernamePlaceholder": "your_username",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordHint": "Minimum 8 characters.",
  "auth.loading": "Please wait...",
  "auth.noAccount": "Don't have an account yet?",
  "auth.register": "Sign up",
  "auth.hasAccount": "Already have an account?",
  "auth.signin": "Log in",
  "auth.genericError": "Something went wrong. Please try again.",

  // ----------------------------------------------------------------
  // Error screen (ErrorBoundary)
  // ----------------------------------------------------------------
  "error.title": "Something went wrong",
  "error.desc":
    "The page failed to load. Try reloading; if it persists, the detail below helps us fix it.",
  "error.reload": "Reload",

  // ----------------------------------------------------------------
  // Social (desktop Social + MobileSocial)
  // ----------------------------------------------------------------
  "social.title": "Social",
  "social.subtitle": "Add friends so you can see each other's statistics and bets.",
  "social.addFriend": "Add friend",
  "social.searchPlaceholder": "Search by username...",
  "social.searchPlaceholderMobile": "Search users...",
  "social.searching": "Searching...",
  "social.noUsers": "No user found.",
  "social.results": "Results",
  "social.friends": "Friends",
  "social.friendsCount": "Friends ({n})",
  "social.pending": "Pending",
  "social.askedYou": "Asked you",
  "social.respondBelow": "Respond to the request ↓",
  "social.add": "Add",
  "social.incoming": "Incoming requests",
  "social.outgoing": "Sent requests",
  "social.sent": "Sent",
  "social.noPending": "No pending requests.",
  "social.noFriends": "You have no friends yet. Search by username above.",
  "social.noFriendsMobile": "You haven't added any friends yet.",
  "social.noFriendsHint": "Search for users above to send requests.",
  "social.viewStats": "View statistics and bets →",
  "social.removeFriend": "Remove friend",
  "social.removeFriendQ": "Remove friend?",
  "social.removeFriendDesc":
    "You will stop seeing {username}'s statistics and they will stop seeing yours.",
  "social.remove": "Remove",
  "social.back": "Back",
  "social.friendProfile": "Friend profile",
  "social.loadingStats": "Loading {username}'s statistics...",
  "social.friendBets": "{username}'s bets",
  "social.recentBets": "The 50 most recent bets ({total} in total)",
  "social.recentBetsMobile": "Recent bets ({total} in total)",
  "social.noFriendBets": "This friend hasn't recorded any bets yet.",
  "social.waitingReply": "Waiting for a reply",
  "social.friendsSince": "Friends since {date}",
  "social.accept": "Accept",
  "social.decline": "Decline",
  "social.acceptAria": "Accept {username}",
  "social.declineAria": "Decline {username}",
  "social.addAria": "Add {username}",
  "social.cancelRequestAria": "Cancel request to {username}",
  "social.nowFriends": "You are now friends with {username}.",
  "social.requestSent": "Request sent to {username}.",
  "social.accepted": "You accepted {username}'s request.",
  "social.removed": "{username} removed from friends.",
  "social.table.event": "Event",
  "social.error.load": "Could not load the social data.",
  "social.error.send": "Could not send the request.",
  "social.error.accept": "Could not accept the request.",
  "social.error.removeRequest": "Could not remove the request.",
  "social.error.removeFriend": "Could not remove the friendship.",
  "social.error.friendBets": "Could not load the friend's bets.",

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
  "app.loadingBets": "Loading bets...",
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
    one: "Edit {n} bet, shared fields only",
    other: "Edit {n} bets, shared fields only",
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
    one: "Ignore {n} bet, excluded from stats",
    other: "Ignore {n} bets, excluded from stats",
  },
  "bets.bulkIgnore.close": "Close bulk ignore",
  "bets.bulkIgnore.reason": "Reason (optional, applied to all)",
  "bets.bulkIgnore.reasonPlaceholder": "E.g. test bets, logging mistake...",
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
  "bets.form.snr": "Stake not returned, SNR (win = (odds−1)×stake)",
  "bets.form.sr": "Stake returned, SR (win = odds×stake)",
  "bets.form.freebetDefault":
    "Preset by the bookmaker ({bookmaker}). SNR is the industry default; Betclic and Betano use SR.",
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
  "bets.searchShort": "Search...",
  "bets.selectAria": "Select bets",
  "bets.day.today": "Today",
  "bets.day.yesterday": "Yesterday",
  "bets.selectedShort": "sel.",
  "bets.emptyNoBets": "You haven't recorded any bets yet.",
  "bets.emptyFiltered": "No bet matches the filters.",
  "bets.detailFallbackTitle": "Bet",
  "bets.potentialShort": "Pot. return",
  "bets.detailAccount": "Account {label}",
  "bets.detailIgnoredLine": "Ignored, excluded from statistics",
  "bets.bulk.editAria": "Edit selected",
  "bets.bulk.restoreAria": "Restore selected",
  "bets.bulk.ignoreAria": "Ignore selected",
  "bets.bulk.duplicateAria": "Duplicate selected",
  "bets.bulk.deleteAria": "Delete selected",

  "bets.ignoreSheet.title": "Ignore bet?",
  "bets.ignoreSheet.desc":
    "The bet on {event} stops counting towards the statistics and charts. It stays in the list and you can restore it whenever you want.",
  "bets.ignoreSheet.reasonPlaceholder": "E.g. test bet, logging mistake...",
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
  "bets.form.notesPlaceholderShort": "Notes about the bet...",

  "bets.toast.updated": "Bet updated",
  "bets.toast.added": "Bet recorded",
  "bets.toast.duplicated": "Bet duplicated",
  "bets.toast.ignored": "Bet ignored, excluded from statistics",
  "bets.toast.restored": "Bet restored into the statistics",
  "bets.toast.deleted": "Bet deleted",
  "bets.toast.bulkUpdated": { one: "{n} bet updated", other: "{n} bets updated" },
  "bets.toast.bulkIgnored": { one: "{n} bet ignored", other: "{n} bets ignored" },
  "bets.toast.bulkRestored": { one: "{n} bet restored", other: "{n} bets restored" },
  "bets.toast.bulkDuplicated": { one: "{n} bet duplicated", other: "{n} bets duplicated" },
  "bets.toast.bulkDeleted": { one: "{n} bet deleted", other: "{n} bets deleted" },

  // ----------------------------------------------------------------
  // Filtered bets financial summary (FilteredBetsSummary)
  // ----------------------------------------------------------------
  "summary.aria": "Financial summary of the filtered bets",
  "summary.totalStaked": "Total staked",
  "summary.totalReturned": "Total returned",
  "summary.netResult": "Net result",
  "summary.betsCounted": "Bets counted",
  "summary.freebetAria": "Explain the freebet amount",
  "summary.freebetTooltip": "Amount used in freebets",

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
  // Image importer (ScreenshotImporter + MobileImport)
  // ----------------------------------------------------------------
  "import.title": "Smart bet importer",
  "import.subtitle":
    "Take a screenshot of your betslip on Betano, Betclic or Placard, paste it with Ctrl+V or upload it and Gemini AI extracts the selections, odds, stake, bookmaker, status and freebet for you.",
  "import.poweredBy": "Powered by",
  "import.dropTitle": "Drag the screenshot here",
  "import.dropHint": "Or click to browse your files",
  "import.pasteHint": "You can paste directly with",
  "import.fileTypes": "PNG, JPG or WEBP up to 3MB",
  "import.fileTypesShort": "Max. 3MB · PNG, JPG, WEBP",
  "import.analyzing": "Gemini is analysing your betslip...",
  "import.analyzingHint": "Almost there. Computer-vision processing takes about 5-10 seconds.",
  "import.step.upload": "Loading the image and optimising it for upload...",
  "import.step.connect": "Connecting to the Gemini AI services...",
  "import.step.extract": "Analysing the layout and extracting the betslip selections...",
  "import.error.notImage": "Please select image files only (PNG, JPG, WEBP).",
  "import.error.tooLarge":
    "The image exceeds 3MB. Crop the screenshot or lower the resolution and try again.",
  "import.error.tooLargeMobile": "The image exceeds 3MB. Take the photo closer to the betslip.",
  "import.error.noData": "Could not extract the data from the image.",
  "import.error.noBets": "No betslip was detected in the image.",
  "import.error.generic": "Something went wrong talking to the Gemini AI.",
  "import.error.stake": "Please enter a valid stake.",
  "import.error.selections":
    "Please confirm every selection. The values must be valid and the odds greater than 1.0.",
  "import.aiNote": "Imported automatically via Artificial Intelligence.",
  "import.aiChip": "AI",
  "import.aiChipTitle": "Filled in automatically by the AI, check before saving",
  "import.screenshotTitle": "Screenshot provided",
  "import.remove": "Remove",
  "import.screenshotAlt": "Betslip screenshot",
  "import.screenshotAltMobile": "Analysed screenshot",
  "import.confirmRequired": "Confirmation required",
  "import.confirmRequiredDesc":
    "The AI detected your betslip data, including the bookmaker, the bet status and whether a freebet was used. Check and correct anything inaccurate in the boxes beside this before confirming the final save.",
  "import.validate": "Validate extracted data",
  "import.slipOf": "Betslip {index} of {total}",
  "import.skip": "Skip",
  "import.success": "Success",
  "import.otherBookmaker": "Other ({name})",
  "import.status.wonLong": "Won (settle in full)",
  "import.status.lostLong": "Lost (settle the loss)",
  "import.status.voidLong": "Void (refund)",
  "import.freebetQ": "Does this bet use a freebet balance?",
  "import.snr": "Stake not returned, SNR",
  "import.sr": "Stake returned, SR (Betclic)",
  "import.detectedSelections": "Detected selections ({n})",
  "import.detectedSelectionsShort": "Detected selections",
  "import.marketDetected": "Detected market",
  "import.registerDate": "Record date",
  "import.notes": "Additional notes",
  "import.validationResult": "Validation result",
  "import.freebetNote": "Freebet: the stake does not count towards profit",
  "import.saveNext": "Save and next",
  "import.confirmSave": "Confirm and save bet",
  "import.confirmSaveShort": "Confirm and save",
  "import.savedNext": "Bet {n} saved. Reviewing the next one ({index}/{total})...",
  "import.savedNextShort": "Bet {n} saved. Reviewing {index}/{total}...",
  "import.savedOne": "Bet imported and saved successfully!",
  "import.savedMany": "{n} bets imported and saved successfully!",
  "import.savedOneMobile": "Bet imported successfully!",
  "import.savedManyMobile": "{n} bets imported!",
  "import.mobileTitle": "Import a betslip from a photo",
  "import.mobileSubtitle":
    "The AI reads the betslip and fills the bet in for you. You confirm before saving.",
  "import.takePhoto": "Take a photo",
  "import.gallery": "Gallery",
  "import.chooseImage": "Choose an image",
  "import.confirmBet": "Confirm bet",
  "import.confirmBetN": "Confirm bet ({index}/{total})",
  "import.eventPlaceholder": "Event",

  // ----------------------------------------------------------------
  // Browser extension (BetclicImport)
  // ----------------------------------------------------------------
  "ext.title": "Import bets",
  "ext.active": "Extension active",
  "ext.desc":
    "With the browser extension installed you import your Betclic and Betano bets in one click, no manual exports. Each bookmaker is read from your own session.",
  "ext.searching": "Looking for the extension...",
  "ext.account": "{bookmaker} account",
  "ext.importing": "Importing...",
  "ext.importAll": "Import bets from every bookmaker",
  "ext.nothingNew": "Nothing new to import.",
  "ext.nothingNewSkipped": "Nothing new to import ({n} already existed).",
  "ext.importFailed": "Import failed.",
  "ext.beforeImport":
    "Before importing, open betclic.pt and/or the betano.pt home page. Keep the main Betano tab open during the import.",
  "ext.reinstall": "Reinstall or install on another device",
  "ext.notDetected": "Extension not detected. Install it once to import your bets:",
  "ext.recheck": "Already installed, check again",
  "ext.webstore": "Install from the Chrome Web Store",
  "ext.download": "Download the extension (.zip)",
  "ext.step1": "Download and extract the .zip and pick the extracted folder that contains manifest.json.",
  "ext.step2": "Open brave://extensions (or chrome://extensions).",
  "ext.step3": "Turn on Developer mode (top right corner).",
  "ext.step4": "Click Load unpacked and choose the extension/ folder.",
  "ext.step5": "Come back to this page and use check again.",
  "ext.securityNote":
    "A website cannot install an extension automatically (browser security), so the installation is a one-off manual step.",
  "ext.unavailable": "unavailable",
  "ext.summary.imported": "{n} imported",
  "ext.summary.updated": "{n} updated",
  "ext.summary.skipped": "{n} already there",
  "ext.summary.unsupported": "{n} skipped",

  // ----------------------------------------------------------------
  // AI progress steps (useLoadingSteps)
  // ----------------------------------------------------------------
  "ai.step.readImage": "Reading the betslip screenshot...",
  "ai.step.readText": "Interpreting the bet description...",
  "ai.step.identify": "Identifying event, market and odds...",
  "ai.step.form": "Researching recent form and head-to-head...",
  "ai.step.injuries": "Checking injuries, suspensions and likely line-up...",
  "ai.step.odds": "Comparing market odds across bookmakers...",
  "ai.step.probability": "Estimating the fair probability...",
  "ai.step.ev": "Calculating Expected Value and edge...",
  "ai.step.finishing": "Almost there, finishing the analysis...",
  "ai.picks.prepare": "Preparing the analysis for today...",
  "ai.picks.games": "Researching the matches for today...",
  "ai.picks.odds": "Collecting approximate odds...",
  "ai.picks.form": "Assessing form, injuries and fixtures...",
  "ai.picks.select": "Selecting the best picks...",
  "ai.picks.write": "Writing the reasoning...",
  "ai.picks.finishing": "Almost there, finishing up...",
  "ai.evalError": "Could not evaluate the bet.",

  // ----------------------------------------------------------------
  // AI Insights (AIInsights + MobileInsights)
  // ----------------------------------------------------------------
  "insights.title": "AI Insights",
  "insights.picksTab": "Today's tips",
  "insights.evaluateTab": "Evaluate bet",
  "insights.refresh": "Refresh",
  "insights.refreshAria": "Refresh tips",
  "insights.picksFor": "Tips for {date}",
  "insights.picksForAt": "Tips for {date} · generated at {time}",
  "insights.picksSubtitle": "Pick suggestions for today's matches",
  "insights.evalSubtitle":
    "Paste a screenshot and/or describe the bet and the AI estimates the Expected Value",
  "insights.disclaimer":
    "AI-generated content with web search. The probability and Expected Value are estimates, may contain errors and guarantee no outcome. None of this is financial advice. Only bet what you can afford to lose. 18+ · gamble responsibly.",
  "insights.picksHint":
    "On the first visit of the day the analysis is generated on the spot and it can take up to a minute.",
  "insights.evalHint":
    "The AI searches Google and calculates the Expected Value and it can take up to a minute.",
  "insights.retry": "Try again",
  "insights.oddsNote":
    "The odds are approximate at the time of generation and shift during the day, so always check at the bookmaker. A fresh analysis is generated every day.",
  "insights.oddsNoteShort":
    "The odds are approximate and shift during the day, so always check at the bookmaker.",
  "insights.evalPlaceholder":
    "Describe the bet: event, market, selection, odds and bookmaker. E.g. Benfica to beat Porto @2.10 on Betano. (you can also paste a betslip screenshot with Ctrl+V)",
  "insights.evalPlaceholderShort":
    "Describe the bet: event, market, selection, odds and bookmaker. E.g. Benfica to beat Porto @2.10 on Betano. (you can also paste a screenshot)",
  "insights.attachPrint": "Attach screenshot",
  "insights.swapPrint": "Replace screenshot",
  "insights.pasteWith": "or paste with",
  "insights.evaluating": "Evaluating...",
  "insights.evaluate": "Evaluate bet",
  "insights.printAlt": "Bet screenshot",
  "insights.removeImage": "Remove image",
  "insights.expectedValue": "Expected Value",
  "insights.verdictLine": "{verdict}: EV {ev} per unit staked",
  "insights.metric.offeredOdd": "Offered odds",
  "insights.metric.offeredOddShort": "Offered",
  "insights.metric.fairOdd": "Fair odds",
  "insights.metric.edge": "Edge",
  "insights.metric.estProb": "Est. probability",
  "insights.metric.estProbShort": "Est. prob.",
  "insights.metric.marketProb": "Market probability",
  "insights.metric.marketProbShort": "Market prob.",
  "insights.confidence": "Confidence",
  "insights.confidenceLevel": "Confidence {level}/5",
  "insights.kellyNote":
    "{pct}% of the bankroll. Kelly is aggressive, so use a fraction and never bet more than you can afford to lose.",
  "insights.error.notImage": "Select an image file (PNG, JPG, WEBP).",
  "insights.kellyNoteAmount":
    "{amount} ({pct}% of the bankroll). Kelly is aggressive, so use a fraction and never bet more than you can afford to lose.",
  "insights.kellyLabel": "Suggested stake (½ Kelly):",
  "insights.verdictLineShort": "{verdict}: EV {ev} per unit",
  "insights.error.tooLargePrint": "The image exceeds 3MB. Crop the screenshot and try again.",
  "insights.error.tooLargePhoto": "The image exceeds 3MB. Move the camera closer to the betslip.",
  "insights.elapsed": "{n}s elapsed",
  "insights.picksSubtitleShort": "Tips for today's matches",
  "import.error.genericMobile": "Something went wrong talking to the AI.",
  "import.error.notImageMobile": "Select image files only (PNG, JPG, WEBP).",
  "import.error.tooLargeCrop": "The image exceeds 3MB. Crop the screenshot and try again.",
  "insights.legs": "Accumulator legs",
  "insights.error.picks": "Could not load today's tips.",
  "insights.error.unexpected": "An unexpected error occurred.",

  // ----------------------------------------------------------------
  // Settings: general preferences
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
  // Settings: appearance (theme + language)
  // ----------------------------------------------------------------
  "settings.appearance.title": "Appearance",
  "settings.theme.label": "Theme",
  "settings.theme.aria": "Select theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "settings.language.title": "Language",
  "settings.language.desc": "Choose the application language.",
  // Language names always stay in their own language, same values as pt.ts.
  "lang.pt": "Português",
  "lang.en": "English",

  // ----------------------------------------------------------------
  // Settings: enabled bookmakers
  // ----------------------------------------------------------------
  "settings.bookmakers.title": "Bookmakers",
  "settings.bookmakers.desc":
    "Pick the bookmakers you use. Only the selected ones show up (and get imported) on the site and in the browser extension.",
  "settings.bookmakers.none":
    "No bookmaker selected, you won't be able to import bets until you pick at least one.",
  "settings.bookmakers.loadError": "Could not load the enabled bookmakers.",
  "settings.bookmakers.saveError": "Could not save the enabled bookmakers.",

  // ----------------------------------------------------------------
  // Settings: bookmaker accounts
  // ----------------------------------------------------------------
  "settings.management.title": "Management",
  // Password (settings.password.*): form shared by desktop and mobile.
  "settings.password.title": "Password",
  "settings.password.desc": "Change this account's password. Your current one is required to confirm it's you.",
  "settings.password.current": "Current password",
  "settings.password.new": "New password",
  "settings.password.confirm": "Confirm new password",
  "settings.password.hint": "At least 8 characters.",
  "settings.password.submit": "Change password",
  "settings.password.saving": "Changing...",
  "settings.password.done": "Password changed.",
  "settings.password.otherDevices": "Sessions open on other devices stay signed in.",
  "settings.password.show": "Show password",
  "settings.password.hide": "Hide password",
  "settings.password.error.missing": "Fill in your current and new password.",
  "settings.password.error.weak": "The new password must be at least 8 characters long.",
  "settings.password.error.same": "The new password must be different from the current one.",
  "settings.password.error.current": "That current password is not correct.",
  "settings.password.error.mismatch": "The confirmation does not match the new password.",
  "settings.password.error.generic": "Could not change the password. Please try again.",
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
    "Deleting an account does not delete its bets, they are just left \"without an account\", still linked to the bookmaker.",

  // ----------------------------------------------------------------
  // Settings: bankroll (deposits and withdrawals)
  // ----------------------------------------------------------------
  "dashboard.bankroll.title": "Bankroll",
  "dashboard.bankroll.available": "Available",
  "dashboard.bankroll.exposure": "In play",
  "dashboard.bankroll.roi": "Bankroll ROI",
  "dashboard.bankroll.drawdown": "Max drawdown",
  "dashboard.bankroll.chartTitle": "Bankroll over time",
  "dashboard.bankroll.chartDesc": "Deposits, withdrawals and how your bets settled, over time.",

  "settings.bankroll.title": "Bankroll",
  "settings.bankroll.desc":
    "Record only money moving in and out of the bookmakers. What your bets do to the balance is worked out from your own history.",
  "settings.bankroll.balance": "Balance",
  "settings.bankroll.deposited": "Deposited",
  "settings.bankroll.withdrawn": "Withdrawn",
  "settings.bankroll.available": "Available",
  "settings.bankroll.kindDeposit": "Deposit",
  "settings.bankroll.kindWithdrawal": "Withdrawal",
  "settings.bankroll.kindAdjustment": "Adjustment",
  "settings.bankroll.kindAria": "Movement type",
  "settings.bankroll.amountPlaceholder": "Amount",
  "settings.bankroll.amountAria": "Movement amount",
  "settings.bankroll.dateAria": "Movement date",
  "settings.bankroll.notePlaceholder": "Note (optional)",
  "settings.bankroll.noteAria": "Movement note",
  "settings.bankroll.addShort": "Record",
  "settings.bankroll.empty": "You have not recorded any movement yet.",
  "settings.bankroll.deleteConfirm": "Delete?",
  "settings.bankroll.hint":
    "Use an adjustment for what the automatic calculation cannot see: bonuses, corrections, or bets you marked as ignored.",

  // ----------------------------------------------------------------
  // Settings: change log (audit)
  // ----------------------------------------------------------------
  "settings.audit.title": "Change log",
  "settings.audit.desc": "Detailed record of the operations done in this session",
  "settings.audit.count": {
    one: "{n} entry this session",
    other: "{n} entries this session",
  },
  "settings.audit.empty": "No changes in this session.",

  // ----------------------------------------------------------------
  // Settings: data (export / import)
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
  "settings.export.backup.desc": "Bets + bankroll + preferences",
  "settings.export.backupButton": "Download JSON backup",
  "settings.export.empty": "No bets to export",
  "settings.export.emptyToast": "There are no bets to export.",

  "settings.import.title": "Import file",
  "settings.import.desc": "JSON backup or CSV",
  "settings.import.cardTitle": "Restore / import",
  "settings.import.cardDesc": "Sync and restore old backups by dropping your file.",
  "settings.import.choose": "Choose file (.json, .csv)",

  // ----------------------------------------------------------------
  // Settings: danger zone
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
  // Settings: about / updates
  // ----------------------------------------------------------------
  "settings.about.title": "About",
  "settings.about.version": "Frontend version",
  "settings.about.checking": "Checking...",
  "settings.about.checkUpdate": "Check for update",
  "settings.about.checkUpdateDesc": "Looks for a new bundle on the server",
  "settings.about.checkDone":
    "Check finished, it applies on the next launch if there is something new.",

  // ----------------------------------------------------------------
  // Subscription (BetTrackr Pro)
  // ----------------------------------------------------------------
  "billing.title": "Subscription",
  "billing.planName": "BetTrackr Pro",
  "billing.perMonth": "{price} per month",
  "billing.loading": "Checking your subscription...",
  "billing.state.active": "Active",
  "billing.state.trial": "Free trial",
  "billing.state.admin": "Admin access",
  "billing.state.founder": "Founder access",
  "billing.state.pastDue": "Payment overdue",
  "billing.state.none": "No subscription",
  "billing.sourceManual": "Granted by the team",
  "billing.renewsOn": "Renews on {date}",
  "billing.accessUntil": "Access until {date}",
  "billing.noEndDate": "No end date",
  "billing.cancelScheduled": "Cancelled, access stays until {date}.",
  "billing.cancelScheduledNoDate": "Cancelled, it will not renew again.",
  "billing.trialEndsOn": "Your free trial ends on {date}.",
  "billing.trialDaysLeft": { one: "{count} day left.", other: "{count} days left." },
  "billing.trialOver": "Your free trial has ended.",
  "billing.subscribeFor": "Subscribe for {price}/month",
  "billing.manage": "Manage subscription",
  "billing.opening": "Opening...",
  "billing.unavailable":
    "Payments are not available yet. Get in touch and we will activate your account.",
  "billing.checkoutError": "Could not start the payment.",
  "billing.portalError": "Could not open subscription management.",
  "billing.checkoutSuccess": "Subscription active. Thank you!",
  "billing.checkoutCancelled": "Payment cancelled, you were not charged.",
  "billing.nativeNotice": "Payment opens in your browser; come back to the app when you are done.",
  "billing.includesTitle": "What you get",
  "billing.includes.screenshot": "Read bet slips straight from a screenshot",
  "billing.includes.insights": "Daily AI picks and bet evaluation",
  "billing.includes.extension": "Browser extension to import from Betclic and Betano",
  "billing.freeNote": "Adding bets by hand, the dashboard and social stay free.",
  "billing.locked.title": "This is part of BetTrackr Pro",
  "billing.locked.body": "The AI features and the extension need an active subscription.",
  "billing.refresh": "I already subscribed",
  "billing.alreadySubscribed": "This account already has an active subscription.",
  "billing.noCustomer": "There is no payment linked to this account yet.",

  // ----------------------------------------------------------------
  // Admin panel
  // ----------------------------------------------------------------
  "nav.admin": "Admin",
  "footer.admin": "Admin",
  "admin.title": "Admin",
  "admin.subtitle": "Accounts, roles and subscriptions",
  "admin.loading": "Loading...",
  "admin.error": "Could not reach the server.",
  "admin.retry": "Try again",
  "admin.metric.users": "Accounts",
  "admin.metric.entitled": "With access",
  "admin.metric.paying": "Paying",
  "admin.metric.granted": "Granted",
  "admin.metric.trial": "On trial",
  "admin.metric.pastDue": "Overdue",
  "admin.metric.mrr": "Monthly revenue",
  "admin.metric.newUsers": "New (30 days)",
  "admin.metric.bets": "Bets",
  "admin.metric.admins": "Admins",
  "admin.users.title": "Users",
  "admin.users.searchPlaceholder": "Search by name or email",
  "admin.users.empty": "No accounts found.",
  "admin.users.joined": "Joined on {date}",
  "admin.users.betsCount": { one: "{count} bet", other: "{count} bets" },
  "admin.users.showing": "{shown} of {total}",
  "admin.users.previous": "Previous",
  "admin.users.next": "Next",
  "admin.filter.all": "All",
  "admin.filter.entitled": "With access",
  "admin.filter.blocked": "No access",
  "admin.filter.paying": "Paying",
  "admin.filter.granted": "Granted",
  "admin.filter.trial": "On trial",
  "admin.filter.admins": "Admins",
  "admin.access.admin": "Admin",
  "admin.access.subscription": "Subscription",
  "admin.access.trial": "Trial",
  "admin.access.none": "No access",
  "admin.role.founder": "Founder",
  // A member's profile seen from the panel (founder only).
  "admin.profile.open": "View profile",
  "admin.profile.subtitle": "Member",
  "admin.profile.error": "Could not open this member's profile.",
  "admin.action.promote": "Make admin",
  "admin.action.demote": "Remove admin",
  "admin.action.grant": "Grant subscription",
  "admin.action.revoke": "Remove subscription",
  "admin.revoke.title": "Remove {user}'s subscription?",
  "admin.revoke.bodyManual":
    "The account loses access to the paid features right away. You can grant it a subscription again afterwards.",
  "admin.revoke.bodyPaid":
    "This cancels the Stripe subscription immediately: the account loses access and stops being charged. It does not refund what was already paid. Refunds are done in Stripe.",
  "admin.action.trial": "Change trial",
  "admin.action.delete": "Delete account",
  "admin.action.close": "Close",
  "admin.grant.title": "Grant a subscription to {user}",
  "admin.grant.months": "Months",
  "admin.grant.forever": "0 = no end date",
  "admin.grant.note": "Note (optional)",
  "admin.grant.notePlaceholder": "e.g. paid by bank transfer",
  "admin.grant.submit": "Grant",
  "admin.trial.title": "Free trial for {user}",
  "admin.trial.days": "Days from today",
  "admin.trial.hint": "0 ends the trial right away.",
  "admin.trial.submit": "Save",
  "admin.delete.title": "Delete {user}?",
  "admin.delete.body": "The account and every bet are removed. There is no way back.",
  "admin.delete.confirm": "Delete permanently",
  "admin.cancel": "Cancel",
  "admin.saving": "Saving...",
  "admin.audit.title": "Change log",
  "admin.audit.empty": "No changes recorded yet.",
  "admin.audit.action.role.update": "{admin} changed the role of {user}",
  "admin.audit.action.trial.update": "{admin} changed the trial of {user}",
  "admin.audit.action.subscription.grant": "{admin} granted a subscription to {user}",
  "admin.audit.action.subscription.revoke": "{admin} revoked the subscription of {user}",
  "admin.audit.action.user.delete": "{admin} deleted the account {user}",
  "admin.audit.action.unknown": "{admin}: {action} ({user})",
};
