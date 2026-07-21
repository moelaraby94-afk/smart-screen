import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return endpoints.map((e) => ({
      id: e.id,
      url: e.url,
      events: e.events,
      enabled: e.enabled,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));
  }

  async create(workspaceId: string, url: string, events: string) {
    if (!url?.trim()) {
      throw new BadRequestException('Webhook URL is required');
    }
    await this.assertSafeUrl(url);
    if (!events?.trim()) {
      throw new BadRequestException('At least one event type is required');
    }
    const secret = `whsec_${randomBytes(24).toString('hex')}`;

    const created = await this.prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        url: url.trim(),
        events: events.trim(),
        secret,
        enabled: true,
      },
    });

    return {
      id: created.id,
      url: created.url,
      events: created.events,
      enabled: created.enabled,
      secret: created.secret,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async delete(workspaceId: string, endpointId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId },
    });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }
    await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { deletedAt: new Date(), enabled: false },
    });
    return { id: endpointId, deleted: true };
  }

  async toggle(workspaceId: string, endpointId: string, enabled: boolean) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId, deletedAt: null },
    });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }
    const updated = await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { enabled },
    });
    return {
      id: updated.id,
      enabled: updated.enabled,
    };
  }

  async test(workspaceId: string, endpointId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, workspaceId, deletedAt: null },
    });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const payload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      workspaceId,
      data: { message: 'Test webhook from Smart Screen' },
    };

    await this.assertSafeUrl(endpoint.url);

    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', endpoint.secret)
      .update(body)
      .digest('hex');

    try {
      // redirect: 'manual' stops a vetted public URL from 3xx-redirecting the
      // request onto an internal target (e.g. cloud metadata at
      // 169.254.169.254). assertSafeUrl() only validated the original
      // hostname; the redirect location is never vetted, so we must not follow.
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SmartScreen-Event': 'webhook.test',
          'X-SmartScreen-Signature': `sha256=${signature}`,
        },
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });

      // With redirect: 'manual', a 3xx surfaces as an opaque redirect
      // (type 'opaqueredirect', status 0). Reject it instead of following.
      if (
        response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status < 400)
      ) {
        return {
          success: false,
          statusCode: response.status,
          message: 'Endpoint attempted a redirect, which is not allowed',
        };
      }

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok
          ? 'Test webhook delivered'
          : `Endpoint returned ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        message: `Failed to deliver: ${String(error).slice(0, 200)}`,
      };
    }
  }

  private async assertSafeUrl(rawUrl: string): Promise<void> {
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
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    // IPv4-mapped IPv6 must be unwrapped and re-checked as IPv4, otherwise
    // ::ffff:127.0.0.1 (or its normalized form ::ffff:7f00:1) bypasses the
    // guard and reaches loopback/metadata addresses.
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
      lower === '::' || // unspecified
      lower === '::1' || // loopback
      lower.startsWith('fc') || // unique-local fc00::/7
      lower.startsWith('fd') ||
      /^fe[89ab]/.test(lower) // link-local fe80::/10 (fe80–febf)
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
