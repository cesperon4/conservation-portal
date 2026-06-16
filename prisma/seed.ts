import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Role } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";
import { seedProperties } from "./seed-properties.js";

/** Default password for all seeded users (development only). */
export const SEED_USER_PASSWORD = "Password123!";

type SeedCustomerProfile = {
  mailingAddress: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  company?: string;
  title?: string;
  verifiedAt?: Date;
};

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  role?: Role;
  phone?: string;
  deletedAt?: Date;
  customerProfile?: SeedCustomerProfile;
};

const namedUsers: SeedUser[] = [
  {
    firstName: "Alice",
    lastName: "Chen",
    email: "alice.chen@example.com",
    role: "admin",
    phone: "5105550101",
  },
  {
    firstName: "Brian",
    lastName: "Walsh",
    email: "brian.walsh@example.com",
    role: "admin",
    phone: "5105550104",
  },
  {
    firstName: "Marcus",
    lastName: "Rivera",
    email: "marcus.rivera@example.com",
    role: "county",
    phone: "5105550102",
  },
  {
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@example.com",
    role: "contractor",
    phone: "5105550103",
  },
  {
    firstName: "Jordan",
    lastName: "Kim",
    email: "jordan.kim@example.com",
    role: "customer",
    customerProfile: {
      mailingAddress: "412 Palm Ave",
      mailingCity: "Fremont",
      mailingState: "CA",
      mailingZip: "94536",
    },
  },
  {
    firstName: "Elena",
    lastName: "Vasquez",
    email: "elena.vasquez@example.com",
    role: "county",
    phone: "5105550106",
  },
  {
    firstName: "David",
    lastName: "Okonkwo",
    email: "david.okonkwo@example.com",
    role: "contractor",
    phone: "5105550107",
  },
  {
    firstName: "Sofia",
    lastName: "Andersson",
    email: "sofia.andersson@example.com",
    role: "guest",
  },
  {
    firstName: "James",
    lastName: "Whitfield",
    email: "james.whitfield@example.com",
    role: "customer",
    phone: "5105550109",
    customerProfile: {
      mailingAddress: "88 Mission Blvd",
      mailingCity: "Union City",
      mailingState: "CA",
      mailingZip: "94587",
      verifiedAt: new Date("2025-01-10T00:00:00.000Z"),
    },
  },
  {
    firstName: "Mei",
    lastName: "Tanaka",
    email: "mei.tanaka@example.com",
    role: "customer",
    phone: "5105550110",
    customerProfile: {
      mailingAddress: "1200 Stevenson Blvd",
      mailingCity: "Fremont",
      mailingState: "CA",
      mailingZip: "94538",
      company: "Tanaka Property Group",
      title: "Owner",
      verifiedAt: new Date("2025-02-01T00:00:00.000Z"),
    },
  },
  {
    firstName: "Carlos",
    lastName: "Mendez",
    email: "carlos.mendez@example.com",
    role: "contractor",
    phone: "5105550111",
  },
  {
    firstName: "Sam",
    lastName: "Nguyen",
    email: "sam.nguyen@example.com",
    role: "customer",
    phone: "5105550105",
    deletedAt: new Date("2025-03-01T12:00:00.000Z"),
    customerProfile: {
      mailingAddress: "501 Decoto Rd",
      mailingCity: "Fremont",
      mailingState: "CA",
      mailingZip: "94555",
    },
  },
  {
    firstName: "Rachel",
    lastName: "Brooks",
    email: "rachel.brooks@example.com",
    role: "guest",
    phone: "5105550112",
    deletedAt: new Date("2025-04-15T09:30:00.000Z"),
  },
];

const bulkFirstNames = [
  "Noah",
  "Emma",
  "Liam",
  "Olivia",
  "Mason",
  "Ava",
  "Ethan",
  "Isabella",
  "Logan",
  "Mia",
  "Lucas",
  "Charlotte",
  "Henry",
  "Amelia",
  "Oliver",
  "Harper",
  "Elijah",
  "Evelyn",
  "William",
  "Abigail",
];

