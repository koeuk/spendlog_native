import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createIncome,
  createIncomeSource,
  deleteIncome,
  deleteIncomeSource,
  getIncome,
  getIncomeSummary,
  listIncomeSourceCatalog,
  listIncomeSources,
  listIncomes,
  renameIncomeSource,
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

export function useIncome(uuid: string) {
  return useQuery({ queryKey: keys.income(uuid), queryFn: () => getIncome(uuid), enabled: uuid !== '' });
}

export function useIncomeSummary(month: Ym) {
  return useQuery({ queryKey: keys.incomeSummary(month), queryFn: () => getIncomeSummary(month) });
}

export function useIncomeSources() {
  return useQuery({ queryKey: keys.incomeSources, queryFn: listIncomeSources, staleTime: 60_000 });
}

/** The catalogue as rows, for the Sources screen. */
export function useIncomeSourceCatalog() {
  return useQuery({ queryKey: keys.incomeSourceCatalog, queryFn: listIncomeSourceCatalog });
}

export function useSaveIncomeSource() {
  return useMutation({
    mutationFn: ({ uuid, name, rewriteIncomes = false }: { uuid?: string; name: string; rewriteIncomes?: boolean }) =>
      uuid ? renameIncomeSource(uuid, name, rewriteIncomes) : createIncomeSource(name),
    // A rename that carries the income across rewrites those rows, so this
    // touches everything an income save would.
    onSuccess: () => invalidate(...touches.income),
  });
}

export function useDeleteIncomeSource() {
  return useMutation({ mutationFn: deleteIncomeSource, onSuccess: () => invalidate(...touches.income) });
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
