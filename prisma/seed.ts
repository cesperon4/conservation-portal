import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Role } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";

/** Default password for all seeded users (development only). */
export const SEED_USER_PASSWORD = "Password123!";

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  role?: Role;
  phone?: string;
  deletedAt?: Date;
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
  },
  {
    firstName: "Mei",
    lastName: "Tanaka",
    email: "mei.tanaka@example.com",
    role: "customer",
    phone: "5105550110",
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

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${sequence}@example.com`,
    role: bulkRoles[index % bulkRoles.length],
    phone: index % 3 === 0 ? undefined : `5105551${String(200 + index).slice(-3)}`,
  };
});

const seedUsers: SeedUser[] = [...namedUsers, ...bulkUsers];

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
    ownerEmail: "marcus.rivera@example.com",
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
    ownerEmail: "elena.vasquez@example.com",
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
    ownerEmail: "marcus.rivera@example.com",
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
    ownerEmail: "elena.vasquez@example.com",
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
    ownerEmail: "alice.chen@example.com",
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
    ownerEmail: "priya.patel@example.com",
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
    ownerEmail: "marcus.rivera@example.com",
    grantFunding: 100000,
    thirdParty: false,
    deletedAt: new Date("2024-01-01T12:00:00.000Z"),
  },
];

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"],
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding users...");

  const passwordHash = await hashPassword(SEED_USER_PASSWORD);

  for (const user of seedUsers) {
    const { email, deletedAt, role, ...profile } = user;

    await prisma.user.upsert({
      where: { email },
      create: {
        ...profile,
        email: email.toLowerCase(),
        passwordHash,
        role: role ?? "customer",
        deletedAt: deletedAt ?? null,
      },
      update: {
        ...profile,
        email: email.toLowerCase(),
        passwordHash,
        role: role ?? "customer",
        deletedAt: deletedAt ?? null,
      },
    });
  }

  const activeUsers = await prisma.user.count({ where: { deletedAt: null } });
  const deletedUsers = await prisma.user.count({
    where: { deletedAt: { not: null } },
  });

  console.log(
    `Users seeded: ${activeUsers} active, ${deletedUsers} soft-deleted.`,
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
    });

    if (!owner) {
      throw new Error(`Seed program owner not found: ${ownerEmail}`);
    }

    const data = {
      ...profile,
      defaultUnitWaterSavings,
      defaultUnitCost,
      budget,
      userId: owner.id,
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
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
