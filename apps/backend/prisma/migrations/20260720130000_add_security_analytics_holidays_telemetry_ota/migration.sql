-- SecurityEventLog table
CREATE TABLE "SecurityEventLog" (
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
CREATE INDEX "SecurityEventLog_eventType_createdAt_idx" ON "SecurityEventLog"("eventType", "createdAt");
CREATE INDEX "SecurityEventLog_userId_createdAt_idx" ON "SecurityEventLog"("userId", "createdAt");
CREATE INDEX "SecurityEventLog_severity_createdAt_idx" ON "SecurityEventLog"("severity", "createdAt");

-- ProofOfPlay table
CREATE TABLE "ProofOfPlay" (
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
CREATE INDEX "ProofOfPlay_workspaceId_playedAt_idx" ON "ProofOfPlay"("workspaceId", "playedAt");
CREATE INDEX "ProofOfPlay_screenId_playedAt_idx" ON "ProofOfPlay"("screenId", "playedAt");
CREATE INDEX "ProofOfPlay_contentId_idx" ON "ProofOfPlay"("contentId");

-- Holiday table
CREATE TABLE "Holiday" (
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
CREATE INDEX "Holiday_workspaceId_date_idx" ON "Holiday"("workspaceId", "date");

-- CommandAck table
CREATE TABLE "CommandAck" (
  "id"           TEXT NOT NULL,
  "screenId"     TEXT NOT NULL,
  "command"      TEXT NOT NULL,
  "messageId"    TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'RECEIVED',
  "errorMessage" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommandAck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommandAck_screenId_createdAt_idx" ON "CommandAck"("screenId", "createdAt");
CREATE INDEX "CommandAck_messageId_idx" ON "CommandAck"("messageId");

-- CrashReport table
CREATE TABLE "CrashReport" (
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
CREATE INDEX "CrashReport_screenId_createdAt_idx" ON "CrashReport"("screenId", "createdAt");
CREATE INDEX "CrashReport_workspaceId_createdAt_idx" ON "CrashReport"("workspaceId", "createdAt");

-- PlayerOtaUpdate table
CREATE TABLE "PlayerOtaUpdate" (
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
CREATE INDEX "PlayerOtaUpdate_isPublished_createdAt_idx" ON "PlayerOtaUpdate"("isPublished", "createdAt");

-- Add excludeHolidays column to Schedule table
ALTER TABLE "Schedule" ADD COLUMN "excludeHolidays" BOOLEAN NOT NULL DEFAULT false;
