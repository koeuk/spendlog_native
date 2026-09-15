import type { ExportFormat, Granularity, Report } from '@/types/api';

import { api } from '../client';
import { API_BASE_URL } from '../env';

export interface ReportParams {
  period: Granularity;
  /** `YYYY-MM-DD` (week), `YYYY-MM` (month), `YYYY` (year); ignored for `all`. */
  at?: string;
  page?: number;
  per_page?: 20 | 50 | 100 | 150 | 200;
}

export async function getReport(params: ReportParams): Promise<Report> {
  const { data } = await api.get<{ data: Report }>('/reports', { params });
  return data.data;
}

/** The same file the web offers, fetched with the bearer header by the caller. */
export function reportExportUrl(format: ExportFormat, params: Omit<ReportParams, 'page' | 'per_page'>): string {
  const query = new URLSearchParams({ period: params.period });
  if (params.at) query.set('at', params.at);
  return `${API_BASE_URL}/reports/export/${format}?${query.toString()}`;
}
