import type { ActivityEntry, Paginated } from '@/types/api';

import { api } from '../client';

export interface ActivityFilters {
  /** Admin only: everyone's log, with the actor under `user`. */
  scope?: 'all';
  per_page?: number;
}

export async function listActivity(filters: ActivityFilters, page = 1): Promise<Paginated<ActivityEntry>> {
  const { data } = await api.get<Paginated<ActivityEntry>>('/activity', {
    params: { scope: filters.scope, per_page: filters.per_page ?? 50, page },
  });
  return data;
}
