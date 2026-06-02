import { Prisma } from '@prisma/client';
import { formatDateOnly } from './date';

/**
 * Prisma の結果を JSON で返すために日付・Decimal を整形する。
 * - DateTime @db.Date → 'YYYY-MM-DD' 文字列
 * - Decimal → number
 */
export function serializeDevice<T extends Record<string, any>>(d: T): T {
  if (!d) return d;
  const out: Record<string, any> = { ...d };
  const dateOnlyFields = [
    'purchaseDate',
    'warrantyStartDate',
    'warrantyEndDate',
    'maintenanceDate',
    'nextDueDate',
    'occurredDate',
    'completedDate',
    'lastReplacedDate',
    'nextReplacementDate',
  ];
  for (const k of dateOnlyFields) {
    if (out[k] instanceof Date) {
      out[k] = formatDateOnly(out[k]);
    }
  }
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Prisma.Decimal) {
      out[k] = v.toNumber();
    }
    if (Array.isArray(v)) {
      out[k] = v.map((item) => (item && typeof item === 'object' ? serializeDevice(item) : item));
    } else if (v && typeof v === 'object' && !(v instanceof Date)) {
      out[k] = serializeDevice(v as Record<string, any>);
    }
  }
  return out as T;
}
