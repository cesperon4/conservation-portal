import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { ProgramRepository } from "./program.repository.js";
import { ProgramService } from "./program.service.js";
import programRoutes from "./program.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    programService: ProgramService;
  }
}

const programsModule: FastifyPluginAsync = async (fastify) => {
  const repository = new ProgramRepository(fastify.prisma);
  const service = new ProgramService(repository);

  fastify.decorate("programService", service);
  await fastify.register(programRoutes, { prefix: "/programs" });
};

export default fp(programsModule, {
  name: "programs-module",
  dependencies: ["prisma"],
});
