import { Platform } from 'react-native';

/** A file picked on the device, ready to append to a multipart body. */
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * React Native's FormData takes `{ uri, name, type }` and streams the file;
 * the browser needs a Blob. Either way the runtime sets the multipart
 * boundary itself, so callers never set `Content-Type` by hand.
 */
export async function appendFile(form: FormData, field: string, file: PickedFile): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then((response) => response.blob());
    form.append(field, blob, file.name);
    return;
  }
  form.append(field, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
}
