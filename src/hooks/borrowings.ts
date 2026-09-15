import { useMutation, useQuery } from '@tanstack/react-query';

import {
  addRepayment,
  createBorrowing,
  deleteBorrowing,
  deleteRepayment,
  getBorrowing,
  getBorrowingSummary,
  getLenderOptions,
  listBorrowings,
  updateBorrowing,
  type BorrowingFilters,
  type BorrowingPayload,
  type RepaymentPayload,
} from '@/api/endpoints/borrowings';

import { invalidate, keys, touches } from './keys';
import { useInfiniteList } from './useInfiniteList';

export function useBorrowings(filters: BorrowingFilters) {
  return useInfiniteList(keys.borrowings(filters), (page) => listBorrowings(filters, page));
}

export function useBorrowingSummary() {
  return useQuery({ queryKey: keys.borrowingSummary, queryFn: getBorrowingSummary });
}

export function useLenderOptions() {
  return useQuery({ queryKey: keys.lenders, queryFn: getLenderOptions, staleTime: 60_000 });
}

export function useBorrowing(uuid: string) {
  return useQuery({ queryKey: keys.borrowing(uuid), queryFn: () => getBorrowing(uuid), enabled: uuid !== '' });
}

export function useSaveBorrowing() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: BorrowingPayload }) => (uuid ? updateBorrowing(uuid, payload) : createBorrowing(payload)),
    onSuccess: () => invalidate(...touches.borrowing),
  });
}

export function useDeleteBorrowing() {
  return useMutation({ mutationFn: deleteBorrowing, onSuccess: () => invalidate(...touches.borrowing) });
}

export function useAddRepayment() {
  return useMutation({
    mutationFn: ({ borrowingUuid, payload }: { borrowingUuid: string; payload: RepaymentPayload }) => addRepayment(borrowingUuid, payload),
    onSuccess: () => invalidate(...touches.borrowing),
  });
}

export function useDeleteRepayment() {
  return useMutation({
    mutationFn: ({ borrowingUuid, repaymentUuid }: { borrowingUuid: string; repaymentUuid: string }) => deleteRepayment(borrowingUuid, repaymentUuid),
    onSuccess: () => invalidate(...touches.borrowing),
  });
}
