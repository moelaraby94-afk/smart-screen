import { CampaignStatus } from '@prisma/client';

/**
 * Pure-function tests for the state transition guard logic.
 * The VALID_TRANSITIONS map is duplicated here to test the logic
 * without a Prisma connection. If the map in campaigns.service.ts
 * changes, this test must be updated to match.
 */

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['PUBLISHED', 'DRAFT'],
  REJECTED: ['DRAFT'],
  PUBLISHED: ['PAUSED', 'ENDED'],
  PAUSED: ['PUBLISHED', 'ENDED'],
  ENDED: [],
};

function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

describe('Campaign state transitions', () => {
  it('DRAFT → PENDING_APPROVAL (submit)', () => {
    expect(canTransition('DRAFT', 'PENDING_APPROVAL')).toBe(true);
  });

  it('PENDING_APPROVAL → APPROVED (approve)', () => {
    expect(canTransition('PENDING_APPROVAL', 'APPROVED')).toBe(true);
  });

  it('PENDING_APPROVAL → REJECTED (reject)', () => {
    expect(canTransition('PENDING_APPROVAL', 'REJECTED')).toBe(true);
  });

  it('REJECTED → DRAFT (resubmit after rejection)', () => {
    expect(canTransition('REJECTED', 'DRAFT')).toBe(true);
  });

  it('APPROVED → PUBLISHED (publish)', () => {
    expect(canTransition('APPROVED', 'PUBLISHED')).toBe(true);
  });

  it('PUBLISHED → PAUSED (pause)', () => {
    expect(canTransition('PUBLISHED', 'PAUSED')).toBe(true);
  });

  it('PAUSED → PUBLISHED (resume)', () => {
    expect(canTransition('PAUSED', 'PUBLISHED')).toBe(true);
  });

  it('PUBLISHED → ENDED (end)', () => {
    expect(canTransition('PUBLISHED', 'ENDED')).toBe(true);
  });

  it('PAUSED → ENDED (end from paused)', () => {
    expect(canTransition('PAUSED', 'ENDED')).toBe(true);
  });

  it('ENDED → anything is blocked', () => {
    expect(canTransition('ENDED', 'DRAFT')).toBe(false);
    expect(canTransition('ENDED', 'PUBLISHED')).toBe(false);
    expect(canTransition('ENDED', 'PENDING_APPROVAL')).toBe(false);
  });

  it('DRAFT → PUBLISHED is blocked (must submit first)', () => {
    expect(canTransition('DRAFT', 'PUBLISHED')).toBe(false);
  });

  it('DRAFT → APPROVED is blocked (must submit first)', () => {
    expect(canTransition('DRAFT', 'APPROVED')).toBe(false);
  });

  it('PENDING_APPROVAL → PUBLISHED is blocked (must approve first)', () => {
    expect(canTransition('PENDING_APPROVAL', 'PUBLISHED')).toBe(false);
  });

  it('APPROVED → PAUSED is blocked (must publish first)', () => {
    expect(canTransition('APPROVED', 'PAUSED')).toBe(false);
  });

  it('REJECTED → PUBLISHED is blocked (must go back to DRAFT)', () => {
    expect(canTransition('REJECTED', 'PUBLISHED')).toBe(false);
  });
});
