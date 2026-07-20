-- Create customer user: Sultan
INSERT INTO "User" (id, email, "fullName", "passwordHash", "emailVerified", "isSuperAdmin", "createdAt", "updatedAt", "businessName", "phone", "country", locale)
VALUES ('clsultan00000000000000001', 'sultan@cloudscreen.io', 'Sultan', '$2b$12$Uklv1DQD29je4h/s7Dg7RuelfFEd7TVvzS1bH.43ytGFCY1Hognxm', true, false, NOW(), NOW(), 'Sultan Business', '+201234567890', 'EG', 'ar')
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- Create workspace for Sultan
INSERT INTO "Workspace" (id, name, slug, "createdAt", "updatedAt")
SELECT 'clwssultan000000000000001', 'Sultan Workspace', 'sultan-workspace', NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "User" WHERE email = 'sultan@cloudscreen.io')
AND NOT EXISTS (SELECT 1 FROM "Workspace" WHERE slug = 'sultan-workspace')
RETURNING id, slug;

-- Link Sultan to workspace as OWNER
INSERT INTO "WorkspaceMember" (id, "workspaceId", "userId", role, "createdAt")
SELECT 'clwmsultan000000000000001', 'clwssultan000000000000001', 'clsultan00000000000000001', 'OWNER', NOW()
WHERE EXISTS (SELECT 1 FROM "User" WHERE id = 'clsultan00000000000000001')
AND NOT EXISTS (SELECT 1 FROM "WorkspaceMember" WHERE "workspaceId" = 'clwssultan000000000000001' AND "userId" = 'clsultan00000000000000001')
RETURNING id;
