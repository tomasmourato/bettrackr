# Graph Report - bettrackr  (2026-08-30)

## Corpus Check
- 221 files · ~248,364 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1494 nodes · 3499 edges · 165 communities (92 shown, 73 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f32417f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- background.js
- navigation.ts
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
- authFetch
- users
- content-betclic.js
- check-i18n.mjs
- vite.config.ts
- mapper-betano.js
- importers.test.js
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
- mapper-solverde.js
- MobileDashboard.tsx
- useI18n
- billingRoutes.ts
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- BetsManager.tsx
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- index.ts
- Dashboard.tsx
- authApi.ts
- platform.ts
- Bet
- haptics.ts
- tsx
- closing-odds.test.js
- @types/node
- FilteredBetsSummary.tsx
- LongPressController
- @vitejs/plugin-react
- bankroll.ts
- pool.ts
- dataTransfer.ts
- AuthPage.tsx
- daily_insights
- initialData.ts
- Toast.tsx
- esbuild
- MobileApp.tsx
- tailwindcss
- adm-zip
- index.tsx
- @types/express
- @types/react-dom
- ensureBetanoHistoryTab
- bookie_accounts
- betStatus.ts
- run-migration.mjs
- i18n-labels.test.ts
- safeNum
- selectionHaptic
- AccountSheet.tsx
- @tailwindcss/vite
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
- `useBetForm()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/hooks/useBetForm.ts → lib/clvClosingOdds.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (165 total, 73 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.15
Nodes (24): ScreenshotImporter(), FormSelection, nowLocal(), useBetForm(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName(), BOOKMAKERS (+16 more)

### Community 1 - "background.js"
Cohesion: 0.08
Nodes (44): accountsForBookmaker(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames(), exchangeForExtensionToken() (+36 more)

### Community 2 - "navigation.ts"
Cohesion: 0.13
Nodes (17): DesktopApp, AccountPanel(), BetsManager, Dashboard, DesktopApp(), ScreenshotImporter, Settings, Social (+9 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, @capacitor/cli, @types/jsonwebtoken, @types/pg, @types/react, typescript, vite-plugin-pwa (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.14
Nodes (23): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+15 more)

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
Cohesion: 0.08
Nodes (41): bettrackr(), lerJogo(), log(), passagem(), Trabalho, estado, AGORA, leg() (+33 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.10
Nodes (15): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, CLV_OPTIONS, formatDay(), KeyOption, MONEY_OPTIONS, SORT_OPTIONS, SortField (+7 more)

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
Cohesion: 0.11
Nodes (25): BET_SELECT_COLUMNS, accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, iso(), isStaff() (+17 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.09
Nodes (12): Bucket, rateLimit(), router, router, router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES, app (+4 more)

### Community 29 - "authFetch"
Cohesion: 0.14
Nodes (40): Social(), SocialProps, useAccounts(), useBets(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts() (+32 more)

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
Cohesion: 0.18
Nodes (19): betanoRequestId(), fetchBetanoBets(), requestBetanoPage(), runBetanoImport(), waitForBetanoTokens(), betanoRef(), CASHOUT_STATUS_TOKENS, dateTime() (+11 more)

### Community 37 - "importers.test.js"
Cohesion: 0.22
Nodes (14): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets() (+6 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.31
Nodes (12): runSolverdeImport(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize() (+4 more)

### Community 85 - "MobileDashboard.tsx"
Cohesion: 0.14
Nodes (13): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MobileDashboard(), MONEY_OPTIONS, STATUS_META, Timeframe (+5 more)

### Community 86 - "useI18n"
Cohesion: 0.05
Nodes (78): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), BetsManagerProps (+70 more)

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

### Community 91 - "BetsManager.tsx"
Cohesion: 0.14
Nodes (14): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FiltersBar(), FiltersBarProps, BetSelectionAction, betSelectionReducer() (+6 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.15
Nodes (11): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+3 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.16
Nodes (11): asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload, router (+3 more)

### Community 96 - "App.tsx"
Cohesion: 0.18
Nodes (15): App(), makeInitialLogs(), useAuditLog(), useLanguageSync(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences(), usePreferences() (+7 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 99 - "index.ts"
Cohesion: 0.20
Nodes (13): Gallery, MobileBets, MobileDashboard, ListGroup(), ListItem(), ListItemProps, MobileCard(), SectionHeader() (+5 more)

### Community 101 - "Dashboard.tsx"
Cohesion: 0.13
Nodes (26): parse(), now, Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER (+18 more)

### Community 102 - "authApi.ts"
Cohesion: 0.22
Nodes (15): handleSubmit(), ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl(), AuthError, changePassword(), clearToken(), errorFrom() (+7 more)

### Community 104 - "platform.ts"
Cohesion: 0.70
Nodes (4): readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

### Community 105 - "Bet"
Cohesion: 0.14
Nodes (21): ClosingOddsModal(), ClosingOddsModalProps, describeLeg(), legKey(), DashboardBetsFilters, DashboardProps, MemberProfile(), MemberProfileProps (+13 more)

### Community 107 - "haptics.ts"
Cohesion: 0.17
Nodes (11): ImpactWeight, NotificationKind, tapHaptic(), FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 109 - "closing-odds.test.js"
Cohesion: 0.17
Nodes (24): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+16 more)

### Community 111 - "FilteredBetsSummary.tsx"
Cohesion: 0.39
Nodes (4): FilteredBetsSummary(), FilteredBetsSummaryProps, money(), calculateFilteredBetsSummary()

### Community 115 - "bankroll.ts"
Cohesion: 0.13
Nodes (24): BankrollCard(), BankrollCardProps, KINDS, todayKey(), useBankroll(), calculateBankroll(), countsTowardsBalance(), countsTowardsExposure() (+16 more)

### Community 116 - "pool.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 117 - "dataTransfer.ts"
Cohesion: 0.14
Nodes (11): runImport(), umaAposta, cell(), FileReaderShim, header(), reimport(), BANKROLL_KINDS, buildBetsCSV() (+3 more)

### Community 118 - "AuthPage.tsx"
Cohesion: 0.33
Nodes (4): AuthPage(), AuthPageProps, Mode, BrandMark()

### Community 131 - "initialData.ts"
Cohesion: 0.50
Nodes (4): AppProps, InitialAppData, Window, StoredUser

### Community 133 - "Toast.tsx"
Cohesion: 0.22
Nodes (9): haptics(), notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastProvider() (+1 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.14
Nodes (16): MobileApp, AccountSheet(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileBets (+8 more)

### Community 140 - "index.tsx"
Cohesion: 0.06
Nodes (54): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), ErrorBoundary (+46 more)

### Community 143 - "ensureBetanoHistoryTab"
Cohesion: 0.29
Nodes (7): ensureBetanoHistoryTab(), findBetanoTab(), isBetanoHistoryTab(), isBetanoSettledTab(), settledHistoryUrl(), waitForTabComplete(), betanoHistoryStart()

### Community 146 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 150 - "safeNum"
Cohesion: 0.19
Nodes (22): NOW, combineClosingOdds(), validClosingOdd(), BetsManager(), betClv(), betClvNoVig(), calculateClv(), ClvBetResult (+14 more)

### Community 151 - "selectionHaptic"
Cohesion: 0.32
Nodes (6): selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps, SwipeAction

### Community 154 - "AccountSheet.tsx"
Cohesion: 0.31
Nodes (8): AccountPanelProps, CurrentUser, SessionExpiredError, I18nValue, TFn, UserSettings, AccountSheetProps, Language

### Community 179 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android:open, android:sync, build, build:agent, check:i18n, clean, dev (+5 more)

### Community 182 - "MobileAdmin.tsx"
Cohesion: 0.11
Nodes (37): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), AdminDashboard (+29 more)

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
- **410 isolated node(s):** `Trabalho`, `config`, `daily_insights`, `daily_insights`, `manifest_version` (+405 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `safeNum` to `types.ts`, `clvRoutes.ts`, `dataTransfer.ts`, `BetsManager.tsx`, `authFetch`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `types.ts`, `Dashboard.tsx`, `authApi.ts`, `Bet`, `index.tsx`, `FilteredBetsSummary.tsx`, `MobileBets.tsx`, `bankroll.ts`, `MobileDashboard.tsx`, `AuthPage.tsx`, `MobileAdmin.tsx`, `safeNum`, `BetsManager.tsx`, `authFetch`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `Trabalho`, `config`, `daily_insights` to the rest of the system?**
  _410 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0783673469387755 - nodes in this community are weakly interconnected._
- **Should `navigation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._