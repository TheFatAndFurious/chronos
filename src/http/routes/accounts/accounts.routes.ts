import { createAccountHandler } from "@application/commands/accounts/create-account.handler";
import { depositHandler } from "@application/commands/accounts/deposit.handler";
import { withdrawHandler } from "@application/commands/accounts/withdraw.handler";
import { getAccountByIdHandler } from "@application/queries/get-account.handler";
import { getAccountBalanceHandler } from "@application/queries/get-balance.handler";
import { getPaginatedTransactionsHandler } from "@application/queries/get-paginated-transactions.handler";
import { TranferSaga } from "@application/sagas/transfer.saga";
import { authMiddleware } from "@http/middleware/auth.middleware";
import { eventStore } from "@infrastructure/persistence/event-store";
import Elysia, { t } from "elysia";

export const accountsRoutes = new Elysia({ prefix: "/accounts" })
  .use(authMiddleware)
  .get("/:id/balance", async ({ user, set, params }) => {
    const result = await getAccountBalanceHandler({
      userId: user.userId as string,
      accountId: params.id,
    });

    set.status = 200;
    return result;
  })
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
  .get(
    "/:id/transactions",
    async ({ params, user, set, query }) => {
      const result = await getPaginatedTransactionsHandler({
        accountId: params.id,
        beforeVersion: query.before,
        userId: user.userId as string,
      });
      set.status = 200;
      return result;
    },
    {
      query: t.Object({
        before: t.Optional(t.Numeric()),
      }),
    },
  )
  .get("/:id", async ({ params, set }) => {
    const result = await getAccountByIdHandler({ accountId: params.id });

    set.status = 200;
    return result;
  })
  .post(
    "/:id/deposit",
    async ({ body, set, user, params }) => {
      const transactionID = await depositHandler({
        accountId: params.id,
        amountToDeposit: body.amountToDeposit,
        userId: user.userId as string,
      });

      set.status = 200;
      return transactionID;
    },
    {
      body: t.Object({
        amountToDeposit: t.Number({
          exclusiveMinimum: 0,
        }),
      }),
    },
  )
  .post(
    "/:id/withdraw",
    async ({ body, set, user, params }) => {
      const transactionId = await withdrawHandler({
        accountId: params.id,
        amountToWithdraw: body.amountToWithdraw,
        userId: user.userId as string,
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
  )
  .post(
    "/transfer",
    async ({ body, set, user }) => {
      const saga = new TranferSaga(eventStore);
      const result = await saga.execute({
        accountFrom: body.accountFrom,
        accountTo: body.accountTo,
        amountToTransfer: body.amountToTransfer,
        userId: user.userId as string,
      });

      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        accountFrom: t.String(),
        accountTo: t.String(),
        amountToTransfer: t.Number({
          exclusiveMinimum: 0,
        }),
      }),
    },
  );
