"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairRecordInputSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const dateString = zod_1.z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');
exports.repairRecordInputSchema = zod_1.z
    .object({
    occurredDate: dateString,
    symptom: zod_1.z.string().trim().optional().nullable(),
    cause: zod_1.z.string().trim().optional().nullable(),
    actionTaken: zod_1.z.string().trim().optional().nullable(),
    repairVendor: zod_1.z.string().trim().optional().nullable(),
    repairTicketNumber: zod_1.z.string().trim().optional().nullable(),
    cost: zod_1.z
        .union([zod_1.z.number(), zod_1.z.string()])
        .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
        .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
        .optional(),
    usedWarranty: zod_1.z.boolean().optional(),
    completedDate: dateString.optional().or(zod_1.z.literal('').transform(() => undefined)),
    status: zod_1.z.enum(constants_1.REPAIR_STATUSES).default('pending'),
    memo: zod_1.z.string().trim().optional().nullable(),
})
    .superRefine((val, ctx) => {
    if (val.completedDate && val.completedDate < val.occurredDate) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['completedDate'],
            message: '完了日は発生日以降にしてください',
        });
    }
});
