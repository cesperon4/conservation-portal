import type { PrismaClient } from "../../src/generated/prisma/client.js";

export async function createTestCustomer(
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
      role: "customer",
      customerProfile: {
        create: {
          mailingAddress: "1 Test St",
          mailingCity: "Fremont",
          mailingState: "CA",
          mailingZip: "94536",
        },
      },
    },
  });
}

export async function deleteTestCustomer(
  prisma: PrismaClient,
  userId: string,
) {
  await prisma.property.deleteMany({ where: { customerUserId: userId } });
  await prisma.customerProfile.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}
