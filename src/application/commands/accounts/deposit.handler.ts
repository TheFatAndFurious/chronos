import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { CacheKeys, CacheService } from "@infrastructure/cache/redis-service";
import { IEventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "node:crypto";

export type DepositCommand = {
  accountId: string;
  amountToDeposit: number;
  userId: string;
};

export type DepositResult = {
  transactionId: string;
};

export class DepositHandler {
  constructor(
    private readonly cacheService: CacheService,
    private readonly eventStore: IEventStore,
  ) {}

  async execute(command: DepositCommand): Promise<DepositResult> {
    const { accountId, amountToDeposit, userId } = command;
    const events = await this.eventStore.loadEvents(accountId);

    const rehydratedAccount = Account.rehydrate(accountId, events);

    if (rehydratedAccount.getUserId() !== userId) {
      throw new AccountNotOwnedError(accountId, rehydratedAccount.getUserId());
    }

    const transactionId = randomUUID();

    rehydratedAccount.deposit(amountToDeposit, transactionId);

    await this.eventStore.append(
      rehydratedAccount.getId(),
      rehydratedAccount.getUncommittedEvents(),
      rehydratedAccount.getVersion(),
    );

    await this.cacheService.invalidateAccount(CacheKeys.balance(accountId));

    return { transactionId };
  }
}
