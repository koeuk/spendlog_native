# SpendLog Native — Development Plan

A React Native client for the SpendLog API (`../spendlog`, `/api/v1`). It is the
third client after the Vue web app and the Flutter app in `../spendlog_app`, so
nothing here invents behaviour: every screen, rule and edge case already exists
on the server and is documented in `../spendlog/docs/API.md`. When this plan and
that file disagree, the API doc wins.

The Flutter app is the parity target. Its screen list, tab layout, glass visual
system and Khmer dictionary are reused here, only the technology changes.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 57** (`create-expo-app` default template: Expo Router, React 19, RN 0.86, React Compiler on) + **TypeScript 6** | Runs in Expo Go on a phone with zero native setup. This machine has Node 22, an Android SDK and `adb`, but **no Java on PATH**, so native builds are a later step, not a day-one blocker. |
| Navigation | **Expo Router** (file-based, `Tabs` with a nested `Stack` per tab) | Same shape as the Flutter `StatefulShellRoute`: five tabs, each keeping its own stack. |
| HTTP | **axios** | Interceptors map 1:1 to the Flutter `ApiClient`: bearer header, `Accept-Language`, 401 → sign out. |
| Server state | **@tanstack/react-query** | Query keys per resource; one mutation invalidates dashboard, expenses and budgets together, the way the Flutter providers do. |
| Client state | **zustand** | Three small stores: session, locale, theme. |
| Token storage | **expo-secure-store** | Keychain / Keystore, like `flutter_secure_storage`. |
| Preferences | **@react-native-async-storage/async-storage** | Locale and theme choice. |
| Forms | a small `useForm` hook (`src/hooks/useForm.ts`) | Values, per-field errors, and a submit that maps a `422` onto the fields and anything else onto a toast. react-hook-form and zod were installed and then dropped: the sheets are small enough that they only added machinery. |
| Sheets | **@gorhom/bottom-sheet** (reanimated + gesture-handler ship with the template) | Every create/edit form is a bottom sheet, as in Flutter. |
| Look | plain `StyleSheet` tokens (`src/theme`) | The Flutter app's current design is flat: solid cards over a grey ground, a hairline tab bar, solid sheets. No blur or gradient is needed, so expo-blur was dropped. |
| Charts | plain `View` bars (`SpendingChart`) | The Flutter app draws its own `spending_chart.dart`; bars are just views, so no chart library. react-native-svg stays only because Lucide icons need it. |
| Fonts | **expo-font** + `@expo-google-fonts/inter`, `@expo-google-fonts/noto-sans-khmer` | Inter for Latin, a Khmer-capable face when the locale is `km`. |
| Dates | **dayjs** (with the `km` locale) | Month stepping, `YYYY-MM` keys, day-group headers. |
| Files | **expo-file-system**, **expo-sharing**, **expo-image-picker** | Report export to the share sheet; avatar upload. |
| Tests | **jest-expo**, **@testing-library/react-native** | Unit tests for the API client, formatters and hooks. |

Not used: Redux (too heavy for three stores), i18next (English keys + one
Khmer JSON is all the web and Flutter apps do), a chart library, NativeWind
(the design is a handful of tokens, plain `StyleSheet` keeps blur/gradient
layering readable).

## Reaching the backend

| Where the app runs | Base URL |
|---|---|
| Android emulator | `http://10.0.2.2:8000/api/v1` |
| iOS simulator / Expo web | `http://127.0.0.1:8000/api/v1` |
| Real phone on the same Wi-Fi (Expo Go) | `http://<PC LAN IP>:8000/api/v1` — derived at runtime from `Constants.expoConfig.hostUri`, which is the Metro host the phone already reached |
| Deployed | `EXPO_PUBLIC_API_URL` in `.env` |

- The backend's `.env` says `APP_URL=http://127.0.0.1:8000`; `composer dev` runs
  `php artisan serve` on that port. The Flutter app defaulted to `8001` because
  this machine has run several Laravel apps at once — the wrong port fails as a
  *login error*, not a connection error, so make the port a visible setting.
- For a real phone the backend must listen on the LAN:
  `php artisan serve --host=0.0.0.0 --port=8000`.
