import { Elysia } from "elysia";
import { authRoutes } from "./http/routes/auth/auth.routes";
import { loginRoutes } from "./http/routes/login/login.routes";

import { CacheService } from "@infrastructure/cache/redis-service";
import { accountsRoutes } from "./http/routes/accounts/accounts.routes";

export const createApp = (cacheService: CacheService) => {
  return new Elysia()
    .use(authRoutes)
    .use(loginRoutes)
    .use(accountsRoutes(cacheService));
};
