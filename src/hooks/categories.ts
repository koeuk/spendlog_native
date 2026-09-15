import { useMutation, useQuery } from '@tanstack/react-query';

import { createCategory, deleteCategory, listCategories, updateCategory, type CategoryFilters, type CategoryPayload } from '@/api/endpoints/categories';

import { invalidate, keys, touches } from './keys';

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({ queryKey: keys.categories(filters), queryFn: () => listCategories(filters), staleTime: 5 * 60_000 });
}

export function useSaveCategory() {
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid?: string; payload: CategoryPayload }) => (uuid ? updateCategory(uuid, payload) : createCategory(payload)),
    onSuccess: () => invalidate(...touches.category),
  });
}

export function useDeleteCategory() {
  return useMutation({ mutationFn: deleteCategory, onSuccess: () => invalidate(...touches.category) });
}
