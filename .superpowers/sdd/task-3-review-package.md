# Commit list
a80dbc1 docs: record sales transaction verification
eb0d5b5 feat: implement sales transaction workflows

# Stat
 .superpowers/sdd/task-3-report.md                  |  81 ++
 .../migration.sql                                  |  79 ++
 prisma/schema.prisma                               | 193 +++--
 prisma/seed.ts                                     | 424 +++++++++
 src/app/[locale]/(app)/orders/[id]/page.tsx        |  66 ++
 src/app/[locale]/(app)/orders/page.tsx             |  38 +
 src/app/[locale]/(app)/products/[id]/page.tsx      |  58 ++
 src/app/[locale]/(app)/products/page.tsx           |  55 ++
 src/app/[locale]/(app)/quotes/[id]/page.tsx        |  71 ++
 src/app/[locale]/(app)/quotes/page.tsx             |  56 ++
 src/app/api/orders/[id]/purchase/route.ts          |   9 +-
 src/app/api/orders/[id]/route.ts                   |  24 +
 src/app/api/orders/[id]/transition/route.ts        |  23 +
 src/app/api/orders/route.ts                        |  16 +
 src/app/api/payments/[id]/refund/route.ts          |  24 +
 src/app/api/payments/[id]/verify/route.ts          |  28 +
 src/app/api/payments/route.ts                      |  40 +
 src/app/api/products/[id]/route.ts                 |  41 +
 src/app/api/products/route.ts                      |  28 +
 src/app/api/quotes/[id]/convert/route.ts           |  21 +
 src/app/api/quotes/[id]/pdf/route.ts               |  64 ++
 src/app/api/quotes/[id]/revise/route.ts            |  21 +
 src/app/api/quotes/[id]/route.ts                   |  24 +
 src/app/api/quotes/[id]/transition/route.ts        |  28 +
 src/app/api/quotes/route.ts                        |  28 +
 src/components/app-shell.tsx                       |   3 +
 .../transactions/transaction-actions.tsx           | 342 ++++++++
 src/modules/finance/field-redaction.test.ts        |  64 ++
 src/modules/finance/field-redaction.ts             |  59 ++
 src/modules/finance/order-financials.test.ts       |  34 +
 src/modules/finance/order-financials.ts            |  34 +
 src/modules/orders/order-domain.test.ts            |  42 +
 src/modules/orders/order-domain.ts                 |  53 ++
 src/modules/payments/payment-domain.test.ts        |  40 +
 src/modules/payments/payment-domain.ts             |  57 ++
 src/modules/products/product-domain.test.ts        |  54 ++
 src/modules/products/product-domain.ts             |  51 ++
 src/modules/quotes/quote-domain.test.ts            | 125 +++
 src/modules/quotes/quote-domain.ts                 | 162 ++++
 src/modules/quotes/quote-pdf.test.ts               |  41 +
 src/modules/quotes/quote-pdf.ts                    |  97 +++
 .../transactions/prisma-transactions-repository.ts | 949 +++++++++++++++++++++
 .../transactions/transaction-schemas.test.ts       |  45 +
 src/modules/transactions/transaction-schemas.ts    | 129 +++
 src/modules/transactions/transaction-scope.test.ts |  28 +
 src/modules/transactions/transaction-scope.ts      |  18 +
 .../transactions/transaction-service.test.ts       | 148 ++++
 src/modules/transactions/transaction-service.ts    | 154 ++++
 48 files changed, 4195 insertions(+), 74 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-3-report.md b/.superpowers/sdd/task-3-report.md
