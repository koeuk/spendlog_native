import { useMutation, useQuery } from '@tanstack/react-query';

import { createExpense, deleteExpense, getExpense, listExpenses, updateExpense, type ExpenseFilters, type ExpensePayload } from '@/api/endpoints/expenses';

import { invalidate, keys, touches } from './keys';
import { useInfiniteList } from './useInfiniteList';

export function useExpenses(filters: ExpenseFilters, enabled = true) {
  return useInfiniteList(keys.expenses(filters), (page) => listExpenses(filters, page), enabled);
}

export function useExpense(uuid: string) {
  return useQuery({ queryKey: keys.expense(uuid), queryFn: () => getExpense(uuid) });
}

/** Create when there is no uuid, update otherwise; both disturb the same totals. */
export function useSaveExpense() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: ExpensePayload }) => (uuid ? updateExpense(uuid, payload) : createExpense(payload)),
    onSuccess: () => invalidate(...touches.expense),
  });
}

export function useDeleteExpense() {
  return useMutation({ mutationFn: deleteExpense, onSuccess: () => invalidate(...touches.expense) });
}
