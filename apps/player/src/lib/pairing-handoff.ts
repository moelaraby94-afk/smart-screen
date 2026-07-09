/**
 * The pairing poll is the *only* channel that can deliver a screen's own
 * secret: the backend hands it over on exactly one poll and stores nothing but
 * its bcrypt hash afterwards (see PairingService.pollSession). The
 * `pairing:complete` socket event fans out to a room and therefore can never
 * carry it.
 *
 * Interpreting the poll response is kept here, apart from the React component,
 * because getting it wrong is silent: treating a `complete` response with no
 * `screenSecret` as a successful pairing persists a serial with no credential,
 * and the screen then 401s on every bootstrap forever.
 */

export type PollPairingSessionResponse =
  | { status: 'pending'; expiresAt: string }
  | {
      status: 'complete';
      screenId?: string | null;
      workspaceId?: string | null;
      serialNumber: string;
      /**
       * Present on exactly one poll (whichever request first claims the
       * handoff), `null` on every poll after that. It cannot be re-issued.
       */
      screenSecret?: string | null;
    }
  | { status: 'expired'; expiresAt: string }
  | { status: 'cancelled'; expiresAt: string };

export type PairingPollOutcome =
  /** Not linked yet — keep polling. */
  | { kind: 'wait' }
  /** Linked, and we hold the one copy of the screen's secret. Persist both. */
  | { kind: 'paired'; serialNumber: string; screenSecret: string }
  /** Terminal: show the message and stop polling. */
  | { kind: 'failed'; reason: string };

export const PAIRING_EXPIRED_MESSAGE =
  'Pairing code expired. Refresh to try again.';

export const SECRET_ALREADY_CONSUMED_MESSAGE =
  'This screen was linked, but its credential was already delivered to another ' +
  'session and cannot be re-issued. Remove the screen in the dashboard and pair ' +
  'it again.';

export function interpretPollResult(
  response: PollPairingSessionResponse,
): PairingPollOutcome {
  switch (response.status) {
    case 'pending':
      return { kind: 'wait' };

    case 'expired':
    case 'cancelled':
      return { kind: 'failed', reason: PAIRING_EXPIRED_MESSAGE };

    case 'complete': {
      if (!response.serialNumber) {
        return { kind: 'wait' };
      }
      // A complete session without a secret means the handoff went elsewhere.
      // Persisting the serial anyway would strand this screen on a 401 loop.
      if (!response.screenSecret) {
        return { kind: 'failed', reason: SECRET_ALREADY_CONSUMED_MESSAGE };
      }
      return {
        kind: 'paired',
        serialNumber: response.serialNumber,
        screenSecret: response.screenSecret,
      };
    }
  }
}
