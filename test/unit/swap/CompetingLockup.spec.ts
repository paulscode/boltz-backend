import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import { shouldIgnoreCompetingLockup } from '../../../lib/swap/CompetingLockup';

describe('shouldIgnoreCompetingLockup', () => {
  const base = {
    prevId: 'a'.repeat(64),
    incomingId: 'b'.repeat(64),
    recordedStatus: SwapUpdateEvent.TransactionMempool,
  };

  test('should proceed when no lockup is recorded yet', () => {
    expect(shouldIgnoreCompetingLockup({ ...base, prevId: undefined })).toEqual(
      false,
    );
    expect(shouldIgnoreCompetingLockup({ ...base, prevId: null })).toEqual(
      false,
    );
  });

  test('should proceed for the same transaction and vout', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        incomingId: base.prevId,
        prevVout: 5,
        incomingVout: 5,
      }),
    ).toEqual(false);
  });

  test('should treat another vout of the same transaction as competing', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        incomingId: base.prevId,
        prevVout: 5,
        incomingVout: 7,
      }),
    ).toEqual(true);
  });

  test('should treat a missing vout on either side as the same lockup', () => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        incomingId: base.prevId,
        prevVout: null,
        incomingVout: 7,
      }),
    ).toEqual(false);
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        incomingId: base.prevId,
        prevVout: 5,
        incomingVout: undefined,
      }),
    ).toEqual(false);
  });

  test.each([
    SwapUpdateEvent.TransactionLockupFailed,
    SwapUpdateEvent.TransactionZeroConfRejected,
  ])('should allow takeover from explicitly rejected status %s', (status) => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recordedStatus: status,
      }),
    ).toEqual(false);
  });

  test.each([
    SwapUpdateEvent.SwapCreated,
    SwapUpdateEvent.InvoiceSet,
    SwapUpdateEvent.TransactionMempool,
    SwapUpdateEvent.TransactionConfirmed,
    SwapUpdateEvent.InvoicePending,
    SwapUpdateEvent.TransactionClaimPending,
    SwapUpdateEvent.TransactionClaimed,
  ])('should protect a recorded owner in status %s', (status) => {
    expect(
      shouldIgnoreCompetingLockup({
        ...base,
        recordedStatus: status,
      }),
    ).toEqual(true);
  });
});