- CORS only matters for Expo web; the backend defaults `CORS_ALLOWED_ORIGINS` to `*`.
- Login is throttled at 5/minute per email+IP. During development sign in once
  and let the stored token carry the session.

## Folder layout

```
spendlog_native/
  app/                          # Expo Router routes only — no logic here
    _layout.tsx                 # providers, fonts, splash, session gate
    (auth)/login.tsx
    (auth)/register.tsx         # optional — API supports it, Flutter app skipped it
    (auth)/forgot-password.tsx
    (auth)/reset-password.tsx
    (app)/_layout.tsx           # Tabs: Dashboard, Expenses, Budgets, Reports, Profile
    (app)/(dashboard)/_layout.tsx   # Stack
    (app)/(dashboard)/index.tsx
    (app)/(dashboard)/income.tsx
    (app)/(dashboard)/recurring.tsx
    (app)/(dashboard)/savings.tsx
    (app)/(dashboard)/borrowings/index.tsx
    (app)/(dashboard)/borrowings/[uuid].tsx
    (app)/expenses.tsx
    (app)/budgets.tsx
    (app)/reports.tsx
    (app)/(profile)/_layout.tsx     # Stack
    (app)/(profile)/index.tsx
    (app)/(profile)/categories.tsx
    (app)/(profile)/activity.tsx
    (app)/(profile)/admin-users.tsx
    (app)/(profile)/admin-settings.tsx
    (forms)/_layout.tsx             # Stack above the tabs: full-screen create / edit pages
    (forms)/expense-form.tsx        # ?uuid= edits; expenses, income, savings and borrowing
    (forms)/income-form.tsx         #   open as pages with a back button and title, not sheets
    (forms)/savings-plan-form.tsx   # ?month=
    (forms)/savings-entry-form.tsx  # ?month=&uuid=
    (forms)/borrowing-form.tsx
    (forms)/repayment-form.tsx      # ?uuid=<borrowing>
  src/
    api/client.ts               # axios instance, interceptors, apiErrorMessage()
    api/env.ts                  # base URL resolution (table above)
    api/endpoints/*.ts          # one file per resource: expenses.ts, incomes.ts …
    types/*.ts                  # TS mirrors of the API resources
    hooks/*.ts                  # useExpenses, useCreateExpense … (react-query)
    store/session.ts, locale.ts, theme.ts
    theme/tokens.ts, glass.ts   # colours, radii, blur presets
    i18n/index.ts, km.json      # t(key) — English key, Khmer value
    components/                 # FormScreen (the create / edit frame), PillButton, MoneyInput, MonthStepper …
    forms/                      # ExpenseForm, IncomeForm, SavingsPlanForm, SavingsEntryForm, BorrowingForm,
                                # RepaymentForm — the bodies the (forms) pages render
    sheets/                     # Still bottom sheets: BudgetSheet, RecurringFormSheet, CategoryFormSheet,
                                # FaqSheet, AdminUserSheet, ProfileSheet, PasswordSheet, MenuSheet, ExpenseFilterSheet
    utils/money.ts, dates.ts, categoryStyle.ts
  assets/fonts, assets/images
  DEVELOPMENT_PLAN.md
```

## Phase 0: Scaffold ✅
- [x] `cd ~/Projects && npx create-expo-app@latest spendlog_native` (TypeScript + Expo Router template)
- [x] `git init`, keep the template `.gitignore`, first commit
- [x] Install: axios, @tanstack/react-query, zustand, expo-secure-store, async-storage,
      react-hook-form, zod, @gorhom/bottom-sheet, expo-blur, expo-linear-gradient,
      react-native-svg, dayjs, expo-font + the two Google font packages,
      expo-file-system, expo-sharing, expo-image-picker (all via `npx expo install`)
