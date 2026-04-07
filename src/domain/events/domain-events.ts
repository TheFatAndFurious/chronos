export type AccountCreated = {
  type: "AccountCreated";
  payload: { userId: string; accountName: string };
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

export type TransferOutInitiated = {
  type: "TransferOutInitiated";
  payload: { amount: number; targetAccountId: string; transferId: string };
};

export type TransferOutCancelled = {
  type: "TransferOutCancelled";
  payload: { amount: number; transferId: string };
};

export type TransferCompleted = {
  type: "TransferCompleted";
  payload: { transferId: string };
};

export type DomainEvent =
  | AccountCreated
  | MoneyDeposited
  | MoneyWithdrawn
  | MoneyTransferredOut
  | MoneyTransferredIn
  | TransferOutInitiated
  | TransferCompleted
  | TransferOutCancelled;
