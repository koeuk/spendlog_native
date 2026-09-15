import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createSavingsEntry,
  deleteSavingsEntry,
  deleteSavingsPlan,
  getSavingsPlan,
  getSavingsSummary,
  listSavingsEntries,
  setSavingsPlan,
  updateSavingsEntry,
  type SavingsEntryPayload,
} from '@/api/endpoints/savings';
import type { Ym } from '@/types/api';

import { invalidate, keys, touches } from './keys';

export function useSavingsSummary(month: Ym) {
  return useQuery({ queryKey: keys.savingsSummary(month), queryFn: () => getSavingsSummary(month) });
}

export function useSavingsEntries(month: Ym) {
  return useQuery({ queryKey: keys.savingsEntries(month), queryFn: () => listSavingsEntries(month) });
}

export function useSavingsPlan(month: Ym) {
  return useQuery({ queryKey: keys.savingsPlan(month), queryFn: () => getSavingsPlan(month) });
}

export function useSetSavingsPlan() {
  return useMutation({ mutationFn: setSavingsPlan, onSuccess: () => invalidate(...touches.savings) });
}

export function useDeleteSavingsPlan() {
  return useMutation({ mutationFn: deleteSavingsPlan, onSuccess: () => invalidate(...touches.savings) });
}

export function useSaveSavingsEntry() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: SavingsEntryPayload }) =>
      uuid ? updateSavingsEntry(uuid, payload) : createSavingsEntry(payload),
    onSuccess: () => invalidate(...touches.savings),
  });
}

export function useDeleteSavingsEntry() {
  return useMutation({ mutationFn: deleteSavingsEntry, onSuccess: () => invalidate(...touches.savings) });
}
