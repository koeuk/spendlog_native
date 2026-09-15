import { useQuery } from '@tanstack/react-query';

import { getMoneySettings } from '@/api/endpoints/branding';
import type { MoneySettings } from '@/types/api';

export const moneySettingsQueryKey = ['money-settings'] as const;

const FALLBACK: MoneySettings = { khr_per_usd: 4100, default_currency: 'USD' };

/** The rate every riel entry converts at, and which currency amount fields start on. */
export function useMoneySettings(): MoneySettings {
  const { data } = useQuery({ queryKey: moneySettingsQueryKey, queryFn: getMoneySettings, staleTime: 5 * 60_000 });
  return data ?? FALLBACK;
}
