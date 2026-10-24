# Graph Report - bot-clv-vps-portugal-63ef3b  (2026-10-24)

## Corpus Check
- 284 files · ~320,252 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2010 nodes · 4980 edges · 153 communities (79 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f2efc14`
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
- BetsManager.tsx
- clvRoutes.ts
- MobileBets.tsx
- Bookmaker Import Actions
- inject-betano.js
- Pressable
- Sports Betting Analytics
- BetTrackr PWA Icon
- mapper-solverde.js
- inject.js
- bettrackr-identity.js
- adminRoutes.ts
- content-bettrackr.js
- types.ts
- server.ts
- importers.test.js
- users
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
- No Embedded Session Credentials
- Automated Access Terms Limitation
- apiError.ts
- vault.ts
- safeNum
- ui/index.ts
- Settings.tsx
- parseJsonResponse
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- instalar.sh
- MobileInsights.tsx
- sync.ts
- dataTransfer.ts
- betStatus.ts
- betclicOdds.ts
- clv-agent.ts
- MobileSocial.tsx
- useI18n
- O bot completo (Metade A)
- messageOf
- compilerOptions
- @capacitor/android
- botRoutes.ts
- @capacitor/app
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
- BetTrackr Product Backlog
- App.tsx
- @capacitor/haptics
- isNativeApp
- billingRoutes.ts
- @capacitor/share
- gen-icons.mjs
- ExampleInstrumentedTest.java
- atualizar-bot.sh
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- @capgo/capacitor-updater
- make-admin.mjs
- AGENTS.md
- BetclicImport.tsx
- Dashboard.tsx
- authFetch
- @google/genai
- jsonwebtoken
- lucide-react
- react
- closing-odds.js
- bankrollRoutes.ts
- LongPressController
- bookie_accounts
- betclicGrpc.ts
- daily_insights
- ref_node_assert
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
- gradlew
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 105 edges
2. `authFetch()` - 65 edges
3. `parseJsonResponse()` - 63 edges
4. `apiError` - 62 edges
5. `Bet` - 56 edges
6. `isNativeApp()` - 40 edges
7. `messageOf()` - 39 edges
8. `TKey` - 33 edges
9. `safeNum()` - 31 edges
10. `App()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `lerJogo()` --calls--> `readMatchPage()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `lerCategorias()` --calls--> `categoriasDaPagina()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicGrpc.ts
- `fetchMatch()` --calls--> `readMatchPage()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/betclicOdds.ts
- `BotPanel()` --calls--> `lastCaptureRun()`  [EXTRACTED]
  src/components/BotPanel.tsx → lib/clvAgentHealth.ts
- `BotPanel()` --calls--> `clvAgentSilent()`  [EXTRACTED]
  src/components/BotPanel.tsx → lib/clvAgentHealth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (153 total, 45 thin omitted)

### Community 0 - "Bet"
Cohesion: 0.16
Nodes (19): BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, ClosingOddsModal(), ClosingOddsModalProps, describeLeg(), legKey(), DashboardProps (+11 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (53): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+45 more)

### Community 2 - "AuthenticatedRequest"
Cohesion: 0.21
Nodes (8): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), AccessState, AccessRequest, AuthenticatedRequest, router

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (31): bcryptjs, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/keyboard, @capacitor/push-notifications, @capacitor/splash-screen, @capacitor/status-bar (+23 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): @capacitor/cli, esbuild, devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss, @tailwindcss/vite (+27 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.06
Nodes (77): betClv(), betClvAtTakenPrice(), betClvNoVig(), ClvBet, ClvBetResult, clvDuplicateKey(), clvEntre(), ClvSelection (+69 more)

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

### Community 12 - "botWatch.ts"
Cohesion: 0.10
Nodes (34): alertTabFor(), BotActivity, botAlertText(), CLV_AGENT_FAILING_AFTER_MS, CLV_ALERT_KIND, clvAgentAlertText(), ClvWatchSummary, formatDuration() (+26 more)

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (31): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+23 more)

### Community 14 - "BetsManager.tsx"
Cohesion: 0.11
Nodes (27): ref_node_test, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FormSelection, nowLocal() (+19 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.10
Nodes (30): betclicMatchPath(), devig(), leadMinutesFrom(), resolveClvAgentAlert(), asArray(), BetRow, CAPTURE_CUTOFF_MIN, CAPTURE_WINDOW_MIN (+22 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.10
Nodes (21): ClvLockInline(), ClvLockPanel(), ClvLockProps, BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS (+13 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "Pressable"
Cohesion: 0.18
Nodes (11): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, Pressable() (+3 more)

### Community 20 - "Sports Betting Analytics"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "BetTrackr PWA Icon"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 23 - "inject.js"
Cohesion: 0.32
Nodes (4): looksLikeBetsApi(), looksLikeIdentityApi(), report(), sniffIdentity()

### Community 24 - "bettrackr-identity.js"
Cohesion: 0.46
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 25 - "adminRoutes.ts"
Cohesion: 0.12
Nodes (24): accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff(), loadAccess() (+16 more)

### Community 27 - "types.ts"
Cohesion: 0.14
Nodes (20): FilteredBetsSummary(), AiChip(), ScreenshotImporter, AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName(), BOOKMAKERS, matchBookmaker() (+12 more)

### Community 28 - "server.ts"
Cohesion: 0.09
Nodes (14): Bucket, rateLimit(), ref_node_child_process, ref_node_util, router, router, router, client (+6 more)

### Community 29 - "importers.test.js"
Cohesion: 0.16
Nodes (17): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+9 more)

### Community 30 - "users"
Cohesion: 0.11
Nodes (18): friendships, bookie_accounts, admin_audit_log, subscriptions, bankroll_movements, bookie_accounts, bot_runs, bot_context_tokens (+10 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.08
Nodes (23): ref_node_fs, ref_node_path, ref_node_url, distDir, EXCLUDE, root, versionFile, zipFile (+15 more)

### Community 36 - "mapper-betano.js"
Cohesion: 0.28
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "authApi.ts"
Cohesion: 0.21
Nodes (14): AuthPage(), handleSubmit(), AuthPageProps, Mode, apiUrl(), AuthError, changePassword(), getToken() (+6 more)

### Community 48 - "apiError.ts"
Cohesion: 0.14
Nodes (16): PushStatus(), usePushNotifications(), BotStallState, ClvAgentStalledData, fetchNotifications(), markNotificationsRead(), NotificationsPage, registerPushDevice() (+8 more)

### Community 49 - "vault.ts"
Cohesion: 0.23
Nodes (12): decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), saveVault(), SessionState, VaultContents (+4 more)

### Community 50 - "safeNum"
Cohesion: 0.18
Nodes (14): Dashboard(), MemberProfile(), MemberProfileProps, statusMeta(), calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf() (+6 more)

### Community 51 - "ui/index.ts"
Cohesion: 0.20
Nodes (11): selectionHaptic(), ChipGroup(), ChipGroupProps, ChipOption, FilterChips(), FilterChipsProps, PullToRefresh(), PullToRefreshProps (+3 more)

### Community 52 - "Settings.tsx"
Cohesion: 0.12
Nodes (37): BankrollCard(), BankrollCardProps, KINDS, todayKey(), PasswordCard(), PasswordCardProps, Settings(), SettingsProps (+29 more)

### Community 53 - "parseJsonResponse"
Cohesion: 0.29
Nodes (17): useBets(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets() (+9 more)

### Community 54 - "src/index.ts"
Cohesion: 0.17
Nodes (24): deleteContextToken(), fetchFreshToken(), heartbeat(), pushContextToken(), AccountRuntime, Credential, discoverLocalAccounts(), enrolAndSave() (+16 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.18
Nodes (20): AssertionResult, buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint() (+12 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 57 - "instalar.sh"
Cohesion: 0.34
Nodes (13): aviso(), correr(), DEBIAN_FRONTEND, diz(), erro(), instalar_programa(), pedir_segredo(), servico_agente() (+5 more)

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.13
Nodes (26): AIInsights(), AIInsightsProps, AiProgress(), InsightsResponse, Pick, PickClv, toneClasses(), evalStepsFor() (+18 more)

### Community 59 - "sync.ts"
Cohesion: 0.13
Nodes (25): fetchBetclicBets(), FetchBetsOptions, fetchPage(), Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload (+17 more)

### Community 60 - "dataTransfer.ts"
Cohesion: 0.12
Nodes (14): ref_bun_test, BANKROLL_KINDS, buildBetsCSV(), importBetsFromFile(), ImportResult, parseCSVRow(), sanitizeBankrollMovements(), Importado (+6 more)

### Community 61 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 62 - "betclicOdds.ts"
Cohesion: 0.16
Nodes (18): collectMarkets(), collectSelectionOdds(), FairOdd, findKickoffUtc(), kickoffMs(), lisbonOffsetMs(), lisbonToUtcMs(), Market (+10 more)

### Community 63 - "clv-agent.ts"
Cohesion: 0.19
Nodes (21): betclicPath(), bettrackr(), correr(), descobrirJogos(), dorme(), hojeEmLisboa(), lerCategorias(), lerJogo() (+13 more)

### Community 64 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (15): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+7 more)

### Community 65 - "useI18n"
Cohesion: 0.05
Nodes (74): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), ConfidenceDots() (+66 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.08
Nodes (23): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+15 more)

### Community 67 - "messageOf"
Cohesion: 0.60
Nodes (4): ScreenshotImporter(), useSubscription(), messageOf(), fetchBillingStatus()

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.23
Nodes (8): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), resolveBotAlert(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 84 - "App.tsx"
Cohesion: 0.07
Nodes (41): App(), AppProps, DesktopApp, BrandMark(), AdminDashboard, AIInsights, BetsManager, BotPanel (+33 more)

### Community 86 - "isNativeApp"
Cohesion: 0.08
Nodes (40): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, ERROR_KEYS (+32 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.24
Nodes (13): accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf(), priceOf() (+5 more)

### Community 89 - "gen-icons.mjs"
Cohesion: 0.18
Nodes (8): ref_fs, ref_path, ref_png_to_ico, ref_sharp, ref_url, base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.24
Nodes (8): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, assert, context, instrumentationregistry, org.junit.runner.RunWith, org.junit.Test

### Community 91 - "atualizar-bot.sh"
Cohesion: 0.38
Nodes (11): aviso(), buscar(), correr(), diz(), erro(), expande(), ficheiros_de(), sem_horario() (+3 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.10
Nodes (14): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+6 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "BetclicImport.tsx"
Cohesion: 0.23
Nodes (11): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+3 more)

### Community 101 - "Dashboard.tsx"
Cohesion: 0.12
Nodes (26): DashboardBetsFilters, FilterDropdown(), FilterDropdownOption, FilterDropdownProps, FiltersBar(), FiltersBarProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER (+18 more)

### Community 102 - "authFetch"
Cohesion: 0.20
Nodes (22): ActivationCard(), useAccounts(), useBankroll(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi() (+14 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 111 - "bankrollRoutes.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 118 - "betclicGrpc.ts"
Cohesion: 0.21
Nodes (15): lerCategoria(), bytesDe(), Campo, campos(), campoTexto(), categoriasDaPagina(), comoSelecao(), GRPC_HEADERS (+7 more)

### Community 133 - "MobileDashboard.tsx"
Cohesion: 0.11
Nodes (19): ClosingOddsSheet(), describeLeg(), legKey(), MobileDashboard, MobileMemberProfile(), statusMeta(), MobileDashboard(), MONEY_OPTIONS (+11 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.14
Nodes (14): MobileApp, runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin, MobileBets (+6 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.35
Nodes (10): aviso(), correr(), diz(), erro(), expande(), log_de(), log_em(), sem_horario() (+2 more)

### Community 142 - "haptics.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), tapHaptic(), FAB(), FABProps, Segment (+9 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "index.tsx"
Cohesion: 0.07
Nodes (44): AccountPanel(), AccountPanelProps, ErrorBoundary, Props, State, storedLanguage(), AllSourcesImportResult, BookmakerImportResult (+36 more)

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
- **503 isolated node(s):** `Trabalho`, `Tipo`, `Relatorio`, `LISTAGENS`, `KEY_FILE` (+498 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 687 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Bet` connect `Bet` to `MobileSocial.tsx`, `useI18n`, `Dashboard.tsx`, `insightsRoutes.ts`, `MobileDashboard.tsx`, `BetsManager.tsx`, `MobileBets.tsx`, `safeNum`, `App.tsx`, `Settings.tsx`, `parseJsonResponse`, `types.ts`, `dataTransfer.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `Bet`, `MobileSocial.tsx`, `BetclicImport.tsx`, `messageOf`, `authApi.ts`, `authFetch`, `Dashboard.tsx`, `MobileDashboard.tsx`, `BetsManager.tsx`, `MobileBets.tsx`, `apiError.ts`, `safeNum`, `Settings.tsx`, `isNativeApp`, `index.tsx`, `MobileInsights.tsx`, `types.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `combineClosingOdds()` connect `clvRoutes.ts` to `insightsRoutes.ts`, `dataTransfer.ts`, `parseJsonResponse`, `BetsManager.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `Trabalho`, `Tipo`, `Relatorio` to the rest of the system?**
  _503 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._