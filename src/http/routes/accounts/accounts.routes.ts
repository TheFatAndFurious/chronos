import { depositHandler } from "@application/commands/accounts/deposit.handler";
import { withdrawHandler } from "@application/commands/accounts/withdraw.handler";
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
  })
  .post(
    "/deposit",
    async ({ body, set, user }) => {
      const transactionID = await depositHandler({
        accountId: body.accountId,
        amountToDeposit: body.amountToDeposit,
        userId: user.userId as string,
      });

      set.status = 200;
      return transactionID;
    },
    {
      body: t.Object({
        accountId: t.String(),
        amountToDeposit: t.Number({
          exclusiveMinimum: 0,
        }),
      }),
    },
  )
  .post(
    "/withdraw",
    async ({ body, set, user }) => {
      const transactionId = await withdrawHandler({
        accountId: body.accountId,
        amountToWithdraw: body.amountToWithdraw,
        userId: user.userId,
      });

      set.status = 200;
      return transactionId;
    },
    {
      body: t.Object({
        accountId: t.String(),
        amountToWithdraw: t.Number(),
      }),
    },
  );
