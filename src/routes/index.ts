import type { FastifyPluginAsync } from "fastify";
import acwdLookupModule from "../modules/acwd/index.js";
import programsModule from "../modules/programs/index.js";
import usersModule from "../modules/users/index.js";
import propertiesModule from "../modules/properties/index.js";
import healthRoutes from "./health.js";

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(usersModule);
  await fastify.register(programsModule);
  await fastify.register(acwdLookupModule);
  await fastify.register(propertiesModule);
};

export default routes;
