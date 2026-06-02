"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationInputSchema = exports.categoryInputSchema = void 0;
const zod_1 = require("zod");
exports.categoryInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'カテゴリ名を入力してください'),
    icon: zod_1.z.string().trim().optional().nullable(),
    sortOrder: zod_1.z.number().int().optional(),
});
exports.locationInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, '設置場所名を入力してください'),
    parentId: zod_1.z.string().optional().nullable(),
    memo: zod_1.z.string().optional().nullable(),
    sortOrder: zod_1.z.number().int().optional(),
});
