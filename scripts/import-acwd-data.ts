import "dotenv/config";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client.js";
import {
  padAccountNo,
  parseAcwdDate,
  parseOptionalInt,
  parseRequiredAcwdDate,
  trim,
  trimOrNull,
} from "./acwd-import/normalize.js";

const BATCH_SIZE = 5_000;
const DEV_ROW_LIMIT = 5_000;
const DEV_TEST_ACCOUNTS = new Set(["40601154", "40453212"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

type ImportFlags = {
  dataDir: string;
  dev: boolean;
  dryRun: boolean;
};

function parseFlags(): ImportFlags {
  const args = process.argv.slice(2);
  let dataDir =
    process.env["ACWD_DATA_DIR"] ?? path.join(projectRoot, "data", "acwd");
  let dev = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dev") dev = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--dir" && args[i + 1]) {
      dataDir = args[++i]!;
    }
  }

  return { dataDir: path.resolve(dataDir), dev, dryRun };
}

function splitCsvLine(line: string): string[] {
  return line.split(",");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readLines(filePath: string): Promise<string[]> {
  const lines: string[] = [];
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.trim() !== "") lines.push(line);
  }

  return lines;
}

async function streamLines(
  filePath: string,
  onLine: (line: string, index: number) => void | Promise<void>,
  options?: { skipFirst?: boolean },
): Promise<number> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let index = 0;

  for await (const line of rl) {
    if (line.trim() === "") continue;
    if (options?.skipFirst && index === 0) {
      index++;
      continue;
    }
    await onLine(line, index);
    index++;
  }

  return index;
}

function createPrisma() {
  const adapter = new PrismaPg({
    connectionString: process.env["DATABASE_URL"],
  });
  return new PrismaClient({ adapter });
}

async function flushAccounts(
  prisma: PrismaClient,
  batch: Prisma.AcwdAccountCreateManyInput[],
) {
  if (batch.length === 0) return;
  await prisma.acwdAccount.createMany({ data: batch, skipDuplicates: true });
  batch.length = 0;
}

async function flushLocations(
  prisma: PrismaClient,
  batch: Prisma.AcwdLocationCreateManyInput[],
) {
  if (batch.length === 0) return;
  await prisma.acwdLocation.createMany({ data: batch, skipDuplicates: true });
  batch.length = 0;
}

async function flushMoveInOuts(
  prisma: PrismaClient,
  batch: Prisma.AcwdMoveInOutCreateManyInput[],
) {
  if (batch.length === 0) return;
  await prisma.acwdMoveInOut.createMany({ data: batch, skipDuplicates: true });
  batch.length = 0;
}

function mapAccountRow(
  cols: string[],
  importedAt: Date,
): Prisma.AcwdAccountCreateManyInput {
  return {
    accountNo: padAccountNo(cols[0] ?? ""),
    accountStat: trimOrNull(cols[1]),
    accountClass: trimOrNull(cols[2]),
    personNo: trim(cols[3] ?? ""),
    addrSeqDefault: parseOptionalInt(cols[4]),
    importedAt,
  };
}

function mapLocationRow(
  cols: string[],
  importedAt: Date,
): Prisma.AcwdLocationCreateManyInput {
  return {
    locationNo: trim(cols[0] ?? ""),
    locationStat: trim(cols[1] ?? ""),
    locationClass: trim(cols[2] ?? ""),
    houseNo: trimOrNull(cols[3]),
    streetPfxDir: trimOrNull(cols[4]),
    streetName: trimOrNull(cols[5]),
    streetNmSfx: trimOrNull(cols[6]),
    streetSfxDir: trimOrNull(cols[7]),
    secAddrId: trimOrNull(cols[8]),
    secAddrRange: trimOrNull(cols[9]),
    city: trim(cols[10] ?? ""),
    provinceCd: trim(cols[11] ?? ""),
    postalCode: trim(cols[12] ?? ""),
    importedAt,
  };
}

function mapMoveInOutRow(
  cols: string[],
  importedAt: Date,
): Prisma.AcwdMoveInOutCreateManyInput {
  return {
    id: trim(cols[0] ?? ""),
    locationNo: trim(cols[1] ?? ""),
    accountNo: padAccountNo(cols[2] ?? ""),
    moveInDate: parseRequiredAcwdDate(cols[3], "moveInDate"),
    moveOutDate: parseAcwdDate(cols[4]),
    status: trim(cols[5] ?? ""),
    statusDate: parseAcwdDate(cols[6]),
    importedAt,
  };
}

async function importAccounts(
  prisma: PrismaClient,
  filePath: string,
  importedAt: Date,
  dev: boolean,
) {
  const batch: Prisma.AcwdAccountCreateManyInput[] = [];
  let count = 0;
  let stopped = false;

  await streamLines(
    filePath,
    async (line) => {
      if (stopped) return;
      if (dev && count >= DEV_ROW_LIMIT) {
        stopped = true;
        return;
      }
      const cols = splitCsvLine(line);
      batch.push(mapAccountRow(cols, importedAt));
      count++;
      if (batch.length >= BATCH_SIZE) await flushAccounts(prisma, batch);
    },
    { skipFirst: true },
  );

  await flushAccounts(prisma, batch);
  return count;
}

