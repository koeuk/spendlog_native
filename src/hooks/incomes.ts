import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createIncome,
  deleteIncome,
  getIncomeSummary,
  listIncomeSources,
  listIncomes,
  updateIncome,
  type IncomeFilters,
  type IncomePayload,
} from '@/api/endpoints/incomes';
import type { Ym } from '@/types/api';

import { invalidate, keys, touches } from './keys';
import { useInfiniteList } from './useInfiniteList';

export function useIncomes(filters: IncomeFilters) {
  return useInfiniteList(keys.incomes(filters), (page) => listIncomes(filters, page));
}

export function useIncomeSummary(month: Ym) {
  return useQuery({ queryKey: keys.incomeSummary(month), queryFn: () => getIncomeSummary(month) });
}

export function useIncomeSources() {
  return useQuery({ queryKey: keys.incomeSources, queryFn: listIncomeSources, staleTime: 60_000 });
}

export function useSaveIncome() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: IncomePayload }) => (uuid ? updateIncome(uuid, payload) : createIncome(payload)),
    onSuccess: () => invalidate(...touches.income),
  });
}

export function useDeleteIncome() {
  return useMutation({ mutationFn: deleteIncome, onSuccess: () => invalidate(...touches.income) });
}
