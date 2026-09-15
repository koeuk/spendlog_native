import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** What the token is labelled with on the server's device list. */
export function deviceName(): string {
  return Device.modelName ?? Device.deviceName ?? (Platform.OS === 'web' ? 'Browser' : Platform.OS);
}
