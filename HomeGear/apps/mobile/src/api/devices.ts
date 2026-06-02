import { api } from './client';
import type { DeviceInput, DeviceListQuery } from '@homegear/shared';

export interface DeviceCategory {
  id: string;
  name: string;
  icon: string | null;
}
export interface DeviceLocation {
  id: string;
  name: string;
}

export interface DeviceSummary {
  id: string;
  name: string;
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  status: string;
  priority: string;
  categoryId: string | null;
  locationId: string | null;
  category?: DeviceCategory | null;
  location?: DeviceLocation | null;
  warrantyEndDate: string | null;
  purchaseDate: string | null;
  updatedAt: string;
}

export interface DeviceDetail extends DeviceSummary {
  manualUrl: string | null;
  supportUrl: string | null;
  officialUrl: string | null;
  purchaseStore: string | null;
  purchasePrice: number | null;
  purchaseUrl: string | null;
  orderNumber: string | null;
  warrantyStartDate: string | null;
  hasExtendedWarranty: boolean;
  warrantyMemo: string | null;
  photoUrl: string | null;
  labelPhotoUrl: string | null;
  installationPhotoUrl: string | null;
  memo: string | null;
  specs: DeviceSpec[];
  links: DeviceLink[];
  maintenanceRecords: MaintenanceRecord[];
  repairRecords: RepairRecord[];
  consumables: Consumable[];
  accessories: Accessory[];
  networkInfo: NetworkInfo | null;
}

export interface DeviceSpec {
  id: string;
  deviceId: string;
  specName: string;
  specValue: string | null;
  unit: string | null;
  memo: string | null;
  sortOrder: number;
}

export interface DeviceLink {
  id: string;
  deviceId: string;
  linkType: string;
  title: string | null;
  url: string;
  memo: string | null;
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string | null;
  cost: number | null;
  performedBy: string | null;
  nextDueDate: string | null;
  photoUrl: string | null;
  memo: string | null;
}

export interface RepairRecord {
  id: string;
  deviceId: string;
  occurredDate: string;
  symptom: string | null;
  cause: string | null;
  actionTaken: string | null;
  repairVendor: string | null;
  repairTicketNumber: string | null;
  cost: number | null;
  usedWarranty: boolean;
  completedDate: string | null;
  status: string;
  memo: string | null;
}

export interface Consumable {
  id: string;
  deviceId: string;
  name: string;
  manufacturer: string | null;
  modelNumber: string | null;
  replacementIntervalText: string | null;
  lastReplacedDate: string | null;
  nextReplacementDate: string | null;
  purchaseUrl: string | null;
  memo: string | null;
}

export interface Accessory {
  id: string;
  deviceId: string;
  name: string;
  quantity: number | null;
  storageLocation: string | null;
  memo: string | null;
}

export interface NetworkInfo {
  id: string;
  deviceId: string;
  ipAddress: string | null;
  hostName: string | null;
  macAddress: string | null;
  adminUrl: string | null;
  port: number | null;
  connectionType: string | null;
  credentialStorageMemo: string | null;
  settingsMemo: string | null;
}

export async function fetchDevices(query: Partial<DeviceListQuery> = {}): Promise<DeviceSummary[]> {
  const res = await api.get('/api/devices', { params: query });
  return res.data;
}

export async function fetchDevice(id: string): Promise<DeviceDetail> {
  const res = await api.get(`/api/devices/${id}`);
  return res.data;
}

export async function createDevice(input: DeviceInput): Promise<DeviceDetail> {
  const res = await api.post('/api/devices', input);
  return res.data;
}

export async function updateDevice(id: string, input: DeviceInput): Promise<DeviceDetail> {
  const res = await api.put(`/api/devices/${id}`, input);
  return res.data;
}

export async function deleteDevice(id: string): Promise<void> {
  await api.delete(`/api/devices/${id}`);
}

export async function disposeDevice(id: string): Promise<DeviceDetail> {
  const res = await api.post(`/api/devices/${id}/dispose`);
  return res.data;
}
