import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  interpretPollResult,
  PAIRING_EXPIRED_MESSAGE,
  SECRET_ALREADY_CONSUMED_MESSAGE,
  type PollPairingSessionResponse,
} from './pairing-handoff';

/**
 * Guards the player half of the pairing contract. The regression this exists
 * for: the backend began handing a per-screen secret to the pairing poll and
 * requiring it on `player/bootstrap`, while the player ignored the field and
 * kept sending the shared PLAYER_HEARTBEAT_SECRET — so every newly paired
 * screen authenticated with the wrong credential and 401'd forever.
 */
describe('interpretPollResult', () => {
  it('keeps waiting while the session is pending', () => {
    const pending: PollPairingSessionResponse = {
      status: 'pending',
      expiresAt: new Date().toISOString(),
    };
    assert.deepEqual(interpretPollResult(pending), { kind: 'wait' });
  });

  it('pairs when the poll delivers both the serial and the screen secret', () => {
    const complete: PollPairingSessionResponse = {
      status: 'complete',
      serialNumber: 'CS-abc-1234',
      screenSecret: 'per-screen-secret-value',
      screenId: 'screen_1',
      workspaceId: 'ws_1',
    };

    assert.deepEqual(interpretPollResult(complete), {
      kind: 'paired',
      serialNumber: 'CS-abc-1234',
      screenSecret: 'per-screen-secret-value',
    });
  });

  it('refuses to pair on a complete session with no screen secret', () => {
    // This is the exact shape the player used to accept: it persisted the
    // serial, reloaded into kiosk mode, and then 401'd on every bootstrap.
    const missingSecret: PollPairingSessionResponse = {
      status: 'complete',
      serialNumber: 'CS-abc-1234',
      screenSecret: null,
    };

    assert.deepEqual(interpretPollResult(missingSecret), {
      kind: 'failed',
      reason: SECRET_ALREADY_CONSUMED_MESSAGE,
    });
  });

  it('refuses to pair when the screenSecret field is absent entirely', () => {
    // An older backend (or a stripped response) must not silently "succeed".
    const legacyShape = {
      status: 'complete',
      serialNumber: 'CS-abc-1234',
    } as PollPairingSessionResponse;

    const outcome = interpretPollResult(legacyShape);
    assert.equal(outcome.kind, 'failed');
  });

  it('treats an empty-string secret as no secret', () => {
    const blank: PollPairingSessionResponse = {
      status: 'complete',
      serialNumber: 'CS-abc-1234',
      screenSecret: '',
    };
    assert.equal(interpretPollResult(blank).kind, 'failed');
  });

  it('reports expired and cancelled sessions as terminal failures', () => {
    const expiresAt = new Date().toISOString();
    for (const status of ['expired', 'cancelled'] as const) {
      assert.deepEqual(interpretPollResult({ status, expiresAt }), {
        kind: 'failed',
        reason: PAIRING_EXPIRED_MESSAGE,
      });
    }
  });
});
