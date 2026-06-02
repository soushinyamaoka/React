import { z } from 'zod';
import { MAINTENANCE_TYPES } from '../constants';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');

export const maintenanceRecordInputSchema = z
  .object({
    maintenanceDate: dateString,
    maintenanceType: z.enum(MAINTENANCE_TYPES).default('other'),
    description: z.string().trim().optional().nullable(),
    cost: z
      .union([z.number(), z.string()])
      .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
      .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
      .optional(),
    performedBy: z.string().trim().optional().nullable(),
    nextDueDate: dateString.optional().or(z.literal('').transform(() => undefined)),
    photoUrl: z
      .string()
      .trim()
      .url('URL形式で入力してください')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    memo: z.string().trim().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.nextDueDate && val.nextDueDate < val.maintenanceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nextDueDate'],
        message: '次回予定日は実施日以降にしてください',
      });
    }
  });

export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordInputSchema>;
