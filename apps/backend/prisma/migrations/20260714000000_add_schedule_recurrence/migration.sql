-- AlterTable: add monthly-recurrence support to Schedule
ALTER TABLE "Schedule" ADD COLUMN     "recurrence" TEXT NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "daysOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
