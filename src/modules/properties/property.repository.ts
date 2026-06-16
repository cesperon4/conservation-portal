import type { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import { PropertyQuery } from "./property.schema.js";
import { publicPropertySelect } from "./property.schema.js";

export class PropertyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyActive({
    limit,
    cursor,
    column,
    direction,
    customerUserId,
  }: PropertyQuery) {
    return this.prisma.property.findMany({
      select: publicPropertySelect,
      where: {
        deletedAt: null,
        ...(customerUserId && { customerUserId }),
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: [{ [column]: direction }, { id: direction }],
    });
  }

  getById(id: string) {
    return this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: publicPropertySelect,
    });
  }

  findByAcwdIdentity({
    customerUserId,
    acwdAccountNo,
    acwdLocationNo,
  }: {
    customerUserId: string;
    acwdAccountNo: string;
    acwdLocationNo: string;
  }) {
    return this.prisma.property.findFirst({
      where: { customerUserId, acwdAccountNo, acwdLocationNo },
      select: publicPropertySelect,
    });
  }

  create(data: Prisma.PropertyCreateInput) {
    return this.prisma.property.create({
      data,
      select: publicPropertySelect,
    });
  }

  update(id: string, data: Prisma.PropertyUpdateInput) {
    return this.prisma.property.update({
      where: { id, deletedAt: null, customer: { deletedAt: null } },
      data,
      select: publicPropertySelect,
    });
  }

  restore(id: string, data: Prisma.PropertyUpdateInput) {
    return this.prisma.property.update({
      where: { id },
      data,
      select: publicPropertySelect,
    });
  }

  softDelete(id: string) {
    return this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
