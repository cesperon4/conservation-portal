import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";

export const userRoleSchema = z.enum([
  "customer",
  "admin",
  "guest",
  "county",
  "contractor",
]);

export const userSortBySchema = z.enum([
  "firstName",
  "lastName",
  "email",
  "role",
  "createdAt",
  "updatedAt",
]);

export const userIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const userQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  view: z.enum(["full", "email", "name"]).default("full"),
  status: z.enum(["active", "deleted", "all"]).default("active"),
  role: userRoleSchema.optional(),
  column: userSortBySchema.default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().cuid().optional(),
});

export type ListUsersQuery = z.infer<typeof userQuerySchema>;

export const customerProfileBodySchema = z.object({
  mailingAddress: z.string().min(1).max(255),
  mailingCity: z.string().min(1).max(50),
  mailingState: z.string().min(1).max(50),
  mailingZip: z.string().min(1).max(50),
  company: z.string().max(255).optional(),
  title: z.string().max(50).optional(),
});

export const customerProfileResponseSchema = customerProfileBodySchema
  .extend({
    userId: z.string().cuid(),
    verifiedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable(),
  })
  .extend({
    company: z.string().max(255).nullable(),
    title: z.string().max(50).nullable(),
  });

export const adminProfileResponseSchema = z.object({
  userId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const createUserBodySchema = z
  .object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(128),
    phone: z.string().min(1).max(20).optional(),
    role: userRoleSchema.default("customer"),
    customerProfile: customerProfileBodySchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (body.role === "customer" && !body.customerProfile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customerProfile is required when role is customer",
        path: ["customerProfile"],
      });
    }
  });

export const updateUserBodySchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  password: z.string().min(8).max(128).optional(),
  phone: z.string().min(1).max(20).nullable().optional(),
  role: userRoleSchema.optional(),
  customerProfile: customerProfileBodySchema.partial().optional(),
});

export const userResponseSchema = z.object({
  id: z.string().cuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  adminProfile: adminProfileResponseSchema.nullable().optional(),
  customerProfile: customerProfileResponseSchema.nullable().optional(),
});

export const userNameSchema = userResponseSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
});

export const userEmailSchema = userResponseSchema.pick({
  id: true,
  email: true,
});

export const userPaginationSchema = z.object({
  limit: z.number().int(),
  nextCursor: z.string().cuid().nullable(),
  hasMore: z.boolean(),
});

const userListSchemas = {
  name: userNameSchema,
  email: userEmailSchema,
  full: userResponseSchema,
} as const;

type UserView = keyof typeof userListSchemas;

function createUserListResponseSchema<V extends UserView>(
  view: V,
  itemSchema: (typeof userListSchemas)[V],
) {
  return z.object({
    view: z.literal(view),
    data: z.array(itemSchema),
    pagination: userPaginationSchema,
  });
}

export const userListNamesResponseSchema = createUserListResponseSchema(
  "name",
  userNameSchema,
);
export const userListEmailsResponseSchema = createUserListResponseSchema(
  "email",
  userEmailSchema,
);
export const userListFullResponseSchema = createUserListResponseSchema(
  "full",
  userResponseSchema,
);

export const usersListResponseSchema = z.discriminatedUnion("view", [
  userListFullResponseSchema,
  userListNamesResponseSchema,
  userListEmailsResponseSchema,
]);

export const nameSelect = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

export const emailSelect = {
  id: true,
  email: true,
} satisfies Prisma.UserSelect;

export const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  phone: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const publicUserWithProfilesSelect = {
  ...publicUserSelect,
  adminProfile: true,
  customerProfile: true,
} satisfies Prisma.UserSelect;

export type UserPublicRow = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type UserWithProfilesRow = Prisma.UserGetPayload<{
  select: typeof publicUserWithProfilesSelect;
}>;

export const userSelectByView = {
  full: publicUserSelect,
  name: nameSelect,
  email: emailSelect,
} satisfies Record<ListUsersQuery["view"], Prisma.UserSelect>;

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type CustomerProfileBody = z.infer<typeof customerProfileBodySchema>;