async function importLocations(
  prisma: PrismaClient,
  filePath: string,
  importedAt: Date,
  dev: boolean,
) {
  const batch: Prisma.AcwdLocationCreateManyInput[] = [];
  let count = 0;
  let stopped = false;

  await streamLines(
    filePath,
    async (line) => {
      if (stopped) return;
      if (dev && count >= DEV_ROW_LIMIT) {
        stopped = true;
        return;
      }
      const cols = splitCsvLine(line);
      batch.push(mapLocationRow(cols, importedAt));
      count++;
      if (batch.length >= BATCH_SIZE) await flushLocations(prisma, batch);
    },
    { skipFirst: true },
  );

  await flushLocations(prisma, batch);
  return count;
}

async function importMoveInOuts(
  prisma: PrismaClient,
  filePath: string,
  importedAt: Date,
  dev: boolean,
) {
  if (!dev) {
    const batch: Prisma.AcwdMoveInOutCreateManyInput[] = [];
    let count = 0;

    await streamLines(filePath, async (line) => {
      const cols = splitCsvLine(line);
      batch.push(mapMoveInOutRow(cols, importedAt));
      count++;
      if (batch.length >= BATCH_SIZE) await flushMoveInOuts(prisma, batch);
    });

    await flushMoveInOuts(prisma, batch);
    return count;
  }

  const lines = await readLines(filePath);
  const batch: Prisma.AcwdMoveInOutCreateManyInput[] = [];
  let count = 0;
  let generalCount = 0;

  for (const line of lines) {
    const cols = splitCsvLine(line);
    const accountNo = padAccountNo(cols[2] ?? "");
    const isTestAccount = DEV_TEST_ACCOUNTS.has(accountNo);

    if (!isTestAccount) {
      if (generalCount >= DEV_ROW_LIMIT) continue;
      generalCount++;
    }

    batch.push(mapMoveInOutRow(cols, importedAt));
    count++;
    if (batch.length >= BATCH_SIZE) await flushMoveInOuts(prisma, batch);
  }

  await flushMoveInOuts(prisma, batch);
  return count;
}

async function main() {
  const flags = parseFlags();
  const accountFile = path.join(flags.dataDir, "account.csv");
  const locationFile = path.join(flags.dataDir, "location.csv");
  const moveInOutFile = path.join(flags.dataDir, "moveinout.csv");

  for (const file of [accountFile, locationFile, moveInOutFile]) {
    if (!(await fileExists(file))) {
      throw new Error(`Missing CSV file: ${file}`);
    }
  }

  console.log(`ACWD import from: ${flags.dataDir}`);
  console.log(
    `Mode: ${flags.dev ? "dev subset" : "full"}${flags.dryRun ? " (dry run)" : ""}`,
  );

  if (flags.dryRun) {
    const [accounts, locations, moveInOuts] = await Promise.all([
      readLines(accountFile),
      readLines(locationFile),
      readLines(moveInOutFile),
    ]);
    console.log("Would import:");
    console.log(`  accounts:    ${Math.max(accounts.length - 1, 0)}`);
    console.log(`  locations:   ${Math.max(locations.length - 1, 0)}`);
    console.log(`  moveinouts:  ${moveInOuts.length}`);
    return;
  }

  const prisma = createPrisma();
  const importedAt = new Date();
  const started = Date.now();

  const importRun = await prisma.acwdImportRun.create({
    data: {
      status: "running",
      sourceDir: flags.dataDir,
    },
  });

  try {
    console.log("Clearing existing ACWD reference data…");
    await prisma.acwdMoveInOut.deleteMany();
    await prisma.acwdAccount.deleteMany();
    await prisma.acwdLocation.deleteMany();

    console.log("Importing accounts…");
    const accountsCount = await importAccounts(
      prisma,
      accountFile,
      importedAt,
      flags.dev,
    );

    console.log("Importing locations…");
    const locationsCount = await importLocations(
      prisma,
      locationFile,
      importedAt,
      flags.dev,
    );

    console.log("Importing move-in/out rows…");
    const moveinoutsCount = await importMoveInOuts(
      prisma,
      moveInOutFile,
      importedAt,
      flags.dev,
    );

    await prisma.acwdImportRun.update({
      where: { id: importRun.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        accountsCount,
        locationsCount,
        moveinoutsCount,
      },
    });

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log("\nImport complete");
    console.log(`  accounts:    ${accountsCount.toLocaleString()}`);
    console.log(`  locations:   ${locationsCount.toLocaleString()}`);
    console.log(`  moveinouts:  ${moveinoutsCount.toLocaleString()}`);
    console.log(`  duration:    ${seconds}s`);
  } catch (error) {
    await prisma.acwdImportRun.update({
      where: { id: importRun.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("ACWD import failed:", error);
  process.exit(1);
});
