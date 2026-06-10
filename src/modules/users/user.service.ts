import { hashPassword } from "../../lib/password.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateUserBody, UpdateUserBody } from "./user.schema.js";
import { UserRepository } from "./user.repository.js";
import { ListUsersQuery } from "./user.schema.js";

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

  async create(input: CreateUserBody) {
    const passwordHash = await hashPassword(input.password);

    return this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: input.role,
    });
  }

  async update(id: string, input: UpdateUserBody) {
    await this.getById(id);

    const passwordHash =
      input.password !== undefined
        ? await hashPassword(input.password)
        : undefined;

    return this.users.update(id, {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.role !== undefined && { role: input.role }),
      ...(passwordHash !== undefined && { passwordHash }),
    });
  }

  async softDelete(id: string) {
    await this.getById(id);
    await this.users.softDelete(id);
  }
}
