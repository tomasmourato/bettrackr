# Graph Report - sport-duplicates-competition-tags-b117bf  (2026-10-24)

## Corpus Check
- 288 files · ~319,728 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2015 nodes · 5043 edges · 163 communities (89 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f2efc14`
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
- botWatch.ts
- marco0.ts
- types.ts
- clvRoutes.ts
- MobileBets.tsx
- Bookmaker Import Actions
- inject-betano.js
- BetsManager.tsx
- Sports Betting Analytics
- BetTrackr PWA Icon
- mapper-solverde.js
- inject.js
- bettrackr-identity.js
- adminRoutes.ts
- content-bettrackr.js
- FilteredBetsSummary.tsx
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
- TFn
- vault.ts
- BotPanel.tsx
- AdminDashboard.tsx
- settingsApi.ts
- parseJsonResponse
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- liveUpdate.ts
- MobileInsights.tsx
- sync.ts
- dataTransfer.ts
- useI18n
- betclicOdds.ts
- clv-agent.ts
- authFetch
- adminApi.ts
- O bot completo (Metade A)
- NotificationsPanel.tsx
- compilerOptions
- BetsManager
- botRoutes.ts
- src/lib/push.ts
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
- billingApi.ts
- isNativeApp
- billingRoutes.ts
- apiBase.ts
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
- Dashboard.tsx
- bankrollApi.ts
- safeNum
- useNativeChrome.ts
- initialData.ts
- @capacitor/android
- closing-odds.js
- bankrollRoutes.ts
- LongPressController
- @capacitor/app
- @capacitor/haptics
- useAccounts.ts
- @capacitor/share
- @capgo/capacitor-updater
- betclicGrpc.ts
- daily_insights
- @google/genai
- ClosingOddsSheet.tsx
- jsonwebtoken
- lucide-react
- MobileDashboard.tsx
- react
- religar-bot.sh
- haptics.ts
- bookie_accounts
- ref_node_assert
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
5. `Bet` - 58 edges
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
- `BetsManager()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvClosingOdds.ts
- `useBetForm()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/hooks/useBetForm.ts → lib/clvClosingOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (163 total, 44 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.10
Nodes (41): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, ClosingOddsModalProps (+33 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (50): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+42 more)

### Community 2 - "clvVisibility.ts"
Cohesion: 0.38
Nodes (4): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv()

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (31): bcryptjs, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/keyboard, @capacitor/push-notifications, @capacitor/splash-screen, @capacitor/status-bar (+23 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): @capacitor/cli, esbuild, devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss, @tailwindcss/vite (+27 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.06
Nodes (78): betClv(), betClvAtTakenPrice(), betClvNoVig(), ClvBet, ClvBetResult, clvDuplicateKey(), clvEntre(), ClvSelection (+70 more)

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

### Community 12 - "botWatch.ts"
Cohesion: 0.10
Nodes (34): alertTabFor(), BotActivity, botAlertText(), CLV_AGENT_FAILING_AFTER_MS, CLV_ALERT_KIND, clvAgentAlertText(), ClvWatchSummary, formatDuration() (+26 more)

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (31): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+23 more)

### Community 14 - "types.ts"
Cohesion: 0.10
Nodes (40): ScreenshotImporter(), ScreenshotImporterProps, FormSelection, nowLocal(), useBetForm(), messageOf(), combineFormOdds(), FormSelectionRow (+32 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.10
Nodes (29): betclicMatchPath(), devig(), leadMinutesFrom(), asArray(), BetRow, CAPTURE_CUTOFF_MIN, CAPTURE_WINDOW_MIN, curaDeHorario() (+21 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.09
Nodes (20): ClvLockInline(), ClvLockPanel(), ClvLockProps, BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS (+12 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "BetsManager.tsx"
Cohesion: 0.18
Nodes (10): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FiltersBar(), FiltersBarProps, useUrlFilterSync(), UseUrlFilterSyncOptions (+2 more)

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
Nodes (25): accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff() (+17 more)

### Community 27 - "FilteredBetsSummary.tsx"
Cohesion: 0.21
Nodes (6): ref_node_test, FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), calculateFilteredBetsSummary(), EXPECTED_PT

### Community 28 - "server.ts"
Cohesion: 0.09
Nodes (15): Bucket, rateLimit(), ref_node_child_process, ref_node_util, router, router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES (+7 more)

### Community 29 - "importers.test.js"
Cohesion: 0.22
Nodes (13): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+5 more)

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
Cohesion: 0.24
Nodes (16): runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet() (+8 more)

### Community 37 - "authApi.ts"
Cohesion: 0.14
Nodes (20): AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl(), AuthError (+12 more)

### Community 48 - "TFn"
Cohesion: 0.36
Nodes (6): AccountPanelProps, I18nValue, TFn, UserSettings, AccountSheetProps, Language

### Community 49 - "vault.ts"
Cohesion: 0.23
Nodes (12): decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), saveVault(), SessionState, VaultContents (+4 more)

### Community 50 - "BotPanel.tsx"
Cohesion: 0.14
Nodes (18): clvAgentSilent(), lastCaptureRun(), ActivationCard(), BotMode, BotPanel(), isBetclic(), loadHiddenAccounts(), saveHiddenAccounts() (+10 more)

### Community 51 - "AdminDashboard.tsx"
Cohesion: 0.16
Nodes (16): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), AdminDashboard (+8 more)

### Community 52 - "settingsApi.ts"
Cohesion: 0.44
Nodes (7): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateEnabledBookmakers(), updateLanguage()

### Community 53 - "parseJsonResponse"
Cohesion: 0.27
Nodes (18): useBets(), fetchMemberBets(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet() (+10 more)

### Community 54 - "src/index.ts"
Cohesion: 0.16
Nodes (25): deleteContextToken(), fetchActivations(), fetchFreshToken(), heartbeat(), pushContextToken(), AccountRuntime, Credential, discoverLocalAccounts() (+17 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.18
Nodes (20): AssertionResult, buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint() (+12 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 57 - "liveUpdate.ts"
Cohesion: 0.14
Nodes (8): ErrorBoundary, Props, State, storedLanguage(), initLiveUpdate(), procurarAtualizacao(), VersaoRemota, hideSplashScreen()

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.11
Nodes (29): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, PickClv, toneClasses() (+21 more)

### Community 59 - "sync.ts"
Cohesion: 0.12
Nodes (26): fetchBetclicBets(), FetchBetsOptions, fetchPage(), Activation, BettrackrConfig, extractImportKey(), HeartbeatPayload, KnownBet (+18 more)

### Community 60 - "dataTransfer.ts"
Cohesion: 0.11
Nodes (21): Settings(), LocalizedError, BANKROLL_KINDS, buildBetsCSV(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), importBetsFromFile() (+13 more)

### Community 61 - "useI18n"
Cohesion: 0.16
Nodes (17): ActivationBadge(), ClvAgentStaleBanner(), ClvRunRow(), RunCard(), RunList(), RunRow(), useRunFormat(), BotAlertBanner() (+9 more)

### Community 62 - "betclicOdds.ts"
Cohesion: 0.15
Nodes (20): collectMarkets(), collectSelectionOdds(), FairOdd, findCompetition(), findKickoffUtc(), findMatchNode(), kickoffMs(), lisbonOffsetMs() (+12 more)

### Community 63 - "clv-agent.ts"
Cohesion: 0.19
Nodes (21): betclicPath(), bettrackr(), correr(), descobrirJogos(), dorme(), hojeEmLisboa(), lerCategorias(), lerJogo() (+13 more)

### Community 64 - "authFetch"
Cohesion: 0.30
Nodes (18): Social(), SocialProps, apiError, authFetch(), registerPushDevice(), unregisterPushDevice(), acceptFriendRequest(), fetchFriendBets() (+10 more)

### Community 65 - "adminApi.ts"
Cohesion: 0.23
Nodes (19): useAdminPanel(), AdminAuditEntry, AdminOverview, AdminUser, AdminUserFilter, AdminUsersPage, call(), deleteUser() (+11 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.09
Nodes (22): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+14 more)

### Community 67 - "NotificationsPanel.tsx"
Cohesion: 0.17
Nodes (15): BOT_STALL_KEYS, CARD, NotificationsMode, NotificationsPanel(), STALL_KEYS, StallKeys, NotificationsState, useNotifications() (+7 more)

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 69 - "BetsManager"
Cohesion: 0.27
Nodes (12): chave(), normalizeSport(), POR_CHAVE, SPORT_ALIASES, BetsManager(), hasBetsWithoutSport(), lacksSport(), listSports() (+4 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.25
Nodes (7): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), router, ORIG

### Community 71 - "src/lib/push.ts"
Cohesion: 0.23
Nodes (8): PushStatus(), usePushNotifications(), getPushPermission(), loadPlugin(), PUSH_RECEIVED_EVENT, PushPermission, startPush(), StartPushOptions

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 84 - "App.tsx"
Cohesion: 0.07
Nodes (39): App(), AppProps, DesktopApp, AccountPanel(), BrandMark(), BetsManager, BotPanel, Dashboard (+31 more)

### Community 85 - "billingApi.ts"
Cohesion: 0.36
Nodes (7): ERROR_KEYS, AccessSource, BillingError, goToStripe(), openBillingPortal(), requestUrl(), startCheckout()

### Community 86 - "isNativeApp"
Cohesion: 0.18
Nodes (20): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, useBillingActions() (+12 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.24
Nodes (13): accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf(), priceOf() (+5 more)

### Community 88 - "apiBase.ts"
Cohesion: 0.29
Nodes (7): API_BASE, configured, UPDATE_BASES, readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

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
Cohesion: 0.09
Nodes (15): AccessRequest, AuthenticatedRequest, authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest() (+7 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.15
Nodes (13): BET_SELECT_COLUMNS, asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload (+5 more)

### Community 96 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "BetclicImport.tsx"
Cohesion: 0.13
Nodes (20): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+12 more)

### Community 101 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (24): ref_bun_test, FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER, formatDateKey(), fromLocalDateKey() (+16 more)

### Community 102 - "bankrollApi.ts"
Cohesion: 0.44
Nodes (8): useBankroll(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi(), updateMovement(), VALID_KINDS

### Community 104 - "safeNum"
Cohesion: 0.36
Nodes (8): Dashboard(), MemberProfile(), MemberProfileProps, statusMeta(), MobileDashboard(), toKey(), calculateDashboardStats(), safeNum()

### Community 105 - "useNativeChrome.ts"
Cohesion: 0.40
Nodes (3): setThemeColorMeta(), useAndroidBackButton(), useNativeChrome()

### Community 107 - "initialData.ts"
Cohesion: 0.50
Nodes (4): InitialAppData, Window, CurrentUser, StoredUser

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
Nodes (15): lerCategoria(), bytesDe(), Campo, campos(), campoTexto(), categoriasDaPagina(), comoSelecao(), GRPC_HEADERS (+7 more)

### Community 133 - "ClosingOddsSheet.tsx"
Cohesion: 0.33
Nodes (7): ClosingOddsModal(), describeLeg(), legKey(), ClosingOddsSheet(), describeLeg(), legKey(), parseDecimal()

### Community 137 - "MobileDashboard.tsx"
Cohesion: 0.07
Nodes (45): MobileApp, AccountSheet(), MobileDashboard, MobileMemberProfile(), statusMeta(), BackEntry, push(), remove() (+37 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.35
Nodes (10): aviso(), correr(), diz(), erro(), expande(), log_de(), log_em(), sem_horario() (+2 more)

### Community 142 - "haptics.ts"
Cohesion: 0.09
Nodes (25): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), FAB(), FABProps (+17 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "index.tsx"
Cohesion: 0.20
Nodes (19): EN, buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate() (+11 more)

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
- **502 isolated node(s):** `Trabalho`, `Tipo`, `Relatorio`, `LISTAGENS`, `KEY_FILE` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 690 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useI18n()` connect `useI18n` to `Settings.tsx`, `ClosingOddsSheet.tsx`, `MobileDashboard.tsx`, `types.ts`, `MobileBets.tsx`, `BetsManager.tsx`, `FilteredBetsSummary.tsx`, `authApi.ts`, `BotPanel.tsx`, `AdminDashboard.tsx`, `index.tsx`, `MobileInsights.tsx`, `dataTransfer.ts`, `authFetch`, `adminApi.ts`, `NotificationsPanel.tsx`, `BetsManager`, `src/lib/push.ts`, `billingApi.ts`, `isNativeApp`, `BetclicImport.tsx`, `Dashboard.tsx`, `safeNum`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Bet` connect `Settings.tsx` to `authFetch`, `adminApi.ts`, `Dashboard.tsx`, `ClosingOddsSheet.tsx`, `insightsRoutes.ts`, `safeNum`, `BetsManager`, `MobileDashboard.tsx`, `initialData.ts`, `types.ts`, `MobileBets.tsx`, `BetsManager.tsx`, `AdminDashboard.tsx`, `App.tsx`, `parseJsonResponse`, `FilteredBetsSummary.tsx`, `dataTransfer.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `combineClosingOdds()` connect `clvRoutes.ts` to `insightsRoutes.ts`, `BetsManager`, `types.ts`, `BetsManager.tsx`, `parseJsonResponse`, `dataTransfer.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `Trabalho`, `Tipo`, `Relatorio` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10122448979591837 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._