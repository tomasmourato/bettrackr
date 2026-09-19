# Graph Report - bettrackr  (2026-09-19)

## Corpus Check
- 281 files · ~311,244 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1952 nodes · 4809 edges · 161 communities (84 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72030b27`
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
- botWatch.ts
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
- billingApi.ts
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
- i18n-labels.test.ts
- @types/react
- typescript
- vault.ts
- App.tsx
- parseJsonResponse
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- BotPanel.tsx
- MobileInsights.tsx
- sync.ts
- dataTransfer.ts
- Language
- betclicOdds.ts
- clv-agent.ts
- MobileSocial.tsx
- MobileAdmin.tsx
- O bot completo (Metade A)
- isNativeApp
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
- BetTrackr Product Backlog
- navigation.ts
- ErrorBoundary.tsx
- MobileSubscription.tsx
- billingRoutes.ts
- bundle-app.mjs
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
- useI18n
- BetsManager.tsx
- authFetch
- tailwindcss
- @types/jsonwebtoken
- ui/index.ts
- @vitejs/plugin-react
- closing-odds.js
- bankrollRoutes.ts
- LongPressController
- messageOf
- betclicGrpc.ts
- daily_insights
- betStatus.ts
- Bet
- esbuild
- MobileApp.tsx
- MobileImport.tsx
- src/lib/push.ts
- religar-bot.sh
- @types/express
- haptics.ts
- bookie_accounts
- run-migration.mjs
- 026_clv_agent_runs.sql
- @tailwindcss/vite
- 020_daily_odds.sql
- scripts
- index.tsx
- vercel.json
- package.json
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- gradlew
- CLAUDE.md
- vite

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 104 edges
2. `authFetch()` - 65 edges
3. `parseJsonResponse()` - 63 edges
4. `apiError` - 62 edges
5. `Bet` - 56 edges
6. `isNativeApp()` - 40 edges
7. `messageOf()` - 39 edges
8. `TKey` - 31 edges
9. `safeNum()` - 31 edges
10. `App()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `runImport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  test/app/bankroll-backup.test.ts → src/lib/dataTransfer.ts
- `reimport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  test/app/csv-closing-odds.test.ts → src/lib/dataTransfer.ts
- `lerJogo()` --calls--> `readMatchPage()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `lerCategorias()` --calls--> `parseNgState()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `descobrirJogos()` --calls--> `parseNgState()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (161 total, 48 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.10
Nodes (35): BankrollCard(), BankrollCardProps, KINDS, todayKey(), EXTENSION_BOOKIES, EnabledBookmakersCard(), EnabledBookmakersCardProps, Settings() (+27 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (53): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+45 more)

### Community 2 - "AuthenticatedRequest"
Cohesion: 0.19
Nodes (9): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), AccessState, AccessRequest, attachAccess(), AuthenticatedRequest (+1 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (49): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+41 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, adm-zip, tsx, @types/node, @types/pg, @types/react-dom, vite-plugin-pwa, adm-zip (+5 more)

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
Cohesion: 0.13
Nodes (25): alertTabFor(), BotActivity, botAlertText(), formatDuration(), Lang, pushBotAlert(), resolveBotAlert(), runBotWatch() (+17 more)

### Community 13 - "marco0.ts"
Cohesion: 0.12
Nodes (33): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), KEY_FILE, load(), save() (+25 more)

### Community 14 - "types.ts"
Cohesion: 0.12
Nodes (24): combineClosingOdds(), BetsManager(), ClosingOddsModal(), ClosingOddsModalProps, describeLeg(), legKey(), FilteredBetsSummary(), FormSelection (+16 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.10
Nodes (29): betclicMatchPath(), devig(), kickoffMs(), leadMinutesFrom(), asArray(), BetRow, CAPTURE_CUTOFF_MIN, CAPTURE_WINDOW_MIN (+21 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.08
Nodes (24): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, createLongPressController(), LongPressOptions, TimerHandle, BULK_MONEY_OPTIONS (+16 more)

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
Cohesion: 0.13
Nodes (23): accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff(), loadAccess() (+15 more)

### Community 27 - "billingApi.ts"
Cohesion: 0.29
Nodes (10): INCLUDED, PaywallNotice(), ERROR_KEYS, useBillingActions(), AccessSource, BillingError, goToStripe(), openBillingPortal() (+2 more)

### Community 28 - "server.ts"
Cohesion: 0.07
Nodes (17): connect(), getPool(), query(), Bucket, rateLimit(), router, router, router (+9 more)

### Community 29 - "importers.test.js"
Cohesion: 0.14
Nodes (24): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+16 more)

### Community 30 - "users"
Cohesion: 0.11
Nodes (18): friendships, bookie_accounts, admin_audit_log, subscriptions, bankroll_movements, bookie_accounts, bot_runs, bot_context_tokens (+10 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.12
Nodes (11): appSources, en, errors, I18N_DIR, MIGRATED, pt, PT_WORD_RE, PT_WORDS (+3 more)

### Community 36 - "mapper-betano.js"
Cohesion: 0.28
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "authApi.ts"
Cohesion: 0.15
Nodes (20): AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl(), AuthError (+12 more)

### Community 51 - "vault.ts"
Cohesion: 0.21
Nodes (16): cmdVaultImport(), credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), loadSession(), loadVault(), readPassphrase() (+8 more)

### Community 52 - "App.tsx"
Cohesion: 0.15
Nodes (21): App(), AppProps, makeInitialLogs(), useAuditLog(), useLanguageSync(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences() (+13 more)

### Community 53 - "parseJsonResponse"
Cohesion: 0.29
Nodes (17): useBets(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets() (+9 more)

### Community 54 - "src/index.ts"
Cohesion: 0.18
Nodes (22): deleteContextToken(), fetchFreshToken(), heartbeat(), pushContextToken(), AccountRuntime, Credential, discoverLocalAccounts(), enrolAndSave() (+14 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.21
Nodes (17): buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint(), cborText() (+9 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 57 - "BotPanel.tsx"
Cohesion: 0.05
Nodes (46): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, importSummary(), InstallSteps(), loadAccountChoices(), ActivationBadge(), BotMode (+38 more)

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.10
Nodes (30): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, PickClv, toneClasses() (+22 more)

### Community 59 - "sync.ts"
Cohesion: 0.15
Nodes (22): Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload, KnownBet, knownBets(), parseActivations() (+14 more)

### Community 60 - "dataTransfer.ts"
Cohesion: 0.11
Nodes (16): LocalizedError, BANKROLL_KINDS, buildBetsCSV(), ImportResult, parseCSVRow(), sanitizeBankrollMovements(), TVars, TKey (+8 more)

### Community 61 - "Language"
Cohesion: 0.25
Nodes (7): AccountPanel(), AccountPanelProps, CurrentUser, I18nValue, UserSettings, AccountSheetProps, Language

### Community 62 - "betclicOdds.ts"
Cohesion: 0.16
Nodes (19): collectMarkets(), collectSelectionOdds(), FairOdd, findKickoffUtc(), lisbonOffsetMs(), lisbonToUtcMs(), Market, marketFrom() (+11 more)

### Community 63 - "clv-agent.ts"
Cohesion: 0.19
Nodes (20): betclicPath(), bettrackr(), correr(), descobrirJogos(), dorme(), hojeEmLisboa(), lerCategorias(), lerJogo() (+12 more)

### Community 64 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (15): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+7 more)

### Community 65 - "MobileAdmin.tsx"
Cohesion: 0.11
Nodes (41): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), NotificationsPanel() (+33 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.09
Nodes (21): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+13 more)

### Community 67 - "isNativeApp"
Cohesion: 0.18
Nodes (12): API_BASE, configured, isNativeApp(), UPDATE_BASES, initLiveUpdate(), procurarAtualizacao(), VersaoRemota, readOverride() (+4 more)

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.25
Nodes (7): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 84 - "navigation.ts"
Cohesion: 0.10
Nodes (21): DesktopApp, BrandMark(), AdminDashboard, BetsManager, BotPanel, Dashboard, DesktopApp(), ScreenshotImporter (+13 more)

### Community 85 - "ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, State, storedLanguage()

### Community 86 - "MobileSubscription.tsx"
Cohesion: 0.16
Nodes (17): PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, CheckoutOutcome, useCheckoutReturn(), BillingStatus (+9 more)

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

### Community 91 - "atualizar-bot.sh"
Cohesion: 0.38
Nodes (11): aviso(), buscar(), correr(), diz(), erro(), expande(), ficheiros_de(), sem_horario() (+3 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (10): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+2 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (12): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+4 more)

### Community 96 - "fetchSolverdeHistory"
Cohesion: 0.83
Nodes (3): addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "useI18n"
Cohesion: 0.20
Nodes (12): ClvLockInline(), ClvLockPanel(), ClvLockProps, FreebetAsterisk(), MemberProfile(), MemberProfileProps, statusMeta(), PasswordCard() (+4 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.10
Nodes (34): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps (+26 more)

### Community 102 - "authFetch"
Cohesion: 0.25
Nodes (15): ActivationCard(), useBankroll(), apiError, authFetch(), SessionExpiredError, ApiMovementRow, createMovement(), deleteMovement() (+7 more)

### Community 107 - "ui/index.ts"
Cohesion: 0.17
Nodes (16): tapHaptic(), FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps, ListGroup(), ListItem() (+8 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 111 - "bankrollRoutes.ts"
Cohesion: 0.25
Nodes (3): Kind, router, VALID_KINDS

### Community 115 - "messageOf"
Cohesion: 0.31
Nodes (11): useAccounts(), useSubscription(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount() (+3 more)

### Community 118 - "betclicGrpc.ts"
Cohesion: 0.22
Nodes (14): lerCategoria(), bytesDe(), Campo, campos(), campoTexto(), comoSelecao(), GRPC_HEADERS, GRPC_MATCH_URL (+6 more)

### Community 131 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 133 - "Bet"
Cohesion: 0.08
Nodes (34): BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, DashboardBetsFilters, DashboardProps, FilteredBetsSummaryProps, ScreenshotImporterProps, InitialAppData (+26 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (13): MobileApp, AccountSheet(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin (+5 more)

### Community 138 - "MobileImport.tsx"
Cohesion: 0.25
Nodes (16): ScreenshotImporter(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName(), BOOKMAKERS, defaultFreebetTypeFor(), matchBookmaker(), matchStatus() (+8 more)

### Community 139 - "src/lib/push.ts"
Cohesion: 0.19
Nodes (12): usePushNotifications(), BotStallState, fetchNotifications(), markNotificationsRead(), NotificationsPage, registerPushDevice(), unregisterPushDevice(), forgetPushDevice() (+4 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.46
Nodes (7): aviso(), diz(), erro(), expande(), log_em(), religar-bot.sh script, verde()

### Community 142 - "haptics.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "index.tsx"
Cohesion: 0.20
Nodes (18): EN, buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate() (+10 more)

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
- **494 isolated node(s):** `Trabalho`, `Tipo`, `Relatorio`, `LISTAGENS`, `KEY_FILE` (+489 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 666 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mapBetclicBets` connect `mapper.js` to `background.js`, `sync.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `combineClosingOdds()` connect `types.ts` to `Settings.tsx`, `insightsRoutes.ts`, `BetsManager.tsx`, `clvRoutes.ts`, `parseJsonResponse`, `dataTransfer.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `Bet` connect `Bet` to `Settings.tsx`, `MobileAdmin.tsx`, `MobileSocial.tsx`, `useI18n`, `BetsManager.tsx`, `insightsRoutes.ts`, `MobileImport.tsx`, `types.ts`, `MobileBets.tsx`, `App.tsx`, `parseJsonResponse`, `navigation.ts`, `dataTransfer.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `Trabalho`, `Tipo`, `Relatorio` to the rest of the system?**
  _494 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10465116279069768 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._