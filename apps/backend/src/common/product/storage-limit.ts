/**
 * Subscription.storageLimitBytes is a Postgres BIGINT (Prisma `bigint`) —
 * INTEGER overflows past ~2.1GB, which multi-GB quotas exceed. Convert at
 * the write/read boundary so callers keep working with plain numbers
 * (storage quotas are always well within Number.MAX_SAFE_INTEGER).
 */
export function toStorageLimitBytesInput(
  value: number | null | undefined,
): bigint | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : BigInt(Math.trunc(value));
}

export function fromStorageLimitBytes(value: bigint | null): number | null {
  return value === null ? null : Number(value);
}
