import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";

export const authLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
});
