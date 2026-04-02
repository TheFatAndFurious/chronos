import { eq, asc } from "drizzle-orm";
import { db } from "./db";
import { events } from "./schemas/events";
import type { DomainEvent } from "../../domain/events/domain-events";
import { OptimisticLockError } from "../../domain/exceptions/domain.exceptions";

function isUniqueViolation(error: unknown): boolean {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: Error }).cause;
    if (cause) {
      const causeStr = String(cause);
      return (
        causeStr.includes("23505") ||
        causeStr.includes("duplicate key") ||
        causeStr.includes("events_aggregate_version_unique")
      );
    }
  }
  return false;
}

export interface EventStore {
  loadEvents(aggregateId: string): Promise<DomainEvent[]>;
  append(
    aggregateId: string,
    newEvents: DomainEvent[],
    expectedVersion: number,
  ): Promise<void>;
}

export const eventStore: EventStore = {
  async loadEvents(aggregateId: string): Promise<DomainEvent[]> {
    const rows = await db
      .select()
      .from(events)
      .where(eq(events.aggregateId, aggregateId))
      .orderBy(asc(events.version));

    return rows.map((row) => ({
      type: row.type,
      payload: row.payload,
    })) as DomainEvent[];
  },

  async append(
    aggregateId: string,
    newEvents: DomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (newEvents.length === 0) {
      return;
    }

    const eventRecords = newEvents.map((event, index) => ({
      aggregateId,
      version: expectedVersion + index + 1,
      type: event.type,
      payload: event.payload,
    }));

    try {
      await db.insert(events).values(eventRecords);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new OptimisticLockError(aggregateId, expectedVersion);
      }
      throw error;
    }
  },
};
