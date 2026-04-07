import { Account } from "@domain/aggregates/account.aggregate";
import { eventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "crypto";

export type CreateAccountCommand = {
  userId: string;
  accountName: string;
};

export type CreateAccountResult = {
  accountId: string;
};

export const createAccountHandler = async (
  command: CreateAccountCommand,
): Promise<CreateAccountResult> => {
  const { userId, accountName } = command;

  const accountId = randomUUID();

  const account = Account.create(accountId, userId, accountName);

  await eventStore.append(account.getId(), account.getUncommittedEvents(), 0);

  return { accountId };
};
