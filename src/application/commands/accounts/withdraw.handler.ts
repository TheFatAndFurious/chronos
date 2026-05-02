import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { CacheService } from "@infrastructure/cache/redis-service";
import { IEventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "node:crypto";

export type WithdrawCommand = {
  accountId: string;
  amountToWithdraw: number;
  userId: string;
};

export type WithdrawResult = {
  transactionId: string;
};

export class WithdrawHandler {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly cacheService: CacheService,
  ) {}

  async execute(command: WithdrawCommand): Promise<WithdrawResult> {
    const { accountId, amountToWithdraw, userId } = command;

    const events = await this.eventStore.loadEvents(accountId);

    const rehydratedAccount = Account.rehydrate(accountId, events);

    if (rehydratedAccount.getUserId() !== userId) {
      throw new AccountNotOwnedError(accountId, rehydratedAccount.getUserId());
    }

    const transactionId = randomUUID();

    rehydratedAccount.withdraw(amountToWithdraw, transactionId);

    await this.eventStore.append(
      rehydratedAccount.getId(),
      rehydratedAccount.getUncommittedEvents(),
      rehydratedAccount.getVersion(),
    );

    await this.cacheService.delete(`balance:${accountId}`);

    return { transactionId };
  }
}
