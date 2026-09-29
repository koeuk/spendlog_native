import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /**
   * Paint the page one flat colour and drop the two washes of light behind the
   * glass. This device only: it is about what is comfortable to look at, not
   * about the account, so it does not follow the user to their other phones.
   */
  plain: boolean;
  setPlain: (plain: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      plain: false,
      setPlain: (plain) => set({ plain }),
    }),
    {
      name: 'spendlog.theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
