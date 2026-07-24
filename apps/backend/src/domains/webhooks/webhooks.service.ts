import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { assertSafeUrl } from './safe-url.util';

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
    await assertSafeUrl(url);
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

    await assertSafeUrl(endpoint.url);

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
}
