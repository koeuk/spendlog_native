import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createAdminUser,
  createFaq,
  deleteAdminUser,
  deleteFaq,
  getBrandingSettings,
  getColorSettings,
  getSpendingSettings,
  listAdminUsers,
  removeAdminUserAvatar,
  updateAdminUser,
  updateBrandingSettings,
  updateColorSettings,
  updateFaq,
  updateSpendingSettings,
  uploadAdminUserAvatar,
  type AdminUserPayload,
  type FaqPayload,
} from '@/api/endpoints/admin';
import type { PickedFile } from '@/api/multipart';

import { invalidate, keys } from './keys';
import { useInfiniteList } from './useInfiniteList';

export function useAdminUsers() {
  return useInfiniteList(keys.adminUsers, (page) => listAdminUsers(page));
}

export function useSaveAdminUser() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: AdminUserPayload }) => (uuid ? updateAdminUser(uuid, payload) : createAdminUser(payload)),
    onSuccess: () => invalidate('admin'),
  });
}

export function useDeleteAdminUser() {
  return useMutation({ mutationFn: deleteAdminUser, onSuccess: () => invalidate('admin') });
}

export function useAdminUserAvatar() {
  const upload = useMutation({
    mutationFn: ({ uuid, file }: { uuid: string; file: PickedFile }) => uploadAdminUserAvatar(uuid, file),
    onSuccess: () => invalidate('admin'),
  });
  const remove = useMutation({ mutationFn: removeAdminUserAvatar, onSuccess: () => invalidate('admin') });
  return { upload, remove };
}

export function useSaveFaq() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: FaqPayload }) => (uuid ? updateFaq(uuid, payload) : createFaq(payload)),
    onSuccess: () => invalidate('faqs'),
  });
}

export function useDeleteFaq() {
  return useMutation({ mutationFn: deleteFaq, onSuccess: () => invalidate('faqs') });
}

export function useSpendingSettings() {
  return useQuery({ queryKey: keys.spendingSettings, queryFn: getSpendingSettings });
}

/** The rate feeds every amount field, so the money settings refetch too. */
export function useUpdateSpendingSettings() {
  return useMutation({ mutationFn: updateSpendingSettings, onSuccess: () => invalidate('admin', 'money-settings', 'dashboard') });
}

export function useBrandingSettings() {
  return useQuery({ queryKey: keys.brandingSettings, queryFn: getBrandingSettings });
}

export function useUpdateBrandingSettings() {
  return useMutation({ mutationFn: updateBrandingSettings, onSuccess: () => invalidate('admin', 'branding') });
}

export function useColorSettings() {
  return useQuery({ queryKey: keys.colorSettings, queryFn: getColorSettings });
}

export function useUpdateColorSettings() {
  return useMutation({ mutationFn: updateColorSettings, onSuccess: () => invalidate('admin', 'branding') });
}
