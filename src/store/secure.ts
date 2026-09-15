import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The bearer token lives in the platform's secure storage (Keychain,
 * Keystore). The browser has none, so Expo web falls back to local storage.
 */
const KEY = 'spendlog.api_token';
const isWeb = Platform.OS === 'web';

export async function readToken(): Promise<string | null> {
  try {
    return isWeb ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function writeToken(token: string): Promise<void> {
  if (isWeb) await AsyncStorage.setItem(KEY, token);
  else await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    if (isWeb) await AsyncStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing stored, or storage unavailable: either way there is no token now.
  }
}
