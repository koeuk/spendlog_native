import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { api, getAuthToken } from '@/api/client';
import { reportExportUrl, type ReportParams } from '@/api/endpoints/reports';
import { useLocaleStore } from '@/store/locale';
import type { ExportFormat } from '@/types/api';

const MIME: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

interface ExportRequest {
  format: ExportFormat;
  params: Omit<ReportParams, 'page' | 'per_page'>;
  /** Names the file: `spendlog-2026-07.pdf`. */
  anchor: string;
}

/**
 * The same file the web offers, downloaded with the bearer header and handed
 * to the system share sheet: save it, send it to Telegram, print it. The
 * browser gets a plain download instead.
 */
async function exportReport({ format, params, anchor }: ExportRequest): Promise<void> {
  const url = reportExportUrl(format, params);
  const name = `spendlog-${anchor || 'all'}.${format}`;

  if (Platform.OS === 'web') {
    const response = await api.get<Blob>(url, { responseType: 'blob' });
    const href = URL.createObjectURL(response.data);
    const anchorElement = document.createElement('a');
    anchorElement.href = href;
    anchorElement.download = name;
    anchorElement.click();
    URL.revokeObjectURL(href);
    return;
  }

  const destination = new File(Paths.cache, name);
  const file = await File.downloadFileAsync(url, destination, {
    idempotent: true,
    headers: {
      Authorization: `Bearer ${getAuthToken() ?? ''}`,
      Accept: MIME[format],
      'Accept-Language': useLocaleStore.getState().locale,
    },
  });
  await Sharing.shareAsync(file.uri, { mimeType: MIME[format], dialogTitle: name });
}

export function useExportReport() {
  return useMutation({ mutationFn: exportReport });
}
