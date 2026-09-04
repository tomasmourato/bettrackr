# Graph Report - bettrackr  (2026-09-04)

## Corpus Check
- 229 files · ~262,533 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1556 nodes · 3676 edges · 135 communities (64 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e89199e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Bet
- background.js
- socialRoutes.ts
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
- FilteredBetsSummary.tsx
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
- i18n-labels.test.ts
- @types/react
- typescript
- vite-plugin-pwa
- authFetch
- types.ts
- BankrollMovement
- index.tsx
- MobileSettings.tsx
- pool.ts
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
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- App.tsx
- make-admin.mjs
- AGENTS.md
- BetsManager.tsx
- tailwindcss
- navigation.ts
- haptics.ts
- tsx
- closing-odds.js
- @types/node
- LongPressController
- bankroll.ts
- Settings.tsx
- daily_insights
- esbuild
- MobileApp.tsx
- MobileInsights.tsx
- @types/express
- @types/react-dom
- bookie_accounts
- betStatus.ts
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
1. `useI18n()` - 84 edges
2. `authFetch()` - 56 edges
3. `Bet` - 55 edges
4. `parseJsonResponse()` - 54 edges
5. `isNativeApp()` - 36 edges
6. `safeNum()` - 36 edges
7. `BookieAccount` - 23 edges
8. `App()` - 22 edges
9. `BetStatus` - 21 edges
10. `BankrollMovement` - 21 edges

## Surprising Connections (you probably didn't know these)
- `applyToBet()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  routes/clvRoutes.ts → lib/clvClosingOdds.ts
- `mapBetFromApi()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/betsApi.ts → lib/clvClosingOdds.ts
- `importBetsFromFile()` --calls--> `combineClosingOdds()`  [EXTRACTED]
  src/lib/dataTransfer.ts → lib/clvClosingOdds.ts
- `presentUser()` --calls--> `accessFromRow()`  [EXTRACTED]
  routes/adminRoutes.ts → lib/entitlements.ts
- `statusHandler()` --calls--> `loadAccess()`  [EXTRACTED]
  routes/billingRoutes.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (135 total, 46 thin omitted)

### Community 0 - "Bet"
Cohesion: 0.18
Nodes (16): BetclicImportProps, BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, ClosingOddsModalProps, DashboardProps, MemberProfileProps, ScreenshotImporterProps (+8 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (55): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, closingOddsEnabled(), configForImport(), detectBookmakerUsernames() (+47 more)

### Community 2 - "socialRoutes.ts"
Cohesion: 0.27
Nodes (5): CAMPOS_DA_METADATA, CAMPOS_DA_PERNA, comClvSeEntitled(), semClv(), router

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, adm-zip, @capacitor/cli, @types/bun, @types/jsonwebtoken, @types/pg, @vitejs/plugin-react (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.10
Nodes (29): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+21 more)

### Community 6 - "mapper.js"
Cohesion: 0.25
Nodes (15): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+7 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (33): agent, bootstrap.ts, bun, db, DOM, DOM.Iterable, ES2022, lib (+25 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (40): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+32 more)

### Community 9 - "popup.js"
Cohesion: 0.05
Nodes (43): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+35 more)

### Community 12 - "apiBase.ts"
Cohesion: 0.15
Nodes (12): API_BASE, configured, UPDATE_BASES, getBundleVersion(), initLiveUpdate(), procurarAtualizacao(), VersaoRemota, readOverride() (+4 more)

### Community 14 - "FilteredBetsSummary.tsx"
Cohesion: 0.33
Nodes (5): FilteredBetsSummary(), FilteredBetsSummaryProps, FreebetAsterisk(), money(), calculateFilteredBetsSummary()

### Community 15 - "clvRoutes.ts"
Cohesion: 0.06
Nodes (56): betclicPath(), bettrackr(), descobrirJogos(), diario, dorme(), hojeEmLisboa(), lerJogo(), LISTAGENS (+48 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.08
Nodes (27): ClvLockInline(), ClvLockPanel(), ClvLockProps, BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, createLongPressController() (+19 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "backStack.ts"
Cohesion: 0.31
Nodes (6): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheetProps

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
Cohesion: 0.13
Nodes (10): Bucket, rateLimit(), router, router, router, app, execFileAsync, extensionZipPath (+2 more)

### Community 29 - "dataTransfer.ts"
Cohesion: 0.16
Nodes (12): BANKROLL_KINDS, buildBetsCSV(), deliverTextFile(), exportBetsCSV(), importBetsFromFile(), parseCSVRow(), sanitizeBankrollMovements(), runImport() (+4 more)

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

### Community 52 - "authFetch"
Cohesion: 0.07
Nodes (74): AccountPanel(), AccountPanelProps, AuthPage(), handleSubmit(), AuthPageProps, Mode, Social(), SocialProps (+66 more)

### Community 53 - "types.ts"
Cohesion: 0.11
Nodes (31): combineClosingOdds(), validClosingOdd(), BetsManager(), AiChip(), ScreenshotImporter(), FormSelection, nowLocal(), useBetForm() (+23 more)

### Community 56 - "BankrollMovement"
Cohesion: 0.23
Nodes (8): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BankrollMovement, BankrollSummary, Importado, umaAposta

### Community 57 - "index.tsx"
Cohesion: 0.10
Nodes (31): ErrorBoundary, Props, State, storedLanguage(), EN, buildValue(), DICTS, I18nContext (+23 more)

### Community 61 - "MobileSettings.tsx"
Cohesion: 0.14
Nodes (23): AccountSheet(), MobileAdmin, MobileAdminProps, Sheet, TONE, MobileImport(), pickNativePhoto(), STATUS_FORM_OPTIONS (+15 more)

### Community 63 - "pool.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 83 - "Implementation Plan"
Cohesion: 0.08
Nodes (24): Appendix - freebet research sources (F3), Build Spec - Slice 1 (Cashout end-to-end + Dashboard fix), C1 - Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 - Fix "Distribuição de Resultados" count (confirmed bug), D2 - Dashboard filters (bookie, sport, bet type, ...), Dashboard (TODO §4) (+16 more)

### Community 84 - "importers.test.js"
Cohesion: 0.18
Nodes (18): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet() (+10 more)

### Community 85 - "MobileDashboard.tsx"
Cohesion: 0.12
Nodes (15): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MobileDashboard, MobileDashboard(), MONEY_OPTIONS, STATUS_META (+7 more)

### Community 86 - "isNativeApp"
Cohesion: 0.12
Nodes (27): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), TONE_BADGE, ERROR_KEYS, useBillingActions() (+19 more)

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

### Community 92 - "authMiddleware.ts"
Cohesion: 0.11
Nodes (14): AuthenticatedRequest, authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), router (+6 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.16
Nodes (11): asSelections(), CLOSING_ODD_META_KEYS, combineClosingOdds(), legKey(), ownsClosingOdds(), parseBetPayload(), ParsedPayload, router (+3 more)

### Community 96 - "App.tsx"
Cohesion: 0.13
Nodes (20): App(), AppProps, Gallery, MobileApp, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, detectLanguage() (+12 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 101 - "BetsManager.tsx"
Cohesion: 0.11
Nodes (32): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps (+24 more)

### Community 105 - "navigation.ts"
Cohesion: 0.25
Nodes (14): DashboardBetsFilters, SettingsProps, SubscriptionCardProps, BankrollMovementInput, BillingStatus, TFn, MobileSettingsProps, ADMIN_NAV_ITEM (+6 more)

### Community 107 - "haptics.ts"
Cohesion: 0.09
Nodes (25): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), FAB(), FABProps (+17 more)

### Community 109 - "closing-odds.js"
Cohesion: 0.14
Nodes (29): getSnapshots(), readCurrentOdds(), readMatchOdds(), runClosingOddsPass(), scheduleClosingOddsAlarm(), writeClosingOdd(), acceptSnapshot(), betclicMatchPath() (+21 more)

### Community 115 - "bankroll.ts"
Cohesion: 0.23
Nodes (9): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollMovementKind (+1 more)

### Community 117 - "Settings.tsx"
Cohesion: 0.32
Nodes (11): Settings(), useLanguageSync(), exportBackupJSON(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES (+3 more)

### Community 137 - "MobileApp.tsx"
Cohesion: 0.26
Nodes (8): runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileImport, MobileSettings, MobileShell()

### Community 140 - "MobileInsights.tsx"
Cohesion: 0.07
Nodes (39): DesktopApp, AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses() (+31 more)

### Community 146 - "betStatus.ts"
Cohesion: 0.27
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 150 - "safeNum"
Cohesion: 0.17
Nodes (24): ClosingOddsModal(), describeLeg(), legKey(), betClv(), betClvNoVig(), calculateClv(), ClvBetResult, ClvBookmakerRow (+16 more)

### Community 179 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, android:open, android:sync, build, build:agent, check:i18n, clean, dev (+5 more)

### Community 182 - "useI18n"
Cohesion: 0.07
Nodes (54): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), BetclicImport() (+46 more)

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
- **425 isolated node(s):** `Trabalho`, `LISTAGENS`, `diario`, `config`, `daily_insights` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 571 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `combineClosingOdds()` connect `types.ts` to `BetsManager.tsx`, `clvRoutes.ts`, `authFetch`, `safeNum`, `dataTransfer.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `Bet`, `BetsManager.tsx`, `MobileInsights.tsx`, `FilteredBetsSummary.tsx`, `MobileBets.tsx`, `authFetch`, `types.ts`, `safeNum`, `isNativeApp`, `BankrollMovement`, `Settings.tsx`, `MobileDashboard.tsx`, `MobileSettings.tsx`, `index.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `Trabalho`, `LISTAGENS`, `diario` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `insightsRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._