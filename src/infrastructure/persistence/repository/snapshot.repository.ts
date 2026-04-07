import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { Snapshot } from "../schemas/snapshots";
import { snapshots } from "./../schemas/snapshots";

export const snapshotRepository = {
  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const [result] = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.aggregateId, aggregateId));

    return result || null;
  },

  async createSnapshot(snapshot: Snapshot): Promise<void> {
    await db.insert(snapshots).values(snapshot).returning();
  },
  async saveSnapshot(
    aggregateId: string,
    partialSnapshot: Pick<Snapshot, "balance" | "latestVersion">,
  ): Promise<void> {
    await db
      .update(snapshots)
      .set({
        updatedAt: sql`NOW()`,
        balance: partialSnapshot.balance,
        latestVersion: partialSnapshot.latestVersion,
      })
      .where(eq(snapshots.aggregateId, aggregateId));
  },
};
