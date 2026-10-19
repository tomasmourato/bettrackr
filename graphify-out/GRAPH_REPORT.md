# Graph Report - bettrackr  (2026-10-19)

## Corpus Check
- 282 files · ~316,090 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .xml 12, (none) 4, .properties 2)

## Summary
- 1989 nodes · 5354 edges · 136 communities (78 shown, 58 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e060e360`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Bet
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
- botWatch.ts
- marco0.ts
- types.ts
- clvRoutes.ts
- MobileBets.tsx
- Bookmaker Import Actions
- inject-betano.js
- react
- Sports Betting Analytics
- BetTrackr PWA Icon
- mapper-solverde.js
- inject.js
- bettrackr-identity.js
- adminRoutes.ts
- content-bettrackr.js
- ref_node_fs
- server.ts
- importers.test.js
- schema.sql
- content-betclic.js
- check-i18n.mjs
- vite.config.ts
- mapper-betano.js
- authApi.ts
- 009_daily_insights.sql
- Extension Usage Instructions
- Pre-Mount Theme Bootstrap
- Paginated Bookmaker Bet Reading
- Betano Import Integration
- Betclic Import Integration
- Bookmaker-Specific Bet Mappers
- Bet Deduplication and Settlement Updates
- DesktopApp.tsx
- vault.ts
- bankroll.ts
- MobileImport.tsx
- Settings.tsx
- parseJsonResponse
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- MobileInsights.tsx
- sync.ts
- dataTransfer.ts
- betclicOdds.ts
- clv-agent.ts
- MobileSocial.tsx
- MobileAdmin.tsx
- O bot completo (Metade A)
- compilerOptions
- botRoutes.ts
- bot/package.json
- BetTrackr Application Stack
- Authenticated Bets API
- Gemini Screenshot Bet Extraction
- JWT Authentication
- Dashboard Improvements
- Extension Import Improvements
- Gemini Multi-Bet Import Request
- Language Options
- Manual Import Improvements
- BetTrackr Product Backlog
- App.tsx
- isNativeApp
- billingRoutes.ts
- gen-icons.mjs
- ExampleInstrumentedTest.java
- atualizar-bot.sh
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- fetchSolverdeHistory
- make-admin.mjs
- AGENTS.md
- BetclicImport.tsx
- BetsManager.tsx
- apiError
- closing-odds.js
- bankrollRoutes.ts
- LongPressController
- useAccounts.ts
- betclicGrpc.ts
- bookie_accounts_username_key
- MobileDashboard.tsx
- MobileApp.tsx
- religar-bot.sh
- haptics.ts
- 026_clv_agent_runs.sql
- 020_daily_odds.sql
- scripts
- index.tsx
- vercel.json
- package.json
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 105 edges
2. `react` - 71 edges
3. `authFetch()` - 65 edges
4. `apiError` - 64 edges
5. `parseJsonResponse()` - 63 edges
6. `Bet` - 56 edges
7. `lucide-react` - 41 edges
8. `isNativeApp()` - 40 edges
9. `messageOf()` - 40 edges
10. `TKey` - 33 edges

## Surprising Connections (you probably didn't know these)
- `lerJogo()` --calls--> `readMatchPage()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `lerCategorias()` --calls--> `cabecalhosDaPagina()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicGrpc.ts
- `lerCategorias()` --calls--> `parseNgState()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `descobrirJogos()` --calls--> `parseNgState()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `passagemDiaria()` --calls--> `readMatchSnapshot()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (136 total, 58 thin omitted)

### Community 0 - "Bet"
Cohesion: 0.13
Nodes (25): BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCardProps, ClosingOddsModalProps, DashboardProps, MemberProfileProps (+17 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (50): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+42 more)

### Community 2 - "AuthenticatedRequest"
Cohesion: 0.21
Nodes (8): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), AccessState, AccessRequest, AuthenticatedRequest, router

### Community 3 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics (+17 more)

### Community 4 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss, @tailwindcss/vite, tsx, @types/bun (+10 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.06
Nodes (78): betClv(), betClvAtTakenPrice(), betClvNoVig(), ClvBet, ClvBetResult, clvDuplicateKey(), clvEntre(), ClvSelection (+70 more)

### Community 6 - "mapper.js"
Cohesion: 0.24
Nodes (16): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+8 more)

### Community 7 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module, moduleDetection (+8 more)

### Community 8 - "host_permissions"
Cohesion: 0.08
Nodes (23): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+15 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 12 - "botWatch.ts"
Cohesion: 0.10
Nodes (33): alertTabFor(), BotActivity, botAlertText(), CLV_AGENT_FAILING_AFTER_MS, CLV_ALERT_KIND, clvAgentAlertText(), ClvWatchSummary, formatDuration() (+25 more)

### Community 13 - "marco0.ts"
Cohesion: 0.11
Nodes (34): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+26 more)

