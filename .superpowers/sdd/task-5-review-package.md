# Task 5 review package

## Tracked changes

diff --git a/.env.example b/.env.example
index 379ef3d..dde2275 100644
--- a/.env.example
+++ b/.env.example
@@ -1,10 +1,13 @@
 DATABASE_URL=postgresql://crm:crm_dev_password@localhost:5432/foreign_trade_crm?schema=public
 AUTH_SECRET=replace-with-at-least-32-random-bytes
 AUTH_URL=http://localhost:3000
 MINIO_ENDPOINT=localhost
 MINIO_PORT=9000
 MINIO_ACCESS_KEY=atlas_minio
 MINIO_SECRET_KEY=replace-this-minio-secret
 MINIO_BUCKET=atlas-crm
 MINIO_USE_SSL=false
 WORKER_CONCURRENCY=2
+WORKER_CRONTAB=*/15 * * * * generate_management_reminders
+BACKUP_ROOT=./backups
+BACKUP_RETENTION_DAYS=30
diff --git a/README.md b/README.md
index b773073..45a5bd8 100644
--- a/README.md
+++ b/README.md
@@ -1,23 +1,49 @@
 # Atlas Foreign-Trade CRM
 
 Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.
 
-## Foundation stack
+## Stack
 
 - Node.js 24, pnpm, Next.js App Router, React and TypeScript
 - PostgreSQL 17 with Prisma and fixed-point decimal money
 - Auth.js credentials sessions with Argon2id password hashing
 - Graphile Worker for PostgreSQL-backed background jobs
 - MinIO-compatible object storage
 - Vitest, ESLint and strict TypeScript
 
+## Modules
+
+- Sales CRM: leads, customers, contacts, follow-ups, opportunities, products, quotes, orders, payments, refunds and costs
+- Procurement and fulfillment: suppliers, purchase orders, inventory, serial tracking, inspections and shipments
+- Management: after-sales tickets, personal/team tasks, notifications, permission-scoped reports and exports, settings and redacted activity logs
+- Platform: Auth.js authentication, RBAC, optimistic concurrency, audit events, Graphile Worker, PostgreSQL, MinIO and bilingual English/Chinese routes
+
+## Project structure
+
+```text
+prisma/                  schema, migrations and deterministic seed
+scripts/                 operator backup and restore commands
+src/app/                 locale pages and API Route Handlers
+src/components/          reusable interactive UI
+src/modules/             domain rules, services and repositories
+src/lib/                 auth, RBAC, audit, HTTP and shared utilities
+docs/operations/         deployment and recovery runbooks
+```
+
+## Requirements
+
+- Node.js 24 and pnpm 11
+- PostgreSQL 17
+- MinIO or another S3-compatible service
+- PostgreSQL client tools and MinIO `mc` for operator backups
+
 ## Local setup
 
 1. Install Node.js 24 and enable pnpm through Corepack.
 2. Copy `.env.example` to `.env` and replace `AUTH_SECRET` and storage secrets.
 3. Start PostgreSQL 17 and MinIO, or run `docker compose up postgres minio -d`.
 4. Install and initialize:
 
    ```bash
    pnpm install
    pnpm prisma:generate
@@ -46,20 +72,35 @@ ChangeMe123!
 | --- | --- |
 | Super Admin | `admin@atlascrm.dev` |
 | Sales Manager | `sales.manager@atlascrm.dev` |
 | Sales Representative | `sales.asia@atlascrm.dev`, `sales.emea@atlascrm.dev` |
 | Finance | `finance@atlascrm.dev` |
 | Procurement | `procurement@atlascrm.dev` |
 | Operations | `warehouse@atlascrm.dev`, `logistics@atlascrm.dev`, `support@atlascrm.dev` |
 
 Never reuse the development password in a shared or production environment.
 
+The deterministic seed creates 20 customers, 40 leads, 20 opportunities, representative transaction/procurement/fulfillment records, 10 after-sales tickets, 20 tasks, six roles, and nine users. Re-running the seed is idempotent.
+
+## Roles
+
+| Role | Scope |
+| --- | --- |
+| Super Admin | All modules, settings, users, roles and activity logs |
+| Sales Manager | Team-wide sales, tasks and commercial reports |
+| Sales Representative | Owned sales accounts, transactions and personal tasks |
+| Finance | Payments, refunds, receivables, purchasing cost and profit reports |
+| Procurement | Suppliers, purchasing and related inventory/tasks |
+| Operations | Inventory, quality, logistics, after-sales and related tasks |
+
+Reports apply ownership scope on the server. Purchase-cost, supplier-bank and profit values require their explicit sensitive permissions.
+
 ## Commands
 
 ```bash
 pnpm test              # full Vitest suite
 pnpm typecheck         # strict TypeScript
 pnpm lint              # ESLint
 pnpm build             # production Next.js build
 pnpm prisma:generate   # generate the typed client
 pnpm prisma:migrate    # create/apply development migrations
 pnpm prisma:seed       # deterministic roles, users and foundation data
