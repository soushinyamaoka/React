import { z } from 'zod';
import { DEVICE_PRIORITIES, DEVICE_STATUSES } from '../constants';

// AI の出力 JSON を受け入れる Zod スキーマ
const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v == null || v === '' ? undefined : v));

const optionalUrl = z
  .union([z.string().url(), z.literal('')])
  .optional()
  .nullable()
  .transform((v) => (v == null || v === '' ? undefined : v));

export const aiImportPayloadSchema = z.object({
  device: z
    .object({
      name: optionalString,
      manufacturer: optionalString,
      model_number: optionalString,
      category_suggestion: optionalString,
      summary: optionalString,
    })
    .partial()
    .optional(),

  specs: z
    .array(
      z.object({
        spec_name: z.string().min(1, 'spec_name は必須です'),
        spec_value: optionalString,
        unit: optionalString,
        memo: optionalString,
      })
    )
    .optional(),

  links: z
    .array(
      z.object({
        link_type: z
          .enum(['official', 'manual', 'support', 'purchase', 'other'])
          .default('other'),
        title: optionalString,
        url: z.string().url('linkのurlがURL形式ではありません'),
        memo: optionalString,
      })
    )
    .optional(),

  consumables: z
    .array(
      z.object({
        name: z.string().min(1, 'consumable.name は必須です'),
        manufacturer: optionalString,
        model_number: optionalString,
        replacement_interval_text: optionalString,
        purchase_url: optionalUrl,
        memo: optionalString,
      })
    )
    .optional(),

  accessories: z
    .array(
      z.object({
        name: z.string().min(1, 'accessory.name は必須です'),
        quantity: z.number().int().nullable().optional(),
        memo: optionalString,
      })
    )
    .optional(),

  maintenance_suggestions: z
    .array(
      z.object({
        maintenance_type: optionalString,
        description: optionalString,
        suggested_interval: optionalString,
        memo: optionalString,
      })
    )
    .optional(),

  notes: z.array(z.string()).optional(),
});

export type AiImportPayload = z.infer<typeof aiImportPayloadSchema>;

export const aiImportApplySchema = z.object({
  payload: aiImportPayloadSchema,
  // 既存値を上書きするか。デフォルトは false（空欄のみ反映）
  overwrite: z.boolean().default(false),
  applySpecs: z.boolean().default(true),
  applyLinks: z.boolean().default(true),
  applyConsumables: z.boolean().default(true),
  applyAccessories: z.boolean().default(true),
});

export type AiImportApplyInput = z.infer<typeof aiImportApplySchema>;

// 新規機器を作成しつつ AI 取り込みを一気に反映するためのスキーマ
export const aiImportCreateAndApplySchema = z.object({
  device: z.object({
    name: z.string().trim().min(1, '機器名を入力してください'),
    categoryId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    status: z.enum(DEVICE_STATUSES).default('in_use'),
    priority: z.enum(DEVICE_PRIORITIES).default('medium'),
  }),
  payload: aiImportPayloadSchema,
  applySpecs: z.boolean().default(true),
  applyLinks: z.boolean().default(true),
  applyConsumables: z.boolean().default(true),
  applyAccessories: z.boolean().default(true),
});

export type AiImportCreateAndApplyInput = z.infer<typeof aiImportCreateAndApplySchema>;

// AI 調査用プロンプトを生成するためのヘルパ
export function buildAiResearchPrompt(input: {
  deviceName: string;
  manufacturer?: string | null;
  modelNumber?: string | null;
  category?: string | null;
}): string {
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
