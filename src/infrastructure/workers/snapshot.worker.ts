import { Account } from "@domain/aggregates/account.aggregate";
import { eventStore } from "@infrastructure/persistence/event-store";
import { snapshotRepository } from "@infrastructure/persistence/repository/snapshot.repository";
import { Snapshot } from "@infrastructure/persistence/schemas/snapshots";
import postgres from "postgres";

export class SnapshotWorker {
  constructor(private readonly conn: postgres.Sql) {}

  async start() {
    await this.conn.listen(
      "snapshot_needed",
      async (aggregateId) => {
        try {
          await this.createSnapshot(aggregateId);
        } catch (error) {
          console.error(
            `ERROR CREATING THE SNAPSHOT FOR AGGREGATE ${aggregateId}`,
            error,
          );
        }
      },
      () => console.log("worker started"),
    );
  }
  private async createSnapshot(aggregatedId: string): Promise<void> {
    console.debug(`snapshot has been triggered for aggregate ${aggregatedId}`);
    try {
      const latestSnapshot = await snapshotRepository.getSnapshot(aggregatedId);

      const versionToReconstructFrom = latestSnapshot?.latestVersion ?? null;

      if (versionToReconstructFrom && latestSnapshot?.balance) {
        const newEvents = await eventStore.getEventsFromVersion(
          aggregatedId,
          versionToReconstructFrom,
        );
        if (newEvents.length === 0) return;
        const account = Account.rehydrate(aggregatedId, newEvents);
        await snapshotRepository.saveSnapshot(aggregatedId, {
          latestVersion: account.getVersion(),
          balance: account.getBalance() + latestSnapshot?.balance,
        });
      } else {
        const events = await eventStore.loadEvents(aggregatedId);
        if (events.length === 0) return;
        const account = Account.rehydrate(aggregatedId, events);
        const snapshot: Snapshot = {
          id: account.getId(),
          latestVersion: account.getVersion(),
          balance: account.getBalance(),
          aggregateId: aggregatedId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        snapshotRepository.createSnapshot(snapshot);
      }
    } catch (error) {
      console.error(
        `Could not fetch events for aggregated ${aggregatedId}`,
        error,
      );
    }
  }

  private async catchUp() {}

  async stop() {
    await this.conn.end();
    console.log("[DATABASE] - CONNECTION CLOSED FOR WORKER");
  }
}
