import type { Branding, MoneySettings } from '@/types/api';

import { api } from '../client';

/** Public: what the sign-in screen is painted with. */
export async function getBranding(): Promise<Branding> {
  const { data } = await api.get<{ data: Branding }>('/branding');
  return data.data;
}

/** The rate and default currency, for any signed-in client. */
export async function getMoneySettings(): Promise<MoneySettings> {
  const { data } = await api.get<{ data: MoneySettings }>('/settings/money');
  return data.data;
}
