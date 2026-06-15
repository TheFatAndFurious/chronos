import Elysia from "elysia";
import { IDENTIFIERS_ENUM, rateLimitRules } from "./rate-limiter.config";

export const rateLimiterMiddleware = new Elysia({
  name: "rate-limiter",
}).onBeforeHandle(async ({ request, path, set, store }) => {
  const method = request.method;
  const ruleKey = `${method}:${path}`;
  const rule = rateLimitRules[ruleKey] ?? rateLimitRules["default"];
  const identifier = resolveIdentifier(rule.keyBy, request, store);
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
