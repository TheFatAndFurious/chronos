import type {
  AccountCreated,
  DomainEvent,
  MoneyDeposited,
  MoneyTransferredIn,
  MoneyWithdrawn,
  TransferCompleted,
  TransferOutCancelled,
  TransferOutInitiated,
} from "../events/domain-events";
import {
  InsufficientFundsError,
  InvalidAmountError,
  TransferErrorException,
} from "../exceptions/domain.exceptions";

export class Account {
  private _id: string;
  private _userId: string;
  private _accountName: string;
  private _balance: number;
  private _version: number;
  private _uncommittedEvents: DomainEvent[];
  // private _status: "active" | "closed" = "active";
  private _pendingTransfers: Map<string, number>;

  private constructor() {
    this._id = "";
    this._userId = "";
    this._accountName = "";
    this._balance = 0;
    this._version = 0;
    this._uncommittedEvents = [];
    this._pendingTransfers = new Map();
  }

  getId(): string {
    return this._id;
  }

  getUserId(): string {
    return this._userId;
  }

  getBalance(): number {
    return this._balance;
  }

  getAccountName(): string {
    return this._accountName;
  }

  getVersion(): number {
    return this._version;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }

  static create(id: string, userId: string, accountName: string): Account {
    const account = new Account();
    account._id = id;

    const event: AccountCreated = {
      type: "AccountCreated",
      payload: { userId, accountName },
    };

    account.apply(event);
    account._uncommittedEvents.push(event);

    return account;
  }

  static rehydrate(id: string, events: DomainEvent[]): Account {
    const account = new Account();
    account._id = id;

    for (const event of events) {
      account.apply(event);
      account._version++;
    }

    return account;
  }

  deposit(amount: number, transactionId: string): void {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new InvalidAmountError(amount);
    }

    const event: MoneyDeposited = {
      type: "MoneyDeposited",
      payload: { amount, transactionId },
    };

    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  transferIn(
    amount: number,
    transferId: string,
    sourceAccountId: string,
  ): void {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new InvalidAmountError(amount);
    }

    const event: MoneyTransferredIn = {
      type: "MoneyTransferredIn",
      payload: { amount, transferId, sourceAccountId },
    };

    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  initiateTransferOut(
    amount: number,
    transferId: string,
    targetAccountId: string,
  ): void {
    console.log("🚀 ~ Account ~ initiateTransferOut ~ transferId:", transferId);
    console.log("🚀 ~ Account ~ initiateTransferOut ~ amount:", amount);
    if (amount <= 0) {
      throw new InvalidAmountError(amount);
    }

    if (amount > this._balance) {
      throw new InsufficientFundsError(this._id, amount, this._balance);
    }

    const event: TransferOutInitiated = {
      type: "TransferOutInitiated",
      payload: { amount, transferId, targetAccountId },
    };

    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  cancelTransferOut(transferId: string): void {
    console.log(this._pendingTransfers);
    if (!this._pendingTransfers.has(transferId)) {
      throw new TransferErrorException(this._id);
    }
    const event: TransferOutCancelled = {
      type: "TransferOutCancelled",
      payload: {
        amount: this._pendingTransfers.get(transferId)!,
        transferId: transferId,
      },
    };
    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  completeTransferOut(transferId: string): void {
    const event: TransferCompleted = {
      type: "TransferCompleted",
      payload: {
        transferId: transferId,
      },
    };
    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  withdraw(amount: number, transactionId: string): void {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new InvalidAmountError(amount);
    }

    if (amount > this._balance) {
      throw new InsufficientFundsError(this._id, amount, this._balance);
    }

    const event: MoneyWithdrawn = {
      type: "MoneyWithdrawn",
      payload: { amount, transactionId },
    };

    this.apply(event);
    this._uncommittedEvents.push(event);
  }

  private apply(event: DomainEvent): void {
    switch (event.type) {
      case "TransferOutInitiated":
        this._balance -= event.payload.amount;
        this._pendingTransfers.set(
          event.payload.transferId,
          event.payload.amount,
        );
        break;
      case "TransferOutCancelled":
        this._balance += event.payload.amount;
        this._pendingTransfers.delete(event.payload.transferId);
        break;
      case "TransferCompleted":
        this._pendingTransfers.delete(event.payload.transferId);
        break;
      case "AccountCreated":
        this._userId = event.payload.userId;
        this._accountName = event.payload.accountName;
        this._balance = 0;
        break;
      case "MoneyDeposited":
        this._balance += event.payload.amount;
        break;
      case "MoneyWithdrawn":
        this._balance -= event.payload.amount;
        break;
      case "MoneyTransferredOut":
        this._balance -= event.payload.amount;
        break;
      case "MoneyTransferredIn":
        this._balance += event.payload.amount;
        break;
    }
  }
}
