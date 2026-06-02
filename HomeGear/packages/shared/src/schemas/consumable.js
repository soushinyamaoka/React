"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumableInputSchema = void 0;
const zod_1 = require("zod");
const dateString = zod_1.z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');
exports.consumableInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, '消耗品名を入力してください'),
    manufacturer: zod_1.z.string().trim().optional().nullable(),
    modelNumber: zod_1.z.string().trim().optional().nullable(),
    replacementIntervalText: zod_1.z.string().trim().optional().nullable(),
    lastReplacedDate: dateString.optional().or(zod_1.z.literal('').transform(() => undefined)),
    nextReplacementDate: dateString.optional().or(zod_1.z.literal('').transform(() => undefined)),
    purchaseUrl: zod_1.z
        .string()
        .trim()
        .url('URL形式で入力してください')
        .optional()
        .or(zod_1.z.literal('').transform(() => undefined)),
    memo: zod_1.z.string().trim().optional().nullable(),
});
