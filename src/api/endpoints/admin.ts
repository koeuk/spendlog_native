import type {
  AdminUser,
  BrandingSettings,
  ColorSettings,
  Currency,
  Faq,
  FaqStatus,
  Paginated,
  RoleName,
  SpendingSettings,
  UserStatus,
} from '@/types/api';

import { api } from '../client';
import { appendFile, type PickedFile } from '../multipart';

// Users -----------------------------------------------------------------------

export async function listAdminUsers(page = 1): Promise<Paginated<AdminUser>> {
  const { data } = await api.get<Paginated<AdminUser>>('/admin/users', { params: { page } });
  return data;
}

export interface AdminUserPayload {
  name: string;
  email: string;
  /** Required on create; leave out on update to keep the current one. */
  password?: string;
  password_confirmation?: string;
  role: Exclude<RoleName, 'super_admin'>;
  status: UserStatus;
}

export async function createAdminUser(payload: AdminUserPayload): Promise<AdminUser> {
  const { data } = await api.post<{ data: AdminUser }>('/admin/users', payload);
  return data.data;
}

export async function updateAdminUser(uuid: string, payload: AdminUserPayload): Promise<AdminUser> {
  const { data } = await api.patch<{ data: AdminUser }>(`/admin/users/${uuid}`, payload);
  return data.data;
}

export async function deleteAdminUser(uuid: string): Promise<void> {
  await api.delete(`/admin/users/${uuid}`);
}

export async function uploadAdminUserAvatar(uuid: string, file: PickedFile): Promise<AdminUser> {
  const form = new FormData();
  await appendFile(form, 'avatar', file);
  const { data } = await api.post<{ data: AdminUser }>(`/admin/users/${uuid}/avatar`, form);
  return data.data;
}

export async function removeAdminUserAvatar(uuid: string): Promise<AdminUser> {
  const { data } = await api.delete<{ data: AdminUser }>(`/admin/users/${uuid}/avatar`);
  return data.data;
}

// FAQ -------------------------------------------------------------------------

/** Open to any token: the Help screen is for everyone. */
export async function listFaqs(): Promise<Faq[]> {
  const { data } = await api.get<{ data: Faq[] }>('/faqs');
  return data.data;
}

export interface FaqPayload {
  question: string;
  answer: string;
  status: FaqStatus;
}

export async function createFaq(payload: FaqPayload): Promise<Faq> {
  const { data } = await api.post<{ data: Faq }>('/admin/faqs', payload);
  return data.data;
}

export async function updateFaq(uuid: string, payload: FaqPayload): Promise<Faq> {
  const { data } = await api.patch<{ data: Faq }>(`/admin/faqs/${uuid}`, payload);
  return data.data;
}

export async function deleteFaq(uuid: string): Promise<void> {
  await api.delete(`/admin/faqs/${uuid}`);
}

// Settings --------------------------------------------------------------------

export async function getSpendingSettings(): Promise<SpendingSettings> {
  const { data } = await api.get<{ data: SpendingSettings }>('/admin/settings/spending');
  return data.data;
}

export interface SpendingPayload {
  enabled: boolean;
  warning?: string;
  advice?: string;
  khr_per_usd?: number;
  default_currency?: Currency;
}

export async function updateSpendingSettings(payload: SpendingPayload): Promise<SpendingSettings> {
  const { data } = await api.put<{ data: SpendingSettings }>('/admin/settings/spending', payload);
  return data.data;
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const { data } = await api.get<{ data: BrandingSettings }>('/admin/settings/branding');
  return data.data;
}

export interface BrandingPayload {
  app_name: string;
  copyright_holder?: string;
  logo?: PickedFile | null;
  favicon?: PickedFile | null;
  remove_logo?: boolean;
  remove_favicon?: boolean;
}

/** Multipart on POST: files do not parse on PUT. */
export async function updateBrandingSettings(payload: BrandingPayload): Promise<BrandingSettings> {
  const form = new FormData();
  form.append('app_name', payload.app_name);
  form.append('copyright_holder', payload.copyright_holder ?? '');
  if (payload.logo) await appendFile(form, 'logo', payload.logo);
  if (payload.favicon) await appendFile(form, 'favicon', payload.favicon);
  if (payload.remove_logo) form.append('remove_logo', '1');
  if (payload.remove_favicon) form.append('remove_favicon', '1');
  const { data } = await api.post<{ data: BrandingSettings }>('/admin/settings/branding', form);
  return data.data;
}

export async function getColorSettings(): Promise<ColorSettings> {
  const { data } = await api.get<{ data: ColorSettings }>('/admin/settings/colors');
  return data.data;
}

export async function updateColorSettings(payload: { button_color: string; body_color: string }): Promise<ColorSettings> {
  const { data } = await api.put<{ data: ColorSettings }>('/admin/settings/colors', payload);
  return data.data;
}
