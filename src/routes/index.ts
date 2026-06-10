import type { FastifyPluginAsync } from "fastify";
import usersModule from "../modules/users/index.js";
import healthRoutes from "./health.js";

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(usersModule);
};

export default routes;
