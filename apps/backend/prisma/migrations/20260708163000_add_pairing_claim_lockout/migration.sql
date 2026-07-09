-- CreateTable
CREATE TABLE "PairingClaimLockout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PairingClaimLockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairingClaimLockout_userId_key" ON "PairingClaimLockout"("userId");

-- CreateIndex
CREATE INDEX "PairingClaimLockout_lockedUntil_idx" ON "PairingClaimLockout"("lockedUntil");

-- AddForeignKey
ALTER TABLE "PairingClaimLockout" ADD CONSTRAINT "PairingClaimLockout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
