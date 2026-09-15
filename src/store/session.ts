import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { errorStatus, onUnauthorized, setAuthToken } from '@/api/client';
import { logout, me } from '@/api/endpoints/auth';
import { queryClient } from '@/api/queryClient';
import type { AuthResponse, User } from '@/types/api';

import { clearToken, readToken, writeToken } from './secure';

const USER_KEY = 'spendlog.user';

export type SessionStatus = 'restoring' | 'signed-out' | 'signed-in';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  /** Read the stored token and confirm it with `GET /me`. Runs once at launch. */
  restore: () => Promise<void>;
  signIn: (auth: AuthResponse) => Promise<void>;
  signOut: (options?: { revoke?: boolean }) => Promise<void>;
  setUser: (user: User) => void;
}

async function readCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null): void {
  const write = user ? AsyncStorage.setItem(USER_KEY, JSON.stringify(user)) : AsyncStorage.removeItem(USER_KEY);
  write.catch(() => {});
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: 'restoring',
  user: null,

  async restore() {
    const token = await readToken();
    if (!token) {
      set({ status: 'signed-out', user: null });
      return;
    }
    setAuthToken(token);
    try {
      const user = await me();
      cacheUser(user);
      set({ status: 'signed-in', user });
    } catch (error) {
      const cached = await readCachedUser();
      // A 401 means the token is dead (the interceptor already dropped it).
      // Anything else is the network: keep the last known user so the app
      // opens offline rather than bouncing to login.
      if (errorStatus(error) === 401 || !cached) {
        setAuthToken(null);
        await clearToken();
        cacheUser(null);
        set({ status: 'signed-out', user: null });
      } else {
        set({ status: 'signed-in', user: cached });
      }
    }
  },

  async signIn({ token, user }) {
    setAuthToken(token);
    await writeToken(token);
    cacheUser(user);
    set({ status: 'signed-in', user });
  },

  async signOut({ revoke = true } = {}) {
    if (revoke) {
      try {
        await logout();
      } catch {
        // The token may already be gone; the local session ends either way.
      }
    }
    setAuthToken(null);
    await clearToken();
    cacheUser(null);
    // Another account must never see this one's cached rows.
    queryClient.clear();
    set({ status: 'signed-out', user: null });
  },

  setUser(user) {
    cacheUser(user);
    if (get().user?.uuid !== user.uuid || get().user !== user) set({ user });
  },
}));

onUnauthorized(() => {
  const session = useSessionStore.getState();
  if (session.status !== 'signed-out') void session.signOut({ revoke: false });
});
