-- Preserve immutable quote history by preventing parent deletion.
ALTER TABLE "QuoteItem"
DROP CONSTRAINT "QuoteItem_quoteVersionId_fkey";

ALTER TABLE "QuoteItem"
ADD CONSTRAINT "QuoteItem_quoteVersionId_fkey"
FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Record the actor and immutable audit event for purchase-gate overrides.
ALTER TABLE "SalesOrder"
ADD COLUMN "purchaseOverrideActorId" UUID,
ADD COLUMN "purchaseOverrideAuditId" UUID;

CREATE UNIQUE INDEX "SalesOrder_purchaseOverrideAuditId_key"
ON "SalesOrder"("purchaseOverrideAuditId");

CREATE INDEX "SalesOrder_purchaseOverrideActorId_idx"
ON "SalesOrder"("purchaseOverrideActorId");

ALTER TABLE "SalesOrder"
ADD CONSTRAINT "SalesOrder_purchaseOverrideActorId_fkey"
FOREIGN KEY ("purchaseOverrideActorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SalesOrder"
ADD CONSTRAINT "SalesOrder_purchaseOverrideAuditId_fkey"
FOREIGN KEY ("purchaseOverrideAuditId") REFERENCES "AuditLog"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
