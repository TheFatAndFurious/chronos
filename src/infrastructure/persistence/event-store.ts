import { DomainEvent } from "@domain/events/domain-events";
import { and, asc, eq, gt } from "drizzle-orm";
import { OptimisticLockError } from "../../domain/exceptions/domain.exceptions";
import { db } from "./db";
import { events } from "./schemas/events";

export interface IEventStore {
  loadEvents(aggregateId: string): Promise<DomainEvent[]>;
  append(
    aggregateId: string,
    newEvents: DomainEvent[],
    expectedVersion: number,
  ): Promise<void>;
  getEventsFromVersion(
    aggregateId: string,
    version: number,
  ): Promise<DomainEvent[]>;
}

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

export const eventStore = {
  async getEventsFromVersion(
    aggregateId: string,
    versionNumber: number,
  ): Promise<DomainEvent[]> {
    const rows = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.aggregateId, aggregateId),
          gt(events.version, versionNumber),
        ),
      )
      .orderBy(asc(events.version));

    return rows.map((row) => ({
      type: row.type,
      payload: row.payload,
    })) as DomainEvent[];
  },

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
