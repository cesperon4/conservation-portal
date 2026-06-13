import { hashPassword } from "../../lib/password.js";
import { HttpError, NotFoundError } from "../../lib/errors.js";
import type { CreateUserBody, ListUsersQuery, UpdateUserBody } from "./user.schema.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async list(filters: ListUsersQuery) {
    const rows = await this.users.findManyActive(filters);

    const hasMore = rows.length > filters.limit;
    const users = hasMore ? rows.slice(0, -1) : rows;
    const lastUser = users.at(-1);

    return {
      users,
      pagination: {
        limit: filters.limit,
        nextCursor: hasMore && lastUser ? lastUser.id : null,
        hasMore,
      },
    };
  }

  async getById(id: string) {
    const user = await this.users.findActiveById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async requireAdminProfile(userId: string) {
    const profile = await this.users.findAdminProfile(userId);
    if (!profile) {
      throw new HttpError("Program owner must be an admin with a profile", 400);
    }
    return profile;
  }

  async create(input: CreateUserBody) {
    const passwordHash = await hashPassword(input.password);
    const role = input.role ?? "customer";

    const user = await this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role,
    });

    await this.users.syncRoleProfile(user.id, role, input.customerProfile);
    return this.getById(user.id);
  }

  async update(id: string, input: UpdateUserBody) {
    const existing = await this.getById(id);

    const passwordHash =
      input.password !== undefined
        ? await hashPassword(input.password)
        : undefined;

    await this.users.update(id, {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.role !== undefined && { role: input.role }),
      ...(passwordHash !== undefined && { passwordHash }),
    });

    const role = input.role ?? existing.role;
    if (input.role !== undefined || input.customerProfile !== undefined) {
      await this.users.syncRoleProfile(id, role, input.customerProfile);
    }

    return this.getById(id);
  }

  async softDelete(id: string) {
    await this.getById(id);
    await this.users.softDelete(id);
  }
}
