import type { PrismaClient, PropertyCategory } from "../src/generated/prisma/client.js";
import { AcwdLookupService } from "../src/modules/acwd/acwd-lookup.service.js";
import { AcwdRepository } from "../src/modules/acwd/acwd.repository.js";
import type { AcwdLookupPreview } from "../src/modules/acwd/acwd.types.js";

const TARGET_PROPERTY_COUNT = 100;
const MANUAL_PER_CUSTOMER = 4;
const ACWD_MAX_PER_CUSTOMER = 8;
const ACWD_SCAN_BATCH_SIZE = 15_000;

const propertyCategories: PropertyCategory[] = [
  "singleFamilyHome",
  "residential",
  "multiFamilyComplex",
  "commercial",
  "landscape",
];

const seedCities = [
  { city: "Fremont", state: "CA", postalCode: "94536" },
  { city: "Fremont", state: "CA", postalCode: "94538" },
  { city: "Newark", state: "CA", postalCode: "94560" },
  { city: "Union City", state: "CA", postalCode: "94587" },
  { city: "Hayward", state: "CA", postalCode: "94541" },
] as const;

const streetNames = [
  "Palm Ave",
  "Mission Blvd",
  "Decoto Rd",
  "Capitol Ave",
  "Walnut Ave",
  "Thornton Ave",
  "Mowry Ave",
  "Jarvis Ave",
  "Industrial Blvd",
  "Paseo Padre Pkwy",
  "Smith St",
  "Oak St",
  "Canyon Rd",
  "Stevenson Blvd",
] as const;

type SeedCustomer = { id: string; email: string; firstName: string; lastName: string };

function isEligibleCategory(
  category: AcwdLookupPreview["category"],
): category is PropertyCategory {
  return category !== "other";
}

function buildManualProperties(customers: SeedCustomer[]) {
  return customers.flatMap((customer, customerIndex) => {
    return Array.from({ length: MANUAL_PER_CUSTOMER }, (_, propertyIndex) => {
      const location = seedCities[(customerIndex + propertyIndex) % seedCities.length]!;
      const street = streetNames[(customerIndex + propertyIndex) % streetNames.length]!;
      const streetNumber = 100 + customerIndex * 37 + propertyIndex * 113;
      const category =
        propertyCategories[(customerIndex + propertyIndex) % propertyCategories.length]!;
      const hasUnit = propertyIndex % 3 === 1;

      return {
        customerUserId: customer.id,
        streetLine1: `${streetNumber} ${street}`,
        streetLine2: hasUnit ? `# ${propertyIndex + 1}` : null,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        category,
        source: "manual" as const,
        acwdAccountNo: null,
        acwdLocationNo: null,
        deletedAt:
          customerIndex % 5 === 0 && propertyIndex === MANUAL_PER_CUSTOMER - 1
            ? new Date("2025-01-15T00:00:00.000Z")
            : null,
      };
    });
  });
}

async function discoverAcwdLookupPreviews(
  prisma: PrismaClient,
  lookup: AcwdLookupService,
  limit: number,
): Promise<AcwdLookupPreview[]> {
  const previews: AcwdLookupPreview[] = [];
  const seen = new Set<string>();

  const rows = await prisma.acwdMoveInOut.findMany({
    where: { status: "CUTON", moveOutDate: null },
    orderBy: [{ statusDate: "desc" }, { moveInDate: "desc" }, { id: "desc" }],
    take: ACWD_SCAN_BATCH_SIZE,
  });

  for (const row of rows) {
    if (previews.length >= limit) break;

    const dedupeKey = `${row.accountNo}:${row.locationNo}`;
    if (seen.has(dedupeKey)) continue;

    const account = await prisma.acwdAccount.findUnique({
      where: { accountNo: row.accountNo },
    });
    if (account?.accountStat !== "BILBL") continue;

    const location = await prisma.acwdLocation.findUnique({
      where: { locationNo: row.locationNo },
    });
    if (!location || location.locationStat.trim() !== "ACT") continue;

    const postalCode = location.postalCode.trim().split("-")[0] ?? "";
    if (postalCode.length < 5) continue;

    try {
      const preview = await lookup.lookup(row.accountNo, postalCode);
      if (!isEligibleCategory(preview.category)) continue;
      seen.add(dedupeKey);
      previews.push(preview);
    } catch {
      // Skip ineligible or mismatched rows.
    }
  }

  return previews;
}

