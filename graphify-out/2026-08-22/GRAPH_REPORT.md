# Graph Report - gestão-de-apostas  (2026-08-22)

## Corpus Check
- 211 files · ~222,809 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1404 nodes · 2967 edges · 166 communities (88 shown, 78 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `33137576`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- background.js
- authFetch
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
- index.ts
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
- MobileInsights.tsx
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
- MobileApp.tsx
- index.tsx
- billingRoutes.ts
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- adm-zip
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- Plan: Automatic account switching for Betano (mirror Betclic)
- make-admin.mjs
- AGENTS.md
- tailwindcss
- BetsManager.tsx
- MobileSettings.tsx
- @tailwindcss/vite
- @types/jsonwebtoken
- tsx
- MobileAdmin.tsx
- @types/node
- typescript
- vite-plugin-pwa
- @vitejs/plugin-react
- App.tsx
- bookie_accounts
- haptics.ts
- daily_insights
- MobileDashboard.tsx
- Task 5 report — integrated selection rail
- Task 4 Verification Report — 2026-07-24
- scripts
- useI18n
- File Structure
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
- gradlew
- Global Constraints
- persistMapped
- Final Fix Report
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
1. `useI18n()` - 71 edges
2. `authFetch()` - 48 edges
3. `parseJsonResponse()` - 47 edges
4. `isNativeApp()` - 36 edges
5. `Bet` - 36 edges
6. `safeNum()` - 25 edges
7. `BookieAccount` - 23 edges
8. `App()` - 20 edges
9. `TKey` - 19 edges
10. `useToast()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `parse()` --calls--> `readFilters()`  [EXTRACTED]
  extension/test/filter-params.test.ts → src/lib/filterParams.ts
- `presentUser()` --calls--> `accessFromRow()`  [EXTRACTED]
  routes/adminRoutes.ts → lib/entitlements.ts
- `parseBetPayload()` --calls--> `normalizeBetStatus()`  [EXTRACTED]
  routes/betsRoutes.ts → src/lib/betStatus.ts
- `Pre-Mount Theme Bootstrap` --shares_data_with--> `Browser Token User Cache and Preferences`  [INFERRED]
  index.html → README.md
- `requireAdmin()` --calls--> `isStaff()`  [EXTRACTED]
  middleware/accessMiddleware.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (166 total, 78 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.06
Nodes (71): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), BetsManagerProps (+63 more)

### Community 1 - "background.js"
Cohesion: 0.09
Nodes (36): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab(), extensionStatus() (+28 more)

### Community 2 - "authFetch"
Cohesion: 0.11
Nodes (50): Social(), SocialProps, statusMeta(), useAccounts(), useBets(), useLanguageSync(), ApiAccountRow, createAccount() (+42 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, esbuild, devDependencies, @capacitor/cli, esbuild, @types/express, @types/pg, @types/react (+5 more)

### Community 5 - "insightsRoutes.ts"
Cohesion: 0.14
Nodes (23): extractJson(), getGeminiClient(), tryParse(), buildEvalPrompt(), buildEvalSummary(), buildPrompt(), callEvalModel(), callModel() (+15 more)

### Community 6 - "mapper.js"
Cohesion: 0.28
Nodes (14): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+6 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "host_permissions"
Cohesion: 0.05
Nodes (36): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+28 more)

### Community 9 - "popup.js"
Cohesion: 0.06
Nodes (41): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+33 more)

### Community 15 - "index.ts"
Cohesion: 0.21
Nodes (11): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.12
Nodes (14): money(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, formatDay(), KeyOption, MobileBets(), MONEY_OPTIONS, SORT_OPTIONS (+6 more)

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
Nodes (24): accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, iso(), isStaff(), loadAccess() (+16 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.10
Nodes (13): connect(), getPool(), query(), Bucket, rateLimit(), router, router, router (+5 more)

### Community 29 - "MobileInsights.tsx"
Cohesion: 0.10
Nodes (31): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), AIInsights (+23 more)

### Community 30 - "users"
Cohesion: 0.20
Nodes (11): friendships, bookie_accounts, admin_audit_log, subscriptions, admin_audit_log, bets, bookie_accounts, daily_insights (+3 more)

### Community 32 - "content-betclic.js"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "check-i18n.mjs"
Cohesion: 0.12
Nodes (11): appSources, en, errors, I18N_DIR, MIGRATED, pt, PT_WORD_RE, PT_WORDS (+3 more)

### Community 36 - "mapper-betano.js"
Cohesion: 0.28
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "importers.test.js"
Cohesion: 0.20
Nodes (15): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets() (+7 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "MobileApp.tsx"
Cohesion: 0.22
Nodes (9): MobileApp, runTopBackHandler(), exitNativeApp(), MobileBets, MobileDashboard, MobileImport, MobileSettings, MobileShell() (+1 more)

### Community 86 - "index.tsx"
Cohesion: 0.11
Nodes (28): ErrorBoundary, Props, State, storedLanguage(), EN, buildValue(), DICTS, I18nContext (+20 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.25
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
Cohesion: 0.13
Nodes (12): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+4 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.24
Nodes (6): BET_SELECT_COLUMNS, parseBetPayload(), ParsedPayload, router, trimOrNull(), VALID_FREEBET_TYPES

### Community 96 - "Plan: Automatic account switching for Betano (mirror Betclic)"
Cohesion: 0.25
Nodes (7): 1. How Betclic works today (the pattern to mirror), 2. Betano research findings (from the two HARs + code), 3. Open question to resolve live (HAR can't answer), 4. Implementation steps (mirror Betclic), 5. Testing, 6. Risks / notes, Plan: Automatic account switching for Betano (mirror Betclic)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 101 - "BetsManager.tsx"
Cohesion: 0.06
Nodes (47): parse(), now, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard() (+39 more)

### Community 104 - "MobileSettings.tsx"
Cohesion: 0.07
Nodes (43): INCLUDED, PaywallNotice(), PaywallNoticeProps, INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, ERROR_KEYS (+35 more)

### Community 109 - "MobileAdmin.tsx"
Cohesion: 0.14
Nodes (16): AccountSheet(), MobileAdmin, MobileAdminProps, Sheet, TONE, GalleryInner(), MobileBets, MobileDashboard (+8 more)

### Community 115 - "App.tsx"
Cohesion: 0.05
Nodes (60): App(), AppProps, DesktopApp, Gallery, AccountPanel(), AccountPanelProps, AuthPage(), handleSubmit() (+52 more)

### Community 118 - "haptics.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 131 - "MobileDashboard.tsx"
Cohesion: 0.17
Nodes (9): MobileDashboard(), MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS, toKey(), TONES, TYPE_OPTIONS (+1 more)

### Community 133 - "Task 5 report — integrated selection rail"
Cohesion: 0.10
Nodes (20): Commands and results, Commands and results, Commands and results, Commands and results, Commands and results, Concerns, Desktop metric-alignment follow-up, Files changed (+12 more)

### Community 169 - "Task 4 Verification Report — 2026-07-24"
Cohesion: 0.15
Nodes (12): Automated verification, Diff and scope review, Focused integration review, Not performed, `npm run build`, `npm run lint`, `npm run test:unit`, Reducer and lifecycle (+4 more)

### Community 179 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android:open, android:sync, build, check:i18n, clean, dev, lint (+4 more)

### Community 182 - "useI18n"
Cohesion: 0.11
Nodes (36): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), PasswordCard() (+28 more)

### Community 191 - "File Structure"
Cohesion: 0.25
Nodes (7): File Structure, Global Constraints, Stable Summary Selection Layout Implementation Plan, Task 1: Add the Shared Selection-State Reducer, Task 2: Route Desktop and Mobile Selection Through the Reducer, Task 3: Fill the Fixed Summary and Conditionally Reveal Compact Actions, Task 4: Full Verification and Responsive Visual Check

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

### Community 225 - "persistMapped"
Cohesion: 0.14
Nodes (17): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), fetchSolverdeBets(), importKey(), needsUpdate(), persistMapped() (+9 more)

### Community 226 - "Final Fix Report"
Cohesion: 0.50
Nodes (3): Final Fix Report, Scope, Verification

## Knowledge Gaps
- **453 isolated node(s):** `config`, `daily_insights`, `daily_insights`, `manifest_version`, `name` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useI18n()` connect `useI18n` to `types.ts`, `authFetch`, `MobileDashboard.tsx`, `BetsManager.tsx`, `MobileSettings.tsx`, `MobileAdmin.tsx`, `MobileBets.tsx`, `App.tsx`, `index.tsx`, `MobileInsights.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `normalizeBetStatus()` connect `types.ts` to `authFetch`, `betsRoutes.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `isNativeApp()` connect `MobileSettings.tsx` to `types.ts`, `MobileInsights.tsx`, `MobileApp.tsx`, `haptics.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `config`, `daily_insights`, `daily_insights` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05979843225083987 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Should `authFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.10655737704918032 - nodes in this community are weakly interconnected._