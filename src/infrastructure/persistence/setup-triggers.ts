import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Sets up custom database triggers and functions required for event sourcing.
 * This script is idempotent - safe to run multiple times.
 */
export async function setupDatabaseTriggers(): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION notify_snapshot_needed()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.version % 100 = 0 THEN
        PERFORM pg_notify('snapshot_needed', NEW.aggregate_id::text);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await db.execute(sql`
    DROP TRIGGER IF EXISTS after_event_insert ON events;
  `);

  await db.execute(sql`
    CREATE TRIGGER after_event_insert
      AFTER INSERT ON events
      FOR EACH ROW
      EXECUTE FUNCTION notify_snapshot_needed();
  `);

  console.log("[DATABASE] Triggers and functions configured");
}