@@ -69,18 +110,57 @@ pnpm prisma:seed       # deterministic roles, users and foundation data
 
 `docker compose up --build` starts:
 
 - `web` on port 3000 with an API/database health check
 - `worker` for Graphile Worker jobs
 - `postgres` 17 with durable storage and `pg_isready`
 - `minio` on ports 9000/9001 with durable storage and health checks
 
 Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` outside development.
 
+For a deployment, copy `.env.example`, replace every secret, then run:
+
+```bash
+docker compose config
+docker compose up --build -d
+docker compose ps
+```
+
+Apply migrations and seed only from an authorized release process:
+
+```bash
+docker compose exec web pnpm prisma migrate deploy
+docker compose exec web pnpm prisma:seed
+```
+
+## Database and worker
+
+Prisma migrations in `prisma/migrations` are the database source of truth. Use `pnpm prisma:migrate` only for local development and `pnpm prisma migrate deploy` in deployments. The worker runs the idempotent `generate_management_reminders` task every 15 minutes by default; `WORKER_CRONTAB` can override the schedule, and Graphile Worker retries failures up to the configured task limit.
+
+## Backup and restore
+
+Set the database and MinIO environment variables, then run `.\scripts\backup.ps1`. Backups default to `.\backups` with 30-day retention. Restores require the explicit destructive confirmation switch:
+
+```powershell
+.\scripts\restore.ps1 -BackupPath .\backups\<timestamp> -ConfirmRestore
+```
+
+The full procedure and quarterly restore drill are in [docs/operations/backup-restore.md](docs/operations/backup-restore.md).
+
+## Troubleshooting
+
+- `DATABASE_URL is required`: ensure `.env` exists and the command is launched from the project directory.
+- Authentication loops: verify `AUTH_SECRET`, the public application URL and user status, then check login-attempt audit records.
+- Prisma client/type mismatch: run `pnpm prisma:generate` after every schema change.
+- Worker creates no reminders: confirm the worker process, `WORKER_CRONTAB`, Graphile Worker schema access and eligible due records.
+- MinIO attachments fail: verify endpoint reachability, credentials, bucket name and clock synchronization.
+- Migration fails: do not edit an applied migration; restore from backup or correct the forward migration and rerun deployment.
+- Build fails after a clean checkout: use Node.js 24, enable Corepack, run `pnpm install --frozen-lockfile`, then regenerate Prisma.
+
 ## Security and architecture notes
 
 - Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
 - Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
 - User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
 - Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
 - Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
 - Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 532e75c..e4f3086 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -367,49 +367,51 @@ model ProductCategory {
   id        String    @id @default(uuid()) @db.Uuid
   name      String
   slug      String    @unique
   createdAt DateTime  @default(now())
   updatedAt DateTime  @updatedAt
   deletedAt DateTime?
   products  Product[]
 }
 
 model Product {
-  id                    String            @id @default(uuid()) @db.Uuid
-  sku                   String            @unique
+  id                    String              @id @default(uuid()) @db.Uuid
+  sku                   String              @unique
   name                  String
   description           String?
-  categoryId            String            @db.Uuid
+  categoryId            String              @db.Uuid
   brand                 String?
   model                 String?
-  condition             String            @default("NEW")
+  condition             String              @default("NEW")
   baseModel             String?
   specifications        Json?
-  referencePrice        Decimal?          @db.Decimal(19, 4)
+  referencePrice        Decimal?            @db.Decimal(19, 4)
   referenceCurrencyCode String?
   dimensions            Json?
   hsCode                String?
-  exportControlRisk     String            @default("LOW")
+  exportControlRisk     String              @default("LOW")
   media                 Json?
-  availability          String            @default("AVAILABLE")
-  serialized            Boolean           @default(true)
-  status                RecordStatus      @default(ACTIVE)
-  version               Int               @default(1)
-  createdAt             DateTime          @default(now())
-  updatedAt             DateTime          @updatedAt
+  availability          String              @default("AVAILABLE")
+  serialized            Boolean             @default(true)
+  status                RecordStatus        @default(ACTIVE)
+  version               Int                 @default(1)
+  createdAt             DateTime            @default(now())
+  updatedAt             DateTime            @updatedAt
   deletedAt             DateTime?
-  category              ProductCategory   @relation(fields: [categoryId], references: [id])
+  category              ProductCategory     @relation(fields: [categoryId], references: [id])
   variants              ProductVariant[]
   quoteItems            QuoteItem[]
   orderItems            SalesOrderItem[]
   supplierProducts      SupplierProduct[]
   inventoryItems        InventoryItem[]
+  purchaseOrderItems    PurchaseOrderItem[]
+  afterSalesTickets     AfterSalesTicket[]
 
   @@index([categoryId, status, deletedAt])
 }
 
 model ProductVariant {
   id                   String    @id @default(uuid()) @db.Uuid
   productId            String    @db.Uuid
   sku                  String    @unique
   name                 String
   configurationVersion Int       @default(1)
@@ -637,35 +639,46 @@ model Cost {
   version           Int        @default(1)
   createdAt         DateTime   @default(now())
   updatedAt         DateTime   @updatedAt
   deletedAt         DateTime?
   salesOrder        SalesOrder @relation(fields: [salesOrderId], references: [id])
 
   @@index([salesOrderId, category, deletedAt])
 }
 
 model Supplier {
-  id             String            @id @default(uuid()) @db.Uuid
-  code           String            @unique
-  name           String
-  countryCode    String
-  contactName    String?
-  email          String?
-  phone          String?
-  address        Json?
-  status         RecordStatus      @default(ACTIVE)
-  version        Int               @default(1)
-  createdAt      DateTime          @default(now())
-  updatedAt      DateTime          @updatedAt
-  deletedAt      DateTime?
-  products       SupplierProduct[]
-  purchaseOrders PurchaseOrder[]
+  id                String            @id @default(uuid()) @db.Uuid
+  code              String            @unique
+  name              String
+  countryCode       String
+  supplierType      String            @default("DISTRIBUTOR")
+  contactName       String?
+  email             String?
+  phone             String?
+  website           String?
+  taxId             String?
+  address           Json?
+  paymentTerms      String?
+  leadTimeDays      Int?
+  minimumOrderValue Decimal?          @db.Decimal(19, 4)
+  rating            Int?
+  bankName          String?
+  bankAccountName   String?
+  bankAccountNumber String?
+  notes             String?
+  status            RecordStatus      @default(ACTIVE)
+  version           Int               @default(1)
+  createdAt         DateTime          @default(now())
+  updatedAt         DateTime          @updatedAt
+  deletedAt         DateTime?
+  products          SupplierProduct[]
+  purchaseOrders    PurchaseOrder[]
 
   @@index([status, deletedAt])
   @@index([countryCode])
 }
 
 model SupplierProduct {
   supplierId   String   @db.Uuid
   productId    String   @db.Uuid
   supplierSku  String?
   leadTimeDays Int?
@@ -682,49 +695,61 @@ model PurchaseOrder {
   id                  String              @id @default(uuid()) @db.Uuid
   purchaseOrderNumber String              @unique
   supplierId          String              @db.Uuid
   salesOrderId        String?             @db.Uuid
   buyerId             String              @db.Uuid
   status              PurchaseOrderStatus @default(DRAFT)
   currencyCode        String
   exchangeRateToUsd   Decimal             @db.Decimal(24, 12)
   total               Decimal             @db.Decimal(19, 4)
   totalUsd            Decimal             @db.Decimal(19, 4)
+  paymentTerms        String?
+  shippingTerms       String?
+  incoterm            String?
+  deliveryAddress     Json?
+  notes               String?
+  attachments         Json?
   expectedAt          DateTime?
+  receivedAt          DateTime?
   version             Int                 @default(1)
   createdAt           DateTime            @default(now())
   updatedAt           DateTime            @updatedAt
   deletedAt           DateTime?
   supplier            Supplier            @relation(fields: [supplierId], references: [id])
   salesOrder          SalesOrder?         @relation(fields: [salesOrderId], references: [id])
   buyer               User                @relation("PurchaseBuyer", fields: [buyerId], references: [id])
   items               PurchaseOrderItem[]
 
   @@index([supplierId, status, deletedAt])
   @@index([salesOrderId])
 }
 
 model PurchaseOrderItem {
-  id               String          @id @default(uuid()) @db.Uuid
-  purchaseOrderId  String          @db.Uuid
-  salesOrderItemId String?         @db.Uuid
-  description      String
-  quantity         Int
-  receivedQuantity Int             @default(0)
-  unitCost         Decimal         @db.Decimal(19, 4)
-  lineTotal        Decimal         @db.Decimal(19, 4)
-  purchaseOrder    PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
-  salesOrderItem   SalesOrderItem? @relation(fields: [salesOrderItemId], references: [id])
-  inventoryItems   InventoryItem[]
+  id                    String          @id @default(uuid()) @db.Uuid
+  purchaseOrderId       String          @db.Uuid
+  salesOrderItemId      String?         @db.Uuid
+  productId             String?         @db.Uuid
+  description           String
+  productSnapshot       Json?
+  configurationSnapshot Json?
+  quantity              Int
+  receivedQuantity      Int             @default(0)
+  unitCost              Decimal         @db.Decimal(19, 4)
+  lineTotal             Decimal         @db.Decimal(19, 4)
+  purchaseOrder         PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
+  salesOrderItem        SalesOrderItem? @relation(fields: [salesOrderItemId], references: [id])
+  product               Product?        @relation(fields: [productId], references: [id])
+  inventoryItems        InventoryItem[]
 
   @@index([purchaseOrderId])
   @@index([salesOrderItemId])
+  @@index([productId])
 }
 
 model Warehouse {
   id        String              @id @default(uuid()) @db.Uuid
   code      String              @unique
   name      String
   address   Json?
   status    RecordStatus        @default(ACTIVE)
   createdAt DateTime            @default(now())
   updatedAt DateTime            @updatedAt
@@ -758,187 +783,262 @@ model InventoryItem {
   version             Int                    @default(1)
   createdAt           DateTime               @default(now())
   updatedAt           DateTime               @updatedAt
   deletedAt           DateTime?
   product             Product                @relation(fields: [productId], references: [id])
   location            WarehouseLocation      @relation(fields: [locationId], references: [id])
   purchaseOrderItem   PurchaseOrderItem?     @relation(fields: [purchaseOrderItemId], references: [id])
   serials             InventorySerial[]
   transactions        InventoryTransaction[]
   inspections         QualityInspection[]
+  shipmentItems       ShipmentItem[]
 
   @@unique([productId, locationId, purchaseOrderItemId])
   @@index([locationId, deletedAt])
 }
 
 model InventorySerial {
-  id              String        @id @default(uuid()) @db.Uuid
-  inventoryItemId String        @db.Uuid
-  serialNumber    String        @unique
-  status          String        @default("AVAILABLE")
+  id              String                 @id @default(uuid()) @db.Uuid
+  inventoryItemId String                 @db.Uuid
+  serialNumber    String                 @unique
+  status          String                 @default("AVAILABLE")
   receivedAt      DateTime?
   issuedAt        DateTime?
-  createdAt       DateTime      @default(now())
-  updatedAt       DateTime      @updatedAt
-  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
+  createdAt       DateTime               @default(now())
+  updatedAt       DateTime               @updatedAt
+  inventoryItem   InventoryItem          @relation(fields: [inventoryItemId], references: [id])
+  inspections     QualityInspection[]
+  shipmentSerials ShipmentSerial[]
+  transactions    InventoryTransaction[]
+  afterSalesTickets AfterSalesTicket[]
 
   @@index([inventoryItemId, status])
 }
 
 model InventoryTransaction {
-  id              String                   @id @default(uuid()) @db.Uuid
-  inventoryItemId String                   @db.Uuid
-  type            InventoryTransactionType
-  quantity        Int
-  fromLocationId  String?                  @db.Uuid
-  toLocationId    String?                  @db.Uuid
-  referenceType   String?
-  referenceId     String?
-  notes           String?
-  occurredAt      DateTime                 @default(now())
-  createdById     String                   @db.Uuid
-  inventoryItem   InventoryItem            @relation(fields: [inventoryItemId], references: [id])
-  fromLocation    WarehouseLocation?       @relation("TransactionFromLocation", fields: [fromLocationId], references: [id])
-  toLocation      WarehouseLocation?       @relation("TransactionToLocation", fields: [toLocationId], references: [id])
+  id                String                   @id @default(uuid()) @db.Uuid
+  inventoryItemId   String                   @db.Uuid
+  inventorySerialId String?                  @db.Uuid
+  type              InventoryTransactionType
+  quantity          Int
+  fromLocationId    String?                  @db.Uuid
+  toLocationId      String?                  @db.Uuid
+  referenceType     String?
+  referenceId       String?
+  notes             String?
+  occurredAt        DateTime                 @default(now())
+  createdById       String                   @db.Uuid
+  inventoryItem     InventoryItem            @relation(fields: [inventoryItemId], references: [id])
+  inventorySerial   InventorySerial?         @relation(fields: [inventorySerialId], references: [id])
+  fromLocation      WarehouseLocation?       @relation("TransactionFromLocation", fields: [fromLocationId], references: [id])
+  toLocation        WarehouseLocation?       @relation("TransactionToLocation", fields: [toLocationId], references: [id])
 
   @@index([inventoryItemId, occurredAt])
+  @@index([inventorySerialId, occurredAt])
   @@index([referenceType, referenceId])
 }
 
 model QualityInspection {
-  id              String           @id @default(uuid()) @db.Uuid
-  inventoryItemId String           @db.Uuid
-  inspectorId     String           @db.Uuid
-  status          InspectionStatus @default(PENDING)
-  checklist       Json?
-  notes           String?
-  inspectedAt     DateTime?
-  version         Int              @default(1)
-  createdAt       DateTime         @default(now())
-  updatedAt       DateTime         @updatedAt
-  inventoryItem   InventoryItem    @relation(fields: [inventoryItemId], references: [id])
-  inspector       User             @relation("InspectionInspector", fields: [inspectorId], references: [id])
+  id                String           @id @default(uuid()) @db.Uuid
+  inventoryItemId   String           @db.Uuid
+  inventorySerialId String?          @db.Uuid
+  inspectorId       String           @db.Uuid
+  status            InspectionStatus @default(PENDING)
+  checklist         Json?
+  notes             String?
+  inspectedAt       DateTime?
+  version           Int              @default(1)
+  createdAt         DateTime         @default(now())
+  updatedAt         DateTime         @updatedAt
+  inventoryItem     InventoryItem    @relation(fields: [inventoryItemId], references: [id])
+  inventorySerial   InventorySerial? @relation(fields: [inventorySerialId], references: [id])
+  inspector         User             @relation("InspectionInspector", fields: [inspectorId], references: [id])
 
   @@index([inventoryItemId, status])
+  @@index([inventorySerialId, status])
 }
 
 model Shipment {
-  id             String         @id @default(uuid()) @db.Uuid
-  shipmentNumber String         @unique
-  salesOrderId   String         @db.Uuid
-  coordinatorId  String         @db.Uuid
-  status         ShipmentStatus @default(DRAFT)
-  carrier        String?
-  trackingNumber String?
-  incoterm       String?
-  origin         String?
-  destination    String?
-  shippedAt      DateTime?
-  deliveredAt    DateTime?
-  version        Int            @default(1)
-  createdAt      DateTime       @default(now())
-  updatedAt      DateTime       @updatedAt
-  deletedAt      DateTime?
-  salesOrder     SalesOrder     @relation(fields: [salesOrderId], references: [id])
-  coordinator    User           @relation("ShipmentCoordinator", fields: [coordinatorId], references: [id])
-  items          ShipmentItem[]
+  id                       String             @id @default(uuid()) @db.Uuid
+  shipmentNumber           String             @unique
+  salesOrderId             String             @db.Uuid
+  coordinatorId            String             @db.Uuid
+  status                   ShipmentStatus     @default(DRAFT)
+  method                   String             @default("AIR")
+  carrier                  String?
+  trackingNumber           String?
+  incoterm                 String?
+  origin                   String?
+  destination              String?
+  originPort               String?
+  destinationPort          String?
+  grossWeightKg            Decimal?           @db.Decimal(19, 4)
+  volumeCbm                Decimal?           @db.Decimal(19, 4)
+  freightCost              Decimal?           @db.Decimal(19, 4)
+  freightCurrencyCode      String?
+  freightExchangeRateToUsd Decimal?           @db.Decimal(24, 12)
+  freightCostUsd           Decimal?           @db.Decimal(19, 4)
+  estimatedDepartureAt     DateTime?
+  estimatedArrivalAt       DateTime?
+  shippedAt                DateTime?
+  deliveredAt              DateTime?
+  version                  Int                @default(1)
+  createdAt                DateTime           @default(now())
+  updatedAt                DateTime           @updatedAt
+  deletedAt                DateTime?
+  salesOrder               SalesOrder         @relation(fields: [salesOrderId], references: [id])
+  coordinator              User               @relation("ShipmentCoordinator", fields: [coordinatorId], references: [id])
+  items                    ShipmentItem[]
+  documents                ShipmentDocument[]
 
   @@index([salesOrderId, status, deletedAt])
   @@index([trackingNumber])
 }
 
 model ShipmentItem {
-  id               String         @id @default(uuid()) @db.Uuid
-  shipmentId       String         @db.Uuid
-  salesOrderItemId String         @db.Uuid
+  id               String           @id @default(uuid()) @db.Uuid
+  shipmentId       String           @db.Uuid
+  salesOrderItemId String           @db.Uuid
+  inventoryItemId  String?          @db.Uuid
   quantity         Int
-  shipment         Shipment       @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
-  salesOrderItem   SalesOrderItem @relation(fields: [salesOrderItemId], references: [id])
+  shipment         Shipment         @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
+  salesOrderItem   SalesOrderItem   @relation(fields: [salesOrderItemId], references: [id])
+  inventoryItem    InventoryItem?   @relation(fields: [inventoryItemId], references: [id])
+  serials          ShipmentSerial[]
 
   @@unique([shipmentId, salesOrderItemId])
+  @@index([inventoryItemId])
+}
+
+model ShipmentSerial {
+  id                String          @id @default(uuid()) @db.Uuid
+  shipmentItemId    String          @db.Uuid
+  inventorySerialId String          @db.Uuid
+  status            String          @default("RESERVED")
+  reservedAt        DateTime        @default(now())
+  issuedAt          DateTime?
+  releasedAt        DateTime?
+  returnedAt        DateTime?
+  shipmentItem      ShipmentItem    @relation(fields: [shipmentItemId], references: [id], onDelete: Cascade)
+  inventorySerial   InventorySerial @relation(fields: [inventorySerialId], references: [id], onDelete: Restrict)
+
+  @@unique([shipmentItemId, inventorySerialId])
+  @@index([inventorySerialId, status])
+}
+
+model ShipmentDocument {
+  id           String    @id @default(uuid()) @db.Uuid
+  shipmentId   String    @db.Uuid
+  fileAssetId  String    @db.Uuid
+  documentType String
+  createdAt    DateTime  @default(now())
+  shipment     Shipment  @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
+  fileAsset    FileAsset @relation(fields: [fileAssetId], references: [id], onDelete: Restrict)
+
+  @@unique([shipmentId, fileAssetId, documentType])
+  @@index([fileAssetId])
 }
 
 model AfterSalesTicket {
-  id           String      @id @default(uuid()) @db.Uuid
-  ticketNumber String      @unique
-  customerId   String      @db.Uuid
-  salesOrderId String?     @db.Uuid
-  assignedToId String?     @db.Uuid
-  subject      String
-  description  String
-  priority     String      @default("NORMAL")
-  status       String      @default("OPEN")
-  resolution   String?
-  version      Int         @default(1)
-  createdAt    DateTime    @default(now())
-  updatedAt    DateTime    @updatedAt
-  closedAt     DateTime?
-  deletedAt    DateTime?
-  customer     Customer    @relation(fields: [customerId], references: [id])
-  salesOrder   SalesOrder? @relation(fields: [salesOrderId], references: [id])
-  assignedTo   User?       @relation("TicketAssignee", fields: [assignedToId], references: [id])
+  id                String           @id @default(uuid()) @db.Uuid
+  ticketNumber      String           @unique
+  customerId        String           @db.Uuid
+  salesOrderId      String?          @db.Uuid
+  productId         String?          @db.Uuid
+  inventorySerialId String?          @db.Uuid
+  assignedToId      String?          @db.Uuid
+  subject           String
+  description       String
+  issueType         String           @default("OTHER")
+  priority          String           @default("NORMAL")
+  status            String           @default("OPEN")
+  solution          String?
+  costAmount        Decimal?         @db.Decimal(19, 4)
+  costCurrencyCode  String?
+  attachments       Json?
+  version           Int              @default(1)
+  createdAt         DateTime         @default(now())
+  updatedAt         DateTime         @updatedAt
+  resolvedAt        DateTime?
+  closedAt          DateTime?
+  deletedAt         DateTime?
+  customer          Customer         @relation(fields: [customerId], references: [id])
+  salesOrder        SalesOrder?      @relation(fields: [salesOrderId], references: [id])
+  product           Product?         @relation(fields: [productId], references: [id])
+  inventorySerial   InventorySerial? @relation(fields: [inventorySerialId], references: [id])
+  assignedTo        User?            @relation("TicketAssignee", fields: [assignedToId], references: [id])
 
   @@index([assignedToId, status, deletedAt])
   @@index([customerId])
+  @@index([salesOrderId])
+  @@index([productId])
+  @@index([inventorySerialId])
 }
 
 model Task {
   id          String     @id @default(uuid()) @db.Uuid
   title       String
   description String?
   status      TaskStatus @default(OPEN)
   priority    String     @default("NORMAL")
   dueAt       DateTime?
+  reminderAt  DateTime?
   assigneeId  String     @db.Uuid
   creatorId   String     @db.Uuid
+  teamCode    String?
   entityType  String?
   entityId    String?
   version     Int        @default(1)
   createdAt   DateTime   @default(now())
   updatedAt   DateTime   @updatedAt
   completedAt DateTime?
   deletedAt   DateTime?
   assignee    User       @relation("TaskAssignee", fields: [assigneeId], references: [id])
   creator     User       @relation("TaskCreator", fields: [creatorId], references: [id])
 
   @@index([assigneeId, status, dueAt, deletedAt])
   @@index([entityType, entityId])
 }
 
 model Notification {
-  id        String    @id @default(uuid()) @db.Uuid
-  userId    String    @db.Uuid
-  type      String
-  title     String
-  message   String
-  link      String?
-  readAt    DateTime?
-  createdAt DateTime  @default(now())
-  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
+  id         String    @id @default(uuid()) @db.Uuid
+  userId     String    @db.Uuid
+  type       String
+  title      String
+  message    String
+  link       String?
+  entityType String?
+  entityId   String?
+  dedupeKey  String?   @unique
+  readAt     DateTime?
+  createdAt  DateTime  @default(now())
+  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
 
   @@index([userId, readAt, createdAt])
+  @@index([entityType, entityId])
 }
 
 model FileAsset {
-  id          String    @id @default(uuid()) @db.Uuid
-  bucket      String
-  objectKey   String    @unique
-  fileName    String
-  contentType String
-  sizeBytes   BigInt
-  checksum    String?
-  entityType  String?
-  entityId    String?
-  uploaderId  String    @db.Uuid
-  createdAt   DateTime  @default(now())
-  deletedAt   DateTime?
-  uploader    User      @relation("FileUploader", fields: [uploaderId], references: [id])
+  id                String             @id @default(uuid()) @db.Uuid
+  bucket            String
+  objectKey         String             @unique
+  fileName          String
+  contentType       String
+  sizeBytes         BigInt
+  checksum          String?
+  entityType        String?
+  entityId          String?
+  uploaderId        String             @db.Uuid
+  createdAt         DateTime           @default(now())
+  deletedAt         DateTime?
+  uploader          User               @relation("FileUploader", fields: [uploaderId], references: [id])
+  shipmentDocuments ShipmentDocument[]
 
   @@index([entityType, entityId, deletedAt])
 }
 
 model Currency {
   code      String         @id @db.Char(3)
   name      String
   symbol    String
   decimals  Int            @default(2)
   isActive  Boolean        @default(true)
diff --git a/prisma/seed.ts b/prisma/seed.ts
index a09619c..078c389 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -45,33 +45,36 @@ const permissions = [
   "order.create",
   "order.update",
   "payment.read",
   "payment.create",
   "payment.verify",
   "refund.create",
   "finance.profit.read",
   "supplier.read",
   "supplier.create",
   "supplier.update",
+  "supplier.bank.read",
   "purchase.read",
   "purchase.create",
   "purchase.update",
   "purchase.cost.read",
   "inventory.read",
   "inventory.update",
   "quality.read",
   "quality.update",
   "shipment.read",
   "shipment.update",
   "after_sales.read",
+  "after_sales.create",
   "after_sales.update",
   "task.read",
+  "task.create",
   "task.update",
   "report.read",
   "settings.read",
   "settings.update",
   "audit.read",
 ] as const;
 
 const roleDefinitions = [
   {
     code: "SUPER_ADMIN",
@@ -115,38 +118,39 @@ const roleDefinitions = [
   },
   {
     code: "PROCUREMENT",
     name: "Procurement",
     description: "Suppliers and purchasing",
     permissions: permissions.filter(
       (code) =>
         ["product.read", "order.read", "inventory.read"].includes(code) ||
         ["dashboard.", "supplier.", "purchase.", "task."].some((prefix) =>
           code.startsWith(prefix),
-        ),
+        ) || code === "report.read",
     ),
   },
   {
     code: "OPERATIONS",
     name: "Operations",
     description: "Warehouse, quality, shipments and after-sales",
     permissions: permissions.filter(
       (code) =>
         ["product.read", "order.read"].includes(code) ||
         [
           "dashboard.",
           "inventory.",
           "quality.",
           "shipment.",
           "after_sales.",
           "task.",
-        ].some((prefix) => code.startsWith(prefix)),
+        ].some((prefix) => code.startsWith(prefix)) ||
+        code === "report.read",
     ),
   },
 ] as const;
 
 const users = [
   ["admin@atlascrm.dev", "Ada Admin", "SUPER_ADMIN"],
   ["sales.manager@atlascrm.dev", "Marcus Chen", "SALES_MANAGER"],
   ["sales.asia@atlascrm.dev", "Lina Wu", "SALES_REP"],
   ["sales.emea@atlascrm.dev", "Oliver Grant", "SALES_REP"],
   ["finance@atlascrm.dev", "Sofia Patel", "FINANCE"],
@@ -252,33 +256,69 @@ async function main() {
   ] as const) {
     await prisma.currency.upsert({
       where: { code },
       update: { name, symbol, isBase, isActive: true },
       create: { code, name, symbol, isBase },
     });
   }
 
   await prisma.setting.upsert({
     where: { namespace_key: { namespace: "company", key: "profile" } },
-    update: {},
+    update: {
+      value: {
+        name: "Atlas Global Systems",
+        legalName: "Atlas Global Systems Limited",
+        registrationNumber: "HK-ATLAS-2026",
+        address: "Shenzhen / Hong Kong",
+        logoUrl: "https://atlascrm.dev/assets/logo.svg",
+        defaultLocale: "en",
+        baseCurrency: "USD",
+      },
+    },
     create: {
       id: deterministicId(4, 1),
       namespace: "company",
       key: "profile",
       value: {
         name: "Atlas Global Systems",
+        legalName: "Atlas Global Systems Limited",
+        registrationNumber: "HK-ATLAS-2026",
+        address: "Shenzhen / Hong Kong",
+        logoUrl: "https://atlascrm.dev/assets/logo.svg",
         defaultLocale: "en",
         baseCurrency: "USD",
       },
     },
   });
 
+  const practicalSettings = [
+    ["currency", "CNY", { rateToUsd: 0.139, effectiveAt: "2026-07-20T00:00:00.000Z" }],
+    ["currency", "EUR", { rateToUsd: 1.16, effectiveAt: "2026-07-20T00:00:00.000Z" }],
+    ["currency", "GBP", { rateToUsd: 1.34, effectiveAt: "2026-07-20T00:00:00.000Z" }],
+    ["tax", "defaults", { exportRatePercent: 0, domesticRatePercent: 13 }],
+    ["bank", "usd-primary", { bankName: "Atlas Trade Bank", accountName: "Atlas Global Systems Limited", bankAccountNumber: "001234567890", swift: "ATLSHKHH" }],
+    ["template", "quote", { title: "Atlas Quotation", footer: "Thank you for your business.", validityDays: 14 }],
+    ["catalog", "payment-terms", { values: ["100% T/T Before Purchase", "50% Deposit / 50% Before Shipment", "Net 30"] }],
+    ["catalog", "incoterms", { values: ["EXW", "FOB", "CIF", "DAP", "DDP"] }],
+    ["catalog", "statuses", { values: ["ACTIVE", "INACTIVE", "ARCHIVED"] }],
+    ["catalog", "categories", { values: ["Server", "GPU", "Storage", "Networking", "Parts"] }],
+    ["catalog", "sources", { values: ["REFERRAL", "WEB", "TRADE_SHOW", "OUTBOUND", "PARTNER"] }],
+    ["backup", "policy", { schedule: "0 2 * * *", retentionDays: 30 }],
+  ] as const;
+  for (const [namespace, key, value] of practicalSettings) {
+    await prisma.setting.upsert({
+      where: { namespace_key: { namespace, key } },
+      update: { value },
+      create: { namespace, key, value, isSecret: namespace === "bank" },
+    });
+  }
+
   for (const [index, key] of [
     "quote",
     "sales_order",
     "purchase_order",
     "shipment",
     "ticket",
   ].entries()) {
     await prisma.sequence.upsert({
       where: { key },
       update: {},
@@ -886,19 +926,361 @@ async function main() {
             paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
           verifiedAt:
             paymentStatus === "CONFIRMED"
               ? new Date(Date.UTC(2026, 6, 10 + index))
               : null,
           receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
         },
       });
     }
   }
+
+  const supplierNames = ["Shenzhen Compute Supply", "NVIDIA Channel HK", "Pacific Server Parts", "EuroRack Renewed", "Vertex Logistics Hardware"];
+  for (let index = 0; index < supplierNames.length; index += 1) {
+    const supplierId = deterministicId(40, index + 1);
+    await prisma.supplier.upsert({
+      where: { id: supplierId },
+      update: { name: supplierNames[index], status: "ACTIVE", deletedAt: null },
+      create: { id: supplierId, code: `SUP-${String(index + 1).padStart(3, "0")}`, name: supplierNames[index], countryCode: index < 3 ? "CN" : index === 3 ? "DE" : "SG", contactName: `Supplier Contact ${index + 1}`, email: `sales${index + 1}@supplier.example`, phone: `+86-755-${(5000 + index).toString()}` },
+    });
+    await prisma.supplierProduct.upsert({
+      where: {
+        supplierId_productId: {
+          supplierId,
+          productId: deterministicId(20, index + 1),
+        },
+      },
+      update: {
+        supplierSku: `SUP-${index + 1}-ATL-${String(index + 1).padStart(3, "0")}`,
+        leadTimeDays: 5 + index * 2,
+        lastCost: String(3500 + index * 1700),
+        currencyCode: "USD",
+      },
+      create: {
+        supplierId,
+        productId: deterministicId(20, index + 1),
+        supplierSku: `SUP-${index + 1}-ATL-${String(index + 1).padStart(3, "0")}`,
+        leadTimeDays: 5 + index * 2,
+        lastCost: String(3500 + index * 1700),
+        currencyCode: "USD",
+      },
+    });
+  }
+  const warehouse = await prisma.warehouse.upsert({ where: { code: "SZ-01" }, update: { name: "Shenzhen Export Warehouse", deletedAt: null }, create: { id: deterministicId(41, 1), code: "SZ-01", name: "Shenzhen Export Warehouse" } });
+  const location = await prisma.warehouseLocation.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: "A-01" } }, update: { name: "Inbound QC" }, create: { id: deterministicId(42, 1), warehouseId: warehouse.id, code: "A-01", name: "Inbound QC" } });
+  const seededInventorySerials: Array<{ id: string; inventoryItemId: string }> = [];
+  for (let index = 0; index < 3; index += 1) {
+    const inventoryId = deterministicId(43, index + 1);
+    await prisma.inventoryItem.upsert({
+      where: { id: inventoryId },
+      update: { quantityOnHand: 1, quantityReserved: index === 0 ? 1 : 0, deletedAt: null },
+      create: { id: inventoryId, productId: deterministicId(20, index + 1), locationId: location.id, quantityOnHand: 1, quantityReserved: index === 0 ? 1 : 0, unitCostUsd: String(3500 + index * 1700) },
+    });
+    const serial = await prisma.inventorySerial.upsert({
+      where: { serialNumber: `ATLAS-${index + 1}-0001` },
+      update: {
+        inventoryItemId: inventoryId,
+        status: index === 0 ? "RESERVED" : "AVAILABLE",
+        issuedAt: null,
+      },
+      create: {
+        id: deterministicId(47, index + 1),
+        inventoryItemId: inventoryId,
+        serialNumber: `ATLAS-${index + 1}-0001`,
+        status: index === 0 ? "RESERVED" : "AVAILABLE",
+        receivedAt: new Date(Date.UTC(2026, 6, 12)),
+      },
+    });
+    seededInventorySerials.push({ id: serial.id, inventoryItemId: inventoryId });
+    await prisma.qualityInspection.upsert({
+      where: { id: deterministicId(44, index + 1) },
+      update: {
+        inventoryItemId: inventoryId,
+        inventorySerialId: serial.id,
+        inspectorId: deterministicId(3, 7),
+        status: "PASSED",
+        checklist: { serial: true, boot: true, burnIn: true },
+        inspectedAt: new Date(Date.UTC(2026, 6, 13)),
+      },
+      create: {
+        id: deterministicId(44, index + 1),
+        inventoryItemId: inventoryId,
+        inventorySerialId: serial.id,
+        inspectorId: deterministicId(3, 7),
+        status: "PASSED",
+        checklist: { serial: true, boot: true, burnIn: true },
+        inspectedAt: new Date(Date.UTC(2026, 6, 13)),
+      },
+    });
+  }
+  for (let index = 0; index < 2; index += 1) {
+    const poId = deterministicId(45, index + 1);
+    const poItemId = deterministicId(48, index + 1);
+    await prisma.purchaseOrder.upsert({
+      where: { id: poId },
+      update: { supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), status: index === 0 ? "RECEIVED" : "APPROVED", receivedAt: index === 0 ? new Date(Date.UTC(2026, 6, 12)) : null },
+      create: { id: poId, purchaseOrderNumber: `PURCHASE-ORDER-${String(index + 1).padStart(6, "0")}`, supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), buyerId: deterministicId(3, 6), status: index === 0 ? "RECEIVED" : "APPROVED", currencyCode: "USD", exchangeRateToUsd: "1", total: "12000", totalUsd: "12000", expectedAt: new Date(Date.UTC(2026, 7, 1)), receivedAt: index === 0 ? new Date(Date.UTC(2026, 6, 12)) : null },
+    });
+    await prisma.purchaseOrderItem.deleteMany({
+      where: { purchaseOrderId: poId, id: { not: poItemId } },
+    });
+    await prisma.purchaseOrderItem.upsert({
+      where: { id: poItemId },
+      update: {
+        purchaseOrderId: poId,
+        salesOrderItemId: deterministicId(34, index + 1),
+        productId: deterministicId(20, index + 1),
+        description: productNames[index],
+        productSnapshot: {
+          id: deterministicId(20, index + 1),
+          sku: `ATL-${String(index + 1).padStart(3, "0")}`,
+          name: productNames[index],
+          serialized: true,
+        },
+        configurationSnapshot: {
+          variantId: deterministicId(21, index + 1),
+          configurationVersion: 1,
+        },
+        quantity: 1,
+        receivedQuantity: index === 0 ? 1 : 0,
+        unitCost: "12000",
+        lineTotal: "12000",
+      },
+      create: {
+        id: poItemId,
+        purchaseOrderId: poId,
+        salesOrderItemId: deterministicId(34, index + 1),
+        productId: deterministicId(20, index + 1),
+        description: productNames[index],
+        productSnapshot: {
+          id: deterministicId(20, index + 1),
+          sku: `ATL-${String(index + 1).padStart(3, "0")}`,
+          name: productNames[index],
+          serialized: true,
+        },
+        configurationSnapshot: {
+          variantId: deterministicId(21, index + 1),
+          configurationVersion: 1,
+        },
+        quantity: 1,
+        receivedQuantity: index === 0 ? 1 : 0,
+        unitCost: "12000",
+        lineTotal: "12000",
+      },
+    });
+    await prisma.inventoryItem.update({
+      where: { id: deterministicId(43, index + 1) },
+      data: { purchaseOrderItemId: poItemId },
+    });
+  }
+  const shipment = await prisma.shipment.upsert({
+    where: { shipmentNumber: "SHIPMENT-000001" },
+    update: {
+      status: "BOOKED",
+      method: "AIR",
+      carrier: "DHL Global Forwarding",
+      trackingNumber: "DHL-ATLAS-001",
+      origin: "Shenzhen",
+      destination: "Frankfurt",
+    },
+    create: {
+      id: deterministicId(46, 1),
+      shipmentNumber: "SHIPMENT-000001",
+      salesOrderId: deterministicId(33, 1),
+      coordinatorId: deterministicId(3, 8),
+      status: "BOOKED",
+      method: "AIR",
+      carrier: "DHL Global Forwarding",
+      trackingNumber: "DHL-ATLAS-001",
+      origin: "Shenzhen",
+      destination: "Frankfurt",
+    },
+  });
+  const shipmentItem = await prisma.shipmentItem.upsert({
+    where: {
+      shipmentId_salesOrderItemId: {
+        shipmentId: shipment.id,
+        salesOrderItemId: deterministicId(34, 1),
+      },
+    },
+    update: {
+      inventoryItemId: deterministicId(43, 1),
+      quantity: 1,
+    },
+    create: {
+      id: deterministicId(49, 1),
+      shipmentId: shipment.id,
+      salesOrderItemId: deterministicId(34, 1),
+      inventoryItemId: deterministicId(43, 1),
+      quantity: 1,
+    },
+  });
+  await prisma.shipmentSerial.upsert({
+    where: {
+      shipmentItemId_inventorySerialId: {
+        shipmentItemId: shipmentItem.id,
+        inventorySerialId: seededInventorySerials[0].id,
+      },
+    },
+    update: { status: "RESERVED", issuedAt: null, releasedAt: null },
+    create: {
+      id: deterministicId(50, 1),
+      shipmentItemId: shipmentItem.id,
+      inventorySerialId: seededInventorySerials[0].id,
+      status: "RESERVED",
+    },
+  });
+  await prisma.inventoryTransaction.upsert({
+    where: { id: deterministicId(51, 1) },
+    update: {
+      inventoryItemId: deterministicId(43, 1),
+      inventorySerialId: seededInventorySerials[0].id,
+      type: "RESERVATION",
+      quantity: 1,
+      referenceType: "Shipment",
+      referenceId: shipment.id,
+      createdById: deterministicId(3, 8),
+    },
+    create: {
+      id: deterministicId(51, 1),
+      inventoryItemId: deterministicId(43, 1),
+      inventorySerialId: seededInventorySerials[0].id,
+      type: "RESERVATION",
+      quantity: 1,
+      referenceType: "Shipment",
+      referenceId: shipment.id,
+      createdById: deterministicId(3, 8),
+    },
+  });
+  const ticketTypes = [
+    "QUALITY",
+    "DAMAGE",
+    "MISSING_ITEM",
+    "WRONG_ITEM",
+    "TECHNICAL",
+    "WARRANTY",
+    "RETURN",
+    "OTHER",
+  ];
+  for (let index = 0; index < 10; index += 1) {
+    const status = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"][index % 5];
+    await prisma.afterSalesTicket.upsert({
+      where: { id: deterministicId(52, index + 1) },
+      update: {
+        customerId: deterministicId(10, index + 1),
+        salesOrderId: deterministicId(33, index + 1),
+        productId: deterministicId(20, (index % 5) + 1),
+        inventorySerialId: index < 3 ? deterministicId(47, index + 1) : null,
+        assignedToId: deterministicId(3, 9),
+        issueType: ticketTypes[index % ticketTypes.length],
+        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
+        status,
+        solution: ["RESOLVED", "CLOSED"].includes(status)
+          ? "Replacement part supplied and customer acceptance recorded."
+          : null,
+        costAmount: index % 3 === 0 ? String(75 + index * 10) : null,
+        costCurrencyCode: index % 3 === 0 ? "USD" : null,
+        resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
+          ? new Date(Date.UTC(2026, 6, 16 + index))
+          : null,
+        closedAt: status === "CLOSED"
+          ? new Date(Date.UTC(2026, 6, 17 + index))
+          : null,
+        deletedAt: null,
+      },
+      create: {
+        id: deterministicId(52, index + 1),
+        ticketNumber: `TICKET-${String(index + 1).padStart(6, "0")}`,
+        customerId: deterministicId(10, index + 1),
+        salesOrderId: deterministicId(33, index + 1),
+        productId: deterministicId(20, (index % 5) + 1),
+        inventorySerialId: index < 3 ? deterministicId(47, index + 1) : null,
+        assignedToId: deterministicId(3, 9),
+        subject: `After-sales case ${index + 1}`,
+        description: "Customer reported an issue requiring support follow-up.",
+        issueType: ticketTypes[index % ticketTypes.length],
+        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
+        status,
+        solution: ["RESOLVED", "CLOSED"].includes(status)
+          ? "Replacement part supplied and customer acceptance recorded."
+          : null,
+        costAmount: index % 3 === 0 ? String(75 + index * 10) : null,
+        costCurrencyCode: index % 3 === 0 ? "USD" : null,
+        attachments: [],
+        resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
+          ? new Date(Date.UTC(2026, 6, 16 + index))
+          : null,
+        closedAt: status === "CLOSED"
+          ? new Date(Date.UTC(2026, 6, 17 + index))
+          : null,
+      },
+    });
+  }
+  for (let index = 0; index < 20; index += 1) {
+    const status = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"][index % 4] as
+      | "OPEN"
+      | "IN_PROGRESS"
+      | "COMPLETED"
+      | "CANCELLED";
+    const assigneeId = deterministicId(3, (index % 8) + 2);
+    await prisma.task.upsert({
+      where: { id: deterministicId(53, index + 1) },
+      update: {
+        title: `Operations task ${index + 1}`,
+        status,
+        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
+        dueAt: new Date(Date.UTC(2026, 6, 15 + index)),
+        reminderAt: new Date(Date.UTC(2026, 6, 14 + index)),
+        assigneeId,
+        creatorId: deterministicId(3, 2),
+        teamCode: index % 2 ? "SALES" : "OPERATIONS",
+        entityType: index % 2 ? "Customer" : "AfterSalesTicket",
+        entityId: index % 2
+          ? deterministicId(10, (index % 20) + 1)
+          : deterministicId(52, (index % 10) + 1),
+        completedAt: status === "COMPLETED"
+          ? new Date(Date.UTC(2026, 6, 16 + index))
+          : null,
+        deletedAt: null,
+      },
+      create: {
+        id: deterministicId(53, index + 1),
+        title: `Operations task ${index + 1}`,
+        description: "Seeded personal/team action with a practical related record.",
+        status,
+        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
+        dueAt: new Date(Date.UTC(2026, 6, 15 + index)),
+        reminderAt: new Date(Date.UTC(2026, 6, 14 + index)),
+        assigneeId,
+        creatorId: deterministicId(3, 2),
+        teamCode: index % 2 ? "SALES" : "OPERATIONS",
+        entityType: index % 2 ? "Customer" : "AfterSalesTicket",
+        entityId: index % 2
+          ? deterministicId(10, (index % 20) + 1)
+          : deterministicId(52, (index % 10) + 1),
+        completedAt: status === "COMPLETED"
+          ? new Date(Date.UTC(2026, 6, 16 + index))
+          : null,
+      },
+    });
+  }
+  await prisma.sequence.updateMany({
+    where: { key: "ticket", nextValue: { lt: 11 } },
+    data: { nextValue: 11 },
+  });
+  await prisma.sequence.updateMany({
+    where: { key: "purchase_order", nextValue: { lt: 3 } },
+    data: { nextValue: 3 },
+  });
+  await prisma.sequence.updateMany({
+    where: { key: "shipment", nextValue: { lt: 2 } },
+    data: { nextValue: 2 },
+  });
 }
 
 main()
   .then(async () => prisma.$disconnect())
   .catch(async (error) => {
     console.error(error);
     await prisma.$disconnect();
     process.exit(1);
   });
diff --git a/src/app/[locale]/(app)/layout.tsx b/src/app/[locale]/(app)/layout.tsx
index 36be3f7..55eb15a 100644
--- a/src/app/[locale]/(app)/layout.tsx
+++ b/src/app/[locale]/(app)/layout.tsx
@@ -1,26 +1,37 @@
 import { redirect, notFound } from "next/navigation";
 
 import { auth } from "@/auth";
 import { AppShell } from "@/components/app-shell";
 import { isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
+import { getPrisma } from "@/lib/prisma";
 
 export default async function ProtectedLayout({
   children,
   params,
 }: {
   children: React.ReactNode;
   params: Promise<{ locale: string }>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const session = await auth();
   if (!session?.user) redirect(`/${locale}/login`);
-  await currentAuthorizationContext().catch(() => redirect(`/${locale}/login`));
+  const context = await currentAuthorizationContext().catch(() =>
+    redirect(`/${locale}/login`),
+  );
+  const unreadNotifications = await getPrisma().notification.count({
+    where: { userId: context.userId, readAt: null },
+  });
 
   return (
-    <AppShell locale={locale} user={session.user}>
+    <AppShell
+      locale={locale}
+      permissions={context.permissions}
+      unreadNotifications={unreadNotifications}
+      user={session.user}
+    >
       {children}
     </AppShell>
   );
 }
diff --git a/src/app/globals.css b/src/app/globals.css
index fed7426..376469b 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -360,24 +360,61 @@ th {
 .crm-form label {
   display: grid;
   gap: 6px;
   color: var(--muted);
   font-size: 13px;
   font-weight: 650;
 }
 
 .crm-form textarea,
 .crm-form .form-feedback,
-.crm-form .form-actions {
+.crm-form .form-actions,
+.crm-form .workflow-lines,
+.crm-form .checklist-fieldset {
   grid-column: 1 / -1;
 }
 
+.workflow-lines {
+  display: grid;
+  gap: 12px;
+}
+
+.workflow-line {
+  display: grid;
+  grid-template-columns: minmax(180px, 2fr) repeat(2, minmax(100px, 1fr)) auto;
+  align-items: end;
+  gap: 10px;
+  padding: 12px;
+  border: 1px solid var(--border);
+  border-radius: 10px;
+}
+
+.checklist-fieldset {
+  display: flex;
+  flex-wrap: wrap;
+  gap: 12px;
+  padding: 12px;
+  border: 1px solid var(--border);
+  border-radius: 10px;
+}
+
+.checklist-fieldset label {
+  display: flex;
+  grid-auto-flow: column;
+  align-items: center;
+}
+
+.checklist-fieldset input {
+  width: auto;
+  min-height: auto;
+}
+
 .form-feedback {
   margin: 0;
 }
 
 .form-feedback.error {
   color: #bf3030;
 }
 
 .form-feedback.success {
   color: #14753c;
@@ -578,20 +615,98 @@ details summary {
 
 .forecast-card span {
   color: var(--muted);
   font-size: 12px;
 }
 
 .forecast-card strong {
   font-size: 22px;
 }
 
+.view-switcher,
+.export-actions,
+.status-actions {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: 8px;
+}
+
+.view-switcher a {
+  padding: 7px 10px;
+  text-transform: capitalize;
+}
+
+.export-actions {
+  justify-content: flex-end;
+  margin: 12px 0 18px;
+}
+
+.task-kanban {
+  grid-template-columns: repeat(4, minmax(240px, 1fr));
+}
+
+.task-kanban .record-card {
+  margin-bottom: 10px;
+  background: var(--surface);
+}
+
+.task-overdue {
+  border-color: #d92d20;
+}
+
+.calendar-grid {
+  display: grid;
+  grid-template-columns: repeat(7, minmax(180px, 1fr));
+  gap: 10px;
+  overflow-x: auto;
+}
+
+.calendar-day {
+  display: grid;
+  align-content: start;
+  gap: 8px;
+  min-height: 190px;
+  padding: 12px;
+  border: 1px solid var(--border);
+  border-radius: 12px;
+  background: var(--surface);
+}
+
+.notification-unread {
+  border-left: 4px solid var(--accent);
+}
+
+.settings-grid {
+  grid-template-columns: repeat(2, minmax(0, 1fr));
+}
+
+.setting-editor,
+.activity-list {
+  display: grid;
+  gap: 10px;
+}
+
+.setting-editor textarea,
+.record-card pre,
+.activity-list pre {
+  max-width: 100%;
+  overflow: auto;
+  padding: 12px;
+  border: 1px solid var(--border);
+  border-radius: 9px;
+  background: var(--background);
+  color: var(--foreground);
+  font-family: ui-monospace, "Cascadia Code", monospace;
+  font-size: 12px;
+}
+
 .bar-chart,
 .distribution-list {
   display: grid;
   gap: 11px;
   padding: 0;
 }
 
 .bar-row {
   display: grid;
   grid-template-columns: 110px 1fr 36px;
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 14dd4a4..ee8341a 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -1,56 +1,97 @@
 import Link from "next/link";
 
 import { signOut } from "@/auth";
 import { ThemeToggle } from "@/components/theme-toggle";
 import type { Locale } from "@/i18n/dictionaries";
 import { getDictionary } from "@/i18n/dictionaries";
 
 export function AppShell({
   locale,
   user,
+  permissions,
+  unreadNotifications,
   children,
 }: {
   locale: Locale;
   user: { name?: string | null; email?: string | null };
+  permissions: readonly string[];
+  unreadNotifications: number;
   children: React.ReactNode;
 }) {
   const dictionary = getDictionary(locale);
   const nav = [
     ["dashboard", "D", dictionary.nav.dashboard],
     ["leads", "L", dictionary.nav.leads],
     ["customers", "C", dictionary.nav.customers],
     ["opportunities", "O", dictionary.nav.opportunities],
     ["products", "P", locale === "zh" ? "产品" : "Products"],
     ["quotes", "Q", locale === "zh" ? "报价" : "Quotes"],
     ["orders", "S", locale === "zh" ? "订单" : "Orders"],
+    ["suppliers", "V", locale === "zh" ? "供应商" : "Suppliers"],
+    ["purchase-orders", "B", locale === "zh" ? "采购订单" : "Purchase orders"],
+    ["inventory", "I", locale === "zh" ? "库存" : "Inventory"],
+    ["inspections", "Q", locale === "zh" ? "质检" : "Quality"],
+    ["shipments", "H", locale === "zh" ? "物流" : "Shipments"],
+    ["tickets", "A", locale === "zh" ? "售后" : "After-sales"],
+    ["tasks", "T", locale === "zh" ? "任务" : "Tasks"],
+    ["notifications", "N", locale === "zh" ? "通知" : "Notifications"],
+    ["reports", "X", locale === "zh" ? "报表" : "Reports"],
+    ["settings", "G", locale === "zh" ? "设置" : "Settings"],
+    ["activity-logs", "J", locale === "zh" ? "活动日志" : "Activity logs"],
     ["users", "U", dictionary.nav.users],
     ["roles", "R", dictionary.nav.roles],
   ] as const;
+  const permissionByPath: Record<string, string> = {
+    dashboard: "dashboard.read",
+    leads: "lead.read",
+    customers: "customer.read",
+    opportunities: "opportunity.read",
+    products: "product.read",
+    quotes: "quote.read",
+    orders: "order.read",
+    suppliers: "supplier.read",
+    "purchase-orders": "purchase.read",
+    inventory: "inventory.read",
+    inspections: "quality.read",
+    shipments: "shipment.read",
+    tickets: "after_sales.read",
+    tasks: "task.read",
+    reports: "report.read",
+    settings: "settings.read",
+    "activity-logs": "audit.read",
+    users: "user.read",
+    roles: "role.read",
+  };
+  const visibleNav = nav.filter(
+    ([path]) =>
+      permissions.includes("*") ||
+      permissions.includes(permissionByPath[path]),
+  );
   const targetLocale = locale === "en" ? "zh" : "en";
   const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }
 
   return (
     <div className="app-grid">
       <aside className="sidebar">
         <Link className="brand" href={`/${locale}/dashboard`}>
           <span className="brand-mark">A</span>
           <span>{dictionary.appName}</span>
         </Link>
         <nav aria-label="Primary navigation">
           <div className="nav-label">{dictionary.nav.workspace}</div>
-          {nav.map(([path, icon, label]) => (
+          {visibleNav.map(([path, icon, label]) => (
             <Link
               key={path}
               className="nav-link"
               href={`/${locale}/${path}`}
             >
               <span aria-hidden="true">{icon}</span>
               <span>{label}</span>
             </Link>
           ))}
         </nav>
@@ -68,24 +109,24 @@ export function AppShell({
               placeholder={dictionary.search.placeholder}
               name="q"
               type="search"
               required
             />
             <button type="submit">{dictionary.search.submit}</button>
           </form>
           <div className="top-actions">
             <Link
               className="icon-button notification-link"
-              href={`/${locale}/dashboard#notifications`}
+              href={`/${locale}/notifications`}
               aria-label={dictionary.notificationsLabel}
             >
