import { useMutation } from '@tanstack/react-query';

import { changePassword, removeAvatar, updateProfile, uploadAvatar } from '@/api/endpoints/profile';
import type { PickedFile } from '@/api/multipart';
import { useSessionStore } from '@/store/session';

export function useUpdateProfile() {
  const setUser = useSessionStore((state) => state.setUser);
  return useMutation({ mutationFn: updateProfile, onSuccess: setUser });
}

export function useAvatar() {
  const setUser = useSessionStore((state) => state.setUser);
  const upload = useMutation({ mutationFn: (file: PickedFile) => uploadAvatar(file), onSuccess: setUser });
  const remove = useMutation({ mutationFn: removeAvatar, onSuccess: setUser });
  return { upload, remove };
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
