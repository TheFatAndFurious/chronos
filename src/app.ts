import { Elysia } from "elysia";
import { authRoutes } from "./http/routes/auth/auth.routes";
import { loginRoutes } from "./http/routes/login/login.routes";

import { IRateLimiter } from "@application/ports/rate-limiter.port";
import { CacheService } from "@infrastructure/cache/redis-service";
import { accountsRoutes } from "./http/routes/accounts/accounts.routes";
import {registerRoute} from "@http/routes/register/register.routes";
import {instrumentation} from "./instrumentation";

export const createApp = (
  cacheService: CacheService,
  rateLimiter: IRateLimiter,
) => {
  return new Elysia()
      .use(instrumentation)
    .use(authRoutes)
    .use(loginRoutes(rateLimiter))
    .use(accountsRoutes(cacheService))
    .use(registerRoute)
};
