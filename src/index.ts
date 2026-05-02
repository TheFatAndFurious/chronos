import { CacheService } from "@infrastructure/cache/redis-service";
import { SnapshotWorker } from "@infrastructure/workers/snapshot.worker";
import { RedisClient } from "bun";
import postgres from "postgres";
import { createApp } from "./app";
import { checkDatabaseConnection } from "./infrastructure/persistence/db";
import { setupDatabaseTriggers } from "./infrastructure/persistence/setup-triggers";

await checkDatabaseConnection();
console.info("[DATABASE] Connected");

await setupDatabaseTriggers();

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or TEST_DATABASE_URL environment variable is not set",
  );
}
console.log(`DATABASE UP AND RUNNING ON PORT ${databaseUrl} - WE GUCCI`);

const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";

const redis = new RedisClient(redisUrl);
const cacheService = new CacheService(redis);

const app = createApp(cacheService);
app.listen(3000);
console.log(`REDIS UP AND RUNNING ON PORT ${databaseUrl} - WE GUCCI`);

const workerConn = postgres(databaseUrl);

const snapshotWorker = new SnapshotWorker(workerConn);

snapshotWorker.start();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
