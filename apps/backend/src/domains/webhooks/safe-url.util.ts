import { BadRequestException } from '@nestjs/common';
import { lookup as dnsLookup } from 'node:dns/promises';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/**
 * Shared SSRF protection — single source of truth for URL safety validation.
 *
 * Used by both WebhooksService (creation-time + test) and
 * WebhookDeliveryService (pre-delivery revalidation).
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new BadRequestException('URL must use http or https protocol');
  }

  const hostname = parsed.hostname;

  if (hostname === 'localhost') {
    throw DomainException.badRequest(
      ErrorCode.SSRF_BLOCKED,
      'Webhook URL must not point to a private or local address',
    );
  }

  try {
    const addresses = await dnsLookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw DomainException.badRequest(
          ErrorCode.SSRF_BLOCKED,
          'Webhook URL must not point to a private or local address',
          { hostname, resolved: addr.address },
        );
      }
    }
  } catch (err) {
    if (err instanceof DomainException) throw err;
    throw new BadRequestException('Could not resolve webhook URL hostname');
  }
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    const mappedDotted = lower.match(
      /::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/,
    );
    if (mappedDotted) return isPrivateIp(mappedDotted[1]);
    const mappedHex = lower.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHex) {
      const hi = parseInt(mappedHex[1], 16);
      const lo = parseInt(mappedHex[2], 16);
      const v4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
      return isPrivateIp(v4);
    }
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      /^fe[89ab]/.test(lower)
    );
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0 ||
    (a === 100 && b >= 64 && b <= 127)
  );
}
