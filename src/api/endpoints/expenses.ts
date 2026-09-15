import type { Currency, Expense, Paginated } from '@/types/api';

import { api } from '../client';

export interface ExpenseFilters {
  item?: string;
  category?: string;
  from?: string;
  to?: string;
  /** `spent_on`, `price`, `item`; prefix `-` to reverse. */
  sort?: string;
  per_page?: number;
  /** Admin only: lists everyone and adds `owner`. */
  scope?: 'all';
  /** Only while an admin is viewing everyone. */
  user?: string;
}

export async function listExpenses(filters: ExpenseFilters, page = 1): Promise<Paginated<Expense>> {
  const { data } = await api.get<Paginated<Expense>>('/expenses', {
    params: {
      'filter[item]': filters.item || undefined,
      'filter[category]': filters.category || undefined,
      'filter[from]': filters.from || undefined,
      'filter[to]': filters.to || undefined,
      'filter[user]': filters.user || undefined,
      sort: filters.sort,
      scope: filters.scope,
      per_page: filters.per_page ?? 50,
      page,
    },
  });
  return data;
}

export async function getExpense(uuid: string): Promise<Expense> {
  const { data } = await api.get<{ data: Expense }>(`/expenses/${uuid}`);
  return data.data;
}

export interface ExpensePayload {
  item: string;
  price: string;
  currency?: Currency;
  category_uuid?: string;
  /** Creates the category if it does not exist; needs `categories.create`. */
  new_category?: string;
  spent_on: string;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const { data } = await api.post<{ data: Expense }>('/expenses', payload);
  return data.data;
}

export async function updateExpense(uuid: string, payload: ExpensePayload): Promise<Expense> {
  const { data } = await api.patch<{ data: Expense }>(`/expenses/${uuid}`, payload);
  return data.data;
}

export async function deleteExpense(uuid: string): Promise<void> {
  await api.delete(`/expenses/${uuid}`);
}
