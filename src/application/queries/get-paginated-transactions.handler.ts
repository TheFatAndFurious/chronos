import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";
import { DomainEvent } from "./../../domain/events/domain-events";

export interface GetPaginatedTransactionsHandler {
  accountId: string;
  userId: string;
}

export interface GetPaginatedTransactionsResult {
  paginatedEvents: DomainEvent[];
}

export async function getPaginatedTransactionsHandler(
  query: GetPaginatedTransactionsHandler,
): Promise<GetPaginatedTransactionsResult> {
  const events = await eventStore.loadEvents(query.accountId);
  const rehydrtatedAccount = Account.rehydrate(query.accountId, events);

  if (rehydrtatedAccount.getUserId() !== query.userId) {
    throw new AccountNotOwnedError(query.accountId, query.userId);
  }

  const transactions = events.reverse().slice(0, 50);

  return { paginatedEvents: transactions };
}
