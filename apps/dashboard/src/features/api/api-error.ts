/**
 * The single way the UI learns why a request failed.
 *
 * The API answers every non-2xx with `{ statusCode, code, message, details? }`.
 * `code` is a stable contract; `message` is English prose meant for server logs.
 * Rendering `message` is why an Arabic user used to be shown "Email already
 * registered", and parsing it is why the screen limit had to be smuggled through
 * a string (`SCREEN_LIMIT_REACHED:25`). Neither is done here: this module hands
 * the rest of the app a `code` and typed `details`, and nothing else.
 */
export type ApiError = {
  status: number;
  /** Stable machine code, e.g. `SCREEN_LIMIT_REACHED`. */
  code: string;
  /** Structured data for the message catalogue to interpolate. */
  details: Record<string, unknown>;
};

/** Used when the response is not the API's error envelope (proxy error, network). */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Reads the error envelope. Never throws, never returns the server's prose:
 * anything unrecognised collapses to `UNKNOWN_ERROR`, which the catalogue maps
 * to a generic message.
 */
export async function readApiError(response: Response): Promise<ApiError> {
  const fallback: ApiError = {
    status: response.status,
    code: UNKNOWN_ERROR_CODE,
    details: {},
  };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallback;
  }

  if (!isRecord(body) || typeof body.code !== 'string') {
    return fallback;
  }

  return {
    status: response.status,
    code: body.code,
    details: isRecord(body.details) ? body.details : {},
  };
}

/** Narrow an `unknown` caught value that a data-layer function rethrew. */
export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.status === 'number'
  );
}

/** Numbers arrive as JSON numbers; guard anyway rather than render `undefined`. */
export function detailNumber(
  details: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = details[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}
