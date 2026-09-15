import type { User } from '@/types/api';

import { api } from '../client';
import { appendFile, type PickedFile } from '../multipart';

export interface ProfilePayload {
  name: string;
  /** Blank releases the handle. */
  username?: string | null;
  email: string;
  phone?: string | null;
}

export async function updateProfile(payload: ProfilePayload): Promise<User> {
  const { data } = await api.patch<{ data: User }>('/profile', payload);
  return data.data;
}

/** JPEG, PNG or WebP up to 4 MB; replaces whatever was there. */
export async function uploadAvatar(file: PickedFile): Promise<User> {
  const form = new FormData();
  await appendFile(form, 'avatar', file);
  const { data } = await api.post<{ data: User }>('/profile/avatar', form);
  return data.data;
}

export async function removeAvatar(): Promise<User> {
  const { data } = await api.delete<{ data: User }>('/profile/avatar');
  return data.data;
}

export interface PasswordPayload {
  password: string;
  password_confirmation: string;
}

/** No current-password check; existing tokens stay valid. */
export async function changePassword(payload: PasswordPayload): Promise<void> {
  await api.put('/password', payload);
}
