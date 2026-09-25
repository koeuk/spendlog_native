/**
 * TypeScript mirrors of the API resources in `../spendlog/docs/API.md`.
 *
 * Money is a string with two decimals, always USD. Days are `YYYY-MM-DD`,
 * months `YYYY-MM`, timestamps ISO 8601. Identifiers are UUIDs; the server's
 * bigint ids never appear.
 */
export type Money = string;
export type Ymd = string;
export type Ym = string;
export type Currency = 'USD' | 'KHR';

export type CategoryColor =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink';

export type BudgetStatus = 'ok' | 'warning' | 'over' | 'none';
export type SavingsStatus = 'ok' | 'close' | 'met';
export type SavingsEntryType = 'deposit' | 'withdraw';
export type LenderType = 'friend' | 'family' | 'bank' | 'employer' | 'other';
export type RecurringKind = 'expense' | 'income';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Granularity = 'week' | 'month' | 'year' | 'all';
export type ExportFormat = 'pdf' | 'xlsx' | 'csv';
export type FaqStatus = 'draft' | 'published';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'archived';
export type RoleName = 'super_admin' | 'admin' | 'user';

export interface User {
  uuid: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  /** Absent on a user cached before preferences existed; treat as all-null. */
  preferences?: UserPreferences;
  email_verified_at: string | null;
  created_at: string;
}

/** One account's own choices, each null where it follows the app-wide value. */
export interface UserPreferences {
  currency: Currency | null;
  button_color: string | null;
  body_color: string | null;
}

