import { keepPreviousData, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listActivity, type ActivityFilters } from '@/api/endpoints/activity';
import { listFaqs } from '@/api/endpoints/admin';
import { getDashboard } from '@/api/endpoints/dashboard';
import { queryClient } from '@/api/queryClient';
import { getReport, type ReportParams } from '@/api/endpoints/reports';
import type { ActivityEntry, Paginated, Ym } from '@/types/api';

import { keys } from './keys';
import { useInfiniteList } from './useInfiniteList';

/** Everything the home screen needs in one call; the previous month's figures stay while the next load. */
export function useDashboard(budgetMonth?: Ym, breakdownMonth?: Ym) {
  return useQuery({
    queryKey: keys.dashboard(budgetMonth, breakdownMonth),
    queryFn: () => getDashboard({ budget_month: budgetMonth, breakdown_month: breakdownMonth }),
    placeholderData: keepPreviousData,
  });
}

export function useReport(params: ReportParams, enabled = true) {
  return useQuery({ queryKey: keys.report(params), queryFn: () => getReport(params), placeholderData: keepPreviousData, enabled });
}

export function useActivity(filters: ActivityFilters) {
  return useInfiniteList(keys.activity(filters), (page) => listActivity(filters, page));
}

/**
 * One entry for its own page. The API lists the log rather than serving a
 * single record, so the entry is read back out of whichever cached list the
 * reader just came from — every filter keeps its own list under `activity`, so
 * all of them are searched. A log entry never changes once written, so reading
 * the cache rather than subscribing to it is enough.
 *
 * Returns null when the page is opened cold, on a link into a list that was
 * never loaded; the page says so rather than showing half a record.
 */
export function useActivityEntry(uuid: string): ActivityEntry | null {
  return useMemo(() => {
    if (!uuid) return null;
    const lists = queryClient.getQueriesData<InfiniteData<Paginated<ActivityEntry>>>({ queryKey: ['activity'] });
    for (const [, cached] of lists) {
      for (const page of cached?.pages ?? []) {
        const found = page.data.find((entry) => entry.uuid === uuid);
        if (found) return found;
      }
    }
    return null;
  }, [uuid]);
}

export function useFaqs() {
  return useQuery({ queryKey: keys.faqs, queryFn: listFaqs, staleTime: 5 * 60_000 });
}
