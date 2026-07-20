-- CreateTable: SecurityEventLog
CREATE TABLE "SecurityEventLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT,
    "workspaceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProofOfPlay
CREATE TABLE "ProofOfPlay" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "contentName" TEXT,
    "playlistId" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofOfPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Holiday
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CommandAck
CREATE TABLE "CommandAck" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandAck_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CrashReport
CREATE TABLE "CrashReport" (
    "id" TEXT NOT NULL,
    "screenId" TEXT,
    "workspaceId" TEXT,
    "playerVersion" TEXT,
    "platform" TEXT,
    "stackTrace" TEXT NOT NULL,
    "diagnostics" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlayerOtaUpdate
CREATE TABLE "PlayerOtaUpdate" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ALL',
    "downloadUrl" TEXT NOT NULL,
    "checksum" TEXT,
    "releaseNotes" TEXT,
    "minVersion" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerOtaUpdate_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add excludeHolidays to Schedule
ALTER TABLE "Schedule" ADD COLUMN "excludeHolidays" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: SecurityEventLog
CREATE INDEX "SecurityEventLog_eventType_createdAt_idx" ON "SecurityEventLog"("eventType", "createdAt");
CREATE INDEX "SecurityEventLog_userId_createdAt_idx" ON "SecurityEventLog"("userId", "createdAt");
CREATE INDEX "SecurityEventLog_severity_createdAt_idx" ON "SecurityEventLog"("severity", "createdAt");

-- CreateIndex: ProofOfPlay
CREATE INDEX "ProofOfPlay_workspaceId_playedAt_idx" ON "ProofOfPlay"("workspaceId", "playedAt");
CREATE INDEX "ProofOfPlay_screenId_playedAt_idx" ON "ProofOfPlay"("screenId", "playedAt");
CREATE INDEX "ProofOfPlay_contentId_playedAt_idx" ON "ProofOfPlay"("contentId", "playedAt");

-- CreateIndex: Holiday
CREATE INDEX "Holiday_workspaceId_date_idx" ON "Holiday"("workspaceId", "date");

-- CreateIndex: CommandAck
CREATE INDEX "CommandAck_screenId_createdAt_idx" ON "CommandAck"("screenId", "createdAt");
CREATE INDEX "CommandAck_messageId_idx" ON "CommandAck"("messageId");

-- CreateIndex: CrashReport
CREATE INDEX "CrashReport_screenId_createdAt_idx" ON "CrashReport"("screenId", "createdAt");
CREATE INDEX "CrashReport_workspaceId_createdAt_idx" ON "CrashReport"("workspaceId", "createdAt");

-- CreateIndex: PlayerOtaUpdate
CREATE UNIQUE INDEX "PlayerOtaUpdate_version_key" ON "PlayerOtaUpdate"("version");
CREATE INDEX "PlayerOtaUpdate_platform_isPublished_idx" ON "PlayerOtaUpdate"("platform", "isPublished");
