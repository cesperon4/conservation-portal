import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createUserBodySchema,
  updateUserBodySchema,
  userIdParamsSchema,
  userResponseSchema,
  usersListResponseSchema,
  userQuerySchema,
} from "./user.schema.js";

const userRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: userQuerySchema,
        tags: ["users"],
        response: { 200: usersListResponseSchema },
      },
    },
    async (request) => {
      const listResponse = await fastify.userService.list(request.query);
      return {
        view: request.query.view,
        data: listResponse.users,
        pagination: listResponse.pagination,
      };
    },
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["users"],
        params: userIdParamsSchema,
        response: { 200: userResponseSchema },
      },
    },
    async (request) => {
      return fastify.userService.getById(request.params.id);
    },
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["users"],
        body: createUserBodySchema,
        response: { 201: userResponseSchema },
      },
    },
    async (request, reply) => {
      const user = await fastify.userService.create(request.body);
      return reply.status(201).send(user);
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["users"],
        params: userIdParamsSchema,
        body: updateUserBodySchema,
        response: { 200: userResponseSchema },
      },
    },
    async (request) => {
      return fastify.userService.update(request.params.id, request.body);
    },
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["users"],
        params: userIdParamsSchema,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await fastify.userService.softDelete(request.params.id);
      return reply.status(204).send(null);
    },
  );
};

export default userRoutes;
