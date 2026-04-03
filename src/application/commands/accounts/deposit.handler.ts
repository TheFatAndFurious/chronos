import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { eventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "node:crypto";

export type DepositCommand = {
  accountId: string;
  amountToDeposit: number;
  userId: string;
};

export type DepositResult = {
  transactionId: string;
};

export const DepositHandler = async (
  command: DepositCommand,
): Promise<DepositResult> => {
  const { accountId, amountToDeposit, userId } = command;
  const events = await eventStore.loadEvents(accountId);

  const rehydratedAccount = Account.rehydrate(accountId, events);

  if (rehydratedAccount.userId !== userId) {
    throw new AccountNotOwnedError(accountId, rehydratedAccount.userId);
  }

  const transactionId = randomUUID();

  rehydratedAccount.deposit(amountToDeposit, transactionId);

  eventStore.append(
    rehydratedAccount.id,
    rehydratedAccount.uncommittedEvents,
    rehydratedAccount.version,
  );

  return { transactionId };
};
