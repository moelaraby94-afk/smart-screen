-- CreateTable: AccountMemberWorkspaceScope
CREATE TABLE "AccountMemberWorkspaceScope" (
  "id" TEXT NOT NULL,
  "accountMemberId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountMemberWorkspaceScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountMemberWorkspaceScope_accountMemberId_workspaceId_key" ON "AccountMemberWorkspaceScope"("accountMemberId", "workspaceId");
CREATE INDEX IF NOT EXISTS "AccountMemberWorkspaceScope_workspaceId_idx" ON "AccountMemberWorkspaceScope"("workspaceId");

ALTER TABLE "AccountMemberWorkspaceScope" ADD CONSTRAINT "AccountMemberWorkspaceScope_accountMemberId_fkey"
  FOREIGN KEY ("accountMemberId") REFERENCES "AccountMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountMemberWorkspaceScope" ADD CONSTRAINT "AccountMemberWorkspaceScope_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
