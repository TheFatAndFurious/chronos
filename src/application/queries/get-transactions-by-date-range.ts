import { Account } from "@domain/aggregates/account.aggregate";
import { DomainEvent } from "@domain/events/domain-events";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";

export interface GetTransactionsByDateRangeQuery {
  aggregateId: string;
  startDate: Date;
  endDate: Date;
  userId: string;
}

export interface GetTransactionsByDateRangeResult {
  transactions: DomainEvent[];
}

async function getTransactionsByDateRangeHandler(
  query: GetTransactionsByDateRangeQuery,
): Promise<DomainEvent[]> {
  const events = await eventStore.loadEventsByDate(
    query.aggregateId,
    query.startDate,
    query.endDate,
  );

  const rehydratedAccount = Account.rehydrate(query.aggregateId, events);

  if (rehydratedAccount.getUserId() !== query.userId) {
    throw new AccountNotOwnedError(
      rehydratedAccount.getUserId(),
      query.aggregateId,
    );
  }

  return events;
}
