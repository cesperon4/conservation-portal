import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "../../src/lib/errors.js";
import { AcwdLookupService } from "../../src/modules/acwd/acwd-lookup.service.js";
import { AcwdRepository } from "../../src/modules/acwd/acwd.repository.js";
import { PropertyRepository } from "../../src/modules/properties/property.repository.js";
import { PropertyService } from "../../src/modules/properties/property.service.js";
import { UserRepository } from "../../src/modules/users/user.repository.js";
import { UserService } from "../../src/modules/users/user.service.js";
import {
  createTestCustomer,
  deleteTestCustomer,
} from "../helpers/customer.js";
import { expectHttpError } from "../helpers/http-error.js";
import { createTestPrisma } from "../helpers/prisma.js";

describe("PropertyService manual CRUD (integration)", () => {
  const prisma = createTestPrisma();
  const propertyService = new PropertyService(
    new PropertyRepository(prisma),
    new UserService(new UserRepository(prisma)),
    new AcwdLookupService(new AcwdRepository(prisma)),
  );

  let customerUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const customer = await createTestCustomer(prisma, "manual-property");
    customerUserId = customer.id;
  });

  beforeEach(async () => {
    await prisma.property.deleteMany({ where: { customerUserId } });
  });

  afterAll(async () => {
    await deleteTestCustomer(prisma, customerUserId);
    await prisma.$disconnect();
  });

  const manualCreateInput = () => ({
    customerUserId,
    source: "manual" as const,
    streetLine1: "500 Manual Ave",
    streetLine2: "Unit 4",
    city: "Fremont",
    state: "ca",
    postalCode: "94536",
    category: "residential" as const,
  });

  it("creates a manual property with normalized state", async () => {
    const property = await propertyService.create(manualCreateInput());

    expect(property).toMatchObject({
      customerUserId,
      streetLine1: "500 Manual Ave",
      streetLine2: "Unit 4",
      city: "Fremont",
      state: "CA",
      postalCode: "94536",
      category: "residential",
      source: "manual",
      acwdAccountNo: null,
      acwdLocationNo: null,
      deletedAt: null,
    });
  });

  it("updates address fields", async () => {
    const property = await propertyService.create(manualCreateInput());

    const updated = await propertyService.update(property.id, {
      streetLine1: "501 Manual Ave",
      streetLine2: null,
      city: "Newark",
    });

    expect(updated).toMatchObject({
      id: property.id,
      streetLine1: "501 Manual Ave",
      streetLine2: null,
      city: "Newark",
      state: "CA",
    });
  });

  it("soft-deletes a property and hides it from get/list", async () => {
    const property = await propertyService.create(manualCreateInput());
    await propertyService.softDelete(property.id);

    await expect(propertyService.getById(property.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const list = await propertyService.list({
      limit: 20,
      direction: "desc",
      column: "createdAt",
      customerUserId,
    });

    expect(list.data).toHaveLength(0);
  });

  it("paginates active properties with cursor", async () => {
    const first = await propertyService.create(manualCreateInput());
    const second = await propertyService.create({
      ...manualCreateInput(),
      streetLine1: "600 Manual Ave",
    });

    const pageOne = await propertyService.list({
      limit: 1,
      direction: "asc",
      column: "createdAt",
      customerUserId,
    });

    expect(pageOne.data).toHaveLength(1);
    expect(pageOne.pagination.hasMore).toBe(true);
    expect(pageOne.pagination.nextCursor).toBe(first.id);

    const pageTwo = await propertyService.list({
      limit: 1,
      direction: "asc",
      column: "createdAt",
      customerUserId,
      cursor: pageOne.pagination.nextCursor ?? undefined,
    });

    expect(pageTwo.data).toHaveLength(1);
    expect(pageTwo.data[0]?.id).toBe(second.id);
    expect(pageTwo.pagination.hasMore).toBe(false);
  });

  it("rejects create when customer profile is missing", async () => {
    const admin = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "Only",
        email: `admin-only-${Date.now()}@example.com`,
        passwordHash: "test-hash",
        role: "admin",
        adminProfile: { create: {} },
      },
    });

    try {
      await expectHttpError(
        propertyService.create({
          ...manualCreateInput(),
          customerUserId: admin.id,
        }),
        400,
        "Customer profile not found",
      );
    } finally {
      await prisma.adminProfile.deleteMany({ where: { userId: admin.id } });
      await prisma.user.deleteMany({ where: { id: admin.id } });
    }
  });
});
