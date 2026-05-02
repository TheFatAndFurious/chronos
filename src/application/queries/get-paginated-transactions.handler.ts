import { Account } from "@domain/aggregates/account.aggregate";
import { AccountNotOwnedError } from "@domain/exceptions/domain.exceptions";
import { CacheService } from "@infrastructure/cache/redis-service";
import {
  eventStore,
  IEventStore,
} from "@infrastructure/persistence/event-store";
import { DomainEvent } from "./../../domain/events/domain-events";

export interface GetPaginatedTransactionsHandler {
  accountId: string;
  userId: string;
  beforeVersion?: number;
}

export interface GetPaginatedTransactionsResult {
  paginatedEvents: DomainEvent[];
}

export class GetPaginatedTransactionsHander {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: GetPaginatedTransactionsHandler,
  ): Promise<GetPaginatedTransactionsResult> {
    const events = await this.eventStore.loadEventsPaginated(
      query.accountId,
      query.beforeVersion,
    );

    const cacheKey = `paginatedTransaction:${query.accountId}`;
    const cached = await this.cacheService.get<DomainEvent[]>(cacheKey);
    if (cached !== null) {
      return { paginatedEvents: cached };
    }

    const rehydratedAccount = Account.rehydrate(query.accountId, events);

    if (rehydratedAccount.getUserId() !== query.userId) {
      throw new AccountNotOwnedError(query.accountId, query.userId);
    }
    await this.cacheService.set({ key: cacheKey, value: events });

    return { paginatedEvents: events };
  }
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
