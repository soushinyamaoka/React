import type { FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

/**
 * deviceId が現在の household のものか確認する。違えば 404 を返して null。
 */
export async function ensureDeviceInHousehold(
  deviceId: string,
  householdId: string,
  reply: FastifyReply
) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, householdId },
    select: { id: true, householdId: true },
  });
  if (!device) {
    reply.code(404).send({ message: '機器が見つかりません' });
    return null;
  }
  return device;
}
