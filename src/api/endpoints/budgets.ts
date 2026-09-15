import type { Budget, BudgetSummary, Currency, Ym } from '@/types/api';

import { api } from '../client';

export async function listBudgets(month?: Ym): Promise<Budget[]> {
  const { data } = await api.get<{ data: Budget[] }>('/budgets', { params: { month } });
  return data.data;
}

export async function getBudgetSummary(month: Ym): Promise<BudgetSummary> {
  const { data } = await api.get<{ data: BudgetSummary }>('/budgets/summary', { params: { month } });
  return data.data;
}

export interface BudgetPayload {
  /** Omit for the overall budget covering every category. */
  category_uuid?: string;
  month: Ym;
  amount: string;
  currency?: Currency;
}

/** Upserts the `(category, month)` slot: `201` created, `200` updated. */
export async function setBudget(payload: BudgetPayload): Promise<{ budget: Budget; created: boolean }> {
  const response = await api.post<{ data: Budget }>('/budgets', payload);
  return { budget: response.data.data, created: response.status === 201 };
}

export async function deleteBudget(uuid: string): Promise<void> {
  await api.delete(`/budgets/${uuid}`);
}
