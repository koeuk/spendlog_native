import type { Currency, RecurringFrequency, RecurringKind, RecurringRule } from '@/types/api';

import { api } from '../client';

export async function listRecurring(kind?: RecurringKind): Promise<RecurringRule[]> {
  const { data } = await api.get<{ data: RecurringRule[] }>('/recurring', { params: { kind } });
  return data.data;
}

export async function getRecurring(uuid: string): Promise<RecurringRule> {
  const { data } = await api.get<{ data: RecurringRule }>(`/recurring/${uuid}`);
  return data.data;
}

export interface RecurringPayload {
  /** Fixed for the life of the rule. */
  kind: RecurringKind;
  title: string;
  amount: string;
  currency?: Currency;
  /** Required for an expense rule, forbidden for an income one. */
  category_uuid?: string;
  frequency: RecurringFrequency;
  starts_on: string;
  ends_on?: string | null;
  active?: boolean;
  note?: string | null;
}

export async function createRecurring(payload: RecurringPayload): Promise<RecurringRule> {
  const { data } = await api.post<{ data: RecurringRule }>('/recurring', payload);
  return data.data;
}

export async function updateRecurring(uuid: string, payload: RecurringPayload): Promise<RecurringRule> {
  const { data } = await api.patch<{ data: RecurringRule }>(`/recurring/${uuid}`, payload);
  return data.data;
}

/** Keeps the rows the rule wrote. */
export async function deleteRecurring(uuid: string): Promise<void> {
  await api.delete(`/recurring/${uuid}`);
}
