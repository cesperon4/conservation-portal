import type { PrismaClient } from "../src/generated/prisma/client.js";

type SeedProgramStatusStep = {
  sortOrder: number;
  adminStepNumber: string;
  customerStepNumber: string;
  name: string;
  customerName?: string;
  description?: string;
  milestone?: boolean;
  daysBeforeAlert?: number | null;
  deletedAt?: Date;
};

const defaultRebateWorkflow: SeedProgramStatusStep[] = [
  {
    sortOrder: 1,
    adminStepNumber: "1",
    customerStepNumber: "1",
    name: "Application Submitted",
    customerName: "Submitted",
    description: "Customer has submitted an application for review.",
    milestone: true,
  },
  {
    sortOrder: 2,
    adminStepNumber: "2",
    customerStepNumber: "1",
    name: "Intake Review",
    customerName: "Under Review",
    description: "Staff is verifying eligibility and required documentation.",
    daysBeforeAlert: 7,
  },
  {
    sortOrder: 3,
    adminStepNumber: "3",
    customerStepNumber: "2",
    name: "Pre-Approved",
    customerName: "Pre-Approved",
    description: "Application meets program requirements pending final verification.",
    milestone: true,
    daysBeforeAlert: 14,
  },
  {
    sortOrder: 4,
    adminStepNumber: "4",
    customerStepNumber: "2",
    name: "Verification",
    customerName: "Verification",
    description: "Site visit, photos, or invoices are being reviewed.",
    daysBeforeAlert: 21,
  },
  {
    sortOrder: 5,
    adminStepNumber: "5",
    customerStepNumber: "3",
    name: "Rebate Issued",
    customerName: "Rebate Issued",
    description: "Incentive has been approved and payment is processing.",
    milestone: true,
    daysBeforeAlert: 30,
  },
  {
    sortOrder: 6,
    adminStepNumber: "6",
    customerStepNumber: "4",
    name: "Closed",
    customerName: "Complete",
    description: "Application is complete and archived.",
    milestone: true,
  },
];

const commercialAuditWorkflow: SeedProgramStatusStep[] = [
  {
    sortOrder: 1,
    adminStepNumber: "1",
    customerStepNumber: "1",
    name: "Assessment Requested",
    customerName: "Requested",
    description: "Commercial site has requested an irrigation audit.",
    milestone: true,
  },
  {
    sortOrder: 2,
    adminStepNumber: "2",
    customerStepNumber: "1",
    name: "Audit Scheduled",
    customerName: "Scheduled",
    description: "Audit appointment has been scheduled with the property contact.",
    milestone: true,
    daysBeforeAlert: 5,
  },
  {
    sortOrder: 3,
    adminStepNumber: "3",
    customerStepNumber: "2",
    name: "Report Delivered",
    customerName: "Report Ready",
    description: "Audit findings and recommendations have been delivered.",
    milestone: true,
    daysBeforeAlert: 10,
  },
  {
    sortOrder: 4,
    adminStepNumber: "4",
    customerStepNumber: "2",
    name: "Upgrade Verified",
    customerName: "Upgrade Verified",
    description: "Controller or hardware upgrades have been verified on site.",
    daysBeforeAlert: 21,
  },
  {
    sortOrder: 5,
    adminStepNumber: "5",
    customerStepNumber: "3",
    name: "Incentive Paid",
    customerName: "Incentive Paid",
    description: "Program incentive has been issued to the account holder.",
    milestone: true,
  },
];

const pilotWorkflow: SeedProgramStatusStep[] = [
  ...defaultRebateWorkflow.slice(0, 3),
  {
    sortOrder: 4,
    adminStepNumber: "4",
    customerStepNumber: "2",
    name: "Pilot Inspection",
    customerName: "Inspection",
    description: "Pilot program requires an additional technical inspection.",
    milestone: true,
    daysBeforeAlert: 14,
  },
  ...defaultRebateWorkflow.slice(3).map((step) => ({
    ...step,
    sortOrder: step.sortOrder + 1,
    adminStepNumber: String(Number(step.adminStepNumber) + 1),
  })),
];

const legacyWorkflow: SeedProgramStatusStep[] = [
  {
    sortOrder: 1,
    adminStepNumber: "1",
    customerStepNumber: "1",
    name: "Application Received",
    customerName: "Submitted",
    milestone: true,
  },
  {
    sortOrder: 2,
    adminStepNumber: "2",
    customerStepNumber: "2",
    name: "Rebate Paid",
    customerName: "Paid",
    milestone: true,
  },
  {
    sortOrder: 3,
    adminStepNumber: "3",
    customerStepNumber: "3",
    name: "Legacy Review Hold",
    customerName: "On Hold",
    description: "Retained for historical reporting only.",
    deletedAt: new Date("2024-01-01T12:00:00.000Z"),
  },
];

const programStatusWorkflows: Record<string, SeedProgramStatusStep[]> = {
  "Residential Turf Replacement Rebate": defaultRebateWorkflow,
  "High-Efficiency Toilet Voucher": defaultRebateWorkflow,
  "Commercial Irrigation Audit": commercialAuditWorkflow,
  "Multi-Family Laundry Retrofit": defaultRebateWorkflow,
  "Smart Irrigation Controller Rebate": defaultRebateWorkflow,
  "Graywater System Pilot": pilotWorkflow,
  "Restaurant Pre-Rinse Sprayer Exchange": commercialAuditWorkflow,
  "Legacy Cash-for-Grass Program": legacyWorkflow,
};

export async function seedProgramStatuses(prisma: PrismaClient): Promise<void> {
  console.log("Seeding program statuses...");

  const programNames = Object.keys(programStatusWorkflows);
  const programs = await prisma.program.findMany({
    where: { name: { in: programNames } },
    select: { id: true, name: true },
  });

  if (programs.length === 0) {
    console.warn("No seeded programs found — skipping program status seed.");
    return;
  }

  const programsByName = new Map(programs.map((program) => [program.name, program.id]));
  let totalStatuses = 0;

  for (const [programName, steps] of Object.entries(programStatusWorkflows)) {
    const programId = programsByName.get(programName);
    if (!programId) {
      console.warn(`Program not found for status seed: ${programName}`);
      continue;
    }

    await prisma.programStatus.deleteMany({ where: { programId } });

    await prisma.programStatus.createMany({
      data: steps.map((step) => ({
        programId,
        sortOrder: step.sortOrder,
        adminStepNumber: step.adminStepNumber,
        customerStepNumber: step.customerStepNumber,
        name: step.name,
        customerName: step.customerName ?? null,
        description: step.description ?? null,
        milestone: step.milestone ?? false,
        daysBeforeAlert: step.daysBeforeAlert ?? null,
        deletedAt: step.deletedAt ?? null,
      })),
    });

    totalStatuses += steps.length;
  }

  const activeStatuses = await prisma.programStatus.count({
    where: { deletedAt: null },
  });
  const deletedStatuses = await prisma.programStatus.count({
    where: { deletedAt: { not: null } },
  });

  console.log(
    `Program statuses seeded: ${totalStatuses} total (${activeStatuses} active, ${deletedStatuses} soft-deleted).`,
  );
}
