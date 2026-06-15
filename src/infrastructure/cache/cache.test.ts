import { RedisClient } from "bun";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { CacheService } from "./redis-service";

describe("RedisCache", () => {
  let redis: RedisClient;
  let cache: CacheService;

  beforeAll(async () => {
    redis = new RedisClient("redis://localhost:6380");
    await redis.connect();
    cache = new CacheService(redis);
  });

  afterEach(async () => {
    await redis.send("FLUSHDB", []);
  });

  afterAll(() => {
    redis.close();
  });

  it("should return null for non existent key", async () => {
    // GIVEN
    const key = "12";

    // WHEN
    const result = await cache.get<number>(key);

    // THEN
    expect(result).toBeNull();
  });

  it("should return a value for an existent key", async () => {
    // GIVEN
    const key = "123";
    const value = 5000;
    const cacheInput = {
      key,
      value,
    };

    await cache.set(cacheInput);

    // WHEN
    const result = await cache.get<number>(key);

    // THEN
    expect(result).toBe(5000);
  });

  it("should delete a existing value", async () => {
    // GIVEN
    const key = "123";
    const value = 5000;
    const cacheInput = {
      key,
      value,
    };

    await cache.set(cacheInput);

    // WHEN
    const result = await cache.get<number>(key);

    expect(result).toBe(value);

    await cache.invalidateAccount(key);

    const deletedResult = await cache.get<number>(key);

    // THEN
    expect(deletedResult).toBeNull();
  });
});
