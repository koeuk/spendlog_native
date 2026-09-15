import type { Category, CategoryColor } from '@/types/api';

import { api } from '../client';

export interface CategoryFilters {
  name?: string;
  color?: CategoryColor;
  /** `name` or `expenses`. */
  sort?: string;
}

export async function listCategories(filters: CategoryFilters = {}): Promise<Category[]> {
  const { data } = await api.get<{ data: Category[] }>('/categories', {
    params: {
      'filter[name]': filters.name || undefined,
      'filter[color]': filters.color,
      sort: filters.sort,
    },
  });
  return data.data;
}

export interface CategoryPayload {
  name: string;
  color: CategoryColor;
  icon: string;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await api.post<{ data: Category }>('/categories', payload);
  return data.data;
}

export async function updateCategory(uuid: string, payload: CategoryPayload): Promise<Category> {
  const { data } = await api.patch<{ data: Category }>(`/categories/${uuid}`, payload);
  return data.data;
}

/** `409` when expenses or budgets still reference it. */
export async function deleteCategory(uuid: string): Promise<void> {
  await api.delete(`/categories/${uuid}`);
}
