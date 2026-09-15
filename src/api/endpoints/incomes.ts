import type { Currency, Income, IncomeSummary, Paginated, Ym } from '@/types/api';

import { api } from '../client';

export interface IncomeFilters {
  source?: string;
  from?: string;
  to?: string;
  /** `received_on`, `amount`, `source`; prefix `-` to reverse. */
  sort?: string;
  per_page?: number;
}

export async function listIncomes(filters: IncomeFilters, page = 1): Promise<Paginated<Income>> {
  const { data } = await api.get<Paginated<Income>>('/incomes', {
    params: {
      'filter[source]': filters.source || undefined,
      'filter[from]': filters.from || undefined,
      'filter[to]': filters.to || undefined,
      sort: filters.sort,
      per_page: filters.per_page ?? 50,
      page,
    },
  });
  return data;
}

export async function getIncomeSummary(month: Ym): Promise<IncomeSummary> {
  const { data } = await api.get<{ data: IncomeSummary }>('/incomes/summary', { params: { month } });
  return data.data;
}

/** The caller's sources, most used first. */
export async function listIncomeSources(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>('/incomes/sources');
  return data.data;
}

export async function getIncome(uuid: string): Promise<Income> {
  const { data } = await api.get<{ data: Income }>(`/incomes/${uuid}`);
  return data.data;
}

export interface IncomePayload {
  source: string;
  amount: string;
  currency?: Currency;
  received_on: string;
  note?: string | null;
}

export async function createIncome(payload: IncomePayload): Promise<Income> {
  const { data } = await api.post<{ data: Income }>('/incomes', payload);
  return data.data;
}

export async function updateIncome(uuid: string, payload: IncomePayload): Promise<Income> {
  const { data } = await api.patch<{ data: Income }>(`/incomes/${uuid}`, payload);
  return data.data;
}

export async function deleteIncome(uuid: string): Promise<void> {
  await api.delete(`/incomes/${uuid}`);
}
