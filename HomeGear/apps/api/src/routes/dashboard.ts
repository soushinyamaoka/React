import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { formatDateOnly } from '../utils/date';

function pickSummary(d: any) {
  return {
    id: d.id,
    name: d.name,
    manufacturer: d.manufacturer,
    modelNumber: d.modelNumber,
    status: d.status,
    categoryName: d.category?.name ?? null,
    locationName: d.location?.name ?? null,
    warrantyEndDate: formatDateOnly(d.warrantyEndDate),
    nextMaintenanceDate: d.nextMaintenanceDate ?? null,
  };
}

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    const householdId = req.auth.householdId;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setUTCDate(in30.getUTCDate() + 30);

    const baseInclude = { category: true, location: true } as const;
    const baseWhere = { householdId, deletedAt: null } as const;

    const [deviceCount, expiringSoon, expired, broken, recent, maintenances] = await Promise.all([
      prisma.device.count({ where: baseWhere }),
      prisma.device.findMany({
        where: { ...baseWhere, warrantyEndDate: { gte: today, lte: in30 } },
        include: baseInclude,
        orderBy: { warrantyEndDate: 'asc' },
        take: 20,
      }),
      prisma.device.findMany({
        where: { ...baseWhere, warrantyEndDate: { lt: today } },
        include: baseInclude,
        orderBy: { warrantyEndDate: 'desc' },
        take: 20,
      }),
      prisma.device.findMany({
        where: { ...baseWhere, status: { in: ['broken', 'repairing'] } },
        include: baseInclude,
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.device.findMany({
        where: baseWhere,
        include: baseInclude,
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.maintenanceRecord.findMany({
        where: { householdId, nextDueDate: { gte: today, lte: in30 } },
        include: {
          device: {
            include: baseInclude,
          },
        },
        orderBy: { nextDueDate: 'asc' },
        take: 30,
      }),
    ]);

    // 情報不足の機器（型番未登録 or 設置場所未登録）
    // 保証は加入していないケースがあるため未登録でも情報不足としない。
    const incompleteDevices = await prisma.device.findMany({
      where: {
        ...baseWhere,
        OR: [
          { modelNumber: null },
          { modelNumber: '' },
          { locationId: null },
        ],
      },
      include: baseInclude,
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // 次回メンテナンス機器をユニーク化
    const seenDeviceIds = new Set<string>();
    const upcomingMaintenanceDevices = maintenances
      .filter((m) => m.device.deletedAt === null)
      .filter((m) => {
        if (seenDeviceIds.has(m.deviceId)) return false;
        seenDeviceIds.add(m.deviceId);
        return true;
      })
      .map((m) => ({
        ...pickSummary(m.device),
        nextMaintenanceDate: formatDateOnly(m.nextDueDate),
      }));

    return {
      deviceCount,
      warrantyExpiringSoonDevices: expiringSoon.map(pickSummary),
      warrantyExpiredDevices: expired.map(pickSummary),
      upcomingMaintenanceDevices,
      brokenDevices: broken.map(pickSummary),
      recentDevices: recent.map(pickSummary),
      incompleteDevices: incompleteDevices.map(pickSummary),
    };
  });
};

export default dashboardRoutes;
