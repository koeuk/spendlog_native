import { useMutation, useQuery } from '@tanstack/react-query';

import { createRecurring, deleteRecurring, listRecurring, updateRecurring, type RecurringPayload } from '@/api/endpoints/recurring';
import type { RecurringKind } from '@/types/api';

import { invalidate, keys, touches } from './keys';

export function useRecurringRules(kind?: RecurringKind) {
  return useQuery({ queryKey: keys.recurring(kind), queryFn: () => listRecurring(kind) });
}

/** The `201` already contains the rows the rule wrote, so expenses and incomes refetch too. */
export function useSaveRecurring() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: RecurringPayload }) => (uuid ? updateRecurring(uuid, payload) : createRecurring(payload)),
    onSuccess: () => invalidate(...touches.recurring),
  });
}

export function useDeleteRecurring() {
  return useMutation({ mutationFn: deleteRecurring, onSuccess: () => invalidate(...touches.recurring) });
}
