import { AcwdLookupService } from "../acwd/acwd-lookup.service.js";
import { PropertyRepository } from "./property.repository.js";
import { HttpError, NotFoundError } from "../../lib/errors.js";
import {
  PropertyQuery,
  CreatePropertyBody,
  UpdatePropertyBody,
} from "./property.schema.js";
import { UserService } from "../users/user.service.js";
import type { Category } from "./property.schema.js";

export class PropertyService {
  constructor(
    private readonly properties: PropertyRepository,
    private readonly users: UserService,
    private readonly acwd: AcwdLookupService,
  ) {}

  async list(filters: PropertyQuery) {
    const rows = await this.properties.findManyActive(filters);
    const hasMore = rows.length > filters.limit;
    const properties = hasMore ? rows.slice(0, -1) : rows;
    const lastProperty = properties.at(-1);

    const pagination = {
      limit: filters.limit,
      hasMore,
      nextCursor: hasMore && lastProperty ? lastProperty.id : null,
    };

    return {
      data: properties,
      pagination,
    };
  }

  async getById(id: string) {
    const property = await this.properties.getById(id);
    if (!property) throw new NotFoundError("Property not found");
    return property;
  }

  async validateCustomerProfile(id: string) {
    const user = await this.users.getById(id);
    if (
      user.role !== "customer" ||
      !user.customerProfile ||
      user.customerProfile.deletedAt !== null
    )
      throw new HttpError("Customer profile not found", 400);
  }

  async create(input: CreatePropertyBody) {
    await this.validateCustomerProfile(input.customerUserId);

    if (input.source === "manual") {
      return this.properties.create({
        customer: { connect: { userId: input.customerUserId } },
        streetLine1: input.streetLine1,
        ...(input.streetLine2 !== undefined && {
          streetLine2: input.streetLine2,
        }),
        city: input.city,
        state: input.state.toUpperCase(),
        postalCode: input.postalCode,
        category: input.category,
        source: input.source,
      });
    }

    const location = await this.acwd.lookup(
      input.acwdAccountNo,
      input.postalCode,
    );

    const existing = await this.properties.findByAcwdIdentity({
      customerUserId: input.customerUserId,
      acwdAccountNo: location.accountNo,
      acwdLocationNo: location.locationNo,
    });

    const snapshot = {
      streetLine1: location.streetLine1,
      streetLine2: location.streetLine2,
      city: location.city,
      state: location.state.toUpperCase(),
      postalCode: location.postalCode,
      category: location.category as Category,
      source: input.source,
    };

    if (existing) {
      if (existing.deletedAt === null) {
        throw new HttpError(
          "This ACWD account is already registered for this customer",
          409,
        );
      }

      return this.properties.restore(existing.id, {
        ...snapshot,
        deletedAt: null,
      });
    }

    return this.properties.create({
      customer: { connect: { userId: input.customerUserId } },
      ...snapshot,
      acwdAccountNo: location.accountNo,
      acwdLocationNo: location.locationNo,
    });
  }

  async update(id: string, input: UpdatePropertyBody) {
    await this.getById(id);
    return this.properties.update(id, {
      ...(input.streetLine1 !== undefined && {
        streetLine1: input.streetLine1,
      }),
      ...(input.streetLine2 !== undefined && {
        streetLine2: input.streetLine2,
      }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state.toUpperCase() }),
      ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
      ...(input.category !== undefined && { category: input.category }),
    });
  }

  async softDelete(id: string) {
    await this.getById(id);
    return this.properties.softDelete(id);
  }
}
