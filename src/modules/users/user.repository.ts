import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ListUsersQuery } from "./user.schema.js";
import { publicUserSelect, userSelectByView } from "./user.schema.js";

const activeUserWhere = { deletedAt: null } satisfies Prisma.UserWhereInput;

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyActive({ limit, cursor, column, direction, view }: ListUsersQuery) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: userSelectByView[view],
      orderBy: [{ [column]: direction }, { id: direction }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  findActiveById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, ...activeUserWhere },
      select: publicUserSelect,
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: publicUserSelect,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
