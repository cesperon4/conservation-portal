import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { mapProgramToResponse } from "./program.mapper.js";
import {
  createProgramBodySchema,
  programIdParamsSchema,
  programQuerySchema,
  programResponseSchema,
  programsListResponseSchema,
  updateProgramBodySchema,
} from "./program.schema.js";

const programRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: programQuerySchema,
        tags: ["programs"],
        response: { 200: programsListResponseSchema },
      },
    },
    async (request) => {
      const listResponse = await fastify.programService.list(request.query);

      if (listResponse.view === "name") {
        return {
          view: listResponse.view,
          data: listResponse.programs,
          pagination: listResponse.pagination,
        };
      }

      return {
        view: listResponse.view,
        data: listResponse.programs.map(mapProgramToResponse),
        pagination: listResponse.pagination,
      };
    },
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["programs"],
        params: programIdParamsSchema,
        response: { 200: programResponseSchema },
      },
    },
    async (request) => {
      const program = await fastify.programService.getById(request.params.id);
      return mapProgramToResponse(program);
    },
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["programs"],
        body: createProgramBodySchema,
        response: { 201: programResponseSchema },
      },
    },
    async (request, reply) => {
      const program = await fastify.programService.create(request.body);
      return reply.status(201).send(mapProgramToResponse(program));
    },
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["programs"],
        params: programIdParamsSchema,
        body: updateProgramBodySchema,
        response: { 200: programResponseSchema },
      },
    },
    async (request) => {
      const program = await fastify.programService.update(
        request.params.id,
        request.body,
      );
      return mapProgramToResponse(program);
    },
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["programs"],
        params: programIdParamsSchema,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await fastify.programService.softDelete(request.params.id);
      return reply.status(204).send(null);
    },
  );
};

export default programRoutes;
