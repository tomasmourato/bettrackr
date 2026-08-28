# Graph Report - bettrackr  (2026-08-28)

## Corpus Check
- 208 files · ~228,267 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1380 nodes · 3207 edges · 161 communities (88 shown, 73 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd530f74`
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
- billingApi.ts
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
- Settings.tsx
- billingRoutes.ts
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- BetclicImport.tsx
- authMiddleware.ts
- betsRoutes.ts
- MainActivity.java
- capacitor.config.ts
- settingsApi.ts
- make-admin.mjs
- AGENTS.md
- tailwindcss
- Dashboard.tsx
- BetsManager.tsx
- useI18n
- @tailwindcss/vite
- @types/jsonwebtoken
- tsx
- index.ts
- @types/node
- typescript
- vite-plugin-pwa
- @vitejs/plugin-react
- App.tsx
- pool.ts
- selectionHaptic
- clv.ts
- daily_insights
- MobileDashboard.tsx
- persistMapped
- MobileSettings.tsx
- safeNum
- haptics.ts
- esbuild
- index.tsx
- bankroll.ts
- LongPressController
- dataTransfer.ts
- bookie_accounts
- useChangePassword.ts
- platform.ts
- run-migration.mjs
- i18n-labels.test.ts
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
4. `Bet` - 53 edges
5. `isNativeApp()` - 36 edges
6. `safeNum()` - 35 edges
7. `BookieAccount` - 23 edges
8. `App()` - 22 edges
9. `BetStatus` - 20 edges
10. `BankrollMovement` - 20 edges

## Surprising Connections (you probably didn't know these)
- `runImport()` --calls--> `importBetsFromFile()`  [EXTRACTED]
  extension/test/bankroll-backup.test.ts → src/lib/dataTransfer.ts
- `parse()` --calls--> `readFilters()`  [EXTRACTED]
  extension/test/filter-params.test.ts → src/lib/filterParams.ts
- `presentUser()` --calls--> `accessFromRow()`  [EXTRACTED]
  routes/adminRoutes.ts → lib/entitlements.ts
- `requireAdmin()` --calls--> `loadAccess()`  [EXTRACTED]
  middleware/accessMiddleware.ts → lib/entitlements.ts
- `requireFounder()` --calls--> `loadAccess()`  [EXTRACTED]
  middleware/accessMiddleware.ts → lib/entitlements.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (161 total, 73 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.14
Nodes (26): ScreenshotImporter(), ScreenshotImporterProps, FormSelection, nowLocal(), useBetForm(), AVAILABLE_BOOKMAKERS, Bookmaker, bookmakerByName() (+18 more)

### Community 1 - "background.js"
Cohesion: 0.09
Nodes (36): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab(), exchangeForExtensionToken() (+28 more)

### Community 2 - "authFetch"
Cohesion: 0.07
Nodes (72): AccountPanel(), AccountPanelProps, AuthPage(), handleSubmit(), AuthPageProps, Mode, Social(), SocialProps (+64 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, adm-zip, @capacitor/cli, @types/express, @types/pg, @types/react, @types/react-dom (+5 more)

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
Nodes (37): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+29 more)

### Community 9 - "popup.js"
Cohesion: 0.06
Nodes (42): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+34 more)

### Community 15 - "billingApi.ts"
Cohesion: 0.18
Nodes (11): ERROR_KEYS, getToken(), AccessSource, BillingError, fetchBillingStatusOrNull(), goToStripe(), openBillingPortal(), requestUrl() (+3 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.10
Nodes (19): BetSelectionAction, betSelectionReducer(), BetSelectionState, INITIAL_BET_SELECTION_STATE, createLongPressController(), LongPressOptions, TimerHandle, BULK_MONEY_OPTIONS (+11 more)

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
Nodes (21): accessFromRow(), AccessSource, AccessState, asDate(), ENTITLED_SQL, iso(), isStaff(), PLAN (+13 more)

### Community 27 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "server.ts"
Cohesion: 0.12
Nodes (9): Bucket, rateLimit(), router, router, app, execFileAsync, extensionZipPath, gitBranch (+1 more)

### Community 29 - "MobileInsights.tsx"
Cohesion: 0.11
Nodes (28): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), AIInsights (+20 more)

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

### Community 37 - "importers.test.js"
Cohesion: 0.20
Nodes (15): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets() (+7 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "MobileApp.tsx"
Cohesion: 0.16
Nodes (13): MobileApp, BrandMark(), runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileAdmin (+5 more)

### Community 86 - "Settings.tsx"
Cohesion: 0.21
Nodes (21): BankrollCard(), BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCard(), BookieAccountsCardProps, DashboardBetsFilters (+13 more)

### Community 87 - "billingRoutes.ts"
Cohesion: 0.25
Nodes (13): loadAccess(), accessEndsAt(), cancelStripeSubscription(), ensureCustomer(), getStripe(), isEnding(), isStripeConfigured(), periodEndOf() (+5 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 91 - "BetclicImport.tsx"
Cohesion: 0.14
Nodes (16): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), InstallSteps(), loadAccountChoices(), EnabledBookmakersCard() (+8 more)

### Community 92 - "authMiddleware.ts"
Cohesion: 0.11
Nodes (14): authenticatedUserFromRequest(), authenticateToken(), cookieValue(), getJwtSecret(), SESSION_COOKIE, tokenFromRequest(), getJwtSecret(), KNOWN_CLIENTS (+6 more)

### Community 93 - "betsRoutes.ts"
Cohesion: 0.20
Nodes (8): BET_SELECT_COLUMNS, requireSubscription(), requireSubscriptionForExtension(), parseBetPayload(), ParsedPayload, router, trimOrNull(), VALID_FREEBET_TYPES

### Community 96 - "settingsApi.ts"
Cohesion: 0.35
Nodes (9): Settings(), useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_BOOKMAKERS, SUPPORTED_LANGUAGES, updateEnabledBookmakers() (+1 more)

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 101 - "Dashboard.tsx"
Cohesion: 0.13
Nodes (28): parse(), now, BetsManager(), Dashboard(), FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor() (+20 more)

### Community 102 - "BetsManager.tsx"
Cohesion: 0.14
Nodes (14): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FilteredBetsSummary(), FilteredBetsSummaryProps, money(), FiltersBar() (+6 more)

### Community 104 - "useI18n"
Cohesion: 0.12
Nodes (27): DeleteDialog(), GrantDialog(), RevokeDialog(), TrialDialog(), FreebetAsterisk(), INCLUDED, PaywallNotice(), PaywallNoticeProps (+19 more)

### Community 109 - "index.ts"
Cohesion: 0.24
Nodes (12): AccountSheet(), GalleryInner(), MobileBets, MobileDashboard, ListGroup(), ListItem(), ListItemProps, MobileCard() (+4 more)

### Community 115 - "App.tsx"
Cohesion: 0.09
Nodes (32): App(), AppProps, DesktopApp, Gallery, BetsManager, Dashboard, DesktopApp(), ScreenshotImporter (+24 more)

### Community 116 - "pool.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 117 - "selectionHaptic"
Cohesion: 0.32
Nodes (6): selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps, SwipeAction

### Community 118 - "clv.ts"
Cohesion: 0.20
Nodes (16): NOW, betClv(), calculateClv(), ClvBetResult, ClvBookmakerRow, ClvPoint, ClvSummary, dayOf() (+8 more)

### Community 131 - "MobileDashboard.tsx"
Cohesion: 0.11
Nodes (15): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MobileDashboard, MobileDashboard(), MONEY_OPTIONS, STATUS_META (+7 more)

### Community 133 - "persistMapped"
Cohesion: 0.14
Nodes (17): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), fetchSolverdeBets(), importKey(), needsUpdate(), persistMapped() (+9 more)

### Community 136 - "MobileSettings.tsx"
Cohesion: 0.26
Nodes (10): API_BASE, configured, isNativeApp(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), getBundleVersion(), initLiveUpdate() (+2 more)

### Community 137 - "safeNum"
Cohesion: 0.33
Nodes (7): ClosingOddsModal(), ClosingOddsModalProps, describe(), MemberProfile(), MemberProfileProps, statusMeta(), safeNum()

### Community 138 - "haptics.ts"
Cohesion: 0.11
Nodes (20): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), tapHaptic(), FAB(), FABProps, ChipOption (+12 more)

### Community 140 - "index.tsx"
Cohesion: 0.10
Nodes (30): ErrorBoundary, Props, State, storedLanguage(), EN, buildValue(), DICTS, I18nContext (+22 more)

### Community 141 - "bankroll.ts"
Cohesion: 0.23
Nodes (9): calculateBankroll(), countsTowardsBalance(), countsTowardsExposure(), dayOf(), Event, round2(), toTimestamp(), BankrollMovementKind (+1 more)

### Community 143 - "dataTransfer.ts"
Cohesion: 0.13
Nodes (15): runImport(), umaAposta, CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), STATUS_ALIASES (+7 more)

### Community 145 - "useChangePassword.ts"
Cohesion: 0.38
Nodes (5): PasswordCard(), PasswordCardProps, ERROR_KEYS, MIN_PASSWORD_LENGTH, useChangePassword()

### Community 146 - "platform.ts"
Cohesion: 0.70
Nodes (4): readOverride(), shouldUseMobileUI(), UiOverride, useMobileUI()

### Community 179 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android:open, android:sync, build, check:i18n, clean, dev, lint (+4 more)

### Community 182 - "MobileAdmin.tsx"
Cohesion: 0.13
Nodes (33): AdminDashboard(), AdminDashboardProps, TONE, AdminDashboard, useAdminPanel(), AdminAuditEntry, AdminOverview, AdminUser (+25 more)

### Community 195 - "vercel.json"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

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
- **394 isolated node(s):** `config`, `daily_insights`, `daily_insights`, `manifest_version`, `name` (+389 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useI18n()` connect `useI18n` to `types.ts`, `settingsApi.ts`, `authFetch`, `MobileDashboard.tsx`, `Dashboard.tsx`, `BetsManager.tsx`, `MobileSettings.tsx`, `safeNum`, `index.tsx`, `billingApi.ts`, `MobileBets.tsx`, `useChangePassword.ts`, `Settings.tsx`, `MobileAdmin.tsx`, `clv.ts`, `BetclicImport.tsx`, `MobileInsights.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Bet` connect `Settings.tsx` to `types.ts`, `authFetch`, `MobileDashboard.tsx`, `Dashboard.tsx`, `BetsManager.tsx`, `MobileSettings.tsx`, `safeNum`, `bankroll.ts`, `dataTransfer.ts`, `MobileBets.tsx`, `App.tsx`, `clv.ts`, `MobileAdmin.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `normalizeBetStatus()` connect `dataTransfer.ts` to `types.ts`, `authFetch`, `betsRoutes.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `config`, `daily_insights`, `daily_insights` to the rest of the system?**
  _394 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14082503556187767 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08658536585365853 - nodes in this community are weakly interconnected._
- **Should `authFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.0696629213483146 - nodes in this community are weakly interconnected._