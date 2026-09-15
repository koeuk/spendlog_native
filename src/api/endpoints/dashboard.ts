import type { Dashboard, Ym } from '@/types/api';

import { api } from '../client';

export interface DashboardParams {
  budget_month?: Ym;
  breakdown_month?: Ym;
}

export async function getDashboard(params: DashboardParams = {}): Promise<Dashboard> {
  const { data } = await api.get<{ data: Dashboard }>('/dashboard', { params });
  return data.data;
}
