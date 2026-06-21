ALTER TABLE "Company"
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN "blockedReason" TEXT,
ADD COLUMN "lastActivityAt" TIMESTAMP(3);