### Community 14 - "types.ts"
Cohesion: 0.11
Nodes (34): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, AiChip(), ScreenshotImporter(), ScreenshotImporterProps, FormSelection (+26 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.11
Nodes (28): betclicMatchPath(), devig(), leadMinutesFrom(), resolveClvAgentAlert(), asArray(), BetRow, CAPTURE_CUTOFF_MIN, CAPTURE_WINDOW_MIN (+20 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.14
Nodes (26): ClvLockInline(), AccountSheet(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, BulkAction(), CLV_OPTIONS, formatDay(), FormField() (+18 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "react"
Cohesion: 0.12
Nodes (17): lucide-react, motion, react, react-dom, FilterDropdownOption, FilterDropdownProps, FiltersBarProps, BottomSheetProps (+9 more)

### Community 20 - "Sports Betting Analytics"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "BetTrackr PWA Icon"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "mapper-solverde.js"
Cohesion: 0.31
Nodes (12): runSolverdeImport(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize() (+4 more)

### Community 23 - "inject.js"
Cohesion: 0.32
Nodes (4): looksLikeBetsApi(), looksLikeIdentityApi(), report(), sniffIdentity()

### Community 24 - "bettrackr-identity.js"
Cohesion: 0.46
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 25 - "adminRoutes.ts"
Cohesion: 0.12
Nodes (24): accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff(), loadAccess() (+16 more)

### Community 27 - "ref_node_fs"
Cohesion: 0.15
Nodes (10): AnimatedMetricValue(), FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE (+2 more)

### Community 28 - "server.ts"
Cohesion: 0.07
Nodes (16): Bucket, rateLimit(), dotenv, express, router, router, router, router (+8 more)

### Community 29 - "importers.test.js"
Cohesion: 0.22
Nodes (12): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+4 more)

### Community 30 - "schema.sql"
Cohesion: 0.06
Nodes (47): idx_bets_user_id, users_username_key, friendships, friendships_addressee_idx, friendships_requester_idx, bookie_accounts, bookie_accounts_user_idx, idx_bets_account_id (+39 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.07
Nodes (21): distDir, EXCLUDE, root, versionFile, zipFile, appSources, collectSources(), en (+13 more)

### Community 35 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, start(), BUILD_TIME

### Community 36 - "mapper-betano.js"
Cohesion: 0.24
Nodes (16): runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet() (+8 more)

### Community 37 - "authApi.ts"
Cohesion: 0.14
Nodes (24): AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH, useSubscription(), apiUrl() (+16 more)

### Community 48 - "DesktopApp.tsx"
Cohesion: 0.21
Nodes (14): AccountPanel(), DetailRow(), BrandMark(), AdminDashboard, AIInsights, BetsManager, BotPanel, Dashboard (+6 more)

### Community 49 - "vault.ts"
Cohesion: 0.21
Nodes (13): credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), saveVault(), SessionState (+5 more)

### Community 50 - "bankroll.ts"
Cohesion: 0.26
Nodes (8): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollPoint

### Community 51 - "MobileImport.tsx"
Cohesion: 0.36
Nodes (6): @capacitor/camera, MobileImport(), pickNativePhoto(), STATUS_FORM_OPTIONS, SegmentedControl(), SheetPage()

### Community 52 - "Settings.tsx"
Cohesion: 0.15
Nodes (28): AccountPanelProps, BankrollCard(), BookieAccountsCard(), PasswordCard(), PasswordCardProps, Settings(), useChangePassword(), useLanguageSync() (+20 more)

### Community 53 - "parseJsonResponse"
Cohesion: 0.27
Nodes (16): useBets(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets(), mapBetFromApi() (+8 more)

### Community 54 - "src/index.ts"
Cohesion: 0.16
Nodes (25): deleteContextToken(), fetchActivations(), fetchFreshToken(), heartbeat(), pushContextToken(), AccountRuntime, Credential, discoverLocalAccounts() (+17 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.20
Nodes (17): buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint(), cborText() (+9 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.12
Nodes (32): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Metric(), Pick, PickClv (+24 more)

### Community 59 - "sync.ts"
Cohesion: 0.14
Nodes (23): Activation, BettrackrConfig, extractImportKey(), HeartbeatPayload, KnownBet, knownBets(), parseActivations(), pushBets() (+15 more)

### Community 60 - "dataTransfer.ts"
Cohesion: 0.09
Nodes (22): combineClosingOdds(), validClosingOdd(), CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata() (+14 more)

### Community 62 - "betclicOdds.ts"
Cohesion: 0.16
Nodes (20): collectMarkets(), collectSelectionOdds(), FairOdd, findKickoffUtc(), kickoffMs(), lisbonOffsetMs(), lisbonToUtcMs(), Market (+12 more)

### Community 63 - "clv-agent.ts"
Cohesion: 0.20
Nodes (19): betclicPath(), bettrackr(), correr(), descobrirJogos(), dorme(), hojeEmLisboa(), lerCategorias(), lerJogo() (+11 more)

### Community 64 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (16): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+8 more)

### Community 65 - "MobileAdmin.tsx"
Cohesion: 0.05
Nodes (89): clvAgentSilent(), lastCaptureRun(), AdminDashboard(), AdminDashboardProps, DeleteDialog(), Dialog(), GrantDialog(), Metric() (+81 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.09
Nodes (22): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+14 more)

### Community 68 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.23
Nodes (8): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), resolveBotAlert(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 84 - "App.tsx"
Cohesion: 0.11
Nodes (30): App(), AppProps, DesktopApp, MobileApp, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, detectLanguage() (+22 more)

### Community 86 - "isNativeApp"
Cohesion: 0.06
Nodes (53): @capacitor/core, @capacitor/push-notifications, @capgo/capacitor-updater, INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard() (+45 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.22
Nodes (14): stripe, accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf() (+6 more)

### Community 89 - "gen-icons.mjs"
Cohesion: 0.18
Nodes (4): base, master, png(), repoRoot

### Community 91 - "atualizar-bot.sh"
Cohesion: 0.38
Nodes (11): aviso(), buscar(), correr(), diz(), erro(), expande(), ficheiros_de(), sem_horario() (+3 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.16
Nodes (11): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), bcryptjs, getJwtSecret() (+3 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 96 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 97 - "make-admin.mjs"
Cohesion: 0.18
Nodes (8): pg, botuser, founder, isLocalDb, pool, remove, client, sql

### Community 99 - "BetclicImport.tsx"
Cohesion: 0.24
Nodes (11): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+3 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.15
Nodes (27): BetsManager(), Dashboard(), DashboardBetsFilters, FilterDropdown(), FiltersBar(), calendarDaysFor(), EMPTY_TIMEFRAME_FILTER, formatDateKey() (+19 more)

### Community 102 - "apiError"
Cohesion: 0.21
Nodes (20): useBankroll(), apiError, parseJsonResponse(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi() (+12 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 111 - "bankrollRoutes.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 112 - "LongPressController"
Cohesion: 0.20
Nodes (4): createLongPressController(), LongPressController, LongPressOptions, TimerHandle

### Community 115 - "useAccounts.ts"
Cohesion: 0.53
Nodes (7): useAccounts(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount()

### Community 118 - "betclicGrpc.ts"
Cohesion: 0.21
Nodes (15): lerCategoria(), bytesDe(), cabecalhosDaPagina(), Campo, campos(), campoTexto(), comoSelecao(), GRPC_HEADERS (+7 more)

### Community 133 - "MobileDashboard.tsx"
Cohesion: 0.11
Nodes (27): recharts, ClosingOddsModal(), describeLeg(), legKey(), ClvLockPanel(), ClvLockProps, ClosingOddsSheet(), describeLeg() (+19 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.13
Nodes (22): @capacitor/app, BackEntry, push(), remove(), runTopBackHandler(), stack, useBackHandler(), exitNativeApp() (+14 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.35
Nodes (10): aviso(), correr(), diz(), erro(), expande(), log_de(), log_em(), sem_horario() (+2 more)

### Community 142 - "haptics.ts"
Cohesion: 0.12
Nodes (18): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), FAB(), FABProps (+10 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "index.tsx"
Cohesion: 0.09
Nodes (30): ErrorBoundary, Props, State, storedLanguage(), AllSourcesImportResult, BookmakerImportResult, LocalizedError, ImportResult (+22 more)

### Community 195 - "vercel.json"
Cohesion: 0.22
Nodes (8): builds, crons, test, git, deploymentEnabled, regions, routes, version

### Community 210 - "package.json"
Cohesion: 0.08
Nodes (25): description, name, private, type, version, adm-zip, @capacitor/android, @capacitor/filesystem (+17 more)

### Community 218 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

## Knowledge Gaps
- **41 isolated node(s):** `RFC-8152`, `@capacitor/android`, `@capacitor/keyboard`, `@types/bun`, `@types/express` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Bet`, `MobileDashboard.tsx`, `MobileApp.tsx`, `types.ts`, `haptics.ts`, `MobileBets.tsx`, `ref_node_fs`, `authApi.ts`, `DesktopApp.tsx`, `MobileImport.tsx`, `Settings.tsx`, `parseJsonResponse`, `index.tsx`, `MobileInsights.tsx`, `MobileSocial.tsx`, `MobileAdmin.tsx`, `package.json`, `App.tsx`, `isNativeApp`, `BetclicImport.tsx`, `BetsManager.tsx`, `apiError`, `useAccounts.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `RFC-8152`, `@capacitor/android`, `@capacitor/keyboard` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bet` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Why does `express` connect `server.ts` to `AuthenticatedRequest`, `insightsRoutes.ts`, `botRoutes.ts`, `bankrollRoutes.ts`, `clvRoutes.ts`, `package.json`, `billingRoutes.ts`, `adminRoutes.ts`, `authMiddleware.ts`, `betsRoutes.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `Bet`, `MobileAdmin.tsx`, `MobileSocial.tsx`, `BetclicImport.tsx`, `MobileDashboard.tsx`, `BetsManager.tsx`, `MobileApp.tsx`, `types.ts`, `haptics.ts`, `DesktopApp.tsx`, `MobileBets.tsx`, `package.json`, `MobileImport.tsx`, `Settings.tsx`, `App.tsx`, `isNativeApp`, `MobileInsights.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._