import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { buildApp } from "../../src/app.js";
import type { FastifyInstance } from "fastify";
import {
  cleanupAcwdFixtures,
  FIXTURE_ACCOUNTS,
  seedAcwdFixtures,
} from "../helpers/acwd-fixtures.js";
import {
  createTestCustomer,
  deleteTestCustomer,
} from "../helpers/customer.js";
import { createTestPrisma } from "../helpers/prisma.js";

describe("Properties routes (integration)", () => {
  const prisma = createTestPrisma();
  let app: FastifyInstance;
  let customerUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await seedAcwdFixtures(prisma);

    const customer = await createTestCustomer(prisma, "properties-routes");
    customerUserId = customer.id;

    app = await buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.property.deleteMany({ where: { customerUserId } });
  });

  afterAll(async () => {
    await app.close();
    await deleteTestCustomer(prisma, customerUserId);
    await cleanupAcwdFixtures(prisma);
    await prisma.$disconnect();
  });

  it("GET /properties/acwd/lookup returns preview", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/properties/acwd/lookup",
      query: {
        accountNo: FIXTURE_ACCOUNTS.active,
        postalCode: "94536",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accountNo: FIXTURE_ACCOUNTS.active,
      locationNo: "9999999901",
      streetLine1: "123 MAIN ST",
      category: "singleFamilyHome",
    });
  });

  it("GET /properties/acwd/lookup rejects wrong ZIP with 400", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/properties/acwd/lookup",
      query: {
        accountNo: FIXTURE_ACCOUNTS.active,
        postalCode: "94000",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: "Account number and ZIP do not match",
    });
  });

  it("POST /properties creates a manual property", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload: {
        customerUserId,
        source: "manual",
        streetLine1: "800 Route Test Blvd",
        city: "Fremont",
        state: "CA",
        postalCode: "94536",
        category: "commercial",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      customerUserId,
      streetLine1: "800 Route Test Blvd",
      category: "commercial",
      source: "manual",
    });
  });

  it("POST /properties creates an ACWD-linked property", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload: {
        customerUserId,
        source: "acwd",
        acwdAccountNo: FIXTURE_ACCOUNTS.active,
        postalCode: "94536",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      customerUserId,
      acwdAccountNo: FIXTURE_ACCOUNTS.active,
      acwdLocationNo: "9999999901",
      source: "acwd",
    });
  });

  it("POST /properties returns 409 for duplicate active ACWD registration", async () => {
    const payload = {
      customerUserId,
      source: "acwd" as const,
      acwdAccountNo: FIXTURE_ACCOUNTS.active,
      postalCode: "94536",
    };

    const first = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload,
    });
    expect(first.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload,
    });

    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({
      message: "This ACWD account is already registered for this customer",
    });
  });

  it("GET /properties lists customer properties", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload: {
        customerUserId,
        source: "manual",
        streetLine1: "900 List Ln",
        city: "Fremont",
        state: "CA",
        postalCode: "94536",
        category: "landscape",
      },
    });
    expect(create.statusCode).toBe(201);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/properties",
      query: { customerUserId, limit: "10" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      customerUserId,
      streetLine1: "900 List Ln",
      category: "landscape",
    });
    expect(body.pagination).toMatchObject({
      limit: 10,
      hasMore: false,
      nextCursor: null,
    });
  });

  it("GET/PATCH/DELETE /properties/:id supports update and soft delete", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/properties",
      payload: {
        customerUserId,
        source: "manual",
        streetLine1: "1000 Lifecycle Rd",
        city: "Fremont",
        state: "CA",
        postalCode: "94536",
        category: "singleFamilyHome",
      },
    });
    const propertyId = create.json().id as string;

    const get = await app.inject({
      method: "GET",
      url: `/api/v1/properties/${propertyId}`,
    });
    expect(get.statusCode).toBe(200);
    expect(get.json().streetLine1).toBe("1000 Lifecycle Rd");

    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/properties/${propertyId}`,
      payload: { streetLine1: "1001 Lifecycle Rd" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().streetLine1).toBe("1001 Lifecycle Rd");

    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/properties/${propertyId}`,
    });
    expect(del.statusCode).toBe(204);

    const missing = await app.inject({
      method: "GET",
      url: `/api/v1/properties/${propertyId}`,
    });
    expect(missing.statusCode).toBe(404);
  });

  it("returns 404 for unknown property id", async () => {
    const orphan = await prisma.property.create({
      data: {
        customerUserId,
        streetLine1: "Temp",
        city: "Fremont",
        state: "CA",
        postalCode: "94536",
        category: "residential",
        source: "manual",
      },
    });
    await prisma.property.delete({ where: { id: orphan.id } });

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/properties/${orphan.id}`,
    });

    expect(response.statusCode).toBe(404);
  });
});
