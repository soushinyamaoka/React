import type { FastifyPluginAsync } from 'fastify';
import { consumableInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { parseDateOnly } from '../utils/date';
import { ensureDeviceInHousehold } from '../utils/device-guard';
import { serializeDevice } from '../utils/serialize';

const consumableRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/consumables', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const items = await prisma.consumable.findMany({
      where: { deviceId: id },
      orderBy: { createdAt: 'asc' },
    });
    return items.map((r) => serializeDevice(r));
  });

  app.post('/devices/:id/consumables', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(consumableInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.consumable.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        name: data.name,
        manufacturer: data.manufacturer ?? null,
        modelNumber: data.modelNumber ?? null,
        replacementIntervalText: data.replacementIntervalText ?? null,
        lastReplacedDate: parseDateOnly(data.lastReplacedDate),
        nextReplacementDate: parseDateOnly(data.nextReplacementDate),
        purchaseUrl: data.purchaseUrl ?? null,
        memo: data.memo ?? null,
      },
    });
    return reply.code(201).send(serializeDevice(created));
  });

  app.put('/consumables/:consumableId', async (req, reply) => {
    const { consumableId } = req.params as { consumableId: string };
    const exists = await prisma.consumable.findFirst({
      where: { id: consumableId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '消耗品が見つかりません' });
    const data = parseBody(consumableInputSchema, req.body, reply);
    if (!data) return;
    const updated = await prisma.consumable.update({
      where: { id: consumableId },
      data: {
        name: data.name,
        manufacturer: data.manufacturer ?? null,
        modelNumber: data.modelNumber ?? null,
        replacementIntervalText: data.replacementIntervalText ?? null,
        lastReplacedDate: parseDateOnly(data.lastReplacedDate),
        nextReplacementDate: parseDateOnly(data.nextReplacementDate),
        purchaseUrl: data.purchaseUrl ?? null,
        memo: data.memo ?? null,
      },
    });
    return serializeDevice(updated);
  });

  app.delete('/consumables/:consumableId', async (req, reply) => {
    const { consumableId } = req.params as { consumableId: string };
    const exists = await prisma.consumable.findFirst({
      where: { id: consumableId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '消耗品が見つかりません' });
    await prisma.consumable.delete({ where: { id: consumableId } });
    return reply.code(204).send();
  });
};

export default consumableRoutes;
