import { api } from './client';
import type { AiImportPayload } from '@homegear/shared';
import type { DeviceDetail } from './devices';

export interface AiImportParseResult {
  payload: AiImportPayload;
  existingDevice: any | null;
}

export async function parseAiImport(rawJson: string, deviceId?: string): Promise<AiImportParseResult> {
  const res = await api.post('/api/ai-import/parse', { rawJson, deviceId });
  return res.data;
}

export interface AiImportApplyResult {
  ok: boolean;
  counts: {
    deviceFieldsUpdated: number;
    specsCreated: number;
    linksCreated: number;
    consumablesCreated: number;
    accessoriesCreated: number;
  };
}

export async function applyAiImport(
  deviceId: string,
  payload: AiImportPayload,
  options: {
    overwrite?: boolean;
    applySpecs?: boolean;
    applyLinks?: boolean;
    applyConsumables?: boolean;
    applyAccessories?: boolean;
  } = {}
): Promise<AiImportApplyResult> {
  const res = await api.post(`/api/devices/${deviceId}/ai-import/apply`, {
    payload,
    overwrite: options.overwrite ?? false,
    applySpecs: options.applySpecs ?? true,
    applyLinks: options.applyLinks ?? true,
    applyConsumables: options.applyConsumables ?? true,
    applyAccessories: options.applyAccessories ?? true,
  });
  return res.data;
}

export interface AiImportCreateAndApplyResult {
  device: DeviceDetail;
  counts: {
    specsCreated: number;
    linksCreated: number;
    consumablesCreated: number;
    accessoriesCreated: number;
  };
}

export async function createAndApplyAiImport(
  device: {
    name: string;
    categoryId?: string | null;
    locationId?: string | null;
    status?: string;
    priority?: string;
  },
  payload: AiImportPayload,
  options: {
    applySpecs?: boolean;
    applyLinks?: boolean;
    applyConsumables?: boolean;
    applyAccessories?: boolean;
  } = {}
): Promise<AiImportCreateAndApplyResult> {
  const res = await api.post('/api/ai-import/create-and-apply', {
    device,
    payload,
    applySpecs: options.applySpecs ?? true,
    applyLinks: options.applyLinks ?? true,
    applyConsumables: options.applyConsumables ?? true,
    applyAccessories: options.applyAccessories ?? true,
  });
  return res.data;
}
