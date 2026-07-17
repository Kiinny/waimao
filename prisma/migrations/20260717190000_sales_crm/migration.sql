ALTER TABLE "Customer"
  ADD COLUMN "level" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "riskRating" TEXT NOT NULL DEFAULT 'LOW',
  ADD COLUMN "riskNotes" TEXT;

ALTER TABLE "Contact"
  ADD COLUMN "whatsapp" TEXT,
  ADD COLUMN "wechat" TEXT,
  ADD COLUMN "preferredChannel" TEXT;

ALTER TABLE "FollowUp"
  ADD COLUMN "customerId" UUID,
  ADD COLUMN "contactId" UUID,
  ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "outcome" TEXT,
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "attachments" JSONB;

ALTER TABLE "Opportunity"
  ADD COLUMN "lostReason" TEXT,
  ADD COLUMN "wonAt" TIMESTAMP(3),
  ADD COLUMN "lostAt" TIMESTAMP(3);

ALTER TABLE "FollowUp"
  ADD CONSTRAINT "FollowUp_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FollowUp"
  ADD CONSTRAINT "FollowUp_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "FollowUp_customerId_occurredAt_idx"
  ON "FollowUp"("customerId", "occurredAt");

CREATE INDEX "FollowUp_contactId_occurredAt_idx"
  ON "FollowUp"("contactId", "occurredAt");

CREATE UNIQUE INDEX "Contact_one_active_primary_per_customer"
  ON "Contact"("customerId")
  WHERE "isPrimary" = TRUE AND "deletedAt" IS NULL;

ALTER TABLE "FollowUp"
  ADD CONSTRAINT "FollowUp_related_record_check"
  CHECK (
    "customerId" IS NOT NULL OR
    "contactId" IS NOT NULL OR
    "leadId" IS NOT NULL OR
    "opportunityId" IS NOT NULL
  );

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_loss_reason_check"
  CHECK ("stage" <> 'LOST' OR length(trim("lostReason")) > 0);
