-- Screen indexes
CREATE INDEX IF NOT EXISTS idx_screen_workspace_status
  ON "Screen" ("workspaceId", "status");
CREATE INDEX IF NOT EXISTS idx_screen_workspace_lastseen
  ON "Screen" ("workspaceId", "lastSeenAt");

-- Playlist indexes
CREATE INDEX IF NOT EXISTS idx_playlist_workspace_published
  ON "Playlist" ("workspaceId", "isPublished");

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_workspace_start
  ON "Schedule" ("workspaceId", "startDate");

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_status_enddate
  ON "Subscription" ("status", "currentPeriodEnd");

-- WorkspaceMember indexes
CREATE INDEX IF NOT EXISTS idx_workspace_membership_userid
  ON "WorkspaceMember" ("userId");
