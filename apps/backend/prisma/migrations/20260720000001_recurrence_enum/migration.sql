-- CreateType: RecurrenceType
CREATE TYPE "RecurrenceType" AS ENUM ('WEEKLY', 'MONTHLY', 'ONCE', 'DAILY');

-- Alter Schedule.recurrence: String -> RecurrenceType
-- Existing values are 'WEEKLY' and 'MONTHLY' which map directly to enum values.
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" DROP DEFAULT;
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" TYPE "RecurrenceType" USING "recurrence"::"RecurrenceType";
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" SET DEFAULT 'WEEKLY';

-- Alter ScreenOverrideRule.recurrence: String -> RecurrenceType
-- Existing values are 'ONCE', 'DAILY', 'WEEKLY', 'MONTHLY' which map directly to enum values.
ALTER TABLE "ScreenOverrideRule" ALTER COLUMN "recurrence" DROP DEFAULT;
ALTER TABLE "ScreenOverrideRule" ALTER COLUMN "recurrence" TYPE "RecurrenceType" USING "recurrence"::"RecurrenceType";
ALTER TABLE "ScreenOverrideRule" ALTER COLUMN "recurrence" SET DEFAULT 'ONCE';
