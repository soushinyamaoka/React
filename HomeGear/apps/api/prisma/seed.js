"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const shared_1 = require("@homegear/shared");
const prisma = new client_1.PrismaClient();
async function main() {
    // 開発用のデモユーザー
    const email = 'demo@example.com';
    const password = 'demo1234';
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`既にseed済みです (user: ${email})`);
        return;
    }
    const user = await prisma.user.create({
        data: {
            email,
            name: 'デモユーザー',
            passwordHash,
        },
    });
    const household = await prisma.household.create({
        data: {
            name: 'デモ家庭',
        },
    });
    await prisma.householdMember.create({
        data: {
            householdId: household.id,
            userId: user.id,
            role: 'owner',
        },
    });
    // 初期カテゴリ
    await prisma.category.createMany({
        data: shared_1.DEFAULT_CATEGORIES.map((c, i) => ({
            householdId: household.id,
            name: c.name,
            icon: c.icon,
            sortOrder: i,
        })),
    });
    // 初期設置場所
    await prisma.location.createMany({
        data: shared_1.DEFAULT_LOCATIONS.map((name, i) => ({
            householdId: household.id,
            name,
            sortOrder: i,
        })),
    });
    console.log(`seed 完了: ${email} / ${password}`);
}
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
