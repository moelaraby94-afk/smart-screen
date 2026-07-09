const ACCESS_TOKEN_STORAGE_KEY = 'cs_access_token';

/** Persisted kiosk screen serial after pairing v2 (when env serial is unset). */
const KIOSK_SERIAL_STORAGE_KEY = 'cs_player_kiosk_serial';

/**
 * Per-screen secret handed off exactly once by the pairing poll (see
 * PairingService.pollSession). The backend stores only its bcrypt hash, so this
 * copy is the sole one in existence — losing it means the screen must be
 * re-paired. Always persist it before navigating away from the pairing screen.
 */
const SCREEN_SECRET_STORAGE_KEY = 'cs_player_screen_secret';

export function getPersistedKioskSerial(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(KIOSK_SERIAL_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setPersistedKioskSerial(serial: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KIOSK_SERIAL_STORAGE_KEY, serial.trim());
  } catch {
    /* ignore */
  }
}

export function clearPersistedKioskSerial(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KIOSK_SERIAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getPersistedScreenSecret(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(SCREEN_SECRET_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setPersistedScreenSecret(secret: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCREEN_SECRET_STORAGE_KEY, secret.trim());
  } catch {
    /* ignore */
  }
}

export function clearPersistedScreenSecret(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SCREEN_SECRET_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getApiBaseUrl(): string {
  // `||`, not `??`: an env var set to "" must fall back, not win.
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    'http://localhost:4000/api/v1'
  ).replace(/\/+$/, '');
}

/**
 * Bearer for player: env (dev) first, then localStorage on this origin (paste token).
 * Dashboard (3000) and player (3001) do not share localStorage — use env or paste on player.
 */
export function getPlayerBearerToken(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_PLAYER_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setPlayerBearerToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
