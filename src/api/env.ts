import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the SpendLog API lives.
 *
 * `EXPO_PUBLIC_API_URL` wins when set (the deployed server). Otherwise the host
 * is whatever machine Metro is serving from: the phone already reached it to
 * load the bundle, so it can reach `php artisan serve` on the same box. The
 * Android emulator falls back to 10.0.2.2, its alias for the host's loopback.
 *
 * Worth a knob rather than a constant: this machine has run more than one
 * Laravel app, and pointing at the wrong one fails as a *login error* rather
 * than a connection error, which reads like a bad password.
 */
const PORT = process.env.EXPO_PUBLIC_API_PORT ?? '8000';

function metroHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? null;
  if (!hostUri) return null;
  const host = hostUri.replace(/^https?:\/\//, '').split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

/** The server's origin, without the `/api/v1` suffix. */
export function apiOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/api\/v1\/?$/, '');
  const host = metroHost() ?? (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
  return `http://${host}:${PORT}`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `${apiOrigin()}/api/v1`;

/**
 * The server builds asset URLs (logo, avatars) from its own APP_URL, which in
 * development is 127.0.0.1: reachable from the server, not from a phone.
 * Re-point those at the host this app actually talks to.
 */
export function assetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, apiOrigin());
}
