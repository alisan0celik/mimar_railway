-- Support ticket threading and metadata

CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isStaffReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportTicket" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "SupportTicket" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "SupportTicket" ADD COLUMN "lastMessageAt" TIMESTAMP(3);

UPDATE "SupportTicket" SET "lastMessageAt" = "createdAt" WHERE "lastMessageAt" IS NULL;

ALTER TABLE "SupportTicket" ALTER COLUMN "lastMessageAt" SET NOT NULL;
ALTER TABLE "SupportTicket" ALTER COLUMN "lastMessageAt" SET DEFAULT CURRENT_TIMESTAMP;

INSERT INTO "SupportTicketMessage" ("id", "ticketId", "authorId", "body", "isStaffReply", "createdAt")
SELECT
    'mig_' || "id",
    "id",
    "userId",
    "message",
    false,
    "createdAt"
FROM "SupportTicket";

ALTER TABLE "SupportTicket" DROP COLUMN "message";

CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_lastMessageAt_idx" ON "SupportTicket"("lastMessageAt");
CREATE INDEX "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");
CREATE INDEX "SupportTicketMessage_createdAt_idx" ON "SupportTicketMessage"("createdAt");

ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
