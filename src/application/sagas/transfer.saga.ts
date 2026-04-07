import {
  TransferCommand,
  TransferResult,
} from "@application/commands/accounts/transfer.handler";
import { Account } from "@domain/aggregates/account.aggregate";
import { TransferErrorException } from "@domain/exceptions/domain.exceptions";
import { IEventStore } from "@infrastructure/persistence/event-store";
import { randomUUID } from "node:crypto";
export class TranferSaga {
  constructor(private readonly eventStore: IEventStore) {}

  async execute(command: TransferCommand): Promise<TransferResult> {
    const transactionId = randomUUID();
    // 1 - prelevement sur le compte source
    const { accountFrom, accountTo, amountToTransfer } = command;
    const sourceEvents = await this.eventStore.loadEvents(command.accountFrom);
    const source = Account.rehydrate(accountFrom, sourceEvents);

    source.initiateTransferOut(amountToTransfer, transactionId, accountTo);

    await this.eventStore.append(
      accountFrom,
      source.getUncommittedEvents(),
      source.getVersion(),
    );

    // crediter le compte cible
    try {
      const events = await this.eventStore.loadEvents(accountTo);
      const target = Account.rehydrate(accountTo, events);
      target.transferIn(amountToTransfer, transactionId, accountFrom);
      await this.eventStore.append(
        accountTo,
        target.getUncommittedEvents(),
        target.getVersion(),
      );
    } catch (error) {
      const sourceAccountEvents = await this.eventStore.loadEvents(accountFrom);
      const rehydratedEvents = Account.rehydrate(
        accountFrom,
        sourceAccountEvents,
      );
      rehydratedEvents.cancelTransferOut(transactionId);
      await this.eventStore.append(
        accountFrom,
        rehydratedEvents.getUncommittedEvents(),
        rehydratedEvents.getVersion(),
      );
      console.error(`COULDNT COMPLETE TRANSFER`, error);
      throw new TransferErrorException(accountFrom);
    }

    return { transactionId };
  }
}
