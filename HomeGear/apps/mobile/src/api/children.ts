// device 配下の子テーブル群 API
import { api } from './client';
import type {
  DeviceSpecInput,
  DeviceLinkInput,
  MaintenanceRecordInput,
  RepairRecordInput,
  ConsumableInput,
  AccessoryInput,
  NetworkInfoInput,
} from '@homegear/shared';
import type {
  DeviceSpec,
  DeviceLink,
  MaintenanceRecord,
  RepairRecord,
  Consumable,
  Accessory,
  NetworkInfo,
} from './devices';

// ---- specs ----
export async function createSpec(deviceId: string, input: DeviceSpecInput): Promise<DeviceSpec> {
  const res = await api.post(`/api/devices/${deviceId}/specs`, input);
  return res.data;
}
export async function updateSpec(specId: string, input: DeviceSpecInput): Promise<DeviceSpec> {
  const res = await api.put(`/api/device-specs/${specId}`, input);
  return res.data;
}
export async function deleteSpec(specId: string): Promise<void> {
  await api.delete(`/api/device-specs/${specId}`);
}

// ---- links ----
export async function createLink(deviceId: string, input: DeviceLinkInput): Promise<DeviceLink> {
  const res = await api.post(`/api/devices/${deviceId}/links`, input);
  return res.data;
}
export async function updateLink(linkId: string, input: DeviceLinkInput): Promise<DeviceLink> {
  const res = await api.put(`/api/device-links/${linkId}`, input);
  return res.data;
}
export async function deleteLink(linkId: string): Promise<void> {
  await api.delete(`/api/device-links/${linkId}`);
}

// ---- maintenance ----
export async function createMaintenance(
  deviceId: string,
  input: MaintenanceRecordInput
): Promise<MaintenanceRecord> {
  const res = await api.post(`/api/devices/${deviceId}/maintenance-records`, input);
  return res.data;
}
export async function updateMaintenance(
  recordId: string,
  input: MaintenanceRecordInput
): Promise<MaintenanceRecord> {
  const res = await api.put(`/api/maintenance-records/${recordId}`, input);
  return res.data;
}
export async function deleteMaintenance(recordId: string): Promise<void> {
  await api.delete(`/api/maintenance-records/${recordId}`);
}

// ---- repairs ----
export async function createRepair(
  deviceId: string,
  input: RepairRecordInput
): Promise<RepairRecord> {
  const res = await api.post(`/api/devices/${deviceId}/repair-records`, input);
  return res.data;
}
export async function updateRepair(
  recordId: string,
  input: RepairRecordInput
): Promise<RepairRecord> {
  const res = await api.put(`/api/repair-records/${recordId}`, input);
  return res.data;
}
export async function deleteRepair(recordId: string): Promise<void> {
  await api.delete(`/api/repair-records/${recordId}`);
}

// ---- consumables ----
export async function createConsumable(
  deviceId: string,
  input: ConsumableInput
): Promise<Consumable> {
  const res = await api.post(`/api/devices/${deviceId}/consumables`, input);
  return res.data;
}
export async function updateConsumable(
  consumableId: string,
  input: ConsumableInput
): Promise<Consumable> {
  const res = await api.put(`/api/consumables/${consumableId}`, input);
  return res.data;
}
export async function deleteConsumable(consumableId: string): Promise<void> {
  await api.delete(`/api/consumables/${consumableId}`);
}

// ---- accessories ----
export async function createAccessory(
  deviceId: string,
  input: AccessoryInput
): Promise<Accessory> {
  const res = await api.post(`/api/devices/${deviceId}/accessories`, input);
  return res.data;
}
export async function updateAccessory(
  accessoryId: string,
  input: AccessoryInput
): Promise<Accessory> {
  const res = await api.put(`/api/accessories/${accessoryId}`, input);
  return res.data;
}
export async function deleteAccessory(accessoryId: string): Promise<void> {
  await api.delete(`/api/accessories/${accessoryId}`);
}

// ---- network info ----
export async function upsertNetworkInfo(
  deviceId: string,
  input: NetworkInfoInput
): Promise<NetworkInfo> {
  const res = await api.post(`/api/devices/${deviceId}/network-info`, input);
  return res.data;
}
export async function deleteNetworkInfo(networkInfoId: string): Promise<void> {
  await api.delete(`/api/network-infos/${networkInfoId}`);
}
