import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/** A yes/no question; resolves true when the person confirms. */
export function confirm({ title, message, confirmLabel, destructive = false }: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t('Cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel ?? t('OK'), style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}
