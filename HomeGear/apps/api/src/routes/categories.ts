import type { FastifyPluginAsync } from 'fastify';
import { categoryInputSchema } from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { parseBody } from '../utils/validate';

const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => {
    return prisma.category.findMany({
      where: { householdId: req.auth.householdId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  });

  app.post('/', async (req, reply) => {
    const data = parseBody(categoryInputSchema, req.body, reply);
    if (!data) return;
    const created = await prisma.category.create({
      data: {
        householdId: req.auth.householdId,
        name: data.name,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return reply.code(201).send(created);
  });

  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.category.findFirst({ where: { id, householdId: req.auth.householdId } });
    if (!exists) return reply.code(404).send({ message: 'カテゴリが見つかりません' });
    const data = parseBody(categoryInputSchema, req.body, reply);
    if (!data) return;
    return prisma.category.update({
      where: { id },
      data: { name: data.name, icon: data.icon ?? null, sortOrder: data.sortOrder ?? 0 },
    });
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.category.findFirst({ where: { id, householdId: req.auth.householdId } });
    if (!exists) return reply.code(404).send({ message: 'カテゴリが見つかりません' });
    // 機器が紐づいている場合は機器側を nullに
    await prisma.device.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id } });
    return reply.code(204).send();
  });
};

export default categoryRoutes;
