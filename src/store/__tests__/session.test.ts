import type { User } from '@/types/api';

import { needsEmailVerification, useSessionStore } from '../session';

function user(overrides: Partial<User> = {}): User {
  return {
    uuid: 'u-1',
    name: 'Dara',
    username: null,
    email: 'dara@example.com',
    phone: null,
    avatar_url: null,
    is_admin: false,
    email_verified_at: null,
    created_at: '2026-09-29T00:00:00Z',
    ...overrides,
  };
}

describe('needsEmailVerification', () => {
  it('holds back a signed-in user whose email is unconfirmed', () => {
    expect(needsEmailVerification(user())).toBe(true);
  });

  it('lets a verified user, or no user, through', () => {
    expect(needsEmailVerification(user({ email_verified_at: '2026-09-29T00:01:00Z' }))).toBe(false);
    expect(needsEmailVerification(null)).toBe(false);
  });

  it('does not lock out a cached user that predates the field', () => {
    const legacy = user();
    delete (legacy as Partial<User>).email_verified_at;
    expect(needsEmailVerification(legacy)).toBe(false);
  });
});

describe('the session gate', () => {
  it('opens once the verified user from POST /email/verify is stored', async () => {
    await useSessionStore.getState().signIn({ token: 'abc', user: user() });
    expect(needsEmailVerification(useSessionStore.getState().user)).toBe(true);

    useSessionStore.getState().setUser(user({ email_verified_at: '2026-09-29T00:01:00Z' }));
    expect(useSessionStore.getState().status).toBe('signed-in');
    expect(needsEmailVerification(useSessionStore.getState().user)).toBe(false);
  });
});
