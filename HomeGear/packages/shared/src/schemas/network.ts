import { z } from 'zod';
import { CONNECTION_TYPES } from '../constants';

export const networkInfoInputSchema = z.object({
  ipAddress: z.string().trim().optional().nullable(),
  hostName: z.string().trim().optional().nullable(),
  macAddress: z.string().trim().optional().nullable(),
  adminUrl: z
    .string()
    .trim()
    .url('URL形式で入力してください')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  port: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 65535), 'ポート番号は0〜65535')
    .optional(),
  connectionType: z.enum(CONNECTION_TYPES).optional(),
  credentialStorageMemo: z.string().trim().optional().nullable(),
  settingsMemo: z.string().trim().optional().nullable(),
});

export type NetworkInfoInput = z.infer<typeof networkInfoInputSchema>;