- [x] ESLint + Prettier from the Expo config; `npm run lint` and `npx tsc --noEmit` both clean
- [x] `.env.example` with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_API_PORT`
- [x] `app.json`: name SpendLog, slug `spendlog`, scheme `spendlog`, Android package, icon and splash placeholders
- [x] Confirm the blank app opens in Expo Go on a phone and in the Android emulator

## Phase 1: Core ✅
- [x] `src/api/env.ts` — the base URL table above, overridable by env
- [x] `src/api/client.ts` — axios with `Accept: application/json`, bearer from secure store,
      `Accept-Language` from the locale store, 10 s connect / 20 s read timeouts
- [x] 401 interceptor: clear the token and emit `unauthorized` — **except** on
      `/login`, `/register`, `/forgot-password`, `/reset-password`, where a 401 says nothing
      about the stored session. Only 401 signs out: 422 is a bad password, 403 a missing ability
- [x] `apiErrorMessage(error)` — first `errors.*[0]`, then `message`, then a network fallback;
      `fieldErrors(error)` for mapping 422 onto react-hook-form
- [x] Session store: `token`, `user`, `status: 'restoring' | 'signed-out' | 'signed-in'`;
      restore on launch by reading the token and calling `GET /me`
- [x] Route gate in `app/_layout.tsx`: `restoring` → splash, `signed-out` → `(auth)`, else `(app)`
- [x] React Query provider with sane defaults (`staleTime` 30 s, retry 1, no retry on 4xx)
- [x] Theme: tokens from the Flutter app — green `#2F6B3D`, bright green `#4B9D5F`,
      cream `#F7F6F2`, ink `#171717`, paper `#ECECEA`, dark ground `#121212`,
      dark surface `#1E1E1E`, error `#B3261E` / `#F87171`; light, dark and system;
      `GET /branding` may override the accent (`branded`) and the ground (`plain_background`)
- [x] i18n: `t(key)` returning the key in English, the dictionary value in Khmer; seed
      `src/i18n/km.json` from `../spendlog/lang/km.json` and `../spendlog_app/assets/lang/km.json`
- [x] Fonts loaded before the splash hides; Khmer face when the locale is `km`
- [x] Shared components: GlassPane, PillButton, MoneyInput (USD/KHR toggle that converts
      the typed amount at `khr_per_usd` instead of discarding it), MonthStepper, EmptyState,
      Skeleton, Toast, CategoryDot (10 colours, 16 icons mapped to lucide names)
- [x] `utils/money.ts` — format `"12.50"` for display without going through a float;
      never sum on the client, the API supplies every total
- [x] Unit tests: `apiErrorMessage`, `fieldErrors`, money and month helpers

## Phase 2: Auth ✅
- [x] Splash with session restore
- [x] Login: email or username, password, `device_name` from the device model; a wrong
      password and an unknown email return the same 422 — show one message
- [x] Forgot password: `POST /forgot-password` with `email`, then the six-digit code screen
- [x] Reset password: `email`, `code`, `password`, `password_confirmation`; a code lasts
      10 min, works once, dies after 5 wrong guesses; asking again within 60 s is a 422
- [x] Register (optional): `name`, `email`, `password`, `password_confirmation`, `device_name`
- [x] Sign out: `POST /logout` revokes only this token; clear the store either way
- [x] `GET /settings/money` after sign-in → `khr_per_usd`, `default_currency` cached for the MoneyInput

## Phase 3: Dashboard and Budgets ✅
- [x] `GET /dashboard?budget_month&breakdown_month` — today's total, month summary, breakdown,
      recent 8, income, balance, savings card; month stepper; pull to refresh
- [x] Recurring rules run on the server during this call, so the dashboard is the
      "wake-up" fetch after launch
- [x] Spending trend chart (week / month / year / all) from `GET /reports` series, drawn with SVG;
      `is_future` buckets drawn empty, not zero
- [x] Menu sheet: entry points to Income, Recurring, Savings, Borrowings
- [x] Budgets tab: `GET /budgets/summary?month` — overall card and per-category rows,
      `status` ok / warning (≥80) / over (>100) / none; `bar_percent` for the bar, `percent` for the label
- [x] Set-budget sheet: `POST /budgets` upserts (`201` new, `200` updated); omit `category_uuid`
      for the overall budget; `month` is `YYYY-MM`; currency toggle
- [x] `DELETE /budgets/{uuid}` from the row

