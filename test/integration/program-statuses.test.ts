import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "../../src/lib/errors.js";
import { ProgramRepository } from "../../src/modules/programs/program.repository.js";
import { ProgramService } from "../../src/modules/programs/program.service.js";
import { UserRepository } from "../../src/modules/users/user.repository.js";
import { UserService } from "../../src/modules/users/user.service.js";
import { expectHttpError } from "../helpers/http-error.js";
import { buildProgramStatusInput } from "../helpers/program-status.js";
import {
  createTestAdmin,
  createTestProgram,
  deleteTestAdmin,
  deleteTestProgram,
} from "../helpers/program.js";
import { createTestPrisma } from "../helpers/prisma.js";

describe("ProgramService program statuses (integration)", () => {
  const prisma = createTestPrisma();
  const programService = new ProgramService(
    new ProgramRepository(prisma),
    new UserService(new UserRepository(prisma)),
  );

  let adminUserId: string;
  let programId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const admin = await createTestAdmin(prisma, "program-status");
    adminUserId = admin.id;

    const program = await createTestProgram(prisma, adminUserId, "statuses");
    programId = program.id;
  });

  beforeEach(async () => {
    await prisma.programStatus.deleteMany({ where: { programId } });
  });

  afterAll(async () => {
    await deleteTestProgram(prisma, programId);
    await deleteTestAdmin(prisma, adminUserId);
    await prisma.$disconnect();
  });

  it("creates a status for an existing program", async () => {
    const status = await programService.createStatus(
      programId,
      buildProgramStatusInput(),
    );

    expect(status).toMatchObject({
      id: status.id,
      programId,
      sortOrder: 1,
      adminStepNumber: "1",
      customerStepNumber: "1",
      name: "Application Submitted",
      customerName: "Submitted",
      description: "Customer has submitted an application for review.",
      milestone: true,
      daysBeforeAlert: null,
      deletedAt: null,
    });
  });

  it("lists statuses ordered by sortOrder ascending", async () => {
    await programService.createStatus(
      programId,
      buildProgramStatusInput({
        sortOrder: 2,
        adminStepNumber: "2",
        customerStepNumber: "1",
        name: "Intake Review",
        customerName: "Under Review",
        milestone: false,
      }),
    );
    await programService.createStatus(
      programId,
      buildProgramStatusInput({
        sortOrder: 1,
        adminStepNumber: "1",
        customerStepNumber: "1",
        name: "Application Submitted",
        customerName: "Submitted",
        milestone: true,
      }),
    );

    const data = await programService.listStatuses(programId, {});

    expect(data.map((status) => status.sortOrder)).toEqual([1, 2]);
    expect(data.map((status) => status.name)).toEqual([
      "Application Submitted",
      "Intake Review",
    ]);
  });

  it("filters statuses when milestone is true", async () => {
    await programService.createStatus(
      programId,
      buildProgramStatusInput({
        sortOrder: 1,
        name: "Application Submitted",
        milestone: true,
      }),
    );

    await programService.createStatus(
      programId,
      buildProgramStatusInput({
        sortOrder: 2,
        name: "Intake Review",
        milestone: false,
      }),
    );

    const results = await programService.listStatuses(programId, {
      milestone: true,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Application Submitted",
      milestone: true,
    });
  });

  it("gets a status by id", async () => {
    const created = await programService.createStatus(
      programId,
      buildProgramStatusInput(),
    );

    const status = await programService.getStatusById({
      id: programId,
      statusId: created.id,
    });

    expect(status).toMatchObject({
      id: created.id,
      programId,
      name: "Application Submitted",
    });
  });

  it("updates status fields", async () => {
    const created = await programService.createStatus(
      programId,
      buildProgramStatusInput(),
    );

    const updated = await programService.updateStatus(programId, created.id, {
      name: "Pre-Approved",
      customerName: "Pre-Approved",
      milestone: true,
      daysBeforeAlert: 14,
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Pre-Approved",
      customerName: "Pre-Approved",
      milestone: true,
      daysBeforeAlert: 14,
    });
  });

  it("soft-deletes a status and hides it from the default list", async () => {
    const created = await programService.createStatus(
      programId,
      buildProgramStatusInput(),
    );

    await programService.softDeleteStatus(programId, created.id);

    await expect(
      programService.getStatusById({
        id: programId,
        statusId: created.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const activeList = await programService.listStatuses(programId, {});
    expect(activeList).toHaveLength(0);
  });

  it("rejects create when the parent program does not exist", async () => {
    await expect(
      programService.createStatus(
        "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        buildProgramStatusInput(),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects duplicate sortOrder for the same program", async () => {
    await programService.createStatus(programId, buildProgramStatusInput());

    await expectHttpError(
      programService.createStatus(
        programId,
        buildProgramStatusInput({
          name: "Duplicate Step",
          customerName: "Duplicate",
        }),
      ),
      409,
      "Sort order already exists for this program",
    );
  });

  it("rejects getStatusById when the status belongs to another program", async () => {
    const otherProgram = await createTestProgram(
      prisma,
      adminUserId,
      "other-status-program",
    );

    try {
      const created = await programService.createStatus(
        otherProgram.id,
        buildProgramStatusInput(),
      );

      await expect(
        programService.getStatusById({
          id: programId,
          statusId: created.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    } finally {
      await deleteTestProgram(prisma, otherProgram.id);
    }
  });

  it("rejects listStatuses when the parent program does not exist", async () => {
    await expect(
      programService.listStatuses("clxxxxxxxxxxxxxxxxxxxxxxxxx", {}),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects create when the parent program is soft-deleted", async () => {
    const deletedProgram = await createTestProgram(
      prisma,
      adminUserId,
      "deleted-statuses",
    );

    try {
      await prisma.program.update({
        where: { id: deletedProgram.id },
        data: { deletedAt: new Date() },
      });

      await expect(
        programService.createStatus(
          deletedProgram.id,
          buildProgramStatusInput(),
        ),
      ).rejects.toBeInstanceOf(NotFoundError);
    } finally {
      await deleteTestProgram(prisma, deletedProgram.id);
    }
  });
});
