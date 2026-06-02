import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { serializeDevice } from '../utils/serialize';
import { toMigrationRows } from '../utils/migrationSerialize';

const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/json', async (req, reply) => {
    const householdId = req.auth.householdId;

    const [household, categories, locations, devices] = await Promise.all([
      prisma.household.findUnique({ where: { id: householdId } }),
      prisma.category.findMany({ where: { householdId }, orderBy: { sortOrder: 'asc' } }),
      prisma.location.findMany({ where: { householdId }, orderBy: { sortOrder: 'asc' } }),
      prisma.device.findMany({
        where: { householdId },
        include: {
          category: true,
          location: true,
          specs: true,
          links: true,
          maintenanceRecords: true,
          repairRecords: true,
          consumables: true,
          accessories: true,
          networkInfo: true,
        },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      household,
      categories,
      locations,
      devices: devices.map((d) => serializeDevice(d)),
    };

    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header(
      'Content-Disposition',
      `attachment; filename="homegear-export-${new Date().toISOString().slice(0, 10)}.json"`
    );
    return payload;
  });

  /**
   * HomeAsset への移行用エクスポート（移行仕様書 21.1 形式）。
   * フラットなテーブル別配列・snake_case キー・メタ情報付きで出力する。
   * 変換（device→home_asset 等）はインポート側（HomeAsset）の責務。
   */
  app.get('/migration', async (req, reply) => {
    const householdId = req.auth.householdId;

    const [
      household,
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
      prisma.household.findUnique({ where: { id: householdId } }),
      prisma.householdMember.findMany({ where: { householdId } }),
      prisma.category.findMany({ where: { householdId }, orderBy: { sortOrder: 'asc' } }),
      prisma.location.findMany({ where: { householdId }, orderBy: { sortOrder: 'asc' } }),
      // 廃棄済み(deleted_at)も含め全機器をエクスポートする（データを失わない）
      prisma.device.findMany({ where: { householdId } }),
      prisma.deviceSpec.findMany({ where: { householdId } }),
      prisma.deviceLink.findMany({ where: { householdId } }),
      prisma.maintenanceRecord.findMany({ where: { householdId } }),
      prisma.repairRecord.findMany({ where: { householdId } }),
      prisma.consumable.findMany({ where: { householdId } }),
      prisma.networkInfo.findMany({ where: { householdId } }),
      prisma.accessory.findMany({ where: { householdId } }),
      prisma.aiImportLog.findMany({ where: { householdId } }),
    ]);

    // この家庭に属するユーザーを household_members 経由で取得（password_hash 含む）
    const userIds = members.map((m) => m.userId);
    const users = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } } })
      : [];

    const payload = {
      exported_at: new Date().toISOString(),
      source_app: 'HomeGear',
      schema_version: 'device-v1',
      households: household ? toMigrationRows([household]) : [],
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

    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header(
      'Content-Disposition',
      `attachment; filename="homegear-migration-${new Date().toISOString().slice(0, 10)}.json"`
    );
    return payload;
  });
};

export default exportRoutes;