## Phase 4: Expenses ✅
- [x] `useInfiniteQuery` over `GET /expenses` following `links.next`; `per_page` 50 (server clamps at 100)
- [x] Search (`filter[item]`), category (`filter[category]`), date range (`filter[from]`, `filter[to]`),
      sort (`spent_on`, `price`, `item`, `-` reverses)
- [x] List grouped by day, `recurring: true` rows badged, long-press to delete
- [x] Expense form sheet: item, price with currency toggle, category picker, date (not in the future);
      `PATCH` sends the full shape
- [x] Admin: `scope=all` toggle with `owner` on each row and `filter[user]`; hide both for non-admins
      (the server 400s `filter[user]` for anyone else)
- [x] Inline `new_category=` when the user may create categories (`is_admin`); otherwise hide it
- [x] Mutations invalidate: expenses, dashboard, budgets, reports, activity

## Phase 5: Income, Recurring, Savings, Borrowings ✅
- [x] Income: infinite list (`filter[source]`, `filter[from]`, `filter[to]`, `sort`), summary card
      (`GET /incomes/summary?month`), source picker from `GET /incomes/sources`, form sheet with
      `note` (omitted `note` clears it on PATCH)
- [x] Recurring: list (`kind` filter), form sheet — `kind` fixed after create, `category_uuid`
      required for expense rules and forbidden for income rules, `starts_on` at most a year back,
      `ends_on` after `starts_on`; show `next_run_on` / `last_run_on` / `active`; the `201`
      already contains the rows it wrote, so invalidate expenses and incomes too
