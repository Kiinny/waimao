-- Incremental Task 4 procurement and fulfillment fields.
ALTER TABLE "Supplier"
  ADD COLUMN "supplierType" TEXT NOT NULL DEFAULT 'DISTRIBUTOR',
  ADD COLUMN "website" TEXT,
  ADD COLUMN "taxId" TEXT,
  ADD COLUMN "paymentTerms" TEXT,
  ADD COLUMN "leadTimeDays" INTEGER,
  ADD COLUMN "minimumOrderValue" DECIMAL(19,4),
  ADD COLUMN "rating" INTEGER,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "bankAccountName" TEXT,
  ADD COLUMN "bankAccountNumber" TEXT,
  ADD COLUMN "notes" TEXT;

ALTER TABLE "PurchaseOrder"
  ADD COLUMN "paymentTerms" TEXT,
  ADD COLUMN "shippingTerms" TEXT,
  ADD COLUMN "incoterm" TEXT,
  ADD COLUMN "deliveryAddress" JSONB,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "attachments" JSONB,
  ADD COLUMN "receivedAt" TIMESTAMP(3);

ALTER TABLE "PurchaseOrderItem"
  ADD COLUMN "productId" UUID,
  ADD COLUMN "productSnapshot" JSONB,
  ADD COLUMN "configurationSnapshot" JSONB;

ALTER TABLE "InventoryTransaction"
  ADD COLUMN "inventorySerialId" UUID;

ALTER TABLE "QualityInspection"
  ADD COLUMN "inventorySerialId" UUID;

ALTER TABLE "Shipment"
  ADD COLUMN "method" TEXT NOT NULL DEFAULT 'AIR',
  ADD COLUMN "originPort" TEXT,
  ADD COLUMN "destinationPort" TEXT,
  ADD COLUMN "grossWeightKg" DECIMAL(19,4),
  ADD COLUMN "volumeCbm" DECIMAL(19,4),
  ADD COLUMN "freightCost" DECIMAL(19,4),
  ADD COLUMN "freightCurrencyCode" TEXT,
  ADD COLUMN "freightExchangeRateToUsd" DECIMAL(24,12),
  ADD COLUMN "freightCostUsd" DECIMAL(19,4),
  ADD COLUMN "estimatedDepartureAt" TIMESTAMP(3),
  ADD COLUMN "estimatedArrivalAt" TIMESTAMP(3);

-- Existing Task 4 seed shipments are backfilled to the matching inventory row
-- before the relation becomes required.
ALTER TABLE "ShipmentItem" ADD COLUMN "inventoryItemId" UUID;
UPDATE "ShipmentItem"
SET "inventoryItemId" = (
  SELECT ii.id
  FROM "SalesOrderItem" soi
  JOIN "InventoryItem" ii ON ii."productId" = soi."productId"
  WHERE soi.id = "ShipmentItem"."salesOrderItemId" AND ii."deletedAt" IS NULL
  ORDER BY ii."createdAt"
  LIMIT 1
);

-- If legacy data has no product-linked stock row, preserve the migration and
-- let the workflow reject transitions until an operator assigns inventory.
-- New writes always require inventoryItemId through the application contract.

CREATE TABLE "ShipmentSerial" (
  "id" UUID NOT NULL,
  "shipmentItemId" UUID NOT NULL,
  "inventorySerialId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESERVED',
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "issuedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  CONSTRAINT "ShipmentSerial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShipmentDocument" (
  "id" UUID NOT NULL,
  "shipmentId" UUID NOT NULL,
  "fileAssetId" UUID NOT NULL,
  "documentType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");
CREATE INDEX "InventoryTransaction_inventorySerialId_occurredAt_idx" ON "InventoryTransaction"("inventorySerialId", "occurredAt");
CREATE INDEX "QualityInspection_inventorySerialId_status_idx" ON "QualityInspection"("inventorySerialId", "status");
CREATE INDEX "ShipmentItem_inventoryItemId_idx" ON "ShipmentItem"("inventoryItemId");
CREATE UNIQUE INDEX "ShipmentSerial_shipmentItemId_inventorySerialId_key" ON "ShipmentSerial"("shipmentItemId", "inventorySerialId");
CREATE INDEX "ShipmentSerial_inventorySerialId_status_idx" ON "ShipmentSerial"("inventorySerialId", "status");
CREATE UNIQUE INDEX "ShipmentDocument_shipmentId_fileAssetId_documentType_key" ON "ShipmentDocument"("shipmentId", "fileAssetId", "documentType");
CREATE INDEX "ShipmentDocument_fileAssetId_idx" ON "ShipmentDocument"("fileAssetId");

ALTER TABLE "PurchaseOrderItem"
  ADD CONSTRAINT "PurchaseOrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_inventorySerialId_fkey"
  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QualityInspection"
  ADD CONSTRAINT "QualityInspection_inventorySerialId_fkey"
  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem"
  ADD CONSTRAINT "ShipmentItem_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentSerial"
  ADD CONSTRAINT "ShipmentSerial_shipmentItemId_fkey"
  FOREIGN KEY ("shipmentItemId") REFERENCES "ShipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentSerial"
  ADD CONSTRAINT "ShipmentSerial_inventorySerialId_fkey"
  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentDocument"
  ADD CONSTRAINT "ShipmentDocument_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentDocument"
  ADD CONSTRAINT "ShipmentDocument_fileAssetId_fkey"
  FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
