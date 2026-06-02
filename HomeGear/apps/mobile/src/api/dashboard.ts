import { api } from './client';
import type { DashboardSummary } from '@homegear/shared';

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await api.get('/api/dashboard');
  return res.data;
}
