import type { FastifyPluginAsync } from 'fastify';
import { repairRecordInputSchema, type RepairStatus, type DeviceStatus } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { parseDateOnly } from '../utils/date';
import { ensureDeviceInHousehold } from '../utils/device-guard';
import { serializeDevice } from '../utils/serialize';

function deviceStatusFromRepair(status: RepairStatus): DeviceStatus | null {
  switch (status) {
    case 'pending':
      return 'broken';
    case 'in_progress':
      return 'repairing';
    case 'completed':
      return 'in_use';
    case 'replaced':
    case 'disposed':
      return 'disposed';
    default:
      return null;
  }
}

const repairRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/repair-records', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const records = await prisma.repairRecord.findMany({
      where: { deviceId: id },
      orderBy: { occurredDate: 'desc' },
    });
    return records.map((r) => serializeDevice(r));
  });

  app.post('/devices/:id/repair-records', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(repairRecordInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.repairRecord.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        occurredDate: parseDateOnly(data.occurredDate)!,
        symptom: data.symptom ?? null,
        cause: data.cause ?? null,
        actionTaken: data.actionTaken ?? null,
        repairVendor: data.repairVendor ?? null,
        repairTicketNumber: data.repairTicketNumber ?? null,
        cost: data.cost ?? null,
        usedWarranty: data.usedWarranty ?? false,
        completedDate: parseDateOnly(data.completedDate),
        status: data.status,
        memo: data.memo ?? null,
      },
    });

    const nextDeviceStatus = deviceStatusFromRepair(data.status);
    if (nextDeviceStatus) {
      await prisma.device.update({ where: { id }, data: { status: nextDeviceStatus } });
    }

    return reply.code(201).send(serializeDevice(created));
  });

  app.put('/repair-records/:recordId', async (req, reply) => {
    const { recordId } = req.params as { recordId: string };
    const exists = await prisma.repairRecord.findFirst({
      where: { id: recordId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '修理履歴が見つかりません' });
    const data = parseBody(repairRecordInputSchema, req.body, reply);
    if (!data) return;
    const updated = await prisma.repairRecord.update({
      where: { id: recordId },
      data: {
        occurredDate: parseDateOnly(data.occurredDate)!,
        symptom: data.symptom ?? null,
        cause: data.cause ?? null,
        actionTaken: data.actionTaken ?? null,
        repairVendor: data.repairVendor ?? null,
        repairTicketNumber: data.repairTicketNumber ?? null,
        cost: data.cost ?? null,
        usedWarranty: data.usedWarranty ?? false,
        completedDate: parseDateOnly(data.completedDate),
        status: data.status,
        memo: data.memo ?? null,
      },
    });

    const nextDeviceStatus = deviceStatusFromRepair(data.status);
    if (nextDeviceStatus) {
      await prisma.device.update({
        where: { id: exists.deviceId },
        data: { status: nextDeviceStatus },
      });
    }

    return serializeDevice(updated);
  });

  app.delete('/repair-records/:recordId', async (req, reply) => {
    const { recordId } = req.params as { recordId: string };
    const exists = await prisma.repairRecord.findFirst({
      where: { id: recordId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '修理履歴が見つかりません' });
    await prisma.repairRecord.delete({ where: { id: recordId } });
    return reply.code(204).send();
  });
};

export default repairRoutes;
