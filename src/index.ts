import { SnapshotWorker } from "@infrastructure/workers/snapshot.worker";
import postgres from "postgres";
import { app } from "./app";
import { checkDatabaseConnection } from "./infrastructure/persistence/db";
import { setupDatabaseTriggers } from "./infrastructure/persistence/setup-triggers";

await checkDatabaseConnection();
console.info("[DATABASE] Connected");

await setupDatabaseTriggers();
app.listen(3000);

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or TEST_DATABASE_URL environment variable is not set",
  );
}

const workerConn = postgres(databaseUrl);

const snapshotWorker = new SnapshotWorker(workerConn);

snapshotWorker.start();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
