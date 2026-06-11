import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { ListProgramsQuery } from "./program.schema.js";
import { programSelectByView, publicProgramSelect } from "./program.schema.js";

const activeProgramWhere = { deletedAt: null } satisfies Prisma.ProgramWhereInput;

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
    return this.prisma.program.create({
      data,
      select: publicProgramSelect,
    });
  }

  update(id: string, data: Prisma.ProgramUpdateInput) {
    return this.prisma.program.update({
      where: { id },
      data,
      select: publicProgramSelect,
    });
  }

  softDelete(id: string) {
    return this.prisma.program.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
