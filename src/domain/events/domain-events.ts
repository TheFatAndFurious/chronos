export type AccountCreated = {
  type: "AccountCreated";
  payload: { userId: string; ownerName: string };
};

export type MoneyDeposited = {
  type: "MoneyDeposited";
  payload: { amount: number; transactionId: string };
};

export type MoneyWithdrawn = {
  type: "MoneyWithdrawn";
  payload: { amount: number; transactionId: string };
};

export type MoneyTransferredOut = {
  type: "MoneyTransferredOut";
  payload: { amount: number; targetAccountId: string; transferId: string };
};

export type MoneyTransferredIn = {
  type: "MoneyTransferredIn";
  payload: { amount: number; sourceAccountId: string; transferId: string };
};

export type DomainEvent =
  | AccountCreated
  | MoneyDeposited
  | MoneyWithdrawn
  | MoneyTransferredOut
  | MoneyTransferredIn;
