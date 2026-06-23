import Elysia from "elysia";
import { IDENTIFIERS_ENUM, rateLimitRules } from "./rate-limiter.config";
import {IRateLimiter} from "@application/ports/rate-limiter.port";

export const rateLimiterMiddleware = (rateLimiter: IRateLimiter) => new Elysia({
  name: "rate-limiter",
}).onBeforeHandle(async ({ request, path, set, store }) => {
  const method = request.method;
  const ruleKey = `${method}:${path}`;
  console.log("ruleKey",  ruleKey)
  const rule = rateLimitRules[ruleKey] ?? rateLimitRules["default"];
  console.log("rule",  rule)
  const identifier = resolveIdentifier(rule.keyBy, request, store);
  console.log(identifier,  "identifier")
  const redisKey = `rate${rule.keyBy}:${identifier}`;
  console.log(redisKey,  "redisKey")
  const result = await rateLimiter.checkAndIncrement(redisKey, rule.limit, rule.window);
  console.log(result,  "result")

  // headers
  set.headers['X-RateLimit-Limit'] = String(rule.limit)
  set.headers['X-RateLimit-Remaining'] = String(result.remaining)

  if (!result.allowed) {
    set.headers['Retry-After'] = String(result.retryAfterSeconds)
    set.status = 429
    return {
      error: 'Too Many Requests',
      retryAfterSeconds: result.retryAfterSeconds
    }
  }

});

function resolveIdentifier(
  keyBy: IDENTIFIERS_ENUM,
  request: Request,
  store: any,
): string {
  switch (keyBy) {
    case IDENTIFIERS_ENUM.USER:
      return store.userId ?? extractIp(request);
    case IDENTIFIERS_ENUM.IP:
      return extractIp(request);
    case IDENTIFIERS_ENUM.IP_EMAIL:
      return extractIp(request);
  }
}

function extractIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split("")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
