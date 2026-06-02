"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessoryInputSchema = void 0;
const zod_1 = require("zod");
exports.accessoryInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, '付属品名を入力してください'),
    quantity: zod_1.z
        .union([zod_1.z.number(), zod_1.z.string()])
        .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
        .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), '0以上の数値を入力してください')
        .optional(),
    storageLocation: zod_1.z.string().trim().optional().nullable(),
    memo: zod_1.z.string().trim().optional().nullable(),
});
