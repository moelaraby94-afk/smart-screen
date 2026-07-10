import { IsIn } from 'class-validator';

/**
 * The mock-billing affordance only models the two plans the demo UI offers,
 * not the full `SubscriptionPlan` enum (which also has STARTER/ENTERPRISE).
 */
export const MOCK_PLANS = ['FREE', 'PRO'] as const;

export type MockPlan = (typeof MOCK_PLANS)[number];

/**
 * `plan` is required on purpose. The route previously took an inline
 * `{ plan?: 'FREE' | 'PRO' }` and fell back to `'FREE'` when it was absent, so a
 * misspelled property silently downgraded the workspace instead of failing.
 * Both callers (billing-client, admin-workspaces-client) always send it.
 */
export class SetMockPlanDto {
  @IsIn(MOCK_PLANS)
  plan!: MockPlan;
}
