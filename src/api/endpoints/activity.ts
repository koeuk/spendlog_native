import type { ActivityEntry, Paginated } from '@/types/api';

import { api } from '../client';

export interface ActivityFilters {
  /** Admin only: everyone's log, with the actor under `user`. */
  scope?: 'all';
  /**
   * Narrow to particular kinds — `savings_plan`, `expense` and the rest of
   * ActivityLog::SUBJECTS. A kind the server does not know is a 422, not a
   * quietly empty page.
   */
  subject?: string[];
  /** Admin only (or the account itself): one person's log, by uuid. Implies `scope: 'all'`. */
  user?: string;
  /** `YYYY-MM-DD` covers the whole day; `YYYY-MM-DDTHH:mm` is exact. */
  from?: string;
  to?: string;
  per_page?: number;
}

export async function listActivity(filters: ActivityFilters, page = 1): Promise<Paginated<ActivityEntry>> {
  const { data } = await api.get<Paginated<ActivityEntry>>('/activity', {
    params: {
      scope: filters.scope,
      subject: filters.subject?.length ? filters.subject.join(',') : undefined,
      user: filters.user,
      from: filters.from,
      to: filters.to,
      per_page: filters.per_page ?? 50,
      page,
    },
  });
  return data;
}
