import type { AuthResponse, User } from '@/types/api';

import { api } from '../client';

export interface LoginPayload {
  /** The account's email or username; the server resolves on the `@`. */
  email: string;
  password: string;
  device_name: string;
  abilities?: string[];
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', payload);
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/me');
  return data.data;
}

/** Revokes only the calling token; other devices stay signed in. */
export async function logout(): Promise<void> {
  await api.post('/logout');
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/forgot-password', { email });
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await api.post('/reset-password', payload);
}
