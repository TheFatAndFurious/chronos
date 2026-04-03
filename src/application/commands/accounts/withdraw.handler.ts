import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "node:crypto";

export type WithdrawCommand = {
  accountId: string;
  amountToWithdraw: number;
  userId: string;
};

export type WithdrawResult = {
  transactionId: string;
};

export const withdrawHandler = async (
  command: WithdrawCommand,
): Promise<WithdrawResult> => {
  const { accountId, amountToWithdraw, userId } = command;

  const events = await eventStore.loadEvents(accountId);

  const rehydratedAccount = Account.rehydrate(accountId, events);

  if (rehydratedAccount.userId !== userId) {
    throw new AccountNotOwnedError(accountId, rehydratedAccount.userId);
  }

  const transactionId = randomUUID();

  rehydratedAccount.withdraw(amountToWithdraw, transactionId);

  eventStore.append(
    rehydratedAccount.id,
    rehydratedAccount.uncommittedEvents,
    rehydratedAccount.version,
  );

  return { transactionId };
};
