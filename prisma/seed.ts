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

  const active = await prisma.user.count({ where: { deletedAt: null } });
  const deleted = await prisma.user.count({
    where: { deletedAt: { not: null } },
  });

  console.log(`Seed complete: ${active} active, ${deleted} soft-deleted users.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
