import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AcwdLookupService } from "../../src/modules/acwd/acwd-lookup.service.js";
import { AcwdRepository } from "../../src/modules/acwd/acwd.repository.js";
import { PropertyRepository } from "../../src/modules/properties/property.repository.js";
import { PropertyService } from "../../src/modules/properties/property.service.js";
import { UserRepository } from "../../src/modules/users/user.repository.js";
import { UserService } from "../../src/modules/users/user.service.js";
import {
  cleanupAcwdFixtures,
  FIXTURE_ACCOUNTS,
  seedAcwdFixtures,
} from "../helpers/acwd-fixtures.js";
import {
  createTestCustomer,
  deleteTestCustomer,
} from "../helpers/customer.js";
import { expectHttpError } from "../helpers/http-error.js";
import { createTestPrisma } from "../helpers/prisma.js";

describe("PropertyService ACWD create (integration)", () => {
  const prisma = createTestPrisma();
  const propertyService = new PropertyService(
    new PropertyRepository(prisma),
    new UserService(new UserRepository(prisma)),
    new AcwdLookupService(new AcwdRepository(prisma)),
  );

  let customerUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await seedAcwdFixtures(prisma);

    const customer = await createTestCustomer(prisma, "property-acwd");
    customerUserId = customer.id;
  });

  beforeEach(async () => {
    await prisma.property.deleteMany({ where: { customerUserId } });
  });

  afterAll(async () => {
    await deleteTestCustomer(prisma, customerUserId);
    await cleanupAcwdFixtures(prisma);
    await prisma.$disconnect();
  });

  const acwdCreateInput = () => ({
    customerUserId,
    source: "acwd" as const,
    acwdAccountNo: FIXTURE_ACCOUNTS.active,
    postalCode: "94536",
  });

  it("creates a property from ACWD lookup", async () => {
    const property = await propertyService.create(acwdCreateInput());

    expect(property).toMatchObject({
      customerUserId,
      acwdAccountNo: FIXTURE_ACCOUNTS.active,
      acwdLocationNo: "9999999901",
      source: "acwd",
      deletedAt: null,
    });
  });

  it("rejects duplicate active ACWD registration with 409", async () => {
    await propertyService.create(acwdCreateInput());

    await expectHttpError(
      propertyService.create(acwdCreateInput()),
      409,
      "This ACWD account is already registered for this customer",
    );
  });

  it("propagates ACWD lookup failures", async () => {
    await expectHttpError(
      propertyService.create({
        customerUserId,
        source: "acwd",
        acwdAccountNo: FIXTURE_ACCOUNTS.active,
        postalCode: "94000",
      }),
      400,
      "Account number and ZIP do not match",
    );
  });

  it("restores a soft-deleted ACWD property on re-register", async () => {
    const existing = await propertyService.create(acwdCreateInput());
    await propertyService.softDelete(existing.id);

    const restored = await propertyService.create(acwdCreateInput());

    expect(restored.id).toBe(existing.id);
    expect(restored.deletedAt).toBeNull();
    expect(restored).toMatchObject({
      acwdAccountNo: FIXTURE_ACCOUNTS.active,
      acwdLocationNo: "9999999901",
      source: "acwd",
    });
  });

  it("filters list by customerUserId", async () => {
    const otherCustomer = await prisma.user.create({
      data: {
        firstName: "Other",
        lastName: "Customer",
        email: `property-other-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        role: "customer",
        customerProfile: {
          create: {
            mailingAddress: "2 Test St",
            mailingCity: "Fremont",
            mailingState: "CA",
            mailingZip: "94536",
          },
        },
      },
    });

    try {
      await propertyService.create(acwdCreateInput());
      await propertyService.create({
        customerUserId: otherCustomer.id,
        source: "acwd",
        acwdAccountNo: FIXTURE_ACCOUNTS.padded,
        postalCode: "94536",
      });

      const filtered = await propertyService.list({
        limit: 20,
        direction: "desc",
        column: "createdAt",
        customerUserId,
      });

      expect(filtered.data).toHaveLength(1);
      expect(filtered.data[0]?.customerUserId).toBe(customerUserId);
    } finally {
      await prisma.property.deleteMany({
        where: { customerUserId: otherCustomer.id },
      });
      await prisma.customerProfile.deleteMany({
        where: { userId: otherCustomer.id },
      });
      await prisma.user.deleteMany({ where: { id: otherCustomer.id } });
    }
  });
});