-              !
+              {unreadNotifications || "!"}
             </Link>
             <Link
               className="icon-button"
               href={`/${targetLocale}/dashboard`}
               aria-label={dictionary.languageSwitch}
             >
               {targetDictionary.languageName}
             </Link>
             <ThemeToggle label={dictionary.themeLabel} />
             <form action={logout}>
diff --git a/src/worker.ts b/src/worker.ts
index e92a897..d9cb491 100644
--- a/src/worker.ts
+++ b/src/worker.ts
@@ -1,19 +1,33 @@
 import { run, type TaskList } from "graphile-worker";
 
+import { PrismaReminderRepository } from "@/modules/management/prisma-reminder-repository";
+import { processReminderCandidates } from "@/modules/management/reminders";
+
 const connectionString = process.env.DATABASE_URL;
 if (!connectionString) throw new Error("DATABASE_URL is required");
 
 const taskList: TaskList = {
   health_check: async (_payload, helpers) => {
     helpers.logger.info("Background worker health check completed");
   },
+  generate_management_reminders: async (_payload, helpers) => {
+    const result = await processReminderCandidates(
+      new PrismaReminderRepository(),
+    );
+    helpers.logger.info(
+      `Management reminders scanned=${result.scanned} created=${result.created}`,
+    );
+  },
 };
 
 const runner = await run({
   connectionString,
   concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
   pollInterval: 1000,
+  crontab:
+    process.env.WORKER_CRONTAB ??
+    "*/15 * * * * generate_management_reminders",
   taskList,
 });
 
 await runner.promise;

