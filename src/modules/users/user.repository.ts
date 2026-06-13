import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { CustomerProfileBody, ListUsersQuery } from "./user.schema.js";
import {
  publicUserWithProfilesSelect,
  userSelectByView,
} from "./user.schema.js";

const activeUserWhere = { deletedAt: null } satisfies Prisma.UserWhereInput;

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyActive({ limit, cursor, column, direction, view, role }: ListUsersQuery) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role && { role }),
        ...(role === "admin" && { adminProfile: { isNot: null } }),
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
      select: publicUserWithProfilesSelect,
    });
  }

  findAdminProfile(userId: string) {
    return this.prisma.adminProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { deletedAt: null, role: "admin" },
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: publicUserWithProfilesSelect,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: publicUserWithProfilesSelect,
    });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async syncRoleProfile(
    userId: string,
    role: Prisma.UserCreateInput["role"],
    customerProfile?: CustomerProfileBody | Partial<CustomerProfileBody>,
  ) {
    if (role === "admin") {
      await this.prisma.customerProfile.deleteMany({ where: { userId } });
      await this.prisma.adminProfile.upsert({
        where: { userId },
        create: { user: { connect: { id: userId } } },
        update: {},
      });
      return;
    }

    if (role === "customer" && customerProfile) {
      const existing = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });

      if (existing) {
        await this.prisma.customerProfile.update({
          where: { userId },
          data: {
            ...(customerProfile.mailingAddress !== undefined && {
              mailingAddress: customerProfile.mailingAddress,
            }),
            ...(customerProfile.mailingCity !== undefined && {
              mailingCity: customerProfile.mailingCity,
            }),
            ...(customerProfile.mailingState !== undefined && {
              mailingState: customerProfile.mailingState,
            }),
            ...(customerProfile.mailingZip !== undefined && {
              mailingZip: customerProfile.mailingZip,
            }),
            ...(customerProfile.company !== undefined && {
              company: customerProfile.company,
            }),
            ...(customerProfile.title !== undefined && {
              title: customerProfile.title,
            }),
          },
        });
      } else {
        const mailing = customerProfile as CustomerProfileBody;
        await this.prisma.customerProfile.create({
          data: {
            user: { connect: { id: userId } },
            mailingAddress: mailing.mailingAddress,
            mailingCity: mailing.mailingCity,
            mailingState: mailing.mailingState,
            mailingZip: mailing.mailingZip,
            company: mailing.company ?? null,
            title: mailing.title ?? null,
          },
        });
      }
    } else if (role === "customer") {
      await this.prisma.customerProfile.deleteMany({ where: { userId } });
    } else {
      await this.prisma.customerProfile.deleteMany({ where: { userId } });
    }

    const [ownedPrograms, ownedBudgetLogs] = await Promise.all([
      this.prisma.program.count({ where: { adminUserId: userId } }),
      this.prisma.programBudgetLog.count({ where: { adminUserId: userId } }),
    ]);

    if (ownedPrograms === 0 && ownedBudgetLogs === 0) {
      await this.prisma.adminProfile.deleteMany({ where: { userId } });
    }
  }
}
