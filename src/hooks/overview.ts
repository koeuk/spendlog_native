import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listActivity, type ActivityFilters } from '@/api/endpoints/activity';
import { listFaqs } from '@/api/endpoints/admin';
import { getDashboard } from '@/api/endpoints/dashboard';
import { getReport, type ReportParams } from '@/api/endpoints/reports';
import type { Ym } from '@/types/api';

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

export function useFaqs() {
  return useQuery({ queryKey: keys.faqs, queryFn: listFaqs, staleTime: 5 * 60_000 });
}
