import type { FastifyPluginAsync } from 'fastify';
import { deviceLinkInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';
import { ensureDeviceInHousehold } from '../utils/device-guard';

const linkRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices/:id/links', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    return prisma.deviceLink.findMany({
      where: { deviceId: id },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/devices/:id/links', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await ensureDeviceInHousehold(id, req.auth.householdId, reply);
    if (!device) return;
    const data = parseBody(deviceLinkInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.deviceLink.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        linkType: data.linkType,
        title: data.title ?? null,
        url: data.url,
        memo: data.memo ?? null,
      },
    });
    return reply.code(201).send(created);
  });

  app.put('/device-links/:linkId', async (req, reply) => {
    const { linkId } = req.params as { linkId: string };
    const exists = await prisma.deviceLink.findFirst({
      where: { id: linkId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'リンクが見つかりません' });
    const data = parseBody(deviceLinkInputSchema, req.body, reply);
    if (!data) return;
    return prisma.deviceLink.update({
      where: { id: linkId },
      data: {
        linkType: data.linkType,
        title: data.title ?? null,
        url: data.url,
        memo: data.memo ?? null,
      },
    });
  });

  app.delete('/device-links/:linkId', async (req, reply) => {
    const { linkId } = req.params as { linkId: string };
    const exists = await prisma.deviceLink.findFirst({
      where: { id: linkId, householdId: req.auth.householdId },
    });
    if (!exists) return reply.code(404).send({ message: 'リンクが見つかりません' });
    await prisma.deviceLink.delete({ where: { id: linkId } });
    return reply.code(204).send();
  });
};

export default linkRoutes;
