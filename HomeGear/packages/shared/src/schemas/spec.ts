import { z } from 'zod';

export const deviceSpecInputSchema = z.object({
  specName: z.string().trim().min(1, '項目名を入力してください'),
  specValue: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional().nullable(),
  memo: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export type DeviceSpecInput = z.infer<typeof deviceSpecInputSchema>;
