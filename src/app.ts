import { Elysia } from "elysia";
import { authRoutes } from "./http/routes/auth/auth.routes";
import { loginRoutes } from "./http/routes/login/login.routes";
import { transactionsRoutes } from "./http/routes/transactions/transactions.routes";

export const app = new Elysia()
  .use(authRoutes)
  .use(loginRoutes)
  .use(transactionsRoutes);
