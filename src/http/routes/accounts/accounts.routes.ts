import Elysia, { t } from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createAccountHandler } from "../../../application/commands/create-account.handler";

export const accountsRoutes = new Elysia({ prefix: "/accounts" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user, set }) => {
      const result = await createAccountHandler({
        userId: user.userId as string,
        accountName: body.accountName,
      });

      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        accountName: t.String({ minLength: 1 }),
      }),
    },
  ).get(
    "/:id", 
    async {{ }}
  )
