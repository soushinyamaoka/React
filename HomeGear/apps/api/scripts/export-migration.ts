/**
 * HomeGear → HomeAsset 移行用 JSON エクスポート CLI。
 *
 * DB に直接接続し、移行仕様書 (homegear_to_homeasset_migration_spec.txt) 21.1 形式の
 * JSON ファイルを生成する。API/JWT を介さず実行できる。
 *
 * 使い方:
 *   tsx scripts/export-migration.ts                       # 全家庭をエクスポート
 *   tsx scripts/export-migration.ts --household <id>      # 指定 household_id のみ
 *   tsx scripts/export-migration.ts --email <user-email>  # ユーザーの所属家庭のみ
 *   tsx scripts/export-migration.ts --out <path>          # 出力先を指定
 *
 * 変換（device→home_asset / status 変換 / asset_type 推測など）はインポート側
 * （HomeAsset）の責務。ここでは旧データを欠落なく忠実に出力する。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { toMigrationRows } from '../src/utils/migrationSerialize';

const prisma = new PrismaClient();

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

async function resolveHouseholdIds(args: Record<string, string | boolean>): Promise<string[] | null> {
  if (typeof args.household === 'string') {
    return [args.household];
  }
  if (typeof args.email === 'string') {
    const user = await prisma.user.findUnique({
      where: { email: args.email },
      include: { memberships: true },
    });
    if (!user) {
      throw new Error(`ユーザーが見つかりません: ${args.email}`);
    }
    const ids = user.memberships.map((m) => m.householdId);
    if (ids.length === 0) {
      throw new Error(`ユーザー ${args.email} はどの家庭にも所属していません`);
    }
    return ids;
  }
  // フィルタ指定なし → 全家庭
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const householdIds = await resolveHouseholdIds(args);

  // householdIds が null の場合は全件（where 句なし）
  const householdWhere = householdIds ? { householdId: { in: householdIds } } : {};
  const householdSelfWhere = householdIds ? { id: { in: householdIds } } : {};

  const [
    households,
    members,
    categories,
    locations,
    devices,
    deviceSpecs,
    deviceLinks,
    maintenanceRecords,
    repairRecords,
    consumables,
    networkInfos,
    accessories,
    aiImportLogs,
  ] = await Promise.all([
    prisma.household.findMany({ where: householdSelfWhere }),
    prisma.householdMember.findMany({ where: householdWhere }),
    prisma.category.findMany({ where: householdWhere, orderBy: { sortOrder: 'asc' } }),
    prisma.location.findMany({ where: householdWhere, orderBy: { sortOrder: 'asc' } }),
    // 廃棄済み(deleted_at)も含め全機器をエクスポート（データを失わない）
    prisma.device.findMany({ where: householdWhere }),
    prisma.deviceSpec.findMany({ where: householdWhere }),
    prisma.deviceLink.findMany({ where: householdWhere }),
    prisma.maintenanceRecord.findMany({ where: householdWhere }),
    prisma.repairRecord.findMany({ where: householdWhere }),
    prisma.consumable.findMany({ where: householdWhere }),
    prisma.networkInfo.findMany({ where: householdWhere }),
    prisma.accessory.findMany({ where: householdWhere }),
    prisma.aiImportLog.findMany({ where: householdWhere }),
  ]);

  // 対象家庭に属するユーザーを household_members 経由で取得（password_hash 含む）
  const userIds = Array.from(new Set(members.map((m) => m.userId)));
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } } })
    : [];

  const payload = {
    exported_at: new Date().toISOString(),
    source_app: 'HomeGear',
    schema_version: 'device-v1',
    households: toMigrationRows(households),
    users: toMigrationRows(users),
    household_members: toMigrationRows(members),
    categories: toMigrationRows(categories),
    locations: toMigrationRows(locations),
    devices: toMigrationRows(devices),
    device_specs: toMigrationRows(deviceSpecs),
    device_links: toMigrationRows(deviceLinks),
    maintenance_records: toMigrationRows(maintenanceRecords),
    repair_records: toMigrationRows(repairRecords),
    consumables: toMigrationRows(consumables),
    network_infos: toMigrationRows(networkInfos),
    accessories: toMigrationRows(accessories),
    ai_import_logs: toMigrationRows(aiImportLogs),
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const outPath =
    typeof args.out === 'string'
      ? resolve(process.cwd(), args.out)
      : resolve(process.cwd(), `exports/homegear-migration-${dateStr}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');

  // サマリ出力
  const counts: Record<string, number> = {
    households: households.length,
    users: users.length,
    household_members: members.length,
    categories: categories.length,
    locations: locations.length,
    devices: devices.length,
    device_specs: deviceSpecs.length,
    device_links: deviceLinks.length,
    maintenance_records: maintenanceRecords.length,
    repair_records: repairRecords.length,
    consumables: consumables.length,
    network_infos: networkInfos.length,
    accessories: accessories.length,
    ai_import_logs: aiImportLogs.length,
  };

  console.log('=== HomeGear 移行用エクスポート完了 ===');
  console.log(`対象家庭: ${householdIds ? householdIds.join(', ') : '全家庭'}`);
  console.log(`出力先: ${outPath}`);
  console.log('--- テーブル別件数 ---');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`);
  }
}

main()
  .catch((e) => {
    console.error('エクスポート失敗:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
