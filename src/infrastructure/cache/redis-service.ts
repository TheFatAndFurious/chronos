import type { RedisClient } from "bun";

export interface SetParamsCache<T> {
  key: string;
  value: T;
  ttlSeconds?: number;
}

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

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
    console.log("[ CACHE DELETION ] ");
  }
}
