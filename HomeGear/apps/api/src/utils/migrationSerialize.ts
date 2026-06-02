import { Prisma } from '@prisma/client';
import { formatDateOnly } from './date';

/**
 * HomeGear → HomeAsset 移行用 JSON エクスポートのシリアライザ。
 *
 * 移行仕様書 (homegear_to_homeasset_migration_spec.txt) 21.1 の形式に合わせ、
 * - キー名を camelCase → snake_case（= DB カラム名）へ変換
 * - Decimal → number
 * - @db.Date 型 → 'YYYY-MM-DD' 文字列
 * - それ以外の DateTime（created_at / updated_at / deleted_at / imported_at 等）→ ISO 文字列
 * へ整形する。
 *
 * 方針: データを失わないため、Prisma 行の全カラムをそのまま snake_case で出力する。
 * 変換（status / link_type / asset_type の解釈や device_id→asset_id）はインポート側
 * （HomeAsset）の責務とし、ここでは旧データを忠実にエクスポートする。
 */

// @db.Date（日付のみ）として扱うフィールド（camelCase）。serialize.ts と同一。
const DATE_ONLY_FIELDS = new Set([
  'purchaseDate',
  'warrantyStartDate',
  'warrantyEndDate',
  'maintenanceDate',
  'nextDueDate',
  'occurredDate',
  'completedDate',
  'lastReplacedDate',
  'nextReplacementDate',
]);

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Prisma の 1 行を移行用 snake_case オブジェクトへ変換する。
 * relation（ネストされたオブジェクト/配列）はエクスポートしない想定で、
 * スカラー値のみを対象にする。
 */
export function toMigrationRow<T extends Record<string, any>>(row: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const snakeKey = camelToSnake(key);
    if (value instanceof Prisma.Decimal) {
      out[snakeKey] = value.toNumber();
    } else if (value instanceof Date) {
      out[snakeKey] = DATE_ONLY_FIELDS.has(key) ? formatDateOnly(value) : value.toISOString();
    } else {
      // null / string / number / boolean / Json はそのまま
      out[snakeKey] = value;
    }
  }
  return out;
}

export function toMigrationRows<T extends Record<string, any>>(rows: T[]): Record<string, any>[] {
  return rows.map((r) => toMigrationRow(r));
}
