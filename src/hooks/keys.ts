import { queryClient } from '@/api/queryClient';
import type { ActivityFilters } from '@/api/endpoints/activity';
import type { BorrowingFilters } from '@/api/endpoints/borrowings';
import type { CategoryFilters } from '@/api/endpoints/categories';
import type { ExpenseFilters } from '@/api/endpoints/expenses';
import type { IncomeFilters } from '@/api/endpoints/incomes';
import type { ReportParams } from '@/api/endpoints/reports';
import type { RecurringKind, Ym } from '@/types/api';

/**
 * One key per resource, each rooted on the resource's name so a write can
 * invalidate everything it touched with `invalidate('expenses', 'dashboard')`.
 */
export const keys = {
  dashboard: (budgetMonth?: Ym, breakdownMonth?: Ym) => ['dashboard', budgetMonth ?? null, breakdownMonth ?? null] as const,
  report: (params: ReportParams) => ['reports', params] as const,
  expenses: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  expense: (uuid: string) => ['expenses', 'one', uuid] as const,
  categories: (filters: CategoryFilters = {}) => ['categories', filters] as const,
  budgets: (month?: Ym) => ['budgets', 'list', month ?? null] as const,
  budgetSummary: (month: Ym) => ['budgets', 'summary', month] as const,
  incomes: (filters: IncomeFilters) => ['incomes', 'list', filters] as const,
  incomeSummary: (month: Ym) => ['incomes', 'summary', month] as const,
  incomeSources: ['incomes', 'sources'] as const,
  incomeSourceCatalog: ['incomes', 'sources', 'catalog'] as const,
  income: (uuid: string) => ['incomes', 'one', uuid] as const,
  recurring: (kind?: RecurringKind) => ['recurring', kind ?? 'all'] as const,
  savingsSummary: (month: Ym) => ['savings', 'summary', month] as const,
  savingsEntries: (month: Ym) => ['savings', 'entries', month] as const,
  savingsPlan: (month: Ym) => ['savings', 'plan', month] as const,
  borrowings: (filters: BorrowingFilters) => ['borrowings', 'list', filters] as const,
  borrowing: (uuid: string) => ['borrowings', 'one', uuid] as const,
  borrowingSummary: ['borrowings', 'summary'] as const,
  lenders: ['borrowings', 'lenders'] as const,
  activity: (filters: ActivityFilters) => ['activity', filters] as const,
  faqs: ['faqs'] as const,
  adminUsers: ['admin', 'users'] as const,
  spendingSettings: ['admin', 'settings', 'spending'] as const,
  brandingSettings: ['admin', 'settings', 'branding'] as const,
  colorSettings: ['admin', 'settings', 'colors'] as const,
};

type Root =
  | 'dashboard'
  | 'reports'
  | 'expenses'
  | 'categories'
  | 'budgets'
  | 'incomes'
  | 'recurring'
  | 'savings'
  | 'borrowings'
  | 'activity'
  | 'faqs'
  | 'admin'
  | 'branding'
  | 'money-settings';

/** Refetch every query under the given roots. */
export function invalidate(...roots: Root[]): Promise<void> {
  return Promise.all(roots.map((root) => queryClient.invalidateQueries({ queryKey: [root] }))).then(() => undefined);
}

/** What each kind of write disturbs; the dashboard sums most of them. */
export const touches = {
  expense: ['expenses', 'dashboard', 'budgets', 'reports', 'activity'] as Root[],
  income: ['incomes', 'dashboard', 'activity'] as Root[],
  recurring: ['recurring', 'expenses', 'incomes', 'dashboard', 'budgets', 'reports', 'activity'] as Root[],
  budget: ['budgets', 'dashboard', 'activity'] as Root[],
  savings: ['savings', 'dashboard', 'activity'] as Root[],
  borrowing: ['borrowings', 'activity'] as Root[],
  category: ['categories', 'expenses', 'budgets', 'dashboard', 'reports', 'activity'] as Root[],
};
