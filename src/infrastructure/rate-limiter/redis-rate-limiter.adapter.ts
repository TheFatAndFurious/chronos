// Script Lua pour atomicité des opérations
import {RedisClient} from "bun";
import {IRateLimiter, RateLimitResult} from "@application/ports/rate-limiter.port";
import {Promise} from "@sinclair/typebox";

const RATE_LIMITER_LUA_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
`

export class RedisRateLimiterAdapter implements IRateLimiter {
    constructor(private readonly redis: RedisClient) {
    }

    async checkAndIncrement(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {

        const result = await this.redis.send('EVAL', [
            RATE_LIMITER_LUA_SCRIPT,
            '1',           // numkeys — en string
            key,           // KEYS[1]
            String(windowSeconds)  // ARGV[1]
        ])

        const [current, ttl] = result

        return {
            allowed: current <= limit,
            remaining: Math.max(0, limit - current),
            retryAfterSeconds: ttl
        }
    }

    async reset(key: string): Promise<void> {
        await this.redis.ttl(key)
    }

}