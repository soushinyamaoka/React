// ダッシュボード用の型のみ提供（クライアントから読み取り専用）

export interface DashboardDeviceSummary {
  id: string;
  name: string;
  manufacturer?: string | null;
  modelNumber?: string | null;
  status: string;
  categoryName?: string | null;
  locationName?: string | null;
  warrantyEndDate?: string | null;
  nextMaintenanceDate?: string | null;
}

export interface DashboardSummary {
  deviceCount: number;
  warrantyExpiringSoonDevices: DashboardDeviceSummary[];
  warrantyExpiredDevices: DashboardDeviceSummary[];
  upcomingMaintenanceDevices: DashboardDeviceSummary[];
  brokenDevices: DashboardDeviceSummary[];
  recentDevices: DashboardDeviceSummary[];
  incompleteDevices: DashboardDeviceSummary[];
}
