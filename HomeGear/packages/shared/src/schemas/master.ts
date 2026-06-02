import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'カテゴリ名を入力してください'),
  icon: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const locationInputSchema = z.object({
  name: z.string().trim().min(1, '設置場所名を入力してください'),
  parentId: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export type LocationInput = z.infer<typeof locationInputSchema>;
