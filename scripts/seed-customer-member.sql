INSERT INTO "WorkspaceMember" (id, "workspaceId", "userId", role, "createdAt")
VALUES ('clwmem0000000000000000001', 'clws0000000000000000000001', 'clcustomer0000000000000001', 'OWNER', NOW())
ON CONFLICT ("workspaceId", "userId") DO NOTHING
RETURNING id;
