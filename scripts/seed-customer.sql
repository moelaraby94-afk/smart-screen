-- Create customer user
INSERT INTO "User" (id, email, "fullName", "passwordHash", "emailVerified", "isSuperAdmin", "createdAt", "updatedAt", "businessName", "phone", "country")
VALUES ('clcustomer0000000000000001', 'customer@smartscreen.io', 'Test Customer', '$2b$12$YyFrUhZKMVarFFO/d9.Iu.ZwkhGxytXFUsNCCRjm/g74JWn7HKtuy', true, false, NOW(), NOW(), 'Customer Business', '+201234567890', 'EG')
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- Create workspace for the customer
INSERT INTO "Workspace" (id, name, slug, "createdAt", "updatedAt")
SELECT 'clws0000000000000000000001', 'Customer Business Workspace', 'customer-business-ws', NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "User" WHERE email = 'customer@smartscreen.io')
AND NOT EXISTS (SELECT 1 FROM "Workspace" WHERE slug = 'customer-business-ws')
RETURNING id, slug;

-- Link customer to workspace as OWNER
INSERT INTO "WorkspaceMember" ("workspaceId", "userId", role, "createdAt", "updatedAt")
SELECT 'clws0000000000000000000001', 'clcustomer0000000000000001', 'OWNER', NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "User" WHERE id = 'clcustomer0000000000000001')
AND NOT EXISTS (SELECT 1 FROM "WorkspaceMember" WHERE "workspaceId" = 'clws0000000000000000000001' AND "userId" = 'clcustomer0000000000000001')
RETURNING "workspaceId", "userId";
