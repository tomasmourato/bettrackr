# Graph Report - bettrackr  (2026-10-19)

## Corpus Check
- 282 files · ~317,139 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .xml 12, (none) 4, .properties 2)

## Summary
- 1991 nodes · 5359 edges · 144 communities (86 shown, 58 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2f59a82`
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
- Toast.tsx
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
- ref_bun_test
- dataTransfer.ts
- useI18n
- parseJsonResponse
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- BetsManager.tsx
- MobileInsights.tsx
- sync.ts
- betStatus.ts
- main.tsx
- betclicOdds.ts
- clv-agent.ts
- MobileSocial.tsx
- MobileAdmin.tsx
- O bot completo (Metade A)
- ui/index.ts
- compilerOptions
- liveUpdate.ts
- botRoutes.ts
- useBetForm.ts
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
- react
- isNativeApp
- billingRoutes.ts
- settingsApi.ts
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
- bankrollApi.ts
- csv-closing-odds.test.ts
- platform.ts
- closing-odds.js
- LongPressController
- messageOf
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
- `reimport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  test/app/csv-closing-odds.test.ts → src/lib/dataTransfer.ts
- `lerJogo()` --calls--> `readMatchPage()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicOdds.ts
- `lerCategorias()` --calls--> `cabecalhosDaPagina()`  [EXTRACTED]
  agent/clv-agent.ts → lib/betclicGrpc.ts
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

## Communities (144 total, 58 thin omitted)

### Community 0 - "Bet"
Cohesion: 0.20
Nodes (15): BetclicImportProps, BetsManagerProps, BookieAccountsCardProps, ClosingOddsModalProps, DashboardProps, MemberProfileProps, ScreenshotImporterProps, MemberProfileData (+7 more)

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
Cohesion: 0.05
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
Cohesion: 0.05
Nodes (63): alertTabFor(), BotActivity, botAlertText(), CLV_AGENT_FAILING_AFTER_MS, CLV_ALERT_KIND, clvAgentAlertText(), ClvWatchSummary, formatDuration() (+55 more)

### Community 13 - "marco0.ts"
Cohesion: 0.11
Nodes (32): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), KEY_FILE, load(), save() (+24 more)

### Community 14 - "types.ts"
Cohesion: 0.17
Nodes (22): AiChip(), ScreenshotImporter(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName(), BOOKMAKERS, defaultFreebetTypeFor(), matchBookmaker() (+14 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.10
Nodes (30): betclicMatchPath(), devig(), leadMinutesFrom(), asArray(), BetRow, CAPTURE_CUTOFF_MIN, CAPTURE_WINDOW_MIN, curaDeHorario() (+22 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.11
Nodes (23): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, BulkAction(), CLV_OPTIONS (+15 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "Toast.tsx"
Cohesion: 0.29
Nodes (6): ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastState

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
Nodes (25): BET_SELECT_COLUMNS, accessFromRow(), AccessSource, asDate(), ENTITLED_SQL, hasBotAccess(), iso(), isStaff() (+17 more)

### Community 27 - "FilteredBetsSummary.tsx"
Cohesion: 0.36
Nodes (6): AnimatedMetricValue(), FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), calculateFilteredBetsSummary(), selectBetsForFinancialSummary()

### Community 28 - "server.ts"
Cohesion: 0.07
Nodes (15): Bucket, rateLimit(), dotenv, express, router, Kind, router, VALID_KINDS (+7 more)

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
Cohesion: 0.08
Nodes (21): distDir, EXCLUDE, root, versionFile, zipFile, appSources, collectSources(), en (+13 more)

### Community 35 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, start(), BUILD_TIME

### Community 36 - "mapper-betano.js"
Cohesion: 0.24
Nodes (16): runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet() (+8 more)

### Community 37 - "authApi.ts"
Cohesion: 0.12
Nodes (24): AppProps, AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH, InitialAppData (+16 more)

### Community 48 - "DesktopApp.tsx"
Cohesion: 0.17
Nodes (19): AccountPanel(), AccountPanelProps, DetailRow(), AdminDashboard, AIInsights, BetsManager, BotPanel, Dashboard (+11 more)

### Community 49 - "vault.ts"
Cohesion: 0.20
Nodes (14): cmdVaultImport(), credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), saveVault() (+6 more)

### Community 50 - "ref_bun_test"
Cohesion: 0.25
Nodes (5): needsClosingOdd(), ClosingOddsModal(), describeLeg(), legKey(), parseDecimal()

### Community 51 - "dataTransfer.ts"
Cohesion: 0.14
Nodes (15): LocalizedError, BANKROLL_KINDS, buildBetsCSV(), deliverTextFile(), exportBetsCSV(), importBetsFromFile(), ImportResult, parseCSVRow() (+7 more)

### Community 52 - "useI18n"
Cohesion: 0.14
Nodes (34): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BookieAccountsCard(), EnabledBookmakersCard(), EnabledBookmakersCardProps, PushStatus() (+26 more)

### Community 53 - "parseJsonResponse"
Cohesion: 0.21
Nodes (28): useBets(), apiError, authFetch(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets() (+20 more)

### Community 54 - "src/index.ts"
Cohesion: 0.16
Nodes (25): deleteContextToken(), fetchFreshToken(), heartbeat(), pushContextToken(), enrolPasskey(), AccountRuntime, Credential, discoverLocalAccounts() (+17 more)

### Community 55 - "softAuthenticator.ts"
Cohesion: 0.20
Nodes (18): b64url(), buildAttestationObject(), buildAuthData(), buildClientDataJSON(), cborBytes(), cborHead(), cborInt(), cborNint() (+10 more)

### Community 56 - "recon-markets.mjs"
Cohesion: 0.25
Nodes (12): aceite(), args, fixtureOut, grupos(), htmlFile, listagemDeJogos(), listar, main() (+4 more)

### Community 57 - "BetsManager.tsx"
Cohesion: 0.19
Nodes (14): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, ClvLockInline(), ClvLockProps, EMPTY_TIMEFRAME_FILTER, isTimeframe() (+6 more)

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.12
Nodes (30): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Metric(), Pick, PickClv (+22 more)

### Community 59 - "sync.ts"
Cohesion: 0.14
Nodes (23): Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload, KnownBet, knownBets(), parseActivations() (+15 more)

### Community 60 - "betStatus.ts"
Cohesion: 0.31
Nodes (9): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+1 more)

### Community 61 - "main.tsx"
Cohesion: 0.18
Nodes (6): @capacitor/splash-screen, ErrorBoundary, Props, State, storedLanguage(), hideSplashScreen()

### Community 62 - "betclicOdds.ts"
Cohesion: 0.16
Nodes (20): collectMarkets(), collectSelectionOdds(), FairOdd, findKickoffUtc(), kickoffMs(), lisbonOffsetMs(), lisbonToUtcMs(), Market (+12 more)

### Community 63 - "clv-agent.ts"
Cohesion: 0.20
Nodes (19): betclicPath(), bettrackr(), correr(), descobrirJogos(), dorme(), hojeEmLisboa(), lerCategorias(), lerJogo() (+11 more)

### Community 64 - "MobileSocial.tsx"
Cohesion: 0.29
Nodes (18): MemberProfile(), statusMeta(), Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests() (+10 more)

### Community 65 - "MobileAdmin.tsx"
Cohesion: 0.06
Nodes (65): @capacitor/core, @capacitor/push-notifications, AdminDashboard(), AdminDashboardProps, DeleteDialog(), Dialog(), GrantDialog(), Metric() (+57 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.09
Nodes (22): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+14 more)

### Community 67 - "ui/index.ts"
Cohesion: 0.34
Nodes (9): AccountSheet(), BottomSheet(), ListGroup(), ListItem(), ListItemProps, Pressable(), PressableProps, SheetPageProps (+1 more)

### Community 68 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 69 - "liveUpdate.ts"
Cohesion: 0.21
Nodes (9): @capgo/capacitor-updater, UPDATE_BASES, getBundleVersion(), initLiveUpdate(), procurarAtualizacao(), VersaoRemota, legacyNameFor(), migrateLegacyStorageKeys() (+1 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.25
Nodes (7): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), router, ORIG

### Community 71 - "useBetForm.ts"
Cohesion: 0.32
Nodes (9): FormSelection, nowLocal(), useBetForm(), combineFormOdds(), FormSelectionRow, mergeSelection(), Selection, SelectionResult (+1 more)

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 84 - "App.tsx"
Cohesion: 0.12
Nodes (25): App(), DesktopApp, MobileApp, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences() (+17 more)

### Community 85 - "react"
Cohesion: 0.25
Nodes (8): react, react-dom, BackEntry, push(), remove(), stack, useBackHandler(), BottomSheetProps

### Community 86 - "isNativeApp"
Cohesion: 0.14
Nodes (26): INCLUDED, INCLUDED, TONE_BADGE, ERROR_KEYS, useBillingActions(), CheckoutOutcome, useCheckoutReturn(), API_BASE (+18 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.26
Nodes (12): accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf(), priceOf() (+4 more)

### Community 88 - "settingsApi.ts"
Cohesion: 0.44
Nodes (7): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateEnabledBookmakers(), updateLanguage()

### Community 89 - "gen-icons.mjs"
Cohesion: 0.18
Nodes (4): base, master, png(), repoRoot

### Community 91 - "atualizar-bot.sh"
Cohesion: 0.38
Nodes (11): aviso(), buscar(), correr(), diz(), erro(), expande(), ficheiros_de(), sem_horario() (+3 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.12
Nodes (14): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), jsonwebtoken, getJwtSecret() (+6 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.16
Nodes (11): asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload, router (+3 more)

### Community 96 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 97 - "make-admin.mjs"
Cohesion: 0.15
Nodes (11): connect(), getPool(), query(), pg, botuser, founder, isLocalDb, pool (+3 more)

### Community 99 - "BetclicImport.tsx"
Cohesion: 0.29
Nodes (10): BetclicImport(), EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), AllSourcesImportResult, BookmakerImportResult (+2 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.11
Nodes (32): lucide-react, BetsManager(), Dashboard(), DashboardBetsFilters, FilterDropdown(), FilterDropdownOption, FilterDropdownProps, FiltersBar() (+24 more)

### Community 102 - "bankrollApi.ts"
Cohesion: 0.44
Nodes (8): useBankroll(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi(), updateMovement(), VALID_KINDS

### Community 104 - "csv-closing-odds.test.ts"
Cohesion: 0.33
Nodes (4): cell(), FileReaderShim, header(), reimport()

### Community 105 - "platform.ts"
Cohesion: 0.70
Nodes (4): readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 112 - "LongPressController"
Cohesion: 0.12
Nodes (7): createLongPressController(), LongPressController, LongPressOptions, TimerHandle, resolveSelectionDisplayResult(), SelectionDisplayResult, EXPECTED_PT

### Community 115 - "messageOf"
Cohesion: 0.28
Nodes (11): useAccounts(), useSubscription(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount() (+3 more)

### Community 118 - "betclicGrpc.ts"
Cohesion: 0.21
Nodes (15): lerCategoria(), bytesDe(), cabecalhosDaPagina(), Campo, campos(), campoTexto(), comoSelecao(), GRPC_HEADERS (+7 more)

### Community 133 - "MobileDashboard.tsx"
Cohesion: 0.15
Nodes (22): ClvLockPanel(), ClosingOddsSheet(), describeLeg(), legKey(), MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta() (+14 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (19): @capacitor/app, BrandMark(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin (+11 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.31
Nodes (12): aviso(), correr(), diz(), erro(), escrever_crontab(), expande(), log_de(), log_em() (+4 more)

### Community 142 - "haptics.ts"
Cohesion: 0.12
Nodes (19): motion, haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), FAB() (+11 more)

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "index.tsx"
Cohesion: 0.20
Nodes (18): EN, buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate() (+10 more)

### Community 195 - "vercel.json"
Cohesion: 0.22
Nodes (8): builds, crons, test, git, deploymentEnabled, regions, routes, version

### Community 210 - "package.json"
Cohesion: 0.07
Nodes (27): description, name, private, type, version, adm-zip, bcryptjs, @capacitor/android (+19 more)

### Community 218 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

## Knowledge Gaps
- **41 isolated node(s):** `RFC-8152`, `@capacitor/android`, `@capacitor/keyboard`, `@types/bun`, `@types/express` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Bet`, `MobileDashboard.tsx`, `MobileApp.tsx`, `botWatch.ts`, `types.ts`, `haptics.ts`, `MobileBets.tsx`, `Toast.tsx`, `FilteredBetsSummary.tsx`, `authApi.ts`, `DesktopApp.tsx`, `ref_bun_test`, `useI18n`, `parseJsonResponse`, `index.tsx`, `BetsManager.tsx`, `MobileInsights.tsx`, `main.tsx`, `MobileSocial.tsx`, `MobileAdmin.tsx`, `ui/index.ts`, `useBetForm.ts`, `package.json`, `App.tsx`, `isNativeApp`, `settingsApi.ts`, `BetclicImport.tsx`, `BetsManager.tsx`, `bankrollApi.ts`, `platform.ts`, `messageOf`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `RFC-8152`, `@capacitor/android`, `@capacitor/keyboard` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Why does `express` connect `server.ts` to `AuthenticatedRequest`, `insightsRoutes.ts`, `botRoutes.ts`, `clvRoutes.ts`, `package.json`, `billingRoutes.ts`, `adminRoutes.ts`, `authMiddleware.ts`, `betsRoutes.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Why does `Bet` connect `Bet` to `MobileSocial.tsx`, `MobileAdmin.tsx`, `BetsManager.tsx`, `authApi.ts`, `useBetForm.ts`, `insightsRoutes.ts`, `MobileDashboard.tsx`, `csv-closing-odds.test.ts`, `types.ts`, `MobileBets.tsx`, `ref_bun_test`, `dataTransfer.ts`, `App.tsx`, `useI18n`, `parseJsonResponse`, `BetsManager.tsx`, `FilteredBetsSummary.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._