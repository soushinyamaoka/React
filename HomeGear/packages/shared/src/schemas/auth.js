"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResponseSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('メールアドレスの形式が不正です'),
    password: zod_1.z.string().min(8, 'パスワードは8文字以上で入力してください'),
    name: zod_1.z.string().min(1, '名前を入力してください'),
    householdName: zod_1.z.string().min(1, '家庭名を入力してください').optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string(),
        email: zod_1.z.string(),
        name: zod_1.z.string(),
        householdId: zod_1.z.string(),
        householdName: zod_1.z.string(),
        role: zod_1.z.string(),
    }),
});
