import { z } from 'zod';
import { DEVICE_PRIORITIES, DEVICE_STATUSES } from '../constants';

const optionalUrl = z
  .string()
  .trim()
  .url('URL形式で入力してください')
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalNonNegativeNumber = z
  .union([z.number(), z.string()])
  .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
  .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
  .optional();

export const deviceInputSchema = z
  .object({
    name: z.string().trim().min(1, '機器名を入力してください'),
    categoryId: z.string().optional().nullable(),
    manufacturer: z.string().trim().optional().or(z.literal('').transform(() => undefined)),
    modelNumber: z.string().trim().optional().or(z.literal('').transform(() => undefined)),
    serialNumber: z.string().trim().optional().or(z.literal('').transform(() => undefined)),
    locationId: z.string().optional().nullable(),
    status: z.enum(DEVICE_STATUSES).default('in_use'),
    priority: z.enum(DEVICE_PRIORITIES).default('medium'),

    purchaseDate: optionalDate,
    purchaseStore: z.string().trim().optional().or(z.literal('').transform(() => undefined)),
    purchasePrice: optionalNonNegativeNumber,
    purchaseUrl: optionalUrl,
    orderNumber: z.string().trim().optional().or(z.literal('').transform(() => undefined)),

    warrantyStartDate: optionalDate,
    warrantyEndDate: optionalDate,
    hasExtendedWarranty: z.boolean().optional(),
    warrantyMemo: z.string().trim().optional().or(z.literal('').transform(() => undefined)),

    manualUrl: optionalUrl,
    supportUrl: optionalUrl,
    officialUrl: optionalUrl,

    photoUrl: optionalUrl,
    labelPhotoUrl: optionalUrl,
    installationPhotoUrl: optionalUrl,

    memo: z.string().optional().or(z.literal('').transform(() => undefined)),
  })
  .superRefine((val, ctx) => {
    if (val.warrantyStartDate && val.warrantyEndDate && val.warrantyEndDate < val.warrantyStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warrantyEndDate'],
        message: '保証終了日は保証開始日以降にしてください',
      });
    }
  });

export type DeviceInput = z.infer<typeof deviceInputSchema>;

export const deviceListQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  locationId: z.string().optional(),
  status: z.enum(DEVICE_STATUSES).optional(),
  warrantyFilter: z.enum(['expiring_soon', 'expired', 'none']).optional(),
  sort: z
    .enum([
      'created_desc',
      'updated_desc',
      'name_asc',
      'warranty_asc',
      'purchase_desc',
      'next_maintenance_asc',
    ])
    .default('updated_desc')
    .optional(),
  includeDisposed: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .optional(),
});

export type DeviceListQuery = z.infer<typeof deviceListQuerySchema>;
