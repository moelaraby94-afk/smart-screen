export const ROUTE_PREFIXES = {
  PLATFORM: 'platform',
  CUSTOMER: 'customer',
  PLAYER: 'player',
  INTERNAL: 'internal',
  PUBLIC: 'public',
} as const;

export const PLATFORM_ROUTES = {
  ADMIN: ['admin', ROUTE_PREFIXES.PLATFORM] as const,
  FEATURE_FLAGS: [
    'admin/feature-flags',
    `${ROUTE_PREFIXES.PLATFORM}/feature-flags`,
  ] as const,
  AUTH: ['auth', `${ROUTE_PREFIXES.PLATFORM}/auth`] as const,
};

export const CUSTOMER_ROUTES = {
  WORKSPACES: ['workspaces', `${ROUTE_PREFIXES.CUSTOMER}/workspaces`] as const,
  SCREENS: ['screens', `${ROUTE_PREFIXES.CUSTOMER}/screens`] as const,
  CANVASES: ['canvases', `${ROUTE_PREFIXES.CUSTOMER}/canvases`] as const,
  PLAYLISTS: ['playlists', `${ROUTE_PREFIXES.CUSTOMER}/playlists`] as const,
  MEDIA: ['media', `${ROUTE_PREFIXES.CUSTOMER}/media`] as const,
  SCHEDULES: ['schedules', `${ROUTE_PREFIXES.CUSTOMER}/schedules`] as const,
  CAMPAIGNS: ['campaigns', `${ROUTE_PREFIXES.CUSTOMER}/campaigns`] as const,
  SUBSCRIPTIONS: [
    'subscriptions',
    `${ROUTE_PREFIXES.CUSTOMER}/subscriptions`,
  ] as const,
  STRIPE: ['stripe', `${ROUTE_PREFIXES.CUSTOMER}/billing/stripe`] as const,
  WEBHOOKS: ['webhooks', `${ROUTE_PREFIXES.CUSTOMER}/webhooks`] as const,
  API_KEYS: ['api-keys', `${ROUTE_PREFIXES.CUSTOMER}/api-keys`] as const,
  ONBOARDING: ['onboarding', `${ROUTE_PREFIXES.CUSTOMER}/onboarding`] as const,
  ISLAMIC: ['islamic', `${ROUTE_PREFIXES.CUSTOMER}/islamic`] as const,
  NOTIFICATIONS: [
    'notifications',
    `${ROUTE_PREFIXES.CUSTOMER}/notifications`,
  ] as const,
  AUDIT_LOG: ['audit-log', `${ROUTE_PREFIXES.CUSTOMER}/audit-log`] as const,
  ACCOUNT: ['account', `${ROUTE_PREFIXES.CUSTOMER}/account`] as const,
  AUTH: ['auth', `${ROUTE_PREFIXES.CUSTOMER}/auth`] as const,
};

export const PLAYER_ROUTES = {
  PLAYER: [ROUTE_PREFIXES.PLAYER] as const,
};

export const INTERNAL_ROUTES = {
  METRICS: ['metrics', `${ROUTE_PREFIXES.INTERNAL}/metrics`] as const,
  STRIPE_WEBHOOK: [
    'webhooks/stripe',
    `${ROUTE_PREFIXES.INTERNAL}/webhooks/stripe`,
  ] as const,
};

export const PUBLIC_ROUTES = {
  BRANDING: ['branding', `${ROUTE_PREFIXES.PUBLIC}/branding`] as const,
};

export const SHARED_ROUTES = {
  CSRF: ['csrf'] as const,
};
