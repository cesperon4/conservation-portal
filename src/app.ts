import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import configPlugin from "./plugins/config.js";
import prismaPlugin from "./plugins/prisma.js";
import routes from "./routes/index.js";
import { loadEnv } from "./config/env.js";
import { HttpError } from "./lib/errors.js";
import { mapPrismaError } from "./lib/prisma-errors.js";

export async function buildApp() {
  const env = loadEnv();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
    requestIdHeader: "x-request-id",
    genReqId: (req) =>
      (req.headers["x-request-id"] as string | undefined) ??
      crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(configPlugin);
  await app.register(sensible);
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
  });
  await app.register(cors, {
    origin: env.NODE_ENV === "production" ? false : true,
  });
  await app.register(prismaPlugin);
  await app.register(routes, { prefix: "/api/v1" });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Validation failed",
        details: error.validation,
      });
    }

    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    const prismaError = mapPrismaError(error);
    if (prismaError) {
      return reply.status(prismaError.statusCode).send({
        statusCode: prismaError.statusCode,
        error: "Database Error",
        message: prismaError.message,
      });
    }

    const statusCode = error.statusCode ?? 500;
    const message =
      statusCode >= 500 && env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;

    return reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message,
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Route not found",
    });
  });

  return app;
}
