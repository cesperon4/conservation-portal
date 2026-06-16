import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { AcwdLookupService } from "./acwd-lookup.service.js";
import { AcwdRepository } from "./acwd.repository.js";

declare module "fastify" {
  interface FastifyInstance {
    acwdLookupService: AcwdLookupService;
  }
}

const acwdLookupModule: FastifyPluginAsync = async (fastify) => {
  const repository = new AcwdRepository(fastify.prisma);
  const service = new AcwdLookupService(repository);

  fastify.decorate("acwdLookupService", service);
};

export default fp(acwdLookupModule, {
  name: "acwd-lookup-module",
  dependencies: ["prisma"],
});
