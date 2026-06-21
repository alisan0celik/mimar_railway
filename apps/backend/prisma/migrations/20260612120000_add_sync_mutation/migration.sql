-- CreateTable
CREATE TABLE "SyncMutation" (
    "id" TEXT NOT NULL,
    "mutationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "serverRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncMutation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncMutation_mutationId_key" ON "SyncMutation"("mutationId");

-- CreateIndex
CREATE INDEX "SyncMutation_userId_idx" ON "SyncMutation"("userId");

-- CreateIndex
CREATE INDEX "SyncMutation_companyId_idx" ON "SyncMutation"("companyId");
