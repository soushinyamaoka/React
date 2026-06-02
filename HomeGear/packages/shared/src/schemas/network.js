"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkInfoInputSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.networkInfoInputSchema = zod_1.z.object({
    ipAddress: zod_1.z.string().trim().optional().nullable(),
    hostName: zod_1.z.string().trim().optional().nullable(),
    macAddress: zod_1.z.string().trim().optional().nullable(),
    adminUrl: zod_1.z
        .string()
        .trim()
        .url('URL形式で入力してください')
        .optional()
        .or(zod_1.z.literal('').transform(() => undefined)),
    port: zod_1.z
        .union([zod_1.z.number(), zod_1.z.string()])
        .transform((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)))
        .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 65535), 'ポート番号は0〜65535')
        .optional(),
    connectionType: zod_1.z.enum(constants_1.CONNECTION_TYPES).optional(),
    credentialStorageMemo: zod_1.z.string().trim().optional().nullable(),
    settingsMemo: zod_1.z.string().trim().optional().nullable(),
});
