"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceRecordInputSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const dateString = zod_1.z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');
exports.maintenanceRecordInputSchema = zod_1.z
    .object({
    maintenanceDate: dateString,
    maintenanceType: zod_1.z.enum(constants_1.MAINTENANCE_TYPES).default('other'),
    description: zod_1.z.string().trim().optional().nullable(),
    cost: zod_1.z
        .union([zod_1.z.number(), zod_1.z.string()])
        .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
        .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
        .optional(),
    performedBy: zod_1.z.string().trim().optional().nullable(),
    nextDueDate: dateString.optional().or(zod_1.z.literal('').transform(() => undefined)),
    photoUrl: zod_1.z
        .string()
        .trim()
        .url('URL形式で入力してください')
        .optional()
        .or(zod_1.z.literal('').transform(() => undefined)),
    memo: zod_1.z.string().trim().optional().nullable(),
})
    .superRefine((val, ctx) => {
    if (val.nextDueDate && val.nextDueDate < val.maintenanceDate) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['nextDueDate'],
            message: '次回予定日は実施日以降にしてください',
        });
    }
});
