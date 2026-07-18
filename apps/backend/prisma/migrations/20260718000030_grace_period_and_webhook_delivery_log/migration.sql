ALTER TABLE "Subscription" ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3);

CREATE TABLE "WebhookDeliveryLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookDeliveryLog_webhookId_createdAt_idx" ON "WebhookDeliveryLog"("webhookId", "createdAt");

ALTER TABLE "WebhookDeliveryLog"
    ADD CONSTRAINT "WebhookDeliveryLog_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
