import type { AuthResponse, User } from '@/types/api';

import { api } from '../client';

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<User>;
  return typeof user.uuid === 'string' && typeof user.email === 'string';
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') return false;
  const auth = value as Partial<AuthResponse>;
  return typeof auth.token === 'string' && isUser(auth.user);
}

function invalidApiResponse(endpoint: string): Error {
  return new Error(`Invalid response from ${endpoint}. Check EXPO_PUBLIC_API_URL and the backend type.`);
}

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
  const { data } = await api.post<unknown>('/login', payload);
  if (!isAuthResponse(data)) throw invalidApiResponse('/login');
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<unknown>('/register', payload);
  if (!isAuthResponse(data)) throw invalidApiResponse('/register');
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<unknown>('/me');
  const user = data && typeof data === 'object' && 'data' in data ? data.data : undefined;
  if (!isUser(user)) throw invalidApiResponse('/me');
  return user;
}

/** Revokes only the calling token; other devices stay signed in. */
export async function logout(): Promise<void> {
  await api.post('/logout');
}

export interface VerifyEmailResponse {
  message: string;
  user: User;
}

/** Confirms the account's email with the six-digit code the server mailed. */
export async function verifyEmail(code: string): Promise<VerifyEmailResponse> {
  const { data } = await api.post<VerifyEmailResponse>('/email/verify', { code });
  return data;
}

/** Mails a fresh code; the server refuses a second one within 60 seconds. */
export async function resendVerificationCode(): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/email/verification-notification');
  return data;
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
