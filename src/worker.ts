import { run, type TaskList } from "graphile-worker";

import { PrismaReminderRepository } from "@/modules/management/prisma-reminder-repository";
import { processReminderCandidates } from "@/modules/management/reminders";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const taskList: TaskList = {
  health_check: async (_payload, helpers) => {
    helpers.logger.info("Background worker health check completed");
  },
  generate_management_reminders: async (_payload, helpers) => {
    const result = await processReminderCandidates(
      new PrismaReminderRepository(),
    );
    helpers.logger.info(
      `Management reminders scanned=${result.scanned} created=${result.created}`,
    );
  },
};

const runner = await run({
  connectionString,
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  pollInterval: 1000,
  crontab:
    process.env.WORKER_CRONTAB ??
    "*/15 * * * * generate_management_reminders",
  taskList,
});

await runner.promise;
