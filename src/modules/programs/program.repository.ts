import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  ListProgramsQuery,
  ListProgramBudgetLogQuery,
  BudgetLogMetaData,
} from "./program.schema.js";
import {
  programSelectByView,
  publicProgramSelect,
  publicProgramBudgetLogSelect,
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
}
