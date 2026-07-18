import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

const MAX_RETRIES = 3;
const BACKOFF_MS = [60_000, 600_000, 3_600_000]; // 1m, 10m, 1h

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deliver(
    webhookId: string,
    url: string,
    secret: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const body = JSON.stringify({
      event,
      data: payload,
      timestamp: Date.now(),
    });
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const logEntry = await this.prisma.webhookDeliveryLog.create({
        data: {
          webhookId,
          attempt,
          status: 'PENDING',
        },
      });

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Signature': `sha256=${signature}`,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        const responseText = await res.text().catch(() => '');

        if (res.ok) {
          await this.prisma.webhookDeliveryLog.update({
            where: { id: logEntry.id },
            data: {
              statusCode: res.status,
              responseBody: responseText.slice(0, 2000),
              status: 'DELIVERED',
            },
          });
          this.logger.log(
            `Webhook ${webhookId} delivered (attempt ${attempt}, status ${res.status})`,
          );
          return;
        }

        await this.prisma.webhookDeliveryLog.update({
          where: { id: logEntry.id },
          data: {
            statusCode: res.status,
            responseBody: responseText.slice(0, 2000),
            status: 'FAILED',
          },
        });

        this.logger.warn(
          `Webhook ${webhookId} attempt ${attempt} failed: HTTP ${res.status}`,
        );
      } catch (err) {
        await this.prisma.webhookDeliveryLog.update({
          where: { id: logEntry.id },
          data: {
            status: 'FAILED',
            responseBody: String(err).slice(0, 2000),
          },
        });
        this.logger.warn(
          `Webhook ${webhookId} attempt ${attempt} error: ${err}`,
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, BACKOFF_MS[attempt - 1]),
        );
      }
    }

    // All retries exhausted — mark as permanently failed
    await this.prisma.webhookDeliveryLog.create({
      data: {
        webhookId,
        attempt: MAX_RETRIES + 1,
        status: 'PERMANENTLY_FAILED',
      },
    });
    this.logger.error(
      `Webhook ${webhookId} permanently failed after ${MAX_RETRIES} attempts`,
    );
  }
}
