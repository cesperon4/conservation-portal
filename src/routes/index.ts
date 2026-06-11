import type { FastifyPluginAsync } from "fastify";
import programsModule from "../modules/programs/index.js";
import usersModule from "../modules/users/index.js";
import healthRoutes from "./health.js";

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(usersModule);
  await fastify.register(programsModule);
};

export default routes;