- [x] Savings: summary (`planned`, `saved_this_month`, `remaining`, `percent` capped / `percent_raw`,
      `total_saved`), month entries list, plan sheet (`POST /savings/plan` upsert, `DELETE` clears
      the intention only), entry sheet (`deposit` / `withdraw`, optional `source` on deposits,
      withdraw ceiling is the all-time balance — surface the server's `errors.amount`)
- [x] Borrowings: list with `status` open / settled / all, `filter[lender]`, `filter[type]`,
      summary card (all-time, `by_lender_type`), lender picker from `GET /borrowings/lenders`,
      form sheet (five `lender_type` values, `due_on` not before `borrowed_on`),
      detail screen with repayments, repayment sheet (capped at `remaining`),
      delete repayment; `PATCH` may not drop `amount` below what is repaid
- [x] All four invalidate the dashboard

## Phase 6: Reports ✅
- [x] `GET /reports?period&at&page&per_page` — period picker whose options come from the
      response (`options` is bounded by the account's history), stats, chart, breakdown,
      paginated expense list; `per_page` allow-list 20 / 50 / 100 / 150 / 200
- [x] Comparison line: `change_percent` null means "nothing to compare", not 0;
      `previous_is_partial` gets its own caption
- [x] Export: `GET /reports/export/{pdf|xlsx|csv}` downloaded with the bearer header via
      expo-file-system, then handed to the share sheet with expo-sharing

## Phase 7: Profile and settings ✅
- [x] Grouped settings list: account, appearance (light / dark / system), language (en / km),
      categories, activity, admin entries when `is_admin`, sign out
- [x] Edit profile sheet: `PATCH /profile` — `name`, `username` (blank releases it), `email`
      (a change clears verification), `phone`
- [x] Avatar: expo-image-picker → multipart `POST /profile/avatar` (JPEG / PNG / WebP, 4 MB);
      `DELETE /profile/avatar`; `avatar_url` is already cache-busted
- [x] Change password sheet: `PUT /password` with confirmation; existing tokens stay valid
- [x] Categories: `GET /categories` with `expenses_count`; create / edit / delete only for admins;
      a `409` on delete shows the server's message ("… is still in use")
- [x] Activity: infinite list of `GET /activity`; render `changes` as from → to; admin `scope=all`
      adds the actor
- [x] FAQ: `GET /faqs` on the help screen (any token)

## Phase 8: Admin ✅
- [x] Users: `GET /admin/users`, create / edit / delete, role, avatar upload and removal
- [x] FAQ editor: `POST | PATCH | DELETE /admin/faqs`
- [x] Spending settings: `GET | PUT /admin/settings/spending` — guidance toggle and texts,
      `khr_per_usd`, `default_currency`; refetch `/settings/money` afterwards
- [x] Branding: `GET | POST /admin/settings/branding` — multipart on **POST**, `remove_logo` /
      `remove_favicon`, SVG refused; refetch `/branding` afterwards
- [x] Colours: `GET | PUT /admin/settings/colors` — swatches from `button_presets` / `body_presets`
- [x] Every admin screen is hidden without `is_admin` and still handles a 403 (a token minted
      without `users:write` / `settings:write`)

## Phase 9: Polish
- [x] Empty states on every list, skeletons on first load, toasts on create / update / delete
- [x] Pull to refresh everywhere; offline banner from `NetInfo`; retry button on errors
- [x] Android back button closes an open sheet before popping the stack
- [x] Khmer pass: every visible string through `t()`, Khmer font renders, no clipped labels
- [x] Dark mode pass on every screen, including sheets and the frosted tab bar
- [x] 360 px width check: every screen and both sheets walked at 360 × 740 in Expo web with
      Playwright, measuring for anything past the viewport edge. One hit — the USD / KHR toggle
      spilled out of the price field because a browser input keeps a min-content width; fixed
      with `minWidth: 0` on the input and `flexShrink: 0` on the adornments (`Input.tsx`)
- [x] Accessibility labels: every `Pressable` audited — each has a role and either text or an
      `accessibilityLabel`; `IconButton` and `Fab` require one through their props
- [ ] Safe areas and keyboard avoidance confirmed on a real phone (insets and
      `keyboardBehavior="interactive"` are in place; only the device check is open)

## Phase 10: Build and release
- [ ] Install a JDK for native builds (`sudo apt install openjdk-17-jdk`, export `JAVA_HOME`)
      or use EAS Build; `ANDROID_HOME=~/Android/Sdk` is present but not exported in the shell
- [ ] `npx expo run:android` on the emulator once native modules are needed outside Expo Go
- [ ] Final icon, splash, adaptive icon; version and build number in `app.json`
- [ ] `EXPO_PUBLIC_API_URL` set for the deployed backend; release APK / AAB
- [ ] iOS deferred (no macOS on this machine); EAS can build it later

## Status (16 Sep 2026)

Phases 0–8 are built and were exercised in a browser (Expo web) against the
local backend with Playwright: sign in, the dashboard, adding an expense
through the sheet with the category picker, the expenses list, setting a
budget, reports, income, a recurring rule, a savings plan and deposit, a
borrowing with a repayment, profile edit, categories, the activity log, help,
Khmer and dark mode. The Android bundle compiles (`expo export --platform
android`). Not yet exercised on a device: the report export share sheet, the
photo picker, the date picker dialogs, and Android back handling.

Expense, income, savings (plan and entry) and borrowing (form and repayment)
now open as full pages under `(forms)` with a back button and a title; the
Playwright flow at 360 px walks all sixteen open / save / edit steps. Budget,
recurring, category, FAQ, user, profile and password stay as bottom sheets.

The 360 px width pass and the accessibility-label audit are done (Phase 9).
Still open: safe-area / keyboard checks on a real phone, a JDK for
`expo run:android`, icons and splash, and the release build (Phase 10).

## Running it

```bash
cd ~/Projects/spendlog && php artisan serve --host=0.0.0.0 --port=8000   # the API
cd ~/Projects/spendlog_native && npx expo start                          # then scan the QR with Expo Go
npx expo start --web                                                     # or open it in a browser
npm run typecheck && npm run lint && npm test
```

## Endpoint → hook → screen

| Endpoint | Hook | Screen |
|---|---|---|
| `POST /login`, `/register`, `/logout`, `GET /me` | `useSession` | Auth, Profile |
| `POST /forgot-password`, `/reset-password` | `useForgotPassword`, `useResetPassword` | Auth |
| `GET /branding` | `useBranding` | Theme provider, Login |
| `GET /settings/money` | `useMoneySettings` | MoneyInput |
| `GET /dashboard` | `useDashboard(month)` | Dashboard |
| `GET /reports`, `/reports/export/{format}` | `useReport`, `useExportReport` | Reports, Dashboard chart |
| `GET|POST|PATCH|DELETE /expenses` | `useExpenses`, `useSaveExpense`, `useDeleteExpense` | Expenses |
| `GET|POST|PATCH|DELETE /categories` | `useCategories`, `useSaveCategory`, `useDeleteCategory` | Categories, pickers |
| `GET /budgets`, `/budgets/summary`, `POST`, `DELETE` | `useBudgetSummary`, `useSetBudget`, `useDeleteBudget` | Budgets, Dashboard |
| `GET /incomes`, `/summary`, `/sources`, `POST`, `PATCH`, `DELETE` | `useIncomes`, `useIncomeSummary`, `useIncomeSources`, `useSaveIncome` | Income |
| `GET|POST|PATCH|DELETE /recurring` | `useRecurringRules`, `useSaveRecurring` | Recurring |
| `GET /savings`, `/summary`, `/plan`, `POST /plan`, `DELETE /plan/{uuid}`, entries CRUD | `useSavings*` | Savings |
| `GET /borrowings`, `/summary`, `/lenders`, CRUD, repayments | `useBorrowings*` | Borrowings, detail |
| `GET /activity` | `useActivity` | Activity |
| `PATCH /profile`, `POST|DELETE /profile/avatar`, `PUT /password` | `useUpdateProfile`, `useAvatar`, `useChangePassword` | Profile |
| `GET /faqs`, `/admin/faqs` CRUD | `useFaqs`, `useSaveFaq` | Help, Admin |
| `/admin/users` CRUD + avatar | `useAdminUsers`, `useSaveAdminUser` | Admin users |
| `/admin/settings/spending`, `/branding`, `/colors` | `useAdminSettings` | Admin settings |

## Query keys and invalidation

| Mutation | Invalidates |
|---|---|
| expense create / update / delete | `expenses`, `dashboard`, `budgets`, `reports`, `activity` |
| income create / update / delete | `incomes`, `dashboard`, `activity` |
| recurring create / update / delete | `recurring`, `expenses`, `incomes`, `dashboard`, `budgets` |
| budget set / delete | `budgets`, `dashboard`, `activity` |
| savings plan / entry | `savings`, `dashboard`, `activity` |
| borrowing / repayment | `borrowings` |
| category create / update / delete | `categories`, `expenses`, `budgets`, `activity` |
| profile / avatar / password | `me` |
| admin spending settings | `money-settings` |
| admin branding / colours | `branding` |

## API rules the client must respect

- **UUIDs only** in paths; `id` never appears in JSON.
- **Money is a string** with two decimals, always USD. Send `currency=KHR` to enter riel;
  the server converts and every response is still dollars. Percentages are numbers.
- **Dates**: `spent_on` / `received_on` / `saved_on` / `borrowed_on` are `YYYY-MM-DD`;
  budget, savings and income months are `YYYY-MM`; timestamps are ISO 8601 UTC.
- **Status codes**: 422 field errors, 401 dead session, 403 forbidden or missing token ability,
  404 unknown UUID, 409 conflict, 429 throttled. `DELETE` returns 204 with no body.
- **Upserts**: `POST /budgets` and `POST /savings/plan` return 201 or 200; there is no PATCH.
- **Full-shape PATCH**: an omitted optional field (`note`, `ends_on`, `due_on`) clears it.
- **Malformed months** on summaries fall back to the current month rather than erroring.
- **Two auth gates**: the token's abilities and the user's permissions both apply. A 403 on an
  action the UI offered means the token is narrower than the user — show a message, do not sign out.
- **Multipart on POST only**; do not set `Content-Type` by hand, let RN add the boundary.
- **`Accept-Language`** decides the language of category names, FAQ entries and guidance text.

## Out of scope

- Google sign-in (web only; no API route)
- Workouts (mentioned in the old proposal, no routes in `routes/api.php`)
- iOS builds until a Mac or EAS account is available
- Offline writes; the app is online-first with cached reads

## Open questions

- Register screen: the API has it but the Flutter app does not. Included as optional in Phase 2.
- Backend port: 8000 per `.env`, but confirm against the running `php artisan serve` before
  the first login — a wrong port surfaces as a login error, not a connection error.
