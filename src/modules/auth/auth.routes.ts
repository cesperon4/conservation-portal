import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { authLoginSchema, authResponseSchema } from "./auth.schema.js";

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["auth"],
        body: authLoginSchema,
        response: { 201: authResponseSchema },
      },
    },
    async (request, reply) => {
      return reply.status(201);
    },
  );
};

export default authRoutes;
