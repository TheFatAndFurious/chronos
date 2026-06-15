import type { RedisClient } from "bun";

export interface SetParamsCache<T> {
  key: string;
  value: T;
  ttlSeconds?: number;
}

export const CacheKeys = {
  balance: (accountId: string) => `balance:${accountId}`,
  transactions: (accountId: string, page: number) =>
    `transactions:${accountId}:${page}`,
  transactionsPattern: (accountId: string) => `transactions:${accountId}:*`,
};

export class CacheService {
  constructor(private readonly redis: RedisClient) {}

  async set<T>(params: SetParamsCache<T>): Promise<void> {
    const { key, value, ttlSeconds } = params;
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized);
      console.log("[ CACHE SET ] ");
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds);
      }
    } catch (error) {
      console.error(`ERROR TRYING TO CACHE KEY ${key}`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (value === null) {
      console.log("[ CACHE MISS ] ");

      return null;
    }
    console.log("[ CACHE HIT ] ");

    return JSON.parse(value) as T;
  }

  async invalidateAccount(accountId: string): Promise<void> {
    await Promise.all([
      this._deleteByPattern(CacheKeys.transactionsPattern(accountId)),
      this.redis.del(CacheKeys.balance(accountId)),
    ]);
  }

  private async _deleteByPattern(pattern: string): Promise<void> {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }
}
