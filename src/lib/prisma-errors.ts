import { Prisma } from "../generated/prisma/client.js";

export function mapPrismaError(error: unknown): {
  statusCode: number;
  message: string;
} | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "A record with this value already exists",
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "Record not found",
      };
    default:
      return null;
  }
}
