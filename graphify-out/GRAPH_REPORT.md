# Graph Report - bettrackr  (2026-09-08)

## Corpus Check
- 263 files · ~292,122 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1810 nodes · 4398 edges · 156 communities (82 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10bb77de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Settings.tsx
- background.js
- clvVisibility.ts
- dependencies
- devDependencies
- insightsRoutes.ts
- mapper.js
- compilerOptions
- host_permissions
- popup.js
- Bookmaker and BetTrackr Session Status
- React Application Mount Point
- BetclicImport.tsx
- marco0.ts
- types.ts
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
- BetsManager.tsx
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
- vault.ts
- authApi.ts
- MobileImport.tsx
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- index.tsx
- authFetch
- sync.ts
- betStatus.ts
- ui/index.ts
- BotPanel.tsx
- pool.ts
- bankroll.ts
- safeNum
- O bot completo (Metade A)
- FilteredBetsSummary.tsx
- compilerOptions
- @capacitor/cli
- botRoutes.ts
- @types/bun
- bot/package.json
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
- bankrollApi.ts
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- apiError.ts
- Dashboard.tsx
- import-utils.js
- tailwindcss
- @types/jsonwebtoken
- Toast.tsx
- @vitejs/plugin-react
- closing-odds.js
- BankrollCard.tsx
- LongPressController
- Pressable
- Bet
- fetchSolverdeHistory
- daily_insights
- esbuild
- MobileApp.tsx
- MobileInsights.tsx
- @types/express
- bookie_accounts
- run-migration.mjs
- clv.ts
- @tailwindcss/vite
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
1. `useI18n()` - 91 edges
2. `authFetch()` - 60 edges
3. `parseJsonResponse()` - 58 edges
4. `apiError` - 57 edges
5. `Bet` - 55 edges
6. `messageOf()` - 37 edges
7. `isNativeApp()` - 36 edges
8. `safeNum()` - 36 edges
9. `TKey` - 31 edges
10. `BookieAccount` - 24 edges

## Surprising Connections (you probably didn't know these)
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `BetsManager()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvClosingOdds.ts
- `useBetForm()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/hooks/useBetForm.ts → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `importBetsFromFile()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/dataTransfer.ts → lib/clvClosingOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (156 total, 46 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.25
Nodes (15): PasswordCard(), PasswordCardProps, Settings(), useChangePassword(), ACTION_KEYS, auditAction(), auditDetails(), deliverTextFile() (+7 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (50): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+42 more)

### Community 2 - "clvVisibility.ts"
Cohesion: 0.38
Nodes (4): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv()

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, adm-zip, tsx, @types/node, @types/pg, @types/react-dom, vite-plugin-pwa, adm-zip (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.10
Nodes (29): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+21 more)

### Community 6 - "mapper.js"
Cohesion: 0.24
Nodes (16): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+8 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (33): agent, bootstrap.ts, bun, db, DOM, DOM.Iterable, lib, middleware (+25 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (40): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+32 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 12 - "BetclicImport.tsx"
Cohesion: 0.18
Nodes (15): BetclicImport(), EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard(), EnabledBookmakersCardProps (+7 more)

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (32): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+24 more)

### Community 14 - "types.ts"
Cohesion: 0.18
Nodes (15): FormSelection, nowLocal(), useBetForm(), combineFormOdds(), FormSelectionRow, mergeSelection(), BetStatus, BetType (+7 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (58): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+50 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.10
Nodes (21): ClvLockInline(), ClvLockPanel(), ClvLockProps, BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS (+13 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "backStack.ts"
Cohesion: 0.29
Nodes (7): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps

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
Nodes (24): accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff(), loadAccess() (+16 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.08
Nodes (16): AccessState, AccessRequest, AuthenticatedRequest, Bucket, rateLimit(), router, router, router (+8 more)

### Community 29 - "dataTransfer.ts"
Cohesion: 0.13
Nodes (14): BANKROLL_KINDS, buildBetsCSV(), importBetsFromFile(), ImportResult, parseCSVRow(), sanitizeBankrollMovements(), calculateBetReturnAndProfit(), Importado (+6 more)

### Community 30 - "users"
Cohesion: 0.12
Nodes (16): friendships, bookie_accounts, admin_audit_log, subscriptions, bankroll_movements, bookie_accounts, bot_runs, bot_context_tokens (+8 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.12
Nodes (11): appSources, en, errors, I18N_DIR, MIGRATED, pt, PT_WORD_RE, PT_WORDS (+3 more)

### Community 36 - "mapper-betano.js"
Cohesion: 0.24
Nodes (16): runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet() (+8 more)

### Community 37 - "BetsManager.tsx"
Cohesion: 0.15
Nodes (12): BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FiltersBar(), FiltersBarProps, createLongPressController() (+4 more)

### Community 51 - "vault.ts"
Cohesion: 0.23
Nodes (12): credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), SessionState, VaultContents (+4 more)

### Community 52 - "authApi.ts"
Cohesion: 0.15
Nodes (19): AuthPage(), handleSubmit(), AuthPageProps, Mode, BrandMark(), ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl() (+11 more)

### Community 53 - "MobileImport.tsx"
Cohesion: 0.30
Nodes (11): ScreenshotImporter(), useSubscription(), messageOf(), fetchBillingStatus(), AVAILABLE_BOOKMAKERS, matchBookmaker(), matchStatus(), MobileImport() (+3 more)

### Community 54 - "src/index.ts"
Cohesion: 0.18
Nodes (23): deleteContextToken(), fetchFreshToken(), heartbeat(), AccountRuntime, Credential, discoverLocalAccounts(), enrolAndSave(), hasPassphrase() (+15 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.21
Nodes (17): buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint(), cborText() (+9 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 57 - "index.tsx"
Cohesion: 0.13
Nodes (29): AccountPanel(), AccountPanelProps, CurrentUser, fetchCurrentUser(), StoredUser, EN, buildValue(), DICTS (+21 more)

### Community 58 - "authFetch"
Cohesion: 0.17
Nodes (38): ActivationCard(), Social(), SocialProps, useBets(), apiError, authFetch(), parseJsonResponse(), ApiBetRow (+30 more)

### Community 59 - "sync.ts"
Cohesion: 0.12
Nodes (27): fetchBetclicBets(), FetchBetsOptions, fetchPage(), Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload (+19 more)

### Community 60 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 61 - "ui/index.ts"
Cohesion: 0.13
Nodes (20): haptics(), ImpactWeight, NotificationKind, selectionHaptic(), tapHaptic(), ChipGroup(), ChipGroupProps, FAB() (+12 more)

### Community 62 - "BotPanel.tsx"
Cohesion: 0.16
Nodes (17): ActivationBadge(), BotMode, BotPanel(), isBetclic(), RunRow(), BotPanel, useAccounts(), ApiAccountRow (+9 more)

### Community 63 - "pool.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 64 - "bankroll.ts"
Cohesion: 0.26
Nodes (8): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollPoint

### Community 65 - "safeNum"
Cohesion: 0.35
Nodes (8): ClosingOddsModal(), describeLeg(), legKey(), ClosingOddsSheet(), describeLeg(), legKey(), parseDecimal(), safeNum()

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.11
Nodes (18): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+10 more)

### Community 67 - "FilteredBetsSummary.tsx"
Cohesion: 0.31
Nodes (5): FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), calculateFilteredBetsSummary(), selectBetsForFinancialSummary()

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.27
Nodes (7): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 83 - "Implementation Plan"
Cohesion: 0.08
Nodes (24): Appendix - freebet research sources (F3), Build Spec - Slice 1 (Cashout end-to-end + Dashboard fix), C1 - Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 - Fix "Distribuição de Resultados" count (confirmed bug), D2 - Dashboard filters (bookie, sport, bet type, ...), Dashboard (TODO §4) (+16 more)

### Community 84 - "importers.test.js"
Cohesion: 0.19
Nodes (17): runSolverdeImport(), createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), flattenSelections(), formatDateTime() (+9 more)

### Community 85 - "MobileDashboard.tsx"
Cohesion: 0.10
Nodes (21): MobileDashboard, MobileMemberProfile(), statusMeta(), MobileAdmin, MobileAdminProps, Sheet, TONE, MobileDashboard() (+13 more)

### Community 86 - "isNativeApp"
Cohesion: 0.06
Nodes (47): ErrorBoundary, Props, State, storedLanguage(), INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED (+39 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.24
Nodes (13): accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf(), priceOf() (+5 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 91 - "bankrollApi.ts"
Cohesion: 0.33
Nodes (9): useBankroll(), SessionExpiredError, ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi(), updateMovement() (+1 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (10): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+2 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 96 - "App.tsx"
Cohesion: 0.07
Nodes (41): App(), AppProps, DesktopApp, AdminDashboard, BetsManager, Dashboard, DesktopApp(), ScreenshotImporter (+33 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "apiError.ts"
Cohesion: 0.21
Nodes (11): AllSourcesImportResult, BookmakerImportResult, requestBetclicToken(), finish(), onMessage(), onMessage(), LocalizedError, TVars (+3 more)

### Community 101 - "Dashboard.tsx"
Cohesion: 0.13
Nodes (28): Dashboard(), DashboardBetsFilters, FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER, formatDateKey() (+20 more)

### Community 102 - "import-utils.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 107 - "Toast.tsx"
Cohesion: 0.25
Nodes (8): notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastProvider(), ToastState

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 111 - "BankrollCard.tsx"
Cohesion: 0.39
Nodes (7): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BankrollMovementInput, BankrollMovementKind, BankrollSummary

### Community 113 - "Pressable"
Cohesion: 0.50
Nodes (3): Pressable(), PressableProps, SheetPageProps

### Community 115 - "Bet"
Cohesion: 0.16
Nodes (23): BetclicImportProps, BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, ClosingOddsModalProps, DashboardProps, MemberProfileProps, ScreenshotImporterProps (+15 more)

### Community 118 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 137 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (11): MobileApp, runTopBackHandler(), useAndroidBackButton(), MobileBets, MobileBot, MobileDashboard, MobileImport, MobileInsights (+3 more)

### Community 140 - "MobileInsights.tsx"
Cohesion: 0.12
Nodes (27): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), AIInsights (+19 more)

### Community 150 - "clv.ts"
Cohesion: 0.19
Nodes (23): combineClosingOdds(), validClosingOdd(), betClv(), betClvAtTakenPrice(), betClvNoVig(), calculateClv(), ClvBetResult, ClvBookmakerRow (+15 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "useI18n"
Cohesion: 0.11
Nodes (37): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), MemberProfile() (+29 more)

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
- **492 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `KEY_FILE`, `StoredKey` (+487 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 654 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `clv.ts` to `BetsManager.tsx`, `types.ts`, `clvRoutes.ts`, `authFetch`, `dataTransfer.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `mapBetclicBets` connect `sync.ts` to `background.js`, `mapper.js`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `isNativeApp()` connect `isNativeApp` to `Settings.tsx`, `MobileApp.tsx`, `BetclicImport.tsx`, `MobileInsights.tsx`, `dataTransfer.ts`, `MobileImport.tsx`, `ui/index.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _492 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._