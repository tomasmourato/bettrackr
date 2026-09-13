# Graph Report - bettrackr  (2026-09-13)

## Corpus Check
- 279 files · ~307,940 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1933 nodes · 4729 edges · 154 communities (80 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `149059a9`
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
- migrate.mjs
- server.ts
- import-utils.js
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
- App.tsx
- apiError
- src/index.ts
- softAuthenticator.ts
- recon-markets.mjs
- index.tsx
- MobileInsights.tsx
- sync.ts
- dataTransfer.ts
- ui/index.ts
- navigation.ts
- Bet
- MobileSocial.tsx
- MobileDashboard.tsx
- O bot completo (Metade A)
- bankrollRoutes.ts
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
- settingsApi.ts
- make-admin.mjs
- AGENTS.md
- TKey
- BetsManager.tsx
- messageOf
- tailwindcss
- @types/jsonwebtoken
- haptics.ts
- @vitejs/plugin-react
- closing-odds.js
- longPress.ts
- BetclicImport.tsx
- authFetch
- daily_insights
- esbuild
- MobileApp.tsx
- religar-bot.sh
- @types/express
- bookie_accounts
- requestBetclicToken
- run-migration.mjs
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
1. `useI18n()` - 100 edges
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
- `BetsManager()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvClosingOdds.ts
- `useBetForm()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/hooks/useBetForm.ts → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `importBetsFromFile()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/dataTransfer.ts → lib/clvClosingOdds.ts
- `BetsManager()` --calls--> `originalOddOf()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvMath.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (154 total, 45 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.13
Nodes (32): BankrollCard(), BankrollCardProps, KINDS, todayKey(), Settings(), SettingsProps, ACTION_KEYS, auditAction() (+24 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (51): accountsForBookmaker(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab() (+43 more)

### Community 2 - "AuthenticatedRequest"
Cohesion: 0.21
Nodes (8): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), AccessState, AccessRequest, AuthenticatedRequest, router

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (49): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+41 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, adm-zip, tsx, @types/node, @types/pg, @types/react-dom, vite-plugin-pwa, adm-zip (+5 more)

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
Cohesion: 0.14
Nodes (24): alertTabFor(), BotActivity, botAlertText(), formatDuration(), Lang, pushBotAlert(), runBotWatch(), semSucessoDesde() (+16 more)

### Community 13 - "marco0.ts"
Cohesion: 0.13
Nodes (32): [cmd, arg], cmdBets(), cmdCleanup(), cmdEnrol(), cmdLogin(), cmdVaultImport(), KEY_FILE, load() (+24 more)

### Community 14 - "types.ts"
Cohesion: 0.13
Nodes (30): ScreenshotImporter(), FormSelection, nowLocal(), useBetForm(), combineFormOdds(), FormSelectionRow, mergeSelection(), AVAILABLE_BOOKMAKERS (+22 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (61): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+53 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.11
Nodes (18): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, CLV_OPTIONS, formatDay() (+10 more)

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
Cohesion: 0.08
Nodes (15): connect(), getPool(), query(), Bucket, rateLimit(), router, router, router (+7 more)

### Community 29 - "import-utils.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

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
Cohesion: 0.18
Nodes (19): betanoRequestId(), fetchBetanoBets(), requestBetanoPage(), runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime() (+11 more)

### Community 37 - "TFn"
Cohesion: 0.31
Nodes (7): AccountPanel(), AccountPanelProps, I18nValue, TFn, UserSettings, AccountSheetProps, Language

### Community 51 - "vault.ts"
Cohesion: 0.23
Nodes (12): credentialToVault(), decryptFromFile(), deriveKey(), encryptToFile(), readPassphrase(), saveSession(), SessionState, VaultContents (+4 more)

### Community 52 - "App.tsx"
Cohesion: 0.09
Nodes (35): App(), AppProps, AuthPage(), handleSubmit(), AuthPageProps, Mode, ERROR_KEYS, MIN_PASSWORD_LENGTH (+27 more)

### Community 53 - "apiError"
Cohesion: 0.29
Nodes (17): useBets(), apiError, ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets() (+9 more)

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

### Community 58 - "MobileInsights.tsx"
Cohesion: 0.10
Nodes (30): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, PickClv, toneClasses() (+22 more)

### Community 59 - "sync.ts"
Cohesion: 0.12
Nodes (27): fetchBetclicBets(), FetchBetsOptions, fetchPage(), Activation, BettrackrConfig, extractImportKey(), fetchActivations(), HeartbeatPayload (+19 more)

### Community 60 - "dataTransfer.ts"
Cohesion: 0.09
Nodes (23): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+15 more)

### Community 61 - "ui/index.ts"
Cohesion: 0.15
Nodes (17): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+9 more)

### Community 62 - "navigation.ts"
Cohesion: 0.11
Nodes (21): DesktopApp, BrandMark(), AdminDashboard, BetsManager, BotPanel, Dashboard, DesktopApp(), ScreenshotImporter (+13 more)

### Community 63 - "Bet"
Cohesion: 0.14
Nodes (17): BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, DashboardProps, FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), MemberProfile() (+9 more)

### Community 64 - "MobileSocial.tsx"
Cohesion: 0.33
Nodes (15): Social(), SocialProps, acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend(), removeFriendRequest() (+7 more)

### Community 65 - "MobileDashboard.tsx"
Cohesion: 0.12
Nodes (21): ClosingOddsModal(), ClosingOddsModalProps, describeLeg(), legKey(), ClosingOddInput, ClosingOddsSheet(), ClosingOddsSheetProps, describeLeg() (+13 more)

### Community 66 - "O bot completo (Metade A)"
Cohesion: 0.10
Nodes (20): 0. Preparar, 1. Mover a chave para o cofre cifrado, 1. Obter o teu Bearer token da Betclic, 2. Registar a passkey de teste, 2. Uma passagem em dry-run (nao envia nada, so imprime), 3. A serio: enviar para o BetTrackr, 3. Entrar com ela — a pergunta do teste, 4. A correr sozinho de 30 em 30 min (telemovel / Termux, como o CLV) (+12 more)

### Community 67 - "bankrollRoutes.ts"
Cohesion: 0.25
Nodes (3): Kind, router, VALID_KINDS

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 70 - "botRoutes.ts"
Cohesion: 0.25
Nodes (8): activationConfigured(), activationKeyMaterial(), decryptToken(), deriveKey(), encryptToken(), resolveBotAlert(), router, ORIG

### Community 72 - "bot/package.json"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, marco0, once, start, test (+3 more)

### Community 83 - "Implementation Plan"
Cohesion: 0.08
Nodes (24): Appendix - freebet research sources (F3), Build Spec - Slice 1 (Cashout end-to-end + Dashboard fix), C1 - Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 - Fix "Distribuição de Resultados" count (confirmed bug), D2 - Dashboard filters (bookie, sport, bet type, ...), Dashboard (TODO §4) (+16 more)

### Community 84 - "importers.test.js"
Cohesion: 0.18
Nodes (18): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet() (+10 more)

### Community 86 - "isNativeApp"
Cohesion: 0.06
Nodes (52): PushStatus(), INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE (+44 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.22
Nodes (14): PLAN, accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf() (+6 more)

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

### Community 96 - "settingsApi.ts"
Cohesion: 0.44
Nodes (7): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateEnabledBookmakers(), updateLanguage()

### Community 97 - "make-admin.mjs"
Cohesion: 0.33
Nodes (5): botuser, founder, isLocalDb, pool, remove

### Community 99 - "TKey"
Cohesion: 0.20
Nodes (10): makeInitialLogs(), useAuditLog(), AllSourcesImportResult, BookmakerImportResult, LocalizedError, TVars, TKey, SubscriptionDisplay (+2 more)

### Community 101 - "BetsManager.tsx"
Cohesion: 0.10
Nodes (38): BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, ClvLockInline(), ClvLockPanel(), ClvLockProps (+30 more)

### Community 102 - "messageOf"
Cohesion: 0.28
Nodes (11): useAccounts(), useSubscription(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount() (+3 more)

### Community 107 - "haptics.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (30): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+22 more)

### Community 112 - "longPress.ts"
Cohesion: 0.20
Nodes (4): createLongPressController(), LongPressController, LongPressOptions, TimerHandle

### Community 113 - "BetclicImport.tsx"
Cohesion: 0.23
Nodes (11): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+3 more)

### Community 115 - "authFetch"
Cohesion: 0.21
Nodes (20): ActivationCard(), useBankroll(), authFetch(), parseJsonResponse(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements() (+12 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.14
Nodes (14): MobileApp, AccountSheet(), runTopBackHandler(), useAndroidBackButton(), MobileAdmin, MobileBets, MobileBot, MobileDashboard (+6 more)

### Community 140 - "religar-bot.sh"
Cohesion: 0.46
Nodes (7): aviso(), diz(), erro(), expande(), log_em(), religar-bot.sh script, verde()

### Community 145 - "requestBetclicToken"
Cohesion: 0.83
Nodes (4): requestBetclicToken(), finish(), onMessage(), onMessage()

### Community 179 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, android:open, android:sync, build, build:agent, build:bot, check:i18n, clean (+6 more)

### Community 182 - "useI18n"
Cohesion: 0.06
Nodes (70): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), ActivationBadge() (+62 more)

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
- **508 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `KEY_FILE`, `StoredKey` (+503 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 678 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `clvRoutes.ts` to `insightsRoutes.ts`, `BetsManager.tsx`, `types.ts`, `apiError`, `dataTransfer.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `mapBetclicBets` connect `sync.ts` to `background.js`, `mapper.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `Settings.tsx`, `MobileDashboard.tsx`, `MobileSocial.tsx`, `BetsManager.tsx`, `types.ts`, `MobileBets.tsx`, `BetclicImport.tsx`, `authFetch`, `App.tsx`, `isNativeApp`, `index.tsx`, `MobileInsights.tsx`, `Bet`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _508 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12564102564102564 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._