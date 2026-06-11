import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";

export const decimalInput = (maxDigits: number, scale: number) =>
  z.coerce
    .number()
    .finite()
    .refine((n) => {
      const [int = "", frac = ""] = Math.abs(n).toString().split(".");
      return int.length + frac.length <= maxDigits && frac.length <= scale;
    });

export function decimalToString(value: Prisma.Decimal, scale: number): string {
  return value.toFixed(scale);
}
