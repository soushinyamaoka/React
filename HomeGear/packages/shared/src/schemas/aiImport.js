"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiImportApplySchema = exports.aiImportPayloadSchema = void 0;
exports.buildAiResearchPrompt = buildAiResearchPrompt;
const zod_1 = require("zod");
// AI の出力 JSON を受け入れる Zod スキーマ
const optionalString = zod_1.z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v === '' ? undefined : v));
const optionalUrl = zod_1.z
    .union([zod_1.z.string().url(), zod_1.z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v == null || v === '' ? undefined : v));
exports.aiImportPayloadSchema = zod_1.z.object({
    device: zod_1.z
        .object({
        name: optionalString,
        manufacturer: optionalString,
        model_number: optionalString,
        category_suggestion: optionalString,
        summary: optionalString,
    })
        .partial()
        .optional(),
    specs: zod_1.z
        .array(zod_1.z.object({
        spec_name: zod_1.z.string().min(1, 'spec_name は必須です'),
        spec_value: optionalString,
        unit: optionalString,
        memo: optionalString,
    }))
        .optional(),
    links: zod_1.z
        .array(zod_1.z.object({
        link_type: zod_1.z
            .enum(['official', 'manual', 'support', 'purchase', 'other'])
            .default('other'),
        title: optionalString,
        url: zod_1.z.string().url('linkのurlがURL形式ではありません'),
        memo: optionalString,
    }))
        .optional(),
    consumables: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'consumable.name は必須です'),
        manufacturer: optionalString,
        model_number: optionalString,
        replacement_interval_text: optionalString,
        purchase_url: optionalUrl,
        memo: optionalString,
    }))
        .optional(),
    accessories: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'accessory.name は必須です'),
        quantity: zod_1.z.number().int().nullable().optional(),
        memo: optionalString,
    }))
        .optional(),
    maintenance_suggestions: zod_1.z
        .array(zod_1.z.object({
        maintenance_type: optionalString,
        description: optionalString,
        suggested_interval: optionalString,
        memo: optionalString,
    }))
        .optional(),
    notes: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.aiImportApplySchema = zod_1.z.object({
    payload: exports.aiImportPayloadSchema,
    // 既存値を上書きするか。デフォルトは false（空欄のみ反映）
    overwrite: zod_1.z.boolean().default(false),
    applySpecs: zod_1.z.boolean().default(true),
    applyLinks: zod_1.z.boolean().default(true),
    applyConsumables: zod_1.z.boolean().default(true),
    applyAccessories: zod_1.z.boolean().default(true),
});
// AI 調査用プロンプトを生成するためのヘルパ
function buildAiResearchPrompt(input) {
    const { deviceName, manufacturer, modelNumber, category } = input;
    return `以下の家庭内機器について、製品情報を調査し、指定のJSON形式だけで出力してください。
推測で断定せず、不明な項目はnullにしてください。
URLは可能であればメーカー公式ページ、取扱説明書、サポートページを優先してください。

機器名: ${deviceName}
メーカー: ${manufacturer ?? ''}
型番: ${modelNumber ?? ''}
カテゴリ: ${category ?? ''}

出力形式:
{
  "device": {
    "name": "",
    "manufacturer": "",
    "model_number": "",
    "category_suggestion": "",
    "summary": ""
  },
  "specs": [
    { "spec_name": "", "spec_value": "", "unit": "", "memo": "" }
  ],
  "links": [
    { "link_type": "official|manual|support|purchase|other", "title": "", "url": "", "memo": "" }
  ],
  "consumables": [
    { "name": "", "manufacturer": "", "model_number": "", "replacement_interval_text": "", "purchase_url": "", "memo": "" }
  ],
  "accessories": [
    { "name": "", "quantity": null, "memo": "" }
  ],
  "maintenance_suggestions": [
    { "maintenance_type": "", "description": "", "suggested_interval": "", "memo": "" }
  ],
  "notes": [ "" ]
}

JSON以外の文章は出力しないでください。`;
}
