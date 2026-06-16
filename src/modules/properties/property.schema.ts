import { z } from "zod";
import { listPaginationFields } from "../programs/program.schema.js";
import { Prisma } from "../../generated/prisma/client.js";
import { paginationSchema } from "../programs/program.schema.js";

export const acwdLookupQuerySchema = z.object({
  accountNo: z.string().min(1).max(8),
  postalCode: z.string().min(1).max(20),
});

export const propertyIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const propertyQuerySchema = z.object({
  ...listPaginationFields,
  customerUserId: z.string().cuid().optional(),
  column: z
    .enum([
      "streetLine1",
      "city",
      "state",
      "postalCode",
      "category",
      "createdAt",
    ])
    .default("createdAt"),
});

export type PropertyQuery = z.infer<typeof propertyQuerySchema>;

export const publicPropertySelect = {
  id: true,
  customerUserId: true,
  streetLine1: true,
  streetLine2: true,
  city: true,
  state: true,
  postalCode: true,
  category: true,
  acwdAccountNo: true,
  acwdLocationNo: true,
  source: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.PropertySelect;

export const propertyCategories = z.enum([
  "singleFamilyHome",
  "residential",
  "multiFamilyComplex",
  "commercial",
  "landscape",
]);

export const propertyResponseSchema = z.object({
  id: z.string().cuid(),
  customerUserId: z.string().cuid(),
  streetLine1: z.string(),
  streetLine2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  category: propertyCategories,
  acwdAccountNo: z.string().nullable(),
  acwdLocationNo: z.string().nullable(),
  source: z.enum(["manual", "acwd"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const propertiesListResponseSchema = z.object({
  data: z.array(propertyResponseSchema),
  pagination: paginationSchema,
});

export const createPropertyBodySchema = z.discriminatedUnion("source", [
  z.object({
    customerUserId: z.string().cuid(),
    streetLine1: z.string(),
    streetLine2: z.string().optional(),
    city: z.string(),
    state: z.string().min(2).max(2),
    postalCode: z.string(),
    category: propertyCategories,
    source: z.literal("manual"),
  }),
  z.object({
    customerUserId: z.string().cuid(),
    source: z.literal("acwd"),
    acwdAccountNo: z.string(),
    postalCode: z.string(),
  }),
]);

export type CreatePropertyBody = z.infer<typeof createPropertyBodySchema>;

export const updatePropertyBodySchema = z.object({
  streetLine1: z.string().optional(),
  streetLine2: z.string().nullable().optional(),
  city: z.string().optional(),
  state: z.string().min(2).max(2).optional(),
  postalCode: z.string().optional(),
  category: propertyCategories.optional(),
});

export type UpdatePropertyBody = z.infer<typeof updatePropertyBodySchema>;

export type Category =
  | "singleFamilyHome"
  | "multiFamilyComplex"
  | "residential"
  | "commercial"
  | "landscape";