function pickCustomerForAcwdProperty(
  customers: SeedCustomer[],
  acwdCountByCustomer: Map<string, number>,
): SeedCustomer | null {
  const available = customers
    .filter(
      (customer) =>
        (acwdCountByCustomer.get(customer.id) ?? 0) < ACWD_MAX_PER_CUSTOMER,
    )
    .sort(
      (a, b) =>
        (acwdCountByCustomer.get(a.id) ?? 0) -
        (acwdCountByCustomer.get(b.id) ?? 0),
    );

  return available[0] ?? null;
}

export async function seedProperties(prisma: PrismaClient): Promise<void> {
  console.log("Seeding properties...");

  const customerUsers = await prisma.user.findMany({
    where: {
      role: "customer",
      customerProfile: { isNot: null },
      deletedAt: null,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
    orderBy: { email: "asc" },
  });

  if (customerUsers.length === 0) {
    console.warn("No active customer profiles found — skipping property seed.");
    return;
  }

  const customerIds = customerUsers.map((user) => user.id);

  await prisma.property.deleteMany({
    where: { customerUserId: { in: customerIds } },
  });

  const manualRows = buildManualProperties(customerUsers);
  if (manualRows.length > 0) {
    await prisma.property.createMany({ data: manualRows });
  }

  const manualCount = manualRows.length;
  const targetAcwdCount = Math.max(0, TARGET_PROPERTY_COUNT - manualCount);

  const lookup = new AcwdLookupService(new AcwdRepository(prisma));
  const previews = await discoverAcwdLookupPreviews(
    prisma,
    lookup,
    targetAcwdCount,
  );

  const acwdCountByCustomer = new Map<string, number>();
  let acwdCount = 0;

  for (const preview of previews) {
    const customer = pickCustomerForAcwdProperty(
      customerUsers,
      acwdCountByCustomer,
    );
    if (!customer) break;

    await prisma.property.create({
      data: {
        customerUserId: customer.id,
        streetLine1: preview.streetLine1,
        streetLine2: preview.streetLine2,
        city: preview.city,
        state: preview.state,
        postalCode: preview.postalCode,
        category: preview.category,
        source: "acwd",
        acwdAccountNo: preview.accountNo,
        acwdLocationNo: preview.locationNo,
      },
    });

    acwdCountByCustomer.set(
      customer.id,
      (acwdCountByCustomer.get(customer.id) ?? 0) + 1,
    );
    acwdCount++;
  }

  if (previews.length === 0) {
    console.warn(
      "No ACWD lookup previews found. Import ACWD data first: npm run acwd:import",
    );
  } else if (acwdCount < targetAcwdCount) {
    console.warn(
      `Only found ${acwdCount} ACWD properties (target ${targetAcwdCount}). Import more ACWD data or increase scan batch.`,
    );
  }

  const totalProperties = await prisma.property.count({
    where: { customerUserId: { in: customerIds } },
  });
  const activeProperties = await prisma.property.count({
    where: { deletedAt: null, customerUserId: { in: customerIds } },
  });
  const deletedProperties = await prisma.property.count({
    where: { deletedAt: { not: null }, customerUserId: { in: customerIds } },
  });

  console.log(
    `Properties seeded: ${manualCount} manual, ${acwdCount} acwd (${totalProperties} total; ${activeProperties} active, ${deletedProperties} soft-deleted).`,
  );
}
