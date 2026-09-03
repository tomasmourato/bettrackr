# Graph Report - bettrackr  (2026-09-04)

## Corpus Check
- 225 files · ~259,406 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1540 nodes · 3633 edges · 148 communities (76 shown, 47 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `870a2a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- background.js
- DesktopApp.tsx
- dependencies
- devDependencies
- insightsRoutes.ts
- mapper.js
- compilerOptions
- host_permissions
- popup.js
- Bookmaker and BetTrackr Session Status
- React Application Mount Point
- platform.ts
- BetclicImport.tsx
- utils.ts
- clvRoutes.ts
- MobileBets.tsx
- Bookmaker Import Actions
- inject-betano.js
- backStack.ts
- Sports Betting Analytics
- BetTrackr PWA Icon
- zip-extension.mjs
- inject.js
- bettrackr-identity.js
- adminRoutes.ts
- content-bettrackr.js
- migrate.mjs
- server.ts
- dataTransfer.ts
- users
- content-betclic.js
- check-i18n.mjs
- vite.config.ts
- mapper-betano.js
- import-utils.js
- 009_daily_insights.sql
- Extension Usage Instructions
- Pre-Mount Theme Bootstrap
- Paginated Bookmaker Bet Reading
- Betano Import Integration
- Betclic Import Integration
- Bookmaker-Specific Bet Mappers
- Bet Deduplication and Settlement Updates
- No Embedded Session Credentials
- Automated Access Terms Limitation
- i18n-labels.test.ts
- @types/react
- typescript
- vite-plugin-pwa
- authApi.ts
- useBetForm.ts
- authFetch
- MobileSocial.tsx
- bankrollApi.ts
- index.tsx
- ErrorBoundary.tsx
- TKey
- parseJsonResponse
- MobileImport.tsx
- Language
- bankrollRoutes.ts
- selectionHaptic
- liveUpdate.ts
- SubscriptionRequiredError
- BetTrackr Application Stack
- Authenticated Bets API
- Gemini Screenshot Bet Extraction
- JWT Authentication
- PostgreSQL as the Single Source of Truth
- Dashboard Improvements
- Extension Import Improvements
- Gemini Multi-Bet Import Request
- Language Options
- Manual Import Improvements
- Implementation Plan
- importers.test.js
- MobileDashboard.tsx
- isNativeApp
- billingRoutes.ts
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- Dashboard.tsx
- tailwindcss
- Bet
- haptics.ts
- tsx
- closing-odds.js
- @types/node
- LongPressController
- bankroll.ts
- Settings.tsx
- daily_insights
- Toast.tsx
- esbuild
- MobileApp.tsx
- MobileInsights.tsx
- @types/express
- @types/react-dom
- BetsManager.tsx
- bookie_accounts
- betStatus.ts
- run-migration.mjs
- safeNum
- @tailwindcss/vite
- ClosingOddsSheet.tsx
- 020_daily_odds.sql
- scripts
- useI18n
- vercel.json
- package.json
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- gradlew
- CLAUDE.md
- vite

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 81 edges
2. `authFetch()` - 56 edges
3. `Bet` - 55 edges
4. `parseJsonResponse()` - 54 edges
5. `isNativeApp()` - 36 edges
6. `safeNum()` - 36 edges
7. `BookieAccount` - 23 edges
8. `App()` - 22 edges
9. `BetStatus` - 21 edges
10. `BankrollMovement` - 21 edges

## Surprising Connections (you probably didn't know these)
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `importBetsFromFile()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/dataTransfer.ts → lib/clvClosingOdds.ts
- `presentUser()` --calls--> `accessFromRow()`  [EXTRACTED]
  routes/adminRoutes.ts → lib/entitlements.ts
- `requireAdmin()` --calls--> `loadAccess()`  [EXTRACTED]
  middleware/accessMiddleware.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (148 total, 47 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.19
Nodes (9): BookieAccountsCard(), BookieAccountsCardProps, AVAILABLE_BOOKMAKERS, Bookmaker, BOOKMAKERS, BankrollPoint, BetStatus, FreebetType (+1 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (55): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+47 more)

### Community 2 - "DesktopApp.tsx"
Cohesion: 0.14
Nodes (17): DesktopApp, AccountPanel(), ScreenshotImporter(), ScreenshotImporterProps, AdminDashboard, AIInsights, BetsManager, Dashboard (+9 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, adm-zip, @capacitor/cli, @types/bun, @types/jsonwebtoken, @types/pg, @vitejs/plugin-react (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.10
Nodes (29): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+21 more)

### Community 6 - "mapper.js"
Cohesion: 0.25
Nodes (15): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+7 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (33): agent, bootstrap.ts, bun, db, DOM, DOM.Iterable, ES2022, lib (+25 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (40): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+32 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 12 - "platform.ts"
Cohesion: 0.70
Nodes (4): readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

### Community 13 - "BetclicImport.tsx"
Cohesion: 0.18
Nodes (13): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+5 more)

### Community 14 - "utils.ts"
Cohesion: 0.20
Nodes (9): FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), money(), DashboardStats, FilteredBetsSummary, calculateFilteredBetsSummary(), INITIAL_BETS (+1 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (56): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+48 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.09
Nodes (21): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, createLongPressController(), LongPressOptions, TimerHandle, BULK_MONEY_OPTIONS (+13 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "backStack.ts"
Cohesion: 0.23
Nodes (9): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, SheetPage() (+1 more)

### Community 20 - "Sports Betting Analytics"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "BetTrackr PWA Icon"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "zip-extension.mjs"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

### Community 23 - "inject.js"
Cohesion: 0.32
Nodes (4): looksLikeBetsApi(), looksLikeIdentityApi(), report(), sniffIdentity()

### Community 24 - "bettrackr-identity.js"
Cohesion: 0.46
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 25 - "adminRoutes.ts"
Cohesion: 0.12
Nodes (23): accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, iso(), isStaff(), PLAN (+15 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.08
Nodes (17): connect(), getPool(), query(), Bucket, rateLimit(), router, router, router (+9 more)

### Community 29 - "dataTransfer.ts"
Cohesion: 0.16
Nodes (11): BANKROLL_KINDS, buildBetsCSV(), importBetsFromFile(), parseCSVRow(), sanitizeBankrollMovements(), BetType, runImport(), cell() (+3 more)

### Community 30 - "users"
Cohesion: 0.16
Nodes (14): friendships, bookie_accounts, admin_audit_log, subscriptions, bankroll_movements, bookie_accounts, admin_audit_log, bankroll_movements (+6 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.12
Nodes (11): appSources, en, errors, I18N_DIR, MIGRATED, pt, PT_WORD_RE, PT_WORDS (+3 more)

### Community 36 - "mapper-betano.js"
Cohesion: 0.24
Nodes (16): runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet() (+8 more)

### Community 37 - "import-utils.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 52 - "authApi.ts"
Cohesion: 0.12
Nodes (25): AuthPage(), handleSubmit(), AuthPageProps, Mode, BrandMark(), ERROR_KEYS, MIN_PASSWORD_LENGTH, useSubscription() (+17 more)

### Community 53 - "useBetForm.ts"
Cohesion: 0.21
Nodes (15): combineClosingOdds(), validClosingOdd(), BetsManager(), FormSelection, nowLocal(), useBetForm(), combineFormOdds(), FormSelectionRow (+7 more)

### Community 54 - "authFetch"
Cohesion: 0.29
Nodes (17): useBets(), authFetch(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets() (+9 more)

### Community 55 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (15): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+7 more)

### Community 56 - "bankrollApi.ts"
Cohesion: 0.23
Nodes (15): BankrollCard(), BankrollCardProps, KINDS, todayKey(), useBankroll(), ApiMovementRow, BankrollMovementInput, createMovement() (+7 more)

### Community 57 - "index.tsx"
Cohesion: 0.26
Nodes (16): buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate(), TVars (+8 more)

### Community 58 - "ErrorBoundary.tsx"
Cohesion: 0.19
Nodes (5): ErrorBoundary, Props, State, storedLanguage(), hideSplashScreen()

### Community 59 - "TKey"
Cohesion: 0.21
Nodes (9): EN, Entry, Plural, PT, TKey, DATE_FORMAT, daysUntil(), SubscriptionDisplay (+1 more)

### Community 60 - "parseJsonResponse"
Cohesion: 0.53
Nodes (8): useAccounts(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount(), parseJsonResponse()

### Community 61 - "MobileImport.tsx"
Cohesion: 0.22
Nodes (6): MobileImport, MobileImportProps, pickNativePhoto(), STATUS_FORM_OPTIONS, ChipGroup(), ChipGroupProps

### Community 62 - "Language"
Cohesion: 0.31
Nodes (7): AccountPanelProps, CurrentUser, I18nValue, TFn, UserSettings, AccountSheetProps, Language

### Community 63 - "bankrollRoutes.ts"
Cohesion: 0.25
Nodes (3): Kind, router, VALID_KINDS

### Community 64 - "selectionHaptic"
Cohesion: 0.32
Nodes (6): selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps, SwipeAction

### Community 65 - "liveUpdate.ts"
Cohesion: 0.47
Nodes (3): legacyNameFor(), migrateLegacyStorageKeys(), STORAGE_KEYS

### Community 83 - "Implementation Plan"
Cohesion: 0.08
Nodes (24): Appendix - freebet research sources (F3), Build Spec - Slice 1 (Cashout end-to-end + Dashboard fix), C1 - Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 - Fix "Distribuição de Resultados" count (confirmed bug), D2 - Dashboard filters (bookie, sport, bet type, ...), Dashboard (TODO §4) (+16 more)

### Community 84 - "importers.test.js"
Cohesion: 0.18
Nodes (18): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet() (+10 more)

### Community 85 - "MobileDashboard.tsx"
Cohesion: 0.12
Nodes (19): Gallery, MobileDashboard, MobileMemberProfileProps, MobileDashboard(), MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS (+11 more)

### Community 86 - "isNativeApp"
Cohesion: 0.14
Nodes (26): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, ERROR_KEYS (+18 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.25
Nodes (13): loadAccess(), accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf() (+5 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 92 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (10): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+2 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 96 - "App.tsx"
Cohesion: 0.16
Nodes (17): App(), AppProps, makeInitialLogs(), useAuditLog(), useLanguageSync(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences() (+9 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 101 - "Dashboard.tsx"
Cohesion: 0.13
Nodes (26): Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER, formatDateKey(), fromLocalDateKey() (+18 more)

### Community 105 - "Bet"
Cohesion: 0.15
Nodes (24): BetsManagerProps, ClosingOddsModalProps, DashboardBetsFilters, DashboardProps, SettingsProps, ClosingOddInput, ClosingOddsSheetProps, MobileBetsProps (+16 more)

### Community 107 - "haptics.ts"
Cohesion: 0.15
Nodes (14): haptics(), ImpactWeight, NotificationKind, tapHaptic(), FAB(), FABProps, ChipOption, FilterChips() (+6 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.14
Nodes (29): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+21 more)

### Community 115 - "bankroll.ts"
Cohesion: 0.29
Nodes (7): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp()

### Community 117 - "Settings.tsx"
Cohesion: 0.29
Nodes (14): Settings(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), getBundleVersion(), initLiveUpdate(), fetchSettings(), normalizeLanguage() (+6 more)

### Community 133 - "Toast.tsx"
Cohesion: 0.25
Nodes (8): notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastProvider(), ToastState

### Community 137 - "MobileApp.tsx"
Cohesion: 0.15
Nodes (15): MobileApp, AccountSheet(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileBets (+7 more)

### Community 140 - "MobileInsights.tsx"
Cohesion: 0.14
Nodes (24): AIInsights(), AIInsightsProps, AiProgress(), InsightsResponse, Pick, toneClasses(), evalStepsFor(), LoadingStep (+16 more)

### Community 143 - "BetsManager.tsx"
Cohesion: 0.23
Nodes (8): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FiltersBar(), FiltersBarProps, resolveSelectionDisplayResult(), SelectionDisplayResult

### Community 146 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 150 - "safeNum"
Cohesion: 0.25
Nodes (17): betClv(), betClvNoVig(), calculateClv(), ClvBetResult, ClvBookmakerRow, ClvPoint, ClvSummary, dayOf() (+9 more)

### Community 157 - "ClosingOddsSheet.tsx"
Cohesion: 0.33
Nodes (7): ClosingOddsModal(), describeLeg(), legKey(), ClosingOddsSheet(), describeLeg(), legKey(), parseDecimal()

### Community 179 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android:open, android:sync, build, build:agent, check:i18n, clean, dev (+5 more)

### Community 182 - "useI18n"
Cohesion: 0.08
Nodes (50): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), ConfidenceDots() (+42 more)

### Community 195 - "vercel.json"
Cohesion: 0.20
Nodes (9): fra1, builds, crons, test, git, deploymentEnabled, regions, routes (+1 more)

### Community 210 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 218 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 221 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **421 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `config`, `daily_insights` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 566 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `useBetForm.ts` to `BetsManager.tsx`, `clvRoutes.ts`, `safeNum`, `authFetch`, `dataTransfer.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `types.ts`, `DesktopApp.tsx`, `Dashboard.tsx`, `MobileInsights.tsx`, `BetclicImport.tsx`, `utils.ts`, `BetsManager.tsx`, `MobileBets.tsx`, `MobileImport.tsx`, `authApi.ts`, `useBetForm.ts`, `isNativeApp`, `Settings.tsx`, `bankrollApi.ts`, `MobileSocial.tsx`, `MobileDashboard.tsx`, `ClosingOddsSheet.tsx`, `index.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._
- **Should `DesktopApp.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._