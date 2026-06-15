export type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

export interface IRateLimiter {
    checkAndIncrement(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;

    reset(key: string): Promise<void>;
}