import type { SwapUpdateEvent } from '../consts/Enums';
import { canTakeOverLockup, isSameLockup } from '../db/LockupIdentity';

type CompetingLockupParams = {
  prevId: string | null | undefined;
  prevVout?: number | null;
  incomingId: string;
  incomingVout?: number | null;
  recordedStatus: SwapUpdateEvent;
};

export const shouldIgnoreCompetingLockup = ({
  prevId,
  prevVout,
  incomingId,
  incomingVout,
  recordedStatus,
}: CompetingLockupParams): boolean => {
  if (
    prevId == null ||
    isSameLockup(
      { transactionId: prevId, vout: prevVout },
      { transactionId: incomingId, vout: incomingVout },
    )
  ) {
    return false;
  }

  return !canTakeOverLockup(recordedStatus);
};
