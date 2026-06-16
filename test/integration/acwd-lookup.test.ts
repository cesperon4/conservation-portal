import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HttpError } from "../../src/lib/errors.js";
import { AcwdLookupService } from "../../src/modules/acwd/acwd-lookup.service.js";
import { AcwdRepository } from "../../src/modules/acwd/acwd.repository.js";
import {
  cleanupAcwdFixtures,
  FIXTURE_ACCOUNTS,
  seedAcwdFixtures,
} from "../helpers/acwd-fixtures.js";
import { createTestPrisma } from "../helpers/prisma.js";

function expectHttpError(
  promise: Promise<unknown>,
  statusCode: number,
  message: string,
) {
  return expect(promise).rejects.toSatisfy((err: unknown) => {
    return (
      err instanceof HttpError &&
      err.statusCode === statusCode &&
      err.message === message
    );
  });
}

describe("AcwdLookupService (integration)", () => {
  const prisma = createTestPrisma();
  const service = new AcwdLookupService(new AcwdRepository(prisma));

  beforeAll(async () => {
    await prisma.$connect();
    await seedAcwdFixtures(prisma);
  });

  afterAll(async () => {
    await cleanupAcwdFixtures(prisma);
    await prisma.$disconnect();
  });

  it("returns preview for active billable account with matching ZIP", async () => {
    const result = await service.lookup(FIXTURE_ACCOUNTS.active, "94536");

    expect(result).toMatchObject({
      accountNo: FIXTURE_ACCOUNTS.active,
      locationNo: "9999999901",
      streetLine1: "123 MAIN ST",
      city: "FREMONT",
      state: "CA",
      postalCode: "94536-1234",
      category: "singleFamilyHome",
      acwdAccountClass: "RES",
      acwdLocationClass: "RES",
    });
    expect(result.acwdImportedAt).toBeInstanceOf(Date);
  });

  it("pads unpadded account numbers", async () => {
    const result = await service.lookup("9999995", "94536");
    expect(result.accountNo).toBe(FIXTURE_ACCOUNTS.padded);
  });

  it("rejects when latest moveinout is FINAL (stale CUTON)", async () => {
    await expectHttpError(
      service.lookup(FIXTURE_ACCOUNTS.closed, "94536"),
      400,
      "No active service at this account",
    );
  });

  it("rejects wrong ZIP", async () => {
    await expectHttpError(
      service.lookup(FIXTURE_ACCOUNTS.active, "94000"),
      400,
      "Account number and ZIP do not match",
    );
  });

  it("rejects ineligible property class (HYD)", async () => {
    await expectHttpError(
      service.lookup(FIXTURE_ACCOUNTS.hyd, "94536"),
      400,
      "Property type is not eligible for rebates",
    );
  });

  it("returns 404 for unknown account", async () => {
    await expectHttpError(
      service.lookup("99999999", "94536"),
      404,
      "Billable account not found",
    );
  });

  it("returns 400 when account is not BILBL", async () => {
    await expectHttpError(
      service.lookup(FIXTURE_ACCOUNTS.notBillable, "94536"),
      400,
      "Account not billable",
    );
  });
});

describe.skipIf(!process.env.ACWD_IMPORT_SMOKE)(
  "AcwdLookupService (imported data smoke)",
  () => {
    const prisma = createTestPrisma();
    const service = new AcwdLookupService(new AcwdRepository(prisma));

    beforeAll(async () => {
      await prisma.$connect();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it("40601154 is closed despite stale CUTON row", async () => {
      await expectHttpError(
        service.lookup("40601154", "94536"),
        400,
        "No active service at this account",
      );
    });
  },
);
