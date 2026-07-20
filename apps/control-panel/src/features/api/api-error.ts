export type ApiError = {
  status: number;
  code: string;
  details: Record<string, unknown>;
};

export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

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

export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.status === 'number'
  );
}

export function detailNumber(
  details: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = details[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}
