-- Per-account sign-in lockout (brute-force defence independent of per-IP rate limiting).
-- CreateTable
CREATE TABLE "LoginLockout" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginLockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginLockout_email_key" ON "LoginLockout"("email");

-- CreateIndex
CREATE INDEX "LoginLockout_lockedUntil_idx" ON "LoginLockout"("lockedUntil");
