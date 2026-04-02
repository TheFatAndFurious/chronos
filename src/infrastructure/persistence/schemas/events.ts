import {
  pgTable,
  uuid,
  integer,
  varchar,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    aggregateId: uuid("aggregate_id").notNull(),
    version: integer("version").notNull(),
    type: varchar("type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("events_aggregate_version_unique").on(table.aggregateId, table.version)],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
