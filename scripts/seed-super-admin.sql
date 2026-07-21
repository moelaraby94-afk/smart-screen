INSERT INTO "User" (id, email, "fullName", "passwordHash", "emailVerified", "isSuperAdmin", "platformStaffRole", "createdAt", "updatedAt")
VALUES ('cl' || 'admin00000000000000000001', 'admin@smartscreen.io', 'Super Admin', '$2b$12$Fzs9r83DP0FGLNa84N.gC.3BvNwb7SbJtsrAMmWJYL3dGAmRSUmkC', true, true, 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (email) DO NOTHING
RETURNING id, email;
