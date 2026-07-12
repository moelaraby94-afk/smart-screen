CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
