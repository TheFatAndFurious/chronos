export interface RateLimitRule {
  limit: number;
  window: number;
  keyBy: IDENTIFIERS_ENUM;
}

export enum IDENTIFIERS_ENUM {
  IP = "ip",
  USER = "user",
  IP_EMAIL = "ip-email",
}

export const rateLimitRules: Record<string, RateLimitRule> = {
  "POST:/auth/login": {
    limit: 30,
    window: 60,
    keyBy: IDENTIFIERS_ENUM.IP,
  },
  "POST:/auth/register": {
    limit: 3,
    window: 60,
    keyBy: IDENTIFIERS_ENUM.IP,
  },
  "POST:/transfers": {
    limit: 10,
    window: 60,
    keyBy: IDENTIFIERS_ENUM.USER,
  },
  default: {
    limit: 100,
    window: 60,
    keyBy: IDENTIFIERS_ENUM.USER,
  },
};

export const loginFailureRule = {
  limit: 5,
  windowSeconds: 900,
};
