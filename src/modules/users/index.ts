import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";
import userRoutes from "./user.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    userService: UserService;
  }
}

const usersModule: FastifyPluginAsync = async (fastify) => {
  const repository = new UserRepository(fastify.prisma);
  const service = new UserService(repository);

  fastify.decorate("userService", service);
  await fastify.register(userRoutes, { prefix: "/users" });
};

export default fp(usersModule, {
  name: "users-module",
  dependencies: ["prisma"],
});
