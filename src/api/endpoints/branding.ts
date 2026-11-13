import type { Branding, MoneySettings } from '@/types/api';

import { api } from '../client';

const STOCK_BRANDING: Branding = {
  name: 'SpendLog',
  copyright: 'SpendLog',
  logo: null,
  favicon: null,
  button_color: '#2F6B3D',
  branded: false,
  body_color: '#ffffff',
  plain_background: false,
};

/** Public: what the sign-in screen is painted with. */
export async function getBranding(): Promise<Branding> {
  const { data } = await api.get<{ data?: Branding }>('/branding');
  return data?.data ?? STOCK_BRANDING;
}

/** The rate and default currency, for any signed-in client. */
export async function getMoneySettings(): Promise<MoneySettings> {
  const { data } = await api.get<{ data: MoneySettings }>('/settings/money');
  return data.data;
}
