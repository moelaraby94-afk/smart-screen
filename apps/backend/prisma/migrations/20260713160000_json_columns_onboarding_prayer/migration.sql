-- T3.3: Convert JSON-as-string columns to native Json type.
-- OnboardingProgress.completedSteps: String -> Json
-- PrayerConfig.enabledPrayers: String -> Json
-- Data is preserved: existing JSON-encoded strings are cast to jsonb.

ALTER TABLE "OnboardingProgress"
  ALTER COLUMN "completedSteps" TYPE jsonb
  USING "completedSteps"::jsonb;

ALTER TABLE "PrayerConfig"
  ALTER COLUMN "enabledPrayers" TYPE jsonb
  USING "enabledPrayers"::jsonb;
