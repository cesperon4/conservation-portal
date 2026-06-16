import { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError } from "../../lib/errors.js";
import type {
  CreateProgramBody,
  ListProgramsQuery,
  ProgramNameRow,
  ProgramPublicRow,
  UpdateProgramBody,
  ListProgramBudgetLogQuery,
  ProgramBudgetLogParams,
  CreateProgramBudgetLogBody,
  UpdateProgramBudgetLogBody,
} from "./program.schema.js";
import { ProgramRepository } from "./program.repository.js";
import { UserService } from "../users/user.service.js";

export class ProgramService {
  constructor(
    private readonly programs: ProgramRepository,
    private readonly users: UserService,
  ) {}
  async list(filters: ListProgramsQuery) {
    const rows = await this.programs.findManyActive(filters);

    const hasMore = rows.length > filters.limit;
    const programs = hasMore ? rows.slice(0, -1) : rows;
    const lastProgram = programs.at(-1);
    const pagination = {
      limit: filters.limit,
      nextCursor: hasMore && lastProgram ? lastProgram.id : null,
      hasMore,
    };

    if (filters.view === "name") {
      return {
        view: "name" as const,
        programs: programs as ProgramNameRow[],
        pagination,
      };
    }

    return {
      view: "full" as const,
      programs: programs as ProgramPublicRow[],
      pagination,
    };
  }

  async getById(id: string) {
    const program = await this.programs.findActiveById(id);
    if (!program) {
      throw new NotFoundError("Program not found");
    }
    return program;
  }

  async create(input: CreateProgramBody) {
    await this.users.requireAdminProfile(input.userId);
    return this.programs.create({
      name: input.name,
      description: input.description,
      defaultUnitWaterSavings: input.defaultUnitWaterSavings,
      defaultUnitCost: input.defaultUnitCost,
      budget: input.budget,
      defaultUnit: input.defaultUnit,
      singleFamilyHome: input.singleFamilyHome,
      multiFamilyComplex: input.multiFamilyComplex,
      residential: input.residential,
      commercial: input.commercial,
      programStart: input.programStart,
      programEnd: input.programEnd,
      admin: { connect: { userId: input.userId } },
      grantFunding: input.grantFunding,
      thirdParty: input.thirdParty,
    });
  }

  async update(id: string, input: UpdateProgramBody) {
    await this.users.requireAdminProfile(input.userId);
    const program = await this.getById(id);
    const data = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.defaultUnitWaterSavings !== undefined && {
        defaultUnitWaterSavings: input.defaultUnitWaterSavings,
      }),
      ...(input.defaultUnitCost !== undefined && {
        defaultUnitCost: input.defaultUnitCost,
      }),
      ...(input.defaultUnit !== undefined && {
        defaultUnit: input.defaultUnit,
      }),
      ...(input.singleFamilyHome !== undefined && {
        singleFamilyHome: input.singleFamilyHome,
      }),
      ...(input.multiFamilyComplex !== undefined && {
        multiFamilyComplex: input.multiFamilyComplex,
      }),
      ...(input.residential !== undefined && {
        residential: input.residential,
      }),
      ...(input.commercial !== undefined && { commercial: input.commercial }),
      ...(input.programStart !== undefined && {
        programStart: input.programStart,
      }),
      ...(input.programEnd !== undefined && { programEnd: input.programEnd }),
      ...(input.grantFunding !== undefined && {
        grantFunding: input.grantFunding,
      }),
      ...(input.thirdParty !== undefined && { thirdParty: input.thirdParty }),
    };

    if (input.budget === undefined || program.budget.equals(input.budget)) {
      return this.programs.update(id, data);
    }

    return this.programs.updateWithBudgetLog(
      id,
      { ...data, budget: input.budget },
      {
        adminUserId: input.userId,
        previousBudget: program.budget,
        newBudget: input.budget,
      },
    );
  }

  async softDelete(id: string) {
    await this.getById(id);
    this.programs.softDelete(id);
  }

  //program budget logs
  async listBudgetLogs(id: string, filters: ListProgramBudgetLogQuery) {
    await this.getById(id);
    const rows = await this.programs.findBudgetLogsManyActive(id, filters);
    const hasMore = rows.length > filters.limit;
    const budgetLogs = hasMore ? rows.slice(0, -1) : rows;
    const lastProgramLog = budgetLogs.at(-1);
    const pagination = {
      limit: filters.limit,
      nextCursor: hasMore && lastProgramLog ? lastProgramLog.id : null,
      hasMore,
    };
    return {
      budgetLogs: budgetLogs,
      pagination,
    };
  }

  async getBudgetLogById({ id, budgetLogId }: ProgramBudgetLogParams) {
    await this.getById(id);
    const budgetLog = await this.programs.findActiveBudgetLogById(
      id,
      budgetLogId,
    );
    if (!budgetLog) throw new NotFoundError("Budget log not found");
    return budgetLog;
  }

  async createBudgetLog(id: string, input: CreateProgramBudgetLogBody) {
    const program = await this.getById(id);
    await this.users.requireAdminProfile(input.userId);
    return this.programs.createBudgetLog({
      previousBudget: program.budget,
      ...(input.comment !== undefined && { comment: input.comment }),
      newBudget: input.newBudget,
      program: { connect: { id } },
      admin: { connect: { userId: input.userId } },
    });
  }

  async updateBudgetLog(
    programId: string,
    budgetLogId: string,
    input: UpdateProgramBudgetLogBody,
  ) {
    try {
      return await this.programs.updateBudgetLog(programId, budgetLogId, input);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new NotFoundError("Budget log not found");
      }
      throw err;
    }
  }
}
