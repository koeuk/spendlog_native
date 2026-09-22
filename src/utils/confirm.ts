import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface ChooseOptions {
  title: string;
  message?: string;
  /** The action that goes ahead with what was asked for. */
  confirmLabel: string;
  /** The other reading of the same intent. */
  altLabel: string;
  destructive?: boolean;
}

/**
 * A question with two answers and a way out — for the times the obvious
 * action and the one someone probably meant are different things.
 *
 * The web has no three-button dialog, so it asks the two questions in turn
 * rather than pretending the choice is binary.
 */
export function choose({ title, message, confirmLabel, altLabel, destructive = false }: ChooseOptions): Promise<'confirm' | 'alt' | 'cancel'> {
  if (Platform.OS === 'web') {
    const head = message ? `${title}\n\n${message}` : title;
    if (window.confirm(`${head}\n\n${confirmLabel}?`)) return Promise.resolve('confirm');
    return Promise.resolve(window.confirm(`${altLabel}?`) ? 'alt' : 'cancel');
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t('Cancel'), style: 'cancel', onPress: () => resolve('cancel') },
      { text: altLabel, onPress: () => resolve('alt') },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve('confirm') },
    ]);
  });
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
