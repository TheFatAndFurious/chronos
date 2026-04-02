import { afterEach, describe, expect, it } from "bun:test";
import { eventStore } from "../../../infrastructure/persistence/event-store";
import { cleanupDatabase } from "../../setup";
import { OptimisticLockError } from "../../../domain/exceptions/domain.exceptions";
import type { DomainEvent } from "../../../domain/events/domain-events";

describe("EventStore", () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  describe("append", () => {
    it("should append events with correct versions", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";
      const events: DomainEvent[] = [
        { type: "AccountCreated", payload: { userId: "user-1", accountName: "John" } },
      ];

      // When
      await eventStore.append(aggregateId, events, 0);

      // Then
      const loaded = await eventStore.loadEvents(aggregateId);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].type).toBe("AccountCreated");
    });

    it("should append multiple events in sequence", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";

      // When
      await eventStore.append(
        aggregateId,
        [{ type: "AccountCreated", payload: { userId: "user-1", accountName: "John" } }],
        0,
      );
      await eventStore.append(
        aggregateId,
        [{ type: "MoneyDeposited", payload: { amount: 5000, transactionId: "tx-1" } }],
        1,
      );

      // Then
      const loaded = await eventStore.loadEvents(aggregateId);
      expect(loaded).toHaveLength(2);
      expect(loaded[0].type).toBe("AccountCreated");
      expect(loaded[1].type).toBe("MoneyDeposited");
    });

    it("should throw OptimisticLockError on version conflict", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";
      await eventStore.append(
        aggregateId,
        [{ type: "AccountCreated", payload: { userId: "user-1", accountName: "John" } }],
        0,
      );

      // When / Then - trying to append with same expected version
      await expect(
        eventStore.append(
          aggregateId,
          [{ type: "MoneyDeposited", payload: { amount: 1000, transactionId: "tx-1" } }],
          0, // wrong version, should be 1
        ),
      ).rejects.toThrow(OptimisticLockError);
    });

    it("should do nothing when appending empty events array", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";

      // When
      await eventStore.append(aggregateId, [], 0);

      // Then
      const loaded = await eventStore.loadEvents(aggregateId);
      expect(loaded).toHaveLength(0);
    });
  });

  describe("loadEvents", () => {
    it("should return empty array for non-existent aggregate", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";

      // When
      const events = await eventStore.loadEvents(aggregateId);

      // Then
      expect(events).toHaveLength(0);
    });

    it("should return events in order by version", async () => {
      // Given
      const aggregateId = "550e8400-e29b-41d4-a716-446655440000";
      await eventStore.append(
        aggregateId,
        [
          { type: "AccountCreated", payload: { userId: "user-1", accountName: "John" } },
          { type: "MoneyDeposited", payload: { amount: 5000, transactionId: "tx-1" } },
          { type: "MoneyWithdrawn", payload: { amount: 2000, transactionId: "tx-2" } },
        ],
        0,
      );

      // When
      const events = await eventStore.loadEvents(aggregateId);

      // Then
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe("AccountCreated");
      expect(events[1].type).toBe("MoneyDeposited");
      expect(events[2].type).toBe("MoneyWithdrawn");
    });

    it("should only return events for the specified aggregate", async () => {
      // Given
      const aggregateId1 = "550e8400-e29b-41d4-a716-446655440001";
      const aggregateId2 = "550e8400-e29b-41d4-a716-446655440002";

      await eventStore.append(
        aggregateId1,
        [{ type: "AccountCreated", payload: { userId: "user-1", accountName: "John" } }],
        0,
      );
      await eventStore.append(
        aggregateId2,
        [{ type: "AccountCreated", payload: { userId: "user-2", accountName: "Jane" } }],
        0,
      );

      // When
      const events1 = await eventStore.loadEvents(aggregateId1);
      const events2 = await eventStore.loadEvents(aggregateId2);

      // Then
      expect(events1).toHaveLength(1);
      expect(events1[0].payload).toEqual({ userId: "user-1", accountName: "John" });
      expect(events2).toHaveLength(1);
      expect(events2[0].payload).toEqual({ userId: "user-2", accountName: "Jane" });
    });
  });
});
