-- AlterTable: Add ip column to PairingClaimLockout (non-nullable, default 'unknown').
-- Idempotent: a prior run may have added the column before failing on a later
-- statement, so guard every step to make re-applying this migration safe.
ALTER TABLE "PairingClaimLockout" ADD COLUMN IF NOT EXISTS "ip" TEXT NOT NULL DEFAULT 'unknown';

-- Drop the old userId-only unique constraint (only if it still exists)
ALTER TABLE "PairingClaimLockout" DROP CONSTRAINT IF EXISTS "PairingClaimLockout_userId_key";

-- Create composite unique constraint on [userId, ip]
CREATE UNIQUE INDEX IF NOT EXISTS "PairingClaimLockout_userId_ip_key" ON "PairingClaimLockout"("userId", "ip");

-- Create index on [ip, lockedUntil] for IP-based lockout queries
CREATE INDEX IF NOT EXISTS "PairingClaimLockout_ip_lockedUntil_idx" ON "PairingClaimLockout"("ip", "lockedUntil");
