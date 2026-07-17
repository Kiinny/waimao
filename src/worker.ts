import { run, type TaskList } from "graphile-worker";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const taskList: TaskList = {
  health_check: async (_payload, helpers) => {
    helpers.logger.info("Background worker health check completed");
  },
};

const runner = await run({
  connectionString,
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  pollInterval: 1000,
  taskList,
});

await runner.promise;