new file mode 100644
index 0000000..b3a84a9
--- /dev/null
+++ b/.superpowers/sdd/task-3-report.md
@@ -0,0 +1,81 @@
+# Task 3 Report: Product and Sales Transaction Flow
+
+## Status
+
+Implemented and verified. The product, quotation, sales-order, payment, refund, purchase-gate, financial-calculation, field-redaction, PDF, UI, API, migration, and deterministic seed changes are committed.
+
+## Commits
+
+- `eb0d5b5 feat: implement sales transaction workflows`
+- Report commit: the commit containing this file
+
+## Delivered Features
+
+### Products and configurations
+
+- Extended products with condition, base model, reference price/currency, dimensions, HS code, export-control risk, media metadata, availability, and versioned configuration data.
+- Added product/configuration snapshot logic so quotations preserve server-owned commercial and technical details rather than trusting client-supplied cost or snapshot fields.
+- Added protected product list, detail, create, and update API/UI flows.
+- Enforced field-level removal of product cost data when `purchase.cost.read` is absent.
+
+### Quotations
+
+- Added a multi-line quotation builder with quantity, unit price, absolute discount, exchange-rate snapshot, shipping, insurance, tax, bank fees, incoterm, payment, delivery, warranty, and remarks.
+- Added decimal-safe subtotal, total, USD total, estimated cost, estimated profit, and margin calculations.
+- Added the complete Draft, Pending Approval, Approved, Sent, Viewed, Accepted, Rejected, Expired, and Converted state machine.
+- Restricted approval to Sales Manager and Super Admin roles and wrote immutable audit entries for approval and other state changes.
+- Preserved sent-version immutability. Revisions copy the latest immutable snapshot into the next sequential editable version and retain source-version linkage and full history.
+- Added accepted-version-only, duplicate-safe conversion into one sales order. Orders retain the accepted quote-version and item/configuration snapshots.
+- Added a dependency-free PDF response with company/customer details, line configurations and media labels, totals, terms, bank information, and signature areas.
+
+### Orders, payments, refunds, and profitability
+
+- Added order list/detail flows and payment, purchase, inspection, packing, and shipment status fields.
+- Added validated order transition rules. Purchasing remains reachable only through the payment-gated endpoint; the generic transition endpoint cannot bypass the gate.
+- Added installment payment creation with source currency, exchange-rate and USD snapshots, reference, received date, and proof metadata.
+- Added Finance verification and rejection with actor, timestamp, reason, versioning, and audit.
+- Added cumulative refund validation, refund audit, payment-status recomputation, purchase-eligibility recomputation, and a `PAYMENT_AT_RISK` purchase flag when refunds affect an already-purchasing order.
+- Preserved the `100% T/T Before Purchase` rule: only confirmed net payments cover eligibility. The existing Super Admin override remains reason-required, transactionally audited, and linked to an immutable audit record.
+- Added decimal-safe revenue, estimated cost, actual cost, gross profit/margin, and net-profit estimate calculations.
+- Added recursive field-level redaction for cost and profit fields. Decimal value objects are preserved, Sales Representatives remain owner-scoped, and Finance/Procurement/Operations receive cross-owner order visibility only through their explicit operational roles and permissions.
+
+### Seed and navigation
+
+- Extended the idempotent deterministic seed to exactly the requested Task 3 records:
+  - 20 products
+  - 15 quotations
+  - 10 sales orders
+  - 10 payment records
+- Added realistic product categories, conditions, export risks, configuration/cost snapshots, quotation states, order states, payment proofs, installment/verification states, and deterministic relations.
+- Added Products, Quotes, and Orders navigation plus responsive list/detail/action pages.
+
+## Verification
+
+Fresh verification was run after the final implementation and security review:
+
+- Prisma format: passed.
+- Prisma schema validation: passed.
+- Prisma Client generation: passed.
+- Focused Task 3 tests: 11 files, 51 tests passed.
+- Full Vitest suite: 27 files, 138 tests passed.
+- TypeScript: `tsc --noEmit` passed.
+- ESLint: passed with `--max-warnings=0`.
+- Next.js production build: passed; all Task 3 UI and API routes compiled.
+- `git diff --check`: passed.
+
+The focused tests cover product snapshots, decimal precision, quote calculations and transitions, approval roles, revision sequencing, duplicate conversion, order transitions, purchase eligibility after refunds, confirmed-payment/refund coverage, cumulative refund limits, financial calculations, permission-sensitive redaction, Decimal preservation, operational order scope, request validation, and PDF structure/content.
+
+## Self-review
+
+- Server ownership: customer/opportunity ownership and configuration existence are checked inside the quote transaction. Selected configuration and estimated cost values are loaded by the server.
+- Immutability: sent versions are locked; revisions create new rows; accepted quote-version linkage and unique quote/order constraints prevent snapshot replacement or duplicate conversion.
+- Authorization: approval has both permission and role gates; purchasing cannot use the generic order-transition route; Finance/operational order scope does not widen Sales Representative quote/customer ownership.
+- Finance integrity: only confirmed payments and completed refunds affect eligibility; refund limits are evaluated in USD snapshots; payment and refund actions update order readiness transactionally.
+- Sensitive data: nested estimated/actual cost and profit fields are removed without their explicit permissions, including product variants and quote/order item details.
+- Scope discipline: unrelated CRM and foundation behavior was not refactored.
+
+## Concerns and Environment Limits
+
+- A live PostgreSQL service was not available in this workspace, so Prisma validation/client generation and the production build were verified, but migration application and the deterministic seed were not executed against a running database.
+- The dependency-free PDF is valid and includes bilingual-mode headings and all required commercial sections, but it uses a core PDF font with ASCII fallback. Fully embedded CJK glyphs and raster product-image embedding require a Unicode font/image-capable PDF dependency or accessible media bytes; current output presents product media labels/metadata instead.
+- Browser interaction against authenticated, database-backed pages was not possible without the live database. Server compilation, route generation, validation, and domain behavior are covered by the verification above.
diff --git a/prisma/migrations/20260717200000_sales_transactions/migration.sql b/prisma/migrations/20260717200000_sales_transactions/migration.sql
new file mode 100644
index 0000000..1984e0d
--- /dev/null
+++ b/prisma/migrations/20260717200000_sales_transactions/migration.sql
@@ -0,0 +1,79 @@
+ALTER TABLE "Product"
+ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'NEW',
+ADD COLUMN "baseModel" TEXT,
+ADD COLUMN "referencePrice" DECIMAL(19,4),
+ADD COLUMN "referenceCurrencyCode" TEXT,
+ADD COLUMN "dimensions" JSONB,
+ADD COLUMN "hsCode" TEXT,
+ADD COLUMN "exportControlRisk" TEXT NOT NULL DEFAULT 'LOW',
+ADD COLUMN "media" JSONB,
+ADD COLUMN "availability" TEXT NOT NULL DEFAULT 'AVAILABLE';
+
+ALTER TABLE "ProductVariant"
+ADD COLUMN "configurationVersion" INTEGER NOT NULL DEFAULT 1,
+ADD COLUMN "specifications" JSONB;
+
+CREATE UNIQUE INDEX "ProductVariant_productId_configurationVersion_key"
+ON "ProductVariant"("productId", "configurationVersion");
+
+ALTER TABLE "Quote"
+ADD COLUMN "approvedById" UUID,
+ADD COLUMN "approvedAt" TIMESTAMP(3),
+ADD COLUMN "approvalNote" TEXT;
+
+CREATE INDEX "Quote_approvedById_idx" ON "Quote"("approvedById");
+
+ALTER TABLE "Quote"
+ADD CONSTRAINT "Quote_approvedById_fkey"
+FOREIGN KEY ("approvedById") REFERENCES "User"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
+
+ALTER TABLE "QuoteVersion"
+ADD COLUMN "sourceVersionId" UUID,
+ADD COLUMN "estimatedCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "estimatedProfitUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "estimatedMarginPercent" DECIMAL(19,4) NOT NULL DEFAULT 0;
+
+CREATE INDEX "QuoteVersion_sourceVersionId_idx"
+ON "QuoteVersion"("sourceVersionId");
+
+ALTER TABLE "QuoteVersion"
+ADD CONSTRAINT "QuoteVersion_sourceVersionId_fkey"
+FOREIGN KEY ("sourceVersionId") REFERENCES "QuoteVersion"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
+
+ALTER TABLE "SalesOrder"
+ADD COLUMN "acceptedQuoteVersionId" UUID,
+ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
+ADD COLUMN "purchaseStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
+ADD COLUMN "inspectionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
+ADD COLUMN "packingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
+ADD COLUMN "shipmentStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
+ADD COLUMN "purchaseEligibilityFlag" BOOLEAN NOT NULL DEFAULT false,
+ADD COLUMN "revenueUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "estimatedCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "actualCostUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "grossProfitUsd" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "grossMarginPercent" DECIMAL(19,4) NOT NULL DEFAULT 0,
+ADD COLUMN "netProfitEstimateUsd" DECIMAL(19,4) NOT NULL DEFAULT 0;
+
+CREATE UNIQUE INDEX "SalesOrder_acceptedQuoteVersionId_key"
+ON "SalesOrder"("acceptedQuoteVersionId");
+
+ALTER TABLE "SalesOrder"
+ADD CONSTRAINT "SalesOrder_acceptedQuoteVersionId_fkey"
+FOREIGN KEY ("acceptedQuoteVersionId") REFERENCES "QuoteVersion"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
+
+ALTER TABLE "Payment"
+ADD COLUMN "proofMetadata" JSONB,
+ADD COLUMN "verifiedById" UUID,
+ADD COLUMN "verifiedAt" TIMESTAMP(3),
+ADD COLUMN "rejectionReason" TEXT;
+
+CREATE INDEX "Payment_verifiedById_idx" ON "Payment"("verifiedById");
+
+ALTER TABLE "Payment"
+ADD CONSTRAINT "Payment_verifiedById_fkey"
+FOREIGN KEY ("verifiedById") REFERENCES "User"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 45f08bc..532e75c 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -129,20 +129,22 @@ model User {
   ownedOrders        SalesOrder[]        @relation("OrderOwner")
   purchaseOrders     PurchaseOrder[]     @relation("PurchaseBuyer")
   inspections        QualityInspection[] @relation("InspectionInspector")
   shipments          Shipment[]          @relation("ShipmentCoordinator")
   assignedTickets    AfterSalesTicket[]  @relation("TicketAssignee")
   assignedTasks      Task[]              @relation("TaskAssignee")
   createdTasks       Task[]              @relation("TaskCreator")
   notifications      Notification[]
   uploadedFiles      FileAsset[]         @relation("FileUploader")
   purchaseOverrides  SalesOrder[]        @relation("OrderPurchaseOverrideActor")
+  approvedQuotes     Quote[]             @relation("QuoteApprover")
+  verifiedPayments   Payment[]           @relation("PaymentVerifier")
 
   @@index([status, deletedAt])
 }
 
 model Role {
   id          String           @id @default(uuid()) @db.Uuid
   code        String           @unique
   name        String
   description String?
   isSystem    Boolean          @default(false)
@@ -246,40 +248,40 @@ model Customer {
   opportunities   Opportunity[]
   quotes          Quote[]
   orders          SalesOrder[]
   tickets         AfterSalesTicket[]
 
   @@index([ownerId, status, deletedAt])
   @@index([countryCode])
 }
 
 model Contact {
-  id           String    @id @default(uuid()) @db.Uuid
-  customerId   String    @db.Uuid
-  firstName    String
-  lastName     String
-  title        String?
-  email        String?
-  phone        String?
-  whatsapp     String?
-  wechat       String?
+  id               String     @id @default(uuid()) @db.Uuid
+  customerId       String     @db.Uuid
+  firstName        String
+  lastName         String
+  title            String?
+  email            String?
+  phone            String?
+  whatsapp         String?
+  wechat           String?
   preferredChannel String?
-  isPrimary    Boolean   @default(false)
-  language     String    @default("en")
-  timezone     String?
-  decisionRole String?
-  version      Int       @default(1)
-  createdAt    DateTime  @default(now())
-  updatedAt    DateTime  @updatedAt
-  deletedAt    DateTime?
-  customer     Customer  @relation(fields: [customerId], references: [id])
-  followUps    FollowUp[]
+  isPrimary        Boolean    @default(false)
+  language         String     @default("en")
+  timezone         String?
+  decisionRole     String?
+  version          Int        @default(1)
+  createdAt        DateTime   @default(now())
+  updatedAt        DateTime   @updatedAt
+  deletedAt        DateTime?
+  customer         Customer   @relation(fields: [customerId], references: [id])
+  followUps        FollowUp[]
 
   @@index([customerId, deletedAt])
   @@index([email])
 }
 
 model Lead {
   id                     String     @id @default(uuid()) @db.Uuid
   companyName            String
   contactName            String
   email                  String?
@@ -365,109 +367,134 @@ model ProductCategory {
   id        String    @id @default(uuid()) @db.Uuid
   name      String
   slug      String    @unique
   createdAt DateTime  @default(now())
   updatedAt DateTime  @updatedAt
   deletedAt DateTime?
   products  Product[]
 }
 
 model Product {
-  id               String            @id @default(uuid()) @db.Uuid
-  sku              String            @unique
-  name             String
-  description      String?
-  categoryId       String            @db.Uuid
-  brand            String?
-  model            String?
-  specifications   Json?
-  serialized       Boolean           @default(true)
-  status           RecordStatus      @default(ACTIVE)
-  version          Int               @default(1)
-  createdAt        DateTime          @default(now())
-  updatedAt        DateTime          @updatedAt
-  deletedAt        DateTime?
-  category         ProductCategory   @relation(fields: [categoryId], references: [id])
-  variants         ProductVariant[]
-  quoteItems       QuoteItem[]
-  orderItems       SalesOrderItem[]
-  supplierProducts SupplierProduct[]
-  inventoryItems   InventoryItem[]
+  id                    String            @id @default(uuid()) @db.Uuid
+  sku                   String            @unique
+  name                  String
+  description           String?
+  categoryId            String            @db.Uuid
+  brand                 String?
+  model                 String?
+  condition             String            @default("NEW")
+  baseModel             String?
+  specifications        Json?
+  referencePrice        Decimal?          @db.Decimal(19, 4)
+  referenceCurrencyCode String?
+  dimensions            Json?
+  hsCode                String?
+  exportControlRisk     String            @default("LOW")
+  media                 Json?
+  availability          String            @default("AVAILABLE")
+  serialized            Boolean           @default(true)
+  status                RecordStatus      @default(ACTIVE)
+  version               Int               @default(1)
+  createdAt             DateTime          @default(now())
+  updatedAt             DateTime          @updatedAt
+  deletedAt             DateTime?
+  category              ProductCategory   @relation(fields: [categoryId], references: [id])
+  variants              ProductVariant[]
+  quoteItems            QuoteItem[]
+  orderItems            SalesOrderItem[]
+  supplierProducts      SupplierProduct[]
+  inventoryItems        InventoryItem[]
 
   @@index([categoryId, status, deletedAt])
 }
 
 model ProductVariant {
-  id            String    @id @default(uuid()) @db.Uuid
-  productId     String    @db.Uuid
-  sku           String    @unique
-  name          String
-  configuration Json
-  cost          Decimal?  @db.Decimal(19, 4)
-  currencyCode  String?
-  version       Int       @default(1)
-  createdAt     DateTime  @default(now())
-  updatedAt     DateTime  @updatedAt
-  deletedAt     DateTime?
-  product       Product   @relation(fields: [productId], references: [id])
-
+  id                   String    @id @default(uuid()) @db.Uuid
+  productId            String    @db.Uuid
+  sku                  String    @unique
+  name                 String
+  configurationVersion Int       @default(1)
+  configuration        Json
+  specifications       Json?
+  cost                 Decimal?  @db.Decimal(19, 4)
+  currencyCode         String?
+  version              Int       @default(1)
+  createdAt            DateTime  @default(now())
+  updatedAt            DateTime  @updatedAt
+  deletedAt            DateTime?
+  product              Product   @relation(fields: [productId], references: [id])
+
+  @@unique([productId, configurationVersion])
   @@index([productId, deletedAt])
 }
 
 model Quote {
   id             String         @id @default(uuid()) @db.Uuid
   quoteNumber    String         @unique
   customerId     String         @db.Uuid
   opportunityId  String?        @db.Uuid
   ownerId        String         @db.Uuid
   status         QuoteStatus    @default(DRAFT)
   currentVersion Int            @default(1)
   validUntil     DateTime?
+  approvedById   String?        @db.Uuid
+  approvedAt     DateTime?
+  approvalNote   String?
   version        Int            @default(1)
   createdAt      DateTime       @default(now())
   updatedAt      DateTime       @updatedAt
   deletedAt      DateTime?
   customer       Customer       @relation(fields: [customerId], references: [id])
   opportunity    Opportunity?   @relation(fields: [opportunityId], references: [id])
   owner          User           @relation("QuoteOwner", fields: [ownerId], references: [id])
+  approvedBy     User?          @relation("QuoteApprover", fields: [approvedById], references: [id], onDelete: Restrict)
   versions       QuoteVersion[]
   order          SalesOrder?
 
   @@index([ownerId, status, deletedAt])
   @@index([customerId])
+  @@index([approvedById])
 }
 
 model QuoteVersion {
-  id                String      @id @default(uuid()) @db.Uuid
-  quoteId           String      @db.Uuid
-  number            Int
-  currencyCode      String
-  exchangeRateToUsd Decimal     @db.Decimal(24, 12)
-  subtotal          Decimal     @db.Decimal(19, 4)
-  shipping          Decimal     @default(0) @db.Decimal(19, 4)
-  insurance         Decimal     @default(0) @db.Decimal(19, 4)
-  tax               Decimal     @default(0) @db.Decimal(19, 4)
-  bankFees          Decimal     @default(0) @db.Decimal(19, 4)
-  total             Decimal     @db.Decimal(19, 4)
-  totalUsd          Decimal     @db.Decimal(19, 4)
-  incoterm          String?
-  paymentTerms      String?
-  deliveryTerms     String?
-  warrantyTerms     String?
-  remarks           String?
-  immutableAt       DateTime?
-  createdAt         DateTime    @default(now())
-  quote             Quote       @relation(fields: [quoteId], references: [id])
-  items             QuoteItem[]
+  id                     String         @id @default(uuid()) @db.Uuid
+  quoteId                String         @db.Uuid
+  number                 Int
+  sourceVersionId        String?        @db.Uuid
+  currencyCode           String
+  exchangeRateToUsd      Decimal        @db.Decimal(24, 12)
+  subtotal               Decimal        @db.Decimal(19, 4)
+  shipping               Decimal        @default(0) @db.Decimal(19, 4)
+  insurance              Decimal        @default(0) @db.Decimal(19, 4)
+  tax                    Decimal        @default(0) @db.Decimal(19, 4)
+  bankFees               Decimal        @default(0) @db.Decimal(19, 4)
+  total                  Decimal        @db.Decimal(19, 4)
+  totalUsd               Decimal        @db.Decimal(19, 4)
+  estimatedCostUsd       Decimal        @default(0) @db.Decimal(19, 4)
+  estimatedProfitUsd     Decimal        @default(0) @db.Decimal(19, 4)
+  estimatedMarginPercent Decimal        @default(0) @db.Decimal(19, 4)
+  incoterm               String?
+  paymentTerms           String?
+  deliveryTerms          String?
+  warrantyTerms          String?
+  remarks                String?
+  immutableAt            DateTime?
+  createdAt              DateTime       @default(now())
+  quote                  Quote          @relation(fields: [quoteId], references: [id])
+  sourceVersion          QuoteVersion?  @relation("QuoteVersionRevision", fields: [sourceVersionId], references: [id], onDelete: Restrict)
+  revisions              QuoteVersion[] @relation("QuoteVersionRevision")
+  items                  QuoteItem[]
+  orders                 SalesOrder[]   @relation("AcceptedQuoteVersion")
 
   @@unique([quoteId, number])
   @@index([quoteId, createdAt])
+  @@index([sourceVersionId])
 }
 
 model QuoteItem {
   id               String       @id @default(uuid()) @db.Uuid
   quoteVersionId   String       @db.Uuid
   productId        String?      @db.Uuid
   description      String
   configuration    Json?
   quantity         Int
   unitPrice        Decimal      @db.Decimal(19, 4)
@@ -479,37 +506,51 @@ model QuoteItem {
 
   @@index([quoteVersionId])
   @@index([productId])
 }
 
 model SalesOrder {
   id                      String             @id @default(uuid()) @db.Uuid
   orderNumber             String             @unique
   customerId              String             @db.Uuid
   quoteId                 String?            @unique @db.Uuid
+  acceptedQuoteVersionId  String?            @unique @db.Uuid
   ownerId                 String             @db.Uuid
   status                  OrderStatus        @default(DRAFT)
   currencyCode            String
   exchangeRateToUsd       Decimal            @db.Decimal(24, 12)
   total                   Decimal            @db.Decimal(19, 4)
   totalUsd                Decimal            @db.Decimal(19, 4)
   paymentTerms            String
+  paymentStatus           String             @default("UNPAID")
+  purchaseStatus          String             @default("NOT_STARTED")
+  inspectionStatus        String             @default("NOT_STARTED")
+  packingStatus           String             @default("NOT_STARTED")
+  shipmentStatus          String             @default("NOT_STARTED")
+  purchaseEligibilityFlag Boolean            @default(false)
+  revenueUsd              Decimal            @default(0) @db.Decimal(19, 4)
+  estimatedCostUsd        Decimal            @default(0) @db.Decimal(19, 4)
+  actualCostUsd           Decimal            @default(0) @db.Decimal(19, 4)
+  grossProfitUsd          Decimal            @default(0) @db.Decimal(19, 4)
+  grossMarginPercent      Decimal            @default(0) @db.Decimal(19, 4)
+  netProfitEstimateUsd    Decimal            @default(0) @db.Decimal(19, 4)
   purchaseOverrideReason  String?
   purchaseOverrideActorId String?            @db.Uuid
   purchaseOverrideAuditId String?            @unique @db.Uuid
   purchaseOverriddenAt    DateTime?
   version                 Int                @default(1)
   createdAt               DateTime           @default(now())
   updatedAt               DateTime           @updatedAt
   deletedAt               DateTime?
   customer                Customer           @relation(fields: [customerId], references: [id])
   quote                   Quote?             @relation(fields: [quoteId], references: [id])
+  acceptedQuoteVersion    QuoteVersion?      @relation("AcceptedQuoteVersion", fields: [acceptedQuoteVersionId], references: [id], onDelete: Restrict)
   owner                   User               @relation("OrderOwner", fields: [ownerId], references: [id])
   purchaseOverrideActor   User?              @relation("OrderPurchaseOverrideActor", fields: [purchaseOverrideActorId], references: [id], onDelete: Restrict)
   purchaseOverrideAudit   AuditLog?          @relation("OrderPurchaseOverrideAudit", fields: [purchaseOverrideAuditId], references: [id], onDelete: Restrict)
   items                   SalesOrderItem[]
   payments                Payment[]
   refunds                 Refund[]
   costs                   Cost[]
   purchaseOrders          PurchaseOrder[]
   shipments               Shipment[]
   tickets                 AfterSalesTicket[]
@@ -538,29 +579,35 @@ model SalesOrderItem {
 
 model Payment {
   id                String        @id @default(uuid()) @db.Uuid
   salesOrderId      String        @db.Uuid
   reference         String?
   status            PaymentStatus @default(PENDING)
   amount            Decimal       @db.Decimal(19, 4)
   currencyCode      String
   exchangeRateToUsd Decimal       @db.Decimal(24, 12)
   amountUsd         Decimal       @db.Decimal(19, 4)
+  proofMetadata     Json?
+  verifiedById      String?       @db.Uuid
+  verifiedAt        DateTime?
+  rejectionReason   String?
   receivedAt        DateTime?
   version           Int           @default(1)
   createdAt         DateTime      @default(now())
   updatedAt         DateTime      @updatedAt
   deletedAt         DateTime?
   salesOrder        SalesOrder    @relation(fields: [salesOrderId], references: [id])
+  verifiedBy        User?         @relation("PaymentVerifier", fields: [verifiedById], references: [id], onDelete: Restrict)
   refunds           Refund[]
 
   @@index([salesOrderId, status, deletedAt])
+  @@index([verifiedById])
 }
 
 model Refund {
   id                String     @id @default(uuid()) @db.Uuid
   salesOrderId      String     @db.Uuid
   paymentId         String?    @db.Uuid
   amount            Decimal    @db.Decimal(19, 4)
   currencyCode      String
   exchangeRateToUsd Decimal    @db.Decimal(24, 12)
   amountUsd         Decimal    @db.Decimal(19, 4)
diff --git a/prisma/seed.ts b/prisma/seed.ts
index ec4a443..a09619c 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -1,11 +1,12 @@
 import { PrismaPg } from "@prisma/adapter-pg";
+import Decimal from "decimal.js";
 
 import { PrismaClient } from "../src/generated/prisma/client";
 import { hashPassword } from "../src/lib/password";
 
 const connectionString = process.env.DATABASE_URL;
 if (!connectionString) throw new Error("DATABASE_URL is required");
 
 const prisma = new PrismaClient({
   adapter: new PrismaPg({ connectionString }),
 });
@@ -38,20 +39,21 @@ const permissions = [
   "product.update",
   "quote.read",
   "quote.create",
   "quote.update",
   "quote.approve",
   "order.read",
   "order.create",
   "order.update",
   "payment.read",
   "payment.create",
+  "payment.verify",
   "refund.create",
   "finance.profit.read",
   "supplier.read",
   "supplier.create",
   "supplier.update",
   "purchase.read",
   "purchase.create",
   "purchase.update",
   "purchase.cost.read",
   "inventory.read",
@@ -462,19 +464,441 @@ async function main() {
           ? "Confirmed requirements and qualification criteria."
           : "Reviewed configuration, commercial terms, and next decision.",
         outcome: index % 4 === 0 ? "Technical review scheduled" : "Positive response",
         nextAction: "Send the agreed configuration and confirm next meeting.",
         occurredAt,
         nextActionAt,
         createdById: salesOwnerIds[index % salesOwnerIds.length],
       },
     });
   }
+
+  const categories = [
+    ["ai-server", "AI Server"],
+    ["gpu-server", "GPU Server"],
+    ["refurbished-server", "Refurbished Server"],
+    ["server-component", "Server Component"],
+  ] as const;
+  for (const [index, [slug, name]] of categories.entries()) {
+    await prisma.productCategory.upsert({
+      where: { slug },
+      update: { name, deletedAt: null },
+      create: {
+        id: deterministicId(19, index + 1),
+        slug,
+        name,
+      },
+    });
+  }
+
+  const productNames = [
+    "Dell PowerEdge R760xa",
+    "Dell PowerEdge R750",
+    "HPE ProLiant DL380 Gen11",
+    "HPE Apollo 6500 Gen10 Plus",
+    "Lenovo ThinkSystem SR675 V3",
+    "Supermicro AS-8125GS-TNHR",
+    "Supermicro SYS-421GE-TNRT",
+    "Inspur NF5488A5",
+    "Huawei FusionServer Pro 2288H V5",
+    "NVIDIA DGX H100",
+    "NVIDIA HGX H200 Platform",
+    "Dell PowerEdge XE9680",
+    "HPE ProLiant DL360 Gen10",
+    "Lenovo ThinkSystem SR650 V2",
+    "Cisco UCS C240 M6",
+    "NVIDIA L40S 48GB",
+    "NVIDIA H100 80GB",
+    "NVIDIA A100 80GB",
+    "Samsung 3.84TB NVMe SSD",
+    "Micron 64GB DDR5 RDIMM",
+  ];
+  for (let index = 0; index < 20; index += 1) {
+    const productId = deterministicId(20, index + 1);
+    const variantId = deterministicId(21, index + 1);
+    const isComponent = index >= 15;
+    const condition = index % 5 === 0 ? "REFURBISHED" : "NEW";
+    await prisma.product.upsert({
+      where: { id: productId },
+      update: {
+        sku: `ATL-${String(index + 1).padStart(3, "0")}`,
+        name: productNames[index],
+        categoryId: deterministicId(19, isComponent ? 4 : (index % 3) + 1),
+        condition,
+        baseModel: productNames[index],
+        specifications: isComponent
+          ? { interface: index < 18 ? "PCIe" : "Server component" }
+          : { cpu: "2 x Intel Xeon", memory: "512GB", gpuSlots: 4 },
+        referencePrice: String(5_000 + index * 2_500),
+        referenceCurrencyCode: "USD",
+        dimensions: isComponent
+          ? { lengthCm: 30, widthCm: 12, heightCm: 5 }
+          : { lengthCm: 110, widthCm: 48.2, heightCm: 8.7 },
+        hsCode: isComponent ? "847330" : "847150",
+        exportControlRisk: index === 9 || index === 16 ? "REVIEW_REQUIRED" : "LOW",
+        media: [
+          {
+            kind: "IMAGE",
+            objectKey: `products/atl-${String(index + 1).padStart(3, "0")}/front.jpg`,
+          },
+        ],
+        availability: index % 4 === 0 ? "LIMITED" : "IN_STOCK",
+        deletedAt: null,
+      },
+      create: {
+        id: productId,
+        sku: `ATL-${String(index + 1).padStart(3, "0")}`,
+        name: productNames[index],
+        description: `${productNames[index]} export configuration`,
+        categoryId: deterministicId(19, isComponent ? 4 : (index % 3) + 1),
+        brand: productNames[index].split(" ")[0],
+        model: productNames[index],
+        condition,
+        baseModel: productNames[index],
+        specifications: isComponent
+          ? { interface: index < 18 ? "PCIe" : "Server component" }
+          : { cpu: "2 x Intel Xeon", memory: "512GB", gpuSlots: 4 },
+        referencePrice: String(5_000 + index * 2_500),
+        referenceCurrencyCode: "USD",
+        dimensions: isComponent
+          ? { lengthCm: 30, widthCm: 12, heightCm: 5 }
+          : { lengthCm: 110, widthCm: 48.2, heightCm: 8.7 },
+        hsCode: isComponent ? "847330" : "847150",
+        exportControlRisk: index === 9 || index === 16 ? "REVIEW_REQUIRED" : "LOW",
+        media: [
+          {
+            kind: "IMAGE",
+            objectKey: `products/atl-${String(index + 1).padStart(3, "0")}/front.jpg`,
+          },
+        ],
+        availability: index % 4 === 0 ? "LIMITED" : "IN_STOCK",
+        serialized: true,
+      },
+    });
+    await prisma.productVariant.upsert({
+      where: { id: variantId },
+      update: {
+        productId,
+        sku: `ATL-${String(index + 1).padStart(3, "0")}-V1`,
+        name: isComponent ? "Standard" : "Export configuration",
+        configurationVersion: 1,
+        configuration: isComponent
+          ? { grade: condition }
+          : { gpu: `${(index % 4) + 1} accelerator(s)`, ram: "512GB" },
+        specifications: { warrantyMonths: condition === "REFURBISHED" ? 6 : 12 },
+        cost: String(3_500 + index * 1_700),
+        currencyCode: "USD",
+        deletedAt: null,
+      },
+      create: {
+        id: variantId,
+        productId,
+        sku: `ATL-${String(index + 1).padStart(3, "0")}-V1`,
+        name: isComponent ? "Standard" : "Export configuration",
+        configurationVersion: 1,
+        configuration: isComponent
+          ? { grade: condition }
+          : { gpu: `${(index % 4) + 1} accelerator(s)`, ram: "512GB" },
+        specifications: { warrantyMonths: condition === "REFURBISHED" ? 6 : 12 },
+        cost: String(3_500 + index * 1_700),
+        currencyCode: "USD",
+      },
+    });
+  }
+
+  const quoteStatuses = [
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "CONVERTED",
+    "ACCEPTED",
+    "SENT",
+    "VIEWED",
+    "APPROVED",
+    "DRAFT",
+  ] as const;
+  for (let index = 0; index < 15; index += 1) {
+    const quoteId = deterministicId(30, index + 1);
+    const versionId = deterministicId(31, index + 1);
+    const itemId = deterministicId(32, index + 1);
+    const productIndex = index % 20;
+    const total = String(25_000 + index * 4_000);
+    const estimatedCost = String(17_000 + index * 2_500);
+    const estimatedProfit = String(
+      Number(total) - Number(estimatedCost),
+    );
+    const status = quoteStatuses[index];
+    const immutable = ["SENT", "VIEWED", "ACCEPTED", "CONVERTED"].includes(
+      status,
+    );
+    await prisma.quote.upsert({
+      where: { id: quoteId },
+      update: {
+        customerId: deterministicId(10, index + 1),
+        opportunityId: deterministicId(13, index + 1),
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        status,
+        currentVersion: 1,
+        validUntil: new Date(Date.UTC(2026, 8, index + 1)),
+        approvedById: status === "DRAFT" ? null : deterministicId(3, 2),
+        approvedAt:
+          status === "DRAFT" ? null : new Date(Date.UTC(2026, 6, 5)),
+        approvalNote: status === "DRAFT" ? null : "Commercial terms approved.",
+        deletedAt: null,
+      },
+      create: {
+        id: quoteId,
+        quoteNumber: `QUOTE-${String(index + 1).padStart(6, "0")}`,
+        customerId: deterministicId(10, index + 1),
+        opportunityId: deterministicId(13, index + 1),
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        status,
+        currentVersion: 1,
+        validUntil: new Date(Date.UTC(2026, 8, index + 1)),
+        approvedById: status === "DRAFT" ? null : deterministicId(3, 2),
+        approvedAt:
+          status === "DRAFT" ? null : new Date(Date.UTC(2026, 6, 5)),
+        approvalNote: status === "DRAFT" ? null : "Commercial terms approved.",
+      },
+    });
+    await prisma.quoteVersion.upsert({
+      where: { id: versionId },
+      update: {
+        quoteId,
+        number: 1,
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        subtotal: total,
+        shipping: "0",
+        insurance: "0",
+        tax: "0",
+        bankFees: "0",
+        total,
+        totalUsd: total,
+        estimatedCostUsd: estimatedCost,
+        estimatedProfitUsd: estimatedProfit,
+        estimatedMarginPercent: new Decimal(estimatedProfit)
+          .div(total)
+          .times(100)
+          .toFixed(4),
+        incoterm: "CIF",
+        paymentTerms: "100% T/T Before Purchase",
+        deliveryTerms: "30 days after confirmed payment",
+        warrantyTerms: "12 months",
+        remarks: "Export subject to final compliance review.",
+        immutableAt: immutable
+          ? new Date(Date.UTC(2026, 6, 6 + index))
+          : null,
+      },
+      create: {
+        id: versionId,
+        quoteId,
+        number: 1,
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        subtotal: total,
+        total,
+        totalUsd: total,
+        estimatedCostUsd: estimatedCost,
+        estimatedProfitUsd: estimatedProfit,
+        estimatedMarginPercent: new Decimal(estimatedProfit)
+          .div(total)
+          .times(100)
+          .toFixed(4),
+        incoterm: "CIF",
+        paymentTerms: "100% T/T Before Purchase",
+        deliveryTerms: "30 days after confirmed payment",
+        warrantyTerms: "12 months",
+        remarks: "Export subject to final compliance review.",
+        immutableAt: immutable
+          ? new Date(Date.UTC(2026, 6, 6 + index))
+          : null,
+      },
+    });
+    await prisma.quoteItem.upsert({
+      where: { id: itemId },
+      update: {
+        quoteVersionId: versionId,
+        productId: deterministicId(20, productIndex + 1),
+        description: productNames[productIndex],
+        configuration: {
+          variantId: deterministicId(21, productIndex + 1),
+          configurationVersion: 1,
+          sku: `ATL-${String(productIndex + 1).padStart(3, "0")}-V1`,
+        },
+        quantity: 1,
+        unitPrice: total,
+        discount: "0",
+        lineTotal: total,
+        estimatedCostUsd: estimatedCost,
+      },
+      create: {
+        id: itemId,
+        quoteVersionId: versionId,
+        productId: deterministicId(20, productIndex + 1),
+        description: productNames[productIndex],
+        configuration: {
+          variantId: deterministicId(21, productIndex + 1),
+          configurationVersion: 1,
+          sku: `ATL-${String(productIndex + 1).padStart(3, "0")}-V1`,
+        },
+        quantity: 1,
+        unitPrice: total,
+        lineTotal: total,
+        estimatedCostUsd: estimatedCost,
+      },
+    });
+
+    if (index < 10) {
+      const orderId = deterministicId(33, index + 1);
+      const orderItemId = deterministicId(34, index + 1);
+      const paymentId = deterministicId(35, index + 1);
+      const paidAmount =
+        index < 6 ? total : index < 8 ? String(Number(total) / 2) : total;
+      const paymentStatus =
+        index < 8 ? "CONFIRMED" : "PENDING";
+      await prisma.salesOrder.upsert({
+        where: { id: orderId },
+        update: {
+          customerId: deterministicId(10, index + 1),
+          quoteId,
+          acceptedQuoteVersionId: versionId,
+          ownerId: salesOwnerIds[index % salesOwnerIds.length],
+          status: index < 2 ? "PURCHASING" : "CONFIRMED",
+          currencyCode: "USD",
+          exchangeRateToUsd: "1",
+          total,
+          totalUsd: total,
+          paymentTerms: "100% T/T Before Purchase",
+          paymentStatus:
+            index < 6 ? "PAID" : index < 8 ? "PARTIALLY_PAID" : "UNPAID",
+          purchaseStatus: index < 2 ? "PURCHASING" : "NOT_STARTED",
+          purchaseEligibilityFlag: index < 6,
+          revenueUsd: total,
+          estimatedCostUsd: estimatedCost,
+          actualCostUsd: index < 2 ? estimatedCost : "0",
+          grossProfitUsd: estimatedProfit,
+          grossMarginPercent: new Decimal(estimatedProfit)
+            .div(total)
+            .times(100)
+            .toFixed(4),
+          netProfitEstimateUsd: estimatedProfit,
+          deletedAt: null,
+        },
+        create: {
+          id: orderId,
+          orderNumber: `SALES-ORDER-${String(index + 1).padStart(6, "0")}`,
+          customerId: deterministicId(10, index + 1),
+          quoteId,
+          acceptedQuoteVersionId: versionId,
+          ownerId: salesOwnerIds[index % salesOwnerIds.length],
+          status: index < 2 ? "PURCHASING" : "CONFIRMED",
+          currencyCode: "USD",
+          exchangeRateToUsd: "1",
+          total,
+          totalUsd: total,
+          paymentTerms: "100% T/T Before Purchase",
+          paymentStatus:
+            index < 6 ? "PAID" : index < 8 ? "PARTIALLY_PAID" : "UNPAID",
+          purchaseStatus: index < 2 ? "PURCHASING" : "NOT_STARTED",
+          purchaseEligibilityFlag: index < 6,
+          revenueUsd: total,
+          estimatedCostUsd: estimatedCost,
+          actualCostUsd: index < 2 ? estimatedCost : "0",
+          grossProfitUsd: estimatedProfit,
+          grossMarginPercent: new Decimal(estimatedProfit)
+            .div(total)
+            .times(100)
+            .toFixed(4),
+          netProfitEstimateUsd: estimatedProfit,
+        },
+      });
+      await prisma.salesOrderItem.upsert({
+        where: { id: orderItemId },
+        update: {
+          salesOrderId: orderId,
+          productId: deterministicId(20, productIndex + 1),
+          description: productNames[productIndex],
+          configuration: {
+            quoteVersionId: versionId,
+            variantId: deterministicId(21, productIndex + 1),
+          },
+          quantity: 1,
+          unitPrice: total,
+          lineTotal: total,
+        },
+        create: {
+          id: orderItemId,
+          salesOrderId: orderId,
+          productId: deterministicId(20, productIndex + 1),
+          description: productNames[productIndex],
+          configuration: {
+            quoteVersionId: versionId,
+            variantId: deterministicId(21, productIndex + 1),
+          },
+          quantity: 1,
+          unitPrice: total,
+          lineTotal: total,
+        },
+      });
+      await prisma.payment.upsert({
+        where: { id: paymentId },
+        update: {
+          salesOrderId: orderId,
+          reference: `TT-${String(index + 1).padStart(4, "0")}`,
+          status: paymentStatus,
+          amount: paidAmount,
+          currencyCode: "USD",
+          exchangeRateToUsd: "1",
+          amountUsd: paidAmount,
+          proofMetadata: {
+            fileName: `tt-${index + 1}.pdf`,
+            objectKey: `payments/${paymentId}/proof.pdf`,
+          },
+          verifiedById:
+            paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
+          verifiedAt:
+            paymentStatus === "CONFIRMED"
+              ? new Date(Date.UTC(2026, 6, 10 + index))
+              : null,
+          receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
+          deletedAt: null,
+        },
+        create: {
+          id: paymentId,
+          salesOrderId: orderId,
+          reference: `TT-${String(index + 1).padStart(4, "0")}`,
+          status: paymentStatus,
+          amount: paidAmount,
+          currencyCode: "USD",
+          exchangeRateToUsd: "1",
+          amountUsd: paidAmount,
+          proofMetadata: {
+            fileName: `tt-${index + 1}.pdf`,
+            objectKey: `payments/${paymentId}/proof.pdf`,
+          },
+          verifiedById:
+            paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
+          verifiedAt:
+            paymentStatus === "CONFIRMED"
+              ? new Date(Date.UTC(2026, 6, 10 + index))
+              : null,
+          receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
+        },
+      });
+    }
+  }
 }
 
 main()
   .then(async () => prisma.$disconnect())
   .catch(async (error) => {
     console.error(error);
     await prisma.$disconnect();
     process.exit(1);
   });
diff --git a/src/app/[locale]/(app)/orders/[id]/page.tsx b/src/app/[locale]/(app)/orders/[id]/page.tsx
new file mode 100644
index 0000000..49229b2
--- /dev/null
+++ b/src/app/[locale]/(app)/orders/[id]/page.tsx
@@ -0,0 +1,66 @@
+import { notFound } from "next/navigation";
+
+import { PaymentCreateForm, RefundForm, TransactionAction } from "@/components/transactions/transaction-actions";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+
+export default async function OrderDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "order.read");
+  const order = await repository.getOrder(context, id);
+  if (!order) notFound();
+  const canFinance = context.permissions.includes("*") || context.permissions.includes("payment.verify");
+  return (
+    <>
+      <header className="page-heading"><div><h1>{order.orderNumber}</h1><p>{order.customer.companyName} · {order.status}</p></div></header>
+      <section className="card section-card">
+        <h2>Operational statuses</h2>
+        <p>Payment {order.paymentStatus} · Purchase {order.purchaseStatus} · Inspection {order.inspectionStatus} · Packing {order.packingStatus} · Shipment {order.shipmentStatus}</p>
+        <p>Purchase eligible: {order.purchaseEligibilityFlag ? "Yes" : "No"}</p>
+        {order.status === "CONFIRMED" ? <TransactionAction confirmMessage="Enter purchasing? The server will enforce confirmed net payment coverage." endpoint={`/api/orders/${id}/purchase`} label="Start purchasing" /> : null}
+        {order.status === "PURCHASING" ? <TransactionAction body={{ status: "FULFILLING" }} confirmMessage="Move this order into fulfillment?" endpoint={`/api/orders/${id}/transition`} label="Start fulfillment" /> : null}
+        {order.status === "FULFILLING" ? <TransactionAction body={{ status: "SHIPPED" }} confirmMessage="Confirm inspection, packing and shipment?" endpoint={`/api/orders/${id}/transition`} label="Mark shipped" /> : null}
+        {order.status === "SHIPPED" ? <TransactionAction body={{ status: "COMPLETED" }} confirmMessage="Mark this order completed?" endpoint={`/api/orders/${id}/transition`} label="Complete order" /> : null}
+      </section>
+      {order.grossProfitUsd !== undefined ? (
+        <section className="card section-card">
+          <h2>Authorized finance summary</h2>
+          <p>Revenue ${order.revenueUsd.toString()} · Estimated cost ${order.estimatedCostUsd.toString()} · Actual cost ${order.actualCostUsd.toString()}</p>
+          <p>Gross profit ${order.grossProfitUsd.toString()} · Margin {order.grossMarginPercent.toString()}% · Net estimate ${order.netProfitEstimateUsd.toString()}</p>
+        </section>
+      ) : null}
+      <section className="card section-card">
+        <h2>Payments & refunds</h2>
+        {order.payments.map((payment) => (
+          <article className="record-card" key={payment.id}>
+            <strong>{payment.reference ?? payment.id} · {payment.status}</strong>
+            <span>{payment.currencyCode} {payment.amount.toString()} · USD {payment.amountUsd.toString()}</span>
+            <span>Proof: {JSON.stringify(payment.proofMetadata ?? {})}</span>
+            {canFinance && payment.status === "PENDING" ? (
+              <TransactionAction body={{ approved: true }} confirmMessage="Verify this proof and confirm the payment?" endpoint={`/api/payments/${payment.id}/verify`} label="Verify payment" />
+            ) : null}
+            {canFinance && payment.status === "PENDING" ? (
+              <TransactionAction body={{ approved: false, rejectionReason: "Payment proof could not be verified" }} confirmMessage="Reject this payment proof?" endpoint={`/api/payments/${payment.id}/verify`} label="Reject payment" />
+            ) : null}
+            {canFinance && payment.status === "CONFIRMED" ? <RefundForm paymentId={payment.id} /> : null}
+          </article>
+        ))}
+      </section>
+      <details className="card section-card">
+        <summary>Record installment payment</summary>
+        <PaymentCreateForm orderId={id} />
+      </details>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/orders/page.tsx b/src/app/[locale]/(app)/orders/page.tsx
new file mode 100644
index 0000000..fd69b11
--- /dev/null
+++ b/src/app/[locale]/(app)/orders/page.tsx
@@ -0,0 +1,38 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+
+export default async function OrdersPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "order.read");
+  const orders = await repository.listOrders(context);
+  return (
+    <>
+      <header className="page-heading"><div><h1>{locale === "zh" ? "销售订单与收款" : "Sales Orders & Payments"}</h1><p>Payment, purchase, inspection, packing and shipment readiness</p></div></header>
+      <section className="record-grid">
+        {orders.map((order) => (
+          <Link className="record-card" href={`/${locale}/orders/${order.id}`} key={order.id}>
+            <strong>{order.orderNumber} · {order.status}</strong>
+            <span>{order.customer.companyName}</span>
+            <span>{order.currencyCode} {order.total.toString()}</span>
+            <span>Payment {order.paymentStatus} · Purchase {order.purchaseStatus}</span>
+            <span>Inspection {order.inspectionStatus} · Packing {order.packingStatus} · Shipment {order.shipmentStatus}</span>
+          </Link>
+        ))}
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/products/[id]/page.tsx b/src/app/[locale]/(app)/products/[id]/page.tsx
new file mode 100644
index 0000000..b5094b6
--- /dev/null
+++ b/src/app/[locale]/(app)/products/[id]/page.tsx
@@ -0,0 +1,58 @@
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+
+export default async function ProductDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "product.read");
+  const product = await repository.getProduct(context, id);
+  if (!product) notFound();
+  return (
+    <>
+      <header className="page-heading">
+        <div><h1>{product.name}</h1><p>{product.sku} · {product.category.name} · {product.condition}</p></div>
+      </header>
+      <section className="card section-card">
+        <h2>Commercial & export data</h2>
+        <dl className="detail-grid">
+          <div><dt>Base model</dt><dd>{product.baseModel ?? "—"}</dd></div>
+          <div><dt>Reference price</dt><dd>{product.referenceCurrencyCode ?? ""} {product.referencePrice?.toString() ?? "—"}</dd></div>
+          <div><dt>HS code</dt><dd>{product.hsCode ?? "—"}</dd></div>
+          <div><dt>Export risk</dt><dd>{product.exportControlRisk}</dd></div>
+          <div><dt>Availability</dt><dd>{product.availability}</dd></div>
+          <div><dt>Dimensions</dt><dd>{JSON.stringify(product.dimensions ?? {})}</dd></div>
+        </dl>
+      </section>
+      <section className="record-grid">
+        {product.variants.map((variant) => (
+          <article className="record-card" key={variant.id}>
+            <strong>v{variant.configurationVersion} · {variant.name}</strong>
+            <span>{variant.sku}</span>
+            <span>{JSON.stringify(variant.configuration)}</span>
+          </article>
+        ))}
+      </section>
+      <details className="card section-card">
+        <summary>Edit product</summary>
+        <ApiMutationForm endpoint={`/api/products/${id}`} failureMessage="Update failed" loadingLabel="Saving..." method="PATCH" submitLabel="Save" successMessage="Product updated">
+          <label>Name<input defaultValue={product.name} name="name" required /></label>
+          <label>Availability<select defaultValue={product.availability} name="availability"><option>AVAILABLE</option><option>IN_STOCK</option><option>LIMITED</option><option>ON_REQUEST</option><option>UNAVAILABLE</option></select></label>
+          <label>Export risk<select defaultValue={product.exportControlRisk} name="exportControlRisk"><option>LOW</option><option>REVIEW_REQUIRED</option><option>RESTRICTED</option></select></label>
+        </ApiMutationForm>
+      </details>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/products/page.tsx b/src/app/[locale]/(app)/products/page.tsx
new file mode 100644
index 0000000..36888f4
--- /dev/null
+++ b/src/app/[locale]/(app)/products/page.tsx
@@ -0,0 +1,55 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ProductCreateForm } from "@/components/transactions/transaction-actions";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+
+export default async function ProductsPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "product.read");
+  const [products, categories] = await Promise.all([
+    repository.listProducts(context),
+    getPrisma().productCategory.findMany({
+      where: { deletedAt: null },
+      orderBy: { name: "asc" },
+    }),
+  ]);
+  const zh = locale === "zh";
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{zh ? "产品与配置" : "Products & Configurations"}</h1>
+          <p>{zh ? "产品条件、版本、价格及出口资料" : "Conditions, versions, pricing and export metadata"}</p>
+        </div>
+      </header>
+      <section className="record-grid">
+        {products.map((product) => (
+          <Link className="record-card" href={`/${locale}/products/${product.id}`} key={product.id}>
+            <strong>{product.sku} · {product.name}</strong>
+            <span>{product.category.name} · {product.condition}</span>
+            <span>{product.availability} · {product.variants.length} configuration(s)</span>
+            <span>HS {product.hsCode ?? "—"} · Export {product.exportControlRisk}</span>
+          </Link>
+        ))}
+      </section>
+      <details className="card section-card">
+        <summary>{zh ? "新建产品" : "Create product"}</summary>
+        <ProductCreateForm categories={categories.map(({ id, name }) => ({ id, name }))} />
+      </details>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/quotes/[id]/page.tsx b/src/app/[locale]/(app)/quotes/[id]/page.tsx
new file mode 100644
index 0000000..748a700
--- /dev/null
+++ b/src/app/[locale]/(app)/quotes/[id]/page.tsx
@@ -0,0 +1,71 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { TransactionAction } from "@/components/transactions/transaction-actions";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+
+export default async function QuoteDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "quote.read");
+  const quote = await repository.getQuote(context, id);
+  if (!quote) notFound();
+  const current = quote.versions[0];
+  return (
+    <>
+      <header className="page-heading">
+        <div><h1>{quote.quoteNumber}</h1><p>{quote.customer.companyName} · {quote.status} · v{quote.currentVersion}</p></div>
+        <Link className="button button-secondary" href={`/api/quotes/${id}/pdf?locale=${locale}`} target="_blank">PDF</Link>
+      </header>
+      <section className="card section-card">
+        <h2>Commercial summary</h2>
+        <p>{current.currencyCode} {current.total.toString()} · {current.incoterm ?? "—"}</p>
+        <p>{current.paymentTerms ?? "—"}</p>
+        <div className="button-row">
+          {quote.status === "DRAFT" ? <TransactionAction body={{ status: "PENDING_APPROVAL" }} confirmMessage="Submit this version for approval?" endpoint={`/api/quotes/${id}/transition`} label="Submit approval" /> : null}
+          {quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "APPROVED", note: "Commercial terms and margin reviewed" }} confirmMessage="Approve this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Approve" /> : null}
+          {quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "REJECTED", note: "Commercial review rejected" }} confirmMessage="Reject this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
+          {quote.status === "APPROVED" ? <TransactionAction body={{ status: "SENT" }} confirmMessage="Send and permanently lock this version?" endpoint={`/api/quotes/${id}/transition`} label="Mark sent" /> : null}
+          {quote.status === "SENT" ? <TransactionAction body={{ status: "VIEWED" }} confirmMessage="Record customer view?" endpoint={`/api/quotes/${id}/transition`} label="Mark viewed" /> : null}
+          {["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "ACCEPTED" }} confirmMessage="Record customer acceptance?" endpoint={`/api/quotes/${id}/transition`} label="Accept" /> : null}
+          {["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "REJECTED", note: "Customer rejected quotation" }} confirmMessage="Record customer rejection?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
+          {quote.status === "ACCEPTED" ? <TransactionAction confirmMessage="Convert this accepted version to one sales order?" endpoint={`/api/quotes/${id}/convert`} label="Convert to order" /> : null}
+          {current.immutableAt ? <TransactionAction confirmMessage="Create a new editable version from this immutable version?" endpoint={`/api/quotes/${id}/revise`} label="Revise / Copy" /> : null}
+        </div>
+      </section>
+      {!current.immutableAt ? (
+        <details className="card section-card">
+          <summary>Edit current draft terms</summary>
+          <ApiMutationForm endpoint={`/api/quotes/versions/${current.id}`} failureMessage="Update failed" loadingLabel="Saving..." method="PATCH" submitLabel="Save" successMessage="Draft updated">
+            <label>Payment terms<input defaultValue={current.paymentTerms ?? ""} name="paymentTerms" /></label>
+            <label>Delivery terms<input defaultValue={current.deliveryTerms ?? ""} name="deliveryTerms" /></label>
+            <label>Warranty<input defaultValue={current.warrantyTerms ?? ""} name="warrantyTerms" /></label>
+            <label>Remarks<textarea defaultValue={current.remarks ?? ""} name="remarks" /></label>
+          </ApiMutationForm>
+        </details>
+      ) : null}
+      <section className="card section-card">
+        <h2>Version history</h2>
+        {quote.versions.map((version) => (
+          <article className="record-card" key={version.id}>
+            <strong>Version {version.number} · {version.immutableAt ? "Immutable" : "Editable"}</strong>
+            <span>{version.currencyCode} {version.total.toString()}</span>
+            {version.items.map((item) => <span key={item.id}>{item.quantity} × {item.description} · {item.lineTotal.toString()}</span>)}
+          </article>
+        ))}
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/quotes/page.tsx b/src/app/[locale]/(app)/quotes/page.tsx
new file mode 100644
index 0000000..9e9e266
--- /dev/null
+++ b/src/app/[locale]/(app)/quotes/page.tsx
@@ -0,0 +1,56 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { QuoteCreateForm } from "@/components/transactions/transaction-actions";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaTransactionsRepository();
+const crm = new PrismaCrmRepository();
+
+export default async function QuotesPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "quote.read");
+  const [quotes, products, customers] = await Promise.all([
+    repository.listQuotes(context),
+    repository.listProducts(context),
+    crm.listCustomers(context, { pageSize: 100 }),
+  ]);
+  const configurations = products.flatMap((product) =>
+    product.variants.map((variant) => ({
+      id: variant.id,
+      productId: product.id,
+      label: `${product.sku} / v${variant.configurationVersion} ${variant.name}`,
+    })),
+  );
+  const zh = locale === "zh";
+  return (
+    <>
+      <header className="page-heading"><div><h1>{zh ? "报价单" : "Quotations"}</h1><p>{zh ? "版本、审批与客户接受" : "Versions, approval and customer acceptance"}</p></div></header>
+      <section className="record-grid">
+        {quotes.map((quote) => (
+          <Link className="record-card" href={`/${locale}/quotes/${quote.id}`} key={quote.id}>
+            <strong>{quote.quoteNumber} · v{quote.currentVersion}</strong>
+            <span>{quote.customer.companyName}</span>
+            <span>{quote.status}</span>
+            <span>{quote.versions[0]?.currencyCode} {quote.versions[0]?.total.toString()}</span>
+          </Link>
+        ))}
+      </section>
+      <details className="card section-card">
+        <summary>{zh ? "创建报价" : "Build quotation"}</summary>
+        <QuoteCreateForm configurations={configurations} customers={customers.items.map(({ id, companyName }) => ({ id, companyName }))} />
+      </details>
+    </>
+  );
+}
diff --git a/src/app/api/orders/[id]/purchase/route.ts b/src/app/api/orders/[id]/purchase/route.ts
index 3a23d63..ab74b42 100644
--- a/src/app/api/orders/[id]/purchase/route.ts
+++ b/src/app/api/orders/[id]/purchase/route.ts
@@ -66,40 +66,47 @@ export async function POST(
           ),
         },
         input.overrideReason === undefined
           ? undefined
           : { actorId: context.userId, reason: input.overrideReason },
       );
 
       if (!gate.overridden) {
         return transaction.salesOrder.update({
           where: { id },
-          data: { status: "PURCHASING", version: { increment: 1 } },
+          data: {
+            status: "PURCHASING",
+            purchaseStatus: "PURCHASING",
+            purchaseEligibilityFlag: true,
+            version: { increment: 1 },
+          },
           select: { id: true, orderNumber: true, status: true, version: true },
         });
       }
 
       const audit = await writeAudit(transaction, {
         actorId: context.userId,
         action: "sales_order.purchase_override",
         entityType: "SalesOrder",
         entityId: id,
         metadata: {
           reason: gate.override.reason,
           requiredUsd: current.totalUsd.toString(),
           netPaidUsd: gate.netPaidUsd,
         },
       });
       return transaction.salesOrder.update({
         where: { id },
         data: {
           status: "PURCHASING",
+          purchaseStatus: "PURCHASING_OVERRIDE",
+          purchaseEligibilityFlag: true,
           version: { increment: 1 },
           purchaseOverrideActorId: gate.override.actorId,
           purchaseOverrideReason: gate.override.reason,
           purchaseOverrideAuditId: (audit as { id: string }).id,
           purchaseOverriddenAt: new Date(),
         },
         select: { id: true, orderNumber: true, status: true, version: true },
       });
     });
 
