import { Elysia } from "elysia";
import { authRoutes } from "./http/routes/auth/auth.routes";
import { loginRoutes } from "./http/routes/login/login.routes";
import { transactionsRoutes } from "./http/routes/transactions/transactions.routes";
import { accountsRoutes } from "./http/routes/accounts/accounts.routes";

export const app = new Elysia()
  .use(authRoutes)
  .use(loginRoutes)
  .use(transactionsRoutes)
  .use(accountsRoutes);
