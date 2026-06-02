"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceListQuerySchema = exports.deviceInputSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const optionalUrl = zod_1.z
    .string()
    .trim()
    .url('URL形式で入力してください')
    .optional()
    .or(zod_1.z.literal('').transform(() => undefined));
const optionalDate = zod_1.z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')
    .optional()
    .or(zod_1.z.literal('').transform(() => undefined));
const optionalNonNegativeNumber = zod_1.z
    .union([zod_1.z.number(), zod_1.z.string()])
    .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
    .optional();
exports.deviceInputSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1, '機器名を入力してください'),
    categoryId: zod_1.z.string().optional().nullable(),
    manufacturer: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    modelNumber: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    serialNumber: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    locationId: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(constants_1.DEVICE_STATUSES).default('in_use'),
    priority: zod_1.z.enum(constants_1.DEVICE_PRIORITIES).default('medium'),
    purchaseDate: optionalDate,
    purchaseStore: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    purchasePrice: optionalNonNegativeNumber,
    purchaseUrl: optionalUrl,
    orderNumber: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    warrantyStartDate: optionalDate,
    warrantyEndDate: optionalDate,
    hasExtendedWarranty: zod_1.z.boolean().optional(),
    warrantyMemo: zod_1.z.string().trim().optional().or(zod_1.z.literal('').transform(() => undefined)),
    manualUrl: optionalUrl,
    supportUrl: optionalUrl,
    officialUrl: optionalUrl,
    photoUrl: optionalUrl,
    labelPhotoUrl: optionalUrl,
    installationPhotoUrl: optionalUrl,
    memo: zod_1.z.string().optional().or(zod_1.z.literal('').transform(() => undefined)),
})
    .superRefine((val, ctx) => {
    if (val.warrantyStartDate && val.warrantyEndDate && val.warrantyEndDate < val.warrantyStartDate) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['warrantyEndDate'],
            message: '保証終了日は保証開始日以降にしてください',
        });
    }
});
exports.deviceListQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
    locationId: zod_1.z.string().optional(),
    status: zod_1.z.enum(constants_1.DEVICE_STATUSES).optional(),
    warrantyFilter: zod_1.z.enum(['expiring_soon', 'expired', 'none']).optional(),
    sort: zod_1.z
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
    includeDisposed: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((v) => v === true || v === 'true')
        .optional(),
});
