import { z } from 'zod';

export const accessoryInputSchema = z.object({
  name: z.string().trim().min(1, '付属品名を入力してください'),
  quantity: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
    .optional(),
  storageLocation: z.string().trim().optional().nullable(),
  memo: z.string().trim().optional().nullable(),
});

export type AccessoryInput = z.infer<typeof accessoryInputSchema>;
