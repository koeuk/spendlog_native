import type { Preferences, UserPreferences } from '@/types/api';

import { api } from '../client';

/** The signed-in account's own currency and colours, with the swatches to offer. */
export async function getPreferences(): Promise<Preferences> {
  const { data } = await api.get<{ data: Preferences }>('/preferences');
  return data.data;
}

/** Only the fields sent change; null goes back to following the app. */
export async function updatePreferences(payload: Partial<UserPreferences>): Promise<Preferences> {
  const { data } = await api.put<{ data: Preferences }>('/preferences', payload);
  return data.data;
}
