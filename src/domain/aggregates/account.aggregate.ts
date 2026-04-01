import type { DomainEvent, AccountCreated } from "../events/domain-events";

export class Account {
  private _id: string;
  private _userId: string;
  private _ownerName: string;
  private _balance: number;
  private _version: number;
  private _uncommittedEvents: DomainEvent[];

  private constructor() {
    this._id = "";
    this._userId = "";
    this._ownerName = "";
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

  get ownerName(): string {
    return this._ownerName;
  }

  get balance(): number {
    return this._balance;
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

  static create(id: string, userId: string, ownerName: string): Account {
    const account = new Account();
    account._id = id;

    const event: AccountCreated = {
      type: "AccountCreated",
      payload: { userId, ownerName },
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

  private apply(event: DomainEvent): void {
    switch (event.type) {
      case "AccountCreated":
        this._userId = event.payload.userId;
        this._ownerName = event.payload.ownerName;
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
