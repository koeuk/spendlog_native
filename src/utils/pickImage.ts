import * as ImagePicker from 'expo-image-picker';

import type { PickedFile } from '@/api/multipart';
import { t } from '@/i18n';
import { toast } from '@/store/toast';

/** One image from the library, as a file ready for a multipart upload; `null` when nothing was chosen. */
export async function pickImage({ square = true }: { square?: boolean } = {}): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    toast(t('Allow photo access to choose a picture.'), 'error');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 0.85,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const type = asset.mimeType ?? 'image/jpeg';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return { uri: asset.uri, name: asset.fileName ?? `photo.${extension}`, type };
}
