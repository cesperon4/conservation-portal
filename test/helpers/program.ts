import type { PrismaClient } from "../../src/generated/prisma/client.js";

export async function createTestAdmin(
  prisma: PrismaClient,
  label: string,
) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return prisma.user.create({
    data: {
      firstName: "Test",
      lastName: label,
      email: `${suffix}@example.com`,
      passwordHash: "test-hash",
      role: "admin",
      adminProfile: { create: {} },
    },
    include: { adminProfile: true },
  });
}

export async function createTestProgram(
  prisma: PrismaClient,
  adminUserId: string,
  label = "program",
) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return prisma.program.create({
    data: {
      name: `Test Program ${suffix}`,
      description: "Program created for integration tests",
      defaultUnitWaterSavings: 1500,
      defaultUnitCost: 4.25,
      budget: 250000,
      defaultUnit: "sq ft",
      singleFamilyHome: true,
      multiFamilyComplex: false,
      residential: true,
      commercial: false,
      landscape: false,
      programStart: new Date("2024-01-01T00:00:00.000Z"),
      programEnd: new Date("2026-12-31T23:59:59.000Z"),
      admin: { connect: { userId: adminUserId } },
      grantFunding: 50000,
      thirdParty: false,
    },
  });
}

export async function deleteTestProgram(
  prisma: PrismaClient,
  programId: string,
) {
  await prisma.programStatus.deleteMany({ where: { programId } });
  await prisma.programBudgetLog.deleteMany({ where: { programId } });
  await prisma.program.deleteMany({ where: { id: programId } });
}

export async function deleteTestAdmin(
  prisma: PrismaClient,
  userId: string,
) {
  const programs = await prisma.program.findMany({
    where: { adminUserId: userId },
    select: { id: true },
  });

  for (const program of programs) {
    await deleteTestProgram(prisma, program.id);
  }

  await prisma.programBudgetLog.deleteMany({ where: { adminUserId: userId } });
  await prisma.adminProfile.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}
