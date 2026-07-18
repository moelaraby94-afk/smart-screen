-- Composite index for schedule lookups by screen + time range
CREATE INDEX IF NOT EXISTS "Schedule_screenId_startTime_endTime_idx"
  ON "Schedule" ("screenId", "startTime", "endTime");

-- Composite index for notification queries by user + type + recency
CREATE INDEX IF NOT EXISTS "Notification_userId_type_createdAt_idx"
  ON "Notification" ("userId", "type", "createdAt" DESC);

-- AuditLog already has @@index([workspaceId, createdAt]) in schema
-- No additional index needed
