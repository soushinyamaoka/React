import type { FastifyPluginAsync } from 'fastify';
import { accessoryInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { ensureDeviceInHousehold } from '../utils/device-guard';

const accessoryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/accessories', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    return prisma.accessory.findMany({
      where: { deviceId: id },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/devices/:id/accessories', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(accessoryInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.accessory.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        name: data.name,
        quantity: data.quantity ?? null,
        storageLocation: data.storageLocation ?? null,
        memo: data.memo ?? null,
      },
    });
    return reply.code(201).send(created);
  });

  app.put('/accessories/:accessoryId', async (req, reply) => {
    const { accessoryId } = req.params as { accessoryId: string };
    const exists = await prisma.accessory.findFirst({
      where: { id: accessoryId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '付属品が見つかりません' });
    const data = parseBody(accessoryInputSchema, req.body, reply);
    if (!data) return;
    return prisma.accessory.update({
      where: { id: accessoryId },
      data: {
        name: data.name,
        quantity: data.quantity ?? null,
        storageLocation: data.storageLocation ?? null,
        memo: data.memo ?? null,
      },
    });
  });

  app.delete('/accessories/:accessoryId', async (req, reply) => {
    const { accessoryId } = req.params as { accessoryId: string };
    const exists = await prisma.accessory.findFirst({
      where: { id: accessoryId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: '付属品が見つかりません' });
    await prisma.accessory.delete({ where: { id: accessoryId } });
    return reply.code(204).send();
  });
};

export default accessoryRoutes;
