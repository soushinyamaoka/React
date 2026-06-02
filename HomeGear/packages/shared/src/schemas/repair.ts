import { z } from 'zod';
import { REPAIR_STATUSES } from '../constants';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');

export const repairRecordInputSchema = z
  .object({
    occurredDate: dateString,
    symptom: z.string().trim().optional().nullable(),
    cause: z.string().trim().optional().nullable(),
    actionTaken: z.string().trim().optional().nullable(),
    repairVendor: z.string().trim().optional().nullable(),
    repairTicketNumber: z.string().trim().optional().nullable(),
    cost: z
      .union([z.number(), z.string()])
      .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
      .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
      .optional(),
    usedWarranty: z.boolean().optional(),
    completedDate: dateString.optional().or(z.literal('').transform(() => undefined)),
    status: z.enum(REPAIR_STATUSES).default('pending'),
    memo: z.string().trim().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.completedDate && val.completedDate < val.occurredDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['completedDate'],
        message: '完了日は発生日以降にしてください',
      });
    }
  });

export type RepairRecordInput = z.infer<typeof repairRecordInputSchema>;
