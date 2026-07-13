-- T3.3: Create OnboardingProgress, FeatureFlag, PrayerConfig, and RamadanConfig
-- tables with native Json columns (completedSteps, enabledPrayers).
-- These tables were previously created via `prisma db push` during development
-- and never had a proper migration. This migration creates them from scratch
-- with the correct column types so `migrate deploy` works on fresh databases.

-- OnboardingProgress
CREATE TABLE IF NOT EXISTS "OnboardingProgress" (
    "id"              TEXT      NOT NULL,
    "workspaceId"     TEXT      NOT NULL,
    "completedSteps"  JSONB     NOT NULL DEFAULT '[]'::jsonb,
    "dismissed"       BOOLEAN   NOT NULL DEFAULT false,
    "completedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on workspaceId
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingProgress_workspaceId_key"
    ON "OnboardingProgress"("workspaceId");

-- Add foreign key to Workspace
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OnboardingProgress_workspaceId_fkey') THEN
        ALTER TABLE "OnboardingProgress"
            ADD CONSTRAINT "OnboardingProgress_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FeatureFlag
CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id"           TEXT      NOT NULL,
    "workspaceId"  TEXT      NOT NULL,
    "module"       TEXT      NOT NULL,
    "enabled"      BOOLEAN   NOT NULL DEFAULT true,
    "setBy"        TEXT      NOT NULL DEFAULT 'system',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_workspaceId_module_key"
    ON "FeatureFlag"("workspaceId", "module");

CREATE INDEX IF NOT EXISTS "FeatureFlag_workspaceId_enabled_idx"
    ON "FeatureFlag"("workspaceId", "enabled");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeatureFlag_workspaceId_fkey') THEN
        ALTER TABLE "FeatureFlag"
            ADD CONSTRAINT "FeatureFlag_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- PrayerConfig
CREATE TABLE IF NOT EXISTS "PrayerConfig" (
    "id"               TEXT      NOT NULL,
    "workspaceId"      TEXT      NOT NULL,
    "method"           INTEGER   NOT NULL DEFAULT 3,
    "asrJuristic"      INTEGER   NOT NULL DEFAULT 0,
    "latitude"         DOUBLE PRECISION,
    "longitude"        DOUBLE PRECISION,
    "city"             TEXT,
    "bufferBefore"     INTEGER   NOT NULL DEFAULT 5,
    "bufferAfter"      INTEGER   NOT NULL DEFAULT 15,
    "enabledPrayers"   JSONB     NOT NULL DEFAULT '["Fajr","Dhuhr","Asr","Maghrib","Isha"]'::jsonb,
    "autoPauseEnabled" BOOLEAN   NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrayerConfig_workspaceId_key"
    ON "PrayerConfig"("workspaceId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrayerConfig_workspaceId_fkey') THEN
        ALTER TABLE "PrayerConfig"
            ADD CONSTRAINT "PrayerConfig_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- RamadanConfig
CREATE TABLE IF NOT EXISTS "RamadanConfig" (
    "id"               TEXT      NOT NULL,
    "workspaceId"      TEXT      NOT NULL,
    "enabled"          BOOLEAN   NOT NULL DEFAULT false,
    "iftarPlaylistId"  TEXT,
    "suhoorPlaylistId" TEXT,
    "iftarBuffer"      INTEGER   NOT NULL DEFAULT 10,
    "suhoorBuffer"     INTEGER   NOT NULL DEFAULT 10,
    "showHijriDate"    BOOLEAN   NOT NULL DEFAULT true,
    "showPrayerTimes"  BOOLEAN   NOT NULL DEFAULT true,
    "startDate"        TIMESTAMP(3),
    "endDate"          TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamadanConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RamadanConfig_workspaceId_key"
    ON "RamadanConfig"("workspaceId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RamadanConfig_workspaceId_fkey') THEN
        ALTER TABLE "RamadanConfig"
            ADD CONSTRAINT "RamadanConfig_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- If the tables already exist (from db push) with String columns, convert them.
-- This block is idempotent: it only runs if the column type is not already jsonb.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'OnboardingProgress'
          AND column_name = 'completedSteps'
          AND data_type <> 'jsonb'
    ) THEN
        ALTER TABLE "OnboardingProgress"
            ALTER COLUMN "completedSteps" TYPE jsonb
            USING "completedSteps"::jsonb;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'PrayerConfig'
          AND column_name = 'enabledPrayers'
          AND data_type <> 'jsonb'
    ) THEN
        ALTER TABLE "PrayerConfig"
            ALTER COLUMN "enabledPrayers" TYPE jsonb
            USING "enabledPrayers"::jsonb;
    END IF;
END $$;
