import { z } from "zod";

export const acwdLookupPreviewSchema = z.object({
  accountNo: z.string().min(8).max(8),
  locationNo: z.string().max(10),
  streetLine1: z.string().max(255),
  streetLine2: z.string().max(255).nullable(),
  city: z.string().max(50),
  state: z.string().max(10),
  postalCode: z.string().max(20),
  acwdImportedAt: z.coerce.date(),
  category: z.enum([
    "singleFamilyHome",
    "residential",
    "multiFamilyComplex",
    "commercial",
    "landscape",
    "other",
  ]),
  acwdAccountClass: z.string().max(10).nullable(),
  acwdLocationClass: z.string().max(10).nullable(),
});

export type AcwdLookupPreview = z.infer<typeof acwdLookupPreviewSchema>;
