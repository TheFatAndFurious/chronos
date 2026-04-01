import { describe, expect, it } from "bun:test";
import { Account } from "../../../domain/aggregates/account.aggregate";

describe("Account Aggregate", () => {
  describe("create", () => {
    it("should create an account with initial balance of 0", () => {
      // Given
      const accountId = "550e8400-e29b-41d4-a716-446655440000";
      const userId = "user-123";
      const ownerName = "John Doe";

      // When
      const account = Account.create(accountId, userId, ownerName);

      // Then
      expect(account.id).toBe(accountId);
      expect(account.userId).toBe(userId);
      expect(account.ownerName).toBe(ownerName);
      expect(account.balance).toBe(0);
      expect(account.version).toBe(0);
    });

    it("should produce an AccountCreated event", () => {
      // Given
      const accountId = "550e8400-e29b-41d4-a716-446655440000";
      const userId = "user-123";
      const ownerName = "John Doe";

      // When
      const account = Account.create(accountId, userId, ownerName);

      // Then
      const events = account.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("AccountCreated");
      expect(events[0].payload).toEqual({ userId: "user-123", ownerName: "John Doe" });
    });

    it("should clear uncommitted events when requested", () => {
      // Given
      const account = Account.create("some-id", "user-456", "Jane Doe");
      expect(account.uncommittedEvents).toHaveLength(1);

      // When
      account.clearUncommittedEvents();

      // Then
      expect(account.uncommittedEvents).toHaveLength(0);
    });
  });

  describe("rehydrate", () => {
    it("should rebuild account state from events", () => {
      // Given
      const accountId = "550e8400-e29b-41d4-a716-446655440000";
      const events = [
        { type: "AccountCreated" as const, payload: { userId: "user-123", ownerName: "John Doe" } },
        {
          type: "MoneyDeposited" as const,
          payload: { amount: 10000, transactionId: "tx-1" },
        },
        {
          type: "MoneyWithdrawn" as const,
          payload: { amount: 3000, transactionId: "tx-2" },
        },
      ];

      // When
      const account = Account.rehydrate(accountId, events);

      // Then
      expect(account.id).toBe(accountId);
      expect(account.ownerName).toBe("John Doe");
      expect(account.balance).toBe(7000); // 10000 - 3000
      expect(account.version).toBe(3);
      expect(account.uncommittedEvents).toHaveLength(0);
    });

    it("should handle transfer events correctly", () => {
      // Given
      const accountId = "account-1";
      const events = [
        { type: "AccountCreated" as const, payload: { userId: "user-alice", ownerName: "Alice" } },
        {
          type: "MoneyDeposited" as const,
          payload: { amount: 50000, transactionId: "tx-1" },
        },
        {
          type: "MoneyTransferredOut" as const,
          payload: {
            amount: 15000,
            targetAccountId: "account-2",
            transferId: "tf-1",
          },
        },
        {
          type: "MoneyTransferredIn" as const,
          payload: {
            amount: 5000,
            sourceAccountId: "account-3",
            transferId: "tf-2",
          },
        },
      ];

      // When
      const account = Account.rehydrate(accountId, events);

      // Then
      expect(account.balance).toBe(40000); // 50000 - 15000 + 5000
      expect(account.version).toBe(4);
    });
  });
});
