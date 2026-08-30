# Graph Report - bettrackr  (2026-08-30)

## Corpus Check
- 222 files · ~253,134 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1519 nodes · 3545 edges · 164 communities (91 shown, 73 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f03b7393`
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
- Trust Imported Actual Payouts
- Aposta Legal Bwin Portugal Guide
- Cashout End-to-End Build Slice
- clvRoutes.ts
- MobileBets.tsx
- Bookmaker Import Actions
- inject-betano.js
- Pressable
- Sports Betting Analytics
- BetTrackr PWA Icon
- zip-extension.mjs
- inject.js
- bettrackr-identity.js
- adminRoutes.ts
- content-bettrackr.js
- migrate.mjs
- server.ts
- parseJsonResponse
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
- Betano Brazil Help Centre
- Per-Bookmaker Freebet Defaults
- Bookmaker Ratings Freebet Guide
- Cashout as a First-Class Settled Outcome
- Dashboard Filters
- Dashboard Result Distribution Fix
- Extension Login and Opt-In Auto-Import
- Bookmaker Adapter Architecture
- Extension Cashout Import
- Extension Credential Security Constraints
- Automated Bookmaker Access Terms Risk
- Foundation-First Delivery Sequence
- Typed Freebet Rules
- FreeBetOffers Stake Return Guide
- GamblingCalc Free Bet Calculator
- Gemini Multi-Bet Screenshot Import
- Internationalization
- Observador Bwin Guide
- Olhar Digital Betano Freebet Guide
- Placard FAQ
- Stake Not Returned Freebet
- Stake Returned Freebet
- Structured Bookmaker Registry
- TipsterCompetition Stake Not Returned Explainer
- Viva Aposta Placard Guide
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
- importers.test.js
- MobileDashboard.tsx
- useI18n
- billingRoutes.ts
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- index.tsx
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- Gallery.tsx
- Dashboard.tsx
- authApi.ts
- @capacitor/cli
- Bet
- index.ts
- tsx
- closing-odds.js
- @types/node
- longPress.ts
- @vitejs/plugin-react
- bankroll.ts
- pool.ts
- dataTransfer.ts
- authFetch
- daily_insights
- haptics.ts
- esbuild
- MobileApp.tsx
- MobileInsights.tsx
- @types/express
- @types/react-dom
- BetsManager.tsx
- bookie_accounts
- bankrollApi.ts
- betStatus.ts
- run-migration.mjs
- i18n-labels.test.ts
- clv.ts
- accountsApi.ts
- @tailwindcss/vite
- ClosingOddsSheet.tsx
- 020_daily_odds.sql
- adm-zip
- scripts
- MobileAdmin.tsx
- vercel.json
- package.json
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- gradlew
- CLAUDE.md
- vite

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 81 edges
2. `authFetch()` - 55 edges
3. `parseJsonResponse()` - 54 edges
4. `Bet` - 54 edges
5. `isNativeApp()` - 36 edges
6. `safeNum()` - 36 edges
7. `BookieAccount` - 23 edges
8. `App()` - 22 edges
9. `BetStatus` - 21 edges
10. `BankrollMovement` - 20 edges

## Surprising Connections (you probably didn't know these)
- `runImport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  extension/test/bankroll-backup.test.ts → src/lib/dataTransfer.ts
- `reimport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  extension/test/csv-closing-odds.test.ts → src/lib/dataTransfer.ts
- `parse()` --calls--> `readFilters()`  [EXTRACTED]
  extension/test/filter-params.test.ts → src/lib/filterParams.ts
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `BetsManager()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/components/BetsManager.tsx → lib/clvClosingOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (164 total, 73 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.17
Nodes (24): ScreenshotImporter(), ScreenshotImporterProps, FormSelection, nowLocal(), useBetForm(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName() (+16 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (55): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+47 more)

### Community 2 - "DesktopApp.tsx"
Cohesion: 0.15
Nodes (13): DesktopApp, AuthPageProps, Mode, BrandMark(), AdminDashboard, BetsManager, Dashboard, DesktopApp() (+5 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss, @types/jsonwebtoken, @types/pg, @types/react, typescript, vite-plugin-pwa, tailwindcss (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.12
Nodes (27): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+19 more)

### Community 6 - "mapper.js"
Cohesion: 0.25
Nodes (15): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+7 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (38): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+30 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (53): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+45 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.10
Nodes (17): BetSelectionAction, BetSelectionState, INITIAL_BET_SELECTION_STATE, MobileBets, BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, CLV_OPTIONS, formatDay() (+9 more)

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
Cohesion: 0.11
Nodes (25): BET_SELECT_COLUMNS, accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, iso(), isStaff() (+17 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.09
Nodes (13): Bucket, rateLimit(), Kind, router, VALID_KINDS, router, router, router (+5 more)

### Community 29 - "parseJsonResponse"
Cohesion: 0.27
Nodes (18): useBets(), parseJsonResponse(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets() (+10 more)

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

### Community 84 - "importers.test.js"
Cohesion: 0.18
Nodes (18): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet() (+10 more)

### Community 85 - "MobileDashboard.tsx"
Cohesion: 0.13
Nodes (15): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MobileDashboard, MobileDashboard(), MONEY_OPTIONS, STATUS_META (+7 more)

### Community 86 - "useI18n"
Cohesion: 0.05
Nodes (65): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+57 more)

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

### Community 91 - "index.tsx"
Cohesion: 0.10
Nodes (30): ErrorBoundary, Props, State, storedLanguage(), EN, buildValue(), DICTS, I18nContext (+22 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.13
Nodes (11): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), router, getJwtSecret() (+3 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.16
Nodes (11): asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload, router (+3 more)

### Community 96 - "App.tsx"
Cohesion: 0.12
Nodes (23): App(), AppProps, Gallery, makeInitialLogs(), useAuditLog(), useLanguageSync(), DEFAULT_PREFERENCES, detectLanguage() (+15 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 99 - "Gallery.tsx"
Cohesion: 0.24
Nodes (8): AccountSheet(), GalleryInner(), MobileBets, MobileDashboard, ListGroup(), ListItem(), ListItemProps, useToast()

### Community 101 - "Dashboard.tsx"
Cohesion: 0.13
Nodes (29): parse(), now, Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps, MemberProfile(), MemberProfileProps (+21 more)

### Community 102 - "authApi.ts"
Cohesion: 0.11
Nodes (26): AccountPanel(), AccountPanelProps, AuthPage(), handleSubmit(), ERROR_KEYS, MIN_PASSWORD_LENGTH, Window, apiUrl() (+18 more)

### Community 105 - "Bet"
Cohesion: 0.15
Nodes (29): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, ClosingOddsModalProps (+21 more)

### Community 107 - "index.ts"
Cohesion: 0.21
Nodes (11): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.13
Nodes (28): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+20 more)

### Community 112 - "longPress.ts"
Cohesion: 0.20
Nodes (3): LongPressController, LongPressOptions, TimerHandle

### Community 115 - "bankroll.ts"
Cohesion: 0.23
Nodes (9): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollMovementKind (+1 more)

### Community 116 - "pool.ts"
Cohesion: 0.24
Nodes (6): connect(), getPool(), query(), router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES

### Community 117 - "dataTransfer.ts"
Cohesion: 0.14
Nodes (11): runImport(), umaAposta, cell(), FileReaderShim, header(), reimport(), BANKROLL_KINDS, buildBetsCSV() (+3 more)

### Community 118 - "authFetch"
Cohesion: 0.34
Nodes (16): Social(), SocialProps, authFetch(), acceptFriendRequest(), fetchFriendBets(), listFriends(), listRequests(), removeFriend() (+8 more)

### Community 133 - "haptics.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (13): MobileApp, runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin, MobileImport (+5 more)

### Community 140 - "MobileInsights.tsx"
Cohesion: 0.11
Nodes (28): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), AIInsights (+20 more)

### Community 143 - "BetsManager.tsx"
Cohesion: 0.11
Nodes (21): BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk() (+13 more)

### Community 145 - "bankrollApi.ts"
Cohesion: 0.44
Nodes (8): useBankroll(), ApiMovementRow, createMovement(), deleteMovement(), fetchMovements(), mapMovementFromApi(), updateMovement(), VALID_KINDS

### Community 146 - "betStatus.ts"
Cohesion: 0.29
Nodes (9): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), STATUS_ALIASES, statusToken(), VALID_BET_STATUSES (+1 more)

### Community 150 - "clv.ts"
Cohesion: 0.21
Nodes (18): NOW, combineClosingOdds(), validClosingOdd(), betClv(), betClvNoVig(), calculateClv(), ClvBetResult, ClvBookmakerRow (+10 more)

### Community 152 - "accountsApi.ts"
Cohesion: 0.53
Nodes (7): useAccounts(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts(), mapAccountFromApi(), renameAccount()

### Community 157 - "ClosingOddsSheet.tsx"
Cohesion: 0.33
Nodes (7): ClosingOddsModal(), describeLeg(), legKey(), ClosingOddsSheet(), describeLeg(), legKey(), parseDecimal()

### Community 179 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android:open, android:sync, build, build:agent, check:i18n, clean, dev (+5 more)

### Community 182 - "MobileAdmin.tsx"
Cohesion: 0.11
Nodes (37): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), useAdminPanel() (+29 more)

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
- **419 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `config`, `daily_insights` (+414 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `clv.ts` to `types.ts`, `BetsManager.tsx`, `clvRoutes.ts`, `dataTransfer.ts`, `parseJsonResponse`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `types.ts`, `DesktopApp.tsx`, `Dashboard.tsx`, `authApi.ts`, `Bet`, `MobileInsights.tsx`, `BetsManager.tsx`, `MobileBets.tsx`, `MobileDashboard.tsx`, `MobileAdmin.tsx`, `authFetch`, `index.tsx`, `ClosingOddsSheet.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _419 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._