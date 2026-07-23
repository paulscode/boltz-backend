import { SwapUpdateEvent } from '../consts/Enums';

enum LockupWriteOutcome {
  Acquired = 'acquired',
  Idempotent = 'idempotent',
  Rejected = 'rejected',
}

type LockupWriteResult<T> = {
  outcome: LockupWriteOutcome;
  swap: T;
};

type LockupTargetStatus =
  | SwapUpdateEvent.TransactionMempool
  | SwapUpdateEvent.TransactionConfirmed
  | SwapUpdateEvent.TransactionLockupFailed;

type LockupIdentity = {
  transactionId: string;
  vout?: number | null;
};

const lockupTakeoverStatuses = [
  SwapUpdateEvent.TransactionLockupFailed,
  SwapUpdateEvent.TransactionZeroConfRejected,
];

const canTakeOverLockup = (status: SwapUpdateEvent): boolean =>
  lockupTakeoverStatuses.includes(status);

const isSameLockup = (
  existing: LockupIdentity,
  incoming: LockupIdentity,
): boolean =>
  existing.transactionId === incoming.transactionId &&
  (existing.vout == null ||
    incoming.vout == null ||
    existing.vout === incoming.vout);

type LockupWriteDecision = {
  outcome: LockupWriteOutcome;
  write: boolean;
  vout: number | null;
};

const decideLockupWrite = ({
  existing,
  incoming,
  currentStatus,
  targetStatus,
  updatable,
}: {
  existing: LockupIdentity | null;
  incoming: LockupIdentity;
  currentStatus: SwapUpdateEvent;
  targetStatus: LockupTargetStatus;
  updatable: boolean;
}): LockupWriteDecision => {
  if (existing === null) {
    if (!updatable) {
      return { outcome: LockupWriteOutcome.Rejected, write: false, vout: null };
    }

    return {
      outcome: LockupWriteOutcome.Acquired,
      write: true,
      vout: incoming.vout ?? null,
    };
  }

  if (isSameLockup(existing, incoming)) {
    const wouldDowngradeConfirmed =
      currentStatus === SwapUpdateEvent.TransactionConfirmed &&
      targetStatus !== SwapUpdateEvent.TransactionConfirmed;

    return {
      outcome: LockupWriteOutcome.Idempotent,
      write: updatable && !wouldDowngradeConfirmed,
      vout: incoming.vout ?? existing.vout ?? null,
    };
  }

  if (updatable && canTakeOverLockup(currentStatus)) {
    return {
      outcome: LockupWriteOutcome.Acquired,
      write: true,
      vout: incoming.vout ?? null,
    };
  }

  return { outcome: LockupWriteOutcome.Rejected, write: false, vout: null };
};

const shouldWriteZeroConfRejection = ({
  existing,
  incoming,
  currentStatus,
}: {
  existing: LockupIdentity | null;
  incoming: LockupIdentity;
  currentStatus: SwapUpdateEvent;
}): boolean =>
  existing !== null &&
  currentStatus === SwapUpdateEvent.TransactionMempool &&
  isSameLockup(existing, incoming);

export {
  LockupWriteOutcome,
  canTakeOverLockup,
  isSameLockup,
  decideLockupWrite,
  shouldWriteZeroConfRejection,
};
export type {
  LockupWriteResult,
  LockupTargetStatus,
  LockupIdentity,
  LockupWriteDecision,
};
