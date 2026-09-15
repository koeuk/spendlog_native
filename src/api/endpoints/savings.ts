import type { Currency, SavingsEntry, SavingsEntryType, SavingsPlan, SavingsSummary, Ym } from '@/types/api';

import { api } from '../client';

export async function getSavingsSummary(month: Ym): Promise<SavingsSummary> {
  const { data } = await api.get<{ data: SavingsSummary }>('/savings/summary', { params: { month } });
  return data.data;
}

/** The month's entries, newest first. Not paginated. */
export async function listSavingsEntries(month: Ym): Promise<SavingsEntry[]> {
  const { data } = await api.get<{ data: SavingsEntry[] }>('/savings', { params: { month } });
  return data.data;
}

/** The stored plan, or `null` when that month has none. */
export async function getSavingsPlan(month: Ym): Promise<SavingsPlan | null> {
  const { data } = await api.get<{ data: SavingsPlan | null }>('/savings/plan', { params: { month } });
  return data.data;
}

export interface SavingsPlanPayload {
  month: Ym;
  amount: string;
  currency?: Currency;
}

/** Upserts the `(user, month)` slot: `201` created, `200` updated. */
export async function setSavingsPlan(payload: SavingsPlanPayload): Promise<{ plan: SavingsPlan; created: boolean }> {
  const response = await api.post<{ data: SavingsPlan }>('/savings/plan', payload);
  return { plan: response.data.data, created: response.status === 201 };
}

/** Clears the month's plan; the entries are untouched. */
export async function deleteSavingsPlan(uuid: string): Promise<void> {
  await api.delete(`/savings/plan/${uuid}`);
}

export interface SavingsEntryPayload {
  type: SavingsEntryType;
  /** Always positive on the wire; the server applies the sign. */
  amount: string;
  currency?: Currency;
  /** Where a deposit came from; dropped on a withdrawal. */
  source?: string | null;
  saved_on: string;
  note?: string | null;
}

export async function createSavingsEntry(payload: SavingsEntryPayload): Promise<SavingsEntry> {
  const { data } = await api.post<{ data: SavingsEntry }>('/savings/entries', payload);
  return data.data;
}

export async function updateSavingsEntry(uuid: string, payload: SavingsEntryPayload): Promise<SavingsEntry> {
  const { data } = await api.patch<{ data: SavingsEntry }>(`/savings/entries/${uuid}`, payload);
  return data.data;
}

export async function deleteSavingsEntry(uuid: string): Promise<void> {
  await api.delete(`/savings/entries/${uuid}`);
}
