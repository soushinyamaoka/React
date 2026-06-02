"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceLinkInputSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.deviceLinkInputSchema = zod_1.z.object({
    linkType: zod_1.z.enum(constants_1.LINK_TYPES).default('other'),
    title: zod_1.z.string().trim().optional().nullable(),
    url: zod_1.z.string().trim().url('URL形式で入力してください'),
    memo: zod_1.z.string().trim().optional().nullable(),
});