diff --git a/src/app/api/orders/[id]/route.ts b/src/app/api/orders/[id]/route.ts
new file mode 100644
index 0000000..6085067
--- /dev/null
+++ b/src/app/api/orders/[id]/route.ts
@@ -0,0 +1,24 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "order.read");
+    const order = await repository.getOrder(context, (await params).id);
+    if (!order) {
+      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+    }
+    return success(order);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/orders/[id]/transition/route.ts b/src/app/api/orders/[id]/transition/route.ts
new file mode 100644
index 0000000..81032b2
--- /dev/null
+++ b/src/app/api/orders/[id]/transition/route.ts
@@ -0,0 +1,23 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { orderTransitionSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "order.update");
+    const input = orderTransitionSchema.parse(await request.json());
+    return success(
+      await repository.transitionOrder(context, (await params).id, input.status),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/orders/route.ts b/src/app/api/orders/route.ts
new file mode 100644
index 0000000..1ca91ea
--- /dev/null
+++ b/src/app/api/orders/route.ts
@@ -0,0 +1,16 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "order.read");
+    return success(await repository.listOrders(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/payments/[id]/refund/route.ts b/src/app/api/payments/[id]/refund/route.ts
new file mode 100644
index 0000000..2f4002b
--- /dev/null
+++ b/src/app/api/payments/[id]/refund/route.ts
@@ -0,0 +1,24 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { refundSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "refund.create");
+    const input = refundSchema.parse(await request.json());
+    return success(
+      await repository.refundPayment(context, (await params).id, input),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/payments/[id]/verify/route.ts b/src/app/api/payments/[id]/verify/route.ts
new file mode 100644
index 0000000..60ee4b9
--- /dev/null
+++ b/src/app/api/payments/[id]/verify/route.ts
@@ -0,0 +1,28 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { paymentVerificationSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "payment.verify");
+    const input = paymentVerificationSchema.parse(await request.json());
+    return success(
+      await repository.verifyPayment(
+        context,
+        (await params).id,
+        input.approved,
+        "rejectionReason" in input ? input.rejectionReason : undefined,
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/payments/route.ts b/src/app/api/payments/route.ts
new file mode 100644
index 0000000..ad1fa65
--- /dev/null
+++ b/src/app/api/payments/route.ts
@@ -0,0 +1,40 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { paymentSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "payment.read");
+    const salesOrderId = new URL(request.url).searchParams.get("salesOrderId");
+    if (!salesOrderId) {
+      throw new DomainError(
+        "ORDER_ID_REQUIRED",
+        "salesOrderId is required",
+      );
+    }
+    const order = await repository.getOrder(context, salesOrderId);
+    if (!order) {
+      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+    }
+    return success(order.payments);
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "payment.create");
+    const input = paymentSchema.parse(await request.json());
+    return success(await repository.createPayment(context, input), 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/products/[id]/route.ts b/src/app/api/products/[id]/route.ts
new file mode 100644
index 0000000..e8c9c78
--- /dev/null
+++ b/src/app/api/products/[id]/route.ts
@@ -0,0 +1,41 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { productUpdateSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "product.read");
+    const product = await repository.getProduct(context, (await params).id);
+    if (!product) {
+      throw new DomainError("PRODUCT_NOT_FOUND", "Product not found", 404);
+    }
+    return success(product);
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "product.update");
+    const input = productUpdateSchema.parse(await request.json());
+    return success(
+      await repository.updateProduct(context, (await params).id, input),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/products/route.ts b/src/app/api/products/route.ts
new file mode 100644
index 0000000..d0a132b
--- /dev/null
+++ b/src/app/api/products/route.ts
@@ -0,0 +1,28 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { productSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "product.read");
+    return success(await repository.listProducts(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "product.create");
+    const input = productSchema.parse(await request.json());
+    return success(await repository.createProduct(context, input), 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/[id]/convert/route.ts b/src/app/api/quotes/[id]/convert/route.ts
new file mode 100644
index 0000000..30d8616
--- /dev/null
+++ b/src/app/api/quotes/[id]/convert/route.ts
@@ -0,0 +1,21 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { convertAcceptedQuote } from "@/modules/transactions/transaction-service";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    return success(
+      await convertAcceptedQuote(repository, context, (await params).id),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/[id]/pdf/route.ts b/src/app/api/quotes/[id]/pdf/route.ts
new file mode 100644
index 0000000..3d1e497
--- /dev/null
+++ b/src/app/api/quotes/[id]/pdf/route.ts
@@ -0,0 +1,64 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { renderQuotePdf } from "@/modules/quotes/quote-pdf";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "quote.read");
+  const quote = await repository.getQuote(context, (await params).id);
+  if (!quote) {
+    throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
+  }
+  const version = quote.versions[0];
+  const profile = await getPrisma().setting.findUnique({
+    where: { namespace_key: { namespace: "company", key: "profile" } },
+  });
+  const company = (profile?.value ?? {}) as Record<string, unknown>;
+  const locale = new URL(request.url).searchParams.get("locale") === "zh" ? "zh" : "en";
+  const pdf = renderQuotePdf({
+    locale,
+    company: {
+      name: String(company.name ?? "Atlas Global Systems"),
+      address: String(company.address ?? ""),
+    },
+    customer: {
+      name: quote.customer.companyName,
+      address: JSON.stringify(quote.customer.billingAddress ?? ""),
+    },
+    quoteNumber: quote.quoteNumber,
+    version: version.number,
+    currencyCode: version.currencyCode,
+    items: version.items.map((item) => ({
+      description: item.description,
+      configuration: JSON.stringify(item.configuration ?? {}),
+      quantity: item.quantity,
+      unitPrice: item.unitPrice.toString(),
+      lineTotal: item.lineTotal.toString(),
+      imageLabel: "Product configuration image",
+    })),
+    total: version.total.toString(),
+    incoterm: version.incoterm,
+    paymentTerms: version.paymentTerms,
+    deliveryTerms: version.deliveryTerms,
+    warrantyTerms: version.warrantyTerms,
+    remarks: version.remarks,
+    bank: {
+      beneficiary: String(company.bankBeneficiary ?? company.name ?? ""),
+      account: String(company.bankAccount ?? ""),
+    },
+  });
+  return new Response(pdf as BodyInit, {
+    headers: {
+      "Content-Type": "application/pdf",
+      "Content-Disposition": `inline; filename="${quote.quoteNumber}-v${version.number}.pdf"`,
+    },
+  });
+}
diff --git a/src/app/api/quotes/[id]/revise/route.ts b/src/app/api/quotes/[id]/revise/route.ts
new file mode 100644
index 0000000..b18cd06
--- /dev/null
+++ b/src/app/api/quotes/[id]/revise/route.ts
@@ -0,0 +1,21 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { reviseQuote } from "@/modules/transactions/transaction-service";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    return success(
+      await reviseQuote(repository, context, (await params).id),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/[id]/route.ts b/src/app/api/quotes/[id]/route.ts
new file mode 100644
index 0000000..49e111d
--- /dev/null
+++ b/src/app/api/quotes/[id]/route.ts
@@ -0,0 +1,24 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "quote.read");
+    const quote = await repository.getQuote(context, (await params).id);
+    if (!quote) {
+      throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
+    }
+    return success(quote);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/[id]/transition/route.ts b/src/app/api/quotes/[id]/transition/route.ts
new file mode 100644
index 0000000..de8a9f6
--- /dev/null
+++ b/src/app/api/quotes/[id]/transition/route.ts
@@ -0,0 +1,28 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { quoteTransitionSchema } from "@/modules/transactions/transaction-schemas";
+import { transitionQuote } from "@/modules/transactions/transaction-service";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    const input = quoteTransitionSchema.parse(await request.json());
+    return success(
+      await transitionQuote(
+        repository,
+        context,
+        (await params).id,
+        input.status,
+        input.note,
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/route.ts b/src/app/api/quotes/route.ts
new file mode 100644
index 0000000..3f4e57b
--- /dev/null
+++ b/src/app/api/quotes/route.ts
@@ -0,0 +1,28 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
+import { quoteSchema } from "@/modules/transactions/transaction-schemas";
+
+const repository = new PrismaTransactionsRepository();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "quote.read");
+    return success(await repository.listQuotes(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "quote.create");
+    const input = quoteSchema.parse(await request.json());
+    return success(await repository.createQuote(context, input), 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 6164cb8..14dd4a4 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -13,20 +13,23 @@ export function AppShell({
   locale: Locale;
   user: { name?: string | null; email?: string | null };
   children: React.ReactNode;
 }) {
   const dictionary = getDictionary(locale);
   const nav = [
     ["dashboard", "D", dictionary.nav.dashboard],
     ["leads", "L", dictionary.nav.leads],
     ["customers", "C", dictionary.nav.customers],
     ["opportunities", "O", dictionary.nav.opportunities],
+    ["products", "P", locale === "zh" ? "产品" : "Products"],
+    ["quotes", "Q", locale === "zh" ? "报价" : "Quotes"],
+    ["orders", "S", locale === "zh" ? "订单" : "Orders"],
     ["users", "U", dictionary.nav.users],
     ["roles", "R", dictionary.nav.roles],
   ] as const;
   const targetLocale = locale === "en" ? "zh" : "en";
   const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }
diff --git a/src/components/transactions/transaction-actions.tsx b/src/components/transactions/transaction-actions.tsx
new file mode 100644
index 0000000..68ba3a7
--- /dev/null
+++ b/src/components/transactions/transaction-actions.tsx
@@ -0,0 +1,342 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+type Feedback = "idle" | "loading" | "success" | "error";
+
+async function requestJson(
+  endpoint: string,
+  method: "POST" | "PATCH",
+  body: unknown,
+) {
+  const response = await fetch(endpoint, {
+    method,
+    headers: { "Content-Type": "application/json" },
+    body: JSON.stringify(body),
+  });
+  const result = (await response.json()) as {
+    success: boolean;
+    error?: { message?: string };
+  };
+  if (!response.ok || !result.success) {
+    throw new Error(result.error?.message ?? "Action failed");
+  }
+  return result;
+}
+
+function FeedbackText({
+  state,
+  message,
+}: {
+  state: Feedback;
+  message: string;
+}) {
+  return message ? (
+    <p
+      className={state === "error" ? "form-feedback error" : "form-feedback success"}
+      role="status"
+    >
+      {message}
+    </p>
+  ) : null;
+}
+
+export function TransactionAction({
+  endpoint,
+  label,
+  body = {},
+  confirmMessage,
+}: {
+  endpoint: string;
+  label: string;
+  body?: Record<string, unknown>;
+  confirmMessage: string;
+}) {
+  const router = useRouter();
+  const [state, setState] = useState<Feedback>("idle");
+  const [message, setMessage] = useState("");
+
+  async function run() {
+    if (!window.confirm(confirmMessage)) return;
+    setState("loading");
+    setMessage("");
+    try {
+      await requestJson(endpoint, "POST", body);
+      setState("success");
+      setMessage("Completed");
+      router.refresh();
+    } catch (error) {
+      setState("error");
+      setMessage(error instanceof Error ? error.message : "Action failed");
+    }
+  }
+
+  return (
+    <span>
+      <button
+        className="button button-secondary"
+        disabled={state === "loading"}
+        onClick={run}
+        type="button"
+      >
+        {state === "loading" ? "Working..." : label}
+      </button>
+      <FeedbackText message={message} state={state} />
+    </span>
+  );
+}
+
+function useTransactionSubmit() {
+  const router = useRouter();
+  const [state, setState] = useState<Feedback>("idle");
+  const [message, setMessage] = useState("");
+  return {
+    state,
+    message,
+    async submit(endpoint: string, body: unknown, successMessage: string) {
+      setState("loading");
+      setMessage("");
+      try {
+        await requestJson(endpoint, "POST", body);
+        setState("success");
+        setMessage(successMessage);
+        router.refresh();
+        return true;
+      } catch (error) {
+        setState("error");
+        setMessage(error instanceof Error ? error.message : "Action failed");
+        return false;
+      }
+    },
+  };
+}
+
+export function ProductCreateForm({
+  categories,
+}: {
+  categories: Array<{ id: string; name: string }>;
+}) {
+  const action = useTransactionSubmit();
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const form = event.currentTarget;
+    const data = new FormData(form);
+    const body = {
+      sku: data.get("sku"),
+      name: data.get("name"),
+      categoryId: data.get("categoryId"),
+      condition: data.get("condition"),
+      baseModel: data.get("baseModel") || null,
+      specifications: { summary: data.get("specifications") },
+      referencePrice: data.get("referencePrice") || null,
+      referenceCurrencyCode: "USD",
+      dimensions: {
+        lengthCm: Number(data.get("lengthCm")),
+        widthCm: Number(data.get("widthCm")),
+        heightCm: Number(data.get("heightCm")),
+      },
+      hsCode: data.get("hsCode") || null,
+      exportControlRisk: data.get("exportControlRisk"),
+      media: [],
+      availability: data.get("availability"),
+      variants: [
+        {
+          sku: data.get("variantSku"),
+          name: data.get("variantName"),
+          configurationVersion: 1,
+          configuration: { summary: data.get("configuration") },
+          cost: data.get("cost") || null,
+          currencyCode: "USD",
+        },
+      ],
+    };
+    if (await action.submit("/api/products", body, "Product created")) form.reset();
+  }
+  return (
+    <form className="crm-form" onSubmit={submit}>
+      <label>SKU<input name="sku" required /></label>
+      <label>Name<input name="name" required /></label>
+      <label>Category<select name="categoryId" required><option value="">Select</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
+      <label>Condition<select name="condition"><option>NEW</option><option>REFURBISHED</option><option>USED</option><option>OPEN_BOX</option></select></label>
+      <label>Base model<input name="baseModel" /></label>
+      <label>Specifications<input name="specifications" required /></label>
+      <label>Reference price<input min="0" name="referencePrice" step="0.0001" type="number" /></label>
+      <label>Variant SKU<input name="variantSku" required /></label>
+      <label>Configuration name<input name="variantName" required /></label>
+      <label>Configuration<input name="configuration" required /></label>
+      <label>Estimated cost USD<input min="0" name="cost" step="0.0001" type="number" /></label>
+      <label>Length cm<input min="0" name="lengthCm" step="0.1" type="number" /></label>
+      <label>Width cm<input min="0" name="widthCm" step="0.1" type="number" /></label>
+      <label>Height cm<input min="0" name="heightCm" step="0.1" type="number" /></label>
+      <label>HS code<input name="hsCode" /></label>
+      <label>Export risk<select name="exportControlRisk"><option>LOW</option><option>REVIEW_REQUIRED</option><option>RESTRICTED</option></select></label>
+      <label>Availability<select name="availability"><option>AVAILABLE</option><option>IN_STOCK</option><option>LIMITED</option><option>ON_REQUEST</option><option>UNAVAILABLE</option></select></label>
+      <button className="button" disabled={action.state === "loading"} type="submit">Create product</button>
+      <FeedbackText message={action.message} state={action.state} />
+    </form>
+  );
+}
+
+export function QuoteCreateForm({
+  customers,
+  configurations,
+}: {
+  customers: Array<{ id: string; companyName: string }>;
+  configurations: Array<{
+    id: string;
+    productId: string;
+    label: string;
+  }>;
+}) {
+  const action = useTransactionSubmit();
+  const [itemRows, setItemRows] = useState([0]);
+  const [nextItemRow, setNextItemRow] = useState(1);
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const form = event.currentTarget;
+    const data = new FormData(form);
+    const items = itemRows.map((row) => {
+      const selected = configurations.find(
+        ({ id }) => id === data.get(`variantId_${row}`),
+      );
+      if (!selected) throw new Error("Select a configuration for every item");
+      return {
+        productId: selected.productId,
+        variantId: selected.id,
+        quantity: Number(data.get(`quantity_${row}`)),
+        unitPrice: data.get(`unitPrice_${row}`),
+        discount: data.get(`discount_${row}`) || "0",
+      };
+    });
+    const body = {
+      customerId: data.get("customerId"),
+      currencyCode: data.get("currencyCode"),
+      exchangeRateToUsd: data.get("exchangeRateToUsd"),
+      shipping: data.get("shipping") || "0",
+      insurance: data.get("insurance") || "0",
+      tax: data.get("tax") || "0",
+      bankFees: data.get("bankFees") || "0",
+      incoterm: data.get("incoterm") || null,
+      paymentTerms: data.get("paymentTerms") || null,
+      deliveryTerms: data.get("deliveryTerms") || null,
+      warrantyTerms: data.get("warrantyTerms") || null,
+      remarks: data.get("remarks") || null,
+      items,
+    };
+    if (await action.submit("/api/quotes", body, "Quotation created")) form.reset();
+  }
+  return (
+    <form className="crm-form" onSubmit={submit}>
+      <label>Customer<select name="customerId" required><option value="">Select</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
+      {itemRows.map((row, index) => (
+        <fieldset className="card" key={row}>
+          <legend>Item {index + 1}</legend>
+          <label>Configuration<select name={`variantId_${row}`} required><option value="">Select</option>{configurations.map((configuration) => <option key={configuration.id} value={configuration.id}>{configuration.label}</option>)}</select></label>
+          <label>Quantity<input defaultValue="1" min="1" name={`quantity_${row}`} required type="number" /></label>
+          <label>Unit price<input min="0.0001" name={`unitPrice_${row}`} required step="0.0001" type="number" /></label>
+          <label>Discount<input defaultValue="0" min="0" name={`discount_${row}`} step="0.0001" type="number" /></label>
+          {itemRows.length > 1 ? (
+            <button className="button button-secondary" onClick={() => setItemRows((current) => current.filter((item) => item !== row))} type="button">Remove item</button>
+          ) : null}
+        </fieldset>
+      ))}
+      <button
+        className="button button-secondary"
+        onClick={() => {
+          setItemRows((current) => [...current, nextItemRow]);
+          setNextItemRow((current) => current + 1);
+        }}
+        type="button"
+      >
+        Add item
+      </button>
+      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
+      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
+      <label>Shipping<input defaultValue="0" min="0" name="shipping" step="0.0001" type="number" /></label>
+      <label>Insurance<input defaultValue="0" min="0" name="insurance" step="0.0001" type="number" /></label>
+      <label>Tax<input defaultValue="0" min="0" name="tax" step="0.0001" type="number" /></label>
+      <label>Bank fees<input defaultValue="0" min="0" name="bankFees" step="0.0001" type="number" /></label>
+      <label>Incoterm<input defaultValue="CIF" name="incoterm" /></label>
+      <label>Payment terms<input defaultValue="100% T/T Before Purchase" name="paymentTerms" /></label>
+      <label>Delivery terms<input defaultValue="30 days after confirmed payment" name="deliveryTerms" /></label>
+      <label>Warranty<input defaultValue="12 months" name="warrantyTerms" /></label>
+      <label>Remarks<textarea name="remarks" /></label>
+      <button className="button" disabled={action.state === "loading"} type="submit">Create quotation</button>
+      <FeedbackText message={action.message} state={action.state} />
+    </form>
+  );
+}
+
+export function PaymentCreateForm({ orderId }: { orderId: string }) {
+  const action = useTransactionSubmit();
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const form = event.currentTarget;
+    const data = new FormData(form);
+    if (
+      await action.submit(
+        "/api/payments",
+        {
+          salesOrderId: orderId,
+          reference: data.get("reference") || null,
+          amount: data.get("amount"),
+          currencyCode: data.get("currencyCode"),
+          exchangeRateToUsd: data.get("exchangeRateToUsd"),
+          receivedAt: new Date().toISOString(),
+          proofMetadata: {
+            fileName: data.get("proofFileName"),
+            objectKey: data.get("proofObjectKey"),
+          },
+        },
+        "Payment submitted for finance verification",
+      )
+    )
+      form.reset();
+  }
+  return (
+    <form className="crm-form" onSubmit={submit}>
+      <label>Reference<input name="reference" /></label>
+      <label>Amount<input min="0.0001" name="amount" required step="0.0001" type="number" /></label>
+      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
+      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
+      <label>Proof file name<input name="proofFileName" required /></label>
+      <label>Proof object key<input name="proofObjectKey" required /></label>
+      <button className="button" disabled={action.state === "loading"} type="submit">Submit payment</button>
+      <FeedbackText message={action.message} state={action.state} />
+    </form>
+  );
+}
+
+export function RefundForm({ paymentId }: { paymentId: string }) {
+  const action = useTransactionSubmit();
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    if (!window.confirm("Record this refund and recompute purchase eligibility?")) return;
+    const form = event.currentTarget;
+    const data = new FormData(form);
+    if (
+      await action.submit(
+        `/api/payments/${paymentId}/refund`,
+        {
+          amount: data.get("amount"),
+          currencyCode: data.get("currencyCode"),
+          exchangeRateToUsd: data.get("exchangeRateToUsd"),
+          reason: data.get("reason"),
+        },
+        "Refund recorded",
+      )
+    )
+      form.reset();
+  }
+  return (
+    <form className="crm-form" onSubmit={submit}>
+      <label>Refund amount<input min="0.0001" name="amount" required step="0.0001" type="number" /></label>
+      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
+      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
+      <label>Reason<input name="reason" required /></label>
+      <button className="button button-secondary" disabled={action.state === "loading"} type="submit">Refund</button>
+      <FeedbackText message={action.message} state={action.state} />
+    </form>
+  );
+}
diff --git a/src/modules/finance/field-redaction.test.ts b/src/modules/finance/field-redaction.test.ts
new file mode 100644
index 0000000..ec8a23e
--- /dev/null
+++ b/src/modules/finance/field-redaction.test.ts
@@ -0,0 +1,64 @@
+import { describe, expect, it } from "vitest";
+import Decimal from "decimal.js";
+
+import { redactFinancialFields } from "@/modules/finance/field-redaction";
+
+describe("transaction field-level security", () => {
+  const order = {
+    id: "order-1",
+    totalUsd: "1000",
+    revenueUsd: "1000",
+    estimatedCostUsd: "700",
+    actualCostUsd: "710",
+    grossProfitUsd: "290",
+    grossMarginPercent: "29",
+    netProfitEstimateUsd: "270",
+    items: [
+      {
+        description: "GPU server",
+        estimatedCostUsd: "700",
+        unitPrice: "1000",
+      },
+    ],
+  };
+
+  it("removes all sensitive cost and profit fields without explicit permissions", () => {
+    expect(
+      redactFinancialFields(order, {
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["order.read"],
+      }),
+    ).toEqual({
+      id: "order-1",
+      totalUsd: "1000",
+      revenueUsd: "1000",
+      items: [{ description: "GPU server", unitPrice: "1000" }],
+    });
+  });
+
+  it("preserves sensitive fields for finance readers", () => {
+    expect(
+      redactFinancialFields(order, {
+        userId: "finance-1",
+        roles: ["FINANCE"],
+        permissions: ["order.read", "purchase.cost.read", "finance.profit.read"],
+      }),
+    ).toEqual(order);
+  });
+
+  it("preserves Decimal value objects while traversing records", () => {
+    const total = new Decimal("123.45");
+    const result = redactFinancialFields(
+      { total, estimatedCostUsd: new Decimal("80") },
+      {
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["order.read"],
+      },
+    );
+
+    expect(result.total).toBe(total);
+    expect(result).not.toHaveProperty("estimatedCostUsd");
+  });
+});
diff --git a/src/modules/finance/field-redaction.ts b/src/modules/finance/field-redaction.ts
new file mode 100644
index 0000000..652959f
--- /dev/null
+++ b/src/modules/finance/field-redaction.ts
@@ -0,0 +1,59 @@
+import type { AuthorizationContext } from "@/lib/rbac";
+
+const COST_FIELDS = new Set([
+  "estimatedCostUsd",
+  "actualCostUsd",
+  "cost",
+  "costUsd",
+  "unitCost",
+  "unitCostUsd",
+]);
+const PROFIT_FIELDS = new Set([
+  "estimatedProfitUsd",
+  "grossProfitUsd",
+  "grossMarginPercent",
+  "netProfitEstimateUsd",
+  "profitUsd",
+  "marginPercent",
+]);
+
+function redact(
+  value: unknown,
+  canReadCost: boolean,
+  canReadProfit: boolean,
+): unknown {
+  if (Array.isArray(value)) {
+    return value.map((item) => redact(item, canReadCost, canReadProfit));
+  }
+  if (!value || typeof value !== "object" || value instanceof Date) {
+    return value;
+  }
+  const prototype = Object.getPrototypeOf(value);
+  if (prototype !== Object.prototype && prototype !== null) {
+    return value;
+  }
+  return Object.fromEntries(
+    Object.entries(value as Record<string, unknown>)
+      .filter(
+        ([key]) =>
+          (canReadCost || !COST_FIELDS.has(key)) &&
+          (canReadProfit || !PROFIT_FIELDS.has(key)),
+      )
+      .map(([key, item]) => [
+        key,
+        redact(item, canReadCost, canReadProfit),
+      ]),
+  );
+}
+
+export function redactFinancialFields<T>(
+  value: T,
+  context: AuthorizationContext,
+): T {
+  const all = context.permissions.includes("*");
+  return redact(
+    value,
+    all || context.permissions.includes("purchase.cost.read"),
+    all || context.permissions.includes("finance.profit.read"),
+  ) as T;
+}
diff --git a/src/modules/finance/order-financials.test.ts b/src/modules/finance/order-financials.test.ts
new file mode 100644
index 0000000..edd0dd5
--- /dev/null
+++ b/src/modules/finance/order-financials.test.ts
@@ -0,0 +1,34 @@
+import { describe, expect, it } from "vitest";
+
+import { calculateOrderFinancials } from "@/modules/finance/order-financials";
+
+describe("sales order financials", () => {
+  it("calculates actual cost, gross profit, margin and net estimate without float drift", () => {
+    expect(
+      calculateOrderFinancials({
+        revenueUsd: "1000.00",
+        estimatedCostUsd: "700.00",
+        actualCostsUsd: ["600.10", "79.90"],
+        estimatedOperatingCostsUsd: "30.00",
+      }),
+    ).toEqual({
+      revenueUsd: "1000.0000",
+      estimatedCostUsd: "700.0000",
+      actualCostUsd: "680.0000",
+      grossProfitUsd: "320.0000",
+      grossMarginPercent: "32.0000",
+      netProfitEstimateUsd: "290.0000",
+    });
+  });
+
+  it("uses estimated cost until actual costs have been recorded", () => {
+    expect(
+      calculateOrderFinancials({
+        revenueUsd: "1000",
+        estimatedCostUsd: "700",
+        actualCostsUsd: [],
+        estimatedOperatingCostsUsd: "30",
+      }).grossProfitUsd,
+    ).toBe("300.0000");
+  });
+});
diff --git a/src/modules/finance/order-financials.ts b/src/modules/finance/order-financials.ts
new file mode 100644
index 0000000..ea89854
--- /dev/null
+++ b/src/modules/finance/order-financials.ts
@@ -0,0 +1,34 @@
+import Decimal from "decimal.js";
+
+function fixed(value: Decimal.Value) {
+  return new Decimal(value).toFixed(4);
+}
+
+export function calculateOrderFinancials(input: {
+  revenueUsd: string;
+  estimatedCostUsd: string;
+  actualCostsUsd: string[];
+  estimatedOperatingCostsUsd?: string;
+}) {
+  const revenue = new Decimal(input.revenueUsd);
+  const estimatedCost = new Decimal(input.estimatedCostUsd);
+  const recordedActualCost = input.actualCostsUsd.reduce(
+    (sum, amount) => sum.plus(amount),
+    new Decimal(0),
+  );
+  const costBasis = input.actualCostsUsd.length
+    ? recordedActualCost
+    : estimatedCost;
+  const grossProfit = revenue.minus(costBasis);
+  const operatingEstimate = new Decimal(input.estimatedOperatingCostsUsd ?? 0);
+  return {
+    revenueUsd: fixed(revenue),
+    estimatedCostUsd: fixed(estimatedCost),
+    actualCostUsd: fixed(recordedActualCost),
+    grossProfitUsd: fixed(grossProfit),
+    grossMarginPercent: revenue.isZero()
+      ? "0.0000"
+      : fixed(grossProfit.div(revenue).times(100)),
+    netProfitEstimateUsd: fixed(grossProfit.minus(operatingEstimate)),
+  };
+}
diff --git a/src/modules/orders/order-domain.test.ts b/src/modules/orders/order-domain.test.ts
new file mode 100644
index 0000000..b8d2178
--- /dev/null
+++ b/src/modules/orders/order-domain.test.ts
@@ -0,0 +1,42 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertOrderTransition,
+  purchaseEligibilityAfterRefund,
+} from "@/modules/orders/order-domain";
+
+describe("sales order workflow", () => {
+  it.each([
+    ["DRAFT", "CONFIRMED"],
+    ["CONFIRMED", "PURCHASING"],
+    ["PURCHASING", "FULFILLING"],
+    ["FULFILLING", "SHIPPED"],
+    ["SHIPPED", "COMPLETED"],
+    ["DRAFT", "CANCELLED"],
+    ["CONFIRMED", "CANCELLED"],
+  ])("allows %s to transition to %s", (from, to) => {
+    expect(() => assertOrderTransition(from, to)).not.toThrow();
+  });
+
+  it("rejects moving a shipped order back to purchasing", () => {
+    expect(() => assertOrderTransition("SHIPPED", "PURCHASING")).toThrowError(
+      expect.objectContaining({ code: "INVALID_ORDER_TRANSITION" }),
+    );
+  });
+
+  it("flags an in-progress purchase when a refund removes payment eligibility", () => {
+    expect(
+      purchaseEligibilityAfterRefund({
+        orderStatus: "PURCHASING",
+        paymentTerms: "100% T/T Before Purchase",
+        orderTotalUsd: "1000",
+        confirmedPaymentsUsd: ["1000"],
+        confirmedRefundsUsd: ["0.01"],
+      }),
+    ).toEqual({
+      eligible: false,
+      netPaidUsd: "999.99",
+      purchasingAtRisk: true,
+    });
+  });
+});
diff --git a/src/modules/orders/order-domain.ts b/src/modules/orders/order-domain.ts
new file mode 100644
index 0000000..d82d91f
--- /dev/null
+++ b/src/modules/orders/order-domain.ts
@@ -0,0 +1,53 @@
+import Decimal from "decimal.js";
+
+import { DomainError } from "@/lib/errors";
+
+const ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["CONFIRMED", "CANCELLED"],
+  CONFIRMED: ["PURCHASING", "CANCELLED"],
+  PURCHASING: ["FULFILLING"],
+  FULFILLING: ["SHIPPED"],
+  SHIPPED: ["COMPLETED"],
+  COMPLETED: [],
+  CANCELLED: [],
+};
+
+export function assertOrderTransition(from: string, to: string) {
+  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_ORDER_TRANSITION",
+      `Sales order cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function purchaseEligibilityAfterRefund(input: {
+  orderStatus: string;
+  paymentTerms: string;
+  orderTotalUsd: string;
+  confirmedPaymentsUsd: string[];
+  confirmedRefundsUsd: string[];
+}) {
+  const paid = input.confirmedPaymentsUsd.reduce(
+    (sum, amount) => sum.plus(amount),
+    new Decimal(0),
+  );
+  const refunds = input.confirmedRefundsUsd.reduce(
+    (sum, amount) => sum.plus(amount),
+    new Decimal(0),
+  );
+  const netPaid = paid.minus(refunds);
+  const eligible =
+    input.paymentTerms !== "100% T/T Before Purchase" ||
+    netPaid.gte(input.orderTotalUsd);
+  return {
+    eligible,
+    netPaidUsd: netPaid.toString(),
+    purchasingAtRisk:
+      !eligible &&
+      ["PURCHASING", "FULFILLING", "SHIPPED", "COMPLETED"].includes(
+        input.orderStatus,
+      ),
+  };
+}
diff --git a/src/modules/payments/payment-domain.test.ts b/src/modules/payments/payment-domain.test.ts
new file mode 100644
index 0000000..a13e590
--- /dev/null
+++ b/src/modules/payments/payment-domain.test.ts
@@ -0,0 +1,40 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  calculatePaymentCoverage,
+  validateRefund,
+} from "@/modules/payments/payment-domain";
+
+describe("payment coverage", () => {
+  it("counts only finance-confirmed payments and completed refunds", () => {
+    expect(
+      calculatePaymentCoverage({
+        payments: [
+          { status: "CONFIRMED", amountUsd: "600.10" },
+          { status: "PENDING", amountUsd: "9999" },
+          { status: "FAILED", amountUsd: "50" },
+          { status: "CONFIRMED", amountUsd: "400.20" },
+        ],
+        refunds: [
+          { refundedAt: new Date("2026-07-17"), amountUsd: "0.30" },
+          { refundedAt: null, amountUsd: "100" },
+        ],
+      }),
+    ).toEqual({
+      confirmedPaymentsUsd: "1000.30",
+      confirmedRefundsUsd: "0.30",
+      netPaidUsd: "1000.00",
+    });
+  });
+
+  it("prevents cumulative refunds from exceeding a confirmed payment", () => {
+    expect(() =>
+      validateRefund({
+        paymentStatus: "CONFIRMED",
+        paymentAmountUsd: "100",
+        completedRefundsUsd: ["60", "39.99"],
+        refundAmountUsd: "0.02",
+      }),
+    ).toThrowError(expect.objectContaining({ code: "REFUND_EXCEEDS_PAYMENT" }));
+  });
+});
diff --git a/src/modules/payments/payment-domain.ts b/src/modules/payments/payment-domain.ts
new file mode 100644
index 0000000..e797105
--- /dev/null
+++ b/src/modules/payments/payment-domain.ts
@@ -0,0 +1,57 @@
+import Decimal from "decimal.js";
+
+import { DomainError } from "@/lib/errors";
+
+function fixed(value: Decimal.Value) {
+  return new Decimal(value).toFixed(2);
+}
+
+export function calculatePaymentCoverage(input: {
+  payments: Array<{ status: string; amountUsd: string }>;
+  refunds: Array<{ refundedAt: Date | null; amountUsd: string }>;
+}) {
+  const payments = input.payments
+    .filter(({ status }) => status === "CONFIRMED")
+    .reduce((sum, { amountUsd }) => sum.plus(amountUsd), new Decimal(0));
+  const refunds = input.refunds
+    .filter(({ refundedAt }) => refundedAt !== null)
+    .reduce((sum, { amountUsd }) => sum.plus(amountUsd), new Decimal(0));
+  return {
+    confirmedPaymentsUsd: fixed(payments),
+    confirmedRefundsUsd: fixed(refunds),
+    netPaidUsd: fixed(payments.minus(refunds)),
+  };
+}
+
+export function validateRefund(input: {
+  paymentStatus: string;
+  paymentAmountUsd: string;
+  completedRefundsUsd: string[];
+  refundAmountUsd: string;
+}) {
+  if (input.paymentStatus !== "CONFIRMED") {
+    throw new DomainError(
+      "PAYMENT_NOT_CONFIRMED",
+      "Only a confirmed payment can be refunded",
+      409,
+    );
+  }
+  const amount = new Decimal(input.refundAmountUsd);
+  if (amount.lte(0)) {
+    throw new DomainError(
+      "INVALID_REFUND_AMOUNT",
+      "Refund amount must be greater than zero",
+    );
+  }
+  const refunded = input.completedRefundsUsd.reduce(
+    (sum, value) => sum.plus(value),
+    new Decimal(0),
+  );
+  if (refunded.plus(amount).gt(input.paymentAmountUsd)) {
+    throw new DomainError(
+      "REFUND_EXCEEDS_PAYMENT",
+      "Cumulative refunds cannot exceed the confirmed payment",
+      409,
+    );
+  }
+}
diff --git a/src/modules/products/product-domain.test.ts b/src/modules/products/product-domain.test.ts
new file mode 100644
index 0000000..cbc417f
--- /dev/null
+++ b/src/modules/products/product-domain.test.ts
@@ -0,0 +1,54 @@
+import { describe, expect, it } from "vitest";
+
+import { productSnapshot } from "@/modules/products/product-domain";
+
+describe("product snapshots", () => {
+  it("preserves the complete selected configuration for later transactions", () => {
+    expect(
+      productSnapshot(
+        {
+          id: "product-1",
+          sku: "GPU-R760",
+          name: "Dell PowerEdge R760xa",
+          category: "GPU Server",
+          condition: "REFURBISHED",
+          baseModel: "PowerEdge R760xa",
+          specifications: { cpu: "2 x Xeon Gold", gpuSlots: 4 },
+          dimensions: { lengthCm: 107.5, widthCm: 48.2, heightCm: 8.7 },
+          hsCode: "847150",
+          exportControlRisk: "REVIEW_REQUIRED",
+          media: [{ kind: "IMAGE", objectKey: "products/r760/front.jpg" }],
+          availability: "IN_STOCK",
+        },
+        {
+          id: "variant-1",
+          sku: "GPU-R760-V2",
+          name: "4 x L40S",
+          configurationVersion: 2,
+          configuration: { gpu: "4 x NVIDIA L40S", ram: "512GB" },
+          specifications: { psu: "2 x 2800W" },
+        },
+      ),
+    ).toEqual({
+      productId: "product-1",
+      variantId: "variant-1",
+      sku: "GPU-R760-V2",
+      name: "Dell PowerEdge R760xa / 4 x L40S",
+      category: "GPU Server",
+      condition: "REFURBISHED",
+      baseModel: "PowerEdge R760xa",
+      configurationVersion: 2,
+      configuration: { gpu: "4 x NVIDIA L40S", ram: "512GB" },
+      specifications: {
+        cpu: "2 x Xeon Gold",
+        gpuSlots: 4,
+        psu: "2 x 2800W",
+      },
+      dimensions: { lengthCm: 107.5, widthCm: 48.2, heightCm: 8.7 },
+      hsCode: "847150",
+      exportControlRisk: "REVIEW_REQUIRED",
+      media: [{ kind: "IMAGE", objectKey: "products/r760/front.jpg" }],
+      availability: "IN_STOCK",
+    });
+  });
+});
diff --git a/src/modules/products/product-domain.ts b/src/modules/products/product-domain.ts
new file mode 100644
index 0000000..2c9eae3
--- /dev/null
+++ b/src/modules/products/product-domain.ts
@@ -0,0 +1,51 @@
+export interface ProductSnapshotSource {
+  id: string;
+  sku: string;
+  name: string;
+  category: string;
+  condition: string;
+  baseModel: string | null;
+  specifications: Record<string, unknown>;
+  dimensions: Record<string, unknown> | null;
+  hsCode: string | null;
+  exportControlRisk: string;
+  media: unknown[];
+  availability: string;
+}
+
+export interface ProductVariantSnapshotSource {
+  id: string;
+  sku: string;
+  name: string;
+  configurationVersion: number;
+  configuration: Record<string, unknown>;
+  specifications: Record<string, unknown>;
+}
+
+export function productSnapshot(
+  product: ProductSnapshotSource,
+  variant: ProductVariantSnapshotSource,
+) {
+  return {
+    productId: product.id,
+    variantId: variant.id,
+    sku: variant.sku,
+    name: `${product.name} / ${variant.name}`,
+    category: product.category,
+    condition: product.condition,
+    baseModel: product.baseModel,
+    configurationVersion: variant.configurationVersion,
+    configuration: structuredClone(variant.configuration),
+    specifications: {
+      ...structuredClone(product.specifications),
+      ...structuredClone(variant.specifications),
+    },
+    dimensions: product.dimensions
+      ? structuredClone(product.dimensions)
+      : null,
+    hsCode: product.hsCode,
+    exportControlRisk: product.exportControlRisk,
+    media: structuredClone(product.media),
+    availability: product.availability,
+  };
+}
diff --git a/src/modules/quotes/quote-domain.test.ts b/src/modules/quotes/quote-domain.test.ts
new file mode 100644
index 0000000..2707bb2
--- /dev/null
+++ b/src/modules/quotes/quote-domain.test.ts
@@ -0,0 +1,125 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertQuoteApprovalRole,
+  assertQuoteTransition,
+  calculateQuoteVersion,
+  nextQuoteRevision,
+} from "@/modules/quotes/quote-domain";
+
+describe("quotation totals", () => {
+  it("calculates decimal-safe line totals, charges, total and estimated profit", () => {
+    expect(
+      calculateQuoteVersion({
+        exchangeRateToUsd: "1.25",
+        items: [
+          {
+            quantity: 3,
+            unitPrice: "10.005",
+            discount: "0.015",
+            estimatedUnitCostUsd: "8",
+          },
+          {
+            quantity: 2,
+            unitPrice: "99.9999",
+            discount: "10",
+            estimatedUnitCostUsd: "70.125",
+          },
+        ],
+        shipping: "12.34",
+        insurance: "1.11",
+        tax: "0.55",
+        bankFees: "2.20",
+      }),
+    ).toEqual({
+      items: [
+        { lineTotal: "30.0000", estimatedCostUsd: "24.0000" },
+        { lineTotal: "189.9998", estimatedCostUsd: "140.2500" },
+      ],
+      subtotal: "219.9998",
+      total: "236.1998",
+      totalUsd: "295.2498",
+      estimatedCostUsd: "164.2500",
+      estimatedProfitUsd: "130.9998",
+      estimatedMarginPercent: "44.3691",
+    });
+  });
+
+  it("rejects a discount greater than the line gross amount", () => {
+    expect(() =>
+      calculateQuoteVersion({
+        exchangeRateToUsd: "1",
+        items: [
+          {
+            quantity: 1,
+            unitPrice: "10",
+            discount: "10.01",
+            estimatedUnitCostUsd: "1",
+          },
+        ],
+      }),
+    ).toThrowError(expect.objectContaining({ code: "INVALID_QUOTE_DISCOUNT" }));
+  });
+});
+
+describe("quotation workflow", () => {
+  it.each([
+    ["DRAFT", "PENDING_APPROVAL"],
+    ["PENDING_APPROVAL", "APPROVED"],
+    ["PENDING_APPROVAL", "REJECTED"],
+    ["APPROVED", "SENT"],
+    ["SENT", "VIEWED"],
+    ["SENT", "ACCEPTED"],
+    ["VIEWED", "ACCEPTED"],
+    ["SENT", "REJECTED"],
+    ["SENT", "EXPIRED"],
+    ["ACCEPTED", "CONVERTED"],
+  ])("allows %s to transition to %s", (from, to) => {
+    expect(() => assertQuoteTransition(from, to)).not.toThrow();
+  });
+
+  it("rejects skipping approval", () => {
+    expect(() => assertQuoteTransition("DRAFT", "SENT")).toThrowError(
+      expect.objectContaining({ code: "INVALID_QUOTE_TRANSITION" }),
+    );
+  });
+
+  it("limits approval to Super Admin and Sales Manager roles", () => {
+    expect(() => assertQuoteApprovalRole(["SALES_REP"])).toThrowError(
+      expect.objectContaining({ code: "PERMISSION_DENIED" }),
+    );
+    expect(() => assertQuoteApprovalRole(["SALES_MANAGER"])).not.toThrow();
+    expect(() => assertQuoteApprovalRole(["SUPER_ADMIN"])).not.toThrow();
+  });
+
+  it("creates the next editable revision from the latest immutable version", () => {
+    expect(
+      nextQuoteRevision({
+        currentVersion: 3,
+        source: {
+          id: "version-3",
+          number: 3,
+          immutableAt: new Date("2026-07-17T00:00:00Z"),
+          currencyCode: "USD",
+          exchangeRateToUsd: "1",
+          shipping: "100",
+          insurance: "20",
+          tax: "0",
+          bankFees: "15",
+          incoterm: "CIF",
+          paymentTerms: "100% T/T Before Purchase",
+          deliveryTerms: "30 days",
+          warrantyTerms: "12 months",
+          remarks: "Original",
+          items: [{ description: "Server", quantity: 1 }],
+        },
+      }),
+    ).toMatchObject({
+      number: 4,
+      sourceVersionId: "version-3",
+      immutableAt: null,
+      status: "DRAFT",
+      items: [{ description: "Server", quantity: 1 }],
+    });
+  });
+});
diff --git a/src/modules/quotes/quote-domain.ts b/src/modules/quotes/quote-domain.ts
new file mode 100644
index 0000000..31a5cae
--- /dev/null
+++ b/src/modules/quotes/quote-domain.ts
@@ -0,0 +1,162 @@
+import Decimal from "decimal.js";
+
+import { AuthorizationError, DomainError } from "@/lib/errors";
+
+export interface QuoteCalculationItem {
+  quantity: number;
+  unitPrice: string;
+  discount?: string;
+  estimatedUnitCostUsd?: string | null;
+}
+
+export interface QuoteCalculationInput {
+  exchangeRateToUsd: string;
+  items: QuoteCalculationItem[];
+  shipping?: string;
+  insurance?: string;
+  tax?: string;
+  bankFees?: string;
+}
+
+function fixed(value: Decimal.Value) {
+  return new Decimal(value).toFixed(4);
+}
+
+export function calculateQuoteVersion(input: QuoteCalculationInput) {
+  if (!input.items.length) {
+    throw new DomainError(
+      "QUOTE_ITEMS_REQUIRED",
+      "A quotation requires at least one item",
+    );
+  }
+  const rate = new Decimal(input.exchangeRateToUsd);
+  if (rate.lte(0)) {
+    throw new DomainError(
+      "INVALID_EXCHANGE_RATE",
+      "Exchange rate must be greater than zero",
+    );
+  }
+  const items = input.items.map((item) => {
+    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
+      throw new DomainError(
+        "INVALID_QUOTE_QUANTITY",
+        "Item quantity must be a positive integer",
+      );
+    }
+    const gross = new Decimal(item.unitPrice).times(item.quantity);
+    const discount = new Decimal(item.discount ?? 0);
+    if (discount.isNegative() || discount.gt(gross)) {
+      throw new DomainError(
+        "INVALID_QUOTE_DISCOUNT",
+        "Item discount cannot exceed its gross amount",
+      );
+    }
+    return {
+      lineTotal: fixed(gross.minus(discount)),
+      estimatedCostUsd: fixed(
+        new Decimal(item.estimatedUnitCostUsd ?? 0).times(item.quantity),
+      ),
+    };
+  });
+  const subtotal = items.reduce(
+    (sum, item) => sum.plus(item.lineTotal),
+    new Decimal(0),
+  );
+  const total = [
+    input.shipping,
+    input.insurance,
+    input.tax,
+    input.bankFees,
+  ].reduce<Decimal>(
+    (sum, amount) => sum.plus(amount ?? 0),
+    subtotal,
+  );
+  const totalUsd = total.times(rate);
+  const estimatedCostUsd = items.reduce(
+    (sum, item) => sum.plus(item.estimatedCostUsd),
+    new Decimal(0),
+  );
+  const estimatedProfitUsd = totalUsd.minus(estimatedCostUsd);
+  return {
+    items,
+    subtotal: fixed(subtotal),
+    total: fixed(total),
+    totalUsd: fixed(totalUsd),
+    estimatedCostUsd: fixed(estimatedCostUsd),
+    estimatedProfitUsd: fixed(estimatedProfitUsd),
+    estimatedMarginPercent: totalUsd.isZero()
+      ? "0.0000"
+      : fixed(estimatedProfitUsd.div(totalUsd).times(100)),
+  };
+}
+
+const QUOTE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["PENDING_APPROVAL"],
+  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
+  APPROVED: ["SENT"],
+  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
+  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
+  ACCEPTED: ["CONVERTED"],
+  REJECTED: [],
+  EXPIRED: [],
+  CONVERTED: [],
+};
+
+export function assertQuoteTransition(from: string, to: string) {
+  if (!QUOTE_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_QUOTE_TRANSITION",
+      `Quotation cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function assertQuoteApprovalRole(roles: readonly string[] = []) {
+  if (!roles.some((role) => role === "SUPER_ADMIN" || role === "SALES_MANAGER")) {
+    throw new AuthorizationError("quote.approve");
+  }
+}
+
+interface RevisionSource {
+  id: string;
+  number: number;
+  immutableAt: Date | null;
+  items: unknown[];
+  [key: string]: unknown;
+}
+
+export function nextQuoteRevision(input: {
+  currentVersion: number;
+  source: RevisionSource;
+}) {
+  const {
+    id: sourceVersionId,
+    number: sourceNumber,
+    immutableAt,
+    items,
+    ...snapshot
+  } = input.source;
+  if (!immutableAt) {
+    throw new DomainError(
+      "QUOTE_REVISION_SOURCE_MUTABLE",
+      "Only an immutable quotation version can be revised",
+      409,
+    );
+  }
+  if (sourceNumber !== input.currentVersion) {
+    throw new DomainError(
+      "QUOTE_REVISION_SOURCE_STALE",
+      "Only the current quotation version can be revised",
+      409,
+    );
+  }
+  return {
+    ...structuredClone(snapshot),
+    number: input.currentVersion + 1,
+    sourceVersionId,
+    immutableAt: null,
+    status: "DRAFT",
+    items: structuredClone(items),
+  };
+}
diff --git a/src/modules/quotes/quote-pdf.test.ts b/src/modules/quotes/quote-pdf.test.ts
new file mode 100644
index 0000000..cfd069c
--- /dev/null
+++ b/src/modules/quotes/quote-pdf.test.ts
@@ -0,0 +1,41 @@
+import { describe, expect, it } from "vitest";
+
+import { renderQuotePdf } from "@/modules/quotes/quote-pdf";
+
+describe("quotation PDF", () => {
+  it("renders a PDF with commercial parties, items, terms, bank and signature sections", () => {
+    const pdf = renderQuotePdf({
+      locale: "en",
+      company: { name: "Atlas Global Systems", address: "Shenzhen, China" },
+      customer: { name: "Northstar Systems", address: "Austin, USA" },
+      quoteNumber: "QUOTE-000001",
+      version: 2,
+      currencyCode: "USD",
+      items: [
+        {
+          description: "GPU Server",
+          configuration: "4 x NVIDIA L40S / 512GB RAM",
+          quantity: 2,
+          unitPrice: "25000.00",
+          lineTotal: "50000.00",
+          imageLabel: "Front view",
+        },
+      ],
+      total: "50150.00",
+      incoterm: "CIF",
+      paymentTerms: "100% T/T Before Purchase",
+      deliveryTerms: "30 days",
+      warrantyTerms: "12 months",
+      remarks: "Export subject to final compliance review.",
+      bank: { beneficiary: "Atlas Global Systems", account: "00112233" },
+    });
+
+    const text = new TextDecoder().decode(pdf);
+    expect(text.startsWith("%PDF-1.4")).toBe(true);
+    expect(text).toContain("Atlas Global Systems");
+    expect(text).toContain("Northstar Systems");
+    expect(text).toContain("GPU Server");
+    expect(text).toContain("Bank Information");
+    expect(text).toContain("Authorized Signature");
+  });
+});
diff --git a/src/modules/quotes/quote-pdf.ts b/src/modules/quotes/quote-pdf.ts
new file mode 100644
index 0000000..3c42424
--- /dev/null
+++ b/src/modules/quotes/quote-pdf.ts
@@ -0,0 +1,97 @@
+export interface QuotePdfInput {
+  locale: "en" | "zh";
+  company: { name: string; address: string };
+  customer: { name: string; address: string };
+  quoteNumber: string;
+  version: number;
+  currencyCode: string;
+  items: Array<{
+    description: string;
+    configuration: string;
+    quantity: number;
+    unitPrice: string;
+    lineTotal: string;
+    imageLabel?: string;
+  }>;
+  total: string;
+  incoterm?: string | null;
+  paymentTerms?: string | null;
+  deliveryTerms?: string | null;
+  warrantyTerms?: string | null;
+  remarks?: string | null;
+  bank: { beneficiary: string; account: string };
+}
+
+function pdfText(value: string) {
+  return value
+    .normalize("NFKD")
+    .replace(/[^\x20-\x7e]/g, "?")
+    .replaceAll("\\", "\\\\")
+    .replaceAll("(", "\\(")
+    .replaceAll(")", "\\)");
+}
+
+function streamFor(input: QuotePdfInput) {
+  const heading =
+    input.locale === "zh" ? "QUOTATION / BAOJIA DAN" : "QUOTATION";
+  const lines = [
+    heading,
+    `${input.company.name} | ${input.company.address}`,
+    `Quote: ${input.quoteNumber} | Version: ${input.version}`,
+    `Customer: ${input.customer.name} | ${input.customer.address}`,
+    "Items / Configuration",
+    ...input.items.flatMap((item, index) => [
+      `${index + 1}. ${item.description} | ${item.configuration}`,
+      `Qty ${item.quantity} x ${input.currencyCode} ${item.unitPrice} = ${item.lineTotal}`,
+      ...(item.imageLabel ? [`Image: ${item.imageLabel}`] : []),
+    ]),
+    `TOTAL ${input.currencyCode} ${input.total}`,
+    `Incoterm: ${input.incoterm ?? "-"}`,
+    `Payment Terms: ${input.paymentTerms ?? "-"}`,
+    `Delivery: ${input.deliveryTerms ?? "-"}`,
+    `Warranty: ${input.warrantyTerms ?? "-"}`,
+    `Remarks: ${input.remarks ?? "-"}`,
+    "Bank Information",
+    `Beneficiary: ${input.bank.beneficiary}`,
+    `Account: ${input.bank.account}`,
+    "Authorized Signature: ____________________",
+    "Customer Signature: ______________________",
+  ];
+  return [
+    "BT",
+    "/F1 16 Tf",
+    "48 790 Td",
+    ...lines.flatMap((line, index) => [
+      ...(index === 1 ? ["/F1 10 Tf"] : []),
+      `(${pdfText(line)}) Tj`,
+      "0 -22 Td",
+    ]),
+    "ET",
+  ].join("\n");
+}
+
+export function renderQuotePdf(input: QuotePdfInput) {
+  const content = streamFor(input);
+  const objects = [
+    "<< /Type /Catalog /Pages 2 0 R >>",
+    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
+    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
+    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
+    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
+  ];
+  let pdf = "%PDF-1.4\n";
+  const offsets = [0];
+  objects.forEach((object, index) => {
+    offsets.push(new TextEncoder().encode(pdf).length);
+    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
+  });
+  const xref = new TextEncoder().encode(pdf).length;
+  pdf += `xref\n0 ${objects.length + 1}\n`;
+  pdf += "0000000000 65535 f \n";
+  pdf += offsets
+    .slice(1)
+    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
+    .join("");
+  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
+  return new TextEncoder().encode(pdf);
+}
diff --git a/src/modules/transactions/prisma-transactions-repository.ts b/src/modules/transactions/prisma-transactions-repository.ts
new file mode 100644
index 0000000..8c08592
--- /dev/null
+++ b/src/modules/transactions/prisma-transactions-repository.ts
@@ -0,0 +1,949 @@
+import Decimal from "decimal.js";
+
+import type { Prisma } from "@/generated/prisma/client";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { hasGlobalOwnershipScope } from "@/lib/rbac";
+import { redactFinancialFields } from "@/modules/finance/field-redaction";
+import { calculateOrderFinancials } from "@/modules/finance/order-financials";
+import { assertOrderTransition } from "@/modules/orders/order-domain";
+import { calculatePaymentCoverage, validateRefund } from "@/modules/payments/payment-domain";
+import {
+  assertQuoteTransition,
+  calculateQuoteVersion,
+  nextQuoteRevision,
+} from "@/modules/quotes/quote-domain";
+import type {
+  TransactionQuote,
+  TransactionRepository,
+} from "@/modules/transactions/transaction-service";
+import { transactionOrderWhere } from "@/modules/transactions/transaction-scope";
+
+export interface ProductWriteInput {
+  sku: string;
+  name: string;
+  description?: string | null;
+  categoryId: string;
+  brand?: string | null;
+  model?: string | null;
+  condition: string;
+  baseModel?: string | null;
+  specifications?: Prisma.InputJsonValue;
+  referencePrice?: string | null;
+  referenceCurrencyCode?: string | null;
+  dimensions?: Prisma.InputJsonValue;
+  hsCode?: string | null;
+  exportControlRisk: string;
+  media?: Prisma.InputJsonValue;
+  availability: string;
+  serialized?: boolean;
+  variants: Array<{
+    sku: string;
+    name: string;
+    configurationVersion: number;
+    configuration: Prisma.InputJsonValue;
+    specifications?: Prisma.InputJsonValue;
+    cost?: string | null;
+    currencyCode?: string | null;
+  }>;
+}
+
+export interface QuoteWriteInput {
+  customerId: string;
+  opportunityId?: string | null;
+  validUntil?: Date | null;
+  currencyCode: string;
+  exchangeRateToUsd: string;
+  shipping?: string;
+  insurance?: string;
+  tax?: string;
+  bankFees?: string;
+  incoterm?: string | null;
+  paymentTerms?: string | null;
+  deliveryTerms?: string | null;
+  warrantyTerms?: string | null;
+  remarks?: string | null;
+  items: Array<{
+    productId: string;
+    variantId: string;
+    description?: string;
+    quantity: number;
+    unitPrice: string;
+    discount?: string;
+  }>;
+}
+
+function ownerWhere(context: AuthorizationContext) {
+  return hasGlobalOwnershipScope(context) ? {} : { ownerId: context.userId };
+}
+
+async function nextNumber(
+  transaction: Prisma.TransactionClient,
+  key: string,
+) {
+  const sequence = await transaction.sequence.update({
+    where: { key },
+    data: { nextValue: { increment: 1 }, version: { increment: 1 } },
+  });
+  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1))
+    .toString()
+    .padStart(sequence.padding, "0")}`;
+}
+
+export class PrismaTransactionsRepository implements TransactionRepository {
+  listProducts(context: AuthorizationContext) {
+    return getPrisma().product.findMany({
+      where: { deletedAt: null },
+      orderBy: { updatedAt: "desc" },
+      include: {
+        category: true,
+        variants: {
+          where: { deletedAt: null },
+          orderBy: { configurationVersion: "asc" },
+        },
+      },
+    }).then((rows) => redactFinancialFields(rows, context));
+  }
+
+  getProduct(context: AuthorizationContext, id: string) {
+    return getPrisma().product.findFirst({
+      where: { id, deletedAt: null },
+      include: {
+        category: true,
+        variants: {
+          where: { deletedAt: null },
+          orderBy: { configurationVersion: "asc" },
+        },
+      },
+    }).then((row) => (row ? redactFinancialFields(row, context) : null));
+  }
+
+  createProduct(context: AuthorizationContext, input: ProductWriteInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const product = await transaction.product.create({
+        data: {
+          ...input,
+          variants: { create: input.variants },
+        },
+        include: { category: true, variants: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "product.create",
+        entityType: "Product",
+        entityId: product.id,
+        after: { id: product.id, sku: product.sku },
+      });
+      return redactFinancialFields(product, context);
+    });
+  }
+
+  async updateProduct(
+    context: AuthorizationContext,
+    id: string,
+    input: Partial<Omit<ProductWriteInput, "variants">>,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.product.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!current) {
+        throw new DomainError("PRODUCT_NOT_FOUND", "Product not found", 404);
+      }
+      const product = await transaction.product.update({
+        where: { id },
+        data: { ...input, version: { increment: 1 } },
+        include: { category: true, variants: { where: { deletedAt: null } } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "product.update",
+        entityType: "Product",
+        entityId: id,
+        before: { version: current.version },
+        after: { version: product.version },
+      });
+      return redactFinancialFields(product, context);
+    });
+  }
+
+  async createQuote(context: AuthorizationContext, input: QuoteWriteInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const customer = await transaction.customer.findFirst({
+        where: {
+          id: input.customerId,
+          deletedAt: null,
+          ...ownerWhere(context),
+        },
+        select: { id: true },
+      });
+      if (!customer) {
+        throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
+      }
+      if (input.opportunityId) {
+        const opportunity = await transaction.opportunity.findFirst({
+          where: {
+            id: input.opportunityId,
+            customerId: input.customerId,
+            deletedAt: null,
+            ...ownerWhere(context),
+          },
+          select: { id: true },
+        });
+        if (!opportunity) {
+          throw new DomainError(
+            "OPPORTUNITY_NOT_FOUND",
+            "Opportunity was not found for this customer",
+            404,
+          );
+        }
+      }
+      const variants = await transaction.productVariant.findMany({
+        where: {
+          id: { in: input.items.map(({ variantId }) => variantId) },
+          deletedAt: null,
+          product: { deletedAt: null },
+        },
+        include: {
+          product: { include: { category: { select: { name: true } } } },
+        },
+      });
+      const byId = new Map(variants.map((variant) => [variant.id, variant]));
+      const resolved = input.items.map((item) => {
+        const variant = byId.get(item.variantId);
+        if (!variant || variant.productId !== item.productId) {
+          throw new DomainError(
+            "PRODUCT_CONFIGURATION_NOT_FOUND",
+            "Selected product configuration was not found",
+            404,
+          );
+        }
+        return { item, variant };
+      });
+      const totals = calculateQuoteVersion({
+        exchangeRateToUsd: input.exchangeRateToUsd,
+        shipping: input.shipping,
+        insurance: input.insurance,
+        tax: input.tax,
+        bankFees: input.bankFees,
+        items: resolved.map(({ item, variant }) => ({
+          quantity: item.quantity,
+          unitPrice: item.unitPrice,
+          discount: item.discount,
+          estimatedUnitCostUsd:
+            variant.currencyCode === "USD" ? variant.cost?.toString() : "0",
+        })),
+      });
+      const quoteNumber = await nextNumber(transaction, "quote");
+      const quote = await transaction.quote.create({
+        data: {
+          quoteNumber,
+          customerId: input.customerId,
+          opportunityId: input.opportunityId,
+          ownerId: context.userId,
+          validUntil: input.validUntil,
+          versions: {
+            create: {
+              number: 1,
+              currencyCode: input.currencyCode,
+              exchangeRateToUsd: input.exchangeRateToUsd,
+              subtotal: totals.subtotal,
+              shipping: input.shipping ?? "0",
+              insurance: input.insurance ?? "0",
+              tax: input.tax ?? "0",
+              bankFees: input.bankFees ?? "0",
+              total: totals.total,
+              totalUsd: totals.totalUsd,
+              estimatedCostUsd: totals.estimatedCostUsd,
+              estimatedProfitUsd: totals.estimatedProfitUsd,
+              estimatedMarginPercent: totals.estimatedMarginPercent,
+              incoterm: input.incoterm,
+              paymentTerms: input.paymentTerms,
+              deliveryTerms: input.deliveryTerms,
+              warrantyTerms: input.warrantyTerms,
+              remarks: input.remarks,
+              items: {
+                create: resolved.map(({ item, variant }, index) => ({
+                  productId: variant.productId,
+                  description:
+                    item.description ??
+                    `${variant.product.name} / ${variant.name}`,
+                  configuration: {
+                    variantId: variant.id,
+                    sku: variant.sku,
+                    configurationVersion: variant.configurationVersion,
+                    configuration: variant.configuration,
+                    specifications: {
+                      ...(variant.product.specifications as object | null),
+                      ...(variant.specifications as object | null),
+                    },
+                    category: variant.product.category.name,
+                    condition: variant.product.condition,
+                    baseModel: variant.product.baseModel,
+                    dimensions: variant.product.dimensions,
+                    hsCode: variant.product.hsCode,
+                    exportControlRisk: variant.product.exportControlRisk,
+                    media: variant.product.media,
+                    availability: variant.product.availability,
+                  },
+                  quantity: item.quantity,
+                  unitPrice: item.unitPrice,
+                  discount: item.discount ?? "0",
+                  lineTotal: totals.items[index].lineTotal,
+                  estimatedCostUsd: totals.items[index].estimatedCostUsd,
+                })),
+              },
+            },
+          },
+        },
+        include: { versions: { include: { items: true } } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "quote.create",
+        entityType: "Quote",
+        entityId: quote.id,
+        after: { quoteNumber, currentVersion: 1 },
+      });
+      return redactFinancialFields(quote, context);
+    });
+  }
+
+  listQuotes(context: AuthorizationContext) {
+    return getPrisma().quote.findMany({
+      where: { deletedAt: null, ...ownerWhere(context) },
+      orderBy: { updatedAt: "desc" },
+      include: {
+        customer: { select: { id: true, companyName: true } },
+        owner: { select: { id: true, name: true } },
+        versions: {
+          orderBy: { number: "desc" },
+          take: 1,
+        },
+      },
+    }).then((rows) => redactFinancialFields(rows, context));
+  }
+
+  async getQuote(context: AuthorizationContext, id: string) {
+    const quote = await getPrisma().quote.findFirst({
+      where: { id, deletedAt: null, ...ownerWhere(context) },
+      include: {
+        customer: true,
+        owner: { select: { id: true, name: true, email: true } },
+        approvedBy: { select: { id: true, name: true } },
+        versions: {
+          orderBy: { number: "desc" },
+          include: { items: true },
+        },
+        order: { select: { id: true, orderNumber: true, status: true } },
+      },
+    });
+    return quote ? redactFinancialFields(quote, context) : null;
+  }
+
+  async findQuote(
+    context: AuthorizationContext,
+    quoteId: string,
+  ): Promise<TransactionQuote | null> {
+    const quote = await getPrisma().quote.findFirst({
+      where: { id: quoteId, deletedAt: null, ...ownerWhere(context) },
+      include: {
+        order: { select: { id: true } },
+      },
+    });
+    if (!quote) return null;
+    const current = await getPrisma().quoteVersion.findUnique({
+      where: {
+        quoteId_number: { quoteId: quote.id, number: quote.currentVersion },
+      },
+      include: { items: true },
+    });
+    if (!current) {
+      throw new DomainError(
+        "QUOTE_VERSION_NOT_FOUND",
+        "Current quotation version not found",
+        409,
+      );
+    }
+    return {
+      id: quote.id,
+      ownerId: quote.ownerId,
+      status: quote.status,
+      currentVersion: quote.currentVersion,
+      orderId: quote.order?.id ?? null,
+      current: {
+        ...current,
+        exchangeRateToUsd: current.exchangeRateToUsd.toString(),
+        shipping: current.shipping.toString(),
+        insurance: current.insurance.toString(),
+        tax: current.tax.toString(),
+        bankFees: current.bankFees.toString(),
+        subtotal: current.subtotal.toString(),
+        total: current.total.toString(),
+        totalUsd: current.totalUsd.toString(),
+        estimatedCostUsd: current.estimatedCostUsd.toString(),
+        estimatedProfitUsd: current.estimatedProfitUsd.toString(),
+        estimatedMarginPercent: current.estimatedMarginPercent.toString(),
+        items: current.items.map((item) => ({
+          ...item,
+          unitPrice: item.unitPrice.toString(),
+          discount: item.discount.toString(),
+          lineTotal: item.lineTotal.toString(),
+          estimatedCostUsd: item.estimatedCostUsd?.toString() ?? null,
+        })),
+      },
+    };
+  }
+
+  transitionQuote(
+    context: AuthorizationContext,
+    quote: TransactionQuote,
+    status: string,
+    note?: string,
+  ) {
+    assertQuoteTransition(quote.status, status);
+    return getPrisma().$transaction(async (transaction) => {
+      const changed = await transaction.quote.updateMany({
+        where: {
+          id: quote.id,
+          status:
+            quote.status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
+        },
+        data: {
+          status: status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
+          version: { increment: 1 },
+          ...(status === "APPROVED"
+            ? {
+                approvedById: context.userId,
+                approvedAt: new Date(),
+                approvalNote: note,
+              }
+            : {}),
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "QUOTE_TRANSITION_CONFLICT",
+          "Quotation changed; refresh and retry",
+          409,
+        );
+      }
+      if (status === "SENT") {
+        await transaction.quoteVersion.update({
+          where: {
+            quoteId_number: {
+              quoteId: quote.id,
+              number: quote.currentVersion,
+            },
+          },
+          data: { immutableAt: new Date() },
+        });
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action:
+          status === "APPROVED" ? "quote.approve" : "quote.status_change",
+        entityType: "Quote",
+        entityId: quote.id,
+        before: { status: quote.status },
+        after: { status, note },
+      });
+      return transaction.quote.findUniqueOrThrow({ where: { id: quote.id } });
+    });
+  }
+
+  createRevision(
+    context: AuthorizationContext,
+    quote: TransactionQuote,
+    revision: ReturnType<typeof nextQuoteRevision>,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const source = await transaction.quoteVersion.findUniqueOrThrow({
+        where: { id: revision.sourceVersionId },
+        include: { items: true },
+      });
+      const changed = await transaction.quote.updateMany({
+        where: {
+          id: quote.id,
+          currentVersion: quote.currentVersion,
+          status:
+            quote.status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
+        },
+        data: {
+          currentVersion: revision.number,
+          status: "DRAFT",
+          approvedById: null,
+          approvedAt: null,
+          approvalNote: null,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "QUOTE_REVISION_CONFLICT",
+          "Quotation changed; refresh and retry",
+          409,
+        );
+      }
+      const created = await transaction.quoteVersion.create({
+        data: {
+          quoteId: quote.id,
+          sourceVersionId: source.id,
+          number: revision.number,
+          currencyCode: source.currencyCode,
+          exchangeRateToUsd: source.exchangeRateToUsd,
+          subtotal: source.subtotal,
+          shipping: source.shipping,
+          insurance: source.insurance,
+          tax: source.tax,
+          bankFees: source.bankFees,
+          total: source.total,
+          totalUsd: source.totalUsd,
+          estimatedCostUsd: source.estimatedCostUsd,
+          estimatedProfitUsd: source.estimatedProfitUsd,
+          estimatedMarginPercent: source.estimatedMarginPercent,
+          incoterm: source.incoterm,
+          paymentTerms: source.paymentTerms,
+          deliveryTerms: source.deliveryTerms,
+          warrantyTerms: source.warrantyTerms,
+          remarks: source.remarks,
+          items: {
+            create: source.items.map((item) => ({
+              productId: item.productId,
+              description: item.description,
+              configuration: item.configuration ?? undefined,
+              quantity: item.quantity,
+              unitPrice: item.unitPrice,
+              discount: item.discount,
+              lineTotal: item.lineTotal,
+              estimatedCostUsd: item.estimatedCostUsd,
+            })),
+          },
+        },
+        include: { items: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "quote.revise",
+        entityType: "Quote",
+        entityId: quote.id,
+        metadata: {
+          sourceVersionId: source.id,
+          revisionVersionId: created.id,
+          number: created.number,
+        },
+      });
+      return created;
+    });
+  }
+
+  convertQuote(context: AuthorizationContext, quote: TransactionQuote) {
+    return getPrisma().$transaction(async (transaction) => {
+      const claimed = await transaction.quote.updateMany({
+        where: {
+          id: quote.id,
+          status: "ACCEPTED",
+          currentVersion: quote.currentVersion,
+          order: null,
+        },
+        data: { status: "CONVERTED", version: { increment: 1 } },
+      });
+      if (claimed.count !== 1) {
+        throw new DomainError(
+          "QUOTE_ALREADY_CONVERTED",
+          "Quotation has already been converted",
+          409,
+        );
+      }
+      const source = await transaction.quoteVersion.findUniqueOrThrow({
+        where: { id: quote.current.id },
+        include: { quote: true, items: true },
+      });
+      const orderNumber = await nextNumber(transaction, "sales_order");
+      const order = await transaction.salesOrder.create({
+        data: {
+          orderNumber,
+          customerId: source.quote.customerId,
+          quoteId: quote.id,
+          acceptedQuoteVersionId: source.id,
+          ownerId: source.quote.ownerId,
+          status: "CONFIRMED",
+          currencyCode: source.currencyCode,
+          exchangeRateToUsd: source.exchangeRateToUsd,
+          total: source.total,
+          totalUsd: source.totalUsd,
+          paymentTerms: source.paymentTerms ?? "",
+          revenueUsd: source.totalUsd,
+          estimatedCostUsd: source.estimatedCostUsd,
+          grossProfitUsd: source.estimatedProfitUsd,
+          grossMarginPercent: source.estimatedMarginPercent,
+          netProfitEstimateUsd: source.estimatedProfitUsd,
+          items: {
+            create: source.items.map((item) => ({
+              productId: item.productId,
+              description: item.description,
+              configuration: item.configuration ?? undefined,
+              quantity: item.quantity,
+              unitPrice: item.unitPrice,
+              lineTotal: item.lineTotal,
+            })),
+          },
+        },
+        include: { items: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "quote.convert",
+        entityType: "Quote",
+        entityId: quote.id,
+        metadata: {
+          quoteVersionId: source.id,
+          salesOrderId: order.id,
+        },
+      });
+      return redactFinancialFields(order, context);
+    });
+  }
+
+  listOrders(context: AuthorizationContext) {
+    return getPrisma().salesOrder.findMany({
+      where: { deletedAt: null, ...transactionOrderWhere(context) },
+      orderBy: { updatedAt: "desc" },
+      include: {
+        customer: { select: { id: true, companyName: true } },
+        owner: { select: { id: true, name: true } },
+        payments: { where: { deletedAt: null } },
+        refunds: { where: { deletedAt: null } },
+      },
+    }).then((rows) => redactFinancialFields(rows, context));
+  }
+
+  async getOrder(context: AuthorizationContext, id: string) {
+    const order = await getPrisma().salesOrder.findFirst({
+      where: { id, deletedAt: null, ...transactionOrderWhere(context) },
+      include: {
+        customer: true,
+        acceptedQuoteVersion: { include: { items: true } },
+        items: true,
+        payments: {
+          where: { deletedAt: null },
+          include: { refunds: { where: { deletedAt: null } } },
+        },
+        refunds: { where: { deletedAt: null } },
+        costs: { where: { deletedAt: null } },
+      },
+    });
+    if (!order) return null;
+    const financials = calculateOrderFinancials({
+      revenueUsd: order.totalUsd.toString(),
+      estimatedCostUsd: order.estimatedCostUsd.toString(),
+      actualCostsUsd: order.costs.map(({ amountUsd }) => amountUsd.toString()),
+    });
+    return redactFinancialFields({ ...order, ...financials }, context);
+  }
+
+  async transitionOrder(
+    context: AuthorizationContext,
+    id: string,
+    status: string,
+  ) {
+    if (status === "PURCHASING") {
+      throw new DomainError(
+        "PURCHASE_GATE_REQUIRED",
+        "Use the payment-gated purchase transition",
+        409,
+      );
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.salesOrder.findFirst({
+        where: { id, deletedAt: null, ...transactionOrderWhere(context) },
+      });
+      if (!current) {
+        throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+      }
+      assertOrderTransition(current.status, status);
+      const changed = await transaction.salesOrder.updateMany({
+        where: { id, status: current.status },
+        data: {
+          status: status as Prisma.EnumOrderStatusFieldUpdateOperationsInput["set"],
+          ...(status === "FULFILLING"
+            ? {
+                purchaseStatus: "COMPLETED",
+                inspectionStatus: "PENDING",
+                packingStatus: "PENDING",
+              }
+            : {}),
+          ...(status === "SHIPPED"
+            ? {
+                inspectionStatus: "PASSED",
+                packingStatus: "PACKED",
+                shipmentStatus: "SHIPPED",
+              }
+            : {}),
+          ...(status === "COMPLETED"
+            ? { shipmentStatus: "DELIVERED" }
+            : {}),
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "ORDER_TRANSITION_CONFLICT",
+          "Sales order changed; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "sales_order.status_change",
+        entityType: "SalesOrder",
+        entityId: id,
+        before: { status: current.status },
+        after: { status },
+      });
+      return transaction.salesOrder.findUniqueOrThrow({ where: { id } });
+    });
+  }
+
+  async createPayment(
+    context: AuthorizationContext,
+    input: {
+      salesOrderId: string;
+      reference?: string | null;
+      amount: string;
+      currencyCode: string;
+      exchangeRateToUsd: string;
+      receivedAt?: Date | null;
+      proofMetadata?: Prisma.InputJsonValue;
+    },
+  ) {
+    const order = await getPrisma().salesOrder.findFirst({
+      where: {
+        id: input.salesOrderId,
+        deletedAt: null,
+        ...transactionOrderWhere(context),
+      },
+      select: { id: true },
+    });
+    if (!order) {
+      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+    }
+    const rate = new Decimal(input.exchangeRateToUsd);
+    const amount = new Decimal(input.amount);
+    if (amount.lte(0) || rate.lte(0)) {
+      throw new DomainError(
+        "INVALID_PAYMENT_AMOUNT",
+        "Payment amount and exchange rate must be greater than zero",
+      );
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const payment = await transaction.payment.create({
+        data: {
+          ...input,
+          amountUsd: amount.times(rate).toFixed(4),
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "payment.create",
+        entityType: "Payment",
+        entityId: payment.id,
+        after: {
+          salesOrderId: payment.salesOrderId,
+          amountUsd: payment.amountUsd.toString(),
+          status: payment.status,
+        },
+      });
+      return payment;
+    });
+  }
+
+  verifyPayment(
+    context: AuthorizationContext,
+    id: string,
+    approved: boolean,
+    rejectionReason?: string,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const payment = await transaction.payment.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          salesOrder: {
+            include: {
+              payments: { where: { deletedAt: null } },
+              refunds: { where: { deletedAt: null } },
+            },
+          },
+        },
+      });
+      if (!payment) {
+        throw new DomainError("PAYMENT_NOT_FOUND", "Payment not found", 404);
+      }
+      if (payment.status !== "PENDING") {
+        throw new DomainError(
+          "PAYMENT_ALREADY_REVIEWED",
+          "Payment has already been reviewed",
+          409,
+        );
+      }
+      const reason = rejectionReason?.trim();
+      if (!approved && !reason) {
+        throw new DomainError(
+          "PAYMENT_REJECTION_REASON_REQUIRED",
+          "Payment rejection requires a reason",
+        );
+      }
+      const updated = await transaction.payment.update({
+        where: { id },
+        data: {
+          status: approved ? "CONFIRMED" : "FAILED",
+          verifiedById: context.userId,
+          verifiedAt: new Date(),
+          rejectionReason: approved ? null : reason,
+          version: { increment: 1 },
+        },
+      });
+      const payments = payment.salesOrder.payments.map((item) => ({
+        status: item.id === id && approved ? "CONFIRMED" : item.status,
+        amountUsd: item.amountUsd.toString(),
+      }));
+      const coverage = calculatePaymentCoverage({
+        payments,
+        refunds: payment.salesOrder.refunds.map((refund) => ({
+          refundedAt: refund.refundedAt,
+          amountUsd: refund.amountUsd.toString(),
+        })),
+      });
+      const netPaid = new Decimal(coverage.netPaidUsd);
+      const fullyPaid = netPaid.gte(payment.salesOrder.totalUsd);
+      const eligible =
+        payment.salesOrder.paymentTerms !== "100% T/T Before Purchase" ||
+        fullyPaid;
+      await transaction.salesOrder.update({
+        where: { id: payment.salesOrderId },
+        data: {
+          paymentStatus: fullyPaid
+            ? "PAID"
+            : netPaid.isZero()
+              ? "UNPAID"
+              : "PARTIALLY_PAID",
+          purchaseEligibilityFlag: eligible,
+          version: { increment: 1 },
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: approved ? "payment.verify" : "payment.reject",
+        entityType: "Payment",
+        entityId: id,
+        before: { status: payment.status },
+        after: { status: updated.status, rejectionReason: reason },
+      });
+      return updated;
+    });
+  }
+
+  refundPayment(
+    context: AuthorizationContext,
+    paymentId: string,
+    input: {
+      amount: string;
+      currencyCode: string;
+      exchangeRateToUsd: string;
+      reason: string;
+    },
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const payment = await transaction.payment.findFirst({
+        where: { id: paymentId, deletedAt: null },
+        include: {
+          refunds: { where: { refundedAt: { not: null }, deletedAt: null } },
+          salesOrder: {
+            include: {
+              payments: { where: { deletedAt: null } },
+              refunds: { where: { deletedAt: null } },
+            },
+          },
+        },
+      });
+      if (!payment) {
+        throw new DomainError("PAYMENT_NOT_FOUND", "Payment not found", 404);
+      }
+      const amountUsd = new Decimal(input.amount)
+        .times(input.exchangeRateToUsd)
+        .toFixed(4);
+      validateRefund({
+        paymentStatus: payment.status,
+        paymentAmountUsd: payment.amountUsd.toString(),
+        completedRefundsUsd: payment.refunds.map(({ amountUsd: value }) =>
+          value.toString(),
+        ),
+        refundAmountUsd: amountUsd,
+      });
+      const refund = await transaction.refund.create({
+        data: {
+          salesOrderId: payment.salesOrderId,
+          paymentId,
+          amount: input.amount,
+          currencyCode: input.currencyCode,
+          exchangeRateToUsd: input.exchangeRateToUsd,
+          amountUsd,
+          reason: input.reason.trim(),
+          refundedAt: new Date(),
+        },
+      });
+      const coverage = calculatePaymentCoverage({
+        payments: payment.salesOrder.payments.map((item) => ({
+          status: item.status,
+          amountUsd: item.amountUsd.toString(),
+        })),
+        refunds: [
+          ...payment.salesOrder.refunds.map((item) => ({
+            refundedAt: item.refundedAt,
+            amountUsd: item.amountUsd.toString(),
+          })),
+          { refundedAt: refund.refundedAt, amountUsd },
+        ],
+      });
+      const netPaid = new Decimal(coverage.netPaidUsd);
+      const fullyPaid = netPaid.gte(payment.salesOrder.totalUsd);
+      const eligible =
+        payment.salesOrder.paymentTerms !== "100% T/T Before Purchase" ||
+        fullyPaid;
+      const atRisk =
+        !eligible &&
+        ["PURCHASING", "FULFILLING", "SHIPPED", "COMPLETED"].includes(
+          payment.salesOrder.status,
+        );
+      await transaction.salesOrder.update({
+        where: { id: payment.salesOrderId },
+        data: {
+          paymentStatus: fullyPaid
+            ? "PAID"
+            : netPaid.isZero()
+              ? "REFUNDED"
+              : "PARTIALLY_REFUNDED",
+          purchaseEligibilityFlag: eligible,
+          purchaseStatus: atRisk ? "PAYMENT_AT_RISK" : undefined,
+          version: { increment: 1 },
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "payment.refund",
+        entityType: "Refund",
+        entityId: refund.id,
+        metadata: {
+          paymentId,
+          orderId: payment.salesOrderId,
+          amountUsd,
+          purchaseEligibility: eligible,
+          purchasingAtRisk: atRisk,
+        },
+      });
+      return { ...refund, purchaseEligibility: eligible, purchasingAtRisk: atRisk };
+    });
+  }
+}
diff --git a/src/modules/transactions/transaction-schemas.test.ts b/src/modules/transactions/transaction-schemas.test.ts
new file mode 100644
index 0000000..124496f
--- /dev/null
+++ b/src/modules/transactions/transaction-schemas.test.ts
@@ -0,0 +1,45 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  paymentSchema,
+  productSchema,
+  quoteSchema,
+} from "@/modules/transactions/transaction-schemas";
+
+describe("sales transaction request validation", () => {
+  it("rejects a product without any configuration version", () => {
+    expect(
+      productSchema.safeParse({
+        sku: "GPU-1",
+        name: "GPU Server",
+        categoryId: "00000000-0000-4000-8000-000000000001",
+        condition: "NEW",
+        exportControlRisk: "LOW",
+        availability: "AVAILABLE",
+        variants: [],
+      }).success,
+    ).toBe(false);
+  });
+
+  it("rejects a quotation without commercial items", () => {
+    expect(
+      quoteSchema.safeParse({
+        customerId: "00000000-0000-4000-8000-000000000001",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        items: [],
+      }).success,
+    ).toBe(false);
+  });
+
+  it("requires proof metadata for a customer payment", () => {
+    expect(
+      paymentSchema.safeParse({
+        salesOrderId: "00000000-0000-4000-8000-000000000001",
+        amount: "100",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+      }).success,
+    ).toBe(false);
+  });
+});
diff --git a/src/modules/transactions/transaction-schemas.ts b/src/modules/transactions/transaction-schemas.ts
new file mode 100644
index 0000000..2acca23
--- /dev/null
+++ b/src/modules/transactions/transaction-schemas.ts
@@ -0,0 +1,129 @@
+import { z } from "zod";
+
+const uuid = z.string().uuid();
+const money = z
+  .string()
+  .regex(/^\d+(?:\.\d{1,4})?$/)
+  .refine((value) => Number(value) >= 0, "Amount must be nonnegative");
+const positiveMoney = money.refine(
+  (value) => Number(value) > 0,
+  "Amount must be greater than zero",
+);
+const currencyCode = z.string().trim().length(3).transform((value) => value.toUpperCase());
+const jsonObject = z.record(z.string(), z.json());
+
+const variantSchema = z.object({
+  sku: z.string().trim().min(1).max(100),
+  name: z.string().trim().min(1).max(200),
+  configurationVersion: z.number().int().positive(),
+  configuration: jsonObject,
+  specifications: jsonObject.optional(),
+  cost: money.nullable().optional(),
+  currencyCode: currencyCode.nullable().optional(),
+});
+
+export const productSchema = z.object({
+  sku: z.string().trim().min(1).max(100),
+  name: z.string().trim().min(1).max(200),
+  description: z.string().max(5000).nullable().optional(),
+  categoryId: uuid,
+  brand: z.string().max(100).nullable().optional(),
+  model: z.string().max(100).nullable().optional(),
+  condition: z.enum(["NEW", "USED", "REFURBISHED", "OPEN_BOX"]),
+  baseModel: z.string().max(200).nullable().optional(),
+  specifications: jsonObject.optional(),
+  referencePrice: money.nullable().optional(),
+  referenceCurrencyCode: currencyCode.nullable().optional(),
+  dimensions: jsonObject.optional(),
+  hsCode: z.string().max(20).nullable().optional(),
+  exportControlRisk: z.enum(["LOW", "REVIEW_REQUIRED", "RESTRICTED"]),
+  media: z.array(jsonObject).optional(),
+  availability: z.enum([
+    "AVAILABLE",
+    "IN_STOCK",
+    "LIMITED",
+    "ON_REQUEST",
+    "UNAVAILABLE",
+  ]),
+  serialized: z.boolean().optional(),
+  variants: z.array(variantSchema).min(1),
+});
+
+export const productUpdateSchema = productSchema.omit({ variants: true }).partial();
+
+export const quoteSchema = z.object({
+  customerId: uuid,
+  opportunityId: uuid.nullable().optional(),
+  validUntil: z.coerce.date().nullable().optional(),
+  currencyCode,
+  exchangeRateToUsd: positiveMoney,
+  shipping: money.optional(),
+  insurance: money.optional(),
+  tax: money.optional(),
+  bankFees: money.optional(),
+  incoterm: z.string().max(20).nullable().optional(),
+  paymentTerms: z.string().max(1000).nullable().optional(),
+  deliveryTerms: z.string().max(1000).nullable().optional(),
+  warrantyTerms: z.string().max(1000).nullable().optional(),
+  remarks: z.string().max(5000).nullable().optional(),
+  items: z
+    .array(
+      z.object({
+        productId: uuid,
+        variantId: uuid,
+        description: z.string().max(1000).optional(),
+        quantity: z.number().int().positive(),
+        unitPrice: positiveMoney,
+        discount: money.optional(),
+      }),
+    )
+    .min(1),
+});
+
+export const quoteTransitionSchema = z.object({
+  status: z.enum([
+    "PENDING_APPROVAL",
+    "APPROVED",
+    "SENT",
+    "VIEWED",
+    "ACCEPTED",
+    "REJECTED",
+    "EXPIRED",
+  ]),
+  note: z.string().max(2000).optional(),
+});
+
+export const orderTransitionSchema = z.object({
+  status: z.enum([
+    "CONFIRMED",
+    "FULFILLING",
+    "SHIPPED",
+    "COMPLETED",
+    "CANCELLED",
+  ]),
+});
+
+export const paymentSchema = z.object({
+  salesOrderId: uuid,
+  reference: z.string().max(200).nullable().optional(),
+  amount: positiveMoney,
+  currencyCode,
+  exchangeRateToUsd: positiveMoney,
+  receivedAt: z.coerce.date().nullable().optional(),
+  proofMetadata: jsonObject,
+});
+
+export const paymentVerificationSchema = z.discriminatedUnion("approved", [
+  z.object({ approved: z.literal(true) }),
+  z.object({
+    approved: z.literal(false),
+    rejectionReason: z.string().trim().min(1).max(2000),
+  }),
+]);
+
+export const refundSchema = z.object({
+  amount: positiveMoney,
+  currencyCode,
+  exchangeRateToUsd: positiveMoney,
+  reason: z.string().trim().min(1).max(2000),
+});
diff --git a/src/modules/transactions/transaction-scope.test.ts b/src/modules/transactions/transaction-scope.test.ts
new file mode 100644
index 0000000..647119d
--- /dev/null
+++ b/src/modules/transactions/transaction-scope.test.ts
@@ -0,0 +1,28 @@
+import { describe, expect, it } from "vitest";
+
+import { transactionOrderWhere } from "@/modules/transactions/transaction-scope";
+
+describe("transaction order scope", () => {
+  it("keeps Sales Representatives scoped to their own orders", () => {
+    expect(
+      transactionOrderWhere({
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["order.read"],
+      }),
+    ).toEqual({ ownerId: "sales-1" });
+  });
+
+  it.each(["FINANCE", "PROCUREMENT", "OPERATIONS"])(
+    "lets %s users work their explicitly permitted cross-owner orders",
+    (role) => {
+      expect(
+        transactionOrderWhere({
+          userId: `${role.toLowerCase()}-1`,
+          roles: [role],
+          permissions: ["order.read"],
+        }),
+      ).toEqual({});
+    },
+  );
+});
diff --git a/src/modules/transactions/transaction-scope.ts b/src/modules/transactions/transaction-scope.ts
new file mode 100644
index 0000000..0eb3f94
--- /dev/null
+++ b/src/modules/transactions/transaction-scope.ts
@@ -0,0 +1,18 @@
+import type { AuthorizationContext } from "@/lib/rbac";
+import { hasGlobalOwnershipScope } from "@/lib/rbac";
+
+const CROSS_OWNER_ORDER_ROLES = new Set([
+  "FINANCE",
+  "PROCUREMENT",
+  "OPERATIONS",
+]);
+
+export function transactionOrderWhere(context: AuthorizationContext) {
+  if (
+    hasGlobalOwnershipScope(context) ||
+    context.roles?.some((role) => CROSS_OWNER_ORDER_ROLES.has(role))
+  ) {
+    return {};
+  }
+  return { ownerId: context.userId };
+}
diff --git a/src/modules/transactions/transaction-service.test.ts b/src/modules/transactions/transaction-service.test.ts
new file mode 100644
index 0000000..9182293
--- /dev/null
+++ b/src/modules/transactions/transaction-service.test.ts
@@ -0,0 +1,148 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  approveQuote,
+  convertAcceptedQuote,
+  reviseQuote,
+  transitionQuote,
+  type TransactionRepository,
+} from "@/modules/transactions/transaction-service";
+
+function repository(): TransactionRepository & {
+  approvals: string[];
+  conversions: string[];
+  revisions: number[];
+} {
+  const approvals: string[] = [];
+  const conversions: string[] = [];
+  const revisions: number[] = [];
+  return {
+    approvals,
+    conversions,
+    revisions,
+    findQuote: async () => ({
+      id: "quote-1",
+      ownerId: "sales-1",
+      status: "PENDING_APPROVAL",
+      currentVersion: 1,
+      orderId: null,
+      current: {
+        id: "version-1",
+        number: 1,
+        immutableAt: new Date("2026-07-17"),
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        shipping: "0",
+        insurance: "0",
+        tax: "0",
+        bankFees: "0",
+        items: [{ description: "Server", quantity: 1 }],
+      },
+    }),
+    transitionQuote: async (_context, quote, status) => {
+      if (status === "APPROVED") approvals.push(quote.id);
+      return { id: quote.id, status };
+    },
+    createRevision: async (_context, quote, revision) => {
+      revisions.push(revision.number);
+      return { id: quote.id, currentVersion: revision.number, status: "DRAFT" };
+    },
+    convertQuote: async (_context, quote) => {
+      if (conversions.includes(quote.id)) {
+        throw Object.assign(new Error("duplicate"), {
+          code: "QUOTE_ALREADY_CONVERTED",
+          status: 409,
+        });
+      }
+      conversions.push(quote.id);
+      return { id: "order-1", quoteId: quote.id };
+    },
+  };
+}
+
+const manager = {
+  userId: "manager-1",
+  roles: ["SALES_MANAGER"],
+  permissions: ["quote.read", "quote.update", "quote.approve", "order.create"],
+};
+
+describe("quotation transactions", () => {
+  it("approves through the audited repository boundary", async () => {
+    const repo = repository();
+    await expect(
+      approveQuote(repo, manager, "quote-1", "Margin reviewed"),
+    ).resolves.toEqual({ id: "quote-1", status: "APPROVED" });
+    expect(repo.approvals).toEqual(["quote-1"]);
+  });
+
+  it("does not let an ordinary sales representative approve", async () => {
+    const repo = repository();
+    await expect(
+      approveQuote(
+        repo,
+        {
+          userId: "sales-1",
+          roles: ["SALES_REP"],
+          permissions: ["quote.update", "quote.approve"],
+        },
+        "quote-1",
+        "Self approval",
+      ),
+    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
+    expect(repo.approvals).toEqual([]);
+  });
+
+  it("applies a valid non-approval transition through the repository", async () => {
+    const repo = repository();
+    await expect(
+      transitionQuote(repo, manager, "quote-1", "REJECTED"),
+    ).resolves.toEqual({ id: "quote-1", status: "REJECTED" });
+  });
+
+  it("creates a sequential revision copied from the immutable current version", async () => {
+    const repo = repository();
+    await expect(reviseQuote(repo, manager, "quote-1")).resolves.toMatchObject({
+      currentVersion: 2,
+      status: "DRAFT",
+    });
+    expect(repo.revisions).toEqual([2]);
+  });
+
+  it("converts the accepted version only once", async () => {
+    const repo = repository();
+    repo.findQuote = async () => ({
+      id: "quote-1",
+      ownerId: "sales-1",
+      status: "ACCEPTED",
+      currentVersion: 1,
+      orderId: null,
+      current: {
+        id: "version-1",
+        number: 1,
+        immutableAt: new Date("2026-07-17"),
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        shipping: "0",
+        insurance: "0",
+        tax: "0",
+        bankFees: "0",
+        items: [{ description: "Server", quantity: 1 }],
+      },
+    });
+
+    await expect(convertAcceptedQuote(repo, manager, "quote-1")).resolves.toEqual(
+      { id: "order-1", quoteId: "quote-1" },
+    );
+    await expect(convertAcceptedQuote(repo, manager, "quote-1")).rejects.toMatchObject(
+      { code: "QUOTE_ALREADY_CONVERTED", status: 409 },
+    );
+  });
+
+  it("rejects conversion before customer acceptance", async () => {
+    const repo = repository();
+    await expect(convertAcceptedQuote(repo, manager, "quote-1")).rejects.toMatchObject(
+      { code: "QUOTE_NOT_ACCEPTED", status: 409 },
+    );
+    expect(repo.conversions).toEqual([]);
+  });
+});
diff --git a/src/modules/transactions/transaction-service.ts b/src/modules/transactions/transaction-service.ts
new file mode 100644
index 0000000..654f4b6
--- /dev/null
+++ b/src/modules/transactions/transaction-service.ts
@@ -0,0 +1,154 @@
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { requirePermission } from "@/lib/rbac";
+import {
+  assertQuoteApprovalRole,
+  assertQuoteTransition,
+  nextQuoteRevision,
+} from "@/modules/quotes/quote-domain";
+
+export interface TransactionQuote {
+  id: string;
+  ownerId: string;
+  status: string;
+  currentVersion: number;
+  orderId: string | null;
+  current: {
+    id: string;
+    number: number;
+    immutableAt: Date | null;
+    items: unknown[];
+    [key: string]: unknown;
+  };
+}
+
+export interface TransactionRepository {
+  findQuote(
+    context: AuthorizationContext,
+    quoteId: string,
+  ): Promise<TransactionQuote | null>;
+  transitionQuote(
+    context: AuthorizationContext,
+    quote: TransactionQuote,
+    status: string,
+    note?: string,
+  ): Promise<unknown>;
+  createRevision(
+    context: AuthorizationContext,
+    quote: TransactionQuote,
+    revision: ReturnType<typeof nextQuoteRevision>,
+  ): Promise<unknown>;
+  convertQuote(
+    context: AuthorizationContext,
+    quote: TransactionQuote,
+  ): Promise<unknown>;
+}
+
+async function requiredQuote(
+  repository: TransactionRepository,
+  context: AuthorizationContext,
+  quoteId: string,
+  permission: string,
+) {
+  const quote = await repository.findQuote(context, quoteId);
+  if (!quote) {
+    throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
+  }
+  requirePermission(context, permission, { ownerId: quote.ownerId });
+  return quote;
+}
+
+export async function approveQuote(
+  repository: TransactionRepository,
+  context: AuthorizationContext,
+  quoteId: string,
+  note: string,
+) {
+  const quote = await requiredQuote(
+    repository,
+    context,
+    quoteId,
+    "quote.approve",
+  );
+  assertQuoteApprovalRole(context.roles);
+  assertQuoteTransition(quote.status, "APPROVED");
+  const trimmedNote = note.trim();
+  if (!trimmedNote) {
+    throw new DomainError(
+      "QUOTE_APPROVAL_NOTE_REQUIRED",
+      "Approval requires a nonempty note",
+    );
+  }
+  return repository.transitionQuote(
+    context,
+    quote,
+    "APPROVED",
+    trimmedNote,
+  );
+}
+
+export async function transitionQuote(
+  repository: TransactionRepository,
+  context: AuthorizationContext,
+  quoteId: string,
+  status: string,
+  note?: string,
+) {
+  if (status === "APPROVED") {
+    return approveQuote(repository, context, quoteId, note ?? "");
+  }
+  const quote = await requiredQuote(
+    repository,
+    context,
+    quoteId,
+    "quote.update",
+  );
+  assertQuoteTransition(quote.status, status);
+  return repository.transitionQuote(context, quote, status, note?.trim());
+}
+
+export async function reviseQuote(
+  repository: TransactionRepository,
+  context: AuthorizationContext,
+  quoteId: string,
+) {
+  const quote = await requiredQuote(
+    repository,
+    context,
+    quoteId,
+    "quote.update",
+  );
+  const revision = nextQuoteRevision({
+    currentVersion: quote.currentVersion,
+    source: quote.current,
+  });
+  return repository.createRevision(context, quote, revision);
+}
+
+export async function convertAcceptedQuote(
+  repository: TransactionRepository,
+  context: AuthorizationContext,
+  quoteId: string,
+) {
+  const quote = await requiredQuote(
+    repository,
+    context,
+    quoteId,
+    "order.create",
+  );
+  if (quote.orderId || quote.status === "CONVERTED") {
+    throw new DomainError(
+      "QUOTE_ALREADY_CONVERTED",
+      "Quotation has already been converted",
+      409,
+    );
+  }
+  if (quote.status !== "ACCEPTED") {
+    throw new DomainError(
+      "QUOTE_NOT_ACCEPTED",
+      "Only an accepted quotation can be converted",
+      409,
+    );
+  }
+  return repository.convertQuote(context, quote);
+}
