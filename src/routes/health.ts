import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        response: {
          200: z.object({
            status: z.literal("ok"),
            timestamp: z.string().datetime(),
          }),
        },
      },
    },
    async () => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    }),
  );

  fastify.get(
    "/health/ready",
    {
      schema: {
        tags: ["health"],
        response: {
          200: z.object({
            status: z.literal("ready"),
            database: z.literal("up"),
          }),
          503: z.object({
            status: z.literal("not_ready"),
            database: z.literal("down"),
          }),
        },
      },
    },
    async (_request, reply) => {
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return {
          status: "ready" as const,
          database: "up" as const,
        };
      } catch {
        return reply.status(503).send({
          status: "not_ready" as const,
          database: "down" as const,
        });
      }
    },
  );
};

export default healthRoutes;
