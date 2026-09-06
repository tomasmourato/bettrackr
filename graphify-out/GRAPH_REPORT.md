# Graph Report - bettrackr  (2026-09-06)

## Corpus Check
- 257 files · ~284,590 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1776 nodes · 4179 edges · 157 communities (85 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3826f61a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- billingApi.ts
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
- apiBase.ts
- marco0.ts
- useBetForm.ts
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
- MobileDashboard.tsx
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
- accessMiddleware.ts
- authApi.ts
- utils.ts
- src/index.ts
- softAuthenticator.ts
- Gallery.tsx
- index.tsx
- authFetch
- sync.ts
- betStatus.ts
- ui/index.ts
- BotPanel.tsx
- bankrollRoutes.ts
- Language
- MobileSocial.tsx
- O bot completo (Metade A)
- settingsApi.ts
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
- MobileAdmin.tsx
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
- TKey
- BetsManager.tsx
- pool.ts
- tailwindcss
- @types/jsonwebtoken
- haptics.ts
- @vitejs/plugin-react
- closing-odds.js
- ErrorBoundary.tsx
- longPress.ts
- useNativeChrome.ts
- types.ts
- accountsApi.ts
- fetchSolverdeHistory
- daily_insights
- platform.ts
- esbuild
- MobileApp.tsx
- MobileInsights.tsx
- @types/express
- bookie_accounts
- run-migration.mjs
- safeNum
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
1. `useI18n()` - 89 edges
2. `authFetch()` - 60 edges
3. `parseJsonResponse()` - 58 edges
4. `Bet` - 55 edges
5. `isNativeApp()` - 36 edges
6. `safeNum()` - 36 edges
7. `App()` - 23 edges
8. `BookieAccount` - 23 edges
9. `BetsManager()` - 21 edges
10. `BetStatus` - 21 edges

## Surprising Connections (you probably didn't know these)
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `BetsManager()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `importBetsFromFile()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/dataTransfer.ts → lib/clvClosingOdds.ts
- `requireAdmin()` --calls--> `isStaff()`  [EXTRACTED]
  middleware/accessMiddleware.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (157 total, 45 thin omitted)

### Community 0 - "billingApi.ts"
Cohesion: 0.26
Nodes (7): ERROR_KEYS, AccessSource, BillingError, openBillingPortal(), requestUrl(), startCheckout(), SubscriptionRequiredError

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (53): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+45 more)

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
Cohesion: 0.19
Nodes (19): refOf, fetchBetclicBets(), fetchBetclicBetsForImport(), amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn() (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (33): agent, bootstrap.ts, bun, db, DOM, DOM.Iterable, lib, middleware (+25 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (40): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+32 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 12 - "apiBase.ts"
Cohesion: 0.21
Nodes (7): API_BASE, configured, UPDATE_BASES, initLiveUpdate(), procurarAtualizacao(), VersaoRemota, hideSplashScreen()

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (28): [cmd, arg], cmdCleanup(), cmdEnrol(), cmdLogin(), KEY_FILE, load(), save(), StoredKey (+20 more)

### Community 14 - "useBetForm.ts"
Cohesion: 0.18
Nodes (14): combineClosingOdds(), validClosingOdd(), FormSelection, nowLocal(), useBetForm(), combineFormOdds(), FormSelectionRow, mergeSelection() (+6 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (56): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+48 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.09
Nodes (20): ClvLockInline(), ClvLockPanel(), ClvLockProps, BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS (+12 more)

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
Cohesion: 0.14
Nodes (17): accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff(), PLAN (+9 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.10
Nodes (11): Bucket, rateLimit(), router, router, router, router, app, execFileAsync (+3 more)

### Community 29 - "dataTransfer.ts"
Cohesion: 0.14
Nodes (17): Settings(), BANKROLL_KINDS, buildBetsCSV(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), importBetsFromFile(), parseCSVRow() (+9 more)

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
Cohesion: 0.28
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "MobileDashboard.tsx"
Cohesion: 0.18
Nodes (9): MobileDashboard(), MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS, toKey(), TONES, TYPE_OPTIONS (+1 more)

### Community 51 - "accessMiddleware.ts"
Cohesion: 0.29
Nodes (10): AccessState, loadAccess(), AccessRequest, attachAccess(), requireAdmin(), requireBotAccess(), requireFounder(), requireSubscription() (+2 more)

### Community 52 - "authApi.ts"
Cohesion: 0.15
Nodes (21): AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl(), AuthError (+13 more)

### Community 53 - "utils.ts"
Cohesion: 0.15
Nodes (20): FilteredBetsSummary(), money(), ScreenshotImporter(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName(), BOOKMAKERS, defaultFreebetTypeFor() (+12 more)

### Community 54 - "src/index.ts"
Cohesion: 0.13
Nodes (31): cmdVaultImport(), deleteContextToken(), fetchContextToken(), fetchFreshToken(), heartbeat(), Credential, enrolAndSave(), hasPassphrase() (+23 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.21
Nodes (17): buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint(), cborText() (+9 more)

### Community 56 - "Gallery.tsx"
Cohesion: 0.19
Nodes (9): selectionHaptic(), GalleryInner(), MobileBets, MobileDashboard, PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps (+1 more)

### Community 57 - "index.tsx"
Cohesion: 0.26
Nodes (16): buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate(), TVars (+8 more)

### Community 58 - "authFetch"
Cohesion: 0.29
Nodes (19): useBets(), fetchMemberBets(), authFetch(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets() (+11 more)

### Community 59 - "sync.ts"
Cohesion: 0.15
Nodes (23): cmdBets(), requestLoginOptions(), fetchBetclicBets(), FetchBetsOptions, fetchPage(), BettrackrConfig, extractImportKey(), HeartbeatPayload (+15 more)

### Community 60 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 61 - "ui/index.ts"
Cohesion: 0.18
Nodes (13): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+5 more)

### Community 62 - "BotPanel.tsx"
Cohesion: 0.17
Nodes (13): ActivationBadge(), ActivationCard(), BotMode, BotPanel(), RunRow(), activateBot(), BotActivation, BotActivationSource (+5 more)

### Community 63 - "bankrollRoutes.ts"
Cohesion: 0.25
Nodes (3): Kind, router, VALID_KINDS

### Community 64 - "Language"
Cohesion: 0.19
Nodes (11): AccountPanel(), AccountPanelProps, useSubscription(), CurrentUser, SessionExpiredError, fetchBillingStatus(), I18nValue, TFn (+3 more)

### Community 65 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (15): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+7 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.11
Nodes (17): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+9 more)

### Community 67 - "settingsApi.ts"
Cohesion: 0.50
Nodes (6): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateLanguage()

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.31
Nodes (7): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 83 - "Implementation Plan"
Cohesion: 0.08
Nodes (24): Appendix - freebet research sources (F3), Build Spec - Slice 1 (Cashout end-to-end + Dashboard fix), C1 - Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 - Fix "Distribuição de Resultados" count (confirmed bug), D2 - Dashboard filters (bookie, sport, bet type, ...), Dashboard (TODO §4) (+16 more)

### Community 84 - "importers.test.js"
Cohesion: 0.14
Nodes (24): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+16 more)

### Community 85 - "MobileAdmin.tsx"
Cohesion: 0.17
Nodes (12): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MobileAdmin, MobileAdminProps, Sheet, TONE (+4 more)

### Community 86 - "isNativeApp"
Cohesion: 0.20
Nodes (18): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, useBillingActions() (+10 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.26
Nodes (12): accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf(), priceOf() (+4 more)

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
Cohesion: 0.44
Nodes (8): useBankroll(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi(), updateMovement(), VALID_KINDS

### Community 92 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (10): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+2 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 96 - "App.tsx"
Cohesion: 0.08
Nodes (38): App(), AppProps, DesktopApp, Gallery, BrandMark(), DashboardBetsFilters, AdminDashboard, BetsManager (+30 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "TKey"
Cohesion: 0.21
Nodes (9): EN, Entry, Plural, PT, TKey, DATE_FORMAT, daysUntil(), SubscriptionDisplay (+1 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.11
Nodes (33): BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard(), FilterDropdown(), FilterDropdownOption (+25 more)

### Community 102 - "pool.ts"
Cohesion: 0.24
Nodes (6): connect(), getPool(), query(), router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES

### Community 107 - "haptics.ts"
Cohesion: 0.18
Nodes (11): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext (+3 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.14
Nodes (29): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+21 more)

### Community 111 - "ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, State, storedLanguage()

### Community 112 - "longPress.ts"
Cohesion: 0.20
Nodes (4): createLongPressController(), LongPressController, LongPressOptions, TimerHandle

### Community 113 - "useNativeChrome.ts"
Cohesion: 0.40
Nodes (3): setThemeColorMeta(), useAndroidBackButton(), useNativeChrome()

### Community 115 - "types.ts"
Cohesion: 0.10
Nodes (37): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCardProps, DashboardProps, FilteredBetsSummaryProps (+29 more)

### Community 117 - "accountsApi.ts"
Cohesion: 0.53
Nodes (7): useAccounts(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount()

### Community 118 - "fetchSolverdeHistory"
Cohesion: 0.83
Nodes (3): addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 131 - "platform.ts"
Cohesion: 0.70
Nodes (4): readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

### Community 137 - "MobileApp.tsx"
Cohesion: 0.19
Nodes (12): MobileApp, AccountSheet(), runTopBackHandler(), exitNativeApp(), MobileBets, MobileDashboard, MobileImport, MobileSettings (+4 more)

### Community 140 - "MobileInsights.tsx"
Cohesion: 0.11
Nodes (28): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), AIInsights (+20 more)

### Community 150 - "safeNum"
Cohesion: 0.14
Nodes (32): ClosingOddsModal(), ClosingOddsModalProps, describeLeg(), legKey(), betClv(), betClvAtTakenPrice(), betClvNoVig(), calculateClv() (+24 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "useI18n"
Cohesion: 0.06
Nodes (63): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), BetclicImport() (+55 more)

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
- **484 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `KEY_FILE`, `StoredKey` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 645 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mapBetclicBets` connect `mapper.js` to `background.js`, `sync.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `combineClosingOdds()` connect `useBetForm.ts` to `BetsManager.tsx`, `clvRoutes.ts`, `safeNum`, `authFetch`, `dataTransfer.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `isNativeApp()` connect `isNativeApp` to `billingApi.ts`, `platform.ts`, `MobileApp.tsx`, `haptics.ts`, `apiBase.ts`, `MobileInsights.tsx`, `useNativeChrome.ts`, `types.ts`, `utils.ts`, `useI18n`, `dataTransfer.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._