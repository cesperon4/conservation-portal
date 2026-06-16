import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  acwdLookupQuerySchema,
  propertyQuerySchema,
  propertiesListResponseSchema,
  propertyIdParamsSchema,
  propertyResponseSchema,
  createPropertyBodySchema,
  updatePropertyBodySchema,
} from "./property.schema.js";
import { acwdLookupPreviewSchema } from "../acwd/acwd.types.js";

const propertyRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: propertyQuerySchema,
        tags: ["properties"],
        response: { 200: propertiesListResponseSchema },
      },
    },
    async (request) => {
      return fastify.propertyService.list(request.query);
    },
  );
  fastify.get(
    "/acwd/lookup",
    {
      schema: {
        querystring: acwdLookupQuerySchema,
        tags: ["properties"],
        response: { 200: acwdLookupPreviewSchema },
      },
    },
    async (request) => {
      const { accountNo, postalCode } = request.query;
      return fastify.acwdLookupService.lookup(accountNo, postalCode);
    },
  );
  fastify.get(
    "/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        tags: ["properties"],
        response: { 200: propertyResponseSchema },
      },
    },
    async (request) => {
      return fastify.propertyService.getById(request.params.id);
    },
  );
  fastify.post(
    "/",
    {
      schema: {
        body: createPropertyBodySchema,
        tags: ["properties"],
        response: { 201: propertyResponseSchema },
      },
    },
    async (request, reply) => {
      const property = await fastify.propertyService.create(request.body);
      return reply.status(201).send(property);
    },
  );
  fastify.patch(
    "/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        tags: ["properties"],
        body: updatePropertyBodySchema,
        response: { 200: propertyResponseSchema },
      },
    },
    async (request) => {
      return fastify.propertyService.update(request.params.id, request.body);
    },
  );
  fastify.delete(
    "/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        tags: ["properties"],
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await fastify.propertyService.softDelete(request.params.id);
      return reply.status(204).send(null);
    },
  );
};

export default propertyRoutes;
