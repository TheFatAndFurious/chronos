import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { CacheService } from "@infrastructure/cache/redis-service";
import { IEventStore } from "@infrastructure/persistence/event-store";

export interface GetAccountBalanceQuery {
  userId: string;
  accountId: string;
}

export interface GetAccountBalanceResult {
  balance: number;
}

export class GetAccountBalanceHandler {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: GetAccountBalanceQuery,
  ): Promise<GetAccountBalanceResult> {
    const { userId, accountId } = query;

    // Check cache first
    const cacheKey = `balance:${accountId}`;
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return { balance: cached };
    }

    // Cache miss → load from events
    const events = await this.eventStore.loadEvents(accountId);
    const account = Account.rehydrate(accountId, events);

    if (account.getUserId() !== userId) {
      throw new AccountNotOwnedError(accountId, userId);
    }

    const balance = account.getBalance();

    // Cache result
    await this.cacheService.set({ key: cacheKey, value: balance });

    return { balance };
  }
}
