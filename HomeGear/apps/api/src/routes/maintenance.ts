import type { FastifyPluginAsync } from 'fastify';
import { maintenanceRecordInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { parseDateOnly } from '../utils/date';
import { ensureDeviceInHousehold } from '../utils/device-guard';
import { serializeDevice } from '../utils/serialize';

const maintenanceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/maintenance-records', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const records = await prisma.maintenanceRecord.findMany({
      where: { deviceId: id },
      orderBy: { maintenanceDate: 'desc' },
    });
    return records.map((r) => serializeDevice(r));
  });

  app.post('/devices/:id/maintenance-records', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(maintenanceRecordInputSchema, req.body, reply);
    if (!data) return;

    const created = await prisma.maintenanceRecord.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        maintenanceDate: parseDateOnly(data.maintenanceDate)!,
        maintenanceType: data.maintenanceType,
        description: data.description ?? null,
        cost: data.cost ?? null,
        performedBy: data.performedBy ?? null,
        nextDueDate: parseDateOnly(data.nextDueDate),
        photoUrl: data.photoUrl ?? null,
        memo: data.memo ?? null,
      },
    });
    return reply.code(201).send(serializeDevice(created));
  });

  app.put('/maintenance-records/:recordId', async (req, reply) => {
    const { recordId } = req.params as { recordId: string };
    const exists = await prisma.maintenanceRecord.findFirst({
      where: { id: recordId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'メンテナンス履歴が見つかりません' });
    const data = parseBody(maintenanceRecordInputSchema, req.body, reply);
    if (!data) return;
    const updated = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        maintenanceDate: parseDateOnly(data.maintenanceDate)!,
        maintenanceType: data.maintenanceType,
        description: data.description ?? null,
        cost: data.cost ?? null,
        performedBy: data.performedBy ?? null,
        nextDueDate: parseDateOnly(data.nextDueDate),
        photoUrl: data.photoUrl ?? null,
        memo: data.memo ?? null,
      },
    });
    return serializeDevice(updated);
  });

  app.delete('/maintenance-records/:recordId', async (req, reply) => {
    const { recordId } = req.params as { recordId: string };
    const exists = await prisma.maintenanceRecord.findFirst({
      where: { id: recordId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'メンテナンス履歴が見つかりません' });
    await prisma.maintenanceRecord.delete({ where: { id: recordId } });
    return reply.code(204).send();
  });
};

export default maintenanceRoutes;
