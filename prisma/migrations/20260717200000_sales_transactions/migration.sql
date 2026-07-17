ALTER TABLE "Product"
ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN "baseModel" TEXT,
ADD COLUMN "referencePrice" DECIMAL(19,4),
ADD COLUMN "referenceCurrencyCode" TEXT,
ADD COLUMN "dimensions" JSONB,
ADD COLUMN "hsCode" TEXT,
ADD COLUMN "exportControlRisk" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN "media" JSONB,
ADD COLUMN "availability" TEXT NOT NULL DEFAULT 'AVAILABLE';

ALTER TABLE "ProductVariant"
ADD COLUMN "configurationVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "specifications" JSONB;

CREATE UNIQUE INDEX "ProductVariant_productId_configurationVersion_key"
ON "ProductVariant"("productId", "configurationVersion");

ALTER TABLE "Quote"
ADD COLUMN "approvedById" UUID,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvalNote" TEXT;

CREATE INDEX "Quote_approvedById_idx" ON "Quote"("approvedById");

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuoteVersion"
ADD COLUMN "sourceVersionId" UUID,
ADD COLUMN "estimatedCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "estimatedProfitUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "estimatedMarginPercent" DECIMAL(19,4) NOT NULL DEFAULT 0;

CREATE INDEX "QuoteVersion_sourceVersionId_idx"
ON "QuoteVersion"("sourceVersionId");

ALTER TABLE "QuoteVersion"
ADD CONSTRAINT "QuoteVersion_sourceVersionId_fkey"
FOREIGN KEY ("sourceVersionId") REFERENCES "QuoteVersion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SalesOrder"
ADD COLUMN "acceptedQuoteVersionId" UUID,
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "purchaseStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "inspectionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "packingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "shipmentStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "purchaseEligibilityFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "revenueUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "estimatedCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "actualCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "grossProfitUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "grossMarginPercent" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN "netProfitEstimateUsd" DECIMAL(19,4) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "SalesOrder_acceptedQuoteVersionId_key"
ON "SalesOrder"("acceptedQuoteVersionId");

ALTER TABLE "SalesOrder"
ADD CONSTRAINT "SalesOrder_acceptedQuoteVersionId_fkey"
FOREIGN KEY ("acceptedQuoteVersionId") REFERENCES "QuoteVersion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD COLUMN "proofMetadata" JSONB,
ADD COLUMN "verifiedById" UUID,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;

CREATE INDEX "Payment_verifiedById_idx" ON "Payment"("verifiedById");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_verifiedById_fkey"
FOREIGN KEY ("verifiedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
