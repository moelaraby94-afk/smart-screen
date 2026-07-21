-- SecurityEventLog table
CREATE TABLE IF NOT EXISTS "SecurityEventLog" (
  "id"          TEXT NOT NULL,
  "eventType"   TEXT NOT NULL,
  "severity"    TEXT NOT NULL DEFAULT 'MEDIUM',
  "userId"      TEXT,
  "workspaceId" TEXT,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEventLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SecurityEventLog_eventType_createdAt_idx" ON "SecurityEventLog"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityEventLog_userId_createdAt_idx" ON "SecurityEventLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecurityEventLog_severity_createdAt_idx" ON "SecurityEventLog"("severity", "createdAt");

-- ProofOfPlay table
CREATE TABLE IF NOT EXISTS "ProofOfPlay" (
  "id"          TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "screenId"    TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "contentId"   TEXT,
  "contentName" TEXT,
  "playlistId"  TEXT,
  "playedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProofOfPlay_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProofOfPlay_workspaceId_playedAt_idx" ON "ProofOfPlay"("workspaceId", "playedAt");
CREATE INDEX IF NOT EXISTS "ProofOfPlay_screenId_playedAt_idx" ON "ProofOfPlay"("screenId", "playedAt");
CREATE INDEX IF NOT EXISTS "ProofOfPlay_contentId_idx" ON "ProofOfPlay"("contentId");

-- Holiday table
CREATE TABLE IF NOT EXISTS "Holiday" (
  "id"          TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3),
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Holiday_workspaceId_date_idx" ON "Holiday"("workspaceId", "date");

-- CommandAck table
CREATE TABLE IF NOT EXISTS "CommandAck" (
  "id"           TEXT NOT NULL,
  "screenId"     TEXT NOT NULL,
  "command"      TEXT NOT NULL,
  "messageId"    TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'RECEIVED',
  "errorMessage" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommandAck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CommandAck_screenId_createdAt_idx" ON "CommandAck"("screenId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommandAck_messageId_idx" ON "CommandAck"("messageId");

-- CrashReport table
CREATE TABLE IF NOT EXISTS "CrashReport" (
  "id"            TEXT NOT NULL,
  "screenId"      TEXT,
  "workspaceId"   TEXT,
  "playerVersion" TEXT,
  "platform"      TEXT,
  "stackTrace"    TEXT NOT NULL,
  "diagnostics"   JSONB,
  "ipAddress"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrashReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CrashReport_screenId_createdAt_idx" ON "CrashReport"("screenId", "createdAt");
CREATE INDEX IF NOT EXISTS "CrashReport_workspaceId_createdAt_idx" ON "CrashReport"("workspaceId", "createdAt");

-- PlayerOtaUpdate table
CREATE TABLE IF NOT EXISTS "PlayerOtaUpdate" (
  "id"            TEXT NOT NULL,
  "version"       TEXT NOT NULL,
  "platform"      TEXT NOT NULL DEFAULT 'ALL',
  "downloadUrl"   TEXT NOT NULL,
  "checksum"      TEXT,
  "releaseNotes"  TEXT,
  "isMandatory"   BOOLEAN NOT NULL DEFAULT false,
  "minVersion"    TEXT,
  "isPublished"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerOtaUpdate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlayerOtaUpdate_version_key" UNIQUE ("version")
);
CREATE INDEX IF NOT EXISTS "PlayerOtaUpdate_isPublished_createdAt_idx" ON "PlayerOtaUpdate"("isPublished", "createdAt");

-- Add excludeHolidays column to Schedule table
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "excludeHolidays" BOOLEAN NOT NULL DEFAULT false;
