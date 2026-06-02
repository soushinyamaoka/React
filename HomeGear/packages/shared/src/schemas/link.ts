import { z } from 'zod';
import { LINK_TYPES } from '../constants';

export const deviceLinkInputSchema = z.object({
  linkType: z.enum(LINK_TYPES).default('other'),
  title: z.string().trim().optional().nullable(),
  url: z.string().trim().url('URL形式で入力してください'),
  memo: z.string().trim().optional().nullable(),
});

export type DeviceLinkInput = z.infer<typeof deviceLinkInputSchema>;
