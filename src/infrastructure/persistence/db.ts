import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or TEST_DATABASE_URL environment variable is not set",
  );
}

const client = postgres(databaseUrl);

export const db = drizzle(client);
