import { NotFoundError } from "../../lib/errors.js";
import type {
  CreateProgramBody,
  ListProgramsQuery,
  ProgramNameRow,
  ProgramPublicRow,
  UpdateProgramBody,
} from "./program.schema.js";
import { ProgramRepository } from "./program.repository.js";

export class ProgramService {
  constructor(private readonly programs: ProgramRepository) {}

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
      user: { connect: { id: input.userId } },
      grantFunding: input.grantFunding,
      thirdParty: input.thirdParty,
    });
  }

  async update(id: string, input: UpdateProgramBody) {
    await this.getById(id);

    return this.programs.update(id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.defaultUnitWaterSavings !== undefined && {
        defaultUnitWaterSavings: input.defaultUnitWaterSavings,
      }),
      ...(input.defaultUnitCost !== undefined && {
        defaultUnitCost: input.defaultUnitCost,
      }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.defaultUnit !== undefined && { defaultUnit: input.defaultUnit }),
      ...(input.singleFamilyHome !== undefined && {
        singleFamilyHome: input.singleFamilyHome,
      }),
      ...(input.multiFamilyComplex !== undefined && {
        multiFamilyComplex: input.multiFamilyComplex,
      }),
      ...(input.residential !== undefined && { residential: input.residential }),
      ...(input.commercial !== undefined && { commercial: input.commercial }),
      ...(input.programStart !== undefined && {
        programStart: input.programStart,
      }),
      ...(input.programEnd !== undefined && { programEnd: input.programEnd }),
      ...(input.userId !== undefined && {
        user: { connect: { id: input.userId } },
      }),
      ...(input.grantFunding !== undefined && {
        grantFunding: input.grantFunding,
      }),
      ...(input.thirdParty !== undefined && { thirdParty: input.thirdParty }),
    });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await this.programs.softDelete(id);
  }
}
