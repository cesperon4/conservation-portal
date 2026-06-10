import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().url().startsWith("postgresql"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  source: NodeJS.ProcessEnv = process.env,
): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment variables:", formatted);
    process.exit(1);
  }

  return parsed.data;
}
