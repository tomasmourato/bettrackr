# Graph Report - bettrackr  (2026-08-28)

## Corpus Check
- 208 files · ~228,513 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1381 nodes · 3210 edges · 162 communities (89 shown, 73 thin omitted)
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
- PaywallNotice.tsx
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
- navigation.ts
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
- billingApi.ts
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
- MobileSubscription.tsx
- Language
- @types/jsonwebtoken
- tsx
- Gallery.tsx
- @types/node
- typescript
- vite-plugin-pwa
- @vitejs/plugin-react
- App.tsx
- pool.ts
- index.ts
- safeNum
- daily_insights
- MobileDashboard.tsx
- Toast.tsx
- isNativeApp
- filterParams.ts
- haptics.ts
- esbuild
- index.tsx
- ErrorBoundary.tsx
- LongPressController
- ensureBetanoHistoryTab
- bookie_accounts
- authApi.ts
- AuthPage.tsx
- run-migration.mjs
- i18n-labels.test.ts
- adm-zip
- scripts
- useI18n
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

## Communities (162 total, 73 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.05
Nodes (85): runImport(), umaAposta, BankrollCard(), BankrollCardProps, KINDS, todayKey(), BetsManagerProps, BookieAccountsCard() (+77 more)

### Community 1 - "background.js"
Cohesion: 0.08
Nodes (46): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), exchangeForExtensionToken() (+38 more)

