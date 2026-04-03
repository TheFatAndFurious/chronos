import type {
  AccountCreated,
  DomainEvent,
  MoneyDeposited,
  MoneyWithdrawn,
} from "../events/domain-events";
import {
  InsufficientFundsError,
  InvalidAmountError,
} from "../exceptions/domain.exceptions";

export class Account {
  private _id: string;
  private _userId: string;
  private _accountName: string;
  private _balance: number;
  private _version: number;
  private _uncommittedEvents: DomainEvent[];

  private constructor() {
    this._id = "";
    this._userId = "";
    this._accountName = "";
    this._balance = 0;
    this._version = 0;
    this._uncommittedEvents = [];
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get accountName(): string {
    return this._accountName;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): DomainEvent[] {
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
