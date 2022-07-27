import "dotenv/config";

import Fastify from "fastify";
import { showData } from "./src/reports.mjs";

const fastify = Fastify({
  logger: true,
});

fastify.get("/bringReports", async () => {
  return await showData();
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
