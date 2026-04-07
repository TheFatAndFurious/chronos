import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const snapshots = pgTable("snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  latestVersion: integer("latest_version").notNull(),
  balance: integer("balance").notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