## New Task 5 files

diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720030000_management_closeout\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720030000_management_closeout\\migration.sql"
new file mode 100644
index 0000000..b765e05
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720030000_management_closeout\\migration.sql"
@@ -0,0 +1,35 @@
+ALTER TABLE "AfterSalesTicket"
+  RENAME COLUMN "resolution" TO "solution";
+
+ALTER TABLE "AfterSalesTicket"
+  ADD COLUMN "productId" UUID,
+  ADD COLUMN "inventorySerialId" UUID,
+  ADD COLUMN "issueType" TEXT NOT NULL DEFAULT 'OTHER',
+  ADD COLUMN "costAmount" DECIMAL(19,4),
+  ADD COLUMN "costCurrencyCode" TEXT,
+  ADD COLUMN "attachments" JSONB,
+  ADD COLUMN "resolvedAt" TIMESTAMP(3);
+
+ALTER TABLE "AfterSalesTicket"
+  ADD CONSTRAINT "AfterSalesTicket_productId_fkey"
+    FOREIGN KEY ("productId") REFERENCES "Product"("id")
+    ON DELETE SET NULL ON UPDATE CASCADE,
+  ADD CONSTRAINT "AfterSalesTicket_inventorySerialId_fkey"
+    FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id")
+    ON DELETE SET NULL ON UPDATE CASCADE;
+
+CREATE INDEX "AfterSalesTicket_salesOrderId_idx" ON "AfterSalesTicket"("salesOrderId");
+CREATE INDEX "AfterSalesTicket_productId_idx" ON "AfterSalesTicket"("productId");
+CREATE INDEX "AfterSalesTicket_inventorySerialId_idx" ON "AfterSalesTicket"("inventorySerialId");
+
+ALTER TABLE "Task"
+  ADD COLUMN "reminderAt" TIMESTAMP(3),
+  ADD COLUMN "teamCode" TEXT;
+
+ALTER TABLE "Notification"
+  ADD COLUMN "entityType" TEXT,
+  ADD COLUMN "entityId" TEXT,
+  ADD COLUMN "dedupeKey" TEXT;
+
+CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
+CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.test.ts"
new file mode 100644
index 0000000..aca8019
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.test.ts"
@@ -0,0 +1,65 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertTaskTransition,
+  assertTicketTransition,
+  isTaskOverdue,
+  preserveMaskedValues,
+  redactSensitiveValues,
+} from "@/modules/management/management-domain";
+
+describe("management domain", () => {
+  it("allows the documented ticket lifecycle and rejects reopening a closed ticket", () => {
+    expect(() => assertTicketTransition("OPEN", "IN_PROGRESS")).not.toThrow();
+    expect(() => assertTicketTransition("IN_PROGRESS", "WAITING_CUSTOMER")).not.toThrow();
+    expect(() => assertTicketTransition("WAITING_CUSTOMER", "RESOLVED")).not.toThrow();
+    expect(() => assertTicketTransition("RESOLVED", "CLOSED")).not.toThrow();
+    expect(() => assertTicketTransition("CLOSED", "OPEN")).toThrowError(
+      expect.objectContaining({ code: "INVALID_TICKET_TRANSITION", status: 409 }),
+    );
+  });
+
+  it("marks only unfinished past-due tasks overdue", () => {
+    const now = new Date("2026-07-20T12:00:00Z");
+    expect(isTaskOverdue({ status: "OPEN", dueAt: new Date("2026-07-20T11:59:59Z") }, now)).toBe(true);
+    expect(isTaskOverdue({ status: "COMPLETED", dueAt: new Date("2026-07-19T00:00:00Z") }, now)).toBe(false);
+    expect(isTaskOverdue({ status: "OPEN", dueAt: null }, now)).toBe(false);
+  });
+
+  it("keeps completed and cancelled tasks terminal", () => {
+    expect(() => assertTaskTransition("OPEN", "IN_PROGRESS")).not.toThrow();
+    expect(() => assertTaskTransition("IN_PROGRESS", "COMPLETED")).not.toThrow();
+    expect(() => assertTaskTransition("COMPLETED", "OPEN")).toThrowError(
+      expect.objectContaining({ code: "INVALID_TASK_TRANSITION", status: 409 }),
+    );
+    expect(() => assertTaskTransition("CANCELLED", "IN_PROGRESS")).toThrowError(
+      expect.objectContaining({ code: "INVALID_TASK_TRANSITION", status: 409 }),
+    );
+  });
+
+  it("recursively redacts passwords, secrets, tokens, and bank accounts", () => {
+    expect(
+      redactSensitiveValues({
+        company: "Atlas",
+        passwordHash: "argon",
+        nested: { authToken: "token", bankAccountNumber: "123456789" },
+      }),
+    ).toEqual({
+      company: "Atlas",
+      passwordHash: "[REDACTED]",
+      nested: { authToken: "[REDACTED]", bankAccountNumber: "*****6789" },
+    });
+  });
+
+  it("does not replace stored secrets with their masked presentation", () => {
+    expect(
+      preserveMaskedValues(
+        { bankAccountNumber: "********7890", bankName: "New bank" },
+        { bankAccountNumber: "001234567890", bankName: "Old bank" },
+      ),
+    ).toEqual({
+      bankAccountNumber: "001234567890",
+      bankName: "New bank",
+    });
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.ts"
new file mode 100644
index 0000000..753fdcf
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-domain.ts"
@@ -0,0 +1,127 @@
+import { DomainError } from "@/lib/errors";
+
+export const TICKET_STATUSES = [
+  "OPEN",
+  "IN_PROGRESS",
+  "WAITING_CUSTOMER",
+  "RESOLVED",
+  "CLOSED",
+] as const;
+
+export type TicketStatus = (typeof TICKET_STATUSES)[number];
+
+const ticketTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
+  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
+  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
+  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
+  RESOLVED: ["IN_PROGRESS", "CLOSED"],
+  CLOSED: [],
+};
+
+export function assertTicketTransition(from: TicketStatus, to: TicketStatus) {
+  if (!ticketTransitions[from].includes(to)) {
+    throw new DomainError(
+      "INVALID_TICKET_TRANSITION",
+      `Ticket cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function isTaskOverdue(
+  task: { status: string; dueAt: Date | null },
+  now = new Date(),
+) {
+  return (
+    task.dueAt !== null &&
+    task.dueAt < now &&
+    !["COMPLETED", "CANCELLED"].includes(task.status)
+  );
+}
+
+export type TaskWorkflowStatus =
+  | "OPEN"
+  | "IN_PROGRESS"
+  | "COMPLETED"
+  | "CANCELLED";
+
+const taskTransitions: Record<
+  TaskWorkflowStatus,
+  readonly TaskWorkflowStatus[]
+> = {
+  OPEN: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
+  IN_PROGRESS: ["OPEN", "COMPLETED", "CANCELLED"],
+  COMPLETED: [],
+  CANCELLED: [],
+};
+
+export function assertTaskTransition(
+  from: TaskWorkflowStatus,
+  to: TaskWorkflowStatus,
+) {
+  if (!taskTransitions[from].includes(to)) {
+    throw new DomainError(
+      "INVALID_TASK_TRANSITION",
+      `Task cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+const sensitiveKey = /(password|secret|token|api.?key|private.?key)/i;
+const bankKey = /(bank.?account|account.?number)/i;
+
+function maskAccount(value: unknown) {
+  const text = String(value);
+  return `${"*".repeat(Math.max(4, text.length - 4))}${text.slice(-4)}`;
+}
+
+export function redactSensitiveValues(value: unknown): unknown {
+  if (Array.isArray(value)) return value.map(redactSensitiveValues);
+  if (!value || typeof value !== "object") return value;
+
+  return Object.fromEntries(
+    Object.entries(value).map(([key, nested]) => {
+      if (sensitiveKey.test(key)) return [key, "[REDACTED]"];
+      if (bankKey.test(key) && nested !== null) return [key, maskAccount(nested)];
+      return [key, redactSensitiveValues(nested)];
+    }),
+  );
+}
+
+export function preserveMaskedValues(
+  next: Record<string, unknown>,
+  current: Record<string, unknown>,
+): Record<string, unknown> {
+  return Object.fromEntries(
+    Object.entries(next).map(([key, value]) => {
+      const previous = current[key];
+      const isMaskedSecret =
+        sensitiveKey.test(key) && value === "[REDACTED]";
+      const isMaskedAccount =
+        bankKey.test(key) &&
+        typeof value === "string" &&
+        /^\*+\S{4}$/.test(value);
+      if ((isMaskedSecret || isMaskedAccount) && previous !== undefined) {
+        return [key, previous];
+      }
+      if (
+        value &&
+        previous &&
+        typeof value === "object" &&
+        typeof previous === "object" &&
+        !Array.isArray(value) &&
+        !Array.isArray(previous)
+      ) {
+        return [
+          key,
+          preserveMaskedValues(
+            value as Record<string, unknown>,
+            previous as Record<string, unknown>,
+          ),
+        ];
+      }
+      return [key, value];
+    }),
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.test.ts"
new file mode 100644
index 0000000..81143fb
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.test.ts"
@@ -0,0 +1,36 @@
+import { describe, expect, it } from "vitest";
+
+import { settingsUpdateSchema, ticketSchema } from "@/modules/management/management-schemas";
+
+describe("management schemas", () => {
+  it("accepts supported ticket relations and rejects negative costs", () => {
+    const base = {
+      customerId: "00000000-0000-4000-8000-000000000001",
+      subject: "Damaged chassis",
+      description: "Panel bent on arrival",
+      issueType: "DAMAGE",
+      priority: "HIGH",
+      costAmount: "-1",
+      costCurrencyCode: "USD",
+    };
+    expect(ticketSchema.safeParse(base).success).toBe(false);
+    expect(ticketSchema.safeParse({ ...base, costAmount: "12.50" }).success).toBe(true);
+  });
+
+  it("requires a valid company profile and positive manual rates", () => {
+    expect(
+      settingsUpdateSchema.safeParse({
+        namespace: "currency",
+        key: "EUR",
+        value: { rateToUsd: 0 },
+      }).success,
+    ).toBe(false);
+    expect(
+      settingsUpdateSchema.safeParse({
+        namespace: "company",
+        key: "profile",
+        value: { name: "Atlas Global", baseCurrency: "USD", defaultLocale: "en" },
+      }).success,
+    ).toBe(true);
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.ts"
new file mode 100644
index 0000000..1357a84
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-schemas.ts"
@@ -0,0 +1,165 @@
+import { z } from "zod";
+
+import { TICKET_STATUSES } from "@/modules/management/management-domain";
+
+const uuid = z.string().uuid();
+const optionalUuid = uuid.nullable().optional();
+const currencyCode = z
+  .string()
+  .trim()
+  .length(3)
+  .transform((value) => value.toUpperCase());
+const money = z
+  .string()
+  .regex(/^\d+(?:\.\d{1,4})?$/)
+  .refine((value) => Number(value) >= 0, "Amount must be nonnegative");
+
+export const ticketSchema = z.object({
+  customerId: uuid,
+  salesOrderId: optionalUuid,
+  productId: optionalUuid,
+  inventorySerialId: optionalUuid,
+  assignedToId: optionalUuid,
+  subject: z.string().trim().min(1).max(300),
+  description: z.string().trim().min(1).max(10000),
+  issueType: z.enum([
+    "QUALITY",
+    "DAMAGE",
+    "MISSING_ITEM",
+    "WRONG_ITEM",
+    "TECHNICAL",
+    "WARRANTY",
+    "RETURN",
+    "OTHER",
+  ]),
+  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
+  attachmentIds: z.array(uuid).max(20).optional(),
+  solution: z.string().trim().max(10000).nullable().optional(),
+  costAmount: money.nullable().optional(),
+  costCurrencyCode: currencyCode.nullable().optional(),
+});
+
+export const ticketUpdateSchema = ticketSchema
+  .partial()
+  .extend({
+    status: z.enum(TICKET_STATUSES).optional(),
+    expectedVersion: z.number().int().positive(),
+  })
+  .refine(
+    (input) =>
+      input.status !== "CLOSED" ||
+      Boolean(input.solution?.trim()),
+    { message: "A solution is required to close a ticket", path: ["solution"] },
+  );
+
+export const taskSchema = z.object({
+  title: z.string().trim().min(1).max(300),
+  description: z.string().trim().max(10000).nullable().optional(),
+  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
+  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
+  assigneeId: uuid,
+  teamCode: z.string().trim().max(100).nullable().optional(),
+  entityType: z.string().trim().max(100).nullable().optional(),
+  entityId: z.string().trim().max(100).nullable().optional(),
+  dueAt: z.coerce.date().nullable().optional(),
+  reminderAt: z.coerce.date().nullable().optional(),
+});
+
+export const taskUpdateSchema = taskSchema.partial().extend({
+  expectedVersion: z.number().int().positive(),
+});
+
+const settingsValue = z.record(z.string(), z.json());
+
+export const settingsUpdateSchema = z
+  .object({
+    namespace: z.enum([
+      "company",
+      "currency",
+      "tax",
+      "bank",
+      "template",
+      "catalog",
+      "backup",
+    ]),
+    key: z.string().trim().min(1).max(100),
+    value: settingsValue,
+    expectedVersion: z.number().int().positive().optional(),
+    isSecret: z.boolean().optional(),
+  })
+  .superRefine((input, context) => {
+    if (input.namespace === "company" && input.key === "profile") {
+      const profile = z.object({
+        name: z.string().trim().min(1),
+        baseCurrency: currencyCode,
+        defaultLocale: z.enum(["en", "zh"]),
+        logoUrl: z.string().url().nullable().optional(),
+        legalName: z.string().nullable().optional(),
+        registrationNumber: z.string().nullable().optional(),
+        address: z.string().nullable().optional(),
+      });
+      const result = profile.safeParse(input.value);
+      if (!result.success) {
+        for (const issue of result.error.issues) {
+          context.addIssue({
+            code: "custom",
+            message: issue.message,
+            path: issue.path,
+          });
+        }
+      }
+    }
+    if (input.namespace === "currency") {
+      const result = z
+        .object({ rateToUsd: z.number().positive(), effectiveAt: z.string().datetime().optional() })
+        .safeParse(input.value);
+      if (!result.success) {
+        for (const issue of result.error.issues) {
+          context.addIssue({
+            code: "custom",
+            message: issue.message,
+            path: issue.path,
+          });
+        }
+      }
+    }
+    if (input.namespace === "backup") {
+      const result = z
+        .object({
+          retentionDays: z.number().int().min(1).max(3650),
+          schedule: z.string().trim().min(1),
+        })
+        .safeParse(input.value);
+      if (!result.success) {
+        for (const issue of result.error.issues) {
+          context.addIssue({
+            code: "custom",
+            message: issue.message,
+            path: issue.path,
+          });
+        }
+      }
+    }
+  });
+
+export const reportQuerySchema = z.object({
+  type: z.enum([
+    "sales",
+    "collections",
+    "receivables",
+    "customers",
+    "markets",
+    "products",
+    "representatives",
+    "suppliers",
+    "purchasing",
+    "logistics",
+    "after-sales",
+    "profit",
+    "conversion",
+  ]),
+  format: z.enum(["json", "csv", "excel", "pdf"]).default("json"),
+  from: z.coerce.date().optional(),
+  to: z.coerce.date().optional(),
+  ownerId: uuid.optional(),
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-service.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-service.ts"
new file mode 100644
index 0000000..79a6edc
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\management-service.ts"
@@ -0,0 +1,793 @@
+import Decimal from "decimal.js";
+
+import type { Prisma } from "@/generated/prisma/client";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import {
+  can,
+  hasGlobalOwnershipScope,
+  type AuthorizationContext,
+} from "@/lib/rbac";
+import {
+  assertTaskTransition,
+  assertTicketTransition,
+  isTaskOverdue,
+  preserveMaskedValues,
+  redactSensitiveValues,
+  type TicketStatus,
+  type TaskWorkflowStatus,
+} from "@/modules/management/management-domain";
+import type {
+  settingsUpdateSchema,
+  taskSchema,
+  taskUpdateSchema,
+  ticketSchema,
+  ticketUpdateSchema,
+} from "@/modules/management/management-schemas";
+import {
+  buildReportRows,
+  groupReportRows,
+  reportScope,
+} from "@/modules/management/reporting";
+import type { z } from "zod";
+
+type Transaction = Prisma.TransactionClient;
+type TicketInput = z.infer<typeof ticketSchema>;
+type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
+type TaskInput = z.infer<typeof taskSchema>;
+type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
+type SettingInput = z.infer<typeof settingsUpdateSchema>;
+
+async function nextNumber(transaction: Transaction, key: string) {
+  const sequence = await transaction.sequence.update({
+    where: { key },
+    data: { nextValue: { increment: 1 }, version: { increment: 1 } },
+  });
+  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1))
+    .toString()
+    .padStart(sequence.padding, "0")}`;
+}
+
+async function assertAttachments(
+  transaction: Transaction,
+  attachmentIds: readonly string[] | undefined,
+) {
+  if (!attachmentIds?.length) return;
+  const ids = [...new Set(attachmentIds)];
+  const count = await transaction.fileAsset.count({
+    where: { id: { in: ids }, deletedAt: null },
+  });
+  if (count !== ids.length) {
+    throw new DomainError(
+      "ATTACHMENT_NOT_FOUND",
+      "One or more attachments are unavailable",
+      409,
+    );
+  }
+}
+
+function taskScope(context: AuthorizationContext) {
+  return hasGlobalOwnershipScope(context, "task.read")
+    ? {}
+    : {
+        OR: [{ assigneeId: context.userId }, { creatorId: context.userId }],
+      };
+}
+
+export class ManagementService {
+  listTickets() {
+    return getPrisma().afterSalesTicket.findMany({
+      where: { deletedAt: null },
+      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
+      include: {
+        customer: { select: { id: true, companyName: true } },
+        salesOrder: { select: { id: true, orderNumber: true } },
+        product: { select: { id: true, sku: true, name: true } },
+        inventorySerial: { select: { id: true, serialNumber: true } },
+        assignedTo: { select: { id: true, name: true } },
+      },
+    });
+  }
+
+  createTicket(context: AuthorizationContext, input: TicketInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      await assertAttachments(transaction, input.attachmentIds);
+      const row = await transaction.afterSalesTicket.create({
+        data: {
+          ticketNumber: await nextNumber(transaction, "ticket"),
+          customerId: input.customerId,
+          salesOrderId: input.salesOrderId,
+          productId: input.productId,
+          inventorySerialId: input.inventorySerialId,
+          assignedToId: input.assignedToId,
+          subject: input.subject,
+          description: input.description,
+          issueType: input.issueType,
+          priority: input.priority,
+          solution: input.solution,
+          costAmount: input.costAmount,
+          costCurrencyCode: input.costCurrencyCode,
+          attachments: input.attachmentIds ?? [],
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "after_sales.create",
+        entityType: "AfterSalesTicket",
+        entityId: row.id,
+        after: {
+          ticketNumber: row.ticketNumber,
+          issueType: row.issueType,
+          priority: row.priority,
+          assignedToId: row.assignedToId,
+        },
+      });
+      return row;
+    });
+  }
+
+  updateTicket(
+    context: AuthorizationContext,
+    id: string,
+    input: TicketUpdateInput,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.afterSalesTicket.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!current) {
+        throw new DomainError("TICKET_NOT_FOUND", "Ticket not found", 404);
+      }
+      if (current.version !== input.expectedVersion) {
+        throw new DomainError(
+          "TICKET_CONFLICT",
+          "Ticket changed; refresh and retry",
+          409,
+        );
+      }
+      if (input.status && input.status !== current.status) {
+        assertTicketTransition(current.status as TicketStatus, input.status);
+      }
+      await assertAttachments(transaction, input.attachmentIds);
+      const { expectedVersion: _, attachmentIds, ...changes } = input;
+      void _;
+      const status = input.status ?? current.status;
+      const changed = await transaction.afterSalesTicket.updateMany({
+        where: { id, version: current.version, deletedAt: null },
+        data: {
+          ...changes,
+          attachments: attachmentIds ?? undefined,
+          resolvedAt:
+            status === "RESOLVED" && current.status !== "RESOLVED"
+              ? new Date()
+              : undefined,
+          closedAt:
+            status === "CLOSED" && current.status !== "CLOSED"
+              ? new Date()
+              : undefined,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "TICKET_CONFLICT",
+          "Ticket changed; refresh and retry",
+          409,
+        );
+      }
+      const updated = await transaction.afterSalesTicket.findUniqueOrThrow({
+        where: { id },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "after_sales.update",
+        entityType: "AfterSalesTicket",
+        entityId: id,
+        before: { status: current.status, version: current.version },
+        after: {
+          status: updated.status,
+          version: updated.version,
+          assignedToId: updated.assignedToId,
+          costAmount: updated.costAmount?.toString() ?? null,
+        },
+      });
+      return updated;
+    });
+  }
+
+  async ticketOptions() {
+    const prisma = getPrisma();
+    const [customers, orders, products, serials, users] = await Promise.all([
+      prisma.customer.findMany({
+        where: { deletedAt: null },
+        orderBy: { companyName: "asc" },
+        select: { id: true, companyName: true },
+      }),
+      prisma.salesOrder.findMany({
+        where: { deletedAt: null },
+        orderBy: { orderNumber: "desc" },
+        select: { id: true, orderNumber: true },
+      }),
+      prisma.product.findMany({
+        where: { deletedAt: null },
+        orderBy: { sku: "asc" },
+        select: { id: true, sku: true, name: true },
+      }),
+      prisma.inventorySerial.findMany({
+        orderBy: { serialNumber: "asc" },
+        select: { id: true, serialNumber: true },
+      }),
+      prisma.user.findMany({
+        where: { status: "ACTIVE", deletedAt: null },
+        orderBy: { name: "asc" },
+        select: { id: true, name: true },
+      }),
+    ]);
+    return { customers, orders, products, serials, users };
+  }
+
+  async listTasks(context: AuthorizationContext) {
+    const rows = await getPrisma().task.findMany({
+      where: { deletedAt: null, ...taskScope(context) },
+      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
+      include: {
+        assignee: { select: { id: true, name: true } },
+        creator: { select: { id: true, name: true } },
+      },
+    });
+    const now = new Date();
+    return rows.map((row) => ({ ...row, overdue: isTaskOverdue(row, now) }));
+  }
+
+  createTask(context: AuthorizationContext, input: TaskInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.task.create({
+        data: { ...input, creatorId: context.userId },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "task.create",
+        entityType: "Task",
+        entityId: row.id,
+        after: {
+          title: row.title,
+          assigneeId: row.assigneeId,
+          dueAt: row.dueAt?.toISOString() ?? null,
+        },
+      });
+      if (row.assigneeId !== context.userId) {
+        await transaction.notification.create({
+          data: {
+            userId: row.assigneeId,
+            type: "TASK_ASSIGNED",
+            title: "Task assigned",
+            message: row.title,
+            link: "/en/tasks",
+            entityType: "Task",
+            entityId: row.id,
+            dedupeKey: `TASK_ASSIGNED:${row.id}:${row.assigneeId}`,
+          },
+        });
+      }
+      return row;
+    });
+  }
+
+  updateTask(
+    context: AuthorizationContext,
+    id: string,
+    input: TaskUpdateInput,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.task.findFirst({
+        where: { id, deletedAt: null, ...taskScope(context) },
+      });
+      if (!current) {
+        throw new DomainError("TASK_NOT_FOUND", "Task not found", 404);
+      }
+      if (current.version !== input.expectedVersion) {
+        throw new DomainError(
+          "TASK_CONFLICT",
+          "Task changed; refresh and retry",
+          409,
+        );
+      }
+      if (input.status && input.status !== current.status) {
+        assertTaskTransition(
+          current.status as TaskWorkflowStatus,
+          input.status,
+        );
+      }
+      const { expectedVersion: _, ...changes } = input;
+      void _;
+      const changed = await transaction.task.updateMany({
+        where: { id, version: current.version, deletedAt: null },
+        data: {
+          ...changes,
+          completedAt:
+            changes.status === "COMPLETED" ? new Date() : undefined,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "TASK_CONFLICT",
+          "Task changed; refresh and retry",
+          409,
+        );
+      }
+      const updated = await transaction.task.findUniqueOrThrow({ where: { id } });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "task.update",
+        entityType: "Task",
+        entityId: id,
+        before: { status: current.status, version: current.version },
+        after: { status: updated.status, version: updated.version },
+      });
+      return { ...updated, overdue: isTaskOverdue(updated) };
+    });
+  }
+
+  listTaskAssignees() {
+    return getPrisma().user.findMany({
+      where: { status: "ACTIVE", deletedAt: null },
+      orderBy: { name: "asc" },
+      select: { id: true, name: true },
+    });
+  }
+
+  async listNotifications(context: AuthorizationContext) {
+    const prisma = getPrisma();
+    const [items, unreadCount] = await Promise.all([
+      prisma.notification.findMany({
+        where: { userId: context.userId },
+        orderBy: { createdAt: "desc" },
+        take: 100,
+      }),
+      prisma.notification.count({
+        where: { userId: context.userId, readAt: null },
+      }),
+    ]);
+    return { items, unreadCount };
+  }
+
+  markNotificationsRead(context: AuthorizationContext, ids?: string[]) {
+    return getPrisma().notification.updateMany({
+      where: {
+        userId: context.userId,
+        readAt: null,
+        ...(ids?.length ? { id: { in: ids } } : {}),
+      },
+      data: { readAt: new Date() },
+    });
+  }
+
+  async report(
+    context: AuthorizationContext,
+    input: {
+      type: string;
+      from?: Date;
+      to?: Date;
+      ownerId?: string;
+    },
+  ) {
+    const scope = reportScope(context);
+    if (
+      input.type === "profit" &&
+      !can(context, "finance.profit.read")
+    ) {
+      throw new DomainError(
+        "PERMISSION_DENIED",
+        "Profit reporting requires finance.profit.read",
+        403,
+      );
+    }
+    const rows = await getPrisma().salesOrder.findMany({
+      where: {
+        deletedAt: null,
+        ...scope,
+        ...(input.ownerId && !("ownerId" in scope)
+          ? { ownerId: input.ownerId }
+          : {}),
+        ...(input.from || input.to
+          ? {
+              createdAt: {
+                ...(input.from ? { gte: input.from } : {}),
+                ...(input.to ? { lte: input.to } : {}),
+              },
+            }
+          : {}),
+      },
+      orderBy: { createdAt: "desc" },
+      include: {
+        customer: { select: { companyName: true, countryCode: true } },
+        owner: { select: { name: true } },
+        payments: {
+          where: { status: "CONFIRMED", deletedAt: null },
+          select: { amountUsd: true },
+        },
+        refunds: {
+          where: { refundedAt: { not: null }, deletedAt: null },
+          select: { amountUsd: true },
+        },
+        costs: {
+          where: { deletedAt: null },
+          select: { amountUsd: true },
+        },
+        items: {
+          select: {
+            quantity: true,
+            lineTotal: true,
+            description: true,
+            product: { select: { sku: true, name: true } },
+          },
+        },
+      },
+    });
+    const reportRows = buildReportRows(
+      rows.map((row) => ({
+        orderNumber: row.orderNumber,
+        customer: row.customer.companyName,
+        owner: row.owner.name,
+        market: row.customer.countryCode,
+        totalUsd: row.totalUsd.toString(),
+        collectedUsd: row.payments
+          .reduce(
+            (sum, payment) => sum.plus(payment.amountUsd.toString()),
+            new Decimal(0),
+          )
+          .minus(
+            row.refunds.reduce(
+              (sum, refund) => sum.plus(refund.amountUsd.toString()),
+              new Decimal(0),
+            ),
+          )
+          .toString(),
+        costUsd: new Decimal(row.actualCostUsd.toString())
+          .plus(
+            row.costs.reduce(
+              (sum, cost) => sum.plus(cost.amountUsd.toString()),
+              new Decimal(0),
+            ),
+          )
+          .toString(),
+      })),
+      context,
+    );
+    let rowsForExport: Array<Record<string, string | number>> = reportRows.map(
+      (row) => ({ ...row }),
+    );
+    if (input.type === "customers") {
+      rowsForExport = groupReportRows(reportRows, "customer");
+    } else if (input.type === "markets") {
+      rowsForExport = groupReportRows(reportRows, "market");
+    } else if (input.type === "representatives") {
+      rowsForExport = groupReportRows(reportRows, "owner");
+    } else if (input.type === "products") {
+      const products = new Map<
+        string,
+        { product: string; units: number; salesUsd: Decimal }
+      >();
+      for (const order of rows) {
+        for (const item of order.items) {
+          const product =
+            item.product
+              ? `${item.product.sku} · ${item.product.name}`
+              : item.description;
+          const current = products.get(product) ?? {
+            product,
+            units: 0,
+            salesUsd: new Decimal(0),
+          };
+          current.units += item.quantity;
+          current.salesUsd = current.salesUsd.plus(item.lineTotal.toString());
+          products.set(product, current);
+        }
+      }
+      rowsForExport = [...products.values()].map((row) => ({
+        product: row.product,
+        units: row.units,
+        salesUsd: row.salesUsd.toFixed(4),
+      }));
+    } else if (["suppliers", "purchasing"].includes(input.type)) {
+      const purchaseOrders = await getPrisma().purchaseOrder.findMany({
+        where: {
+          deletedAt: null,
+          ...(input.from || input.to
+            ? {
+                createdAt: {
+                  ...(input.from ? { gte: input.from } : {}),
+                  ...(input.to ? { lte: input.to } : {}),
+                },
+              }
+            : {}),
+        },
+        include: {
+          supplier: { select: { name: true, countryCode: true } },
+          buyer: { select: { name: true } },
+        },
+        orderBy: { createdAt: "desc" },
+      });
+      if (input.type === "purchasing") {
+        rowsForExport = purchaseOrders.map((row) => ({
+          purchaseOrder: row.purchaseOrderNumber,
+          supplier: row.supplier.name,
+          market: row.supplier.countryCode,
+          buyer: row.buyer.name,
+          status: row.status,
+          totalUsd: row.totalUsd.toFixed(4),
+          expectedAt: row.expectedAt?.toISOString() ?? "",
+          receivedAt: row.receivedAt?.toISOString() ?? "",
+        }));
+      } else {
+        const suppliers = new Map<
+          string,
+          { supplier: string; purchaseOrders: number; purchasedUsd: Decimal }
+        >();
+        for (const order of purchaseOrders) {
+          const current = suppliers.get(order.supplier.name) ?? {
+            supplier: order.supplier.name,
+            purchaseOrders: 0,
+            purchasedUsd: new Decimal(0),
+          };
+          current.purchaseOrders += 1;
+          current.purchasedUsd = current.purchasedUsd.plus(
+            order.totalUsd.toString(),
+          );
+          suppliers.set(order.supplier.name, current);
+        }
+        rowsForExport = [...suppliers.values()].map((row) => ({
+          supplier: row.supplier,
+          purchaseOrders: row.purchaseOrders,
+          purchasedUsd: row.purchasedUsd.toFixed(4),
+        }));
+      }
+    } else if (input.type === "logistics") {
+      const shipments = await getPrisma().shipment.findMany({
+        where: { deletedAt: null },
+        include: {
+          salesOrder: { select: { orderNumber: true } },
+          coordinator: { select: { name: true } },
+        },
+        orderBy: { createdAt: "desc" },
+      });
+      rowsForExport = shipments.map((row) => ({
+        shipment: row.shipmentNumber,
+        order: row.salesOrder.orderNumber,
+        coordinator: row.coordinator.name,
+        method: row.method,
+        carrier: row.carrier ?? "",
+        status: row.status,
+        trackingNumber: row.trackingNumber ?? "",
+        estimatedArrivalAt: row.estimatedArrivalAt?.toISOString() ?? "",
+        deliveredAt: row.deliveredAt?.toISOString() ?? "",
+      }));
+    } else if (input.type === "after-sales") {
+      const tickets = await getPrisma().afterSalesTicket.findMany({
+        where: { deletedAt: null },
+        include: {
+          customer: { select: { companyName: true } },
+          assignedTo: { select: { name: true } },
+        },
+        orderBy: { createdAt: "desc" },
+      });
+      rowsForExport = tickets.map((row) => ({
+        ticket: row.ticketNumber,
+        customer: row.customer.companyName,
+        issueType: row.issueType,
+        priority: row.priority,
+        status: row.status,
+        assignee: row.assignedTo?.name ?? "",
+        cost: row.costAmount?.toFixed(4) ?? "0.0000",
+        currency: row.costCurrencyCode ?? "",
+        closedAt: row.closedAt?.toISOString() ?? "",
+      }));
+    } else if (input.type === "conversion") {
+      const prisma = getPrisma();
+      const [
+        leads,
+        convertedLeads,
+        opportunities,
+        wonOpportunities,
+        quotes,
+        acceptedQuotes,
+        orders,
+      ] = await Promise.all([
+        prisma.lead.count({ where: { deletedAt: null } }),
+        prisma.lead.count({ where: { deletedAt: null, status: "CONVERTED" } }),
+        prisma.opportunity.count({ where: { deletedAt: null } }),
+        prisma.opportunity.count({ where: { deletedAt: null, stage: "WON" } }),
+        prisma.quote.count({ where: { deletedAt: null } }),
+        prisma.quote.count({
+          where: {
+            deletedAt: null,
+            status: { in: ["ACCEPTED", "CONVERTED"] },
+          },
+        }),
+        prisma.salesOrder.count({ where: { deletedAt: null } }),
+      ]);
+      const percent = (part: number, total: number) =>
+        total ? new Decimal(part).div(total).times(100).toFixed(2) : "0.00";
+      rowsForExport = [{
+        leads,
+        convertedLeads,
+        leadConversionPercent: percent(convertedLeads, leads),
+        opportunities,
+        wonOpportunities,
+        opportunityWinPercent: percent(wonOpportunities, opportunities),
+        quotes,
+        acceptedQuotes,
+        quoteAcceptancePercent: percent(acceptedQuotes, quotes),
+        orders,
+      }];
+    }
+    return {
+      type: input.type,
+      generatedAt: new Date(),
+      totals: reportRows.reduce(
+        (totals, row) => ({
+          salesUsd: totals.salesUsd.plus(row.salesUsd),
+          collectionUsd: totals.collectionUsd.plus(row.collectionUsd),
+          receivableUsd: totals.receivableUsd.plus(row.receivableUsd),
+        }),
+        {
+          salesUsd: new Decimal(0),
+          collectionUsd: new Decimal(0),
+          receivableUsd: new Decimal(0),
+        },
+      ),
+      rows: rowsForExport,
+    };
+  }
+
+  async listSettings(context: AuthorizationContext) {
+    const rows = await getPrisma().setting.findMany({
+      orderBy: [{ namespace: "asc" }, { key: "asc" }],
+    });
+    return rows.map((row) => ({
+      ...row,
+      value:
+        row.isSecret || !can(context, "settings.update")
+          ? redactSensitiveValues(row.value)
+          : redactSensitiveValues(row.value),
+    }));
+  }
+
+  updateSetting(context: AuthorizationContext, input: SettingInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.setting.findUnique({
+        where: {
+          namespace_key: { namespace: input.namespace, key: input.key },
+        },
+      });
+      if (
+        current &&
+        input.expectedVersion &&
+        current.version !== input.expectedVersion
+      ) {
+        throw new DomainError(
+          "SETTING_CONFLICT",
+          "Setting changed; refresh and retry",
+          409,
+        );
+      }
+      const value =
+        current &&
+        current.value !== null &&
+        typeof current.value === "object" &&
+        !Array.isArray(current.value)
+          ? preserveMaskedValues(
+              input.value,
+              current.value as Record<string, unknown>,
+            )
+          : input.value;
+      const row = await transaction.setting.upsert({
+        where: {
+          namespace_key: { namespace: input.namespace, key: input.key },
+        },
+        update: {
+          value: value as Prisma.InputJsonValue,
+          isSecret: input.isSecret,
+          version: { increment: 1 },
+        },
+        create: {
+          namespace: input.namespace,
+          key: input.key,
+          value: value as Prisma.InputJsonValue,
+          isSecret: input.isSecret ?? false,
+        },
+      });
+      if (input.namespace === "currency") {
+        const value = input.value as {
+          rateToUsd: number;
+          effectiveAt?: string;
+        };
+        const currency = await transaction.currency.findUnique({
+          where: { code: input.key.toUpperCase() },
+        });
+        if (!currency) {
+          throw new DomainError(
+            "CURRENCY_NOT_FOUND",
+            "Currency must be created before adding a manual rate",
+            409,
+          );
+        }
+        await transaction.exchangeRate.upsert({
+          where: {
+            currencyCode_effectiveAt: {
+              currencyCode: currency.code,
+              effectiveAt: value.effectiveAt
+                ? new Date(value.effectiveAt)
+                : new Date(),
+            },
+          },
+          update: {
+            rateToUsd: value.rateToUsd,
+            source: "MANUAL",
+            createdById: context.userId,
+          },
+          create: {
+            currencyCode: currency.code,
+            rateToUsd: value.rateToUsd,
+            effectiveAt: value.effectiveAt
+              ? new Date(value.effectiveAt)
+              : new Date(),
+            source: "MANUAL",
+            createdById: context.userId,
+          },
+        });
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "settings.update",
+        entityType: "Setting",
+        entityId: row.id,
+        before: current
+          ? (redactSensitiveValues(current.value) as Prisma.InputJsonValue)
+          : undefined,
+        after: redactSensitiveValues(row.value) as Prisma.InputJsonValue,
+        metadata: { namespace: row.namespace, key: row.key },
+      });
+      return { ...row, value: redactSensitiveValues(row.value) };
+    });
+  }
+
+  async listActivityLogs(filters: {
+    actorId?: string;
+    action?: string;
+    entityType?: string;
+    entityId?: string;
+    from?: Date;
+    to?: Date;
+  }) {
+    const rows = await getPrisma().auditLog.findMany({
+      where: {
+        ...(filters.actorId ? { actorId: filters.actorId } : {}),
+        ...(filters.action
+          ? { action: { contains: filters.action, mode: "insensitive" } }
+          : {}),
+        ...(filters.entityType ? { entityType: filters.entityType } : {}),
+        ...(filters.entityId ? { entityId: filters.entityId } : {}),
+        ...(filters.from || filters.to
+          ? {
+              createdAt: {
+                ...(filters.from ? { gte: filters.from } : {}),
+                ...(filters.to ? { lte: filters.to } : {}),
+              },
+            }
+          : {}),
+      },
+      orderBy: { createdAt: "desc" },
+      take: 250,
+      include: { actor: { select: { id: true, name: true, email: true } } },
+    });
+    return rows.map((row) => ({
+      ...row,
+      before: redactSensitiveValues(row.before),
+      after: redactSensitiveValues(row.after),
+      metadata: redactSensitiveValues(row.metadata),
+    }));
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\prisma-reminder-repository.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\prisma-reminder-repository.ts"
new file mode 100644
index 0000000..56ae823
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\prisma-reminder-repository.ts"
@@ -0,0 +1,173 @@
+import { getPrisma } from "@/lib/prisma";
+import type {
+  ReminderCandidate,
+  ReminderRepository,
+} from "@/modules/management/reminders";
+
+function endOfWindow(now: Date, days: number) {
+  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
+}
+
+export class PrismaReminderRepository implements ReminderRepository {
+  async listCandidates(now: Date) {
+    const prisma = getPrisma();
+    const [
+      followUps,
+      receivables,
+      quotes,
+      purchases,
+      shipments,
+      lowInventory,
+      operationsUsers,
+    ] = await Promise.all([
+      prisma.followUp.findMany({
+        where: {
+          deletedAt: null,
+          completedAt: null,
+          nextActionAt: { lte: endOfWindow(now, 1) },
+        },
+        select: {
+          id: true,
+          createdById: true,
+          nextAction: true,
+          customerId: true,
+          leadId: true,
+        },
+      }),
+      prisma.salesOrder.findMany({
+        where: {
+          deletedAt: null,
+          status: { notIn: ["COMPLETED", "CANCELLED"] },
+          paymentStatus: { not: "PAID" },
+        },
+        select: {
+          id: true,
+          orderNumber: true,
+          ownerId: true,
+          customerId: true,
+        },
+      }),
+      prisma.quote.findMany({
+        where: {
+          deletedAt: null,
+          status: { in: ["APPROVED", "SENT", "VIEWED"] },
+          validUntil: { gte: now, lte: endOfWindow(now, 3) },
+        },
+        select: { id: true, quoteNumber: true, ownerId: true },
+      }),
+      prisma.purchaseOrder.findMany({
+        where: {
+          deletedAt: null,
+          expectedAt: { lt: now },
+          status: { notIn: ["RECEIVED", "CANCELLED"] },
+        },
+        select: {
+          id: true,
+          purchaseOrderNumber: true,
+          buyerId: true,
+        },
+      }),
+      prisma.shipment.findMany({
+        where: {
+          deletedAt: null,
+          estimatedArrivalAt: { lt: now },
+          status: { notIn: ["DELIVERED", "CANCELLED"] },
+        },
+        select: {
+          id: true,
+          shipmentNumber: true,
+          coordinatorId: true,
+        },
+      }),
+      prisma.inventoryItem.findMany({
+        where: {
+          deletedAt: null,
+          quantityOnHand: { lte: 2 },
+        },
+        select: { id: true, product: { select: { sku: true, name: true } } },
+      }),
+      prisma.user.findMany({
+        where: {
+          status: "ACTIVE",
+          deletedAt: null,
+          roles: { some: { role: { code: { in: ["OPERATIONS", "PROCUREMENT"] } } } },
+        },
+        select: { id: true },
+      }),
+    ]);
+
+    const candidates: ReminderCandidate[] = [
+      ...followUps.map((row) => ({
+        kind: "FOLLOW_UP_DUE" as const,
+        entityId: row.id,
+        userId: row.createdById,
+        title: "Follow-up due",
+        message: row.nextAction ?? "A planned follow-up needs attention.",
+        link: row.customerId
+          ? `/en/customers/${row.customerId}#follow-ups`
+          : "/en/leads",
+      })),
+      ...receivables.map((row) => ({
+        kind: "RECEIVABLE_DUE" as const,
+        entityId: row.id,
+        userId: row.ownerId,
+        title: "Receivable outstanding",
+        message: `${row.orderNumber} has an outstanding balance.`,
+        link: `/en/orders/${row.id}`,
+      })),
+      ...quotes.map((row) => ({
+        kind: "QUOTE_EXPIRING" as const,
+        entityId: row.id,
+        userId: row.ownerId,
+        title: "Quote expiring",
+        message: `${row.quoteNumber} expires within three days.`,
+        link: `/en/quotes/${row.id}`,
+      })),
+      ...purchases.map((row) => ({
+        kind: "PURCHASE_DELAYED" as const,
+        entityId: row.id,
+        userId: row.buyerId,
+        title: "Purchase delayed",
+        message: `${row.purchaseOrderNumber} is past its expected date.`,
+        link: `/en/purchase-orders/${row.id}`,
+      })),
+      ...shipments.map((row) => ({
+        kind: "SHIPMENT_DELAYED" as const,
+        entityId: row.id,
+        userId: row.coordinatorId,
+        title: "Shipment delayed",
+        message: `${row.shipmentNumber} is past its estimated arrival.`,
+        link: `/en/shipments/${row.id}`,
+      })),
+      ...lowInventory.flatMap((row) =>
+        operationsUsers.map((user) => ({
+          kind: "LOW_INVENTORY" as const,
+          entityId: row.id,
+          userId: user.id,
+          title: "Low inventory",
+          message: `${row.product.sku} · ${row.product.name} is at or below the threshold.`,
+          link: "/en/inventory",
+        })),
+      ),
+    ];
+    return candidates;
+  }
+
+  async createNotification(candidate: ReminderCandidate) {
+    const dedupeKey = `${candidate.kind}:${candidate.entityId}:${candidate.userId}`;
+    const result = await getPrisma().notification.createMany({
+      data: [{
+        userId: candidate.userId,
+        type: candidate.kind,
+        title: candidate.title,
+        message: candidate.message,
+        link: candidate.link,
+        entityType: candidate.kind,
+        entityId: candidate.entityId,
+        dedupeKey,
+      }],
+      skipDuplicates: true,
+    });
+    return result.count === 1;
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.test.ts"
new file mode 100644
index 0000000..475fff7
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.test.ts"
@@ -0,0 +1,32 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  processReminderCandidates,
+  type ReminderRepository,
+} from "@/modules/management/reminders";
+
+describe("worker reminders", () => {
+  it("uses a deterministic dedupe key so repeated runs create one notification", async () => {
+    const created = new Set<string>();
+    const repository: ReminderRepository = {
+      listCandidates: async () => [{
+        kind: "FOLLOW_UP_DUE",
+        entityId: "follow-up-1",
+        userId: "sales-1",
+        title: "Follow-up due",
+        message: "Call Northstar",
+        link: "/en/customers/customer-1#follow-ups",
+      }],
+      createNotification: async (candidate) => {
+        const key = `${candidate.kind}:${candidate.entityId}:${candidate.userId}`;
+        if (created.has(key)) return false;
+        created.add(key);
+        return true;
+      },
+    };
+
+    await expect(processReminderCandidates(repository)).resolves.toEqual({ scanned: 1, created: 1 });
+    await expect(processReminderCandidates(repository)).resolves.toEqual({ scanned: 1, created: 0 });
+    expect(created.size).toBe(1);
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.ts"
new file mode 100644
index 0000000..6b5806d
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reminders.ts"
@@ -0,0 +1,36 @@
+export const REMINDER_KINDS = [
+  "FOLLOW_UP_DUE",
+  "RECEIVABLE_DUE",
+  "QUOTE_EXPIRING",
+  "PURCHASE_DELAYED",
+  "SHIPMENT_DELAYED",
+  "LOW_INVENTORY",
+] as const;
+
+export type ReminderKind = (typeof REMINDER_KINDS)[number];
+
+export interface ReminderCandidate {
+  kind: ReminderKind;
+  entityId: string;
+  userId: string;
+  title: string;
+  message: string;
+  link: string;
+}
+
+export interface ReminderRepository {
+  listCandidates(now: Date): Promise<ReminderCandidate[]>;
+  createNotification(candidate: ReminderCandidate): Promise<boolean>;
+}
+
+export async function processReminderCandidates(
+  repository: ReminderRepository,
+  now = new Date(),
+) {
+  const candidates = await repository.listCandidates(now);
+  let created = 0;
+  for (const candidate of candidates) {
+    if (await repository.createNotification(candidate)) created += 1;
+  }
+  return { scanned: candidates.length, created };
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.test.ts"
new file mode 100644
index 0000000..e43b65d
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.test.ts"
@@ -0,0 +1,70 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  buildReportRows,
+  groupReportRows,
+  reportScope,
+  toCsv,
+  toSimplePdf,
+} from "@/modules/management/reporting";
+
+describe("reporting", () => {
+  it("limits sales representatives to owned rows and grants managers team scope", () => {
+    expect(
+      reportScope({ userId: "sales-1", roles: ["SALES_REP"], permissions: ["report.read"] }),
+    ).toEqual({ ownerId: "sales-1" });
+    expect(
+      reportScope({ userId: "manager-1", roles: ["SALES_MANAGER"], permissions: ["report.read"] }),
+    ).toEqual({});
+  });
+
+  it("calculates collection, receivable, and profit without exposing profit permissionlessly", () => {
+    const rows = buildReportRows(
+      [{
+        orderNumber: "SO-1",
+        customer: "Northstar",
+        owner: "Lina",
+        market: "US",
+        totalUsd: "100.00",
+        collectedUsd: "40.00",
+        costUsd: "55.00",
+      }],
+      { userId: "sales-1", roles: ["SALES_REP"], permissions: ["report.read"] },
+    );
+    expect(rows[0]).toMatchObject({
+      orderNumber: "SO-1",
+      collectionUsd: "40.0000",
+      receivableUsd: "60.0000",
+    });
+    expect(rows[0]).not.toHaveProperty("profitUsd");
+  });
+
+  it("produces escaped CSV and a valid single-page PDF export", () => {
+    expect(toCsv([{ customer: "Northstar, Inc.", salesUsd: "100.0000" }])).toBe(
+      'customer,salesUsd\r\n"Northstar, Inc.",100.0000',
+    );
+    const pdf = toSimplePdf("Sales report\nNorthstar 100.0000");
+    expect(new TextDecoder().decode(pdf.slice(0, 8))).toBe("%PDF-1.4");
+    expect(new TextDecoder().decode(pdf)).toContain("%%EOF");
+  });
+
+  it("groups report rows by customer, market, or representative with decimal totals", () => {
+    expect(
+      groupReportRows(
+        [
+          { customer: "Northstar", salesUsd: "100.0000", collectionUsd: "40.0000", receivableUsd: "60.0000" },
+          { customer: "Northstar", salesUsd: "50.0000", collectionUsd: "50.0000", receivableUsd: "0.0000" },
+        ],
+        "customer",
+      ),
+    ).toEqual([
+      {
+        customer: "Northstar",
+        orders: 2,
+        salesUsd: "150.0000",
+        collectionUsd: "90.0000",
+        receivableUsd: "60.0000",
+      },
+    ]);
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.ts"
new file mode 100644
index 0000000..1313e94
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\management\\reporting.ts"
@@ -0,0 +1,148 @@
+import Decimal from "decimal.js";
+
+import type { AuthorizationContext } from "@/lib/rbac";
+import { can, hasGlobalOwnershipScope } from "@/lib/rbac";
+
+export function reportScope(context: AuthorizationContext) {
+  return hasGlobalOwnershipScope(context, "report.read") ||
+    context.roles?.some((role) =>
+      ["FINANCE", "PROCUREMENT", "OPERATIONS"].includes(role),
+    )
+    ? {}
+    : { ownerId: context.userId };
+}
+
+export interface ReportOrderInput {
+  orderNumber: string;
+  customer: string;
+  owner: string;
+  market: string;
+  totalUsd: string;
+  collectedUsd: string;
+  costUsd: string;
+}
+
+export function buildReportRows(
+  orders: readonly ReportOrderInput[],
+  context: AuthorizationContext,
+) {
+  const showProfit = can(context, "finance.profit.read");
+  return orders.map((order) => {
+    const total = new Decimal(order.totalUsd);
+    const collection = new Decimal(order.collectedUsd);
+    const base = {
+      orderNumber: order.orderNumber,
+      customer: order.customer,
+      owner: order.owner,
+      market: order.market,
+      salesUsd: total.toFixed(4),
+      collectionUsd: collection.toFixed(4),
+      receivableUsd: Decimal.max(0, total.minus(collection)).toFixed(4),
+      collectionRatePercent: total.isZero()
+        ? "0.00"
+        : collection.div(total).times(100).toFixed(2),
+    };
+    return showProfit
+      ? {
+          ...base,
+          costUsd: new Decimal(order.costUsd).toFixed(4),
+          profitUsd: total.minus(order.costUsd).toFixed(4),
+        }
+      : base;
+  });
+}
+
+export function groupReportRows<
+  T extends {
+    salesUsd: string;
+    collectionUsd: string;
+    receivableUsd: string;
+  },
+  K extends keyof T,
+>(rows: readonly T[], dimension: K) {
+  const grouped = new Map<
+    T[K],
+    {
+      orders: number;
+      salesUsd: Decimal;
+      collectionUsd: Decimal;
+      receivableUsd: Decimal;
+    }
+  >();
+  for (const row of rows) {
+    const current = grouped.get(row[dimension]) ?? {
+      orders: 0,
+      salesUsd: new Decimal(0),
+      collectionUsd: new Decimal(0),
+      receivableUsd: new Decimal(0),
+    };
+    current.orders += 1;
+    current.salesUsd = current.salesUsd.plus(row.salesUsd);
+    current.collectionUsd = current.collectionUsd.plus(row.collectionUsd);
+    current.receivableUsd = current.receivableUsd.plus(row.receivableUsd);
+    grouped.set(row[dimension], current);
+  }
+  return [...grouped.entries()].map(([value, totals]) => ({
+    [dimension]: value,
+    orders: totals.orders,
+    salesUsd: totals.salesUsd.toFixed(4),
+    collectionUsd: totals.collectionUsd.toFixed(4),
+    receivableUsd: totals.receivableUsd.toFixed(4),
+  })) as Array<
+    Pick<T, K> & {
+      orders: number;
+      salesUsd: string;
+      collectionUsd: string;
+      receivableUsd: string;
+    }
+  >;
+}
+
+function csvCell(value: unknown) {
+  const text = value === null || value === undefined ? "" : String(value);
+  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
+}
+
+export function toCsv(rows: readonly Record<string, unknown>[]) {
+  if (!rows.length) return "";
+  const headers = Object.keys(rows[0]);
+  return [
+    headers.map(csvCell).join(","),
+    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
+  ].join("\r\n");
+}
+
+export function toSimplePdf(text: string) {
+  const encoder = new TextEncoder();
+  const escapedLines = text.split(/\r?\n/).map((line) =>
+    line
+      .replaceAll("\\", "\\\\")
+      .replaceAll("(", "\\(")
+      .replaceAll(")", "\\)"),
+  );
+  const stream = `BT /F1 10 Tf 14 TL 40 760 Td ${escapedLines
+    .map((line, index) => `${index ? "T* " : ""}(${line}) Tj`)
+    .join(" ")} ET`;
+  const objects = [
+    "<< /Type /Catalog /Pages 2 0 R >>",
+    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
+    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
+    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
+    `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`,
+  ];
+  let document = "%PDF-1.4\n";
+  const offsets = [0];
+  objects.forEach((object, index) => {
+    offsets.push(encoder.encode(document).length);
+    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
+  });
+  const xrefOffset = encoder.encode(document).length;
+  document += `xref\n0 ${objects.length + 1}\n`;
+  document += "0000000000 65535 f \n";
+  document += offsets
+    .slice(1)
+    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
+    .join("");
+  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
+  return encoder.encode(document);
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\management\\management-forms.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\management\\management-forms.tsx"
new file mode 100644
index 0000000..30ecab1
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\management\\management-forms.tsx"
@@ -0,0 +1,311 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+type Locale = "en" | "zh";
+type Option = { id: string; label: string };
+
+function useMutation(locale: Locale) {
+  const router = useRouter();
+  const [busy, setBusy] = useState(false);
+  const [message, setMessage] = useState("");
+
+  async function mutate(endpoint: string, body: unknown, method = "POST") {
+    setBusy(true);
+    setMessage("");
+    try {
+      const response = await fetch(endpoint, {
+        method,
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify(body),
+      });
+      const result = (await response.json()) as {
+        success: boolean;
+        error?: { message?: string };
+      };
+      if (!response.ok || !result.success) {
+        throw new Error(result.error?.message ?? "Request failed");
+      }
+      setMessage(locale === "zh" ? "已保存。" : "Saved.");
+      router.refresh();
+      return true;
+    } catch (error) {
+      setMessage(error instanceof Error ? error.message : "Request failed");
+      return false;
+    } finally {
+      setBusy(false);
+    }
+  }
+  return { busy, message, mutate };
+}
+
+function Feedback({
+  locale,
+  busy,
+  message,
+}: {
+  locale: Locale;
+  busy: boolean;
+  message: string;
+}) {
+  return (
+    <>
+      <button className="button" disabled={busy} type="submit">
+        {busy
+          ? locale === "zh"
+            ? "保存中…"
+            : "Saving…"
+          : locale === "zh"
+            ? "保存"
+            : "Save"}
+      </button>
+      {message ? <p className="form-feedback" role="status">{message}</p> : null}
+    </>
+  );
+}
+
+export function TicketCreateForm({
+  locale,
+  options,
+}: {
+  locale: Locale;
+  options: {
+    customers: Option[];
+    orders: Option[];
+    products: Option[];
+    serials: Option[];
+    users: Option[];
+  };
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const form = event.currentTarget;
+        const data = new FormData(form);
+        const saved = await mutation.mutate("/api/tickets", {
+          customerId: data.get("customerId"),
+          salesOrderId: data.get("salesOrderId") || null,
+          productId: data.get("productId") || null,
+          inventorySerialId: data.get("inventorySerialId") || null,
+          assignedToId: data.get("assignedToId") || null,
+          subject: data.get("subject"),
+          description: data.get("description"),
+          issueType: data.get("issueType"),
+          priority: data.get("priority"),
+          costAmount: data.get("costAmount") || null,
+          costCurrencyCode: data.get("costAmount")
+            ? data.get("costCurrencyCode")
+            : null,
+          attachmentIds: String(data.get("attachmentIds") ?? "")
+            .split(",")
+            .map((value) => value.trim())
+            .filter(Boolean),
+        });
+        if (saved) form.reset();
+      }}
+    >
+      <label>
+        {locale === "zh" ? "客户" : "Customer"}
+        <select name="customerId" required>
+          <option value="">—</option>
+          {options.customers.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "销售订单" : "Sales order"}
+        <select name="salesOrderId">
+          <option value="">—</option>
+          {options.orders.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "产品" : "Product"}
+        <select name="productId">
+          <option value="">—</option>
+          {options.products.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "序列号" : "Serial"}
+        <select name="inventorySerialId">
+          <option value="">—</option>
+          {options.serials.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "负责人" : "Assignee"}
+        <select name="assignedToId">
+          <option value="">—</option>
+          {options.users.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "问题类型" : "Issue type"}
+        <select defaultValue="QUALITY" name="issueType">
+          {["QUALITY", "DAMAGE", "MISSING_ITEM", "WRONG_ITEM", "TECHNICAL", "WARRANTY", "RETURN", "OTHER"].map((value) => <option key={value}>{value}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "优先级" : "Priority"}
+        <select defaultValue="NORMAL" name="priority">
+          {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "主题" : "Subject"}
+        <input name="subject" required />
+      </label>
+      <label>
+        {locale === "zh" ? "成本" : "Cost"}
+        <input inputMode="decimal" name="costAmount" />
+      </label>
+      <label>
+        {locale === "zh" ? "成本币种" : "Cost currency"}
+        <input defaultValue="USD" maxLength={3} name="costCurrencyCode" />
+      </label>
+      <label>
+        {locale === "zh" ? "附件资产 ID（逗号分隔）" : "Attachment asset IDs (comma separated)"}
+        <input name="attachmentIds" />
+      </label>
+      <label>
+        {locale === "zh" ? "描述" : "Description"}
+        <textarea name="description" required />
+      </label>
+      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
+    </form>
+  );
+}
+
+export function TaskCreateForm({
+  locale,
+  users,
+}: {
+  locale: Locale;
+  users: Option[];
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const form = event.currentTarget;
+        const data = new FormData(form);
+        const saved = await mutation.mutate("/api/tasks", {
+          title: data.get("title"),
+          description: data.get("description") || null,
+          priority: data.get("priority"),
+          assigneeId: data.get("assigneeId"),
+          teamCode: data.get("teamCode") || null,
+          entityType: data.get("entityType") || null,
+          entityId: data.get("entityId") || null,
+          dueAt: data.get("dueAt") || null,
+          reminderAt: data.get("reminderAt") || null,
+        });
+        if (saved) form.reset();
+      }}
+    >
+      <label>{locale === "zh" ? "标题" : "Title"}<input name="title" required /></label>
+      <label>
+        {locale === "zh" ? "负责人" : "Assignee"}
+        <select name="assigneeId" required>
+          {users.map((user) => <option key={user.id} value={user.id}>{user.label}</option>)}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "优先级" : "Priority"}
+        <select defaultValue="NORMAL" name="priority">
+          {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}
+        </select>
+      </label>
+      <label>{locale === "zh" ? "团队" : "Team"}<input name="teamCode" /></label>
+      <label>{locale === "zh" ? "截止日期" : "Due date"}<input name="dueAt" type="datetime-local" /></label>
+      <label>{locale === "zh" ? "提醒时间" : "Reminder"}<input name="reminderAt" type="datetime-local" /></label>
+      <label>{locale === "zh" ? "关联类型" : "Related type"}<input name="entityType" placeholder="Customer, Order, Ticket…" /></label>
+      <label>{locale === "zh" ? "关联 ID" : "Related ID"}<input name="entityId" /></label>
+      <label>{locale === "zh" ? "描述" : "Description"}<textarea name="description" /></label>
+      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
+    </form>
+  );
+}
+
+export function MutationButton({
+  locale,
+  endpoint,
+  body,
+  label,
+  method = "PATCH",
+}: {
+  locale: Locale;
+  endpoint: string;
+  body: unknown;
+  label: string;
+  method?: "PATCH" | "POST";
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <span className="inline-action">
+      <button
+        className="button button-secondary"
+        disabled={mutation.busy}
+        onClick={() => void mutation.mutate(endpoint, body, method)}
+        type="button"
+      >
+        {mutation.busy ? "…" : label}
+      </button>
+      {mutation.message ? <small>{mutation.message}</small> : null}
+    </span>
+  );
+}
+
+export function SettingEditor({
+  locale,
+  setting,
+}: {
+  locale: Locale;
+  setting: {
+    namespace: string;
+    key: string;
+    value: unknown;
+    version: number;
+    isSecret: boolean;
+  };
+}) {
+  const mutation = useMutation(locale);
+  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2));
+  return (
+    <form
+      className="setting-editor"
+      onSubmit={(event) => {
+        event.preventDefault();
+        try {
+          void mutation.mutate(
+            "/api/settings",
+            {
+              namespace: setting.namespace,
+              key: setting.key,
+              value: JSON.parse(value),
+              expectedVersion: setting.version,
+              isSecret: setting.isSecret,
+            },
+            "PUT",
+          );
+        } catch {
+          // Invalid JSON stays visible for correction.
+        }
+      }}
+    >
+      <textarea
+        aria-label={`${setting.namespace}.${setting.key}`}
+        onChange={(event) => setValue(event.target.value)}
+        rows={8}
+        value={value}
+      />
+      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
+    </form>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tickets\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tickets\\page.tsx"
new file mode 100644
index 0000000..8213034
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tickets\\page.tsx"
@@ -0,0 +1,113 @@
+import { notFound } from "next/navigation";
+
+import {
+  MutationButton,
+  TicketCreateForm,
+} from "@/components/management/management-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+
+export default async function TicketsPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "after_sales.read");
+  const [tickets, options] = await Promise.all([
+    service.listTickets(),
+    service.ticketOptions(),
+  ]);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "售后工单" : "After-sales tickets"}</h1>
+          <p>{locale === "zh" ? "跟踪问题、责任人、解决方案和成本。" : "Track issues, ownership, solutions, and costs."}</p>
+        </div>
+      </header>
+      {tickets.length ? (
+        <section className="record-grid">
+          {tickets.map((ticket) => (
+            <article className="record-card" key={ticket.id}>
+              <strong>{ticket.ticketNumber} · {ticket.subject}</strong>
+              <span>{ticket.issueType} · {ticket.priority} · <b>{ticket.status}</b></span>
+              <span>{ticket.customer.companyName}</span>
+              <span>
+                {[ticket.salesOrder?.orderNumber, ticket.product?.sku, ticket.inventorySerial?.serialNumber]
+                  .filter(Boolean)
+                  .join(" · ") || (locale === "zh" ? "无关联记录" : "No linked record")}
+              </span>
+              <span>{locale === "zh" ? "负责人" : "Assignee"}: {ticket.assignedTo?.name ?? "—"}</span>
+              <span>{locale === "zh" ? "成本" : "Cost"}: {ticket.costAmount?.toString() ?? "0"} {ticket.costCurrencyCode ?? ""}</span>
+              {ticket.solution ? <p>{ticket.solution}</p> : null}
+              {can(context, "after_sales.update") && ticket.status !== "CLOSED" ? (
+                <div className="status-actions">
+                  {ticket.status === "OPEN" ? (
+                    <MutationButton
+                      body={{ expectedVersion: ticket.version, status: "IN_PROGRESS" }}
+                      endpoint={`/api/tickets/${ticket.id}`}
+                      label={locale === "zh" ? "开始处理" : "Start"}
+                      locale={locale}
+                    />
+                  ) : null}
+                  {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
+                    <MutationButton
+                      body={{
+                        expectedVersion: ticket.version,
+                        status: "RESOLVED",
+                        solution: ticket.solution ?? "Issue resolved and customer notified.",
+                      }}
+                      endpoint={`/api/tickets/${ticket.id}`}
+                      label={locale === "zh" ? "解决" : "Resolve"}
+                      locale={locale}
+                    />
+                  ) : null}
+                  {ticket.status === "RESOLVED" ? (
+                    <MutationButton
+                      body={{
+                        expectedVersion: ticket.version,
+                        status: "CLOSED",
+                        solution: ticket.solution ?? "Resolution accepted.",
+                      }}
+                      endpoint={`/api/tickets/${ticket.id}`}
+                      label={locale === "zh" ? "关闭" : "Close"}
+                      locale={locale}
+                    />
+                  ) : null}
+                </div>
+              ) : null}
+            </article>
+          ))}
+        </section>
+      ) : (
+        <section className="card empty-state">
+          {locale === "zh" ? "暂无售后工单。" : "No after-sales tickets yet."}
+        </section>
+      )}
+      {can(context, "after_sales.create") ? (
+        <details className="card section-card">
+          <summary>{locale === "zh" ? "新建工单" : "Create ticket"}</summary>
+          <TicketCreateForm
+            locale={locale}
+            options={{
+              customers: options.customers.map((row) => ({ id: row.id, label: row.companyName })),
+              orders: options.orders.map((row) => ({ id: row.id, label: row.orderNumber })),
+              products: options.products.map((row) => ({ id: row.id, label: `${row.sku} · ${row.name}` })),
+              serials: options.serials.map((row) => ({ id: row.id, label: row.serialNumber })),
+              users: options.users.map((row) => ({ id: row.id, label: row.name })),
+            }}
+          />
+        </details>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tasks\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tasks\\page.tsx"
new file mode 100644
index 0000000..baf2be3
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\tasks\\page.tsx"
@@ -0,0 +1,117 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import {
+  MutationButton,
+  TaskCreateForm,
+} from "@/components/management/management-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+const statuses = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
+
+function TaskCard({
+  task,
+  locale,
+  editable,
+}: {
+  task: Awaited<ReturnType<ManagementService["listTasks"]>>[number];
+  locale: "en" | "zh";
+  editable: boolean;
+}) {
+  return (
+    <article className={`record-card ${task.overdue ? "task-overdue" : ""}`}>
+      <strong>{task.title}</strong>
+      <span>{task.priority} · {task.status}</span>
+      <span>{task.assignee.name}{task.teamCode ? ` · ${task.teamCode}` : ""}</span>
+      <time>{task.dueAt ? task.dueAt.toLocaleString(locale) : (locale === "zh" ? "无截止日期" : "No due date")}</time>
+      {task.overdue ? <span className="risk risk-high">{locale === "zh" ? "已逾期" : "Overdue"}</span> : null}
+      {task.entityType ? <small>{task.entityType} · {task.entityId}</small> : null}
+      {editable && !["COMPLETED", "CANCELLED"].includes(task.status) ? (
+        <MutationButton
+          body={{ expectedVersion: task.version, status: task.status === "OPEN" ? "IN_PROGRESS" : "COMPLETED" }}
+          endpoint={`/api/tasks/${task.id}`}
+          label={task.status === "OPEN" ? (locale === "zh" ? "开始" : "Start") : (locale === "zh" ? "完成" : "Complete")}
+          locale={locale}
+        />
+      ) : null}
+    </article>
+  );
+}
+
+export default async function TasksPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<{ view?: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "task.read");
+  const view = (await searchParams).view ?? "list";
+  const [tasks, users] = await Promise.all([
+    service.listTasks(context),
+    service.listTaskAssignees(),
+  ]);
+  const editable = can(context, "task.update");
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "任务" : "Tasks"}</h1>
+          <p>{locale === "zh" ? "个人与团队任务、提醒和逾期工作。" : "Personal and team work, reminders, and overdue items."}</p>
+        </div>
+        <nav className="view-switcher" aria-label="Task view">
+          {["list", "kanban", "calendar"].map((value) => (
+            <Link className={view === value ? "badge" : ""} href={`/${locale}/tasks?view=${value}`} key={value}>
+              {value}
+            </Link>
+          ))}
+        </nav>
+      </header>
+      {!tasks.length ? (
+        <section className="card empty-state">{locale === "zh" ? "暂无任务。" : "No tasks in your scope."}</section>
+      ) : view === "kanban" ? (
+        <section className="kanban task-kanban">
+          {statuses.map((status) => (
+            <div className="kanban-column" key={status}>
+              <h2>{status}</h2>
+              {tasks.filter((task) => task.status === status).map((task) => (
+                <TaskCard editable={editable} key={task.id} locale={locale} task={task} />
+              ))}
+            </div>
+          ))}
+        </section>
+      ) : view === "calendar" ? (
+        <section className="calendar-grid">
+          {tasks.filter((task) => task.dueAt).map((task) => (
+            <div className="calendar-day" key={task.id}>
+              <time>{task.dueAt!.toLocaleDateString(locale)}</time>
+              <TaskCard editable={editable} locale={locale} task={task} />
+            </div>
+          ))}
+        </section>
+      ) : (
+        <section className="record-grid">
+          {tasks.map((task) => <TaskCard editable={editable} key={task.id} locale={locale} task={task} />)}
+        </section>
+      )}
+      {can(context, "task.create") ? (
+        <details className="card section-card">
+          <summary>{locale === "zh" ? "新建任务" : "Create task"}</summary>
+          <TaskCreateForm
+            locale={locale}
+            users={users.map((user) => ({ id: user.id, label: user.name }))}
+          />
+        </details>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\notifications\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\notifications\\page.tsx"
new file mode 100644
index 0000000..6bcbc74
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\notifications\\page.tsx"
@@ -0,0 +1,65 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { MutationButton } from "@/components/management/management-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+
+export default async function NotificationsPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  const notifications = await service.listNotifications(context);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "通知" : "Notifications"}</h1>
+          <p>{notifications.unreadCount} {locale === "zh" ? "条未读" : "unread"}</p>
+        </div>
+        {notifications.unreadCount ? (
+          <MutationButton
+            body={{}}
+            endpoint="/api/notifications/read"
+            label={locale === "zh" ? "全部标为已读" : "Mark all read"}
+            locale={locale}
+            method="POST"
+          />
+        ) : null}
+      </header>
+      {notifications.items.length ? (
+        <section className="record-grid">
+          {notifications.items.map((item) => (
+            <article className={`record-card ${item.readAt ? "" : "notification-unread"}`} key={item.id}>
+              <strong>{item.title}</strong>
+              <span>{item.type}</span>
+              <p>{item.message}</p>
+              <time>{item.createdAt.toLocaleString(locale)}</time>
+              {item.link ? <Link className="table-link" href={item.link.replace(/^\/en/, `/${locale}`)}>{locale === "zh" ? "打开" : "Open"}</Link> : null}
+              {!item.readAt ? (
+                <MutationButton
+                  body={{ ids: [item.id] }}
+                  endpoint="/api/notifications/read"
+                  label={locale === "zh" ? "标为已读" : "Mark read"}
+                  locale={locale}
+                  method="POST"
+                />
+              ) : null}
+            </article>
+          ))}
+        </section>
+      ) : (
+        <section className="card empty-state">{locale === "zh" ? "暂无通知。" : "No notifications."}</section>
+      )}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\reports\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\reports\\page.tsx"
new file mode 100644
index 0000000..c6e71a2
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\reports\\page.tsx"
@@ -0,0 +1,79 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+const reportTypes = [
+  "sales", "collections", "receivables", "customers", "markets", "products",
+  "representatives", "suppliers", "purchasing", "logistics", "after-sales",
+  "profit", "conversion",
+] as const;
+
+export default async function ReportsPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "report.read");
+  const query = await searchParams;
+  const availableTypes = can(context, "finance.profit.read")
+    ? reportTypes
+    : reportTypes.filter((value) => value !== "profit");
+  const type = availableTypes.includes(query.type as never) ? query.type! : "sales";
+  const report = await service.report(context, {
+    type,
+    from: query.from ? new Date(query.from) : undefined,
+    to: query.to ? new Date(query.to) : undefined,
+  });
+  const exportQuery = new URLSearchParams({ type });
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "报表" : "Reports"}</h1>
+          <p>{locale === "zh" ? "权限范围内的业务和财务视图。" : "Permission-aware operating and financial views."}</p>
+        </div>
+      </header>
+      <form className="filter-bar">
+        <select defaultValue={type} name="type">
+          {availableTypes.map((value) => <option key={value}>{value}</option>)}
+        </select>
+        <input defaultValue={query.from} name="from" type="date" />
+        <input defaultValue={query.to} name="to" type="date" />
+        <button className="button" type="submit">{locale === "zh" ? "应用" : "Apply"}</button>
+      </form>
+      <div className="export-actions">
+        {(["csv", "excel", "pdf"] as const).map((format) => (
+          <Link className="button button-secondary" href={`/api/reports?${exportQuery}&format=${format}`} key={format}>
+            {format.toUpperCase()}
+          </Link>
+        ))}
+      </div>
+      <section className="metrics">
+        <article className="card metric"><span className="metric-label">Sales USD</span><strong className="metric-value">${report.totals.salesUsd.toFixed(2)}</strong></article>
+        <article className="card metric"><span className="metric-label">Collected USD</span><strong className="metric-value">${report.totals.collectionUsd.toFixed(2)}</strong></article>
+        <article className="card metric"><span className="metric-label">Receivable USD</span><strong className="metric-value">${report.totals.receivableUsd.toFixed(2)}</strong></article>
+        <article className="card metric"><span className="metric-label">Rows</span><strong className="metric-value">{report.rows.length}</strong></article>
+      </section>
+      <section className="card section-card table-wrap">
+        {report.rows.length ? (
+          <table>
+            <thead><tr>{Object.keys(report.rows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead>
+            <tbody>{report.rows.map((row) => <tr key={row.orderNumber}>{Object.values(row).map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
+          </table>
+        ) : <div className="empty-state">{locale === "zh" ? "当前筛选没有数据。" : "No data for the current filters."}</div>}
+      </section>
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\settings\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\settings\\page.tsx"
new file mode 100644
index 0000000..dd19821
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\settings\\page.tsx"
@@ -0,0 +1,48 @@
+import { notFound } from "next/navigation";
+
+import { SettingEditor } from "@/components/management/management-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+
+export default async function SettingsPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "settings.read");
+  const settings = await service.listSettings(context);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "设置" : "Settings"}</h1>
+          <p>{locale === "zh" ? "公司、币种、税务、银行、模板、目录和备份配置。" : "Company, currencies, taxes, banking, templates, catalogs, and backups."}</p>
+        </div>
+      </header>
+      {settings.length ? (
+        <section className="record-grid settings-grid">
+          {settings.map((setting) => (
+            <article className="record-card" key={setting.id}>
+              <strong>{setting.namespace}.{setting.key}</strong>
+              <small>v{setting.version}{setting.isSecret ? " · secret" : ""}</small>
+              {can(context, "settings.update") ? (
+                <SettingEditor locale={locale} setting={setting} />
+              ) : (
+                <pre>{JSON.stringify(setting.value, null, 2)}</pre>
+              )}
+            </article>
+          ))}
+        </section>
+      ) : <section className="card empty-state">{locale === "zh" ? "暂无设置。" : "No settings configured."}</section>}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\activity-logs\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\activity-logs\\page.tsx"
new file mode 100644
index 0000000..d6fbdfc
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\activity-logs\\page.tsx"
@@ -0,0 +1,66 @@
+import { notFound } from "next/navigation";
+
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+export const dynamic = "force-dynamic";
+const service = new ManagementService();
+
+export default async function ActivityLogsPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<Record<string, string | undefined>>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "audit.read");
+  const query = await searchParams;
+  const logs = await service.listActivityLogs({
+    actorId: query.actorId,
+    action: query.action,
+    entityType: query.entityType,
+    entityId: query.entityId,
+    from: query.from ? new Date(query.from) : undefined,
+    to: query.to ? new Date(query.to) : undefined,
+  });
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "活动日志" : "Activity logs"}</h1>
+          <p>{locale === "zh" ? "只读审计记录；敏感字段已脱敏。" : "Read-only audit history with sensitive fields redacted."}</p>
+        </div>
+      </header>
+      <form className="filter-bar">
+        <input defaultValue={query.action} name="action" placeholder="Action" />
+        <input defaultValue={query.entityType} name="entityType" placeholder="Entity type" />
+        <input defaultValue={query.entityId} name="entityId" placeholder="Entity ID" />
+        <input defaultValue={query.actorId} name="actorId" placeholder="Actor ID" />
+        <input defaultValue={query.from} name="from" type="date" />
+        <input defaultValue={query.to} name="to" type="date" />
+        <button className="button" type="submit">{locale === "zh" ? "筛选" : "Filter"}</button>
+      </form>
+      {logs.length ? (
+        <section className="activity-list">
+          {logs.map((log) => (
+            <details className="card section-card" key={log.id}>
+              <summary>{log.createdAt.toLocaleString(locale)} · {log.action} · {log.entityType} {log.entityId ?? ""}</summary>
+              <p>{log.actor?.name ?? "System"} · {log.actor?.email ?? ""}</p>
+              <div className="two-column">
+                <pre>{JSON.stringify(log.before, null, 2)}</pre>
+                <pre>{JSON.stringify(log.after, null, 2)}</pre>
+              </div>
+              {log.metadata ? <pre>{JSON.stringify(log.metadata, null, 2)}</pre> : null}
+            </details>
+          ))}
+        </section>
+      ) : <section className="card empty-state">{locale === "zh" ? "没有匹配的日志。" : "No matching activity logs."}</section>}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\route.ts"
new file mode 100644
index 0000000..9dcad97
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\route.ts"
@@ -0,0 +1,30 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { ticketSchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "after_sales.read");
+    return success(await service.listTickets());
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "after_sales.create");
+    return success(
+      await service.createTicket(context, ticketSchema.parse(await request.json())),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\[id]\\route.ts"
new file mode 100644
index 0000000..94c3411
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tickets\\[id]\\route.ts"
@@ -0,0 +1,26 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { ticketUpdateSchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "after_sales.update");
+    return success(
+      await service.updateTicket(
+        context,
+        (await params).id,
+        ticketUpdateSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\route.ts"
new file mode 100644
index 0000000..af40c58
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\route.ts"
@@ -0,0 +1,30 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { taskSchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "task.read");
+    return success(await service.listTasks(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "task.create");
+    return success(
+      await service.createTask(context, taskSchema.parse(await request.json())),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\[id]\\route.ts"
new file mode 100644
index 0000000..a490977
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\tasks\\[id]\\route.ts"
@@ -0,0 +1,26 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { taskUpdateSchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "task.update");
+    return success(
+      await service.updateTask(
+        context,
+        (await params).id,
+        taskUpdateSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\route.ts"
new file mode 100644
index 0000000..d99ae11
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\route.ts"
@@ -0,0 +1,14 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    return success(await service.listNotifications(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\read\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\read\\route.ts"
new file mode 100644
index 0000000..e8ece08
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\notifications\\read\\route.ts"
@@ -0,0 +1,18 @@
+import { z } from "zod";
+
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+const schema = z.object({ ids: z.array(z.string().uuid()).optional() });
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    const { ids } = schema.parse(await request.json());
+    return success(await service.markNotificationsRead(context, ids));
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\reports\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\reports\\route.ts"
new file mode 100644
index 0000000..0563393
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\reports\\route.ts"
@@ -0,0 +1,57 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { reportQuerySchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+import { toCsv, toSimplePdf } from "@/modules/management/reporting";
+
+const service = new ManagementService();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "report.read");
+    const url = new URL(request.url);
+    const query = reportQuerySchema.parse({
+      type: url.searchParams.get("type") ?? "sales",
+      format: url.searchParams.get("format") ?? "json",
+      from: url.searchParams.get("from") ?? undefined,
+      to: url.searchParams.get("to") ?? undefined,
+      ownerId: url.searchParams.get("ownerId") ?? undefined,
+    });
+    const report = await service.report(context, query);
+    if (query.format === "json") return success(report);
+
+    const name = `${query.type}-report`;
+    if (query.format === "pdf") {
+      const body = toSimplePdf(
+        [
+          `${query.type.toUpperCase()} REPORT`,
+          `Generated: ${report.generatedAt.toISOString()}`,
+          "",
+          ...report.rows.map((row) =>
+            Object.values(row).map(String).join(" | "),
+          ),
+        ].join("\n"),
+      );
+      return new Response(body, {
+        headers: {
+          "Content-Type": "application/pdf",
+          "Content-Disposition": `attachment; filename="${name}.pdf"`,
+        },
+      });
+    }
+    const csv = `\uFEFF${toCsv(report.rows)}`;
+    return new Response(csv, {
+      headers: {
+        "Content-Type":
+          query.format === "excel"
+            ? "application/vnd.ms-excel; charset=utf-8"
+            : "text/csv; charset=utf-8",
+        "Content-Disposition": `attachment; filename="${name}.${query.format === "excel" ? "xls" : "csv"}"`,
+      },
+    });
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\settings\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\settings\\route.ts"
new file mode 100644
index 0000000..4742936
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\settings\\route.ts"
@@ -0,0 +1,32 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { settingsUpdateSchema } from "@/modules/management/management-schemas";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "settings.read");
+    return success(await service.listSettings(context));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function PUT(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "settings.update");
+    return success(
+      await service.updateSetting(
+        context,
+        settingsUpdateSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\activity-logs\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\activity-logs\\route.ts"
new file mode 100644
index 0000000..98bb0f8
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\activity-logs\\route.ts"
@@ -0,0 +1,26 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { ManagementService } from "@/modules/management/management-service";
+
+const service = new ManagementService();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "audit.read");
+    const params = new URL(request.url).searchParams;
+    return success(
+      await service.listActivityLogs({
+        actorId: params.get("actorId") ?? undefined,
+        action: params.get("action") ?? undefined,
+        entityType: params.get("entityType") ?? undefined,
+        entityId: params.get("entityId") ?? undefined,
+        from: params.get("from") ? new Date(params.get("from")!) : undefined,
+        to: params.get("to") ? new Date(params.get("to")!) : undefined,
+      }),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\backup.ps1" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\backup.ps1"
new file mode 100644
index 0000000..d0904f0
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\backup.ps1"
@@ -0,0 +1,44 @@
+param(
+  [string]$BackupRoot = $(if ($env:BACKUP_ROOT) { $env:BACKUP_ROOT } else { ".\backups" }),
+  [int]$RetentionDays = $(if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 })
+)
+
+$ErrorActionPreference = "Stop"
+if (-not $env:DATABASE_URL) { throw "DATABASE_URL is required." }
+if (-not $env:MINIO_ENDPOINT -or -not $env:MINIO_ACCESS_KEY -or -not $env:MINIO_SECRET_KEY) {
+  throw "MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY are required."
+}
+
+$root = [System.IO.Path]::GetFullPath($BackupRoot)
+New-Item -ItemType Directory -Force -Path $root | Out-Null
+$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
+$target = Join-Path $root $stamp
+New-Item -ItemType Directory -Force -Path $target | Out-Null
+
+if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw "pg_dump is not installed or not on PATH." }
+if (-not (Get-Command mc -ErrorAction SilentlyContinue)) { throw "MinIO client 'mc' is not installed or not on PATH." }
+
+& pg_dump --format=custom --file=(Join-Path $target "postgres.dump") $env:DATABASE_URL
+if ($LASTEXITCODE -ne 0) { throw "PostgreSQL backup failed." }
+
+$endpoint = $env:MINIO_ENDPOINT.TrimEnd("/")
+& mc alias set atlas-backup $endpoint $env:MINIO_ACCESS_KEY $env:MINIO_SECRET_KEY
+if ($LASTEXITCODE -ne 0) { throw "MinIO alias configuration failed." }
+$bucket = if ($env:MINIO_BUCKET) { $env:MINIO_BUCKET } else { "atlas-files" }
+& mc mirror --overwrite "atlas-backup/$bucket" (Join-Path $target "minio")
+if ($LASTEXITCODE -ne 0) { throw "MinIO backup failed." }
+
+$manifest = @{
+  createdAt = (Get-Date).ToUniversalTime().ToString("o")
+  database = "postgres.dump"
+  minioBucket = $bucket
+  retentionDays = $RetentionDays
+} | ConvertTo-Json
+Set-Content -LiteralPath (Join-Path $target "manifest.json") -Value $manifest -Encoding utf8
+
+$cutoff = (Get-Date).ToUniversalTime().AddDays(-$RetentionDays)
+Get-ChildItem -LiteralPath $root -Directory |
+  Where-Object { $_.LastWriteTimeUtc -lt $cutoff -and $_.FullName.StartsWith($root) } |
+  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }
+
+Write-Host "Backup completed: $target"
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\restore.ps1" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\restore.ps1"
new file mode 100644
index 0000000..e2ffa5b
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\scripts\\restore.ps1"
@@ -0,0 +1,35 @@
+param(
+  [Parameter(Mandatory = $true)]
+  [string]$BackupPath,
+  [switch]$ConfirmRestore
+)
+
+$ErrorActionPreference = "Stop"
+if (-not $ConfirmRestore) {
+  throw "Restore is destructive. Re-run with -ConfirmRestore after verifying the target environment."
+}
+if (-not $env:DATABASE_URL) { throw "DATABASE_URL is required." }
+if (-not $env:MINIO_ENDPOINT -or -not $env:MINIO_ACCESS_KEY -or -not $env:MINIO_SECRET_KEY) {
+  throw "MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY are required."
+}
+
+$source = [System.IO.Path]::GetFullPath($BackupPath)
+$databaseDump = Join-Path $source "postgres.dump"
+$minioBackup = Join-Path $source "minio"
+if (-not (Test-Path -LiteralPath $databaseDump -PathType Leaf)) { throw "postgres.dump was not found." }
+if (-not (Test-Path -LiteralPath $minioBackup -PathType Container)) { throw "MinIO backup directory was not found." }
+if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) { throw "pg_restore is not installed or not on PATH." }
+if (-not (Get-Command mc -ErrorAction SilentlyContinue)) { throw "MinIO client 'mc' is not installed or not on PATH." }
+
+& pg_restore --clean --if-exists --no-owner --dbname=$env:DATABASE_URL $databaseDump
+if ($LASTEXITCODE -ne 0) { throw "PostgreSQL restore failed." }
+
+$endpoint = $env:MINIO_ENDPOINT.TrimEnd("/")
+& mc alias set atlas-restore $endpoint $env:MINIO_ACCESS_KEY $env:MINIO_SECRET_KEY
+if ($LASTEXITCODE -ne 0) { throw "MinIO alias configuration failed." }
+$bucket = if ($env:MINIO_BUCKET) { $env:MINIO_BUCKET } else { "atlas-files" }
+& mc mb --ignore-existing "atlas-restore/$bucket"
+& mc mirror --overwrite --remove $minioBackup "atlas-restore/$bucket"
+if ($LASTEXITCODE -ne 0) { throw "MinIO restore failed." }
+
+Write-Host "Restore completed from: $source"
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\operations\\backup-restore.md" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\operations\\backup-restore.md"
new file mode 100644
index 0000000..1c5f36c
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\operations\\backup-restore.md"
@@ -0,0 +1,36 @@
+# Backup and Restore Runbook
+
+Atlas backups contain a PostgreSQL custom-format dump, a mirror of the configured MinIO bucket, and a JSON manifest. Run backups from a trusted operator host with PostgreSQL client tools and the MinIO client (`mc`) installed.
+
+## Configuration
+
+Set `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and optionally `MINIO_BUCKET`, `BACKUP_ROOT`, and `BACKUP_RETENTION_DAYS`. The default bucket is `atlas-files`; the default retention is 30 days.
+
+## Backup
+
+```powershell
+.\scripts\backup.ps1
+```
+
+The script creates `BACKUP_ROOT/<UTC timestamp>/postgres.dump`, `minio/`, and `manifest.json`. It removes timestamp directories older than the retention period only after resolving them beneath the backup root. Copy completed backups to separate encrypted storage and monitor both the script exit code and backup age.
+
+## Restore
+
+Restores replace database objects and mirror the stored bucket, including removal of objects not present in the backup. Stop the web and worker first, confirm the target connection strings, and run:
+
+```powershell
+.\scripts\restore.ps1 -BackupPath .\backups\20260720T020000Z -ConfirmRestore
+```
+
+After restore, run `pnpm prisma:generate`, start the application, sign in with a non-production recovery account, and verify customer, order, attachment, ticket, and audit-log samples.
+
+## Quarterly restore drill
+
+1. Select the newest completed backup and record its timestamp and manifest.
+2. Restore into an isolated PostgreSQL database and MinIO bucket, never the live targets.
+3. Verify migration history, table counts, one attachment checksum/download, one ticket relation, and one audit event.
+4. Start web and worker against the isolated targets and complete login plus a read-only smoke test.
+5. Record recovery point (backup age), recovery duration, discrepancies, and corrective actions.
+6. Destroy the isolated drill environment and retain the drill record for one year.
+
+Never treat an untested backup as recoverable.
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\superpowers\\plans\\2026-07-20-management-closeout.md" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\superpowers\\plans\\2026-07-20-management-closeout.md"
new file mode 100644
index 0000000..657b8e7
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\docs\\superpowers\\plans\\2026-07-20-management-closeout.md"
@@ -0,0 +1,115 @@
+# Management Closeout Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion. Do not commit because the shared worktree contains prior uncommitted work.
+
+**Goal:** Deliver the final support, productivity, reporting, settings, notification, operations, and documentation slice with functional RBAC-aware APIs and pages.
+
+**Architecture:** Extend the existing Prisma management records, then add one focused `management` module whose domain helpers stay database-independent and whose service owns transactional persistence, auditing, scoping, and presentation. Route Handlers and locale pages remain thin adapters. Graphile Worker calls an idempotent reminder task implemented behind a repository boundary.
+
+**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, Decimal.js, Graphile Worker, Vitest.
+
+## Global Constraints
+
+- Preserve unrelated uncommitted changes.
+- Follow existing `currentAuthorizationContext`, `requirePermission`, `failure`/`success`, Prisma transaction, audit, and page styles.
+- Write and run failing tests before production implementation.
+- Keep sensitive settings and audit values redacted.
+- Do not create a git commit.
+
+---
+
+### Task 1: Domain contracts and regression tests
+
+**Files:**
+- Create: `src/modules/management/management-domain.test.ts`
+- Create: `src/modules/management/management-domain.ts`
+- Create: `src/modules/management/management-schemas.test.ts`
+- Create: `src/modules/management/management-schemas.ts`
+- Create: `src/modules/management/reporting.test.ts`
+- Create: `src/modules/management/reporting.ts`
+- Create: `src/modules/management/reminders.test.ts`
+- Create: `src/modules/management/reminders.ts`
+
+**Interfaces:**
+- Produces ticket/task transition guards, overdue derivation, sensitive-value redaction, report scope/calculation/export, settings schemas, and idempotent reminder processing.
+
+- [ ] Write failing tests for every required core behavior.
+- [ ] Run focused tests and confirm missing-module failures.
+- [ ] Implement the minimal pure functions and schemas.
+- [ ] Run focused tests and confirm they pass.
+
+### Task 2: Persistence and HTTP surface
+
+**Files:**
+- Modify: `prisma/schema.prisma`
+- Create: `prisma/migrations/20260720030000_management_closeout/migration.sql`
+- Create: `src/modules/management/management-service.ts`
+- Create: `src/app/api/tickets/route.ts`
+- Create: `src/app/api/tickets/[id]/route.ts`
+- Create: `src/app/api/tasks/route.ts`
+- Create: `src/app/api/tasks/[id]/route.ts`
+- Create: `src/app/api/notifications/route.ts`
+- Create: `src/app/api/notifications/read/route.ts`
+- Create: `src/app/api/reports/route.ts`
+- Create: `src/app/api/settings/route.ts`
+- Create: `src/app/api/activity-logs/route.ts`
+
+**Interfaces:**
+- Consumes the Task 1 domain/schemas.
+- Produces authenticated RBAC-aware list, create, update/transition, read, export, settings, and audit endpoints.
+
+- [ ] Extend ticket/task/notification relations and dedupe metadata.
+- [ ] Implement transactional audited ticket, task, and settings mutations.
+- [ ] Implement ownership-aware reads and permission-aware reporting.
+- [ ] Implement read-only redacted activity-log filtering.
+
+### Task 3: Functional locale pages and navigation
+
+**Files:**
+- Create: `src/components/management/management-forms.tsx`
+- Create: `src/app/[locale]/(app)/tickets/page.tsx`
+- Create: `src/app/[locale]/(app)/tasks/page.tsx`
+- Create: `src/app/[locale]/(app)/notifications/page.tsx`
+- Create: `src/app/[locale]/(app)/reports/page.tsx`
+- Create: `src/app/[locale]/(app)/settings/page.tsx`
+- Create: `src/app/[locale]/(app)/activity-logs/page.tsx`
+- Modify: `src/components/app-shell.tsx`
+- Modify: `src/app/globals.css`
+
+**Interfaces:**
+- Consumes management service reads and API endpoints.
+- Produces list/Kanban/calendar task views, ticket workflow, notification actions, report exports, settings editor, and audit detail.
+
+- [ ] Add pages with real database data and accurate empty states.
+- [ ] Add permission-aware mutation forms and real links.
+- [ ] Add navigation entries and notification unread count.
+
+### Task 4: Worker, operations, seed, and documentation
+
+**Files:**
+- Modify: `src/worker.ts`
+- Create: `scripts/backup.ps1`
+- Create: `scripts/restore.ps1`
+- Create: `docs/operations/backup-restore.md`
+- Modify: `.env.example`
+- Modify: `prisma/seed.ts`
+- Modify: `README.md`
+
+**Interfaces:**
+- Consumes idempotent reminder processing.
+- Produces scheduled/retryable reminders, PostgreSQL/MinIO backup and restore operations, deterministic ticket/task samples, and operator documentation.
+
+- [ ] Register reminder generation and a recurring schedule.
+- [ ] Add retention-aware backups and explicit restore confirmation.
+- [ ] Seed requested management records/settings.
+- [ ] Complete setup, deployment, accounts, backup, and troubleshooting documentation.
+
+### Task 5: Verification and report
+
+**Files:**
+- Create: `.superpowers/sdd/task-5-report.md`
+
+- [ ] Run focused management tests.
+- [ ] Run full Vitest suite.
+- [ ] Run Prisma generation, TypeScript, ESLint, build, and Compose validation.
+- [ ] Review changed files against every requirement and record gaps/concerns.
