import type { Borrowing, BorrowingSummary, Currency, LenderOptions, LenderType, Paginated, Repayment } from '@/types/api';

import { api } from '../client';

export type BorrowingStatusFilter = 'open' | 'settled' | 'all';

export interface BorrowingFilters {
  lender?: string;
  type?: LenderType;
  status?: BorrowingStatusFilter;
  /** `borrowed_on`, `amount`, `due_on`, `lender`; prefix `-` to reverse. */
  sort?: string;
  per_page?: number;
}

export async function listBorrowings(filters: BorrowingFilters, page = 1): Promise<Paginated<Borrowing>> {
  const { data } = await api.get<Paginated<Borrowing>>('/borrowings', {
    params: {
      'filter[lender]': filters.lender || undefined,
      'filter[type]': filters.type,
      status: filters.status ?? 'all',
      sort: filters.sort,
      per_page: filters.per_page ?? 50,
      page,
    },
  });
  return data;
}

/** All time, not a month: a debt does not belong to one. */
export async function getBorrowingSummary(): Promise<BorrowingSummary> {
  const { data } = await api.get<{ data: BorrowingSummary }>('/borrowings/summary');
  return data.data;
}

export async function getLenderOptions(): Promise<LenderOptions> {
  const { data } = await api.get<{ data: LenderOptions }>('/borrowings/lenders');
  return data.data;
}

/** Includes `repayments`, newest first. */
export async function getBorrowing(uuid: string): Promise<Borrowing> {
  const { data } = await api.get<{ data: Borrowing }>(`/borrowings/${uuid}`);
  return data.data;
}

export interface BorrowingPayload {
  lender: string;
  lender_type: LenderType;
  amount: string;
  currency?: Currency;
  borrowed_on: string;
  due_on?: string | null;
  note?: string | null;
}

export async function createBorrowing(payload: BorrowingPayload): Promise<Borrowing> {
  const { data } = await api.post<{ data: Borrowing }>('/borrowings', payload);
  return data.data;
}

/** `422` on `amount` when it would drop below what is repaid. */
export async function updateBorrowing(uuid: string, payload: BorrowingPayload): Promise<Borrowing> {
  const { data } = await api.patch<{ data: Borrowing }>(`/borrowings/${uuid}`, payload);
  return data.data;
}

/** Takes the repayments with it. */
export async function deleteBorrowing(uuid: string): Promise<void> {
  await api.delete(`/borrowings/${uuid}`);
}

export interface RepaymentPayload {
  /** Capped at `remaining`; more is a `422` on `amount`. */
  amount: string;
  currency?: Currency;
  paid_on: string;
  note?: string | null;
}

export async function addRepayment(borrowingUuid: string, payload: RepaymentPayload): Promise<Repayment> {
  const { data } = await api.post<{ data: Repayment }>(`/borrowings/${borrowingUuid}/repayments`, payload);
  return data.data;
}

export async function deleteRepayment(borrowingUuid: string, repaymentUuid: string): Promise<void> {
  await api.delete(`/borrowings/${borrowingUuid}/repayments/${repaymentUuid}`);
}
