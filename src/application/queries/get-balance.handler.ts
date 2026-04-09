export interface GetAccountBalanceQuery {
  userId: string;
  accountId: string;
}

export interface GetAccountBalanceResult {
  balance: number;
}

export function getAccountBalanceHandler(
  query: GetAccountBalanceQuery,
): Promise<GetAccountBalanceResult> {}