### Community 2 - "authFetch"
Cohesion: 0.06
Nodes (79): AIInsights(), AIInsightsProps, AiProgress(), ConfidenceDots(), InsightsResponse, Pick, toneClasses(), Social() (+71 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (47): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+39 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, @capacitor/cli, @tailwindcss/vite, @types/express, @types/pg, @types/react, @types/react-dom (+5 more)

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

### Community 15 - "PaywallNotice.tsx"
Cohesion: 0.23
Nodes (10): INCLUDED, PaywallNotice(), PaywallNoticeProps, ERROR_KEYS, useBillingActions(), BillingError, goToStripe(), openBillingPortal() (+2 more)

### Community 16 - "MobileBets.tsx"
Cohesion: 0.12
Nodes (13): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, CLV_OPTIONS, formatDay(), KeyOption, MONEY_OPTIONS, SORT_OPTIONS, SortField (+5 more)

### Community 18 - "inject-betano.js"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "Pressable"
Cohesion: 0.16
Nodes (12): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, ListItemProps (+4 more)

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

### Community 29 - "navigation.ts"
Cohesion: 0.13
Nodes (17): DesktopApp, AdminDashboard, BetsManager, Dashboard, DesktopApp(), ScreenshotImporter, Settings, Social (+9 more)

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
Cohesion: 0.22
Nodes (9): MobileApp, runTopBackHandler(), exitNativeApp(), MobileBets, MobileDashboard, MobileImport, MobileSettings, MobileShell() (+1 more)

### Community 86 - "billingApi.ts"
Cohesion: 0.24
Nodes (7): useSubscription(), getToken(), isAuthenticated(), AccessSource, fetchBillingStatus(), fetchBillingStatusOrNull(), SubscriptionRequiredError

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
Cohesion: 0.50
Nodes (6): useLanguageSync(), fetchSettings(), normalizeLanguage(), normalizeSettings(), SUPPORTED_LANGUAGES, updateLanguage()

### Community 97 - "make-admin.mjs"
Cohesion: 0.40
Nodes (4): founder, isLocalDb, pool, remove

### Community 101 - "Dashboard.tsx"
Cohesion: 0.16
Nodes (18): now, FilterDropdown(), FilterDropdownOption, FilterDropdownProps, calendarDaysFor(), EMPTY_TIMEFRAME_FILTER, formatDateKey(), fromLocalDateKey() (+10 more)

### Community 102 - "BetsManager.tsx"
Cohesion: 0.12
Nodes (19): BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, FiltersBar(), FiltersBarProps, BetSelectionAction (+11 more)

### Community 104 - "MobileSubscription.tsx"
Cohesion: 0.17
Nodes (15): INCLUDED, SubscriptionCard(), SubscriptionCardProps, TONE_BADGE, CheckoutOutcome, useCheckoutReturn(), DATE_FORMAT, daysUntil() (+7 more)

### Community 105 - "Language"
Cohesion: 0.27
Nodes (8): AccountPanel(), AccountPanelProps, CurrentUser, I18nValue, TFn, UserSettings, AccountSheetProps, Language

### Community 109 - "Gallery.tsx"
Cohesion: 0.23
Nodes (9): Gallery, AccountSheet(), GalleryInner(), MobileBets, MobileDashboard, ListGroup(), ListItem(), useToast() (+1 more)

### Community 115 - "App.tsx"
Cohesion: 0.18
Nodes (14): App(), AppProps, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, detectLanguage(), loadPreferences(), usePreferences() (+6 more)

### Community 116 - "pool.ts"
Cohesion: 0.20
Nodes (6): connect(), getPool(), query(), Kind, router, VALID_KINDS

### Community 117 - "index.ts"
Cohesion: 0.29
Nodes (7): selectionHaptic(), ChipGroupProps, PullToRefresh(), PullToRefreshProps, SwipeableRow(), SwipeableRowProps, SwipeAction

### Community 118 - "safeNum"
Cohesion: 0.16
Nodes (23): NOW, ClosingOddsModal(), ClosingOddsModalProps, describe(), Dashboard(), betClv(), calculateClv(), ClvBetResult (+15 more)

### Community 131 - "MobileDashboard.tsx"
Cohesion: 0.14
Nodes (13): MobileDashboard, MobileMemberProfile(), MobileMemberProfileProps, statusMeta(), MONEY_OPTIONS, STATUS_META, Timeframe, TIMEFRAME_OPTIONS (+5 more)

### Community 133 - "Toast.tsx"
Cohesion: 0.22
Nodes (9): haptics(), notifyHaptic(), ACCENT, ICONS, ToastApi, ToastContext, ToastKind, ToastProvider() (+1 more)

### Community 136 - "isNativeApp"
Cohesion: 0.16
Nodes (13): API_BASE, configured, isNativeApp(), getBundleVersion(), initLiveUpdate(), readOverride(), shouldUseMobileUI(), UiOverride (+5 more)

### Community 137 - "filterParams.ts"
Cohesion: 0.42
Nodes (7): parse(), isTimeframe(), TimeframeFilterValue, BetFilters, EMPTY_BET_FILTERS, readFilters(), serializeFilters()

### Community 138 - "haptics.ts"
Cohesion: 0.17
Nodes (11): ImpactWeight, NotificationKind, tapHaptic(), FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 140 - "index.tsx"
Cohesion: 0.18
Nodes (20): EN, buildValue(), DICTS, I18nContext, I18nProvider(), interpolate(), pick(), translate() (+12 more)

### Community 141 - "ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, State, storedLanguage()

### Community 143 - "ensureBetanoHistoryTab"
Cohesion: 0.29
Nodes (7): ensureBetanoHistoryTab(), findBetanoTab(), isBetanoHistoryTab(), isBetanoSettledTab(), settledHistoryUrl(), waitForTabComplete(), betanoHistoryStart()

### Community 145 - "authApi.ts"
Cohesion: 0.21
Nodes (16): handleSubmit(), ERROR_KEYS, MIN_PASSWORD_LENGTH, apiUrl(), AuthError, changePassword(), clearToken(), errorFrom() (+8 more)

### Community 146 - "AuthPage.tsx"
Cohesion: 0.33
Nodes (4): AuthPage(), AuthPageProps, Mode, BrandMark()

### Community 179 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android:open, android:sync, build, check:i18n, clean, dev, lint (+4 more)

### Community 182 - "useI18n"
Cohesion: 0.09
Nodes (44): AdminDashboard(), AdminDashboardProps, DeleteDialog(), GrantDialog(), RevokeDialog(), TONE, TrialDialog(), MemberProfile() (+36 more)

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
- **395 isolated node(s):** `config`, `daily_insights`, `daily_insights`, `manifest_version`, `name` (+390 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useI18n()` connect `useI18n` to `types.ts`, `authFetch`, `MobileDashboard.tsx`, `Dashboard.tsx`, `BetsManager.tsx`, `MobileSubscription.tsx`, `index.tsx`, `PaywallNotice.tsx`, `MobileBets.tsx`, `authApi.ts`, `AuthPage.tsx`, `safeNum`, `BetclicImport.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `normalizeBetStatus()` connect `types.ts` to `authFetch`, `betsRoutes.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Bet` connect `types.ts` to `authFetch`, `MobileDashboard.tsx`, `Dashboard.tsx`, `BetsManager.tsx`, `MobileBets.tsx`, `App.tsx`, `useI18n`, `safeNum`, `navigation.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `config`, `daily_insights`, `daily_insights` to the rest of the system?**
  _395 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05369946605644546 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07616892911010557 - nodes in this community are weakly interconnected._
- **Should `authFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.06099656357388316 - nodes in this community are weakly interconnected._