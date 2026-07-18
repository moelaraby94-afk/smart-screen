-- Drop deprecated WorkspacePairingCode table
-- Pairing is handled by ScreenPairingSession (6-digit code flow) only.
-- No code references to WorkspacePairingCode exist in the application.
DROP TABLE IF EXISTS "WorkspacePairingCode";
