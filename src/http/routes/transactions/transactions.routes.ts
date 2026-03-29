import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";

export const transactionsRoutes = new Elysia({ prefix: "/transactions" })
  .use(authMiddleware)
  .get("/test", async () => {
    return { message: "This is a protected route and you're in my man!!" };
  });
