ALTER TABLE "AfterSalesTicket"
  RENAME COLUMN "resolution" TO "solution";

ALTER TABLE "AfterSalesTicket"
  ADD COLUMN "productId" UUID,
  ADD COLUMN "inventorySerialId" UUID,
  ADD COLUMN "issueType" TEXT NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "costAmount" DECIMAL(19,4),
  ADD COLUMN "costCurrencyCode" TEXT,
  ADD COLUMN "attachments" JSONB,
  ADD COLUMN "resolvedAt" TIMESTAMP(3);

ALTER TABLE "AfterSalesTicket"
  ADD CONSTRAINT "AfterSalesTicket_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "AfterSalesTicket_inventorySerialId_fkey"
    FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AfterSalesTicket_salesOrderId_idx" ON "AfterSalesTicket"("salesOrderId");
CREATE INDEX "AfterSalesTicket_productId_idx" ON "AfterSalesTicket"("productId");
CREATE INDEX "AfterSalesTicket_inventorySerialId_idx" ON "AfterSalesTicket"("inventorySerialId");

ALTER TABLE "Task"
  ADD COLUMN "reminderAt" TIMESTAMP(3),
  ADD COLUMN "teamCode" TEXT;

ALTER TABLE "Notification"
  ADD COLUMN "entityType" TEXT,
  ADD COLUMN "entityId" TEXT,
  ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");
