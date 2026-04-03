import { getAccountByIdHandler } from "@application/queries/get-account.handler";
import Elysia, { t } from "elysia";
import { createAccountHandler } from "../../../application/commands/accounts/create-account.handler";
import { authMiddleware } from "../../middleware/auth.middleware";

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
  )
  .get("/:id", async ({ params, set }) => {
    const result = await getAccountByIdHandler({ accountId: params.id });

    set.status = 200;
    return result;
  });
