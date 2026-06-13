import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { decimalInput } from "../../lib/decimal.js";

export const programIdParamsSchema = z.object({
  id: z.string().cuid(),
});

const listPaginationFields = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().cuid().optional(),
} as const;

export const programQuerySchema = z.object({
  ...listPaginationFields,
  view: z.enum(["full", "name"]).default("full"),
  status: z.enum(["active", "deleted", "all"]).default("active"),
  column: z.enum(["createdAt", "name"]).default("createdAt"),
});

export type ListProgramsQuery = z.infer<typeof programQuerySchema>;

export const createProgramBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  defaultUnitWaterSavings: decimalInput(10, 2),
  defaultUnitCost: decimalInput(12, 2),
  budget: decimalInput(12, 2),
  defaultUnit: z.string().min(1),
  singleFamilyHome: z.boolean().default(false),
  multiFamilyComplex: z.boolean().default(false),
  residential: z.boolean().default(false),
  commercial: z.boolean().default(false),
  programStart: z.coerce.date(),
  programEnd: z.coerce.date(),
  userId: z.string().cuid(),
  grantFunding: z.number().finite(),
  thirdParty: z.boolean().default(false),
});
export type CreateProgramBody = z.infer<typeof createProgramBodySchema>;

export const updateProgramBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  defaultUnitWaterSavings: decimalInput(10, 2).optional(),
  defaultUnitCost: decimalInput(12, 2).optional(),
  budget: decimalInput(12, 2).optional(),
  defaultUnit: z.string().min(1).optional(),
  singleFamilyHome: z.boolean().optional(),
  multiFamilyComplex: z.boolean().optional(),
  residential: z.boolean().optional(),
  commercial: z.boolean().optional(),
  programStart: z.coerce.date().optional(),
  programEnd: z.coerce.date().optional(),
  userId: z.string().cuid(), //must come from token
  grantFunding: z.number().finite().optional(),
  thirdParty: z.boolean().optional(),
});

export const programResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  defaultUnitWaterSavings: z.string(),
  defaultUnitCost: z.string(),
  budget: z.string(),
  defaultUnit: z.string(),
  singleFamilyHome: z.boolean(),
  multiFamilyComplex: z.boolean(),
  residential: z.boolean(),
  commercial: z.boolean(),
  programStart: z.coerce.date(),
  programEnd: z.coerce.date(),
  userId: z.string().cuid(),
  grantFunding: z.number().finite(),
  thirdParty: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const programNameSchema = programResponseSchema.pick({
  id: true,
  name: true,
});

export const programPaginationSchema = z.object({
  limit: z.number().int(),
  nextCursor: z.string().cuid().nullable(),
  hasMore: z.boolean(),
});

const programListSchemas = {
  name: programNameSchema,
  full: programResponseSchema,
} as const;

type ProgramView = keyof typeof programListSchemas;

function createProgramListResponseSchema<V extends ProgramView>(
  view: V,
  itemSchema: (typeof programListSchemas)[V],
) {
  return z.object({
    view: z.literal(view),
    data: z.array(itemSchema),
    pagination: programPaginationSchema,
  });
}

export const programListNamesResponseSchema = createProgramListResponseSchema(
  "name",
  programNameSchema,
);
export const programListFullResponseSchema = createProgramListResponseSchema(
  "full",
  programResponseSchema,
);

export const programsListResponseSchema = z.discriminatedUnion("view", [
  programListFullResponseSchema,
  programListNamesResponseSchema,
]);

export const nameSelect = {
  id: true,
  name: true,
} satisfies Prisma.ProgramSelect;

export const publicProgramSelect = {
  id: true,
  name: true,
  description: true,
  defaultUnitWaterSavings: true,
  defaultUnitCost: true,
  budget: true,
  defaultUnit: true,
  singleFamilyHome: true,
  multiFamilyComplex: true,
  residential: true,
  commercial: true,
  programStart: true,
  programEnd: true,
  adminUserId: true,
  grantFunding: true,
  thirdParty: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProgramSelect;

export const programSelectByView = {
  full: publicProgramSelect,
  name: nameSelect,
} satisfies Record<ListProgramsQuery["view"], Prisma.ProgramSelect>;

export type UpdateProgramBody = z.infer<typeof updateProgramBodySchema>;
export type ProgramResponse = z.infer<typeof programResponseSchema>;
export type ProgramNameResponse = z.infer<typeof programNameSchema>;

export type ProgramPublicRow = Prisma.ProgramGetPayload<{
  select: typeof publicProgramSelect;
}>;

export type ProgramNameRow = Prisma.ProgramGetPayload<{
  select: typeof nameSelect;
}>;

/* Budget Logs */

export const programBudgetLogQuerySchema = z.object({
  ...listPaginationFields,
  status: z.enum(["active", "deleted", "all"]).default("active"),
  column: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
});

export type ListProgramBudgetLogQuery = z.infer<
  typeof programBudgetLogQuerySchema
>;

export const programBudgetLogResponseSchema = z.object({
  id: z.string().cuid(),
  previousBudget: z.string().nullable(),
  newBudget: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
  programId: z.string().cuid(),
  userId: z.string().cuid(),
  comment: z.string().nullable(),
});

export type ProgramBudgetLogResponse = z.infer<
  typeof programBudgetLogResponseSchema
>;

export const programBudgetLogListSchema = z.object({
  data: z.array(programBudgetLogResponseSchema),
  pagination: programPaginationSchema,
});

export const publicProgramBudgetLogSelect = {
  id: true,
  previousBudget: true,
  newBudget: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  programId: true,
  adminUserId: true,
  comment: true,
} satisfies Prisma.ProgramBudgetLogSelect;

export type ProgramBudgetLogRow = Prisma.ProgramBudgetLogGetPayload<{
  select: typeof publicProgramBudgetLogSelect;
}>;

export const programBudgetLogParamsSchema = z.object({
  id: z.string().cuid(),
  budgetLogId: z.string().cuid(),
});

export type ProgramBudgetLogParams = z.infer<
  typeof programBudgetLogParamsSchema
>;

export const createProgramBudgetLogBodySchema = z.object({
  newBudget: decimalInput(12, 2),
  userId: z.string().cuid(),
  comment: z.string().optional(),
});

export type CreateProgramBudgetLogBody = z.infer<
  typeof createProgramBudgetLogBodySchema
>;

export type BudgetLogMetaData = {
  adminUserId: string;
  previousBudget: Prisma.Decimal;
  newBudget: number;
};

export const updateProgramBudgetLogBodySchema = z.object({
  comment: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export type UpdateProgramBudgetLogBody = z.infer<
  typeof updateProgramBudgetLogBodySchema
>;
