import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  mapProgramBudgetLogToResponse,
  mapProgramToResponse,
} from "./program.mapper.js";
import {
  createProgramBodySchema,
  programIdParamsSchema,
  programQuerySchema,
  programResponseSchema,
  programsListResponseSchema,
  updateProgramBodySchema,
  programBudgetLogQuerySchema,
  programBudgetLogListSchema,
  programBudgetLogResponseSchema,
  programBudgetLogParamsSchema,
  createProgramBudgetLogBodySchema,
  updateProgramBudgetLogBodySchema,
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

  //budget logs
  fastify.get(
    "/:id/budget-logs",
    {
      schema: {
        tags: ["programs"],
        params: programIdParamsSchema,
        querystring: programBudgetLogQuerySchema,
        response: { 200: programBudgetLogListSchema },
      },
    },
    async (request) => {
      const rows = await fastify.programService.listBudgetLogs(
        request.params.id,
        request.query,
      );

      return {
        data: rows.budgetLogs.map(mapProgramBudgetLogToResponse),
        pagination: rows.pagination,
      };
    },
  );

  fastify.get(
    "/:id/budget-logs/:budgetLogId",
    {
      schema: {
        tags: ["programs"],
        params: programBudgetLogParamsSchema,
        response: { 200: programBudgetLogResponseSchema },
      },
    },
    async (request) => {
      const row = await fastify.programService.getBudgetLogById(request.params);
      return mapProgramBudgetLogToResponse(row);
    },
  );

  fastify.post(
    "/:id/budget-logs",
    {
      schema: {
        tags: ["programs"],
        params: programIdParamsSchema,
        body: createProgramBudgetLogBodySchema,
        response: { 201: programBudgetLogResponseSchema },
      },
    },
    async (request, reply) => {
      const row = await fastify.programService.createBudgetLog(
        request.params.id,
        request.body,
      );

      return reply.status(201).send(mapProgramBudgetLogToResponse(row));
    },
  );

  fastify.patch(
    "/:id/budget-logs/:budgetLogId",
    {
      schema: {
        tags: ["programs"],
        params: programBudgetLogParamsSchema,
        body: updateProgramBudgetLogBodySchema,
        response: { 200: programBudgetLogResponseSchema },
      },
    },
    async (request) => {
      const { budgetLogId, id } = request.params;
      const row = await fastify.programService.updateBudgetLog(
        id,
        budgetLogId,
        request.body,
      );

      return mapProgramBudgetLogToResponse(row);
    },
  );
};

export default programRoutes;
