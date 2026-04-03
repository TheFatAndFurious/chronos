export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid or expired refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class UnknownRefreshTokenError extends Error {
  constructor() {
    super("Refresh token doesn't exist");
    this.name = "UnknownRefreshTokenError";
  }
}

export class InsufficientFundsError extends Error {
  constructor(accountId: string, requested: number, available: number) {
    super(
      `Insufficient funds on account ${accountId}: requested ${requested}, available ${available}`,
    );
    this.name = "InsufficientFundsError";
  }
}

export class InvalidAmountError extends Error {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be a positive integer.`);
    this.name = "InvalidAmountError";
  }
}

export class OptimisticLockError extends Error {
  constructor(aggregateId: string, expectedVersion: number) {
    super(
      `Optimistic lock failed for aggregate ${aggregateId} at version ${expectedVersion}`,
    );
    this.name = "OptimisticLockError";
  }
}

export class AccountNotOwnedError extends Error {
  constructor(accountId: string, userId: string) {
    super(`Account ${accountId} is not owned by user ${userId}`);
    this.name = "AccountNotOwnedError";
  }
}
