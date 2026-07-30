# Graph Report - gestão-de-apostas  (2026-07-28)

## Corpus Check
- 207 files · ~218,522 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1327 nodes · 2810 edges · 151 communities (75 shown, 76 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `194d13e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Bet Lifecycle UI
- Extension Import Orchestration
- App Shell and State
- Runtime Dependencies
- Build Toolchain
- API Security and Database
- History and Reconciliation
- TypeScript Project Config
- Browser Extension Manifest
- Extension Popup UI
- Extension Security and Sessions
- App Architecture and Auth
- Cashout and Freebet Logic
- Bookmaker Freebet Research
- Product Feature Architecture
- Extension Import Settings
- Vercel Deployment
- Bookmaker Adapter Pipeline
- Betano Request Capture
- Gemini Import Planning
- PWA Icon 192
- PWA Icon 512
- Extension Packaging
- Betclic Request Capture
- Schema Migration Bootstrap
- Canonical Database Schema
- BetTrackr Token Bridge
- Status Constraint Migration
- Cashout Freebet Migration
- vite.config.ssr.ts
- Betclic Content Bridge
- bet
- Vite Configuration
- betStatus.ts
- importers.test.js
- BetTrackr — Extensão de importação de apostas
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
- import-utils.js
- rr
- index-GUdJqaP1.js
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- ExampleUnitTest.java
- concat
- MainActivity.java
- capacitor.config.ts
- CLAUDE.md
- build.gradle
- capacitor.build.gradle
- build.gradle
- settings.gradle
- variables.gradle
- l
- o
- Dashboard-CiJmES5V.js
- .forEach
- Settings-B3PiUVnh.js
- BetsManager-DThhK6Cx.js
- rs
- Ct
- N
- MobileDashboard.tsx
- Task 5 report — integrated selection rail
- Task 4 Verification Report — 2026-07-24
- scripts
- ErrorBoundary
- File Structure
- ensureBetanoHistoryTab
- vercel.json
- Filtered Bets Financial Summary Design
- Bets Selection Interactions Design
- Task 3 Report — Stable Summary Layout
- Global Constraints
- Global Constraints
- Stable Summary Selection Layout Design
- package.json
- Task 6 report — selection detail and card motion
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- Task 5 — Approved integrated selection rail
- ExampleUnitTest.java
- gradlew
- Global Constraints
- fetchSolverdeHistory
- Final Fix Report
- adm-zip
- CLAUDE.md
- 2026-07-24-selection-detail-and-card-motion-design.md
- vite
- progress.md
- task-1-brief.md
- task-1-report.md
- task-2-brief.md
- task-2-report.md
- task-3-brief.md
- task-4-brief.md

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 66 edges
2. `authFetch()` - 47 edges
3. `parseJsonResponse()` - 46 edges
4. `isNativeApp()` - 36 edges
5. `Bet` - 36 edges
6. `safeNum()` - 25 edges
7. `BookieAccount` - 22 edges
8. `App()` - 18 edges
9. `useToast()` - 18 edges
10. `BetStatus` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ScreenshotImporter()` --indirect_call--> `response()`  [INFERRED]
  src/components/ScreenshotImporter.tsx → extension/test/bettrackr-identity.test.js
- `MobileImport()` --indirect_call--> `response()`  [INFERRED]
  src/mobile/screens/MobileImport.tsx → extension/test/bettrackr-identity.test.js
- `parse()` --calls--> `readFilters()`  [EXTRACTED]
  extension/test/filter-params.test.ts → src/lib/filterParams.ts
- `presentUser()` --calls--> `accessFromRow()`  [EXTRACTED]
  routes/adminRoutes.ts → lib/entitlements.ts
- `statusHandler()` --calls--> `loadAccess()`  [EXTRACTED]
  routes/billingRoutes.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (151 total, 76 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.07
Nodes (69): response(), BetsManagerProps, BookieAccountsCardProps, DashboardProps, EnabledBookmakersCard(), EnabledBookmakersCardProps, FilteredBetsSummary(), FilteredBetsSummaryProps (+61 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (29): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), extensionStatus(), fetchBetanoBets() (+21 more)

### Community 2 - "App Shell and State"
Cohesion: 0.07
Nodes (68): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), Social() (+60 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, @capacitor/cli, tsx, @types/express, @types/node, @types/pg, typescript (+5 more)

### Community 5 - "API Security and Database"
Cohesion: 0.14
Nodes (22): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+14 more)

### Community 6 - "History and Reconciliation"
Cohesion: 0.28
Nodes (14): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+6 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "Browser Extension Manifest"
Cohesion: 0.05
Nodes (36): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+28 more)

