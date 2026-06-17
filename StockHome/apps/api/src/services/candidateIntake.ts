// Gmail 取込候補のインテイク処理
// GAS 版 GmailImportService の「保存以降」のロジックを移植:
//   - 重複排除（仕様書 Section 10.5 の3段階）
//   - mail_phase に応じた candidate_status / fulfillment_status の決定
//   - 発送メール受信時の ordered → shipped 昇格
//   - 品名部分一致による自動確定（1件一致時のみ）
//   - 候補確定時の purchase_log 反映（Section 11.3, 11.4）
import type { ImportOrderCandidate, Prisma } from '@prisma/client';
import { APP_CONFIG_KEYS, DEFAULTS, type BridgeCandidate } from '@stockhome/shared';
import { prisma } from '../lib/prisma';
import { refreshStockSnapshotForItem, todayDateOnly } from './stockCalc';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function getDeliveryBufferDays(householdId: string): Promise<number> {
  const config = await prisma.appConfig.findUnique({
    where: {
      householdId_key: { householdId, key: APP_CONFIG_KEYS.DELIVERY_BUFFER_DAYS },
    },
  });
  const n = config ? parseInt(config.value, 10) : NaN;
  return Number.isNaN(n) ? DEFAULTS.DELIVERY_BUFFER_DAYS : n;
}

// 候補から purchase_log を作成する（GAS createPurchaseLogFromImportCandidate 相当）
// - qty は detected_qty(セット数) × default_purchase_qty(個数) に換算
// - inventory_effective_at = メール日付 + 配送バッファ日数
export async function createPurchaseLogFromCandidate(
  candidate: ImportOrderCandidate,
  matchedItemId: string,
  confirmedByUserId: string | null,
  sourceType: 'gmail_auto' | 'gmail_auto_confirmed'
) {
  const item = await prisma.item.findFirst({
    where: { id: matchedItemId, householdId: candidate.householdId, isActive: true },
  });
  if (!item) {
    throw Object.assign(new Error('品目が見つからないか削除済みです'), { statusCode: 404 });
  }

  const multiplier = Math.max(1, Math.round(item.defaultPurchaseQty));
  const qty = Math.max(1, Math.round(candidate.detectedQty ?? 1)) * multiplier;

  const bufferDays = await getDeliveryBufferDays(candidate.householdId);
  const mailDate = dateOnly(candidate.mailDate);
  const inventoryEffectiveAt = new Date(mailDate.getTime() + bufferDays * MS_PER_DAY);
  const counted = inventoryEffectiveAt <= todayDateOnly();

  const user = confirmedByUserId
    ? await prisma.user.findUnique({ where: { id: confirmedByUserId } })
    : null;

  const log = await prisma.purchaseLog.create({
    data: {
      householdId: candidate.householdId,
      itemId: matchedItemId,
      purchasedAt: mailDate,
      qty,
      price: candidate.detectedPrice ?? null,
      source: 'gmail',
      sourceType,
      externalVendor: candidate.vendor,
      externalOrderId: candidate.orderId,
      importCandidateId: candidate.id,
      purchasedByUserId: confirmedByUserId,
      purchasedByUserName: user?.name ?? null,
      note: `自動取込: ${candidate.itemNameRaw ?? ''}`,
      fulfillmentStatus: candidate.fulfillmentStatus ?? 'shipped',
      shippedAt: mailDate,
      inventoryEffectiveAt,
      countedInInventory: counted,
    },
  });

  if (counted) {
    await refreshStockSnapshotForItem(matchedItemId);
  }
  return log;
}

// 品名部分一致でアクティブ品目を検索（GAS findItemsByPartialMatch 相当）
async function findItemsByPartialMatch(householdId: string, rawName: string | null) {
  if (!rawName) return [];
  const normalized = rawName.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalized.length < 2) return [];

  const items = await prisma.item.findMany({
    where: { householdId, isActive: true },
  });
  return items.filter((item) => {
    const name = item.itemName.toLowerCase();
    return normalized.includes(name) || name.includes(normalized);
  });
}

export interface IntakeResult {
  received: number;
  saved: number;
  duplicates: number;
  upgraded: number;
  autoConfirmed: number;
  errors: number;
}

// GAS ブリッジから届いた候補バッチを処理する
export async function processBridgeCandidates(
  candidates: BridgeCandidate[]
): Promise<IntakeResult> {
  const result: IntakeResult = {
    received: candidates.length,
    saved: 0,
    duplicates: 0,
    upgraded: 0,
    autoConfirmed: 0,
    errors: 0,
  };

  for (const c of candidates) {
    try {
      await processSingleCandidate(c, result);
    } catch (e) {
      result.errors++;
      console.error('[candidateIntake] 候補処理失敗:', c.mailMessageId, e);
    }
  }
  return result;
}

