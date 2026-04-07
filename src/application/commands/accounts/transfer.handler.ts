export type TransferCommand = {
  amountToTransfer: number;
  accountFrom: string;
  accountTo: string;
  userId: string;
};

export type TransferResult = {
  transactionId: string;
};

// export const transferHandler = (
//   command: TransferCommand,
// ): Promise<TransferResult> => {};
