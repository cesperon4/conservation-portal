import type { PrismaClient } from "../../src/generated/prisma/client.js";

const importedAt = new Date("2024-01-01T00:00:00.000Z");

/** Reserved test-only IDs unlikely to exist in imported ACWD data. */
export const FIXTURE_ACCOUNTS = {
  active: "99999991",
  padded: "09999995",
  closed: "99999992",
  notBillable: "99999993",
  hyd: "99999994",
  inactiveLocation: "99999996",
} as const;

const FIXTURE_LOCATION_NOS = [
  "9999999901",
  "9999999902",
  "9999999904",
  "9999999905",
  "9999999906",
] as const;

const FIXTURE_MOVEINOUT_IDS = [
  "9999999901",
  "9999999902",
  "9999999903",
  "9999999904",
  "9999999905",
  "9999999906",
] as const;

const FIXTURE_ACCOUNT_NOS = Object.values(FIXTURE_ACCOUNTS);

/** Previous fixture IDs — remove on cleanup so reruns don't leave stale rows. */
const LEGACY_ACCOUNT_NOS = [
  "99000001",
  "99000002",
  "99000003",
  "99000004",
  "00123456",
  "09900001",
] as const;

const LEGACY_LOCATION_NOS = [
  "9900000001",
  "9900000002",
  "9900000004",
  "9900000005",
] as const;

const LEGACY_MOVEINOUT_IDS = [
  "9900000001",
  "9900000002",
  "9900000003",
  "9900000004",
  "9900000005",
] as const;

export async function seedAcwdFixtures(prisma: PrismaClient) {
  await cleanupAcwdFixtures(prisma);

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.active,
      accountStat: "BILBL",
      accountClass: "RES",
      personNo: "9999999901",
      importedAt,
    },
  });
  await prisma.acwdLocation.create({
    data: {
      locationNo: "9999999901",
      locationStat: "ACT",
      locationClass: "RES",
      houseNo: "123",
      streetName: "MAIN ST",
      city: "FREMONT",
      provinceCd: "CA",
      postalCode: "94536-1234",
      importedAt,
    },
  });
  await prisma.acwdMoveInOut.create({
    data: {
      id: "9999999901",
      accountNo: FIXTURE_ACCOUNTS.active,
      locationNo: "9999999901",
      moveInDate: new Date("2020-01-01"),
      moveOutDate: null,
      status: "CUTON",
      statusDate: new Date("2020-01-01"),
      importedAt,
    },
  });

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.padded,
      accountStat: "BILBL",
      accountClass: "RES",
      personNo: "9999999905",
      importedAt,
    },
  });
  await prisma.acwdLocation.create({
    data: {
      locationNo: "9999999905",
      locationStat: "ACT",
      locationClass: "RES",
      houseNo: "100",
      streetName: "PINE ST",
      city: "FREMONT",
      provinceCd: "CA",
      postalCode: "94536",
      importedAt,
    },
  });
  await prisma.acwdMoveInOut.create({
    data: {
      id: "9999999905",
      accountNo: FIXTURE_ACCOUNTS.padded,
      locationNo: "9999999905",
      moveInDate: new Date("2020-01-01"),
      moveOutDate: null,
      status: "CUTON",
      statusDate: new Date("2020-01-01"),
      importedAt,
    },
  });

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.closed,
      accountStat: "BILBL",
      accountClass: "RES",
      personNo: "9999999902",
      importedAt,
    },
  });
  await prisma.acwdLocation.create({
    data: {
      locationNo: "9999999902",
      locationStat: "ACT",
      locationClass: "RES",
      houseNo: "456",
      streetName: "OAK AVE",
      city: "FREMONT",
      provinceCd: "CA",
      postalCode: "94536",
      importedAt,
    },
  });
  await prisma.acwdMoveInOut.createMany({
    data: [
      {
        id: "9999999902",
        accountNo: FIXTURE_ACCOUNTS.closed,
        locationNo: "9999999902",
        moveInDate: new Date("2018-01-01"),
        moveOutDate: null,
        status: "CUTON",
        statusDate: new Date("2018-01-01"),
        importedAt,
      },
      {
        id: "9999999903",
        accountNo: FIXTURE_ACCOUNTS.closed,
        locationNo: "9999999902",
        moveInDate: new Date("2018-01-01"),
        moveOutDate: new Date("2023-06-01"),
        status: "FINAL",
        statusDate: new Date("2023-06-01"),
        importedAt,
      },
    ],
  });

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.notBillable,
      accountStat: "CLOSD",
      accountClass: "RES",
      personNo: "9999999903",
      importedAt,
    },
  });

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.hyd,
      accountStat: "BILBL",
      accountClass: "HYD",
      personNo: "9999999904",
      importedAt,
    },
  });
  await prisma.acwdLocation.create({
    data: {
      locationNo: "9999999904",
      locationStat: "ACT",
      locationClass: "HYD",
      houseNo: "789",
      streetName: "WATER WAY",
      city: "FREMONT",
      provinceCd: "CA",
      postalCode: "94536",
      importedAt,
    },
  });
  await prisma.acwdMoveInOut.create({
    data: {
      id: "9999999904",
      accountNo: FIXTURE_ACCOUNTS.hyd,
      locationNo: "9999999904",
      moveInDate: new Date("2020-01-01"),
      moveOutDate: null,
      status: "CUTON",
      statusDate: new Date("2020-01-01"),
      importedAt,
    },
  });

  await prisma.acwdAccount.create({
    data: {
      accountNo: FIXTURE_ACCOUNTS.inactiveLocation,
      accountStat: "BILBL",
      accountClass: "RES",
      personNo: "9999999906",
      importedAt,
    },
  });
  await prisma.acwdLocation.create({
    data: {
      locationNo: "9999999906",
      locationStat: "INACT",
      locationClass: "RES",
      houseNo: "321",
      streetName: "INACTIVE LN",
      city: "FREMONT",
      provinceCd: "CA",
      postalCode: "94536",
      importedAt,
    },
  });
  await prisma.acwdMoveInOut.create({
    data: {
      id: "9999999906",
      accountNo: FIXTURE_ACCOUNTS.inactiveLocation,
      locationNo: "9999999906",
      moveInDate: new Date("2020-01-01"),
      moveOutDate: null,
      status: "CUTON",
      statusDate: new Date("2020-01-01"),
      importedAt,
    },
  });
}

export async function cleanupAcwdFixtures(prisma: PrismaClient) {
  const accountNos = [...FIXTURE_ACCOUNT_NOS, ...LEGACY_ACCOUNT_NOS];
  const locationNos = [...FIXTURE_LOCATION_NOS, ...LEGACY_LOCATION_NOS];
  const moveInOutIds = [...FIXTURE_MOVEINOUT_IDS, ...LEGACY_MOVEINOUT_IDS];

  await prisma.acwdMoveInOut.deleteMany({
    where: {
      OR: [
        { id: { in: moveInOutIds } },
        { accountNo: { in: accountNos } },
      ],
    },
  });
  await prisma.acwdAccount.deleteMany({
    where: { accountNo: { in: accountNos } },
  });
  await prisma.acwdLocation.deleteMany({
    where: { locationNo: { in: locationNos } },
  });
}
