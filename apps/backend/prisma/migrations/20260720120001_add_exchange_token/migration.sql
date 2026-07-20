-- CreateTable
CREATE TABLE "ExchangeToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeToken_token_key" ON "ExchangeToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeToken_tokenHash_key" ON "ExchangeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ExchangeToken_tokenHash_idx" ON "ExchangeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ExchangeToken_expiresAt_idx" ON "ExchangeToken"("expiresAt");