async function resolveHouseholdId(importedByEmail: string | undefined): Promise<string | null> {
  if (importedByEmail) {
    const user = await prisma.user.findUnique({
      where: { email: importedByEmail },
      include: { memberships: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (user?.memberships[0]) return user.memberships[0].householdId;
  }
  // フォールバック: 最初の household（単一家庭運用前提）
  const household = await prisma.household.findFirst({ orderBy: { createdAt: 'asc' } });
  return household?.id ?? null;
}

async function processSingleCandidate(c: BridgeCandidate, result: IntakeResult) {
  // 重複排除 1: mail_message_id + item_name_raw
  // （複数商品を含む1通のメールは商品ごとに候補が来るため、message_id 単独では判定しない）
  const byMessageId = await prisma.importOrderCandidate.findFirst({
    where: { mailMessageId: c.mailMessageId, itemNameRaw: c.itemNameRaw ?? null },
  });
  if (byMessageId) {
    result.duplicates++;
    return;
  }

  const householdId = await resolveHouseholdId(c.importedByEmail);
  if (!householdId) {
    throw new Error('household が見つかりません');
  }

  // 重複排除 2: vendor + order_id + item_name_raw
  if (c.orderId && c.itemNameRaw) {
    const dup = await prisma.importOrderCandidate.findFirst({
      where: { vendor: c.vendor, orderId: c.orderId, itemNameRaw: c.itemNameRaw },
    });
    if (dup) {
      result.duplicates++;
      return;
    }
  }

  const mailDate = new Date(c.mailDate);

  // 重複排除 3: vendor + imported_by_email + mail_date(日付) + raw_subject
  // （order_id が取れないメールのフォールバック）
  if (!c.orderId && c.rawSubject) {
    const dayStart = dateOnly(mailDate);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
    const dup = await prisma.importOrderCandidate.findFirst({
      where: {
        vendor: c.vendor,
        importedByEmail: c.importedByEmail ?? null,
        rawSubject: c.rawSubject.substring(0, 300),
        mailDate: { gte: dayStart, lt: dayEnd },
      },
    });
    if (dup) {
      result.duplicates++;
      return;
    }
  }

  // candidate_status / fulfillment_status の決定（Section 10.6）
  const candidateStatus =
    c.mailPhase === 'ordered' ? 'ordered' : c.mailPhase === 'shipped' ? 'shipped' : 'detected';
  const fulfillmentStatus = c.mailPhase === 'shipped' ? 'shipped' : 'ordered';

  const groupKey = `${c.vendor}|${c.orderId || c.mailMessageId}|${c.itemNameRaw || ''}`;

  const saved = await prisma.importOrderCandidate.create({
    data: {
      householdId,
      vendor: c.vendor,
      mailMessageId: c.mailMessageId,
      gmailThreadId: c.gmailThreadId ?? null,
      importedByEmail: c.importedByEmail ?? null,
      mailDate,
      orderId: c.orderId ?? null,
      mailType: c.mailType,
      mailPhase: c.mailPhase,
      fulfillmentStatus,
      candidateGroupKey: groupKey,
      itemNameRaw: c.itemNameRaw ?? null,
      detectedQty: c.detectedQty ?? 1,
      detectedPrice: c.detectedPrice ?? null,
      candidateStatus,
      rawSubject: c.rawSubject?.substring(0, 300) ?? null,
      rawSnippet: c.rawSnippet?.substring(0, 200) ?? null,
      parseResult: c.parseResult ?? null,
    },
  });
  result.saved++;

  // 発送メールなら同一注文の ordered 候補を shipped に昇格
  if (c.mailPhase === 'shipped' && c.orderId) {
    const upgraded = await prisma.importOrderCandidate.updateMany({
      where: {
        vendor: c.vendor,
        orderId: c.orderId,
        candidateStatus: 'ordered',
      },
      data: {
        candidateStatus: 'shipped',
        fulfillmentStatus: 'shipped',
        mailPhase: 'shipped',
      },
    });
    result.upgraded += upgraded.count;
  }

  // 自動確定: 品名部分一致が1件のみなら purchase_log まで反映
  const matches = await findItemsByPartialMatch(householdId, saved.itemNameRaw);
  if (matches.length === 1) {
    const confirmedUser = c.importedByEmail
      ? await prisma.user.findUnique({ where: { email: c.importedByEmail } })
      : null;
    await createPurchaseLogFromCandidate(
      saved,
      matches[0].id,
      confirmedUser?.id ?? null,
      'gmail_auto_confirmed'
    );
    await prisma.importOrderCandidate.update({
      where: { id: saved.id },
      data: {
        candidateStatus: 'auto_confirmed',
        matchedItemId: matches[0].id,
        parseResult: '自動確定（部分一致1件）',
      },
    });
    result.autoConfirmed++;
  } else if (matches.length > 1) {
    await prisma.importOrderCandidate.update({
      where: { id: saved.id },
      data: {
        parseResult: `自動確定スキップ: 複数一致 (${matches.map((m) => m.itemName).join(', ')})`,
      },
    });
  }
}
