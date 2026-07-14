-- Sync drift: columns and tables added via db push that never had migrations.
-- This migration brings the database schema in sync with schema.prisma.

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScreenOrientation" AS ENUM ('AUTO', 'LANDSCAPE', 'PORTRAIT');

-- DropForeignKey
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeatureFlag_workspaceId_fkey') THEN ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_workspaceId_fkey"; END IF; END $$;

-- DropForeignKey
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OnboardingProgress_workspaceId_fkey') THEN ALTER TABLE "OnboardingProgress" DROP CONSTRAINT "OnboardingProgress_workspaceId_fkey"; END IF; END $$;

-- DropForeignKey
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrayerConfig_workspaceId_fkey') THEN ALTER TABLE "PrayerConfig" DROP CONSTRAINT "PrayerConfig_workspaceId_fkey"; END IF; END $$;

-- DropForeignKey
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RamadanConfig_workspaceId_fkey') THEN ALTER TABLE "RamadanConfig" DROP CONSTRAINT "RamadanConfig_workspaceId_fkey"; END IF; END $$;

-- DropIndex
DROP INDEX IF EXISTS "PairingClaimLockout_userId_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB,
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Screen" ADD COLUMN IF NOT EXISTS "orientation" "ScreenOrientation" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB,
ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT,
ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkspaceInvitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '',
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_workspaceId_email_idx" ON "WorkspaceInvitation"("workspaceId", "email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_email_idx" ON "WorkspaceInvitation"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiKey_workspaceId_revokedAt_idx" ON "ApiKey"("workspaceId", "revokedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebhookEndpoint_workspaceId_enabled_idx" ON "WebhookEndpoint"("workspaceId", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceInvitation_workspaceId_fkey') THEN ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceInvitation_invitedById_fkey') THEN ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiKey_workspaceId_fkey') THEN ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebhookEndpoint_workspaceId_fkey') THEN ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OnboardingProgress_workspaceId_fkey') THEN ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeatureFlag_workspaceId_fkey') THEN ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrayerConfig_workspaceId_fkey') THEN ALTER TABLE "PrayerConfig" ADD CONSTRAINT "PrayerConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RamadanConfig_workspaceId_fkey') THEN ALTER TABLE "RamadanConfig" ADD CONSTRAINT "RamadanConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

