import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  ListProgramsQuery,
  ListProgramBudgetLogQuery,
  BudgetLogMetaData,
  ListProgramStatusesQuery,
} from "./program.schema.js";
import {
  programSelectByView,
  publicProgramSelect,
  publicProgramBudgetLogSelect,
  publicProgramStatusSelect,
} from "./program.schema.js";

const activeProgramWhere = {
  deletedAt: null,
} satisfies Prisma.ProgramWhereInput;

export class ProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyActive({
    limit,
    cursor,
    column,
    direction,
    view,
  }: ListProgramsQuery) {
    return this.prisma.program.findMany({
      where: activeProgramWhere,
      select: programSelectByView[view],
      orderBy: [{ [column]: direction }, { id: direction }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  findActiveById(id: string) {
    return this.prisma.program.findFirst({
      where: { id, ...activeProgramWhere },
      select: publicProgramSelect,
    });
  }

  create(data: Prisma.ProgramCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data,
        select: publicProgramSelect,
      });

      await tx.programBudgetLog.create({
        data: {
          admin: { connect: { userId: created.adminUserId } },
          program: { connect: { id: created.id } },
          newBudget: created.budget,
        },
      });

      return created;
    });
  }

  update(id: string, data: Prisma.ProgramUpdateInput) {
    return this.prisma.program.update({
      where: { id },
      data,
      select: publicProgramSelect,
    });
  }

  updateWithBudgetLog(
    id: string,
    data: Prisma.ProgramUpdateInput,
    budgetLogData: BudgetLogMetaData,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.program.update({
        where: { id },
        data,
        select: publicProgramSelect,
      });

      await tx.programBudgetLog.create({
        data: {
          admin: { connect: { userId: budgetLogData.adminUserId } },
          program: { connect: { id: updated.id } },
          newBudget: budgetLogData.newBudget,
          previousBudget: budgetLogData.previousBudget,
        },
      });
      return updated;
    });
  }

  softDelete(id: string) {
    return this.prisma.program.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findBudgetLogsManyActive(
    id: string,
    { limit, cursor, column, direction }: ListProgramBudgetLogQuery,
  ) {
    const whereClause = {
      programId: id,
      deletedAt: null,
    } satisfies Prisma.ProgramBudgetLogWhereInput;
    return this.prisma.programBudgetLog.findMany({
      select: publicProgramBudgetLogSelect,
      where: whereClause,
      take: limit + 1,
      orderBy: [{ [column]: direction }, { id: direction }],
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  findActiveBudgetLogById(id: string, budgetLogId: string) {
    return this.prisma.programBudgetLog.findFirst({
      select: publicProgramBudgetLogSelect,
      where: { id: budgetLogId, programId: id, deletedAt: null },
    });
  }

  createBudgetLog(data: Prisma.ProgramBudgetLogCreateInput) {
    return this.prisma.programBudgetLog.create({
      data,
      select: publicProgramBudgetLogSelect,
    });
  }

  updateBudgetLog(
    programId: string,
    budgetLogId: string,
    data: Prisma.ProgramBudgetLogUpdateInput,
  ) {
    return this.prisma.programBudgetLog.update({
      where: {
        id: budgetLogId,
        programId,
        deletedAt: null,
        program: { deletedAt: null },
      },
      data,
      select: publicProgramBudgetLogSelect,
    });
  }

  //program status
  createStatus(data: Prisma.ProgramStatusCreateInput) {
    return this.prisma.programStatus.create({
      data,
      select: publicProgramStatusSelect,
    });
  }

  findProgramStatusesManyActive(
    programId: string,
    filters: ListProgramStatusesQuery,
  ) {
    const where = {
      programId,
      deletedAt: null,
      program: { deletedAt: null },
      ...(filters.milestone !== undefined && { milestone: filters.milestone }),
    };
    return this.prisma.programStatus.findMany({
      where,
      select: publicProgramStatusSelect,
      orderBy: { sortOrder: "asc" },
    });
  }

  findActiveStatusById(programId: string, statusId: string) {
    return this.prisma.programStatus.findFirst({
      select: publicProgramStatusSelect,
      where: {
        id: statusId,
        programId,
        deletedAt: null,
        program: { deletedAt: null },
      },
    });
  }

  findStatusBySortOrder(programId: string, sortOrder: number) {
    return this.prisma.programStatus.findUnique({
      where: {
        programId_sortOrder: {
          programId,
          sortOrder,
        },
      },
    });
  }

  updateStatus(statusId: string, data: Prisma.ProgramStatusUpdateInput) {
    return this.prisma.programStatus.update({
      where: { id: statusId, deletedAt: null, program: { deletedAt: null } },
      data,
      select: publicProgramStatusSelect,
    });
  }

  softDeleteStatus(statusId: string) {
    return this.prisma.programStatus.update({
      where: { id: statusId, deletedAt: null, program: { deletedAt: null } },
      data: { deletedAt: new Date() },
      select: publicProgramStatusSelect,
    });
  }
}
