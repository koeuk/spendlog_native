import { useMutation, useQuery } from '@tanstack/react-query';

import { deleteBudget, getBudgetSummary, listBudgets, setBudget } from '@/api/endpoints/budgets';
import type { Ym } from '@/types/api';

import { invalidate, keys, touches } from './keys';

export function useBudgetSummary(month: Ym) {
  return useQuery({ queryKey: keys.budgetSummary(month), queryFn: () => getBudgetSummary(month) });
}

export function useBudgets(month?: Ym) {
  return useQuery({ queryKey: keys.budgets(month), queryFn: () => listBudgets(month) });
}

export function useSetBudget() {
  return useMutation({ mutationFn: setBudget, onSuccess: () => invalidate(...touches.budget) });
}

export function useDeleteBudget() {
  return useMutation({ mutationFn: deleteBudget, onSuccess: () => invalidate(...touches.budget) });
}