### Community 9 - "Extension Popup UI"
Cohesion: 0.06
Nodes (41): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+33 more)

### Community 15 - "Extension Import Settings"
Cohesion: 0.21
Nodes (9): tapHaptic(), FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps, Segment, SegmentedControl() (+1 more)

### Community 16 - "Vercel Deployment"
Cohesion: 0.12
Nodes (12): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, formatDay(), KeyOption, MONEY_OPTIONS, SORT_OPTIONS, SortField, STATUS_META (+4 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "Gemini Import Planning"
Cohesion: 0.23
Nodes (9): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, SheetPage() (+1 more)

### Community 20 - "PWA Icon 192"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "PWA Icon 512"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "Extension Packaging"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

### Community 23 - "Betclic Request Capture"
Cohesion: 0.32
Nodes (4): looksLikeBetsApi(), looksLikeIdentityApi(), report(), sniffIdentity()

### Community 24 - "Schema Migration Bootstrap"
Cohesion: 0.57
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 25 - "Canonical Database Schema"
Cohesion: 0.14
Nodes (18): accessFromRow(), AccessSource, AccessState, asDate(), iso(), loadAccess(), PLAN, Role (+10 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.14
Nodes (9): Bucket, rateLimit(), router, router, router, execFileAsync, extensionZipPath, gitBranch (+1 more)

### Community 29 - "vite.config.ssr.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 32 - "Betclic Content Bridge"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "bet"
Cohesion: 0.12
Nodes (11): appSources, en, errors, I18N_DIR, MIGRATED, pt, PT_WORD_RE, PT_WORDS (+3 more)

### Community 36 - "betStatus.ts"
Cohesion: 0.29
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "importers.test.js"
Cohesion: 0.22
Nodes (13): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+5 more)

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.21
Nodes (13): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), importKey(), persistMapped(), postBulk(), progress() (+5 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.31
Nodes (12): runSolverdeImport(), flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize() (+4 more)

### Community 85 - "import-utils.js"
Cohesion: 0.17
Nodes (15): app, AccountSheet(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin (+7 more)

### Community 86 - "rr"
Cohesion: 0.27
Nodes (6): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), tokenFromRequest(), router

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.33
Nodes (9): ensureCustomer(), getStripe(), isStripeConfigured(), periodEndOf(), priceOf(), saveStripeSubscription(), statusHandler(), stripeWebhook() (+1 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 91 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.24
Nodes (6): connect(), getPool(), query(), router, SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES

### Community 92 - "ExampleUnitTest.java"
Cohesion: 0.22
Nodes (4): getJwtSecret(), KNOWN_CLIENTS, router, signToken()

### Community 93 - "concat"
Cohesion: 0.25
Nodes (5): parseBetPayload(), ParsedPayload, router, trimOrNull(), VALID_FREEBET_TYPES

### Community 96 - "CLAUDE.md"
Cohesion: 0.25
Nodes (7): 1. How Betclic works today (the pattern to mirror), 2. Betano research findings (from the two HARs + code), 3. Open question to resolve live (HAR can't answer), 4. Implementation steps (mirror Betclic), 5. Testing, 6. Risks / notes, Plan: Automatic account switching for Betano (mirror Betclic)

### Community 97 - "build.gradle"
Cohesion: 0.50
Nodes (3): isLocalDb, pool, remove

### Community 101 - "settings.gradle"
Cohesion: 0.06
Nodes (48): parse(), now, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard() (+40 more)

### Community 104 - "l"
Cohesion: 0.07
Nodes (46): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), BookieAccountsCard() (+38 more)

### Community 109 - "Settings-B3PiUVnh.js"
Cohesion: 0.21
Nodes (12): ChipGroupProps, GalleryInner(), MobileBets, MobileDashboard, ListGroup(), ListItem(), ListItemProps, MobileCard() (+4 more)

### Community 115 - "N"
Cohesion: 0.05
Nodes (67): App(), AppProps, DesktopApp, Gallery, MobileApp, AccountPanel(), AccountPanelProps, AuthPage() (+59 more)

### Community 131 - "MobileDashboard.tsx"
Cohesion: 0.20
Nodes (6): MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS, TONES, TYPE_OPTIONS

### Community 133 - "Task 5 report — integrated selection rail"
Cohesion: 0.10
Nodes (20): Commands and results, Commands and results, Commands and results, Commands and results, Commands and results, Concerns, Desktop metric-alignment follow-up, Files changed (+12 more)

### Community 169 - "Task 4 Verification Report — 2026-07-24"
Cohesion: 0.15
Nodes (12): Automated verification, Diff and scope review, Focused integration review, Not performed, `npm run build`, `npm run lint`, `npm run test:unit`, Reducer and lifecycle (+4 more)

### Community 179 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android:open, android:sync, build, check:i18n, clean, dev, lint (+4 more)

### Community 182 - "ErrorBoundary"
Cohesion: 0.06
Nodes (56): AdminDashboard(), DeleteDialog(), GrantDialog(), TONE, TrialDialog(), ErrorBoundary, Props, State (+48 more)

### Community 191 - "File Structure"
Cohesion: 0.25
Nodes (7): File Structure, Global Constraints, Stable Summary Selection Layout Implementation Plan, Task 1: Add the Shared Selection-State Reducer, Task 2: Route Desktop and Mobile Selection Through the Reducer, Task 3: Fill the Fixed Summary and Conditionally Reveal Compact Actions, Task 4: Full Verification and Responsive Visual Check

### Community 192 - "ensureBetanoHistoryTab"
Cohesion: 0.25
Nodes (7): ensureBetanoHistoryTab(), findBetanoTab(), isBetanoHistoryTab(), isBetanoSettledTab(), settledHistoryUrl(), waitForTabComplete(), betanoHistoryStart()

### Community 195 - "vercel.json"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

### Community 200 - "Filtered Bets Financial Summary Design"
Cohesion: 0.29
Nodes (6): Architecture, Calculation Rules, Chosen Experience, Filtered Bets Financial Summary Design, Goal, Validation

### Community 201 - "Bets Selection Interactions Design"
Cohesion: 0.29
Nodes (6): Accessibility and Testing, Bets Selection Interactions Design, Component Boundaries, Desktop, Goal, Mobile Long-Press

### Community 203 - "Task 3 Report — Stable Summary Layout"
Cohesion: 0.29
Nodes (6): Changes, Notes, Status, Task 3 Report — Stable Summary Layout, TDD Evidence, Verification

### Community 207 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Filtered Bets Financial Summary Implementation Plan, Global Constraints, Task 1: Create the reusable summary calculation, Task 2: Render the shared Portuguese summary in both `/bets` layouts, Task 3: Verify the feature end to end

### Community 208 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Bets Selection Interactions Implementation Plan, Global Constraints, Task 1: Mobile long-press selection, Task 2: Animated merged desktop summary bar, Task 3: Pointer-safe desktop focus and full verification

### Community 209 - "Stable Summary Selection Layout Design"
Cohesion: 0.33
Nodes (5): Approved behavior, Console findings, Goal, Stable Summary Selection Layout Design, Testing

### Community 210 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 211 - "Task 6 report — selection detail and card motion"
Cohesion: 0.33
Nodes (5): Concerns, Files changed, Self-review, Task 6 report — selection detail and card motion, Test-first record

### Community 218 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 219 - "Task 5 — Approved integrated selection rail"
Cohesion: 0.40
Nodes (4): Requirements, Scope, Task 5 — Approved integrated selection rail, Test-first requirement

### Community 221 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 224 - "Global Constraints"
Cohesion: 0.50
Nodes (3): Global Constraints, Selection Detail and Card Motion Implementation Plan, Task 1: Selection details and desktop card motion

### Community 225 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 226 - "Final Fix Report"
Cohesion: 0.50
Nodes (3): Final Fix Report, Scope, Verification

## Knowledge Gaps
- **456 isolated node(s):** `config`, `manifest_version`, `name`, `version`, `description` (+451 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **76 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ScreenshotImporter()` connect `Bet Lifecycle UI` to `l`, `App Shell and State`, `Runtime Dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `response()` connect `Bet Lifecycle UI` to `Schema Migration Bootstrap`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `package.json`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `config`, `manifest_version`, `name` to the rest of the system?**
  _456 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bet Lifecycle UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07150153217568948 - nodes in this community are weakly interconnected._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._
- **Should `App Shell and State` be split into smaller, more focused modules?**
  _Cohesion score 0.07228915662650602 - nodes in this community are weakly interconnected._