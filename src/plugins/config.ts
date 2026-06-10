import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { loadEnv, type Env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
  }
}

const configPlugin: FastifyPluginAsync = async (fastify) => {
  const config = loadEnv();
  fastify.decorate("config", config);
};

export default fp(configPlugin, { name: "config" });
