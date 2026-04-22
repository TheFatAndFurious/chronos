import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";
import { DomainEvent } from "./../../domain/events/domain-events";

export interface GetPaginatedTransactionsHandler {
  accountId: string;
  userId: string;
  beforeVersion?: number;
}

export interface GetPaginatedTransactionsResult {
  paginatedEvents: DomainEvent[];
}

export async function getPaginatedTransactionsHandler(
  query: GetPaginatedTransactionsHandler,
): Promise<GetPaginatedTransactionsResult> {
  const events = await eventStore.loadEventsPaginated(
    query.accountId,
    query.beforeVersion,
  );

  const rehydratedAccount = Account.rehydrate(query.accountId, events);

  if (rehydratedAccount.getUserId() !== query.userId) {
    throw new AccountNotOwnedError(query.accountId, query.userId);
  }

  return { paginatedEvents: events };
}
