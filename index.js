import "dotenv/config";

import Cors from "@fastify/cors";
import Fastify from "fastify";
import { makeMetricsFromDate } from "./src/metrics.mjs";
import { showData } from "./src/reports.mjs";

const fastify = Fastify({
  logger: true,
});

fastify.register(Cors, {
  origin: "*",
});

fastify.get("/bringReports", async () => {
  return showData();
});

fastify.get("/bringReportDay", async (req) => {
  const date = req.query.date;
  return makeMetricsFromDate(date);
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
