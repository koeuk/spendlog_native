// Keep the test environment quiet about the native modules the unit tests never touch.
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { hostUri: '192.168.1.20:8081' } } }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
