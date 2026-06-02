import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import { deviceInputSchema, deviceListQuerySchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { parseDateOnly } from '../utils/date';
import { serializeDevice } from '../utils/serialize';

const deviceRoutes: FastifyPluginAsync = async (app) => {
  // 一覧
  app.get('/', async (req, reply) => {
    const parsed = deviceListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ message: '検索条件が不正です', errors: parsed.error.flatten() });
    }
    const q = parsed.data;
    const where: Prisma.DeviceWhereInput = {
      householdId: req.auth.householdId,
      deletedAt: q.includeDisposed ? undefined : null,
    };

    if (q.search) {
      const s = q.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { manufacturer: { contains: s, mode: 'insensitive' } },
        { modelNumber: { contains: s, mode: 'insensitive' } },
        { serialNumber: { contains: s, mode: 'insensitive' } },
        { memo: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.locationId) where.locationId = q.locationId;
    if (q.status) where.status = q.status;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setUTCDate(in30.getUTCDate() + 30);

    if (q.warrantyFilter === 'expiring_soon') {
      where.warrantyEndDate = { gte: today, lte: in30 };
    } else if (q.warrantyFilter === 'expired') {
      where.warrantyEndDate = { lt: today };
    } else if (q.warrantyFilter === 'none') {
      where.warrantyEndDate = null;
    }

    const isNextMaintenanceSort = q.sort === 'next_maintenance_asc';

    const orderBy: Prisma.DeviceOrderByWithRelationInput = (() => {
      switch (q.sort) {
        case 'created_desc':
          return { createdAt: 'desc' };
        case 'name_asc':
          return { name: 'asc' };
        case 'warranty_asc':
          return { warrantyEndDate: 'asc' };
        case 'purchase_desc':
          return { purchaseDate: 'desc' };
        case 'next_maintenance_asc':
        case 'updated_desc':
        default:
          return { updatedAt: 'desc' };
      }
    })();

    const devices = await prisma.device.findMany({
      where,
      orderBy,
      include: {
        category: true,
        location: true,
        ...(isNextMaintenanceSort
          ? {
              maintenanceRecords: {
                where: { nextDueDate: { not: null } },
                orderBy: { nextDueDate: 'asc' },
                take: 1,
                select: { nextDueDate: true },
              },
            }
          : {}),
      },
      take: 500,
    });

    if (isNextMaintenanceSort) {
      // nextDueDate が無い機器は末尾にまわす
      devices.sort((a, b) => {
        const aDate = (a as any).maintenanceRecords?.[0]?.nextDueDate as Date | undefined;
        const bDate = (b as any).maintenanceRecords?.[0]?.nextDueDate as Date | undefined;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.getTime() - bDate.getTime();
      });
      // ソート用に取得した relation は一覧レスポンスからは除外して他ソート時と形を揃える
      for (const d of devices as any[]) delete d.maintenanceRecords;
    }

    return devices.map((d) => serializeDevice(d));
  });

  // 詳細
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await prisma.device.findFirst({
      where: { id, householdId: req.auth.householdId },
      include: {
        category: true,
        location: true,
        specs: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        links: { orderBy: { createdAt: 'asc' } },
        maintenanceRecords: { orderBy: { maintenanceDate: 'desc' } },
        repairRecords: { orderBy: { occurredDate: 'desc' } },
        consumables: { orderBy: { createdAt: 'asc' } },
        accessories: { orderBy: { createdAt: 'asc' } },
        networkInfo: true,
      },
    });
    if (!device) return reply.code(404).send({ message: '機器が見つかりません' });
    return serializeDevice(device);
  });

  // 新規作成
  app.post('/', async (req, reply) => {
    const data = parseBody(deviceInputSchema, req.body, reply);
    if (!data) return;

    const device = await prisma.device.create({
      data: {
        householdId: req.auth.householdId,
        name: data.name,
        categoryId: data.categoryId || null,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        locationId: data.locationId || null,
        status: data.status,
        priority: data.priority,
        purchaseDate: parseDateOnly(data.purchaseDate),
        purchaseStore: data.purchaseStore,
        purchasePrice: data.purchasePrice ?? null,
        purchaseUrl: data.purchaseUrl,
        orderNumber: data.orderNumber,
        warrantyStartDate: parseDateOnly(data.warrantyStartDate),
        warrantyEndDate: parseDateOnly(data.warrantyEndDate),
        hasExtendedWarranty: data.hasExtendedWarranty ?? false,
        warrantyMemo: data.warrantyMemo,
        manualUrl: data.manualUrl,
        supportUrl: data.supportUrl,
        officialUrl: data.officialUrl,
        photoUrl: data.photoUrl,
        labelPhotoUrl: data.labelPhotoUrl,
        installationPhotoUrl: data.installationPhotoUrl,
        memo: data.memo,
      },
      include: { category: true, location: true },
    });
    return reply.code(201).send(serializeDevice(device));
  });

  // 更新
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.device.findFirst({ where: { id, householdId: req.auth.householdId } });
    if (!exists) return reply.code(404).send({ message: '機器が見つかりません' });

    const data = parseBody(deviceInputSchema, req.body, reply);
    if (!data) return;

    const updated = await prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId || null,
        manufacturer: data.manufacturer ?? null,
        modelNumber: data.modelNumber ?? null,
        serialNumber: data.serialNumber ?? null,
        locationId: data.locationId || null,
        status: data.status,
        priority: data.priority,
        purchaseDate: parseDateOnly(data.purchaseDate),
        purchaseStore: data.purchaseStore ?? null,
        purchasePrice: data.purchasePrice ?? null,
        purchaseUrl: data.purchaseUrl ?? null,
        orderNumber: data.orderNumber ?? null,
        warrantyStartDate: parseDateOnly(data.warrantyStartDate),
        warrantyEndDate: parseDateOnly(data.warrantyEndDate),
        hasExtendedWarranty: data.hasExtendedWarranty ?? false,
        warrantyMemo: data.warrantyMemo ?? null,
        manualUrl: data.manualUrl ?? null,
        supportUrl: data.supportUrl ?? null,
        officialUrl: data.officialUrl ?? null,
        photoUrl: data.photoUrl ?? null,
        labelPhotoUrl: data.labelPhotoUrl ?? null,
        installationPhotoUrl: data.installationPhotoUrl ?? null,
        memo: data.memo ?? null,
      },
      include: { category: true, location: true },
    });
    return serializeDevice(updated);
  });

  // 物理削除（誤登録用）
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.device.findFirst({ where: { id, householdId: req.auth.householdId } });
    if (!exists) return reply.code(404).send({ message: '機器が見つかりません' });
    await prisma.device.delete({ where: { id } });
    return reply.code(204).send();
  });

  // 廃棄済みに変更（論理削除）
  app.post('/:id/dispose', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.device.findFirst({ where: { id, householdId: req.auth.householdId } });
    if (!exists) return reply.code(404).send({ message: '機器が見つかりません' });
    const updated = await prisma.device.update({
      where: { id },
      data: { status: 'disposed', deletedAt: new Date() },
    });
    return serializeDevice(updated);
  });
};

export default deviceRoutes;
