import { z } from 'zod';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');

export const consumableInputSchema = z.object({
  name: z.string().trim().min(1, '消耗品名を入力してください'),
  manufacturer: z.string().trim().optional().nullable(),
  modelNumber: z.string().trim().optional().nullable(),
  replacementIntervalText: z.string().trim().optional().nullable(),
  lastReplacedDate: dateString.optional().or(z.literal('').transform(() => undefined)),
  nextReplacementDate: dateString.optional().or(z.literal('').transform(() => undefined)),
  purchaseUrl: z
    .string()
    .trim()
    .url('URL形式で入力してください')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  memo: z.string().trim().optional().nullable(),
});

export type ConsumableInput = z.infer<typeof consumableInputSchema>;