const bulkLastNames = [
  "Sullivan",
  "Carter",
  "Hayes",
  "Foster",
  "Reed",
  "Bennett",
  "Griffin",
  "Porter",
  "Hayes",
  "Dawson",
];

const bulkRoles: Role[] = [
  "customer",
  "customer",
  "contractor",
  "county",
  "guest",
];

const bulkUsers: SeedUser[] = bulkFirstNames.map((firstName, index) => {
  const lastName = bulkLastNames[index % bulkLastNames.length]!;
  const sequence = String(index + 1).padStart(2, "0");
  const role = bulkRoles[index % bulkRoles.length]!;

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${sequence}@example.com`,
    role,
    phone: index % 3 === 0 ? undefined : `5105551${String(200 + index).slice(-3)}`,
    ...(role === "customer" && {
      customerProfile: defaultCustomerMailing(firstName, lastName, index),
    }),
  };
});

const seedUsers: SeedUser[] = [...namedUsers, ...bulkUsers];

function defaultCustomerMailing(
  firstName: string,
  lastName: string,
  index: number,
): SeedCustomerProfile {
  const streetNumber = 100 + index * 17;
  return {
    mailingAddress: `${streetNumber} ${lastName} St`,
    mailingCity: index % 2 === 0 ? "Fremont" : "Newark",
    mailingState: "CA",
    mailingZip: index % 2 === 0 ? "94536" : "94560",
  };
}

type SeedProgram = {
  name: string;
  description?: string;
  defaultUnitWaterSavings: number;
  defaultUnitCost: number;
  budget: number;
  defaultUnit: string;
  singleFamilyHome: boolean;
  multiFamilyComplex: boolean;
  residential: boolean;
  commercial: boolean;
  programStart: Date;
  programEnd: Date;
  ownerEmail: string;
  grantFunding: number;
  thirdParty: boolean;
  deletedAt?: Date;
};

const seedPrograms: SeedProgram[] = [
  {
    name: "Residential Turf Replacement Rebate",
    description:
      "Rebate for replacing lawn turf with drought-tolerant landscaping in single-family homes.",
    defaultUnitWaterSavings: 1500,
    defaultUnitCost: 4.25,
    budget: 2500000,
    defaultUnit: "sq ft",
    singleFamilyHome: true,
    multiFamilyComplex: false,
    residential: true,
    commercial: false,
    programStart: new Date("2024-01-01T00:00:00.000Z"),
    programEnd: new Date("2026-12-31T23:59:59.000Z"),
    ownerEmail: "alice.chen@example.com",
    grantFunding: 500000,
    thirdParty: false,
  },
  {
    name: "High-Efficiency Toilet Voucher",
    description:
      "Voucher program for EPA WaterSense labeled toilets in residential properties.",
    defaultUnitWaterSavings: 12000,
    defaultUnitCost: 175,
    budget: 750000,
    defaultUnit: "toilet",
    singleFamilyHome: true,
    multiFamilyComplex: true,
    residential: true,
    commercial: false,
    programStart: new Date("2024-06-01T00:00:00.000Z"),
    programEnd: new Date("2025-12-31T23:59:59.000Z"),
    ownerEmail: "brian.walsh@example.com",
    grantFunding: 150000,
    thirdParty: true,
  },
  {
    name: "Commercial Irrigation Audit",
    description:
      "Subsidized irrigation assessments and controller upgrades for commercial sites.",
    defaultUnitWaterSavings: 85000,
    defaultUnitCost: 2500,
    budget: 1200000,
    defaultUnit: "site",
    singleFamilyHome: false,
    multiFamilyComplex: false,
    residential: false,
    commercial: true,
    programStart: new Date("2023-09-01T00:00:00.000Z"),
    programEnd: new Date("2025-09-30T23:59:59.000Z"),
    ownerEmail: "alice.chen@example.com",
    grantFunding: 300000,
    thirdParty: false,
  },
  {
    name: "Multi-Family Laundry Retrofit",
    description:
      "Incentives for high-efficiency commercial washers in multi-family laundry rooms.",
    defaultUnitWaterSavings: 45000,
    defaultUnitCost: 3200,
    budget: 980000.5,
    defaultUnit: "washer",
    singleFamilyHome: false,
    multiFamilyComplex: true,
    residential: true,
    commercial: false,
    programStart: new Date("2025-01-15T00:00:00.000Z"),
    programEnd: new Date("2027-01-15T23:59:59.000Z"),
    ownerEmail: "brian.walsh@example.com",
    grantFunding: 200000,
    thirdParty: true,
  },
  {
    name: "Smart Irrigation Controller Rebate",
    description:
      "Rebate for weather-based irrigation controllers in residential and small commercial accounts.",
    defaultUnitWaterSavings: 25000,
    defaultUnitCost: 225.5,
    budget: 450000,
    defaultUnit: "controller",
    singleFamilyHome: true,
    multiFamilyComplex: false,
    residential: true,
    commercial: true,
    programStart: new Date("2024-03-01T00:00:00.000Z"),
    programEnd: new Date("2026-03-01T23:59:59.000Z"),
    ownerEmail: "alice.chen@example.com",
    grantFunding: 75000,
    thirdParty: false,
  },
  {
    name: "Graywater System Pilot",
    description:
      "Pilot incentives for approved graywater reuse systems in new residential construction.",
    defaultUnitWaterSavings: 18000,
    defaultUnitCost: 1500,
    budget: 300000,
    defaultUnit: "system",
    singleFamilyHome: true,
    multiFamilyComplex: false,
    residential: true,
    commercial: false,
    programStart: new Date("2025-04-01T00:00:00.000Z"),
    programEnd: new Date("2026-04-01T23:59:59.000Z"),
    ownerEmail: "brian.walsh@example.com",
    grantFunding: 100000,
    thirdParty: false,
  },
  {
    name: "Restaurant Pre-Rinse Sprayer Exchange",
    description:
      "Free low-flow pre-rinse sprayers for qualifying food service establishments.",
    defaultUnitWaterSavings: 3200,
    defaultUnitCost: 85,
    budget: 125000,
    defaultUnit: "sprayer",
    singleFamilyHome: false,
    multiFamilyComplex: false,
    residential: false,
    commercial: true,
    programStart: new Date("2024-01-01T00:00:00.000Z"),
    programEnd: new Date("2025-06-30T23:59:59.000Z"),
    ownerEmail: "alice.chen@example.com",
    grantFunding: 25000,
    thirdParty: true,
  },
  {
    name: "Legacy Cash-for-Grass Program",
    description: "Discontinued turf removal program retained for historical reporting.",
    defaultUnitWaterSavings: 2000,
    defaultUnitCost: 3.5,
    budget: 500000,
    defaultUnit: "sq ft",
    singleFamilyHome: true,
    multiFamilyComplex: false,
    residential: true,
    commercial: false,
    programStart: new Date("2020-01-01T00:00:00.000Z"),
    programEnd: new Date("2023-12-31T23:59:59.000Z"),
    ownerEmail: "brian.walsh@example.com",
    grantFunding: 100000,
    thirdParty: false,
    deletedAt: new Date("2024-01-01T12:00:00.000Z"),
  },
];

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});

const prisma = new PrismaClient({ adapter });

async function syncRoleProfile(
  userId: string,
  role: Role,
  deletedAt: Date | null,
  customerProfile?: SeedCustomerProfile,
) {
  if (role === "admin") {
    await prisma.customerProfile.deleteMany({ where: { userId } });
    await prisma.adminProfile.upsert({
      where: { userId },
      create: { userId, deletedAt },
      update: { deletedAt },
    });
    return;
  }

  if (role === "customer") {
    const mailing =
      customerProfile ?? defaultCustomerMailing("Seed", "Customer", 0);

    await prisma.customerProfile.upsert({
      where: { userId },
      create: {
        userId,
        mailingAddress: mailing.mailingAddress,
        mailingCity: mailing.mailingCity,
        mailingState: mailing.mailingState,
        mailingZip: mailing.mailingZip,
        company: mailing.company ?? null,
        title: mailing.title ?? null,
        verifiedAt: mailing.verifiedAt ?? null,
        deletedAt,
      },
      update: {
        mailingAddress: mailing.mailingAddress,
        mailingCity: mailing.mailingCity,
        mailingState: mailing.mailingState,
        mailingZip: mailing.mailingZip,
        company: mailing.company ?? null,
        title: mailing.title ?? null,
        verifiedAt: mailing.verifiedAt ?? null,
        deletedAt,
      },
    });
  } else {
    await prisma.customerProfile.deleteMany({ where: { userId } });
  }

  const [ownedPrograms, ownedBudgetLogs] = await Promise.all([
    prisma.program.count({ where: { adminUserId: userId } }),
    prisma.programBudgetLog.count({ where: { adminUserId: userId } }),
  ]);

  if (ownedPrograms === 0 && ownedBudgetLogs === 0) {
    await prisma.adminProfile.deleteMany({ where: { userId } });
  }
}

async function upsertSeedUser(user: SeedUser, passwordHash: string) {
  const { email, deletedAt, role, customerProfile, ...profile } = user;
  const resolvedRole = role ?? "customer";
  const normalizedEmail = email.toLowerCase();

  const upserted = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: {
      ...profile,
      email: normalizedEmail,
      passwordHash,
      role: resolvedRole,
      deletedAt: deletedAt ?? null,
    },
    update: {
      ...profile,
      email: normalizedEmail,
      passwordHash,
      role: resolvedRole,
      deletedAt: deletedAt ?? null,
    },
  });

  await syncRoleProfile(
    upserted.id,
    resolvedRole,
    deletedAt ?? null,
    customerProfile,
  );

  return upserted;
}

async function main() {
  console.log("Seeding users and role profiles...");

  const passwordHash = await hashPassword(SEED_USER_PASSWORD);

  for (const user of seedUsers) {
    await upsertSeedUser(user, passwordHash);
  }

  const activeUsers = await prisma.user.count({ where: { deletedAt: null } });
  const deletedUsers = await prisma.user.count({
    where: { deletedAt: { not: null } },
  });
  const adminProfiles = await prisma.adminProfile.count();
  const customerProfiles = await prisma.customerProfile.count();

  console.log(
    `Users seeded: ${activeUsers} active, ${deletedUsers} soft-deleted.`,
  );
  console.log(
    `Profiles seeded: ${adminProfiles} admin, ${customerProfiles} customer.`,
  );

  console.log("Seeding programs...");

  for (const program of seedPrograms) {
    const {
      ownerEmail,
      deletedAt,
      defaultUnitWaterSavings,
      defaultUnitCost,
      budget,
      ...profile
    } = program;

    const owner = await prisma.user.findUnique({
      where: { email: ownerEmail.toLowerCase() },
      include: { adminProfile: true },
    });

    if (!owner?.adminProfile) {
      throw new Error(
        `Seed program owner must be an admin with a profile: ${ownerEmail}`,
      );
    }

    const data = {
      ...profile,
      defaultUnitWaterSavings,
      defaultUnitCost,
      budget,
      adminUserId: owner.adminProfile.userId,
      deletedAt: deletedAt ?? null,
    };

    const existing = await prisma.program.findFirst({
      where: { name: program.name },
    });

    if (existing) {
      await prisma.program.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.program.create({ data });
    }
  }

  const activePrograms = await prisma.program.count({
    where: { deletedAt: null },
  });
  const deletedPrograms = await prisma.program.count({
    where: { deletedAt: { not: null } },
  });

  console.log(
    `Programs seeded: ${activePrograms} active, ${deletedPrograms} soft-deleted.`,
  );

  const removedOrphanAdminProfiles = await prisma.adminProfile.deleteMany({
    where: {
      user: { role: { not: "admin" } },
      programs: { none: {} },
      programBudgetLog: { none: {} },
    },
  });

  if (removedOrphanAdminProfiles.count > 0) {
    console.log(
      `Removed ${removedOrphanAdminProfiles.count} orphan admin profile(s) from migrated non-admin owners.`,
    );
  }

  await seedProperties(prisma);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
