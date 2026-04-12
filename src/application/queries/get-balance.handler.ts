import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";

export interface GetAccountBalanceQuery {
  userId: string;
  accountId: string;
}

export interface GetAccountBalanceResult {
  balance: number;
}

export async function getAccountBalanceHandler(
  query: GetAccountBalanceQuery,
): Promise<GetAccountBalanceResult> {
  const { userId, accountId } = query;

  const events = await eventStore.loadEvents(accountId);

  const account = Account.rehydrate(accountId, events);

  if (account.getUserId() !== userId) {
    throw new AccountNotOwnedError(accountId, userId);
  }

  return { balance: account.getBalance() };
}
