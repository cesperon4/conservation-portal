import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { PropertyService } from "./property.service.js";
import { PropertyRepository } from "./property.repository.js";
import propertyRoutes from "./property.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    propertyService: PropertyService;
  }
}

const propertiesModule: FastifyPluginAsync = async (fastify) => {
  const repository = new PropertyRepository(fastify.prisma);
  const service = new PropertyService(
    repository,
    fastify.userService,
    fastify.acwdLookupService,
  );

  fastify.decorate("propertyService", service);
  await fastify.register(propertyRoutes, { prefix: "/properties" });
};

export default fp(propertiesModule, {
  name: "properties-module",
  dependencies: ["prisma", "users-module", "acwd-lookup-module"],
});
