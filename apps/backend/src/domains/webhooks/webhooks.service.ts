import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

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
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }
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
      data: { message: 'Test webhook from Cloud-Screen' },
    };

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CloudScreen-Event': 'webhook.test',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Test webhook delivered' : `Endpoint returned ${response.status}`,
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
