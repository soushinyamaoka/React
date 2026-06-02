import type { FastifyPluginAsync } from 'fastify';
import { deviceSpecInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { ensureDeviceInHousehold } from '../utils/device-guard';

const specRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/specs', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    return prisma.deviceSpec.findMany({
      where: { deviceId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  app.post('/devices/:id/specs', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(deviceSpecInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.deviceSpec.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        specName: data.specName,
        specValue: data.specValue ?? null,
        unit: data.unit ?? null,
        memo: data.memo ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return reply.code(201).send(created);
  });

  app.put('/device-specs/:specId', async (req, reply) => {
    const { specId } = req.params as { specId: string };
    const exists = await prisma.deviceSpec.findFirst({
      where: { id: specId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'スペック情報が見つかりません' });
    const data = parseBody(deviceSpecInputSchema, req.body, reply);
    if (!data) return;
    return prisma.deviceSpec.update({
      where: { id: specId },
      data: {
        specName: data.specName,
        specValue: data.specValue ?? null,
        unit: data.unit ?? null,
        memo: data.memo ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  });

  app.delete('/device-specs/:specId', async (req, reply) => {
    const { specId } = req.params as { specId: string };
    const exists = await prisma.deviceSpec.findFirst({
      where: { id: specId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'スペック情報が見つかりません' });
    await prisma.deviceSpec.delete({ where: { id: specId } });
    return reply.code(204).send();
  });
};

export default specRoutes;
