import { useMutation, useQuery } from '@tanstack/react-query';

import { getPreferences, updatePreferences } from '@/api/endpoints/preferences';
import { queryClient } from '@/api/queryClient';
import { useSessionStore } from '@/store/session';

import { moneySettingsQueryKey } from './useMoneySettings';

const preferencesQueryKey = ['preferences'] as const;

export function usePreferences() {
  return useQuery({ queryKey: preferencesQueryKey, queryFn: getPreferences });
}

/**
 * Saves the account's own choices. The theme reads them off the session user,
 * so that is updated in place and the app re-colours at once; amount fields
 * read the money settings, which now start on the chosen currency.
 */
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(preferencesQueryKey, preferences);
      const { user, setUser } = useSessionStore.getState();
      if (user) {
        setUser({ ...user, preferences: { currency: preferences.currency, button_color: preferences.button_color, body_color: preferences.body_color } });
      }
      void queryClient.invalidateQueries({ queryKey: moneySettingsQueryKey });
    },
  });
}
