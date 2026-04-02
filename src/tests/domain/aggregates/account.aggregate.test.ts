import { describe, expect, it } from "bun:test";
import { Account } from "../../../domain/aggregates/account.aggregate";
import {
  InsufficientFundsError,
  InvalidAmountError,
} from "../../../domain/exceptions/domain.exceptions";

describe("Account Aggregate", () => {
  describe("create", () => {
    it("should create an account with initial balance of 0", () => {
      // Given
      const accountId = "550e8400-e29b-41d4-a716-446655440000";
      const userId = "user-123";
      const accountName = "John Doe";

      // When
      const account = Account.create(accountId, userId, accountName);

      // Then
      expect(account.id).toBe(accountId);
      expect(account.userId).toBe(userId);
      expect(account.accountName).toBe(accountName);
      expect(account.balance).toBe(0);
      expect(account.version).toBe(0);
    });

    it("should produce an AccountCreated event", () => {
      // Given
      const accountId = "550e8400-e29b-41d4-a716-446655440000";
      const userId = "user-123";
      const accountName = "John Doe";

      // When
      const account = Account.create(accountId, userId, accountName);

      // Then
      const events = account.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("AccountCreated");
      expect(events[0].payload).toEqual({ userId: "user-123", accountName: "John Doe" });
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
        { type: "AccountCreated" as const, payload: { userId: "user-123", accountName: "John Doe" } },
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
      expect(account.accountName).toBe("John Doe");
      expect(account.balance).toBe(7000); // 10000 - 3000
      expect(account.version).toBe(3);
      expect(account.uncommittedEvents).toHaveLength(0);
    });

    it("should handle transfer events correctly", () => {
      // Given
      const accountId = "account-1";
      const events = [
        { type: "AccountCreated" as const, payload: { userId: "user-alice", accountName: "Alice" } },
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

  describe("deposit", () => {
    it("should increase balance and produce MoneyDeposited event", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");
      account.clearUncommittedEvents();

      // When
      account.deposit(5000, "tx-123");

      // Then
      expect(account.balance).toBe(5000);
      const events = account.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("MoneyDeposited");
      expect(events[0].payload).toEqual({ amount: 5000, transactionId: "tx-123" });
    });

    it("should throw InvalidAmountError for zero amount", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");

      // When / Then
      expect(() => account.deposit(0, "tx-123")).toThrow(InvalidAmountError);
    });

    it("should throw InvalidAmountError for negative amount", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");

      // When / Then
      expect(() => account.deposit(-100, "tx-123")).toThrow(InvalidAmountError);
    });

    it("should throw InvalidAmountError for non-integer amount", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");

      // When / Then
      expect(() => account.deposit(50.5, "tx-123")).toThrow(InvalidAmountError);
    });
  });

  describe("withdraw", () => {
    it("should decrease balance and produce MoneyWithdrawn event", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");
      account.deposit(10000, "tx-1");
      account.clearUncommittedEvents();

      // When
      account.withdraw(3000, "tx-2");

      // Then
      expect(account.balance).toBe(7000);
      const events = account.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("MoneyWithdrawn");
      expect(events[0].payload).toEqual({ amount: 3000, transactionId: "tx-2" });
    });

    it("should throw InsufficientFundsError when balance is too low", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");
      account.deposit(1000, "tx-1");

      // When / Then
      expect(() => account.withdraw(2000, "tx-2")).toThrow(InsufficientFundsError);
    });

    it("should throw InvalidAmountError for zero amount", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");

      // When / Then
      expect(() => account.withdraw(0, "tx-123")).toThrow(InvalidAmountError);
    });

    it("should throw InvalidAmountError for negative amount", () => {
      // Given
      const account = Account.create("acc-1", "user-1", "John");

      // When / Then
      expect(() => account.withdraw(-100, "tx-123")).toThrow(InvalidAmountError);
    });
  });
});
