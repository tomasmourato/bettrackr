# Graph Report - bettrackr  (2026-09-08)

## Corpus Check
- 266 files · ~296,254 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1841 nodes · 4485 edges · 153 communities (80 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b2ca50d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Settings.tsx
- background.js
- AuthenticatedRequest
- dependencies
- devDependencies
- insightsRoutes.ts
- mapper.js
- compilerOptions
- host_permissions
- popup.js
- Bookmaker and BetTrackr Session Status
- React Application Mount Point
- ui/index.ts
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
- csv-closing-odds.test.ts
- users
- content-betclic.js
- check-i18n.mjs
- vite.config.ts
- mapper-betano.js
- TFn
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
- pool.ts
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- index.tsx
- authFetch
- sync.ts
- betStatus.ts
- haptics.ts
- DesktopApp.tsx
- bankrollRoutes.ts
- bankroll.ts
- useI18n
- O bot completo (Metade A)
- Bet
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
- ErrorBoundary.tsx
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- TKey
- BetsManager.tsx
- import-utils.js
- tailwindcss
- @types/jsonwebtoken
- Toast.tsx
- @vitejs/plugin-react
- closing-odds.js
- settingsApi.ts
- longPress.ts
- betSelection.ts
- fetchSolverdeHistory
- daily_insights
- esbuild
- MobileApp.tsx
- @types/express
- bookie_accounts
- run-migration.mjs
- @tailwindcss/vite
- 020_daily_odds.sql
- scripts
- MobileAdmin.tsx
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
5. `Bet` - 56 edges
6. `messageOf()` - 37 edges
7. `isNativeApp()` - 36 edges
8. `TKey` - 31 edges
9. `safeNum()` - 31 edges
10. `BookieAccount` - 24 edges

## Surprising Connections (you probably didn't know these)
- `runImport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  test/app/bankroll-backup.test.ts → src/lib/dataTransfer.ts
- `reimport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  test/app/csv-closing-odds.test.ts → src/lib/dataTransfer.ts
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `BetsManager()` --calls--> `originalOddOf()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvMath.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (153 total, 45 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.13
Nodes (34): BankrollCard(), BankrollCardProps, KINDS, todayKey(), EXTENSION_BOOKIES, BookieAccountsCard(), BookieAccountsCardProps, DashboardProps (+26 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (50): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+42 more)

### Community 2 - "AuthenticatedRequest"
Cohesion: 0.19
Nodes (9): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), AccessState, AccessRequest, attachAccess(), AuthenticatedRequest (+1 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, adm-zip, tsx, @types/node, @types/pg, @types/react-dom, vite-plugin-pwa, adm-zip (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.06
Nodes (72): betClv(), betClvAtTakenPrice(), betClvNoVig(), ClvBet, ClvBetResult, clvEntre(), ClvSelection, contam() (+64 more)

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

### Community 12 - "ui/index.ts"
Cohesion: 0.27
Nodes (8): selectionHaptic(), ChipGroup(), ChipGroupProps, PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps, SwipeAction

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (32): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+24 more)

### Community 14 - "types.ts"
Cohesion: 0.11
Nodes (36): combineClosingOdds(), validClosingOdd(), BetsManager(), ScreenshotImporter(), FormSelection, nowLocal(), useBetForm(), combineFormOdds() (+28 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (58): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+50 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.12
Nodes (15): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, CLV_OPTIONS, formatDay(), KeyOption, MobileBets(), MONEY_OPTIONS, SORT_OPTIONS (+7 more)

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
Nodes (24): BET_SELECT_COLUMNS, accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff() (+16 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.11
Nodes (10): Bucket, rateLimit(), router, router, router, app, execFileAsync, extensionZipPath (+2 more)

### Community 29 - "csv-closing-odds.test.ts"
Cohesion: 0.29
Nodes (5): buildBetsCSV(), cell(), FileReaderShim, header(), reimport()

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

### Community 37 - "TFn"
Cohesion: 0.25
Nodes (9): AccountPanel(), AccountPanelProps, CurrentUser, fetchCurrentUser(), I18nValue, TFn, UserSettings, AccountSheetProps (+1 more)

### Community 51 - "vault.ts"
Cohesion: 0.23
Nodes (12): credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), SessionState, VaultContents (+4 more)

### Community 52 - "authApi.ts"
Cohesion: 0.17
Nodes (19): handleSubmit(), PasswordCard(), PasswordCardProps, ERROR_KEYS, MIN_PASSWORD_LENGTH, useChangePassword(), apiUrl(), AuthError (+11 more)

### Community 53 - "pool.ts"
Cohesion: 0.24
Nodes (6): connect(), getPool(), query(), router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES

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
Cohesion: 0.20
Nodes (18): EN, buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate() (+10 more)

### Community 58 - "authFetch"
Cohesion: 0.06
Nodes (95): AIInsights(), AIInsightsProps, AiProgress(), InsightsResponse, Pick, PickClv, toneClasses(), ActivationBadge() (+87 more)

### Community 59 - "sync.ts"
Cohesion: 0.12
Nodes (27): fetchBetclicBets(), FetchBetsOptions, fetchPage(), Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload (+19 more)

### Community 60 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 61 - "haptics.ts"
Cohesion: 0.17
Nodes (12): haptics(), ImpactWeight, NotificationKind, tapHaptic(), FAB(), FABProps, ChipOption, FilterChips() (+4 more)

### Community 62 - "DesktopApp.tsx"
Cohesion: 0.12
Nodes (15): DesktopApp, AuthPage(), AuthPageProps, Mode, BrandMark(), AdminDashboard, AIInsights, BetsManager (+7 more)

### Community 63 - "bankrollRoutes.ts"
Cohesion: 0.25
Nodes (3): Kind, router, VALID_KINDS

### Community 64 - "bankroll.ts"
Cohesion: 0.26
Nodes (8): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollPoint

### Community 65 - "useI18n"
Cohesion: 0.11
Nodes (27): DeleteDialog(), GrantDialog(), RevokeDialog(), TrialDialog(), ConfidenceDots(), ClosingOddsModal(), ClosingOddsModalProps, describeLeg() (+19 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.11
Nodes (18): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+10 more)

### Community 67 - "Bet"
Cohesion: 0.12
Nodes (15): BetsManagerProps, FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), ScreenshotImporterProps, MemberProfileData, ImportResult, MobileMemberProfileProps (+7 more)

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
Cohesion: 0.11
Nodes (18): AccountSheet(), MobileDashboard, MobileDashboard, MobileDashboard(), MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS (+10 more)

### Community 86 - "isNativeApp"
Cohesion: 0.06
Nodes (50): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, importSummary(), InstallSteps(), loadAccountChoices(), INCLUDED, PaywallNotice() (+42 more)

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

### Community 91 - "ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, State, storedLanguage()

### Community 92 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (10): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+2 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.16
Nodes (11): asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload, router (+3 more)

### Community 96 - "App.tsx"
Cohesion: 0.11
Nodes (26): App(), AppProps, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences(), usePreferences() (+18 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "TKey"
Cohesion: 0.21
Nodes (11): AllSourcesImportResult, BookmakerImportResult, requestBetclicToken(), finish(), onMessage(), onMessage(), LocalizedError, TVars (+3 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.10
Nodes (35): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard(), DashboardBetsFilters, FilterDropdown(), FilterDropdownOption (+27 more)

### Community 102 - "import-utils.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 107 - "Toast.tsx"
Cohesion: 0.25
Nodes (8): notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastProvider(), ToastState

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 111 - "settingsApi.ts"
Cohesion: 0.50
Nodes (6): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateLanguage()

### Community 112 - "longPress.ts"
Cohesion: 0.20
Nodes (4): createLongPressController(), LongPressController, LongPressOptions, TimerHandle

### Community 113 - "betSelection.ts"
Cohesion: 0.43
Nodes (4): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE

### Community 118 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 137 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (11): MobileApp, runTopBackHandler(), exitNativeApp(), MobileAdmin, MobileBets, MobileBot, MobileImport, MobileInsights (+3 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "MobileAdmin.tsx"
Cohesion: 0.13
Nodes (32): AdminDashboard(), AdminDashboardProps, TONE, useAdminPanel(), AdminAuditEntry, AdminOverview, AdminUser, AdminUserFilter (+24 more)

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
- **496 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `KEY_FILE`, `StoredKey` (+491 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 659 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mapBetclicBets` connect `sync.ts` to `background.js`, `mapper.js`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `combineClosingOdds()` connect `types.ts` to `authFetch`, `insightsRoutes.ts`, `BetsManager.tsx`, `clvRoutes.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Bet` connect `Bet` to `App.tsx`, `Settings.tsx`, `useI18n`, `bankroll.ts`, `BetsManager.tsx`, `insightsRoutes.ts`, `types.ts`, `MobileBets.tsx`, `MobileDashboard.tsx`, `MobileAdmin.tsx`, `authFetch`, `csv-closing-odds.test.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _496 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12692307692307692 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._