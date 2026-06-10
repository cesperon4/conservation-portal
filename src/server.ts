import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";

async function start() {
  const env = loadEnv();
  const app = await buildApp();

  const close = async (signal: string) => {
    app.log.info({ signal }, "Shutting down gracefully");
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void close("SIGINT"));
  process.on("SIGTERM", () => void close("SIGTERM"));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
