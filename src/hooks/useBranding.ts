import { useQuery } from '@tanstack/react-query';

import { getBranding } from '@/api/endpoints/branding';
import type { Branding } from '@/types/api';

export const STOCK_BRANDING: Branding = {
  name: 'SpendLog',
  copyright: 'SpendLog',
  logo: null,
  favicon: null,
  button_color: '#2F6B3D',
  branded: false,
  body_color: '#ffffff',
  plain_background: false,
};

export const brandingQueryKey = ['branding'] as const;

/**
 * The name, marks and colours the admin chose. Public, fetched once per launch
 * and kept: a failure leaves the stock look rather than an error.
 */
export function useBranding() {
  return useQuery({
    queryKey: brandingQueryKey,
    queryFn: getBranding,
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: STOCK_BRANDING,
  });
}
