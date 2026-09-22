import type { Currency, Income, IncomeSource, IncomeSummary, Paginated, Ym } from '@/types/api';

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

/**
 * The names to offer in a picker, busiest first.
 *
 * The catalogue's, not the income's — a name removed from the catalogue stops
 * being offered even where old income still carries it.
 */
export async function listIncomeSources(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>('/incomes/sources');
  return data.data;
}

/** The same names as rows to manage, with what is filed under each. */
export async function listIncomeSourceCatalog(): Promise<IncomeSource[]> {
  const { data } = await api.get<{ data: IncomeSource[] }>('/income-sources');
  return data.data;
}

export async function createIncomeSource(name: string): Promise<IncomeSource> {
  const { data } = await api.post<{ data: IncomeSource }>('/income-sources', { name });
  return data.data;
}

/**
 * `rewrite_incomes` carries the income filed under the old name across to the
 * new one; without it the catalogue changes and the history keeps what it was
 * entered with.
 */
export async function renameIncomeSource(uuid: string, name: string, rewriteIncomes: boolean): Promise<IncomeSource> {
  const { data } = await api.patch<{ data: IncomeSource }>(`/income-sources/${uuid}`, { name, rewrite_incomes: rewriteIncomes });
  return data.data;
}

/** Stops the name being offered. The income filed under it keeps it. */
export async function deleteIncomeSource(uuid: string): Promise<void> {
  await api.delete(`/income-sources/${uuid}`);
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
