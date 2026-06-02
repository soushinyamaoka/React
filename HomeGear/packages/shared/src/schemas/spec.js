"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceSpecInputSchema = void 0;
const zod_1 = require("zod");
exports.deviceSpecInputSchema = zod_1.z.object({
    specName: zod_1.z.string().trim().min(1, '項目名を入力してください'),
    specValue: zod_1.z.string().trim().optional().nullable(),
    unit: zod_1.z.string().trim().optional().nullable(),
    memo: zod_1.z.string().trim().optional().nullable(),
    sortOrder: zod_1.z.number().int().optional(),
});
