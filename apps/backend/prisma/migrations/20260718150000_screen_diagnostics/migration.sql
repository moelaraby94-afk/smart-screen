-- AlterTable: add device diagnostics fields to Screen
ALTER TABLE "Screen" ADD COLUMN "batteryLevel"     INTEGER,
ADD COLUMN "batteryCharging"  BOOLEAN,
ADD COLUMN "uptimeSeconds"    INTEGER,
ADD COLUMN "networkType"      TEXT;
