import type { FastifyPluginAsync } from 'fastify';
import {
  aiImportPayloadSchema,
  aiImportApplySchema,
  aiImportCreateAndApplySchema,
} from '@homegear/shared';
import { prisma } from '../lib/prisma';
import { ensureDeviceInHousehold } from '../utils/device-guard';
import { serializeDevice } from '../utils/serialize';

const aiImportRoutes: FastifyPluginAsync = async (app) => {
  /**
   * AI回答の生JSON文字列を受け取り、パースして整形済みプレビュー JSON を返す。
   * 既存値との比較で「上書き対象」かどうかも返す（device_id がある場合）。
   */
  app.post('/ai-import/parse', async (req, reply) => {
    const body = req.body as { rawJson?: string; deviceId?: string };
    if (!body?.rawJson || typeof body.rawJson !== 'string') {
      return reply.code(400).send({ message: 'rawJson が必要です' });
    }
    let json: unknown;
    try {
      json = JSON.parse(body.rawJson);
    } catch (e) {
      return reply.code(400).send({ message: 'JSONとして解析できませんでした', detail: String(e) });
    }
    const result = aiImportPayloadSchema.safeParse(json);
    if (!result.success) {
      return reply.code(400).send({
        message: 'AI回答の構造が想定と異なります',
        errors: result.error.flatten(),
      });
    }

    let existingDevice: any = null;
    if (body.deviceId) {
      existingDevice = await prisma.device.findFirst({
        where: { id: body.deviceId, householdId: req.auth.householdId },
      });
    }

    return {
      payload: result.data,
      existingDevice: existingDevice ? serializeDevice(existingDevice) : null,
    };
  });

  /**
   * AI回答 JSON を実際に DB に反映する。
   * overwrite=false（デフォルト）の場合、既存値がある項目は上書きしない。
   */
  app.post('/devices/:id/ai-import/apply', async (req, reply) => {
    const { id } = req.params as { id: string };
    const device = await prisma.device.findFirst({
      where: { id, householdId: req.auth.householdId },
    });
    if (!device) return reply.code(404).send({ message: '機器が見つかりません' });

    const parsed = aiImportApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: '入力内容が不正です', errors: parsed.error.flatten() });
    }
    const { payload, overwrite, applySpecs, applyLinks, applyConsumables, applyAccessories } = parsed.data;

    // device の基本情報更新（空欄項目のみ反映、または overwrite=true なら上書き）
    const deviceUpdate: Record<string, any> = {};
    const dev = payload.device;
    if (dev) {
      const apply = (field: string, val: string | undefined | null) => {
        if (val == null || val === '') return;
        const current = (device as any)[field];
        if (overwrite || current == null || current === '') {
          deviceUpdate[field] = val;
        }
      };
      apply('name', dev.name);
      apply('manufacturer', dev.manufacturer);
      apply('modelNumber', dev.model_number);
      // summary は memo に追記（既存があれば改行）
      if (dev.summary) {
        if (overwrite || !device.memo) {
          deviceUpdate.memo = dev.summary;
        } else if (!device.memo.includes(dev.summary)) {
          deviceUpdate.memo = `${device.memo}\n\n${dev.summary}`;
        }
      }
    }

    if (Object.keys(deviceUpdate).length > 0) {
      await prisma.device.update({ where: { id }, data: deviceUpdate });
    }

    // specs
    let specsCreated = 0;
    if (applySpecs && payload.specs?.length) {
      const existingSpecs = await prisma.deviceSpec.findMany({
        where: { deviceId: id },
        select: { specName: true },
      });
      const existingNames = new Set(existingSpecs.map((s) => s.specName));
      const toCreate = payload.specs.filter((s) => overwrite || !existingNames.has(s.spec_name));
      if (toCreate.length > 0) {
        await prisma.deviceSpec.createMany({
          data: toCreate.map((s, i) => ({
            householdId: req.auth.householdId,
            deviceId: id,
            specName: s.spec_name,
            specValue: s.spec_value ?? null,
            unit: s.unit ?? null,
            memo: s.memo ?? null,
            sortOrder: i,
          })),
        });
        specsCreated = toCreate.length;
      }
    }

    // links
    let linksCreated = 0;
    if (applyLinks && payload.links?.length) {
      const existingLinks = await prisma.deviceLink.findMany({
        where: { deviceId: id },
        select: { url: true },
      });
      const existingUrls = new Set(existingLinks.map((l) => l.url));
      const toCreate = payload.links.filter((l) => overwrite || !existingUrls.has(l.url));
      if (toCreate.length > 0) {
        await prisma.deviceLink.createMany({
          data: toCreate.map((l) => ({
            householdId: req.auth.householdId,
            deviceId: id,
            linkType: l.link_type,
            title: l.title ?? null,
            url: l.url,
            memo: l.memo ?? null,
          })),
        });
        linksCreated = toCreate.length;
      }
    }

    // consumables
    let consumablesCreated = 0;
    if (applyConsumables && payload.consumables?.length) {
      const existing = await prisma.consumable.findMany({
        where: { deviceId: id },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((c) => c.name));
      const toCreate = payload.consumables.filter((c) => overwrite || !existingNames.has(c.name));
      if (toCreate.length > 0) {
        await prisma.consumable.createMany({
          data: toCreate.map((c) => ({
            householdId: req.auth.householdId,
            deviceId: id,
            name: c.name,
            manufacturer: c.manufacturer ?? null,
            modelNumber: c.model_number ?? null,
            replacementIntervalText: c.replacement_interval_text ?? null,
            purchaseUrl: c.purchase_url ?? null,
            memo: c.memo ?? null,
          })),
        });
        consumablesCreated = toCreate.length;
      }
    }

    // accessories
    let accessoriesCreated = 0;
    if (applyAccessories && payload.accessories?.length) {
      const existing = await prisma.accessory.findMany({
        where: { deviceId: id },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((a) => a.name));
      const toCreate = payload.accessories.filter((a) => overwrite || !existingNames.has(a.name));
      if (toCreate.length > 0) {
        await prisma.accessory.createMany({
          data: toCreate.map((a) => ({
            householdId: req.auth.householdId,
            deviceId: id,
            name: a.name,
            quantity: a.quantity ?? null,
            memo: a.memo ?? null,
          })),
        });
        accessoriesCreated = toCreate.length;
      }
    }

    // ai_import_logs に記録
    await prisma.aiImportLog.create({
      data: {
        householdId: req.auth.householdId,
        deviceId: id,
        parsedJson: payload as any,
        memo: 'apply',
      },
    });

    return {
      ok: true,
      counts: {
        deviceFieldsUpdated: Object.keys(deviceUpdate).length,
        specsCreated,
        linksCreated,
        consumablesCreated,
        accessoriesCreated,
      },
    };
  });

  /**
   * 新規機器を作成し、同時に AI 回答 JSON を反映する。
   * - device.name はリクエスト値を優先、無ければ payload.device.name にフォールバック。
   * - manufacturer / modelNumber / memo(=summary) は payload からのみ取得（新規作成なので常に空欄）。
   * - 子テーブルは applyXxx フラグが true のものを全件追加（重複判定は不要）。
   * - category_suggestion は今回は無視（ユーザー指定の categoryId を優先）。
   */
  app.post('/ai-import/create-and-apply', async (req, reply) => {
    const parsed = aiImportCreateAndApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: '入力内容が不正です', errors: parsed.error.flatten() });
    }
    const {
      device: deviceInput,
      payload,
      applySpecs,
      applyLinks,
      applyConsumables,
      applyAccessories,
    } = parsed.data;
    const householdId = req.auth.householdId;

    // categoryId / locationId の所属チェック（他家庭の ID を弾く）
    if (deviceInput.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: deviceInput.categoryId, householdId },
      });
      if (!cat) return reply.code(400).send({ message: 'カテゴリが見つかりません' });
    }
    if (deviceInput.locationId) {
      const loc = await prisma.location.findFirst({
        where: { id: deviceInput.locationId, householdId },
      });
      if (!loc) return reply.code(400).send({ message: '設置場所が見つかりません' });
    }

    const aiDevice = payload.device ?? {};
    const name = deviceInput.name || aiDevice.name || '';
    if (!name) {
      return reply.code(400).send({ message: '機器名を入力してください' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.device.create({
        data: {
          householdId,
          name,
          categoryId: deviceInput.categoryId || null,
          locationId: deviceInput.locationId || null,
          status: deviceInput.status,
          priority: deviceInput.priority,
          manufacturer: aiDevice.manufacturer ?? null,
          modelNumber: aiDevice.model_number ?? null,
          memo: aiDevice.summary ?? null,
        },
      });

      let specsCreated = 0;
      if (applySpecs && payload.specs?.length) {
        await tx.deviceSpec.createMany({
          data: payload.specs.map((s, i) => ({
            householdId,
            deviceId: created.id,
            specName: s.spec_name,
            specValue: s.spec_value ?? null,
            unit: s.unit ?? null,
            memo: s.memo ?? null,
            sortOrder: i,
          })),
        });
        specsCreated = payload.specs.length;
      }

      let linksCreated = 0;
      if (applyLinks && payload.links?.length) {
        await tx.deviceLink.createMany({
          data: payload.links.map((l) => ({
            householdId,
            deviceId: created.id,
            linkType: l.link_type,
            title: l.title ?? null,
            url: l.url,
            memo: l.memo ?? null,
          })),
        });
        linksCreated = payload.links.length;
      }

      let consumablesCreated = 0;
      if (applyConsumables && payload.consumables?.length) {
        await tx.consumable.createMany({
          data: payload.consumables.map((c) => ({
            householdId,
            deviceId: created.id,
            name: c.name,
            manufacturer: c.manufacturer ?? null,
            modelNumber: c.model_number ?? null,
            replacementIntervalText: c.replacement_interval_text ?? null,
            purchaseUrl: c.purchase_url ?? null,
            memo: c.memo ?? null,
          })),
        });
        consumablesCreated = payload.consumables.length;
      }

      let accessoriesCreated = 0;
      if (applyAccessories && payload.accessories?.length) {
        await tx.accessory.createMany({
          data: payload.accessories.map((a) => ({
            householdId,
            deviceId: created.id,
            name: a.name,
            quantity: a.quantity ?? null,
            memo: a.memo ?? null,
          })),
        });
        accessoriesCreated = payload.accessories.length;
      }

      await tx.aiImportLog.create({
        data: {
          householdId,
          deviceId: created.id,
          parsedJson: payload as any,
          memo: 'create-and-apply',
        },
      });

      const detail = await tx.device.findFirst({
        where: { id: created.id, householdId },
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

      return {
        device: detail,
        counts: { specsCreated, linksCreated, consumablesCreated, accessoriesCreated },
      };
    });

    return reply.code(201).send({
      device: result.device ? serializeDevice(result.device) : null,
      counts: result.counts,
    });
  });
};

export default aiImportRoutes;