export interface Preferences extends UserPreferences {
  /** Where this account's amount fields actually start: its own choice, or the app's. */
  default_currency: Currency;
  button_presets: { value: string; label: string; is_default?: boolean }[];
  body_presets: { value: string; label: string }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Branding {
  name: string;
  copyright: string;
  logo: string | null;
  favicon: string | null;
  button_color: string;
  /** False at the stock colour: the client keeps its own accent. */
  branded: boolean;
  body_color: string;
  /** False only for White, the ambient look a client renders its own way. */
  plain_background: boolean;
}

export interface MoneySettings {
  khr_per_usd: number;
  default_currency: Currency;
}

export interface Paginated<T> {
  data: T[];
  links: { first?: string | null; last?: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    last_page?: number;
    per_page?: number;
    total: number;
    from?: number | null;
    to?: number | null;
  };
}

export interface Category {
  uuid: string;
  name: string;
  name_translations?: Record<string, string>;
  color: CategoryColor | null;
  icon: string | null;
  expenses_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  uuid: string;
  item: string;
  item_translations?: Record<string, string>;
  price: Money;
  spent_on: Ymd;
  /** Written by a recurring rule rather than typed by a person. */
  recurring: boolean;
  category?: Category;
  /** Only while an admin lists everyone (`scope=all`). */
  owner?: { uuid: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  uuid?: string;
  name?: string;
  color?: CategoryColor | null;
  icon?: string | null;
  budget_uuid: string | null;
  spent: Money;
  /** `null` means no budget set, which is different from `"0.00"`. */
  budget: Money | null;
  remaining: Money | null;
  percent: number | null;
  /** Capped at 100 so a bar cannot overflow its track; `percent` keeps the truth. */
  bar_percent: number;
  status: BudgetStatus;
}

export interface BudgetSummary {
  month: Ym;
  overall: BudgetLine;
  categories: BudgetLine[];
}

export interface Budget {
  uuid: string;
  amount: Money;
  month: Ym;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

export interface BreakdownSlice {
  uuid: string;
  name: string;
  color: CategoryColor;
  spent: Money;
  share: number;
}

export interface DashboardSavings {
  month: Ym;
  planned: Money;
  /** The month's plan after what came back out; never negative. See SavingsSummary. */
  saved_this_month: Money;
  percent: number;
  total_saved: Money;
}

export interface Dashboard {
  today: { date: Ymd; total: Money };
  current_month: Ym;
  summary: BudgetSummary;
  budget_month: Ym;
  breakdown: BreakdownSlice[];
  breakdown_month: Ym;
  recent: Expense[];
  income: { month: Ym; total: Money };
  /** Income minus spent for the budget month; may be negative. */
  balance: Money;
  savings: DashboardSavings;
}

export interface Income {
  uuid: string;
  source: string;
  amount: Money;
  received_on: Ymd;
  recurring: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * One name in the account's source catalogue — what the income and savings
 * deposit forms offer, and what the Sources screen manages.
 *
 * A suggestion, not a key: an income carries the name as text, so renaming or
 * removing this row need not touch the income filed under it.
 */
export interface IncomeSource {
  uuid: string;
  name: string;
  /** How much income carries this name; 0 for one nothing has used yet. */
  uses: number;
  /** What that income adds up to, "0.00" when there is none. */
  total: Money;
  created_at: string;
}

export interface IncomeSummary {
  month: Ym;
  total: Money;
  count: number;
  by_source: { source: string; total: Money }[];
}

export interface RecurringRule {
  uuid: string;
  kind: RecurringKind;
  title: string;
  amount: Money;
  category: Category | null;
  frequency: RecurringFrequency;
  starts_on: Ymd;
  ends_on: Ymd | null;
  next_run_on: Ymd | null;
  last_run_on: Ymd | null;
  active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsSummary {
  month: Ym;
  planned: Money;
  /**
   * How much of the month's plan is standing, after what came back out. A
   * withdrawal spends the month's headroom — the part of `planned` the
   * deposits have not covered yet — before it touches the deposits
   * themselves, so $100 put against a $150 plan and $80 taken back out leaves
   * "70.00". Floored at "0.00", so never negative. See SavingsSummary in the
   * backend for why.
   */
  saved_this_month: Money;
  remaining: Money;
  percent: number;
  percent_raw: number;
  status: SavingsStatus;
  total_saved: Money;
  entries_count: number;
}

export interface SavingsEntry {
  uuid: string;
  type: SavingsEntryType;
  /** Always the absolute value; `type` says which way it went. */
  amount: Money;
  source: string | null;
  saved_on: Ymd;
  note: string | null;
  created_at: string;
}

export interface SavingsPlan {
  uuid: string;
  month: Ym;
  amount: Money;
  created_at: string;
  updated_at: string;
}

export interface Repayment {
  uuid: string;
  amount: Money;
  paid_on: Ymd;
  note: string | null;
  created_at: string;
}

export interface Borrowing {
  uuid: string;
  lender: string;
  lender_type: LenderType;
  amount: Money;
  repaid: Money;
  remaining: Money;
  percent_repaid: number;
  settled: boolean;
  overdue: boolean;
  borrowed_on: Ymd;
  due_on: Ymd | null;
  note: string | null;
  /** Only on `GET /borrowings/{uuid}`. */
  repayments?: Repayment[];
  repayments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BorrowingSummary {
  outstanding: Money;
  borrowed: Money;
  repaid: Money;
  open_count: number;
  settled_count: number;
  overdue_count: number;
  by_lender_type: { lender_type: LenderType; label: string; outstanding: Money; count: number }[];
}

export interface LenderOptions {
  lenders: string[];
  types: { value: LenderType; label: string }[];
}

export interface ReportBucket {
  key: string;
  label: string;
  caption: string;
  value: Money;
  is_current: boolean;
  /** Drawn empty, not as zero: "nothing spent" and "not yet" are different claims. */
  is_future: boolean;
}

export interface ReportSlice {
  uuid: string;
  name: string;
  color: CategoryColor;
  icon: string | null;
  total: Money;
  count: number;
  average: Money;
  share: number;
}

export interface ReportStats {
  total: Money;
  count: number;
  daily_average: Money;
  previous: Money;
  /** `null`, never 0, when there is nothing to compare against. */
  change_percent: number | null;
  previous_label: string | null;
  previous_is_partial: boolean;
}

export interface Report {
  granularity: Granularity;
  anchor: string;
  period_label: string;
  options: { value: string; label: string }[];
  series: { label: string; total: Money; buckets: ReportBucket[] };
  breakdown: ReportSlice[];
  stats: ReportStats;
  expenses: Paginated<Expense>;
}

export type ActivityAction = 'created' | 'updated' | 'deleted';

export interface ActivityChange {
  from: unknown;
  to: unknown;
}

export interface ActivityEntry {
  uuid: string;
  action: ActivityAction;
  /** "expense", "income", "budget", "category", "savings_plan", "savings_entry", ... */
  subject: string;
  /** Frozen at the time, so it still reads after the row is gone. */
  label: string;
  changes: Record<string, ActivityChange> | null;
  user?: { uuid: string | null; name: string | null };
  created_at: string;
}

export interface Faq {
  uuid: string;
  question: string;
  answer: string;
  status: FaqStatus;
  position: number;
}

export interface AdminUser {
  uuid: string;
  name: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  role: RoleName;
  status: UserStatus;
  email_verified_at: string | null;
  created_at: string;
}

export interface SpendingSettings {
  khr_per_usd: number;
  default_currency: Currency;
  spending_guidance_enabled: boolean;
  spending_warning: string;
  spending_advice: string;
}

export interface BrandingSettings {
  app_name: string;
  copyright_holder: string | null;
  logo: string | null;
  favicon: string | null;
}

export interface ColorSettings {
  button_color: string;
  body_color: string;
  button_presets: { value: string; label: string; is_default: boolean }[];
  body_presets: { value: string; label: string }[];
}
