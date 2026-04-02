import { Account } from "@domain/aggregates/account.aggregate";
import { eventStore } from "@infrastructure/persistence/event-store";

export type GetAccountByIdQuery = {
  accountId: string;
};

export type GetAccountByIdResult = {
  account: Account;
};

export const getAccountByIdHandler = async (
  query: GetAccountByIdQuery,
): Promise<GetAccountByIdResult> => {
  const { accountId } = query;

  const events = await eventStore.loadEvents(accountId);

  const account = Account.rehydrate(accountId, events);

  return { account };
};
