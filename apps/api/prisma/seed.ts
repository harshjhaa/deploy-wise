import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.environment.createMany({
    data: [
      { name: 'QA1', description: 'QA1 environment' },
      { name: 'QA2', description: 'QA2 environment' },
      { name: 'QA3', description: 'QA3 environment' },
      { name: 'QA4', description: 'QA4 environment' },
      { name: 'QA6', description: 'QA6 environment' },
      { name: 'QA7', description: 'QA7 environment' },
      { name: 'QA8', description: 'QA8 environment' },
      { name: 'QA9', description: 'QA9 environment' },
      { name: 'DEV2', description: 'Dev2 environment' },
      { name: 'UAT', description: 'UAT environment' },
    ],
    skipDuplicates: true,
  });

  await prisma.game.createMany({
    data: [
      { name: 'TopCard' },
      { name: 'Blackjack' },
      { name: 'Baccarat' },
      { name: 'MegaWheel' },
      { name: 'SweetBonanza' },
      { name: 'ColorGame' },
      { name: 'HighFlyer' },
      { name: 'MoenyTime' },
    ],
    skipDuplicates: true,
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'primary+seed@example.com' },
      update: {},
      create: { name: 'Primary Seed User', email: 'primary+seed@example.com', passwordHash: 'seed-placeholder-hash', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'secondary1+seed@example.com' },
      update: {},
      create: { name: 'Secondary Seed User 1', email: 'secondary1+seed@example.com', passwordHash: 'seed-placeholder-hash', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'secondary2+seed@example.com' },
      update: {},
      create: { name: 'Secondary Seed User 2', email: 'secondary2+seed@example.com', passwordHash: 'seed-placeholder-hash', role: 'USER' },
    }),
  ]);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
