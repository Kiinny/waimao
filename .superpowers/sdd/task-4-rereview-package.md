# Task 4 rereview package

## Tracked changes

diff --git a/compose.yaml b/compose.yaml
index f7f6f2a..a90792e 100644
--- a/compose.yaml
+++ b/compose.yaml
@@ -2,20 +2,22 @@ name: atlas-crm
 
 services:
   postgres:
     image: postgres:17-bookworm
     environment:
       POSTGRES_DB: foreign_trade_crm
       POSTGRES_USER: crm
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-crm_dev_password}
     volumes:
       - postgres-data:/var/lib/postgresql/data
+    ports:
+      - "55432:5432"
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U crm -d foreign_trade_crm"]
       interval: 5s
       timeout: 5s
       retries: 10
     restart: unless-stopped
 
   minio:
     image: minio/minio:RELEASE.2025-04-22T22-12-26Z
     command: server /data --console-address ":9001"
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 532e75c..ff066f6 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -367,49 +367,50 @@ model ProductCategory {
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
 
   @@index([categoryId, status, deletedAt])
 }
 
 model ProductVariant {
   id                   String    @id @default(uuid()) @db.Uuid
   productId            String    @db.Uuid
   sku                  String    @unique
   name                 String
   configurationVersion Int       @default(1)
@@ -637,35 +638,46 @@ model Cost {
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
@@ -682,49 +694,61 @@ model PurchaseOrder {
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
@@ -758,110 +782,165 @@ model InventoryItem {
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
   id           String      @id @default(uuid()) @db.Uuid
   ticketNumber String      @unique
   customerId   String      @db.Uuid
   salesOrderId String?     @db.Uuid
   assignedToId String?     @db.Uuid
   subject      String
   description  String
@@ -912,33 +991,34 @@ model Notification {
   message   String
   link      String?
   readAt    DateTime?
   createdAt DateTime  @default(now())
   user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
 
   @@index([userId, readAt, createdAt])
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
index a09619c..d60f4c1 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -45,20 +45,21 @@ const permissions = [
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
@@ -886,19 +887,245 @@ async function main() {
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
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 14dd4a4..ab2ff2e 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -16,20 +16,25 @@ export function AppShell({
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
     ["users", "U", dictionary.nav.users],
     ["roles", "R", dictionary.nav.roles],
   ] as const;
   const targetLocale = locale === "en" ? "zh" : "en";
   const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }

## New task files

diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720010000_procurement_fulfillment_review_fixes\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720010000_procurement_fulfillment_review_fixes\\migration.sql"
new file mode 100644
index 0000000..2dacced
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260720010000_procurement_fulfillment_review_fixes\\migration.sql"
@@ -0,0 +1,118 @@
+-- Incremental Task 4 procurement and fulfillment fields.
+ALTER TABLE "Supplier"
+  ADD COLUMN "supplierType" TEXT NOT NULL DEFAULT 'DISTRIBUTOR',
+  ADD COLUMN "website" TEXT,
+  ADD COLUMN "taxId" TEXT,
+  ADD COLUMN "paymentTerms" TEXT,
+  ADD COLUMN "leadTimeDays" INTEGER,
+  ADD COLUMN "minimumOrderValue" DECIMAL(19,4),
+  ADD COLUMN "rating" INTEGER,
+  ADD COLUMN "bankName" TEXT,
+  ADD COLUMN "bankAccountName" TEXT,
+  ADD COLUMN "bankAccountNumber" TEXT,
+  ADD COLUMN "notes" TEXT;
+
+ALTER TABLE "PurchaseOrder"
+  ADD COLUMN "paymentTerms" TEXT,
+  ADD COLUMN "shippingTerms" TEXT,
+  ADD COLUMN "incoterm" TEXT,
+  ADD COLUMN "deliveryAddress" JSONB,
+  ADD COLUMN "notes" TEXT,
+  ADD COLUMN "attachments" JSONB,
+  ADD COLUMN "receivedAt" TIMESTAMP(3);
+
+ALTER TABLE "PurchaseOrderItem"
+  ADD COLUMN "productId" UUID,
+  ADD COLUMN "productSnapshot" JSONB,
+  ADD COLUMN "configurationSnapshot" JSONB;
+
+ALTER TABLE "InventoryTransaction"
+  ADD COLUMN "inventorySerialId" UUID;
+
+ALTER TABLE "QualityInspection"
+  ADD COLUMN "inventorySerialId" UUID;
+
+ALTER TABLE "Shipment"
+  ADD COLUMN "method" TEXT NOT NULL DEFAULT 'AIR',
+  ADD COLUMN "originPort" TEXT,
+  ADD COLUMN "destinationPort" TEXT,
+  ADD COLUMN "grossWeightKg" DECIMAL(19,4),
+  ADD COLUMN "volumeCbm" DECIMAL(19,4),
+  ADD COLUMN "freightCost" DECIMAL(19,4),
+  ADD COLUMN "freightCurrencyCode" TEXT,
+  ADD COLUMN "freightExchangeRateToUsd" DECIMAL(24,12),
+  ADD COLUMN "freightCostUsd" DECIMAL(19,4),
+  ADD COLUMN "estimatedDepartureAt" TIMESTAMP(3),
+  ADD COLUMN "estimatedArrivalAt" TIMESTAMP(3);
+
+-- Existing Task 4 seed shipments are backfilled to the matching inventory row
+-- before the relation becomes required.
+ALTER TABLE "ShipmentItem" ADD COLUMN "inventoryItemId" UUID;
+UPDATE "ShipmentItem"
+SET "inventoryItemId" = (
+  SELECT ii.id
+  FROM "SalesOrderItem" soi
+  JOIN "InventoryItem" ii ON ii."productId" = soi."productId"
+  WHERE soi.id = "ShipmentItem"."salesOrderItemId" AND ii."deletedAt" IS NULL
+  ORDER BY ii."createdAt"
+  LIMIT 1
+);
+
+-- If legacy data has no product-linked stock row, preserve the migration and
+-- let the workflow reject transitions until an operator assigns inventory.
+-- New writes always require inventoryItemId through the application contract.
+
+CREATE TABLE "ShipmentSerial" (
+  "id" UUID NOT NULL,
+  "shipmentItemId" UUID NOT NULL,
+  "inventorySerialId" UUID NOT NULL,
+  "status" TEXT NOT NULL DEFAULT 'RESERVED',
+  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  "issuedAt" TIMESTAMP(3),
+  "releasedAt" TIMESTAMP(3),
+  "returnedAt" TIMESTAMP(3),
+  CONSTRAINT "ShipmentSerial_pkey" PRIMARY KEY ("id")
+);
+
+CREATE TABLE "ShipmentDocument" (
+  "id" UUID NOT NULL,
+  "shipmentId" UUID NOT NULL,
+  "fileAssetId" UUID NOT NULL,
+  "documentType" TEXT NOT NULL,
+  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  CONSTRAINT "ShipmentDocument_pkey" PRIMARY KEY ("id")
+);
+
+CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");
+CREATE INDEX "InventoryTransaction_inventorySerialId_occurredAt_idx" ON "InventoryTransaction"("inventorySerialId", "occurredAt");
+CREATE INDEX "QualityInspection_inventorySerialId_status_idx" ON "QualityInspection"("inventorySerialId", "status");
+CREATE INDEX "ShipmentItem_inventoryItemId_idx" ON "ShipmentItem"("inventoryItemId");
+CREATE UNIQUE INDEX "ShipmentSerial_shipmentItemId_inventorySerialId_key" ON "ShipmentSerial"("shipmentItemId", "inventorySerialId");
+CREATE INDEX "ShipmentSerial_inventorySerialId_status_idx" ON "ShipmentSerial"("inventorySerialId", "status");
+CREATE UNIQUE INDEX "ShipmentDocument_shipmentId_fileAssetId_documentType_key" ON "ShipmentDocument"("shipmentId", "fileAssetId", "documentType");
+CREATE INDEX "ShipmentDocument_fileAssetId_idx" ON "ShipmentDocument"("fileAssetId");
+
+ALTER TABLE "PurchaseOrderItem"
+  ADD CONSTRAINT "PurchaseOrderItem_productId_fkey"
+  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+ALTER TABLE "InventoryTransaction"
+  ADD CONSTRAINT "InventoryTransaction_inventorySerialId_fkey"
+  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+ALTER TABLE "QualityInspection"
+  ADD CONSTRAINT "QualityInspection_inventorySerialId_fkey"
+  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+ALTER TABLE "ShipmentItem"
+  ADD CONSTRAINT "ShipmentItem_inventoryItemId_fkey"
+  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+ALTER TABLE "ShipmentSerial"
+  ADD CONSTRAINT "ShipmentSerial_shipmentItemId_fkey"
+  FOREIGN KEY ("shipmentItemId") REFERENCES "ShipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+ALTER TABLE "ShipmentSerial"
+  ADD CONSTRAINT "ShipmentSerial_inventorySerialId_fkey"
+  FOREIGN KEY ("inventorySerialId") REFERENCES "InventorySerial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+ALTER TABLE "ShipmentDocument"
+  ADD CONSTRAINT "ShipmentDocument_shipmentId_fkey"
+  FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+ALTER TABLE "ShipmentDocument"
+  ADD CONSTRAINT "ShipmentDocument_fileAssetId_fkey"
+  FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts"
new file mode 100644
index 0000000..fdbd2fd
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts"
@@ -0,0 +1,234 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertInspectionResult,
+  assertPurchaseOrderQuantities,
+  assertPurchaseOrderLineOwnership,
+  assertPurchaseOrderTransition,
+  assertShipmentTransition,
+  aggregateInventoryReservations,
+  deriveShipmentOrderState,
+  inventoryBalanceAfter,
+  inspectionPassesShipmentGate,
+  nextSerialStatus,
+  remainingShippableQuantity,
+} from "@/modules/procurement/procurement-domain";
+
+describe("procurement fulfillment domain", () => {
+  it("allows purchase orders to advance through the receiving lifecycle", () => {
+    expect(() => assertPurchaseOrderTransition("DRAFT", "APPROVED")).not.toThrow();
+    expect(() => assertPurchaseOrderTransition("APPROVED", "RECEIVED")).toThrow(
+      "Purchase order cannot move",
+    );
+  });
+
+  it("never lets an inventory issue or reservation exceed on-hand stock", () => {
+    expect(inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "RESERVATION", 2)).toEqual({
+      onHand: 3,
+      reserved: 3,
+    });
+    expect(() => inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "ISSUE", 3)).toThrow(
+      "available inventory",
+    );
+  });
+
+  it("requires a completed checklist for a passing inspection", () => {
+    expect(() => assertInspectionResult("PASSED", {})).toThrow("checklist");
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: false })).toThrow(
+      "checklist",
+    );
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: true })).not.toThrow();
+  });
+
+  it("accepts only a latest passing inspection with a non-empty completed checklist", () => {
+    expect(
+      inspectionPassesShipmentGate({
+        status: "PASSED",
+        checklist: { appearance: true, burnIn: true, evidence: [] },
+      }),
+    ).toBe(true);
+    expect(
+      inspectionPassesShipmentGate({
+        status: "PASSED",
+        checklist: { evidence: [] },
+      }),
+    ).toBe(false);
+    expect(
+      inspectionPassesShipmentGate({
+        status: "FAILED",
+        checklist: { appearance: true, burnIn: true },
+      }),
+    ).toBe(false);
+  });
+
+  it("synchronizes only valid shipment transitions", () => {
+    expect(() => assertShipmentTransition("BOOKED", "IN_TRANSIT")).not.toThrow();
+    expect(() => assertShipmentTransition("IN_TRANSIT", "CANCELLED")).toThrow(
+      "Shipment cannot move",
+    );
+    expect(() => assertShipmentTransition("DRAFT", "DELIVERED")).toThrow(
+      "Shipment cannot move",
+    );
+  });
+
+  it("requires one serial for every serialized stock mutation", () => {
+    expect(() =>
+      nextSerialStatus({
+        mutation: "RESERVATION",
+        serialized: true,
+        quantity: 1,
+        serialNumber: undefined,
+        currentStatus: undefined,
+      }),
+    ).toThrow("Serial number is required");
+    expect(() =>
+      nextSerialStatus({
+        mutation: "COUNT",
+        serialized: true,
+        quantity: 1,
+        serialNumber: "GPU-001",
+        currentStatus: "AVAILABLE",
+      }),
+    ).toThrow("not supported");
+  });
+
+  it("moves serialized inventory through reservation, release, issue and return states", () => {
+    expect(
+      nextSerialStatus({
+        mutation: "RESERVATION",
+        serialized: true,
+        quantity: 1,
+        serialNumber: "GPU-001",
+        currentStatus: "AVAILABLE",
+      }),
+    ).toBe("RESERVED");
+    expect(
+      nextSerialStatus({
+        mutation: "RELEASE",
+        serialized: true,
+        quantity: 1,
+        serialNumber: "GPU-001",
+        currentStatus: "RESERVED",
+      }),
+    ).toBe("AVAILABLE");
+    expect(
+      nextSerialStatus({
+        mutation: "ISSUE",
+        serialized: true,
+        quantity: 1,
+        serialNumber: "GPU-001",
+        currentStatus: "RESERVED",
+      }),
+    ).toBe("ISSUED");
+    expect(
+      nextSerialStatus({
+        mutation: "RETURN",
+        serialized: true,
+        quantity: 1,
+        serialNumber: "GPU-001",
+        currentStatus: "ISSUED",
+      }),
+    ).toBe("AVAILABLE");
+  });
+
+  it("consumes a reserved unit when the outbound issue names a reserved serial", () => {
+    expect(
+      inventoryBalanceAfter({ onHand: 3, reserved: 2 }, "ISSUE", 1, {
+        consumeReserved: true,
+      }),
+    ).toEqual({ onHand: 2, reserved: 1 });
+  });
+
+  it("rejects purchase-order lines from another sales order", () => {
+    expect(() =>
+      assertPurchaseOrderLineOwnership(
+        "order-a",
+        [{ id: "line-a", salesOrderId: "order-a" }],
+        ["line-a"],
+      ),
+    ).not.toThrow();
+    expect(() =>
+      assertPurchaseOrderLineOwnership(
+        "order-a",
+        [{ id: "line-b", salesOrderId: "order-b" }],
+        ["line-b"],
+      ),
+    ).toThrow("does not belong");
+  });
+
+  it("aggregates duplicate sibling purchase lines before enforcing the order limit", () => {
+    expect(() =>
+      assertPurchaseOrderQuantities(
+        [{ id: "line-a", quantity: 2 }],
+        [{ salesOrderItemId: "line-a", quantity: 1 }],
+        [
+          { salesOrderItemId: "line-a", quantity: 1 },
+          { salesOrderItemId: "line-a", quantity: 1 },
+        ],
+      ),
+    ).toThrow("exceeds sales order item line-a");
+
+    expect(() =>
+      assertPurchaseOrderQuantities(
+        [{ id: "line-a", quantity: 3 }],
+        [{ salesOrderItemId: "line-a", quantity: 1 }],
+        [
+          { salesOrderItemId: "line-a", quantity: 1 },
+          { salesOrderItemId: "line-a", quantity: 1 },
+        ],
+      ),
+    ).not.toThrow();
+  });
+
+  it("prevents cumulative overshipment across active shipments", () => {
+    expect(remainingShippableQuantity(3, [1, 1])).toBe(1);
+    expect(() => remainingShippableQuantity(3, [2, 2])).toThrow(
+      "exceeds the sales order",
+    );
+  });
+
+  it("aggregates reservations against one inventory version", () => {
+    expect(
+      aggregateInventoryReservations(
+        { stock: { onHand: 3, reserved: 0 } },
+        [
+          { inventoryItemId: "stock", quantity: 1 },
+          { inventoryItemId: "stock", quantity: 2 },
+        ],
+      ),
+    ).toEqual({ stock: { onHand: 3, reserved: 3 } });
+    expect(() =>
+      aggregateInventoryReservations(
+        { stock: { onHand: 3, reserved: 0 } },
+        [
+          { inventoryItemId: "stock", quantity: 2 },
+          { inventoryItemId: "stock", quantity: 2 },
+        ],
+      ),
+    ).toThrow("available inventory");
+  });
+
+  it("derives partial, shipped and delivered order synchronization", () => {
+    const orderItems = [
+      { id: "a", quantity: 2 },
+      { id: "b", quantity: 1 },
+    ];
+    expect(
+      deriveShipmentOrderState(orderItems, [
+        { status: "IN_TRANSIT", salesOrderItemId: "a", quantity: 1 },
+      ]),
+    ).toEqual({ orderStatus: "FULFILLING", shipmentStatus: "PARTIALLY_SHIPPED" });
+    expect(
+      deriveShipmentOrderState(orderItems, [
+        { status: "IN_TRANSIT", salesOrderItemId: "a", quantity: 2 },
+        { status: "IN_TRANSIT", salesOrderItemId: "b", quantity: 1 },
+      ]),
+    ).toEqual({ orderStatus: "SHIPPED", shipmentStatus: "SHIPPED" });
+    expect(
+      deriveShipmentOrderState(orderItems, [
+        { status: "DELIVERED", salesOrderItemId: "a", quantity: 2 },
+        { status: "DELIVERED", salesOrderItemId: "b", quantity: 1 },
+      ]),
+    ).toEqual({ orderStatus: "COMPLETED", shipmentStatus: "DELIVERED" });
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts"
new file mode 100644
index 0000000..c5a2b99
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts"
@@ -0,0 +1,334 @@
+import { DomainError } from "@/lib/errors";
+
+const PURCHASE_ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["APPROVED", "CANCELLED"],
+  APPROVED: ["SENT", "CANCELLED"],
+  SENT: ["CANCELLED"],
+  PARTIALLY_RECEIVED: ["CANCELLED"],
+  RECEIVED: [],
+  CANCELLED: [],
+};
+
+const SHIPMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["BOOKED", "CANCELLED"],
+  BOOKED: ["IN_TRANSIT", "CANCELLED"],
+  IN_TRANSIT: ["DELIVERED"],
+  DELIVERED: [],
+  CANCELLED: [],
+};
+
+export type InventoryMutation =
+  | "RECEIPT"
+  | "ISSUE"
+  | "RESERVATION"
+  | "RELEASE"
+  | "DAMAGE"
+  | "RETURN"
+  | "COUNT";
+
+type SerialStatus = "AVAILABLE" | "RESERVED" | "ISSUED" | "DAMAGED";
+
+export function assertPurchaseOrderTransition(from: string, to: string) {
+  if (!PURCHASE_ORDER_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_PURCHASE_ORDER_TRANSITION",
+      `Purchase order cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function assertShipmentTransition(from: string, to: string) {
+  if (!SHIPMENT_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_SHIPMENT_TRANSITION",
+      `Shipment cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function assertInspectionResult(status: string, checklist: Record<string, boolean>) {
+  if (
+    status === "PASSED" &&
+    (Object.keys(checklist).length === 0 ||
+      Object.values(checklist).some((complete) => !complete))
+  ) {
+    throw new DomainError(
+      "INSPECTION_CHECKLIST_INCOMPLETE",
+      "A passing inspection requires every checklist item to be complete",
+      409,
+    );
+  }
+}
+
+export function inspectionPassesShipmentGate(input: {
+  status: string;
+  checklist: unknown;
+}) {
+  if (
+    input.status !== "PASSED" ||
+    !input.checklist ||
+    typeof input.checklist !== "object" ||
+    Array.isArray(input.checklist)
+  ) {
+    return false;
+  }
+  const completed = Object.values(input.checklist).filter(
+    (value): value is boolean => typeof value === "boolean",
+  );
+  return completed.length > 0 && completed.every(Boolean);
+}
+
+export function inventoryBalanceAfter(
+  current: { onHand: number; reserved: number },
+  type: InventoryMutation,
+  quantity: number,
+  options: { consumeReserved?: boolean } = {},
+) {
+  if (!Number.isInteger(quantity) || quantity <= 0) {
+    throw new DomainError("INVALID_INVENTORY_QUANTITY", "Inventory quantity must be a positive integer");
+  }
+  const available = current.onHand - current.reserved;
+  let onHand = current.onHand;
+  let reserved = current.reserved;
+  switch (type) {
+    case "RECEIPT":
+    case "RETURN": onHand += quantity; break;
+    case "RESERVATION":
+      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
+      reserved += quantity; break;
+    case "RELEASE":
+      if (reserved < quantity) throw new DomainError("INVENTORY_RELEASE_EXCEEDS_RESERVED", "Cannot release more than reserved inventory", 409);
+      reserved -= quantity; break;
+    case "ISSUE":
+      if (options.consumeReserved) {
+        if (reserved < quantity) {
+          throw new DomainError(
+            "INVENTORY_RESERVED_UNAVAILABLE",
+            "Insufficient reserved inventory",
+            409,
+          );
+        }
+        onHand -= quantity;
+        reserved -= quantity;
+        break;
+      }
+      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
+      onHand -= quantity;
+      break;
+    case "DAMAGE":
+      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
+      onHand -= quantity; break;
+    case "COUNT": onHand = quantity; break;
+  }
+  if (onHand < 0 || reserved < 0 || reserved > onHand) {
+    throw new DomainError("INVENTORY_INVARIANT_VIOLATION", "Inventory quantities cannot become negative", 409);
+  }
+  return { onHand, reserved };
+}
+
+export function nextSerialStatus(input: {
+  mutation: InventoryMutation;
+  serialized: boolean;
+  quantity: number;
+  serialNumber?: string;
+  currentStatus?: string;
+}): SerialStatus | undefined {
+  if (!input.serialized) return undefined;
+  if (!input.serialNumber) {
+    throw new DomainError(
+      "SERIAL_REQUIRED",
+      "Serial number is required for serialized inventory",
+      409,
+    );
+  }
+  if (input.quantity !== 1) {
+    throw new DomainError(
+      "INVALID_SERIAL_QUANTITY",
+      "Serialized inventory mutations require exactly one unit",
+      409,
+    );
+  }
+  if (input.mutation === "COUNT") {
+    throw new DomainError(
+      "SERIAL_COUNT_UNSUPPORTED",
+      "Inventory count is not supported for serialized stock; reconcile each serial instead",
+      409,
+    );
+  }
+
+  const expected: Partial<Record<InventoryMutation, string | undefined>> = {
+    RECEIPT: undefined,
+    RESERVATION: "AVAILABLE",
+    RELEASE: "RESERVED",
+    ISSUE: "RESERVED",
+    DAMAGE: "AVAILABLE",
+    RETURN: "ISSUED",
+  };
+  if (input.currentStatus !== expected[input.mutation]) {
+    throw new DomainError(
+      "INVALID_SERIAL_TRANSITION",
+      `Serial ${input.serialNumber} cannot move from ${input.currentStatus ?? "NEW"} using ${input.mutation}`,
+      409,
+    );
+  }
+
+  const next: Partial<Record<InventoryMutation, SerialStatus>> = {
+    RECEIPT: "AVAILABLE",
+    RESERVATION: "RESERVED",
+    RELEASE: "AVAILABLE",
+    ISSUE: "ISSUED",
+    DAMAGE: "DAMAGED",
+    RETURN: "AVAILABLE",
+  };
+  return next[input.mutation];
+}
+
+export function assertPurchaseOrderLineOwnership(
+  salesOrderId: string,
+  orderItems: ReadonlyArray<{ id: string; salesOrderId: string }>,
+  requestedItemIds: readonly string[],
+) {
+  const owned = new Set(
+    orderItems
+      .filter((item) => item.salesOrderId === salesOrderId)
+      .map((item) => item.id),
+  );
+  const foreign = requestedItemIds.find((id) => !owned.has(id));
+  if (foreign) {
+    throw new DomainError(
+      "PURCHASE_ORDER_ITEM_MISMATCH",
+      `Sales order item ${foreign} does not belong to sales order ${salesOrderId}`,
+      409,
+    );
+  }
+}
+
+export function assertPurchaseOrderQuantities(
+  orderItems: ReadonlyArray<{ id: string; quantity: number }>,
+  existingPurchaseItems: ReadonlyArray<{
+    salesOrderItemId: string | null;
+    quantity: number;
+  }>,
+  requestedItems: ReadonlyArray<{
+    salesOrderItemId?: string | null;
+    quantity: number;
+  }>,
+) {
+  const purchasedByLine = new Map<string, number>();
+  for (const item of [...existingPurchaseItems, ...requestedItems]) {
+    if (!item.salesOrderItemId) continue;
+    purchasedByLine.set(
+      item.salesOrderItemId,
+      (purchasedByLine.get(item.salesOrderItemId) ?? 0) + item.quantity,
+    );
+  }
+  for (const orderItem of orderItems) {
+    if ((purchasedByLine.get(orderItem.id) ?? 0) > orderItem.quantity) {
+      throw new DomainError(
+        "PURCHASE_ORDER_OVER_QUANTITY",
+        `Purchase quantity exceeds sales order item ${orderItem.id}`,
+        409,
+      );
+    }
+  }
+}
+
+export function remainingShippableQuantity(
+  orderedQuantity: number,
+  activeShipmentQuantities: readonly number[],
+) {
+  const shippedOrReserved = activeShipmentQuantities.reduce(
+    (total, quantity) => total + quantity,
+    0,
+  );
+  const remaining = orderedQuantity - shippedOrReserved;
+  if (remaining < 0) {
+    throw new DomainError(
+      "SHIPMENT_OVER_QUANTITY",
+      "Cumulative shipment quantity exceeds the sales order",
+      409,
+    );
+  }
+  return remaining;
+}
+
+export function aggregateInventoryReservations(
+  inventory: Readonly<Record<string, { onHand: number; reserved: number }>>,
+  reservations: ReadonlyArray<{ inventoryItemId: string; quantity: number }>,
+) {
+  const projected: Record<string, { onHand: number; reserved: number }> =
+    Object.fromEntries(
+      Object.entries(inventory).map(([id, balance]) => [id, { ...balance }]),
+    );
+  for (const reservation of reservations) {
+    const current = projected[reservation.inventoryItemId];
+    if (!current) {
+      throw new DomainError(
+        "INVENTORY_NOT_FOUND",
+        `Inventory item ${reservation.inventoryItemId} not found`,
+        404,
+      );
+    }
+    projected[reservation.inventoryItemId] = inventoryBalanceAfter(
+      current,
+      "RESERVATION",
+      reservation.quantity,
+    );
+  }
+  return projected;
+}
+
+export function deriveShipmentOrderState(
+  orderItems: ReadonlyArray<{ id: string; quantity: number }>,
+  shipmentItems: ReadonlyArray<{
+    status: string;
+    salesOrderItemId: string;
+    quantity: number;
+  }>,
+): {
+  orderStatus: "FULFILLING" | "SHIPPED" | "COMPLETED";
+  shipmentStatus:
+    | "NOT_STARTED"
+    | "BOOKED"
+    | "PARTIALLY_SHIPPED"
+    | "SHIPPED"
+    | "DELIVERED";
+} {
+  const quantityFor = (orderItemId: string, statuses: readonly string[]) =>
+    shipmentItems
+      .filter(
+        (item) =>
+          item.salesOrderItemId === orderItemId &&
+          statuses.includes(item.status),
+      )
+      .reduce((sum, item) => sum + item.quantity, 0);
+  const allIssued = orderItems.every(
+    (item) =>
+      quantityFor(item.id, ["IN_TRANSIT", "DELIVERED"]) >= item.quantity,
+  );
+  const allDelivered = orderItems.every(
+    (item) => quantityFor(item.id, ["DELIVERED"]) >= item.quantity,
+  );
+  const anyIssued = shipmentItems.some((item) =>
+    ["IN_TRANSIT", "DELIVERED"].includes(item.status),
+  );
+  const anyBooked = shipmentItems.some((item) => item.status === "BOOKED");
+  return {
+    orderStatus: allDelivered
+      ? "COMPLETED"
+      : allIssued
+        ? "SHIPPED"
+        : "FULFILLING",
+    shipmentStatus: allDelivered
+      ? "DELIVERED"
+      : allIssued
+        ? "SHIPPED"
+        : anyIssued
+          ? "PARTIALLY_SHIPPED"
+          : anyBooked
+            ? "BOOKED"
+            : "NOT_STARTED",
+  };
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-postgres.integration.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-postgres.integration.test.ts"
new file mode 100644
index 0000000..d0f3b37
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-postgres.integration.test.ts"
@@ -0,0 +1,437 @@
+import "dotenv/config";
+
+import { randomUUID } from "node:crypto";
+import { afterAll, beforeAll, describe, expect, it } from "vitest";
+
+import { getPrisma } from "@/lib/prisma";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const integration =
+  process.env.RUN_POSTGRES_INTEGRATION === "1" ? describe : describe.skip;
+
+integration("procurement PostgreSQL transactions", () => {
+  const prisma = getPrisma();
+  const service = new ProcurementService();
+  const runId = randomUUID().slice(0, 8);
+  const createdOrderIds: string[] = [];
+  const createdProductIds: string[] = [];
+  const createdInventoryIds: string[] = [];
+  const createdPurchaseOrderIds: string[] = [];
+  const createdShipmentIds: string[] = [];
+  let context: AuthorizationContext;
+  let supplierId: string;
+  let customerId: string;
+  let categoryId: string;
+  let locationId: string;
+  let serializedProductId: string;
+  let concurrentOrderId: string;
+  let concurrentOrderItemId: string;
+  let successfulPurchaseOrderId: string;
+
+  async function createEligibleOrder(suffix: string, quantity: number) {
+    const id = randomUUID();
+    const itemId = randomUUID();
+    createdOrderIds.push(id);
+    return prisma.salesOrder.create({
+      data: {
+        id,
+        orderNumber: `IT-${runId}-${suffix}`,
+        customerId,
+        ownerId: context.userId,
+        status: "PURCHASING",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        total: String(quantity * 100),
+        totalUsd: String(quantity * 100),
+        paymentTerms: "Net 30",
+        paymentStatus: "PAID",
+        purchaseStatus: "PURCHASING",
+        purchaseEligibilityFlag: true,
+        items: {
+          create: {
+            id: itemId,
+            productId: serializedProductId,
+            description: `Integration GPU ${runId}`,
+            configuration: { testRun: runId },
+            quantity,
+            unitPrice: "100",
+            lineTotal: String(quantity * 100),
+          },
+        },
+      },
+      include: { items: true },
+    });
+  }
+
+  beforeAll(async () => {
+    const [actor, category, location] = await Promise.all([
+      prisma.user.findFirstOrThrow({
+        where: { email: "admin@atlascrm.dev", deletedAt: null },
+      }),
+      prisma.productCategory.findFirstOrThrow({ where: { deletedAt: null } }),
+      prisma.warehouseLocation.findFirstOrThrow({
+        where: { warehouse: { deletedAt: null } },
+      }),
+    ]);
+    context = {
+      userId: actor.id,
+      roles: ["SUPER_ADMIN"],
+      permissions: ["*"],
+    };
+    categoryId = category.id;
+    locationId = location.id;
+
+    const customer = await prisma.customer.create({
+      data: {
+        companyName: `Integration Customer ${runId}`,
+        countryCode: "CN",
+        ownerId: actor.id,
+      },
+    });
+    customerId = customer.id;
+
+    const supplier = await prisma.supplier.create({
+      data: {
+        code: `IT-SUP-${runId}`,
+        name: `Integration Supplier ${runId}`,
+        countryCode: "CN",
+      },
+    });
+    supplierId = supplier.id;
+
+    const serializedProduct = await prisma.product.create({
+      data: {
+        sku: `IT-GPU-${runId}`,
+        name: `Integration GPU ${runId}`,
+        categoryId,
+        serialized: true,
+      },
+    });
+    serializedProductId = serializedProduct.id;
+    createdProductIds.push(serializedProduct.id);
+  });
+
+  afterAll(async () => {
+    if (createdShipmentIds.length) {
+      await prisma.shipment.deleteMany({
+        where: { id: { in: createdShipmentIds } },
+      });
+    }
+    if (createdInventoryIds.length) {
+      await prisma.qualityInspection.deleteMany({
+        where: { inventoryItemId: { in: createdInventoryIds } },
+      });
+      await prisma.inventoryTransaction.deleteMany({
+        where: { inventoryItemId: { in: createdInventoryIds } },
+      });
+      await prisma.inventorySerial.deleteMany({
+        where: { inventoryItemId: { in: createdInventoryIds } },
+      });
+      await prisma.inventoryItem.deleteMany({
+        where: { id: { in: createdInventoryIds } },
+      });
+    }
+    if (createdPurchaseOrderIds.length) {
+      await prisma.purchaseOrder.deleteMany({
+        where: { id: { in: createdPurchaseOrderIds } },
+      });
+    }
+    if (createdOrderIds.length) {
+      await prisma.salesOrder.deleteMany({
+        where: { id: { in: createdOrderIds } },
+      });
+    }
+    if (supplierId) {
+      await prisma.supplier.deleteMany({ where: { id: supplierId } });
+    }
+    if (createdProductIds.length) {
+      await prisma.product.deleteMany({
+        where: { id: { in: createdProductIds } },
+      });
+    }
+    if (customerId) {
+      await prisma.customer.deleteMany({ where: { id: customerId } });
+    }
+  });
+
+  it("rejects duplicate sibling PO lines whose aggregate exceeds the sales line", async () => {
+    const order = await createEligibleOrder("SIBLING", 2);
+    await expect(
+      service.createPurchaseOrder(context, {
+        supplierId,
+        salesOrderId: order.id,
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        items: [
+          {
+            salesOrderItemId: order.items[0].id,
+            quantity: 2,
+            unitCost: "60",
+          },
+          {
+            salesOrderItemId: order.items[0].id,
+            quantity: 1,
+            unitCost: "60",
+          },
+        ],
+      }),
+    ).rejects.toMatchObject({ code: "PURCHASE_ORDER_OVER_QUANTITY", status: 409 });
+    expect(
+      await prisma.purchaseOrder.count({ where: { salesOrderId: order.id } }),
+    ).toBe(0);
+  });
+
+  it("serializes concurrent PO creation so only one can purchase the remaining quantity", async () => {
+    const order = await createEligibleOrder("RACE", 2);
+    concurrentOrderId = order.id;
+    concurrentOrderItemId = order.items[0].id;
+    const input = {
+      supplierId,
+      salesOrderId: order.id,
+      currencyCode: "USD",
+      exchangeRateToUsd: "1",
+      items: [
+        {
+          salesOrderItemId: order.items[0].id,
+          quantity: 2,
+          unitCost: "60",
+        },
+      ],
+    };
+
+    const results = await Promise.allSettled([
+      service.createPurchaseOrder(context, input),
+      service.createPurchaseOrder(context, input),
+    ]);
+    const fulfilled = results.filter(
+      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof service.createPurchaseOrder>>> =>
+        result.status === "fulfilled",
+    );
+    const rejected = results.filter(
+      (result): result is PromiseRejectedResult => result.status === "rejected",
+    );
+    expect(
+      fulfilled,
+      JSON.stringify(
+        results.map((result) =>
+          result.status === "fulfilled"
+            ? { status: result.status, id: result.value.id }
+            : {
+                status: result.status,
+                code: result.reason?.code,
+                message: result.reason?.message,
+              },
+        ),
+      ),
+    ).toHaveLength(1);
+    expect(rejected).toHaveLength(1);
+    expect(rejected[0].reason).toMatchObject({
+      code: "PURCHASE_ORDER_OVER_QUANTITY",
+      status: 409,
+    });
+    successfulPurchaseOrderId = fulfilled[0].value.id;
+    createdPurchaseOrderIds.push(successfulPurchaseOrderId);
+    expect(
+      await prisma.purchaseOrderItem.aggregate({
+        where: {
+          purchaseOrder: {
+            salesOrderId: order.id,
+            status: { not: "CANCELLED" },
+          },
+          salesOrderItemId: order.items[0].id,
+        },
+        _sum: { quantity: true },
+      }),
+    ).toMatchObject({ _sum: { quantity: 2 } });
+    expect(
+      (await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } }))
+        .version,
+    ).toBe(2);
+  });
+
+  it("uses conditional inventory versions so only one concurrent reservation succeeds", async () => {
+    const product = await prisma.product.create({
+      data: {
+        sku: `IT-BULK-${runId}`,
+        name: `Integration bulk stock ${runId}`,
+        categoryId,
+        serialized: false,
+      },
+    });
+    createdProductIds.push(product.id);
+    const inventory = await prisma.inventoryItem.create({
+      data: {
+        productId: product.id,
+        locationId,
+        quantityOnHand: 1,
+      },
+    });
+    createdInventoryIds.push(inventory.id);
+
+    const results = await Promise.allSettled([
+      service.mutateInventory(context, {
+        inventoryItemId: inventory.id,
+        expectedVersion: inventory.version,
+        type: "RESERVATION",
+        quantity: 1,
+      }),
+      service.mutateInventory(context, {
+        inventoryItemId: inventory.id,
+        expectedVersion: inventory.version,
+        type: "RESERVATION",
+        quantity: 1,
+      }),
+    ]);
+    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
+    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
+    expect(
+      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
+    ).toMatchObject({ quantityOnHand: 1, quantityReserved: 1, version: 2 });
+  });
+
+  it("receives a serialized PO into linked inventory and immutable serial trails", async () => {
+    let purchaseOrder = await service.transitionPurchaseOrder(
+      context,
+      successfulPurchaseOrderId,
+      "APPROVED",
+      1,
+    );
+    purchaseOrder = await service.transitionPurchaseOrder(
+      context,
+      purchaseOrder.id,
+      "SENT",
+      purchaseOrder.version,
+    );
+    const line = await prisma.purchaseOrderItem.findFirstOrThrow({
+      where: { purchaseOrderId: purchaseOrder.id },
+    });
+    const serialNumbers = [`IT-${runId}-001`, `IT-${runId}-002`];
+    const received = await service.receivePurchaseOrder(context, purchaseOrder.id, {
+      expectedVersion: purchaseOrder.version,
+      locationId,
+      items: [
+        {
+          purchaseOrderItemId: line.id,
+          quantity: 2,
+          serialNumbers,
+        },
+      ],
+    });
+    expect(received).toMatchObject({ status: "RECEIVED", version: 4 });
+    const inventory = await prisma.inventoryItem.findFirstOrThrow({
+      where: { purchaseOrderItemId: line.id, locationId },
+      include: {
+        serials: { orderBy: { serialNumber: "asc" } },
+        transactions: { orderBy: { occurredAt: "asc" } },
+      },
+    });
+    createdInventoryIds.push(inventory.id);
+    expect(inventory.quantityOnHand).toBe(2);
+    expect(inventory.quantityReserved).toBe(0);
+    expect(inventory.serials.map((serial) => serial.serialNumber)).toEqual(
+      serialNumbers,
+    );
+    expect(inventory.transactions).toHaveLength(2);
+    expect(
+      inventory.transactions.every(
+        (transaction) =>
+          transaction.type === "RECEIPT" &&
+          transaction.referenceId === purchaseOrder.id &&
+          Boolean(transaction.inventorySerialId),
+      ),
+    ).toBe(true);
+  });
+
+  it("blocks stale QC, then reserves, issues and delivers with synchronized order state", async () => {
+    const inventory = await prisma.inventoryItem.findFirstOrThrow({
+      where: {
+        purchaseOrderItem: { purchaseOrderId: successfulPurchaseOrderId },
+      },
+      include: { serials: { orderBy: { serialNumber: "asc" } } },
+    });
+    for (const serial of inventory.serials) {
+      await service.createInspection(context, {
+        inventoryItemId: inventory.id,
+        inventorySerialId: serial.id,
+        status: "PASSED",
+        checklist: { appearance: true, serialVerified: true, burnIn: true },
+      });
+    }
+    const failed = await service.createInspection(context, {
+      inventoryItemId: inventory.id,
+      inventorySerialId: inventory.serials[0].id,
+      status: "FAILED",
+      checklist: { appearance: true, serialVerified: true, burnIn: false },
+    });
+    await prisma.qualityInspection.update({
+      where: { id: failed.id },
+      data: { createdAt: new Date(Date.now() + 1_000) },
+    });
+    const shipmentInput = {
+      salesOrderId: concurrentOrderId,
+      method: "AIR" as const,
+      carrier: "Integration Air",
+      origin: "Shenzhen",
+      destination: "Frankfurt",
+      items: [
+        {
+          salesOrderItemId: concurrentOrderItemId,
+          inventoryItemId: inventory.id,
+          quantity: 2,
+          serialNumbers: inventory.serials.map((serial) => serial.serialNumber),
+        },
+      ],
+    };
+    await expect(
+      service.createShipment(context, shipmentInput),
+    ).rejects.toMatchObject({ code: "SHIPMENT_INSPECTION_REQUIRED", status: 409 });
+
+    const repassed = await service.createInspection(context, {
+      inventoryItemId: inventory.id,
+      inventorySerialId: inventory.serials[0].id,
+      status: "PASSED",
+      checklist: { appearance: true, serialVerified: true, burnIn: true },
+    });
+    await prisma.qualityInspection.update({
+      where: { id: repassed.id },
+      data: { createdAt: new Date(Date.now() + 2_000) },
+    });
+
+    let shipment: Awaited<ReturnType<typeof service.transitionShipment>> =
+      await service.createShipment(context, shipmentInput);
+    createdShipmentIds.push(shipment.id);
+    expect(shipment.status).toBe("BOOKED");
+    expect(
+      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
+    ).toMatchObject({ quantityOnHand: 2, quantityReserved: 2 });
+    shipment = await service.transitionShipment(
+      context,
+      shipment.id,
+      "IN_TRANSIT",
+      shipment.version,
+    );
+    expect(
+      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
+    ).toMatchObject({ quantityOnHand: 0, quantityReserved: 0 });
+    expect(
+      await prisma.inventorySerial.count({
+        where: { inventoryItemId: inventory.id, status: "ISSUED" },
+      }),
+    ).toBe(2);
+    expect(
+      await prisma.salesOrder.findUniqueOrThrow({ where: { id: concurrentOrderId } }),
+    ).toMatchObject({ status: "SHIPPED", shipmentStatus: "SHIPPED" });
+
+    shipment = await service.transitionShipment(
+      context,
+      shipment.id,
+      "DELIVERED",
+      shipment.version,
+    );
+    expect(shipment.status).toBe("DELIVERED");
+    expect(
+      await prisma.salesOrder.findUniqueOrThrow({ where: { id: concurrentOrderId } }),
+    ).toMatchObject({ status: "COMPLETED", shipmentStatus: "DELIVERED" });
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts"
new file mode 100644
index 0000000..d146337
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts"
@@ -0,0 +1,151 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  inspectionSchema,
+  inventoryMutationSchema,
+  purchaseOrderSchema,
+  shipmentSchema,
+  supplierSchema,
+  supplierUpdateSchema,
+} from "@/modules/procurement/procurement-schemas";
+
+describe("procurement workflow schemas", () => {
+  it("accepts operational supplier and masked-bank fields", () => {
+    expect(
+      supplierSchema.parse({
+        code: "SUP-01",
+        name: "Atlas Supplier",
+        countryCode: "cn",
+        supplierType: "DISTRIBUTOR",
+        rating: 4,
+        bankName: "Example Bank",
+        bankAccountName: "Atlas Supplier Ltd",
+        bankAccountNumber: "6222000012345678",
+      }),
+    ).toMatchObject({ countryCode: "CN", rating: 4 });
+  });
+
+  it("validates supplier status and product relationship maintenance", () => {
+    expect(
+      supplierUpdateSchema.parse({
+        expectedVersion: 3,
+        status: "INACTIVE",
+        productRelations: [
+          {
+            productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
+            supplierSku: "SUP-GPU-01",
+            leadTimeDays: 14,
+            lastCost: "725.50",
+            currencyCode: "usd",
+          },
+        ],
+      }),
+    ).toMatchObject({
+      status: "INACTIVE",
+      productRelations: [{ currencyCode: "USD" }],
+    });
+
+    expect(() =>
+      supplierSchema.parse({
+        code: "SUP-02",
+        name: "Duplicate Relations",
+        countryCode: "CN",
+        productRelations: [
+          { productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976" },
+          { productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976" },
+        ],
+      }),
+    ).toThrow();
+  });
+
+  it("captures purchase terms, snapshots and attachment identifiers", () => {
+    expect(
+      purchaseOrderSchema.parse({
+        supplierId: "b5138961-b5ac-4bf0-b464-c56627662ae3",
+        salesOrderId: "a42fedde-afb8-4a1d-a05b-05b684a73fd8",
+        currencyCode: "usd",
+        exchangeRateToUsd: "1",
+        paymentTerms: "30% deposit",
+        incoterm: "FOB",
+        attachmentIds: ["4f22669d-bfe5-4b21-81c3-47e4814a1976"],
+        items: [
+          {
+            salesOrderItemId: "b58d3e78-1d91-419f-8444-acfb49b6c555",
+            quantity: 1,
+            unitCost: "1000",
+          },
+        ],
+      }),
+    ).toMatchObject({ currencyCode: "USD", incoterm: "FOB" });
+  });
+
+  it("rejects duplicate purchase attachments and shipment documents", () => {
+    const duplicateId = "4f22669d-bfe5-4b21-81c3-47e4814a1976";
+    expect(() =>
+      purchaseOrderSchema.parse({
+        supplierId: "b5138961-b5ac-4bf0-b464-c56627662ae3",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        attachmentIds: [duplicateId, duplicateId],
+        items: [{ description: "GPU", quantity: 1, unitCost: "1000" }],
+      }),
+    ).toThrow();
+    expect(() =>
+      shipmentSchema.parse({
+        salesOrderId: "262ed90a-a6c5-44ee-b576-63840735eb18",
+        method: "AIR",
+        documentIds: [duplicateId, duplicateId],
+        items: [
+          {
+            salesOrderItemId: "5f5e5e17-a8af-4f18-af8d-c9f125276fbe",
+            inventoryItemId: "265c80e0-01ca-4874-9f9d-2a8d2ff7c520",
+            quantity: 1,
+          },
+        ],
+      }),
+    ).toThrow();
+  });
+
+  it("captures serial-specific inspection and shipment logistics", () => {
+    expect(
+      inspectionSchema.parse({
+        inventoryItemId: "262ed90a-a6c5-44ee-b576-63840735eb18",
+        inventorySerialId: "79d03d8b-6112-4bb1-90b4-b3abec2e333f",
+        status: "PASSED",
+        checklist: { appearance: true, boot: true, burnIn: true },
+      }),
+    ).toMatchObject({ status: "PASSED" });
+    expect(
+      shipmentSchema.parse({
+        salesOrderId: "262ed90a-a6c5-44ee-b576-63840735eb18",
+        method: "AIR",
+        originPort: "SZX",
+        destinationPort: "FRA",
+        grossWeightKg: "24.5",
+        volumeCbm: "0.18",
+        freightCost: "800",
+        freightCurrencyCode: "USD",
+        freightExchangeRateToUsd: "1",
+        documentIds: ["79d03d8b-6112-4bb1-90b4-b3abec2e333f"],
+        items: [
+          {
+            salesOrderItemId: "5f5e5e17-a8af-4f18-af8d-c9f125276fbe",
+            inventoryItemId: "265c80e0-01ca-4874-9f9d-2a8d2ff7c520",
+            quantity: 1,
+            serialNumbers: ["GPU-001"],
+          },
+        ],
+      }),
+    ).toMatchObject({ method: "AIR", freightCost: "800" });
+  });
+
+  it("requires an expected version for inventory mutations", () => {
+    expect(() =>
+      inventoryMutationSchema.parse({
+        inventoryItemId: "262ed90a-a6c5-44ee-b576-63840735eb18",
+        type: "RESERVATION",
+        quantity: 1,
+      }),
+    ).toThrow();
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts"
new file mode 100644
index 0000000..82ef6ab
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts"
@@ -0,0 +1,144 @@
+import { z } from "zod";
+
+const uuid = z.string().uuid();
+const money = z.string().regex(/^\d+(?:\.\d{1,4})?$/);
+const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
+const rate = z.string().regex(/^\d+(?:\.\d{1,12})?$/).refine((value) => Number(value) > 0);
+const json = z.record(z.string(), z.json());
+export const assetIdListSchema = z
+  .array(uuid)
+  .max(20)
+  .refine((ids) => new Set(ids).size === ids.length, {
+    message: "Asset identifiers must be unique",
+  });
+const supplierProductRelationSchema = z.object({
+  productId: uuid,
+  supplierSku: z.string().trim().max(100).nullable().optional(),
+  leadTimeDays: z.number().int().min(0).max(3650).nullable().optional(),
+  lastCost: money.nullable().optional(),
+  currencyCode: currency.nullable().optional(),
+});
+const supplierProductRelationsSchema = z
+  .array(supplierProductRelationSchema)
+  .max(200)
+  .refine(
+    (relations) =>
+      new Set(relations.map((relation) => relation.productId)).size ===
+      relations.length,
+    { message: "Supplier product relationships must be unique" },
+  );
+
+export const supplierSchema = z.object({
+  code: z.string().trim().min(1).max(50), name: z.string().trim().min(1).max(200),
+  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
+  contactName: z.string().max(200).nullable().optional(), email: z.string().email().nullable().optional(),
+  phone: z.string().max(50).nullable().optional(), address: json.nullable().optional(),
+  supplierType: z.enum(["MANUFACTURER", "DISTRIBUTOR", "BROKER", "REFURBISHER", "LOGISTICS", "OTHER"]).optional(),
+  website: z.string().url().nullable().optional(),
+  taxId: z.string().trim().max(100).nullable().optional(),
+  paymentTerms: z.string().trim().max(500).nullable().optional(),
+  leadTimeDays: z.number().int().min(0).max(3650).nullable().optional(),
+  minimumOrderValue: money.nullable().optional(),
+  rating: z.number().int().min(1).max(5).nullable().optional(),
+  bankName: z.string().trim().max(200).nullable().optional(),
+  bankAccountName: z.string().trim().max(200).nullable().optional(),
+  bankAccountNumber: z.string().trim().max(200).nullable().optional(),
+  notes: z.string().trim().max(5000).nullable().optional(),
+  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
+  productRelations: supplierProductRelationsSchema.optional(),
+});
+export const supplierUpdateSchema = supplierSchema.partial().extend({
+  expectedVersion: z.number().int().positive(),
+});
+export const purchaseOrderSchema = z.object({
+  supplierId: uuid, salesOrderId: uuid.nullable().optional(), currencyCode: currency, exchangeRateToUsd: rate,
+  expectedAt: z.coerce.date().nullable().optional(),
+  paymentTerms: z.string().trim().max(1000).nullable().optional(),
+  shippingTerms: z.string().trim().max(1000).nullable().optional(),
+  incoterm: z.string().trim().max(20).nullable().optional(),
+  deliveryAddress: json.nullable().optional(),
+  notes: z.string().trim().max(5000).nullable().optional(),
+  attachmentIds: assetIdListSchema.optional(),
+  items: z.array(z.object({
+    salesOrderItemId: uuid.nullable().optional(),
+    productId: uuid.nullable().optional(),
+    description: z.string().trim().min(1).max(1000).optional(),
+    configurationSnapshot: json.nullable().optional(),
+    quantity: z.number().int().positive(),
+    unitCost: money.refine((value) => Number(value) > 0),
+  })).min(1),
+});
+export const purchaseOrderTransitionSchema = z.object({
+  status: z.enum(["APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]),
+  expectedVersion: z.number().int().positive(),
+});
+export const purchaseOrderReceiptSchema = z.object({
+  expectedVersion: z.number().int().positive(),
+  locationId: uuid,
+  items: z.array(z.object({
+    purchaseOrderItemId: uuid,
+    quantity: z.number().int().positive(),
+    serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
+  })).min(1),
+});
+export const inventoryMutationSchema = z.object({
+  inventoryItemId: uuid,
+  expectedVersion: z.number().int().positive(),
+  type: z.enum(["RECEIPT", "ISSUE", "RESERVATION", "RELEASE", "DAMAGE", "RETURN", "COUNT"]),
+  quantity: z.number().int().positive(),
+  notes: z.string().max(2000).optional(),
+  serialNumber: z.string().trim().min(1).max(200).optional(),
+});
+export const inventoryTransferSchema = z.object({
+  inventoryItemId: uuid,
+  expectedVersion: z.number().int().positive(),
+  toLocationId: uuid,
+  quantity: z.number().int().positive(),
+  serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
+  notes: z.string().max(2000).optional(),
+});
+export const inspectionSchema = z.object({
+  inventoryItemId: uuid,
+  inventorySerialId: uuid.nullable().optional(),
+  status: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]),
+  checklist: z.record(z.string(), z.boolean()),
+  notes: z.string().max(5000).nullable().optional(),
+  evidence: z.array(json).optional(),
+});
+export const shipmentSchema = z.object({
+  salesOrderId: uuid,
+  method: z.enum(["AIR", "SEA", "ROAD", "RAIL", "COURIER", "CUSTOMER_PICKUP"]),
+  carrier: z.string().max(200).nullable().optional(),
+  trackingNumber: z.string().max(200).nullable().optional(),
+  incoterm: z.string().max(20).nullable().optional(),
+  origin: z.string().max(200).nullable().optional(),
+  destination: z.string().max(200).nullable().optional(),
+  originPort: z.string().max(100).nullable().optional(),
+  destinationPort: z.string().max(100).nullable().optional(),
+  grossWeightKg: money.nullable().optional(),
+  volumeCbm: money.nullable().optional(),
+  freightCost: money.nullable().optional(),
+  freightCurrencyCode: currency.nullable().optional(),
+  freightExchangeRateToUsd: rate.nullable().optional(),
+  estimatedDepartureAt: z.coerce.date().nullable().optional(),
+  estimatedArrivalAt: z.coerce.date().nullable().optional(),
+  documentIds: assetIdListSchema.optional(),
+  items: z.array(z.object({
+    salesOrderItemId: uuid,
+    inventoryItemId: uuid,
+    quantity: z.number().int().positive(),
+    serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
+  })).min(1),
+});
+export const shipmentTransitionSchema = z.object({
+  status: z.enum(["BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
+  expectedVersion: z.number().int().positive(),
+});
+
+export type SupplierInput = z.infer<typeof supplierSchema>;
+export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
+export type PurchaseOrderReceiptInput = z.infer<typeof purchaseOrderReceiptSchema>;
+export type InventoryMutationInput = z.infer<typeof inventoryMutationSchema>;
+export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;
+export type InspectionInput = z.infer<typeof inspectionSchema>;
+export type ShipmentInput = z.infer<typeof shipmentSchema>;
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.test.ts"
new file mode 100644
index 0000000..8dd8c68
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.test.ts"
@@ -0,0 +1,374 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+
+const mocks = vi.hoisted(() => ({
+  database: null as unknown,
+  writeAudit: vi.fn(),
+}));
+
+vi.mock("@/lib/prisma", () => ({
+  getPrisma: () => mocks.database,
+}));
+vi.mock("@/lib/audit", () => ({
+  writeAudit: mocks.writeAudit,
+}));
+
+import {
+  ProcurementService,
+  maskBankAccount,
+  supplierOperationalMetrics,
+} from "@/modules/procurement/procurement-service";
+
+const context = {
+  userId: "045a6c7e-d408-41af-8b6f-8b5e525d76c8",
+  roleCodes: ["OPERATIONS"],
+  permissions: ["inventory.update"],
+  isSuperAdmin: false,
+};
+
+const supplierBankContext = {
+  ...context,
+  permissions: ["purchase.read", "supplier.bank.read"],
+};
+
+describe("procurement service transaction guards", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it("masks supplier bank details outside the write boundary", () => {
+    expect(maskBankAccount("6222000012345678")).toBe("************5678");
+    expect(maskBankAccount(null)).toBeNull();
+  });
+
+  it("masks suppliers nested in PO reads unless the caller has field access", async () => {
+    const purchaseOrder = {
+      id: "po-1",
+      supplier: {
+        id: "supplier-1",
+        bankAccountNumber: "6222000012345678",
+      },
+    };
+    const findMany = vi.fn().mockResolvedValue([purchaseOrder]);
+    const findFirst = vi.fn().mockResolvedValue(purchaseOrder);
+    mocks.database = { purchaseOrder: { findMany, findFirst } };
+    const service = new ProcurementService();
+
+    await expect(
+      service.listPurchaseOrders({ ...context, permissions: ["purchase.read"] }),
+    ).resolves.toMatchObject([
+      { supplier: { bankAccountNumber: "************5678" } },
+    ]);
+    await expect(
+      service.getPurchaseOrder(
+        "po-1",
+        supplierBankContext,
+      ),
+    ).resolves.toMatchObject({
+      supplier: { bankAccountNumber: "6222000012345678" },
+    });
+  });
+
+  it("creates a stock-reserving shipment and its order in BOOKED state atomically", async () => {
+    let createdShipment: Record<string, unknown> | undefined;
+    const shipmentCreate = vi.fn().mockImplementation(({ data }) => {
+      createdShipment = {
+        id: "shipment-1",
+        status: data.status ?? "DRAFT",
+        ...data,
+      };
+      return createdShipment;
+    });
+    const orderUpdate = vi.fn().mockResolvedValue({ count: 1 });
+    const transaction = {
+      salesOrder: {
+        findFirst: vi.fn().mockResolvedValue({
+          id: "order-1",
+          version: 4,
+          items: [
+            {
+              id: "order-item-1",
+              productId: "product-1",
+              quantity: 2,
+            },
+          ],
+          shipments: [],
+        }),
+        updateMany: orderUpdate,
+      },
+      fileAsset: { count: vi.fn() },
+      inventoryItem: {
+        findFirst: vi.fn().mockResolvedValue({
+          id: "inventory-1",
+          productId: "product-1",
+          quantityOnHand: 2,
+          quantityReserved: 0,
+          version: 3,
+          product: { serialized: false },
+        }),
+        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
+      },
+      qualityInspection: {
+        findFirst: vi.fn().mockResolvedValue({
+          status: "PASSED",
+          checklist: { appearance: true },
+        }),
+      },
+      sequence: {
+        update: vi.fn().mockResolvedValue({
+          prefix: "SHIP",
+          nextValue: BigInt(2),
+          padding: 6,
+        }),
+      },
+      shipment: {
+        create: shipmentCreate,
+        findUniqueOrThrow: vi.fn().mockImplementation(() => createdShipment),
+      },
+      shipmentItem: {
+        create: vi.fn().mockResolvedValue({ id: "shipment-item-1" }),
+      },
+      inventoryTransaction: { create: vi.fn().mockResolvedValue({}) },
+    };
+    mocks.database = {
+      $transaction: (callback: (tx: typeof transaction) => unknown) =>
+        callback(transaction),
+    };
+
+    await expect(
+      new ProcurementService().createShipment(context, {
+        salesOrderId: "order-1",
+        method: "AIR",
+        items: [
+          {
+            salesOrderItemId: "order-item-1",
+            inventoryItemId: "inventory-1",
+            quantity: 1,
+          },
+        ],
+      }),
+    ).resolves.toMatchObject({ status: "BOOKED" });
+    expect(shipmentCreate).toHaveBeenCalledWith({
+      data: expect.objectContaining({ status: "BOOKED" }),
+    });
+    expect(orderUpdate).toHaveBeenCalledWith({
+      where: { id: "order-1", version: 4 },
+      data: {
+        status: "FULFILLING",
+        shipmentStatus: "BOOKED",
+        version: { increment: 1 },
+      },
+    });
+  });
+
+  it("replaces validated supplier product relationships in the supplier transaction", async () => {
+    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
+    const createMany = vi.fn().mockResolvedValue({ count: 1 });
+    const transaction = {
+      supplier: {
+        findFirst: vi.fn().mockResolvedValue({
+          id: "supplier-1",
+          version: 2,
+          bankAccountNumber: null,
+        }),
+        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
+        findUniqueOrThrow: vi.fn().mockResolvedValue({
+          id: "supplier-1",
+          version: 3,
+          bankAccountNumber: null,
+        }),
+      },
+      product: { count: vi.fn().mockResolvedValue(1) },
+      supplierProduct: { deleteMany, createMany },
+    };
+    mocks.database = {
+      $transaction: (callback: (tx: typeof transaction) => unknown) =>
+        callback(transaction),
+    };
+
+    await new ProcurementService().updateSupplier(
+      context,
+      "supplier-1",
+      {
+        expectedVersion: 2,
+        status: "INACTIVE",
+        productRelations: [
+          {
+            productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
+            supplierSku: "SUP-GPU-01",
+          },
+        ],
+      },
+    );
+
+    expect(deleteMany).toHaveBeenCalledWith({
+      where: { supplierId: "supplier-1" },
+    });
+    expect(createMany).toHaveBeenCalledWith({
+      data: [
+        {
+          supplierId: "supplier-1",
+          productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
+          supplierSku: "SUP-GPU-01",
+        },
+      ],
+    });
+  });
+
+  it("summarizes supplier spend, delivery, quality and return performance", () => {
+    expect(
+      supplierOperationalMetrics([
+        {
+          totalUsd: "120.50",
+          status: "RECEIVED",
+          expectedAt: new Date("2026-07-15T00:00:00Z"),
+          receivedAt: new Date("2026-07-14T00:00:00Z"),
+          items: [
+            {
+              inventoryItems: [
+                {
+                  inspections: [{ status: "PASSED" }, { status: "FAILED" }],
+                  transactions: [{ type: "RETURN", quantity: 1 }],
+                },
+              ],
+            },
+          ],
+        },
+        {
+          totalUsd: "79.50",
+          status: "SENT",
+          expectedAt: null,
+          receivedAt: null,
+          items: [],
+        },
+      ]),
+    ).toEqual({
+      purchaseTotalUsd: "200.0000",
+      orderCount: 2,
+      receivedOrderCount: 1,
+      deliveryRatePercent: "50.00",
+      onTimeDeliveryRatePercent: "100.00",
+      passedInspectionCount: 1,
+      completedInspectionCount: 2,
+      qualityPassRatePercent: "50.00",
+      returnedUnits: 1,
+    });
+  });
+
+  it("uses the read version and balances in the inventory conditional update", async () => {
+    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
+    const transaction = {
+      inventoryItem: {
+        findFirst: vi.fn().mockResolvedValue({
+          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+          productId: "e61d1149-ecef-4a78-b7d7-f282ee628887",
+          locationId: "fdd1cae5-b451-4636-987d-a37c13c295a2",
+          purchaseOrderItemId: null,
+          quantityOnHand: 2,
+          quantityReserved: 0,
+          version: 7,
+          deletedAt: null,
+          product: { serialized: false },
+        }),
+        updateMany,
+      },
+      inventorySerial: { findUnique: vi.fn() },
+    };
+    mocks.database = {
+      $transaction: (callback: (tx: typeof transaction) => unknown) =>
+        callback(transaction),
+    };
+
+    await expect(
+      new ProcurementService().mutateInventory(context, {
+        inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+        expectedVersion: 7,
+        type: "RESERVATION",
+        quantity: 1,
+      }),
+    ).rejects.toMatchObject({ code: "INVENTORY_CONFLICT", status: 409 });
+    expect(updateMany).toHaveBeenCalledWith({
+      where: {
+        id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+        version: 7,
+        quantityOnHand: 2,
+        quantityReserved: 0,
+        deletedAt: null,
+      },
+      data: {
+        quantityOnHand: 2,
+        quantityReserved: 1,
+        version: { increment: 1 },
+      },
+    });
+  });
+
+  it("releases a reserved serial and records its immutable transaction trail", async () => {
+    const serialUpdate = vi.fn().mockResolvedValue({ count: 1 });
+    const inventoryTransactionCreate = vi.fn().mockResolvedValue({ id: "trail" });
+    const transaction = {
+      inventoryItem: {
+        findFirst: vi.fn().mockResolvedValue({
+          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+          productId: "e61d1149-ecef-4a78-b7d7-f282ee628887",
+          locationId: "fdd1cae5-b451-4636-987d-a37c13c295a2",
+          purchaseOrderItemId: null,
+          quantityOnHand: 2,
+          quantityReserved: 1,
+          version: 7,
+          deletedAt: null,
+          product: { serialized: true },
+        }),
+        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
+        findUniqueOrThrow: vi.fn().mockResolvedValue({
+          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+          quantityOnHand: 2,
+          quantityReserved: 0,
+          version: 8,
+          serials: [{ serialNumber: "GPU-001", status: "AVAILABLE" }],
+        }),
+      },
+      inventorySerial: {
+        findUnique: vi.fn().mockResolvedValue({
+          id: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
+          inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+          serialNumber: "GPU-001",
+          status: "RESERVED",
+          issuedAt: null,
+        }),
+        updateMany: serialUpdate,
+      },
+      inventoryTransaction: { create: inventoryTransactionCreate },
+    };
+    mocks.database = {
+      $transaction: (callback: (tx: typeof transaction) => unknown) =>
+        callback(transaction),
+    };
+
+    await new ProcurementService().mutateInventory(context, {
+      inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
+      expectedVersion: 7,
+      type: "RELEASE",
+      quantity: 1,
+      serialNumber: "GPU-001",
+    });
+
+    expect(serialUpdate).toHaveBeenCalledWith({
+      where: {
+        id: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
+        status: "RESERVED",
+      },
+      data: { status: "AVAILABLE", issuedAt: null },
+    });
+    expect(inventoryTransactionCreate).toHaveBeenCalledWith({
+      data: expect.objectContaining({
+        inventorySerialId: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
+        type: "RELEASE",
+        referenceType: "manual",
+      }),
+    });
+    expect(mocks.writeAudit).toHaveBeenCalledWith(
+      transaction,
+      expect.objectContaining({ action: "inventory.mutate" }),
+    );
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts"
new file mode 100644
index 0000000..a884e31
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts"
@@ -0,0 +1,2063 @@
+import Decimal from "decimal.js";
+
+import type { Prisma } from "@/generated/prisma/client";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import { can, type AuthorizationContext } from "@/lib/rbac";
+import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
+import {
+  assertInspectionResult,
+  assertPurchaseOrderLineOwnership,
+  assertPurchaseOrderQuantities,
+  assertPurchaseOrderTransition,
+  assertShipmentTransition,
+  aggregateInventoryReservations,
+  deriveShipmentOrderState,
+  inspectionPassesShipmentGate,
+  inventoryBalanceAfter,
+  nextSerialStatus,
+  remainingShippableQuantity,
+  type InventoryMutation,
+} from "@/modules/procurement/procurement-domain";
+import type {
+  InspectionInput,
+  InventoryMutationInput,
+  InventoryTransferInput,
+  PurchaseOrderInput,
+  PurchaseOrderReceiptInput,
+  ShipmentInput,
+  SupplierInput,
+} from "@/modules/procurement/procurement-schemas";
+
+type Transaction = Prisma.TransactionClient;
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
+export function maskBankAccount(value: string | null | undefined) {
+  if (!value) return null;
+  const visible = value.slice(-4);
+  return `${"*".repeat(Math.max(4, value.length - 4))}${visible}`;
+}
+
+function supplierPresentation<T extends { bankAccountNumber?: string | null }>(
+  supplier: T,
+  context: AuthorizationContext,
+) {
+  return {
+    ...supplier,
+    bankAccountNumber: can(context, "supplier.bank.read")
+      ? (supplier.bankAccountNumber ?? null)
+      : maskBankAccount(supplier.bankAccountNumber),
+  };
+}
+
+type SupplierOrderForMetrics = {
+  totalUsd: { toString(): string } | string;
+  status: string;
+  expectedAt: Date | null;
+  receivedAt: Date | null;
+  items: Array<{
+    inventoryItems: Array<{
+      inspections: Array<{ status: string }>;
+      transactions: Array<{ type: string; quantity: number }>;
+    }>;
+  }>;
+};
+
+export function supplierOperationalMetrics(
+  purchaseOrders: readonly SupplierOrderForMetrics[],
+) {
+  const purchaseTotalUsd = purchaseOrders.reduce(
+    (total, order) => total.plus(order.totalUsd.toString()),
+    new Decimal(0),
+  );
+  const received = purchaseOrders.filter((order) => order.status === "RECEIVED");
+  const onTime = received.filter(
+    (order) =>
+      order.receivedAt &&
+      (!order.expectedAt || order.receivedAt <= order.expectedAt),
+  );
+  const inspections = purchaseOrders.flatMap((order) =>
+    order.items.flatMap((item) =>
+      item.inventoryItems.flatMap((inventory) => inventory.inspections),
+    ),
+  );
+  const completedInspections = inspections.filter(
+    (inspection) => inspection.status !== "PENDING",
+  );
+  const passedInspections = completedInspections.filter(
+    (inspection) => inspection.status === "PASSED",
+  );
+  const returnedUnits = purchaseOrders.reduce(
+    (total, order) =>
+      total +
+      order.items.reduce(
+        (itemTotal, item) =>
+          itemTotal +
+          item.inventoryItems.reduce(
+            (inventoryTotal, inventory) =>
+              inventoryTotal +
+              inventory.transactions
+                .filter((transaction) => transaction.type === "RETURN")
+                .reduce((sum, transaction) => sum + transaction.quantity, 0),
+            0,
+          ),
+        0,
+      ),
+    0,
+  );
+  const percentage = (numerator: number, denominator: number) =>
+    denominator
+      ? new Decimal(numerator).div(denominator).times(100).toFixed(2)
+      : "0.00";
+  return {
+    purchaseTotalUsd: purchaseTotalUsd.toFixed(4),
+    orderCount: purchaseOrders.length,
+    receivedOrderCount: received.length,
+    deliveryRatePercent: percentage(received.length, purchaseOrders.length),
+    onTimeDeliveryRatePercent: percentage(onTime.length, received.length),
+    passedInspectionCount: passedInspections.length,
+    completedInspectionCount: completedInspections.length,
+    qualityPassRatePercent: percentage(
+      passedInspections.length,
+      completedInspections.length,
+    ),
+    returnedUnits,
+  };
+}
+
+async function assertFileAssets(
+  transaction: Transaction,
+  ids: readonly string[] | undefined,
+) {
+  if (!ids?.length) return;
+  const count = await transaction.fileAsset.count({
+    where: { id: { in: [...new Set(ids)] }, deletedAt: null },
+  });
+  if (count !== new Set(ids).size) {
+    throw new DomainError(
+      "ATTACHMENT_NOT_FOUND",
+      "One or more attachments are unavailable",
+      409,
+    );
+  }
+}
+
+async function assertSupplierProducts(
+  transaction: Transaction,
+  relations: SupplierInput["productRelations"],
+) {
+  if (!relations?.length) return;
+  const productIds = relations.map((relation) => relation.productId);
+  const count = await transaction.product.count({
+    where: {
+      id: { in: productIds },
+      deletedAt: null,
+      status: "ACTIVE",
+    },
+  });
+  if (count !== productIds.length) {
+    throw new DomainError(
+      "SUPPLIER_PRODUCT_NOT_FOUND",
+      "One or more supplier products are unavailable",
+      409,
+    );
+  }
+}
+
+async function updateInventoryConditionally(
+  transaction: Transaction,
+  current: {
+    id: string;
+    version: number;
+    quantityOnHand: number;
+    quantityReserved: number;
+  },
+  next: { onHand: number; reserved: number },
+) {
+  const changed = await transaction.inventoryItem.updateMany({
+    where: {
+      id: current.id,
+      version: current.version,
+      quantityOnHand: current.quantityOnHand,
+      quantityReserved: current.quantityReserved,
+      deletedAt: null,
+    },
+    data: {
+      quantityOnHand: next.onHand,
+      quantityReserved: next.reserved,
+      version: { increment: 1 },
+    },
+  });
+  if (changed.count !== 1) {
+    throw new DomainError(
+      "INVENTORY_CONFLICT",
+      "Inventory changed; refresh and retry",
+      409,
+    );
+  }
+}
+
+export class ProcurementService {
+  listSuppliers(context: AuthorizationContext) {
+    return getPrisma()
+      .supplier.findMany({
+        where: { deletedAt: null },
+        orderBy: { updatedAt: "desc" },
+        include: {
+          _count: { select: { purchaseOrders: true, products: true } },
+          products: {
+            include: {
+              product: {
+                select: {
+                  id: true,
+                  sku: true,
+                  name: true,
+                  brand: true,
+                  category: { select: { id: true, name: true, slug: true } },
+                },
+              },
+            },
+          },
+          purchaseOrders: {
+            where: { deletedAt: null },
+            orderBy: { updatedAt: "desc" },
+            include: {
+              items: {
+                include: {
+                  inventoryItems: {
+                    include: {
+                      inspections: { select: { status: true } },
+                      transactions: {
+                        where: { type: "RETURN" },
+                        select: { type: true, quantity: true },
+                      },
+                    },
+                  },
+                },
+              },
+            },
+          },
+        },
+      })
+      .then((rows) =>
+        rows.map((row) => {
+          const brands = [
+            ...new Set(
+              row.products
+                .map((link) => link.product.brand)
+                .filter((brand): brand is string => Boolean(brand)),
+            ),
+          ];
+          const categories = [
+            ...new Map(
+              row.products.map((link) => [
+                link.product.category.id,
+                link.product.category,
+              ]),
+            ).values(),
+          ];
+          return supplierPresentation(
+            {
+              ...row,
+              brands,
+              categories,
+              metrics: supplierOperationalMetrics(row.purchaseOrders),
+              recentPurchaseOrders: row.purchaseOrders.slice(0, 5).map((order) => ({
+                id: order.id,
+                purchaseOrderNumber: order.purchaseOrderNumber,
+                status: order.status,
+                totalUsd: order.totalUsd,
+                expectedAt: order.expectedAt,
+                receivedAt: order.receivedAt,
+              })),
+            },
+            context,
+          );
+        }),
+      );
+  }
+
+  getSupplier(id: string, context: AuthorizationContext) {
+    return getPrisma()
+      .supplier.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          products: {
+            include: {
+              product: { include: { category: true } },
+            },
+          },
+          purchaseOrders: {
+            where: { deletedAt: null },
+            orderBy: { updatedAt: "desc" },
+            include: {
+              items: {
+                include: {
+                  product: true,
+                  inventoryItems: {
+                    include: {
+                      inspections: {
+                        include: {
+                          inventorySerial: {
+                            select: { serialNumber: true },
+                          },
+                        },
+                        orderBy: { createdAt: "desc" },
+                      },
+                      transactions: {
+                        where: { type: "RETURN" },
+                        include: {
+                          inventorySerial: {
+                            select: { serialNumber: true },
+                          },
+                        },
+                        orderBy: { occurredAt: "desc" },
+                      },
+                    },
+                  },
+                },
+              },
+            },
+          },
+        },
+      })
+      .then((row) => {
+        if (!row) return null;
+        const brands = [
+          ...new Set(
+            row.products
+              .map((link) => link.product.brand)
+              .filter((brand): brand is string => Boolean(brand)),
+          ),
+        ];
+        const categories = [
+          ...new Map(
+            row.products.map((link) => [
+              link.product.category.id,
+              link.product.category,
+            ]),
+          ).values(),
+        ];
+        return supplierPresentation(
+          {
+            ...row,
+            brands,
+            categories,
+            metrics: supplierOperationalMetrics(row.purchaseOrders),
+            returnHistory: row.purchaseOrders.flatMap((order) =>
+              order.items.flatMap((item) =>
+                item.inventoryItems.flatMap((inventory) =>
+                  inventory.transactions.map((transaction) => ({
+                    id: transaction.id,
+                    purchaseOrderId: order.id,
+                    purchaseOrderNumber: order.purchaseOrderNumber,
+                    productId: inventory.productId,
+                    inventoryItemId: inventory.id,
+                    serialNumber:
+                      transaction.inventorySerial?.serialNumber ?? null,
+                    quantity: transaction.quantity,
+                    occurredAt: transaction.occurredAt,
+                    notes: transaction.notes,
+                  })),
+                ),
+              ),
+            ),
+          },
+          context,
+        );
+      });
+  }
+
+  createSupplier(context: AuthorizationContext, input: SupplierInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const { productRelations, ...supplier } = input;
+      await assertSupplierProducts(transaction, productRelations);
+      const row = await transaction.supplier.create({
+        data: {
+          ...supplier,
+          address: supplier.address ?? undefined,
+          products: productRelations?.length
+            ? { create: productRelations }
+            : undefined,
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "supplier.create",
+        entityType: "Supplier",
+        entityId: row.id,
+        after: {
+          code: row.code,
+          name: row.name,
+          bankAccountNumber: maskBankAccount(row.bankAccountNumber),
+        },
+      });
+      return supplierPresentation(row, context);
+    });
+  }
+
+  updateSupplier(
+    context: AuthorizationContext,
+    id: string,
+    input: Partial<SupplierInput> & { expectedVersion: number },
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.supplier.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!row) {
+        throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
+      }
+      if (row.version !== input.expectedVersion) {
+        throw new DomainError(
+          "SUPPLIER_CONFLICT",
+          "Supplier changed; refresh and retry",
+          409,
+        );
+      }
+      const {
+        expectedVersion: _,
+        productRelations,
+        ...changes
+      } = input;
+      void _;
+      await assertSupplierProducts(transaction, productRelations);
+      const changed = await transaction.supplier.updateMany({
+        where: { id, version: row.version, deletedAt: null },
+        data: {
+          ...changes,
+          address: changes.address ?? undefined,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "SUPPLIER_CONFLICT",
+          "Supplier changed; refresh and retry",
+          409,
+        );
+      }
+      if (productRelations) {
+        await transaction.supplierProduct.deleteMany({
+          where: { supplierId: id },
+        });
+        if (productRelations.length) {
+          await transaction.supplierProduct.createMany({
+            data: productRelations.map((relation) => ({
+              supplierId: id,
+              ...relation,
+            })),
+          });
+        }
+      }
+      const updated = await transaction.supplier.findUniqueOrThrow({ where: { id } });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "supplier.update",
+        entityType: "Supplier",
+        entityId: id,
+        before: {
+          version: row.version,
+          bankAccountNumber: maskBankAccount(row.bankAccountNumber),
+        },
+        after: {
+          version: updated.version,
+          bankAccountNumber: maskBankAccount(updated.bankAccountNumber),
+        },
+      });
+      return supplierPresentation(updated, context);
+    });
+  }
+
+  listSupplierProductOptions() {
+    return getPrisma().product.findMany({
+      where: { deletedAt: null, status: "ACTIVE" },
+      orderBy: { sku: "asc" },
+      select: {
+        id: true,
+        sku: true,
+        name: true,
+        brand: true,
+        category: { select: { id: true, name: true } },
+      },
+    });
+  }
+
+  listPurchaseOrders(context: AuthorizationContext) {
+    return getPrisma()
+      .purchaseOrder.findMany({
+        where: { deletedAt: null },
+        orderBy: { updatedAt: "desc" },
+        include: {
+          supplier: true,
+          salesOrder: {
+            select: {
+              orderNumber: true,
+              purchaseEligibilityFlag: true,
+              purchaseOverrideAuditId: true,
+            },
+          },
+          buyer: { select: { name: true } },
+          items: { include: { product: true } },
+        },
+      })
+      .then((rows) =>
+        rows.map((row) => ({
+          ...row,
+          supplier: supplierPresentation(row.supplier, context),
+        })),
+      );
+  }
+
+  getPurchaseOrder(id: string, context: AuthorizationContext) {
+    return getPrisma()
+      .purchaseOrder.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          supplier: true,
+          salesOrder: { select: { orderNumber: true } },
+          buyer: { select: { name: true } },
+          items: { include: { product: true, inventoryItems: true } },
+        },
+      })
+      .then((row) =>
+        row
+          ? {
+              ...row,
+              supplier: supplierPresentation(row.supplier, context),
+            }
+          : null,
+      );
+  }
+
+  eligibleOrders() {
+    return getPrisma().salesOrder.findMany({
+      where: {
+        deletedAt: null,
+        status: "PURCHASING",
+        OR: [
+          { purchaseEligibilityFlag: true },
+          { purchaseOverrideAuditId: { not: null } },
+        ],
+      },
+      select: {
+        id: true,
+        orderNumber: true,
+        currencyCode: true,
+        total: true,
+        items: true,
+      },
+    });
+  }
+
+  createPurchaseOrder(context: AuthorizationContext, input: PurchaseOrderInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const supplier = await transaction.supplier.findFirst({
+        where: { id: input.supplierId, status: "ACTIVE", deletedAt: null },
+      });
+      if (!supplier) {
+        throw new DomainError(
+          "SUPPLIER_NOT_AVAILABLE",
+          "Supplier is not active",
+          409,
+        );
+      }
+      await assertFileAssets(transaction, input.attachmentIds);
+
+      let linkedItems = new Map<
+        string,
+        {
+          id: string;
+          salesOrderId: string;
+          productId: string | null;
+          description: string;
+          configuration: Prisma.JsonValue;
+          quantity: number;
+          product: {
+            id: string;
+            sku: string;
+            name: string;
+            brand: string | null;
+            model: string | null;
+            serialized: boolean;
+          } | null;
+        }
+      >();
+      let overrideAuditId: string | null = null;
+      let lockedOrderVersion: number | null = null;
+
+      if (input.salesOrderId) {
+        const lockedOrders = await transaction.$queryRaw<Array<{ id: string }>>`
+          SELECT "id"
+          FROM "SalesOrder"
+          WHERE "id" = ${input.salesOrderId}::uuid
+            AND "deletedAt" IS NULL
+          FOR UPDATE
+        `;
+        if (lockedOrders.length !== 1) {
+          throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+        }
+        await transaction.$queryRaw<Array<{ id: string }>>`
+          SELECT "id"
+          FROM "SalesOrderItem"
+          WHERE "salesOrderId" = ${input.salesOrderId}::uuid
+          ORDER BY "id"
+          FOR UPDATE
+        `;
+        const order = await transaction.salesOrder.findFirst({
+          where: { id: input.salesOrderId, deletedAt: null },
+          include: {
+            items: { include: { product: true } },
+            payments: {
+              where: { status: "CONFIRMED", deletedAt: null },
+              select: { amountUsd: true },
+            },
+            refunds: {
+              where: { refundedAt: { not: null }, deletedAt: null },
+              select: { amountUsd: true },
+            },
+            purchaseOrders: {
+              where: { deletedAt: null, status: { not: "CANCELLED" } },
+              include: { items: true },
+            },
+          },
+        });
+        if (!order) {
+          throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+        }
+        lockedOrderVersion = order.version;
+        if (order.status !== "PURCHASING") {
+          throw new DomainError(
+            "ORDER_NOT_READY_FOR_PURCHASE",
+            "Sales order must be in purchasing status",
+            409,
+          );
+        }
+        authorizePurchaseTransition(
+          {
+            paymentTerms: order.paymentTerms,
+            orderTotalUsd: order.totalUsd.toString(),
+            confirmedPaymentsUsd: order.payments.map((payment) =>
+              payment.amountUsd.toString(),
+            ),
+            confirmedRefundsUsd: order.refunds.map((refund) =>
+              refund.amountUsd.toString(),
+            ),
+          },
+          order.purchaseOverrideAuditId
+            ? {
+                actorId: order.purchaseOverrideActorId ?? context.userId,
+                reason: order.purchaseOverrideReason ?? "Audited override",
+              }
+            : undefined,
+        );
+        if (!order.purchaseEligibilityFlag && !order.purchaseOverrideAuditId) {
+          throw new DomainError(
+            "PURCHASE_PAYMENT_REQUIRED",
+            "Sales order is not eligible for purchasing",
+            409,
+          );
+        }
+        overrideAuditId = order.purchaseOverrideAuditId;
+        const requestedIds = input.items.map((item) => item.salesOrderItemId);
+        if (requestedIds.some((id) => !id)) {
+          throw new DomainError(
+            "PURCHASE_ORDER_ITEM_REQUIRED",
+            "Every linked purchase line requires a sales order item",
+            409,
+          );
+        }
+        assertPurchaseOrderLineOwnership(
+          order.id,
+          order.items,
+          requestedIds as string[],
+        );
+        linkedItems = new Map(order.items.map((item) => [item.id, item]));
+
+        assertPurchaseOrderQuantities(
+          order.items,
+          order.purchaseOrders.flatMap((purchaseOrder) => purchaseOrder.items),
+          input.items,
+        );
+      } else if (input.items.some((item) => item.salesOrderItemId)) {
+        throw new DomainError(
+          "STOCK_PURCHASE_ITEM_MISMATCH",
+          "Stock purchase lines cannot reference a sales order item",
+          409,
+        );
+      }
+
+      const total = input.items.reduce(
+        (sum, item) => sum.plus(new Decimal(item.unitCost).times(item.quantity)),
+        new Decimal(0),
+      );
+      const itemSnapshots: Prisma.PurchaseOrderItemUncheckedCreateWithoutPurchaseOrderInput[] =
+        input.items.map((item) => {
+        const source = item.salesOrderItemId
+          ? linkedItems.get(item.salesOrderItemId)
+          : undefined;
+        if (!source && !item.description) {
+          throw new DomainError(
+            "PURCHASE_DESCRIPTION_REQUIRED",
+            "Stock purchase lines require a description",
+            409,
+          );
+        }
+        return {
+          salesOrderItemId: item.salesOrderItemId,
+          productId: source?.productId ?? item.productId,
+          description: source?.description ?? item.description!,
+          productSnapshot: source?.product
+            ? {
+                id: source.product.id,
+                sku: source.product.sku,
+                name: source.product.name,
+                brand: source.product.brand,
+                model: source.product.model,
+                serialized: source.product.serialized,
+              }
+            : undefined,
+          configurationSnapshot:
+            source?.configuration ??
+            item.configurationSnapshot ??
+            undefined,
+          quantity: item.quantity,
+          unitCost: item.unitCost,
+          lineTotal: new Decimal(item.unitCost)
+            .times(item.quantity)
+            .toFixed(4),
+        };
+      });
+
+      const purchaseOrder = await transaction.purchaseOrder.create({
+        data: {
+          purchaseOrderNumber: await nextNumber(transaction, "purchase_order"),
+          supplierId: input.supplierId,
+          salesOrderId: input.salesOrderId,
+          buyerId: context.userId,
+          currencyCode: input.currencyCode,
+          exchangeRateToUsd: input.exchangeRateToUsd,
+          total: total.toFixed(4),
+          totalUsd: total.times(input.exchangeRateToUsd).toFixed(4),
+          paymentTerms: input.paymentTerms ?? supplier.paymentTerms,
+          shippingTerms: input.shippingTerms,
+          incoterm: input.incoterm,
+          deliveryAddress: input.deliveryAddress ?? undefined,
+          notes: input.notes,
+          attachments: input.attachmentIds ?? [],
+          expectedAt: input.expectedAt,
+          items: { create: itemSnapshots },
+        },
+        include: { items: true },
+      });
+
+      if (input.salesOrderId && lockedOrderVersion !== null) {
+        const orderClaimed = await transaction.salesOrder.updateMany({
+          where: {
+            id: input.salesOrderId,
+            version: lockedOrderVersion,
+            deletedAt: null,
+          },
+          data: { version: { increment: 1 } },
+        });
+        if (orderClaimed.count !== 1) {
+          throw new DomainError(
+            "PURCHASE_ORDER_CONFLICT",
+            "Sales order changed while creating the purchase order; refresh and retry",
+            409,
+          );
+        }
+      }
+
+      if (input.attachmentIds?.length) {
+        await transaction.fileAsset.updateMany({
+          where: { id: { in: input.attachmentIds }, deletedAt: null },
+          data: { entityType: "PurchaseOrder", entityId: purchaseOrder.id },
+        });
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "purchase_order.create",
+        entityType: "PurchaseOrder",
+        entityId: purchaseOrder.id,
+        after: {
+          number: purchaseOrder.purchaseOrderNumber,
+          salesOrderId: purchaseOrder.salesOrderId,
+          purchaseOverrideAuditId: overrideAuditId,
+          totalUsd: purchaseOrder.totalUsd.toString(),
+        },
+      });
+      return purchaseOrder;
+    });
+  }
+
+  transitionPurchaseOrder(
+    context: AuthorizationContext,
+    id: string,
+    status: string,
+    expectedVersion: number,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.purchaseOrder.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!row) {
+        throw new DomainError(
+          "PURCHASE_ORDER_NOT_FOUND",
+          "Purchase order not found",
+          404,
+        );
+      }
+      assertPurchaseOrderTransition(row.status, status);
+      if (["PARTIALLY_RECEIVED", "RECEIVED"].includes(status)) {
+        throw new DomainError(
+          "PURCHASE_RECEIPT_ENDPOINT_REQUIRED",
+          "Use the receiving workflow to record received quantities and inventory",
+          409,
+        );
+      }
+      const changed = await transaction.purchaseOrder.updateMany({
+        where: {
+          id,
+          status: row.status,
+          version: expectedVersion,
+          deletedAt: null,
+        },
+        data: {
+          status: status as never,
+          receivedAt: status === "RECEIVED" ? new Date() : row.receivedAt,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "PURCHASE_ORDER_CONFLICT",
+          "Purchase order changed; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "purchase_order.status_change",
+        entityType: "PurchaseOrder",
+        entityId: id,
+        before: { status: row.status, version: row.version },
+        after: { status, version: row.version + 1 },
+      });
+      return transaction.purchaseOrder.findUniqueOrThrow({ where: { id } });
+    });
+  }
+
+  receivePurchaseOrder(
+    context: AuthorizationContext,
+    id: string,
+    input: PurchaseOrderReceiptInput,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const purchaseOrder = await transaction.purchaseOrder.findFirst({
+        where: { id, deletedAt: null },
+        include: { items: { include: { product: true } } },
+      });
+      if (!purchaseOrder) {
+        throw new DomainError(
+          "PURCHASE_ORDER_NOT_FOUND",
+          "Purchase order not found",
+          404,
+        );
+      }
+      if (!["SENT", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status)) {
+        throw new DomainError(
+          "PURCHASE_ORDER_NOT_RECEIVABLE",
+          "Purchase order must be sent before receiving",
+          409,
+        );
+      }
+      if (purchaseOrder.version !== input.expectedVersion) {
+        throw new DomainError(
+          "PURCHASE_ORDER_CONFLICT",
+          "Purchase order changed; refresh and retry",
+          409,
+        );
+      }
+      const location = await transaction.warehouseLocation.findUnique({
+        where: { id: input.locationId },
+        include: { warehouse: true },
+      });
+      if (!location || location.warehouse.deletedAt) {
+        throw new DomainError(
+          "WAREHOUSE_LOCATION_NOT_FOUND",
+          "Warehouse location not found",
+          404,
+        );
+      }
+      const requestedIds = new Set(input.items.map((item) => item.purchaseOrderItemId));
+      if (requestedIds.size !== input.items.length) {
+        throw new DomainError(
+          "DUPLICATE_RECEIPT_ITEM",
+          "A receipt can include each purchase line once",
+          409,
+        );
+      }
+
+      for (const receipt of input.items) {
+        const line = purchaseOrder.items.find(
+          (item) => item.id === receipt.purchaseOrderItemId,
+        );
+        if (!line) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_ITEM_MISMATCH",
+            "Receipt line does not belong to the purchase order",
+            409,
+          );
+        }
+        if (line.receivedQuantity + receipt.quantity > line.quantity) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_OVER_QUANTITY",
+            "Received quantity exceeds the purchase order line",
+            409,
+          );
+        }
+        if (!line.productId || !line.product) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_PRODUCT_REQUIRED",
+            "Purchase line must identify a product before receiving",
+            409,
+          );
+        }
+        const serialNumbers = receipt.serialNumbers ?? [];
+        if (line.product.serialized && serialNumbers.length !== receipt.quantity) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_SERIAL_COUNT",
+            "Serialized receipt requires one unique serial per unit",
+            409,
+          );
+        }
+        if (!line.product.serialized && serialNumbers.length) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_UNEXPECTED_SERIAL",
+            "Non-serialized receipt cannot include serial numbers",
+            409,
+          );
+        }
+        if (new Set(serialNumbers).size !== serialNumbers.length) {
+          throw new DomainError(
+            "DUPLICATE_SERIAL",
+            "Serial numbers must be unique",
+            409,
+          );
+        }
+
+        let inventory = await transaction.inventoryItem.findFirst({
+          where: {
+            productId: line.productId,
+            locationId: input.locationId,
+            purchaseOrderItemId: line.id,
+            deletedAt: null,
+          },
+        });
+        if (!inventory) {
+          inventory = await transaction.inventoryItem.create({
+            data: {
+              productId: line.productId,
+              locationId: input.locationId,
+              purchaseOrderItemId: line.id,
+              quantityOnHand: 0,
+              unitCostUsd: new Decimal(line.unitCost)
+                .times(purchaseOrder.exchangeRateToUsd)
+                .toFixed(4),
+            },
+          });
+        }
+        const next = inventoryBalanceAfter(
+          {
+            onHand: inventory.quantityOnHand,
+            reserved: inventory.quantityReserved,
+          },
+          "RECEIPT",
+          receipt.quantity,
+        );
+        await updateInventoryConditionally(transaction, inventory, next);
+
+        if (line.product.serialized) {
+          for (const serialNumber of serialNumbers) {
+            const serial = await transaction.inventorySerial.create({
+              data: {
+                inventoryItemId: inventory.id,
+                serialNumber,
+                status: "AVAILABLE",
+                receivedAt: new Date(),
+              },
+            });
+            await transaction.inventoryTransaction.create({
+              data: {
+                inventoryItemId: inventory.id,
+                inventorySerialId: serial.id,
+                type: "RECEIPT",
+                quantity: 1,
+                toLocationId: input.locationId,
+                referenceType: "PurchaseOrder",
+                referenceId: purchaseOrder.id,
+                createdById: context.userId,
+              },
+            });
+          }
+        } else {
+          await transaction.inventoryTransaction.create({
+            data: {
+              inventoryItemId: inventory.id,
+              type: "RECEIPT",
+              quantity: receipt.quantity,
+              toLocationId: input.locationId,
+              referenceType: "PurchaseOrder",
+              referenceId: purchaseOrder.id,
+              createdById: context.userId,
+            },
+          });
+        }
+        const changedLine = await transaction.purchaseOrderItem.updateMany({
+          where: { id: line.id, receivedQuantity: line.receivedQuantity },
+          data: { receivedQuantity: { increment: receipt.quantity } },
+        });
+        if (changedLine.count !== 1) {
+          throw new DomainError(
+            "PURCHASE_RECEIPT_CONFLICT",
+            "Purchase receipt changed; refresh and retry",
+            409,
+          );
+        }
+      }
+
+      const refreshedItems = await transaction.purchaseOrderItem.findMany({
+        where: { purchaseOrderId: id },
+      });
+      const fullyReceived = refreshedItems.every(
+        (item) => item.receivedQuantity === item.quantity,
+      );
+      const changed = await transaction.purchaseOrder.updateMany({
+        where: {
+          id,
+          version: input.expectedVersion,
+          status: purchaseOrder.status,
+        },
+        data: {
+          status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
+          receivedAt: fullyReceived ? new Date() : null,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "PURCHASE_ORDER_CONFLICT",
+          "Purchase order changed; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "purchase_order.receive",
+        entityType: "PurchaseOrder",
+        entityId: id,
+        before: { status: purchaseOrder.status },
+        after: {
+          status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
+          locationId: input.locationId,
+          items: input.items.map((item) => ({
+            purchaseOrderItemId: item.purchaseOrderItemId,
+            quantity: item.quantity,
+          })),
+        },
+      });
+      return transaction.purchaseOrder.findUniqueOrThrow({
+        where: { id },
+        include: { items: true },
+      });
+    });
+  }
+
+  listInventory() {
+    return getPrisma().inventoryItem.findMany({
+      where: { deletedAt: null },
+      include: {
+        product: true,
+        location: { include: { warehouse: true } },
+        serials: true,
+        inspections: { orderBy: { createdAt: "desc" }, take: 5 },
+        purchaseOrderItem: { include: { purchaseOrder: true } },
+      },
+      orderBy: { updatedAt: "desc" },
+    });
+  }
+
+  listWarehouseLocations() {
+    return getPrisma().warehouseLocation.findMany({
+      where: { warehouse: { deletedAt: null, status: "ACTIVE" } },
+      include: { warehouse: true },
+      orderBy: [{ warehouse: { code: "asc" } }, { code: "asc" }],
+    });
+  }
+
+  mutateInventory(context: AuthorizationContext, input: InventoryMutationInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const item = await transaction.inventoryItem.findFirst({
+        where: { id: input.inventoryItemId, deletedAt: null },
+        include: { product: true },
+      });
+      if (!item) {
+        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
+      }
+      if (item.version !== input.expectedVersion) {
+        throw new DomainError(
+          "INVENTORY_CONFLICT",
+          "Inventory changed; refresh and retry",
+          409,
+        );
+      }
+
+      const existingSerial = input.serialNumber
+        ? await transaction.inventorySerial.findUnique({
+            where: { serialNumber: input.serialNumber },
+          })
+        : null;
+      if (
+        existingSerial &&
+        existingSerial.inventoryItemId !== item.id
+      ) {
+        throw new DomainError(
+          "SERIAL_IN_DIFFERENT_STOCK",
+          "Serial number belongs to another inventory item",
+          409,
+        );
+      }
+      const serialStatus = nextSerialStatus({
+        mutation: input.type,
+        serialized: item.product.serialized,
+        quantity: input.quantity,
+        serialNumber: input.serialNumber,
+        currentStatus: existingSerial?.status,
+      });
+      if (!item.product.serialized && input.serialNumber) {
+        throw new DomainError(
+          "UNEXPECTED_SERIAL",
+          "Non-serialized inventory cannot include a serial number",
+          409,
+        );
+      }
+      const consumeReserved =
+        input.type === "ISSUE" && existingSerial?.status === "RESERVED";
+      const next = inventoryBalanceAfter(
+        { onHand: item.quantityOnHand, reserved: item.quantityReserved },
+        input.type as InventoryMutation,
+        input.quantity,
+        { consumeReserved },
+      );
+
+      let serialId: string | undefined;
+      if (item.product.serialized && input.type === "RECEIPT") {
+        if (existingSerial) {
+          throw new DomainError(
+            "DUPLICATE_SERIAL",
+            "Serial number already exists",
+            409,
+          );
+        }
+        const serial = await transaction.inventorySerial.create({
+          data: {
+            inventoryItemId: item.id,
+            serialNumber: input.serialNumber!,
+            status: serialStatus,
+            receivedAt: new Date(),
+          },
+        });
+        serialId = serial.id;
+      } else if (item.product.serialized) {
+        if (!existingSerial) {
+          throw new DomainError("SERIAL_NOT_FOUND", "Serial number not found", 404);
+        }
+        const serialChanged = await transaction.inventorySerial.updateMany({
+          where: { id: existingSerial.id, status: existingSerial.status },
+          data: {
+            status: serialStatus,
+            issuedAt:
+              input.type === "ISSUE"
+                ? new Date()
+                : input.type === "RETURN"
+                  ? null
+                  : existingSerial.issuedAt,
+          },
+        });
+        if (serialChanged.count !== 1) {
+          throw new DomainError(
+            "SERIAL_CONFLICT",
+            "Serial state changed; refresh and retry",
+            409,
+          );
+        }
+        serialId = existingSerial.id;
+      }
+
+      await updateInventoryConditionally(transaction, item, next);
+      await transaction.inventoryTransaction.create({
+        data: {
+          inventoryItemId: item.id,
+          inventorySerialId: serialId,
+          type: input.type,
+          quantity: input.quantity,
+          referenceType: "manual",
+          notes: input.notes,
+          createdById: context.userId,
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "inventory.mutate",
+        entityType: "InventoryItem",
+        entityId: item.id,
+        before: {
+          onHand: item.quantityOnHand,
+          reserved: item.quantityReserved,
+          version: item.version,
+          serialStatus: existingSerial?.status,
+        },
+        after: {
+          ...next,
+          version: item.version + 1,
+          serialNumber: input.serialNumber,
+          serialStatus,
+        },
+      });
+      return transaction.inventoryItem.findUniqueOrThrow({
+        where: { id: item.id },
+        include: { serials: true },
+      });
+    });
+  }
+
+  transferInventory(
+    context: AuthorizationContext,
+    input: InventoryTransferInput,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const source = await transaction.inventoryItem.findFirst({
+        where: { id: input.inventoryItemId, deletedAt: null },
+        include: { product: true },
+      });
+      if (!source) {
+        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
+      }
+      if (source.version !== input.expectedVersion) {
+        throw new DomainError(
+          "INVENTORY_CONFLICT",
+          "Inventory changed; refresh and retry",
+          409,
+        );
+      }
+      if (source.locationId === input.toLocationId) {
+        throw new DomainError(
+          "SAME_WAREHOUSE_LOCATION",
+          "Source and destination locations must differ",
+          409,
+        );
+      }
+      const destinationLocation = await transaction.warehouseLocation.findUnique({
+        where: { id: input.toLocationId },
+        include: { warehouse: true },
+      });
+      if (!destinationLocation || destinationLocation.warehouse.deletedAt) {
+        throw new DomainError(
+          "WAREHOUSE_LOCATION_NOT_FOUND",
+          "Destination warehouse location not found",
+          404,
+        );
+      }
+      const serialNumbers = input.serialNumbers ?? [];
+      if (
+        source.product.serialized &&
+        serialNumbers.length !== input.quantity
+      ) {
+        throw new DomainError(
+          "TRANSFER_SERIAL_COUNT",
+          "Serialized transfer requires one serial per unit",
+          409,
+        );
+      }
+      if (!source.product.serialized && serialNumbers.length) {
+        throw new DomainError(
+          "UNEXPECTED_SERIAL",
+          "Non-serialized transfer cannot include serial numbers",
+          409,
+        );
+      }
+      const serials = source.product.serialized
+        ? await transaction.inventorySerial.findMany({
+            where: {
+              inventoryItemId: source.id,
+              serialNumber: { in: serialNumbers },
+              status: "AVAILABLE",
+            },
+          })
+        : [];
+      if (source.product.serialized && serials.length !== input.quantity) {
+        throw new DomainError(
+          "SERIAL_UNAVAILABLE",
+          "Every transferred serial must be available in the source location",
+          409,
+        );
+      }
+      const sourceNext = inventoryBalanceAfter(
+        { onHand: source.quantityOnHand, reserved: source.quantityReserved },
+        "ISSUE",
+        input.quantity,
+      );
+      await updateInventoryConditionally(transaction, source, sourceNext);
+
+      let destination = await transaction.inventoryItem.findFirst({
+        where: {
+          productId: source.productId,
+          locationId: input.toLocationId,
+          purchaseOrderItemId: source.purchaseOrderItemId,
+          deletedAt: null,
+        },
+      });
+      if (!destination) {
+        destination = await transaction.inventoryItem.create({
+          data: {
+            productId: source.productId,
+            locationId: input.toLocationId,
+            purchaseOrderItemId: source.purchaseOrderItemId,
+            quantityOnHand: 0,
+            unitCostUsd: source.unitCostUsd,
+          },
+        });
+      }
+      const destinationNext = inventoryBalanceAfter(
+        {
+          onHand: destination.quantityOnHand,
+          reserved: destination.quantityReserved,
+        },
+        "RECEIPT",
+        input.quantity,
+      );
+      await updateInventoryConditionally(transaction, destination, destinationNext);
+
+      for (const serial of serials) {
+        const changed = await transaction.inventorySerial.updateMany({
+          where: {
+            id: serial.id,
+            inventoryItemId: source.id,
+            status: "AVAILABLE",
+          },
+          data: { inventoryItemId: destination.id },
+        });
+        if (changed.count !== 1) {
+          throw new DomainError(
+            "SERIAL_CONFLICT",
+            "Serial state changed; refresh and retry",
+            409,
+          );
+        }
+      }
+      await transaction.inventoryTransaction.create({
+        data: {
+          inventoryItemId: source.id,
+          type: "TRANSFER",
+          quantity: input.quantity,
+          fromLocationId: source.locationId,
+          toLocationId: input.toLocationId,
+          referenceType: "InventoryTransfer",
+          notes: input.notes,
+          createdById: context.userId,
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "inventory.transfer",
+        entityType: "InventoryItem",
+        entityId: source.id,
+        before: { locationId: source.locationId, ...sourceNext },
+        after: {
+          locationId: input.toLocationId,
+          inventoryItemId: destination.id,
+          ...destinationNext,
+          serialNumbers,
+        },
+      });
+      return { source: sourceNext, destination: destinationNext };
+    });
+  }
+
+  listInspections() {
+    return getPrisma().qualityInspection.findMany({
+      include: {
+        inventoryItem: { include: { product: true } },
+        inventorySerial: true,
+        inspector: { select: { name: true } },
+      },
+      orderBy: { updatedAt: "desc" },
+    });
+  }
+
+  createInspection(context: AuthorizationContext, input: InspectionInput) {
+    assertInspectionResult(input.status, input.checklist);
+    return getPrisma().$transaction(async (transaction) => {
+      const inventory = await transaction.inventoryItem.findFirst({
+        where: { id: input.inventoryItemId, deletedAt: null },
+        include: { product: true },
+      });
+      if (!inventory) {
+        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
+      }
+      if (inventory.product.serialized && !input.inventorySerialId) {
+        throw new DomainError(
+          "INSPECTION_SERIAL_REQUIRED",
+          "Serialized inventory must be inspected by serial number",
+          409,
+        );
+      }
+      if (input.inventorySerialId) {
+        const serial = await transaction.inventorySerial.findFirst({
+          where: {
+            id: input.inventorySerialId,
+            inventoryItemId: inventory.id,
+            status: { in: ["AVAILABLE", "RESERVED"] },
+          },
+        });
+        if (!serial) {
+          throw new DomainError(
+            "INSPECTION_SERIAL_MISMATCH",
+            "Inspection serial does not belong to the inventory item",
+            409,
+          );
+        }
+      }
+      const inspection = await transaction.qualityInspection.create({
+        data: {
+          inventoryItemId: input.inventoryItemId,
+          inventorySerialId: input.inventorySerialId,
+          inspectorId: context.userId,
+          status: input.status,
+          checklist: {
+            ...input.checklist,
+            evidence: input.evidence ?? [],
+          },
+          notes: input.notes,
+          inspectedAt: input.status === "PENDING" ? null : new Date(),
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "quality_inspection.create",
+        entityType: "QualityInspection",
+        entityId: inspection.id,
+        after: {
+          status: inspection.status,
+          inventoryItemId: inspection.inventoryItemId,
+          inventorySerialId: inspection.inventorySerialId,
+        },
+      });
+      return inspection;
+    });
+  }
+
+  listShipments() {
+    return getPrisma().shipment.findMany({
+      where: { deletedAt: null },
+      include: {
+        salesOrder: { select: { orderNumber: true } },
+        coordinator: { select: { name: true } },
+        items: {
+          include: {
+            inventoryItem: { include: { product: true } },
+            serials: { include: { inventorySerial: true } },
+          },
+        },
+        documents: { include: { fileAsset: true } },
+      },
+      orderBy: { updatedAt: "desc" },
+    });
+  }
+
+  eligibleShipmentOrders() {
+    return getPrisma().salesOrder.findMany({
+      where: {
+        deletedAt: null,
+        status: { in: ["PURCHASING", "FULFILLING"] },
+      },
+      include: {
+        items: true,
+      },
+      orderBy: { updatedAt: "desc" },
+    });
+  }
+
+  createShipment(context: AuthorizationContext, input: ShipmentInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const order = await transaction.salesOrder.findFirst({
+        where: {
+          id: input.salesOrderId,
+          deletedAt: null,
+          status: { in: ["FULFILLING", "PURCHASING"] },
+        },
+        include: {
+          items: true,
+          shipments: {
+            where: { deletedAt: null, status: { not: "CANCELLED" } },
+            include: { items: true },
+          },
+        },
+      });
+      if (!order) {
+        throw new DomainError(
+          "ORDER_NOT_READY_FOR_SHIPMENT",
+          "Order must be purchasing or fulfilling before shipment",
+          409,
+        );
+      }
+      await assertFileAssets(transaction, input.documentIds);
+      if (new Set(input.items.map((item) => item.salesOrderItemId)).size !== input.items.length) {
+        throw new DomainError(
+          "DUPLICATE_SHIPMENT_ITEM",
+          "A shipment can include each sales order line once",
+          409,
+        );
+      }
+
+      const reservationPlans: Array<{
+        input: ShipmentInput["items"][number];
+        inventory: Awaited<
+          ReturnType<Transaction["inventoryItem"]["findFirstOrThrow"]>
+        > & {
+          product: { serialized: boolean };
+        };
+        serials: Array<{ id: string; status: string; serialNumber: string }>;
+      }> = [];
+
+      for (const item of input.items) {
+        const source = order.items.find(
+          (orderItem) => orderItem.id === item.salesOrderItemId,
+        );
+        if (!source || !source.productId) {
+          throw new DomainError(
+            "INVALID_SHIPMENT_ITEM",
+            "Shipment item does not belong to the sales order or has no product",
+            409,
+          );
+        }
+        const activeQuantities = order.shipments.flatMap((shipment) =>
+          shipment.items
+            .filter(
+              (shipmentItem) =>
+                shipmentItem.salesOrderItemId === item.salesOrderItemId,
+            )
+            .map((shipmentItem) => shipmentItem.quantity),
+        );
+        const remaining = remainingShippableQuantity(
+          source.quantity,
+          activeQuantities,
+        );
+        if (item.quantity > remaining) {
+          throw new DomainError(
+            "SHIPMENT_OVER_QUANTITY",
+            "Shipment quantity exceeds the remaining sales order quantity",
+            409,
+          );
+        }
+        const inventory = await transaction.inventoryItem.findFirst({
+          where: {
+            id: item.inventoryItemId,
+            productId: source.productId,
+            deletedAt: null,
+          },
+          include: { product: true },
+        });
+        if (!inventory) {
+          throw new DomainError(
+            "SHIPMENT_INVENTORY_MISMATCH",
+            "Shipment inventory does not match the sales order product",
+            409,
+          );
+        }
+        inventoryBalanceAfter(
+          {
+            onHand: inventory.quantityOnHand,
+            reserved: inventory.quantityReserved,
+          },
+          "RESERVATION",
+          item.quantity,
+        );
+
+        const serialNumbers = item.serialNumbers ?? [];
+        let serials: Array<{ id: string; status: string; serialNumber: string }> = [];
+        if (inventory.product.serialized) {
+          if (
+            serialNumbers.length !== item.quantity ||
+            new Set(serialNumbers).size !== serialNumbers.length
+          ) {
+            throw new DomainError(
+              "SHIPMENT_SERIAL_COUNT",
+              "Serialized shipment requires one unique serial per unit",
+              409,
+            );
+          }
+          serials = await transaction.inventorySerial.findMany({
+            where: {
+              inventoryItemId: inventory.id,
+              serialNumber: { in: serialNumbers },
+              status: "AVAILABLE",
+            },
+            select: { id: true, status: true, serialNumber: true },
+          });
+          if (serials.length !== item.quantity) {
+            throw new DomainError(
+              "SERIAL_UNAVAILABLE",
+              "Every shipment serial must be available",
+              409,
+            );
+          }
+          const inspections = await transaction.qualityInspection.findMany({
+            where: {
+              inventorySerialId: { in: serials.map((serial) => serial.id) },
+            },
+            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
+            select: {
+              inventorySerialId: true,
+              status: true,
+              checklist: true,
+            },
+          });
+          const latestBySerial = new Map<
+            string,
+            (typeof inspections)[number]
+          >();
+          for (const inspection of inspections) {
+            if (
+              inspection.inventorySerialId &&
+              !latestBySerial.has(inspection.inventorySerialId)
+            ) {
+              latestBySerial.set(inspection.inventorySerialId, inspection);
+            }
+          }
+          if (
+            serials.some((serial) => {
+              const latest = latestBySerial.get(serial.id);
+              return !latest || !inspectionPassesShipmentGate(latest);
+            })
+          ) {
+            throw new DomainError(
+              "SHIPMENT_INSPECTION_REQUIRED",
+              "Every serialized shipment unit requires a latest passing inspection with a completed checklist",
+              409,
+            );
+          }
+        } else {
+          if (serialNumbers.length) {
+            throw new DomainError(
+              "UNEXPECTED_SERIAL",
+              "Non-serialized shipment cannot include serial numbers",
+              409,
+            );
+          }
+          const latestInspection = await transaction.qualityInspection.findFirst({
+            where: {
+              inventoryItemId: inventory.id,
+              inventorySerialId: null,
+            },
+            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
+            select: { status: true, checklist: true },
+          });
+          if (
+            !latestInspection ||
+            !inspectionPassesShipmentGate(latestInspection)
+          ) {
+            throw new DomainError(
+              "SHIPMENT_INSPECTION_REQUIRED",
+              "Inventory requires a latest passing inspection with a completed checklist before shipment",
+              409,
+            );
+          }
+        }
+        reservationPlans.push({ input: item, inventory, serials });
+      }
+
+      const freightCostUsd =
+        input.freightCost &&
+        input.freightExchangeRateToUsd
+          ? new Decimal(input.freightCost)
+              .times(input.freightExchangeRateToUsd)
+              .toFixed(4)
+          : null;
+      const shipment = await transaction.shipment.create({
+        data: {
+          shipmentNumber: await nextNumber(transaction, "shipment"),
+          salesOrderId: input.salesOrderId,
+          coordinatorId: context.userId,
+          status: "BOOKED",
+          method: input.method,
+          carrier: input.carrier,
+          trackingNumber: input.trackingNumber,
+          incoterm: input.incoterm,
+          origin: input.origin,
+          destination: input.destination,
+          originPort: input.originPort,
+          destinationPort: input.destinationPort,
+          grossWeightKg: input.grossWeightKg,
+          volumeCbm: input.volumeCbm,
+          freightCost: input.freightCost,
+          freightCurrencyCode: input.freightCurrencyCode,
+          freightExchangeRateToUsd: input.freightExchangeRateToUsd,
+          freightCostUsd,
+          estimatedDepartureAt: input.estimatedDepartureAt,
+          estimatedArrivalAt: input.estimatedArrivalAt,
+        },
+      });
+
+      const uniqueInventory = new Map(
+        reservationPlans.map((plan) => [plan.inventory.id, plan.inventory]),
+      );
+      const projectedReservations = aggregateInventoryReservations(
+        Object.fromEntries(
+          [...uniqueInventory].map(([inventoryItemId, inventory]) => [
+            inventoryItemId,
+            {
+              onHand: inventory.quantityOnHand,
+              reserved: inventory.quantityReserved,
+            },
+          ]),
+        ),
+        reservationPlans.map((plan) => ({
+          inventoryItemId: plan.inventory.id,
+          quantity: plan.input.quantity,
+        })),
+      );
+      for (const [inventoryItemId, inventory] of uniqueInventory) {
+        await updateInventoryConditionally(
+          transaction,
+          inventory,
+          projectedReservations[inventoryItemId],
+        );
+      }
+
+      for (const plan of reservationPlans) {
+        const shipmentItem = await transaction.shipmentItem.create({
+          data: {
+            shipmentId: shipment.id,
+            salesOrderItemId: plan.input.salesOrderItemId,
+            inventoryItemId: plan.inventory.id,
+            quantity: plan.input.quantity,
+          },
+        });
+        if (plan.inventory.product.serialized) {
+          for (const serial of plan.serials) {
+            const changed = await transaction.inventorySerial.updateMany({
+              where: { id: serial.id, status: "AVAILABLE" },
+              data: { status: "RESERVED" },
+            });
+            if (changed.count !== 1) {
+              throw new DomainError(
+                "SERIAL_CONFLICT",
+                "Serial state changed; refresh and retry",
+                409,
+              );
+            }
+            await transaction.shipmentSerial.create({
+              data: {
+                shipmentItemId: shipmentItem.id,
+                inventorySerialId: serial.id,
+                status: "RESERVED",
+              },
+            });
+            await transaction.inventoryTransaction.create({
+              data: {
+                inventoryItemId: plan.inventory.id,
+                inventorySerialId: serial.id,
+                type: "RESERVATION",
+                quantity: 1,
+                referenceType: "Shipment",
+                referenceId: shipment.id,
+                createdById: context.userId,
+              },
+            });
+          }
+        } else {
+          await transaction.inventoryTransaction.create({
+            data: {
+              inventoryItemId: plan.inventory.id,
+              type: "RESERVATION",
+              quantity: plan.input.quantity,
+              referenceType: "Shipment",
+              referenceId: shipment.id,
+              createdById: context.userId,
+            },
+          });
+        }
+      }
+      if (input.documentIds?.length) {
+        await transaction.shipmentDocument.createMany({
+          data: input.documentIds.map((fileAssetId) => ({
+            shipmentId: shipment.id,
+            fileAssetId,
+            documentType: "OTHER",
+          })),
+        });
+        await transaction.fileAsset.updateMany({
+          where: { id: { in: input.documentIds }, deletedAt: null },
+          data: { entityType: "Shipment", entityId: shipment.id },
+        });
+      }
+      const orderChanged = await transaction.salesOrder.updateMany({
+        where: { id: order.id, version: order.version },
+        data: {
+          status: "FULFILLING",
+          shipmentStatus: "BOOKED",
+          version: { increment: 1 },
+        },
+      });
+      if (orderChanged.count !== 1) {
+        throw new DomainError(
+          "ORDER_SHIPMENT_CONFLICT",
+          "Order changed while reserving shipment; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "shipment.create",
+        entityType: "Shipment",
+        entityId: shipment.id,
+        after: {
+          number: shipment.shipmentNumber,
+          orderId: shipment.salesOrderId,
+          items: reservationPlans.map((plan) => ({
+            salesOrderItemId: plan.input.salesOrderItemId,
+            inventoryItemId: plan.input.inventoryItemId,
+            quantity: plan.input.quantity,
+            serialNumbers: plan.serials.map((serial) => serial.serialNumber),
+          })),
+        },
+      });
+      return transaction.shipment.findUniqueOrThrow({
+        where: { id: shipment.id },
+        include: {
+          items: {
+            include: {
+              serials: { include: { inventorySerial: true } },
+            },
+          },
+          documents: true,
+        },
+      });
+    });
+  }
+
+  transitionShipment(
+    context: AuthorizationContext,
+    id: string,
+    status: string,
+    expectedVersion: number,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const shipment = await transaction.shipment.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          items: {
+            include: {
+              inventoryItem: true,
+              serials: { include: { inventorySerial: true } },
+            },
+          },
+          salesOrder: { include: { items: true } },
+        },
+      });
+      if (!shipment) {
+        throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
+      }
+      assertShipmentTransition(shipment.status, status);
+      const changed = await transaction.shipment.updateMany({
+        where: {
+          id,
+          status: shipment.status,
+          version: expectedVersion,
+          deletedAt: null,
+        },
+        data: {
+          status: status as never,
+          shippedAt: status === "IN_TRANSIT" ? new Date() : shipment.shippedAt,
+          deliveredAt: status === "DELIVERED" ? new Date() : shipment.deliveredAt,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "SHIPMENT_CONFLICT",
+          "Shipment changed; refresh and retry",
+          409,
+        );
+      }
+
+      if (status === "IN_TRANSIT" || status === "CANCELLED") {
+        const inventoryById = new Map<
+          string,
+          NonNullable<(typeof shipment.items)[number]["inventoryItem"]>
+        >();
+        const projected: Record<string, { onHand: number; reserved: number }> = {};
+        for (const item of shipment.items) {
+          if (!item.inventoryItem) {
+            throw new DomainError(
+              "SHIPMENT_INVENTORY_MISSING",
+              "Shipment item has no inventory assignment",
+              409,
+            );
+          }
+          inventoryById.set(item.inventoryItem.id, item.inventoryItem);
+          const current = projected[item.inventoryItem.id] ?? {
+            onHand: item.inventoryItem.quantityOnHand,
+            reserved: item.inventoryItem.quantityReserved,
+          };
+          projected[item.inventoryItem.id] = inventoryBalanceAfter(
+            current,
+            status === "IN_TRANSIT" ? "ISSUE" : "RELEASE",
+            item.quantity,
+            { consumeReserved: status === "IN_TRANSIT" },
+          );
+        }
+        for (const [inventoryItemId, inventory] of inventoryById) {
+          await updateInventoryConditionally(
+            transaction,
+            inventory,
+            projected[inventoryItemId],
+          );
+        }
+
+        for (const item of shipment.items) {
+          if (!item.inventoryItem) {
+            throw new DomainError(
+              "SHIPMENT_INVENTORY_MISSING",
+              "Shipment item has no inventory assignment",
+              409,
+            );
+          }
+          const mutation = status === "IN_TRANSIT" ? "ISSUE" : "RELEASE";
+          if (item.serials.length) {
+            if (item.serials.length !== item.quantity) {
+              throw new DomainError(
+                "SHIPMENT_SERIAL_TRAIL_INCOMPLETE",
+                "Shipment serial trail does not match the shipment quantity",
+                409,
+              );
+            }
+            for (const trail of item.serials) {
+              const nextStatus = status === "IN_TRANSIT" ? "ISSUED" : "AVAILABLE";
+              const serialChanged = await transaction.inventorySerial.updateMany({
+                where: {
+                  id: trail.inventorySerialId,
+                  status: "RESERVED",
+                },
+                data: {
+                  status: nextStatus,
+                  issuedAt: status === "IN_TRANSIT" ? new Date() : null,
+                },
+              });
+              if (serialChanged.count !== 1) {
+                throw new DomainError(
+                  "SERIAL_CONFLICT",
+                  "Serial state changed; refresh and retry",
+                  409,
+                );
+              }
+              await transaction.shipmentSerial.update({
+                where: { id: trail.id },
+                data:
+                  status === "IN_TRANSIT"
+                    ? { status: "ISSUED", issuedAt: new Date() }
+                    : { status: "RELEASED", releasedAt: new Date() },
+              });
+              await transaction.inventoryTransaction.create({
+                data: {
+                  inventoryItemId: item.inventoryItem.id,
+                  inventorySerialId: trail.inventorySerialId,
+                  type: mutation,
+                  quantity: 1,
+                  referenceType: "Shipment",
+                  referenceId: shipment.id,
+                  createdById: context.userId,
+                },
+              });
+            }
+          } else {
+            await transaction.inventoryTransaction.create({
+              data: {
+                inventoryItemId: item.inventoryItem.id,
+                type: mutation,
+                quantity: item.quantity,
+                referenceType: "Shipment",
+                referenceId: shipment.id,
+                createdById: context.userId,
+              },
+            });
+          }
+        }
+      }
+
+      const orderShipments = await transaction.shipment.findMany({
+        where: {
+          salesOrderId: shipment.salesOrderId,
+          deletedAt: null,
+          status: { not: "CANCELLED" },
+        },
+        include: { items: true },
+      });
+      const { orderStatus, shipmentStatus } = deriveShipmentOrderState(
+        shipment.salesOrder.items,
+        orderShipments.flatMap((row) =>
+          row.items.map((item) => ({
+            status: row.status,
+            salesOrderItemId: item.salesOrderItemId,
+            quantity: item.quantity,
+          })),
+        ),
+      );
+      const orderChanged = await transaction.salesOrder.updateMany({
+        where: {
+          id: shipment.salesOrderId,
+          version: shipment.salesOrder.version,
+          deletedAt: null,
+        },
+        data: {
+          status: orderStatus,
+          shipmentStatus,
+          version: { increment: 1 },
+        },
+      });
+      if (orderChanged.count !== 1) {
+        throw new DomainError(
+          "ORDER_SHIPMENT_CONFLICT",
+          "Order changed while synchronizing shipment; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "shipment.status_change",
+        entityType: "Shipment",
+        entityId: id,
+        before: { status: shipment.status, version: shipment.version },
+        after: {
+          status,
+          version: shipment.version + 1,
+          orderStatus,
+          shipmentStatus,
+        },
+      });
+      return transaction.shipment.findUniqueOrThrow({ where: { id } });
+    });
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-forms.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-forms.tsx"
new file mode 100644
index 0000000..b4ba41e
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-forms.tsx"
@@ -0,0 +1,1368 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useMemo, useState } from "react";
+
+type Locale = "en" | "zh";
+type Option = { id: string; label: string };
+type InventoryOption = Option & {
+  version: number;
+  serialized: boolean;
+  serials: Array<{ id: string; serialNumber: string; status: string }>;
+};
+type OrderOption = Option & {
+  items: Array<{ id: string; label: string; quantity: number }>;
+};
+
+const text = {
+  en: {
+    save: "Save",
+    saving: "Saving…",
+    saved: "Saved successfully.",
+    failed: "Request failed.",
+    addLine: "Add line",
+    remove: "Remove",
+    select: "Select…",
+  },
+  zh: {
+    save: "保存",
+    saving: "保存中…",
+    saved: "保存成功。",
+    failed: "请求失败。",
+    addLine: "添加明细",
+    remove: "删除",
+    select: "请选择…",
+  },
+} as const;
+
+function commaSeparatedValues(value: FormDataEntryValue | null) {
+  return String(value ?? "")
+    .split(",")
+    .map((entry) => entry.trim())
+    .filter(Boolean);
+}
+
+function useMutation(locale: Locale) {
+  const router = useRouter();
+  const [busy, setBusy] = useState(false);
+  const [message, setMessage] = useState("");
+  const [error, setError] = useState(false);
+
+  async function submit(endpoint: string, body: unknown, method = "POST") {
+    setBusy(true);
+    setMessage("");
+    setError(false);
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
+        throw new Error(result.error?.message ?? text[locale].failed);
+      }
+      setMessage(text[locale].saved);
+      router.refresh();
+      return true;
+    } catch (caught) {
+      setError(true);
+      setMessage(caught instanceof Error ? caught.message : text[locale].failed);
+      return false;
+    } finally {
+      setBusy(false);
+    }
+  }
+
+  return { busy, message, error, submit };
+}
+
+function Feedback({
+  busy,
+  message,
+  error,
+  locale,
+}: {
+  busy: boolean;
+  message: string;
+  error: boolean;
+  locale: Locale;
+}) {
+  return (
+    <>
+      <button className="button" disabled={busy} type="submit">
+        {busy ? text[locale].saving : text[locale].save}
+      </button>
+      {message ? (
+        <p className={`form-feedback ${error ? "error" : "success"}`} role="status">
+          {message}
+        </p>
+      ) : null}
+    </>
+  );
+}
+
+export function PurchaseOrderForm({
+  locale,
+  suppliers,
+  orders,
+}: {
+  locale: Locale;
+  suppliers: Option[];
+  orders: OrderOption[];
+}) {
+  const mutation = useMutation(locale);
+  const [salesOrderId, setSalesOrderId] = useState(orders[0]?.id ?? "");
+  const activeOrder = orders.find((order) => order.id === salesOrderId);
+  const [lines, setLines] = useState([
+    { salesOrderItemId: orders[0]?.items[0]?.id ?? "", quantity: 1, unitCost: "" },
+  ]);
+  const labels =
+    locale === "zh"
+      ? {
+          supplier: "供应商",
+          order: "销售订单",
+          currency: "币种",
+          rate: "兑 USD 汇率",
+          payment: "付款条款",
+          shipping: "运输条款",
+          incoterm: "贸易术语",
+          expected: "预计到货",
+          attachments: "附件资产 ID（逗号分隔）",
+          line: "销售订单明细",
+          quantity: "数量",
+          cost: "采购单价",
+        }
+      : {
+          supplier: "Supplier",
+          order: "Sales order",
+          currency: "Currency",
+          rate: "Rate to USD",
+          payment: "Payment terms",
+          shipping: "Shipping terms",
+          incoterm: "Incoterm",
+          expected: "Expected receipt",
+          attachments: "Attachment asset IDs (comma separated)",
+          line: "Sales order line",
+          quantity: "Quantity",
+          cost: "Unit cost",
+        };
+
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit("/api/purchase-orders", {
+          supplierId: data.get("supplierId"),
+          salesOrderId,
+          currencyCode: data.get("currencyCode"),
+          exchangeRateToUsd: data.get("exchangeRateToUsd"),
+          paymentTerms: data.get("paymentTerms") || undefined,
+          shippingTerms: data.get("shippingTerms") || undefined,
+          incoterm: data.get("incoterm") || undefined,
+          expectedAt: data.get("expectedAt") || undefined,
+          attachmentIds: commaSeparatedValues(data.get("attachmentIds")),
+          items: lines.map((line) => ({
+            salesOrderItemId: line.salesOrderItemId,
+            quantity: Number(line.quantity),
+            unitCost: line.unitCost,
+          })),
+        });
+      }}
+    >
+      <label>
+        {labels.supplier}
+        <select name="supplierId" required>
+          <option value="">{text[locale].select}</option>
+          {suppliers.map((supplier) => (
+            <option key={supplier.id} value={supplier.id}>
+              {supplier.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {labels.order}
+        <select
+          required
+          value={salesOrderId}
+          onChange={(event) => {
+            const id = event.target.value;
+            const order = orders.find((candidate) => candidate.id === id);
+            setSalesOrderId(id);
+            setLines([
+              {
+                salesOrderItemId: order?.items[0]?.id ?? "",
+                quantity: 1,
+                unitCost: "",
+              },
+            ]);
+          }}
+        >
+          <option value="">{text[locale].select}</option>
+          {orders.map((order) => (
+            <option key={order.id} value={order.id}>
+              {order.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {labels.currency}
+        <input defaultValue="USD" maxLength={3} name="currencyCode" required />
+      </label>
+      <label>
+        {labels.rate}
+        <input defaultValue="1" inputMode="decimal" name="exchangeRateToUsd" required />
+      </label>
+      <label>
+        {labels.payment}
+        <input name="paymentTerms" />
+      </label>
+      <label>
+        {labels.shipping}
+        <input name="shippingTerms" />
+      </label>
+      <label>
+        {labels.incoterm}
+        <input name="incoterm" placeholder="FOB" />
+      </label>
+      <label>
+        {labels.expected}
+        <input name="expectedAt" type="date" />
+      </label>
+      <label>
+        {labels.attachments}
+        <input name="attachmentIds" />
+      </label>
+      <div className="workflow-lines">
+        {lines.map((line, index) => (
+          <div className="workflow-line" key={index}>
+            <label>
+              {labels.line}
+              <select
+                required
+                value={line.salesOrderItemId}
+                onChange={(event) =>
+                  setLines((current) =>
+                    current.map((candidate, candidateIndex) =>
+                      candidateIndex === index
+                        ? { ...candidate, salesOrderItemId: event.target.value }
+                        : candidate,
+                    ),
+                  )
+                }
+              >
+                <option value="">{text[locale].select}</option>
+                {activeOrder?.items.map((item) => (
+                  <option key={item.id} value={item.id}>
+                    {item.label} × {item.quantity}
+                  </option>
+                ))}
+              </select>
+            </label>
+            <label>
+              {labels.quantity}
+              <input
+                min={1}
+                required
+                type="number"
+                value={line.quantity}
+                onChange={(event) =>
+                  setLines((current) =>
+                    current.map((candidate, candidateIndex) =>
+                      candidateIndex === index
+                        ? { ...candidate, quantity: Number(event.target.value) }
+                        : candidate,
+                    ),
+                  )
+                }
+              />
+            </label>
+            <label>
+              {labels.cost}
+              <input
+                inputMode="decimal"
+                required
+                value={line.unitCost}
+                onChange={(event) =>
+                  setLines((current) =>
+                    current.map((candidate, candidateIndex) =>
+                      candidateIndex === index
+                        ? { ...candidate, unitCost: event.target.value }
+                        : candidate,
+                    ),
+                  )
+                }
+              />
+            </label>
+            {lines.length > 1 ? (
+              <button
+                className="button button-secondary"
+                onClick={() =>
+                  setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))
+                }
+                type="button"
+              >
+                {text[locale].remove}
+              </button>
+            ) : null}
+          </div>
+        ))}
+        <button
+          className="button button-secondary"
+          onClick={() =>
+            setLines((current) => [
+              ...current,
+              {
+                salesOrderItemId: activeOrder?.items[0]?.id ?? "",
+                quantity: 1,
+                unitCost: "",
+              },
+            ])
+          }
+          type="button"
+        >
+          {text[locale].addLine}
+        </button>
+      </div>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function InventoryMutationForm({
+  locale,
+  items,
+}: {
+  locale: Locale;
+  items: InventoryOption[];
+}) {
+  const mutation = useMutation(locale);
+  const [inventoryId, setInventoryId] = useState(items[0]?.id ?? "");
+  const active = items.find((item) => item.id === inventoryId);
+  const labels =
+    locale === "zh"
+      ? { item: "库存记录", type: "操作", quantity: "数量", serial: "序列号", notes: "备注" }
+      : { item: "Inventory item", type: "Action", quantity: "Quantity", serial: "Serial number", notes: "Notes" };
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit("/api/inventory/transactions", {
+          inventoryItemId: inventoryId,
+          expectedVersion: active?.version,
+          type: data.get("type"),
+          quantity: Number(data.get("quantity")),
+          serialNumber: data.get("serialNumber") || undefined,
+          notes: data.get("notes") || undefined,
+        });
+      }}
+    >
+      <label>
+        {labels.item}
+        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
+          {items.map((item) => (
+            <option key={item.id} value={item.id}>
+              {item.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {labels.type}
+        <select name="type">
+          {["RECEIPT", "RESERVATION", "RELEASE", "ISSUE", "DAMAGE", "RETURN", "COUNT"].map(
+            (type) => (
+              <option key={type}>{type}</option>
+            ),
+          )}
+        </select>
+      </label>
+      <label>
+        {labels.quantity}
+        <input defaultValue={1} min={1} name="quantity" required type="number" />
+      </label>
+      <label>
+        {labels.serial}
+        <input
+          list={`serials-${inventoryId}`}
+          name="serialNumber"
+          required={active?.serialized}
+        />
+        <datalist id={`serials-${inventoryId}`}>
+          {active?.serials.map((serial) => (
+            <option key={serial.id} value={serial.serialNumber}>
+              {serial.status}
+            </option>
+          ))}
+        </datalist>
+      </label>
+      <label>
+        {labels.notes}
+        <textarea name="notes" />
+      </label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function InventoryTransferForm({
+  locale,
+  items,
+  locations,
+}: {
+  locale: Locale;
+  items: InventoryOption[];
+  locations: Option[];
+}) {
+  const mutation = useMutation(locale);
+  const [inventoryId, setInventoryId] = useState(items[0]?.id ?? "");
+  const active = items.find((item) => item.id === inventoryId);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        const serials = String(data.get("serialNumbers") ?? "")
+          .split(",")
+          .map((value) => value.trim())
+          .filter(Boolean);
+        await mutation.submit("/api/inventory/transfer", {
+          inventoryItemId: inventoryId,
+          expectedVersion: active?.version,
+          toLocationId: data.get("toLocationId"),
+          quantity: Number(data.get("quantity")),
+          serialNumbers: serials.length ? serials : undefined,
+          notes: data.get("notes") || undefined,
+        });
+      }}
+    >
+      <label>
+        {locale === "zh" ? "库存记录" : "Inventory item"}
+        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
+          {items.map((item) => (
+            <option key={item.id} value={item.id}>
+              {item.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "目标库位" : "Destination location"}
+        <select name="toLocationId" required>
+          {locations.map((location) => (
+            <option key={location.id} value={location.id}>
+              {location.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "数量" : "Quantity"}
+        <input defaultValue={1} min={1} name="quantity" required type="number" />
+      </label>
+      <label>
+        {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
+        <input name="serialNumbers" required={active?.serialized} />
+      </label>
+      <label>
+        {locale === "zh" ? "备注" : "Notes"}
+        <textarea name="notes" />
+      </label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function InspectionForm({
+  locale,
+  items,
+  initialInventoryId,
+  initialSerialId,
+}: {
+  locale: Locale;
+  items: InventoryOption[];
+  initialInventoryId?: string;
+  initialSerialId?: string;
+}) {
+  const mutation = useMutation(locale);
+  const [inventoryId, setInventoryId] = useState(
+    initialInventoryId ?? items[0]?.id ?? "",
+  );
+  const active = items.find((item) => item.id === inventoryId);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit("/api/inspections", {
+          inventoryItemId: inventoryId,
+          inventorySerialId: data.get("inventorySerialId") || undefined,
+          status: data.get("status"),
+          checklist: {
+            appearance: data.has("appearance"),
+            serialVerified: data.has("serialVerified"),
+            boot: data.has("boot"),
+            burnIn: data.has("burnIn"),
+            ports: data.has("ports"),
+          },
+          notes: data.get("notes") || undefined,
+          evidence:
+            data.get("evidenceObjectKey") && data.get("evidenceFileName")
+              ? [
+                  {
+                    objectKey: data.get("evidenceObjectKey"),
+                    fileName: data.get("evidenceFileName"),
+                  },
+                ]
+              : [],
+        });
+      }}
+    >
+      <label>
+        {locale === "zh" ? "库存记录" : "Inventory item"}
+        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
+          {items.map((item) => (
+            <option key={item.id} value={item.id}>
+              {item.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "序列号" : "Serial number"}
+        <select
+          defaultValue={initialSerialId ?? ""}
+          name="inventorySerialId"
+          required={active?.serialized}
+        >
+          <option value="">{text[locale].select}</option>
+          {active?.serials
+            .filter((serial) => ["AVAILABLE", "RESERVED"].includes(serial.status))
+            .map((serial) => (
+              <option key={serial.id} value={serial.id}>
+                {serial.serialNumber} · {serial.status}
+              </option>
+            ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "结果" : "Result"}
+        <select name="status">
+          {["PENDING", "PASSED", "FAILED", "CONDITIONAL"].map((status) => (
+            <option key={status}>{status}</option>
+          ))}
+        </select>
+      </label>
+      <fieldset className="checklist-fieldset">
+        <legend>{locale === "zh" ? "质检清单" : "Inspection checklist"}</legend>
+        {[
+          ["appearance", locale === "zh" ? "外观" : "Appearance"],
+          ["serialVerified", locale === "zh" ? "序列号核对" : "Serial verified"],
+          ["boot", locale === "zh" ? "启动测试" : "Boot test"],
+          ["burnIn", locale === "zh" ? "烤机测试" : "Burn-in"],
+          ["ports", locale === "zh" ? "端口测试" : "Port test"],
+        ].map(([name, label]) => (
+          <label key={name}>
+            <input name={name} type="checkbox" /> {label}
+          </label>
+        ))}
+      </fieldset>
+      <label>
+        {locale === "zh" ? "证据文件名" : "Evidence file name"}
+        <input name="evidenceFileName" />
+      </label>
+      <label>
+        {locale === "zh" ? "对象存储路径" : "Object storage key"}
+        <input name="evidenceObjectKey" />
+      </label>
+      <label>
+        {locale === "zh" ? "备注" : "Notes"}
+        <textarea name="notes" />
+      </label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function ShipmentForm({
+  locale,
+  orders,
+  inventory,
+}: {
+  locale: Locale;
+  orders: OrderOption[];
+  inventory: InventoryOption[];
+}) {
+  const mutation = useMutation(locale);
+  const [salesOrderId, setSalesOrderId] = useState(orders[0]?.id ?? "");
+  const activeOrder = orders.find((order) => order.id === salesOrderId);
+  const [lines, setLines] = useState([
+    {
+      salesOrderItemId: orders[0]?.items[0]?.id ?? "",
+      inventoryItemId: inventory[0]?.id ?? "",
+      quantity: 1,
+      serialNumbers: "",
+    },
+  ]);
+  const inventoryById = useMemo(
+    () => new Map(inventory.map((item) => [item.id, item])),
+    [inventory],
+  );
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit("/api/shipments", {
+          salesOrderId,
+          method: data.get("method"),
+          carrier: data.get("carrier") || undefined,
+          trackingNumber: data.get("trackingNumber") || undefined,
+          incoterm: data.get("incoterm") || undefined,
+          origin: data.get("origin") || undefined,
+          destination: data.get("destination") || undefined,
+          originPort: data.get("originPort") || undefined,
+          destinationPort: data.get("destinationPort") || undefined,
+          grossWeightKg: data.get("grossWeightKg") || undefined,
+          volumeCbm: data.get("volumeCbm") || undefined,
+          freightCost: data.get("freightCost") || undefined,
+          freightCurrencyCode: data.get("freightCurrencyCode") || undefined,
+          freightExchangeRateToUsd:
+            data.get("freightExchangeRateToUsd") || undefined,
+          estimatedDepartureAt: data.get("estimatedDepartureAt") || undefined,
+          estimatedArrivalAt: data.get("estimatedArrivalAt") || undefined,
+          documentIds: commaSeparatedValues(data.get("documentIds")),
+          items: lines.map((line) => {
+            const serialNumbers = line.serialNumbers
+              .split(",")
+              .map((value) => value.trim())
+              .filter(Boolean);
+            return {
+              salesOrderItemId: line.salesOrderItemId,
+              inventoryItemId: line.inventoryItemId,
+              quantity: Number(line.quantity),
+              serialNumbers: serialNumbers.length ? serialNumbers : undefined,
+            };
+          }),
+        });
+      }}
+    >
+      <label>
+        {locale === "zh" ? "销售订单" : "Sales order"}
+        <select
+          value={salesOrderId}
+          onChange={(event) => {
+            setSalesOrderId(event.target.value);
+            const order = orders.find((candidate) => candidate.id === event.target.value);
+            setLines((current) =>
+              current.map((line, index) => ({
+                ...line,
+                salesOrderItemId: index === 0 ? order?.items[0]?.id ?? "" : "",
+              })),
+            );
+          }}
+        >
+          {orders.map((order) => (
+            <option key={order.id} value={order.id}>
+              {order.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "运输方式" : "Method"}
+        <select name="method">
+          {["AIR", "SEA", "ROAD", "RAIL", "COURIER", "CUSTOMER_PICKUP"].map(
+            (method) => (
+              <option key={method}>{method}</option>
+            ),
+          )}
+        </select>
+      </label>
+      {[
+        ["carrier", locale === "zh" ? "承运商" : "Carrier"],
+        ["trackingNumber", locale === "zh" ? "运单号" : "Tracking number"],
+        ["incoterm", locale === "zh" ? "贸易术语" : "Incoterm"],
+        ["origin", locale === "zh" ? "起运地" : "Origin"],
+        ["destination", locale === "zh" ? "目的地" : "Destination"],
+        ["originPort", locale === "zh" ? "起运港" : "Origin port"],
+        ["destinationPort", locale === "zh" ? "目的港" : "Destination port"],
+        ["grossWeightKg", locale === "zh" ? "毛重（kg）" : "Gross weight (kg)"],
+        ["volumeCbm", locale === "zh" ? "体积（m³）" : "Volume (m³)"],
+        ["freightCost", locale === "zh" ? "运费" : "Freight cost"],
+        ["freightCurrencyCode", locale === "zh" ? "运费币种" : "Freight currency"],
+        ["freightExchangeRateToUsd", locale === "zh" ? "运费兑 USD 汇率" : "Freight rate to USD"],
+        ["documentIds", locale === "zh" ? "单证资产 ID（逗号分隔）" : "Document asset IDs (comma separated)"],
+      ].map(([name, label]) => (
+        <label key={name}>
+          {label}
+          <input name={name} />
+        </label>
+      ))}
+      <label>
+        {locale === "zh" ? "预计发运" : "Estimated departure"}
+        <input name="estimatedDepartureAt" type="date" />
+      </label>
+      <label>
+        {locale === "zh" ? "预计到达" : "Estimated arrival"}
+        <input name="estimatedArrivalAt" type="date" />
+      </label>
+      <div className="workflow-lines">
+        {lines.map((line, index) => {
+          const stock = inventoryById.get(line.inventoryItemId);
+          return (
+            <div className="workflow-line" key={index}>
+              <label>
+                {locale === "zh" ? "订单明细" : "Order line"}
+                <select
+                  value={line.salesOrderItemId}
+                  onChange={(event) =>
+                    setLines((current) =>
+                      current.map((candidate, rowIndex) =>
+                        rowIndex === index
+                          ? { ...candidate, salesOrderItemId: event.target.value }
+                          : candidate,
+                      ),
+                    )
+                  }
+                >
+                  {activeOrder?.items.map((item) => (
+                    <option key={item.id} value={item.id}>
+                      {item.label} × {item.quantity}
+                    </option>
+                  ))}
+                </select>
+              </label>
+              <label>
+                {locale === "zh" ? "库存记录" : "Inventory item"}
+                <select
+                  value={line.inventoryItemId}
+                  onChange={(event) =>
+                    setLines((current) =>
+                      current.map((candidate, rowIndex) =>
+                        rowIndex === index
+                          ? {
+                              ...candidate,
+                              inventoryItemId: event.target.value,
+                              serialNumbers: "",
+                            }
+                          : candidate,
+                      ),
+                    )
+                  }
+                >
+                  {inventory.map((item) => (
+                    <option key={item.id} value={item.id}>
+                      {item.label}
+                    </option>
+                  ))}
+                </select>
+              </label>
+              <label>
+                {locale === "zh" ? "数量" : "Quantity"}
+                <input
+                  min={1}
+                  type="number"
+                  value={line.quantity}
+                  onChange={(event) =>
+                    setLines((current) =>
+                      current.map((candidate, rowIndex) =>
+                        rowIndex === index
+                          ? { ...candidate, quantity: Number(event.target.value) }
+                          : candidate,
+                      ),
+                    )
+                  }
+                />
+              </label>
+              <label>
+                {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
+                <input
+                  list={`shipment-serials-${index}`}
+                  required={stock?.serialized}
+                  value={line.serialNumbers}
+                  onChange={(event) =>
+                    setLines((current) =>
+                      current.map((candidate, rowIndex) =>
+                        rowIndex === index
+                          ? { ...candidate, serialNumbers: event.target.value }
+                          : candidate,
+                      ),
+                    )
+                  }
+                />
+                <datalist id={`shipment-serials-${index}`}>
+                  {stock?.serials
+                    .filter((serial) => serial.status === "AVAILABLE")
+                    .map((serial) => (
+                      <option key={serial.id} value={serial.serialNumber} />
+                    ))}
+                </datalist>
+              </label>
+              {lines.length > 1 ? (
+                <button
+                  className="button button-secondary"
+                  onClick={() =>
+                    setLines((current) =>
+                      current.filter((_, rowIndex) => rowIndex !== index),
+                    )
+                  }
+                  type="button"
+                >
+                  {text[locale].remove}
+                </button>
+              ) : null}
+            </div>
+          );
+        })}
+        <button
+          className="button button-secondary"
+          onClick={() =>
+            setLines((current) => [
+              ...current,
+              {
+                salesOrderItemId: activeOrder?.items[0]?.id ?? "",
+                inventoryItemId: inventory[0]?.id ?? "",
+                quantity: 1,
+                serialNumbers: "",
+              },
+            ])
+          }
+          type="button"
+        >
+          {text[locale].addLine}
+        </button>
+      </div>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function WorkflowAction({
+  locale,
+  endpoint,
+  body,
+  label,
+  confirmMessage,
+}: {
+  locale: Locale;
+  endpoint: string;
+  body: Record<string, unknown>;
+  label: string;
+  confirmMessage?: string;
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <div className="inline-action">
+      <button
+        className="button button-secondary"
+        disabled={mutation.busy}
+        onClick={() => {
+          if (!confirmMessage || window.confirm(confirmMessage)) {
+            void mutation.submit(endpoint, body);
+          }
+        }}
+        type="button"
+      >
+        {mutation.busy ? text[locale].saving : label}
+      </button>
+      {mutation.message ? (
+        <span className={`form-feedback ${mutation.error ? "error" : "success"}`}>
+          {mutation.message}
+        </span>
+      ) : null}
+    </div>
+  );
+}
+
+export function PurchaseReceiptForm({
+  locale,
+  purchaseOrderId,
+  expectedVersion,
+  lines,
+  locations,
+}: {
+  locale: Locale;
+  purchaseOrderId: string;
+  expectedVersion: number;
+  lines: Array<{ id: string; label: string; remaining: number; serialized: boolean }>;
+  locations: Option[];
+}) {
+  const mutation = useMutation(locale);
+  const [lineId, setLineId] = useState(lines[0]?.id ?? "");
+  const activeLine = lines.find((line) => line.id === lineId);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        const serialNumbers = String(data.get("serialNumbers") ?? "")
+          .split(",")
+          .map((value) => value.trim())
+          .filter(Boolean);
+        await mutation.submit(`/api/purchase-orders/${purchaseOrderId}/receive`, {
+          expectedVersion,
+          locationId: data.get("locationId"),
+          items: [
+            {
+              purchaseOrderItemId: lineId,
+              quantity: Number(data.get("quantity")),
+              serialNumbers: serialNumbers.length ? serialNumbers : undefined,
+            },
+          ],
+        });
+      }}
+    >
+      <label>
+        {locale === "zh" ? "采购明细" : "Purchase line"}
+        <select value={lineId} onChange={(event) => setLineId(event.target.value)}>
+          {lines.map((line) => (
+            <option key={line.id} value={line.id}>
+              {line.label} · {locale === "zh" ? "待收" : "remaining"} {line.remaining}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "入库库位" : "Receiving location"}
+        <select name="locationId">
+          {locations.map((location) => (
+            <option key={location.id} value={location.id}>
+              {location.label}
+            </option>
+          ))}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "本次收货数量" : "Receipt quantity"}
+        <input
+          defaultValue={1}
+          max={activeLine?.remaining}
+          min={1}
+          name="quantity"
+          type="number"
+        />
+      </label>
+      <label>
+        {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
+        <input name="serialNumbers" required={activeLine?.serialized} />
+      </label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function SupplierCreateForm({
+  locale,
+  productOptions,
+}: {
+  locale: Locale;
+  productOptions: Option[];
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const form = event.currentTarget;
+        const data = new FormData(form);
+        const saved = await mutation.submit("/api/suppliers", {
+          code: data.get("code"),
+          name: data.get("name"),
+          countryCode: data.get("countryCode"),
+          status: data.get("status"),
+          contactName: data.get("contactName") || null,
+          email: data.get("email") || null,
+          phone: data.get("phone") || null,
+          productRelations: data
+            .getAll("productIds")
+            .filter((value): value is string => typeof value === "string")
+            .map((productId) => ({ productId })),
+        });
+        if (saved) form.reset();
+      }}
+    >
+      <label>{locale === "zh" ? "供应商编号" : "Supplier code"}<input name="code" required /></label>
+      <label>{locale === "zh" ? "名称" : "Name"}<input name="name" required /></label>
+      <label>{locale === "zh" ? "国家/地区代码" : "Country/region code"}<input maxLength={2} name="countryCode" required /></label>
+      <label>
+        {locale === "zh" ? "状态" : "Status"}
+        <select defaultValue="ACTIVE" name="status">
+          <option value="ACTIVE">{locale === "zh" ? "启用" : "Active"}</option>
+          <option value="INACTIVE">{locale === "zh" ? "停用" : "Inactive"}</option>
+        </select>
+      </label>
+      <label>{locale === "zh" ? "联系人" : "Contact"}<input name="contactName" /></label>
+      <label>{locale === "zh" ? "电子邮箱" : "Email"}<input name="email" type="email" /></label>
+      <label>{locale === "zh" ? "电话" : "Phone"}<input name="phone" /></label>
+      <label>
+        {locale === "zh" ? "供应产品" : "Products supplied"}
+        <select multiple name="productIds" size={Math.min(8, Math.max(3, productOptions.length))}>
+          {productOptions.map((product) => (
+            <option key={product.id} value={product.id}>{product.label}</option>
+          ))}
+        </select>
+      </label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function SupplierEditForm({
+  locale,
+  supplier,
+  productOptions,
+}: {
+  locale: Locale;
+  supplier: {
+    id: string;
+    code: string;
+    name: string;
+    countryCode: string;
+    supplierType: string;
+    status: string;
+    contactName: string | null;
+    email: string | null;
+    phone: string | null;
+    website: string | null;
+    taxId: string | null;
+    paymentTerms: string | null;
+    leadTimeDays: number | null;
+    minimumOrderValue: { toString(): string } | string | null;
+    rating: number | null;
+    bankName: string | null;
+    bankAccountName: string | null;
+    bankAccountNumber: string | null;
+    notes: string | null;
+    version: number;
+    products: Array<{
+      productId: string;
+      supplierSku: string | null;
+      leadTimeDays: number | null;
+      lastCost: { toString(): string } | string | null;
+      currencyCode: string | null;
+    }>;
+  };
+  productOptions: Option[];
+}) {
+  const mutation = useMutation(locale);
+  const labels =
+    locale === "zh"
+      ? {
+          code: "供应商编号",
+          name: "名称",
+          country: "国家/地区代码",
+          type: "供应商类型",
+          contact: "联系人",
+          email: "电子邮箱",
+          phone: "电话",
+          website: "网站",
+          tax: "税务编号",
+          terms: "付款条款",
+          leadTime: "交货周期（天）",
+          minimum: "最低订单金额",
+          rating: "评级（1–5）",
+          bank: "开户行",
+          accountName: "账户名称",
+          accountNumber: "新银行账号（留空则不变）",
+          notes: "备注",
+        }
+      : {
+          code: "Supplier code",
+          name: "Name",
+          country: "Country/region code",
+          type: "Supplier type",
+          contact: "Contact",
+          email: "Email",
+          phone: "Phone",
+          website: "Website",
+          tax: "Tax ID",
+          terms: "Payment terms",
+          leadTime: "Lead time (days)",
+          minimum: "Minimum order value",
+          rating: "Rating (1–5)",
+          bank: "Bank",
+          accountName: "Account name",
+          accountNumber: "New bank account number (leave blank to keep)",
+          notes: "Notes",
+        };
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        const bankAccountNumber = String(data.get("bankAccountNumber") ?? "").trim();
+        const productRelations = data
+          .getAll("productIds")
+          .filter((value): value is string => typeof value === "string")
+          .map((productId) => {
+            const current = supplier.products.find(
+              (relation) => relation.productId === productId,
+            );
+            return current
+              ? {
+                  productId,
+                  supplierSku: current.supplierSku,
+                  leadTimeDays: current.leadTimeDays,
+                  lastCost: current.lastCost?.toString() ?? null,
+                  currencyCode: current.currencyCode,
+                }
+              : { productId };
+          });
+        await mutation.submit(
+          `/api/suppliers/${supplier.id}`,
+          {
+            expectedVersion: supplier.version,
+            code: data.get("code"),
+            name: data.get("name"),
+            countryCode: data.get("countryCode"),
+            supplierType: data.get("supplierType"),
+            status: data.get("status"),
+            contactName: data.get("contactName") || null,
+            email: data.get("email") || null,
+            phone: data.get("phone") || null,
+            website: data.get("website") || null,
+            taxId: data.get("taxId") || null,
+            paymentTerms: data.get("paymentTerms") || null,
+            leadTimeDays: data.get("leadTimeDays")
+              ? Number(data.get("leadTimeDays"))
+              : null,
+            minimumOrderValue: data.get("minimumOrderValue") || null,
+            rating: data.get("rating") ? Number(data.get("rating")) : null,
+            bankName: data.get("bankName") || null,
+            bankAccountName: data.get("bankAccountName") || null,
+            ...(bankAccountNumber ? { bankAccountNumber } : {}),
+            productRelations,
+            notes: data.get("notes") || null,
+          },
+          "PATCH",
+        );
+      }}
+    >
+      <label>{labels.code}<input defaultValue={supplier.code} name="code" required /></label>
+      <label>{labels.name}<input defaultValue={supplier.name} name="name" required /></label>
+      <label>{labels.country}<input defaultValue={supplier.countryCode} maxLength={2} name="countryCode" required /></label>
+      <label>
+        {labels.type}
+        <select defaultValue={supplier.supplierType} name="supplierType">
+          {["MANUFACTURER", "DISTRIBUTOR", "BROKER", "REFURBISHER", "LOGISTICS", "OTHER"].map(
+            (type) => <option key={type}>{type}</option>,
+          )}
+        </select>
+      </label>
+      <label>
+        {locale === "zh" ? "状态" : "Status"}
+        <select defaultValue={supplier.status} name="status">
+          <option value="ACTIVE">{locale === "zh" ? "启用" : "Active"}</option>
+          <option value="INACTIVE">{locale === "zh" ? "停用" : "Inactive"}</option>
+        </select>
+      </label>
+      <label>{labels.contact}<input defaultValue={supplier.contactName ?? ""} name="contactName" /></label>
+      <label>{labels.email}<input defaultValue={supplier.email ?? ""} name="email" type="email" /></label>
+      <label>{labels.phone}<input defaultValue={supplier.phone ?? ""} name="phone" /></label>
+      <label>{labels.website}<input defaultValue={supplier.website ?? ""} name="website" type="url" /></label>
+      <label>{labels.tax}<input defaultValue={supplier.taxId ?? ""} name="taxId" /></label>
+      <label>{labels.terms}<input defaultValue={supplier.paymentTerms ?? ""} name="paymentTerms" /></label>
+      <label>{labels.leadTime}<input defaultValue={supplier.leadTimeDays ?? ""} min={0} name="leadTimeDays" type="number" /></label>
+      <label>{labels.minimum}<input defaultValue={supplier.minimumOrderValue?.toString() ?? ""} inputMode="decimal" name="minimumOrderValue" /></label>
+      <label>{labels.rating}<input defaultValue={supplier.rating ?? ""} max={5} min={1} name="rating" type="number" /></label>
+      <label>{labels.bank}<input defaultValue={supplier.bankName ?? ""} name="bankName" /></label>
+      <label>{labels.accountName}<input defaultValue={supplier.bankAccountName ?? ""} name="bankAccountName" /></label>
+      <label>{labels.accountNumber}<input name="bankAccountNumber" placeholder={supplier.bankAccountNumber ?? ""} /></label>
+      <label>
+        {locale === "zh" ? "供应产品" : "Products supplied"}
+        <select
+          defaultValue={supplier.products.map((relation) => relation.productId)}
+          multiple
+          name="productIds"
+          size={Math.min(8, Math.max(3, productOptions.length))}
+        >
+          {productOptions.map((product) => (
+            <option key={product.id} value={product.id}>{product.label}</option>
+          ))}
+        </select>
+      </label>
+      <label>{labels.notes}<textarea defaultValue={supplier.notes ?? ""} name="notes" /></label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function SupplierArchiveAction({
+  locale,
+  supplierId,
+  expectedVersion,
+}: {
+  locale: Locale;
+  supplierId: string;
+  expectedVersion: number;
+}) {
+  const mutation = useMutation(locale);
+  return (
+    <div className="inline-action">
+      <button
+        className="button button-secondary"
+        disabled={mutation.busy}
+        onClick={() => {
+          const confirmed = window.confirm(
+            locale === "zh"
+              ? "确认归档此供应商？归档后将从活跃供应商列表隐藏。"
+              : "Archive this supplier? It will be hidden from active supplier lists.",
+          );
+          if (confirmed) {
+            void mutation.submit(
+              `/api/suppliers/${supplierId}`,
+              { expectedVersion },
+              "DELETE",
+            );
+          }
+        }}
+        type="button"
+      >
+        {mutation.busy
+          ? text[locale].saving
+          : locale === "zh"
+            ? "归档供应商"
+            : "Archive supplier"}
+      </button>
+      {mutation.message ? (
+        <span className={`form-feedback ${mutation.error ? "error" : "success"}`}>
+          {mutation.message}
+        </span>
+      ) : null}
+    </div>
+  );
+}
+
+export function PurchaseOrderUpdateForm({
+  locale,
+  purchaseOrder,
+}: {
+  locale: Locale;
+  purchaseOrder: {
+    id: string;
+    version: number;
+    paymentTerms: string | null;
+    shippingTerms: string | null;
+    incoterm: string | null;
+    notes: string | null;
+    expectedAt: Date | string | null;
+    attachments: unknown;
+  };
+}) {
+  const mutation = useMutation(locale);
+  const attachmentIds = Array.isArray(purchaseOrder.attachments)
+    ? purchaseOrder.attachments.filter((value): value is string => typeof value === "string")
+    : [];
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit(
+          `/api/purchase-orders/${purchaseOrder.id}`,
+          {
+            expectedVersion: purchaseOrder.version,
+            paymentTerms: data.get("paymentTerms") || null,
+            shippingTerms: data.get("shippingTerms") || null,
+            incoterm: data.get("incoterm") || null,
+            notes: data.get("notes") || null,
+            expectedAt: data.get("expectedAt") || null,
+            attachmentIds: commaSeparatedValues(data.get("attachmentIds")),
+          },
+          "PATCH",
+        );
+      }}
+    >
+      <label>{locale === "zh" ? "付款条款" : "Payment terms"}<input defaultValue={purchaseOrder.paymentTerms ?? ""} name="paymentTerms" /></label>
+      <label>{locale === "zh" ? "运输条款" : "Shipping terms"}<input defaultValue={purchaseOrder.shippingTerms ?? ""} name="shippingTerms" /></label>
+      <label>{locale === "zh" ? "贸易术语" : "Incoterm"}<input defaultValue={purchaseOrder.incoterm ?? ""} name="incoterm" /></label>
+      <label>{locale === "zh" ? "预计到货" : "Expected receipt"}<input defaultValue={purchaseOrder.expectedAt ? new Date(purchaseOrder.expectedAt).toISOString().slice(0, 10) : ""} name="expectedAt" type="date" /></label>
+      <label>{locale === "zh" ? "附件资产 ID（逗号分隔）" : "Attachment asset IDs (comma separated)"}<input defaultValue={attachmentIds.join(", ")} name="attachmentIds" /></label>
+      <label>{locale === "zh" ? "备注" : "Notes"}<textarea defaultValue={purchaseOrder.notes ?? ""} name="notes" /></label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
+
+export function ShipmentUpdateForm({
+  locale,
+  shipment,
+}: {
+  locale: Locale;
+  shipment: {
+    id: string;
+    version: number;
+    carrier: string | null;
+    trackingNumber: string | null;
+    incoterm: string | null;
+    origin: string | null;
+    destination: string | null;
+    originPort: string | null;
+    destinationPort: string | null;
+    estimatedDepartureAt: Date | string | null;
+    estimatedArrivalAt: Date | string | null;
+    documents: Array<{ fileAssetId: string }>;
+  };
+}) {
+  const mutation = useMutation(locale);
+  const fields = [
+    ["carrier", locale === "zh" ? "承运商" : "Carrier", shipment.carrier],
+    ["trackingNumber", locale === "zh" ? "运单号" : "Tracking number", shipment.trackingNumber],
+    ["incoterm", locale === "zh" ? "贸易术语" : "Incoterm", shipment.incoterm],
+    ["origin", locale === "zh" ? "起运地" : "Origin", shipment.origin],
+    ["destination", locale === "zh" ? "目的地" : "Destination", shipment.destination],
+    ["originPort", locale === "zh" ? "起运港" : "Origin port", shipment.originPort],
+    ["destinationPort", locale === "zh" ? "目的港" : "Destination port", shipment.destinationPort],
+  ] as const;
+  return (
+    <form
+      className="crm-form"
+      onSubmit={async (event) => {
+        event.preventDefault();
+        const data = new FormData(event.currentTarget);
+        await mutation.submit(
+          `/api/shipments/${shipment.id}`,
+          {
+            expectedVersion: shipment.version,
+            carrier: data.get("carrier") || null,
+            trackingNumber: data.get("trackingNumber") || null,
+            incoterm: data.get("incoterm") || null,
+            origin: data.get("origin") || null,
+            destination: data.get("destination") || null,
+            originPort: data.get("originPort") || null,
+            destinationPort: data.get("destinationPort") || null,
+            estimatedDepartureAt: data.get("estimatedDepartureAt") || null,
+            estimatedArrivalAt: data.get("estimatedArrivalAt") || null,
+            documentIds: commaSeparatedValues(data.get("documentIds")),
+          },
+          "PATCH",
+        );
+      }}
+    >
+      {fields.map(([name, label, value]) => (
+        <label key={name}>{label}<input defaultValue={value ?? ""} name={name} /></label>
+      ))}
+      <label>{locale === "zh" ? "预计发运" : "Estimated departure"}<input defaultValue={shipment.estimatedDepartureAt ? new Date(shipment.estimatedDepartureAt).toISOString().slice(0, 10) : ""} name="estimatedDepartureAt" type="date" /></label>
+      <label>{locale === "zh" ? "预计到达" : "Estimated arrival"}<input defaultValue={shipment.estimatedArrivalAt ? new Date(shipment.estimatedArrivalAt).toISOString().slice(0, 10) : ""} name="estimatedArrivalAt" type="date" /></label>
+      <label>{locale === "zh" ? "单证资产 ID（逗号分隔）" : "Document asset IDs (comma separated)"}<input defaultValue={shipment.documents.map((document) => document.fileAssetId).join(", ")} name="documentIds" /></label>
+      <Feedback locale={locale} {...mutation} />
+    </form>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-ui.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-ui.test.ts"
new file mode 100644
index 0000000..5ca1e3b
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-ui.test.ts"
@@ -0,0 +1,90 @@
+import { existsSync, readFileSync } from "node:fs";
+import { resolve } from "node:path";
+
+import { describe, expect, it } from "vitest";
+
+const root = process.cwd();
+const taskFourSources = [
+  "src/components/procurement/procurement-forms.tsx",
+  "src/app/[locale]/(app)/suppliers/page.tsx",
+  "src/app/[locale]/(app)/purchase-orders/page.tsx",
+  "src/app/[locale]/(app)/inventory/page.tsx",
+  "src/app/[locale]/(app)/inspections/page.tsx",
+  "src/app/[locale]/(app)/shipments/page.tsx",
+];
+
+function source(path: string) {
+  return readFileSync(resolve(root, path), "utf8");
+}
+
+describe("procurement UI contract", () => {
+  it("keeps Task 4 forms and pages free of common mojibake and bilingual", () => {
+    const combined = taskFourSources.map(source).join("\n");
+
+    for (const marker of ["鈥", "閲囪", "璐ㄩ", "搴撳", "鎿嶄", "璇锋", "锟斤拷", "�"]) {
+      expect(combined).not.toContain(marker);
+    }
+    expect(combined).toContain("Purchase orders");
+    expect(combined).toContain("采购订单");
+    expect(combined).toContain("Quality inspections");
+    expect(combined).toContain("质量检验");
+    expect(combined).toContain("Shipments");
+    expect(combined).toContain("物流发货");
+  });
+
+  it("exposes attachment and document asset workflows in procurement forms", () => {
+    const forms = source("src/components/procurement/procurement-forms.tsx");
+
+    expect(forms).toContain("attachmentIds");
+    expect(forms).toContain("documentIds");
+    expect(forms).toContain("附件资产 ID");
+    expect(forms).toContain("Document asset IDs");
+  });
+
+  it.each([
+    ["suppliers", "SupplierEditForm", "/api/suppliers/"],
+    ["purchase-orders", "PurchaseOrderUpdateForm", "/api/purchase-orders/"],
+    ["inspections", "InspectionForm", "/api/inspections"],
+    ["shipments", "ShipmentUpdateForm", "/api/shipments/"],
+  ])("provides a functional %s detail page", (segment, formName, endpoint) => {
+    const path = `src/app/[locale]/(app)/${segment}/[id]/page.tsx`;
+
+    expect(existsSync(resolve(root, path))).toBe(true);
+    const detail = source(path);
+    expect(detail).toContain(formName);
+    expect(detail).toContain(endpoint);
+    expect(detail).toContain('locale === "zh"');
+  });
+
+  it.each(["suppliers", "purchase-orders", "inspections", "shipments"])(
+    "links %s list records to their detail route",
+    (segment) => {
+      const list = source(`src/app/[locale]/(app)/${segment}/page.tsx`);
+      expect(list).toContain(`/${"${locale}"}/${segment}/`);
+    },
+  );
+
+  it("provides minimal mutation routes for supplier archive and detail updates", () => {
+    const suppliers = source("src/app/api/suppliers/[id]/route.ts");
+    const purchaseOrders = source("src/app/api/purchase-orders/[id]/route.ts");
+    const shipments = source("src/app/api/shipments/[id]/route.ts");
+
+    expect(suppliers).toContain("export async function DELETE");
+    expect(purchaseOrders).toContain("export async function PATCH");
+    expect(shipments).toContain("export async function PATCH");
+  });
+
+  it("provides bilingual status and named product relationship controls for suppliers", () => {
+    const forms = source("src/components/procurement/procurement-forms.tsx");
+    const list = source("src/app/[locale]/(app)/suppliers/page.tsx");
+    const detail = source("src/app/[locale]/(app)/suppliers/[id]/page.tsx");
+
+    expect(forms).toContain("SupplierCreateForm");
+    expect(forms).toContain('name="status"');
+    expect(forms).toContain('name="productIds"');
+    expect(forms).toContain("Products supplied");
+    expect(forms).toContain("供应产品");
+    expect(list).toContain("productOptions");
+    expect(detail).toContain("product.category.name");
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\page.tsx"
new file mode 100644
index 0000000..89d7993
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\page.tsx"
@@ -0,0 +1,77 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { SupplierCreateForm } from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function SuppliersPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "supplier.read");
+  const [suppliers, products] = await Promise.all([
+    service.listSuppliers(context),
+    service.listSupplierProductOptions(),
+  ]);
+  const productOptions = products.map((product) => ({
+    id: product.id,
+    label: [
+      `${product.sku} · ${product.name}`,
+      product.category.name,
+      product.brand,
+    ]
+      .filter(Boolean)
+      .join(" · "),
+  }));
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "供应商" : "Suppliers"}</h1>
+          <p>
+            {locale === "zh"
+              ? "合格供货来源、联系人与采购活动"
+              : "Approved sources, contacts and purchasing activity"}
+          </p>
+        </div>
+      </header>
+      <section className="record-grid">
+        {suppliers.map((supplier) => (
+          <article className="record-card" key={supplier.id}>
+            <strong>{supplier.code} · {supplier.name}</strong>
+            <span>{supplier.countryCode} · {supplier.status}</span>
+            <span>
+              {supplier.contactName ?? (locale === "zh" ? "无联系人" : "No contact")} ·{" "}
+              {supplier.email ?? (locale === "zh" ? "无邮箱" : "No email")}
+            </span>
+            <span>
+              {supplier._count.purchaseOrders}{" "}
+              {locale === "zh" ? "张采购订单" : "purchase orders"} ·{" "}
+              {supplier._count.products} {locale === "zh" ? "种产品" : "products"}
+            </span>
+            <Link href={`/${locale}/suppliers/${supplier.id}`}>
+              {locale === "zh" ? "查看供应商详情" : "View supplier details"}
+            </Link>
+          </article>
+        ))}
+      </section>
+      {can(context, "supplier.create") ? (
+        <details className="card section-card">
+          <summary>{locale === "zh" ? "新建供应商" : "Create supplier"}</summary>
+          <SupplierCreateForm locale={locale} productOptions={productOptions} />
+        </details>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\[id]\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\[id]\\page.tsx"
new file mode 100644
index 0000000..0332035
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\suppliers\\[id]\\page.tsx"
@@ -0,0 +1,150 @@
+import { notFound } from "next/navigation";
+
+import {
+  SupplierArchiveAction,
+  SupplierEditForm,
+} from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function SupplierDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "supplier.read");
+  const [supplier, products] = await Promise.all([
+    service.getSupplier(id, context),
+    service.listSupplierProductOptions(),
+  ]);
+  if (!supplier) notFound();
+  const productOptions = products.map((product) => ({
+    id: product.id,
+    label: [
+      `${product.sku} · ${product.name}`,
+      product.category.name,
+      product.brand,
+    ]
+      .filter(Boolean)
+      .join(" · "),
+  }));
+
+  const activeOrders = supplier.purchaseOrders.filter(
+    (order) => order.status !== "CANCELLED",
+  );
+  const purchasingTotal = activeOrders.reduce(
+    (total, order) => total + Number(order.totalUsd),
+    0,
+  );
+  const receivedOrders = activeOrders.filter(
+    (order) => order.status === "RECEIVED",
+  ).length;
+  const receiptRate = activeOrders.length
+    ? Math.round((receivedOrders / activeOrders.length) * 100)
+    : 0;
+  const categories = supplier.categories.map((category) => category.name);
+  const brands = [
+    ...new Set(
+      supplier.products
+        .map(({ product }) => product.brand)
+        .filter((brand): brand is string => Boolean(brand)),
+    ),
+  ];
+  const formatDate = (date: Date) =>
+    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US").format(date);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{supplier.name}</h1>
+          <p>{supplier.code} · {supplier.supplierType} · {supplier.status}</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "运营指标" : "Operational metrics"}</h2>
+        <dl className="detail-grid">
+          <div><dt>{locale === "zh" ? "累计采购额" : "Purchasing total"}</dt><dd>USD {purchasingTotal.toFixed(2)}</dd></div>
+          <div><dt>{locale === "zh" ? "活跃采购订单" : "Active purchase orders"}</dt><dd>{activeOrders.length}</dd></div>
+          <div><dt>{locale === "zh" ? "收货完成率" : "Receipt completion rate"}</dt><dd>{receiptRate}%</dd></div>
+          <div><dt>{locale === "zh" ? "产品数量" : "Products supplied"}</dt><dd>{supplier.products.length}</dd></div>
+          <div><dt>{locale === "zh" ? "评级" : "Rating"}</dt><dd>{supplier.rating ? `${supplier.rating}/5` : "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "交货周期" : "Lead time"}</dt><dd>{supplier.leadTimeDays !== null ? `${supplier.leadTimeDays} ${locale === "zh" ? "天" : "days"}` : "—"}</dd></div>
+        </dl>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "联系方式与条款" : "Contact and terms"}</h2>
+        <dl className="detail-grid">
+          <div><dt>{locale === "zh" ? "联系人" : "Contact"}</dt><dd>{supplier.contactName ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "电子邮箱" : "Email"}</dt><dd>{supplier.email ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "电话" : "Phone"}</dt><dd>{supplier.phone ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "付款条款" : "Payment terms"}</dt><dd>{supplier.paymentTerms ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "开户行" : "Bank"}</dt><dd>{supplier.bankName ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "已掩码账号" : "Masked account"}</dt><dd>{supplier.bankAccountNumber ?? "—"}</dd></div>
+        </dl>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "品类与品牌" : "Categories and brands"}</h2>
+        <p>
+          {locale === "zh" ? "品类" : "Categories"}:{" "}
+          {categories.join(", ") || (locale === "zh" ? "暂无" : "None")}
+        </p>
+        <p>
+          {locale === "zh" ? "品牌" : "Brands"}:{" "}
+          {brands.join(", ") || (locale === "zh" ? "暂无" : "None")}
+        </p>
+        <div className="record-grid">
+          {supplier.products.map(({ product, supplierSku, lastCost, currencyCode }) => (
+            <article className="record-card" key={product.id}>
+              <strong>{product.sku} · {product.name}</strong>
+              <span>{product.category.name} · {product.brand ?? (locale === "zh" ? "无品牌" : "Unbranded")}</span>
+              <span>{locale === "zh" ? "供应商 SKU" : "Supplier SKU"}: {supplierSku ?? "—"}</span>
+              <span>{locale === "zh" ? "最近成本" : "Last cost"}: {currencyCode ?? ""} {lastCost?.toString() ?? "—"}</span>
+            </article>
+          ))}
+        </div>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "采购历史" : "Purchase history"}</h2>
+        <div className="record-grid">
+          {supplier.purchaseOrders.map((order) => (
+            <article className="record-card" key={order.id}>
+              <strong>{order.purchaseOrderNumber} · {order.status}</strong>
+              <span>{order.currencyCode} {order.total.toString()}</span>
+              <span>{locale === "zh" ? "创建日期" : "Created"}: {formatDate(order.createdAt)}</span>
+              <span>{locale === "zh" ? "预计到货" : "Expected"}: {order.expectedAt ? formatDate(order.expectedAt) : "—"}</span>
+            </article>
+          ))}
+          {supplier.purchaseOrders.length === 0 ? (
+            <p>{locale === "zh" ? "暂无采购记录。" : "No purchasing history yet."}</p>
+          ) : null}
+        </div>
+      </section>
+      {can(context, "supplier.update") ? (
+        <section className="card section-card" data-endpoint={`/api/suppliers/${supplier.id}`}>
+          <details>
+            <summary>{locale === "zh" ? "编辑供应商" : "Edit supplier"}</summary>
+            <SupplierEditForm
+              locale={locale}
+              productOptions={productOptions}
+              supplier={supplier}
+            />
+          </details>
+          <SupplierArchiveAction
+            expectedVersion={supplier.version}
+            locale={locale}
+            supplierId={supplier.id}
+          />
+        </section>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\page.tsx"
new file mode 100644
index 0000000..8793e9e
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\page.tsx"
@@ -0,0 +1,128 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import {
+  PurchaseOrderForm,
+  PurchaseReceiptForm,
+  WorkflowAction,
+} from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function PurchaseOrdersPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "purchase.read");
+  const [orders, eligible, suppliers, locations] = await Promise.all([
+    service.listPurchaseOrders(context),
+    service.eligibleOrders(),
+    service.listSuppliers(context),
+    service.listWarehouseLocations(),
+  ]);
+  const canUpdate = can(context, "purchase.update");
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "采购订单" : "Purchase orders"}</h1>
+          <p>
+            {locale === "zh"
+              ? "付款门禁、采购承诺、收货与入库"
+              : "Payment-gated purchasing, receiving and stock posting"}
+          </p>
+        </div>
+      </header>
+      <section className="record-grid">
+        {orders.map((order) => {
+          const next =
+            order.status === "DRAFT"
+              ? "APPROVED"
+              : order.status === "APPROVED"
+                ? "SENT"
+                : null;
+          const receivable = ["SENT", "PARTIALLY_RECEIVED"].includes(order.status);
+          return (
+            <article className="record-card" key={order.id}>
+              <strong>
+                {order.purchaseOrderNumber} · {order.status}
+              </strong>
+              <span>
+                {order.supplier.name} · {order.buyer.name}
+              </span>
+              <span>
+                {order.currencyCode} {order.total.toString()} · {order.items.length}{" "}
+                {locale === "zh" ? "项" : "line(s)"}
+              </span>
+              <span>{order.salesOrder?.orderNumber ?? (locale === "zh" ? "备货采购" : "Stock purchase")}</span>
+              <Link href={`/${locale}/purchase-orders/${order.id}`}>
+                {locale === "zh" ? "查看采购订单详情" : "View purchase order details"}
+              </Link>
+              {canUpdate && next ? (
+                <WorkflowAction
+                  body={{ status: next, expectedVersion: order.version }}
+                  endpoint={`/api/purchase-orders/${order.id}/transition`}
+                  label={locale === "zh" ? `转为 ${next}` : `Move to ${next}`}
+                  locale={locale}
+                />
+              ) : null}
+              {canUpdate && receivable ? (
+                <details>
+                  <summary>{locale === "zh" ? "登记收货" : "Record receipt"}</summary>
+                  <PurchaseReceiptForm
+                    expectedVersion={order.version}
+                    lines={order.items
+                      .filter((item) => item.receivedQuantity < item.quantity)
+                      .map((item) => ({
+                        id: item.id,
+                        label: item.description,
+                        remaining: item.quantity - item.receivedQuantity,
+                        serialized: item.product?.serialized ?? false,
+                      }))}
+                    locale={locale}
+                    locations={locations.map((location) => ({
+                      id: location.id,
+                      label: `${location.warehouse.code} / ${location.code}`,
+                    }))}
+                    purchaseOrderId={order.id}
+                  />
+                </details>
+              ) : null}
+            </article>
+          );
+        })}
+      </section>
+      {can(context, "purchase.create") ? (
+        <details className="card section-card">
+          <summary>{locale === "zh" ? "新建采购订单" : "Create purchase order"}</summary>
+          <PurchaseOrderForm
+            locale={locale}
+            orders={eligible.map((order) => ({
+              id: order.id,
+              label: order.orderNumber,
+              items: order.items.map((item) => ({
+                id: item.id,
+                label: item.description,
+                quantity: item.quantity,
+              })),
+            }))}
+            suppliers={suppliers.map((supplier) => ({
+              id: supplier.id,
+              label: `${supplier.code} · ${supplier.name}`,
+            }))}
+          />
+        </details>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\[id]\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\[id]\\page.tsx"
new file mode 100644
index 0000000..b7fb02f
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\purchase-orders\\[id]\\page.tsx"
@@ -0,0 +1,146 @@
+import { notFound } from "next/navigation";
+
+import {
+  PurchaseOrderUpdateForm,
+  PurchaseReceiptForm,
+  WorkflowAction,
+} from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function PurchaseOrderDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "purchase.read");
+  const [purchaseOrder, locations] = await Promise.all([
+    service.getPurchaseOrder(id, context),
+    service.listWarehouseLocations(),
+  ]);
+  if (!purchaseOrder) notFound();
+
+  const canUpdate = can(context, "purchase.update");
+  const nextStatus =
+    purchaseOrder.status === "DRAFT"
+      ? "APPROVED"
+      : purchaseOrder.status === "APPROVED"
+        ? "SENT"
+        : null;
+  const receivable = ["SENT", "PARTIALLY_RECEIVED"].includes(
+    purchaseOrder.status,
+  );
+  const cancellable = ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(
+    purchaseOrder.status,
+  );
+  const attachmentIds = Array.isArray(purchaseOrder.attachments)
+    ? purchaseOrder.attachments.filter((value): value is string => typeof value === "string")
+    : [];
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{purchaseOrder.purchaseOrderNumber}</h1>
+          <p>{purchaseOrder.supplier.name} · {purchaseOrder.status}</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "采购概览" : "Purchase overview"}</h2>
+        <dl className="detail-grid">
+          <div><dt>{locale === "zh" ? "采购员" : "Buyer"}</dt><dd>{purchaseOrder.buyer.name}</dd></div>
+          <div><dt>{locale === "zh" ? "销售订单" : "Sales order"}</dt><dd>{purchaseOrder.salesOrder?.orderNumber ?? (locale === "zh" ? "备货采购" : "Stock purchase")}</dd></div>
+          <div><dt>{locale === "zh" ? "总额" : "Total"}</dt><dd>{purchaseOrder.currencyCode} {purchaseOrder.total.toString()}</dd></div>
+          <div><dt>{locale === "zh" ? "美元总额" : "Total in USD"}</dt><dd>USD {purchaseOrder.totalUsd.toString()}</dd></div>
+          <div><dt>{locale === "zh" ? "付款条款" : "Payment terms"}</dt><dd>{purchaseOrder.paymentTerms ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "运输条款" : "Shipping terms"}</dt><dd>{purchaseOrder.shippingTerms ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "贸易术语" : "Incoterm"}</dt><dd>{purchaseOrder.incoterm ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "附件数量" : "Attachments"}</dt><dd>{attachmentIds.length}</dd></div>
+        </dl>
+        <p>{locale === "zh" ? "附件资产 ID" : "Attachment asset IDs"}: {attachmentIds.join(", ") || "—"}</p>
+        <p>{locale === "zh" ? "备注" : "Notes"}: {purchaseOrder.notes ?? "—"}</p>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "采购明细与快照" : "Lines and snapshots"}</h2>
+        <div className="record-grid">
+          {purchaseOrder.items.map((item) => (
+            <article className="record-card" key={item.id}>
+              <strong>{item.description}</strong>
+              <span>
+                {locale === "zh" ? "数量" : "Quantity"} {item.quantity} ·{" "}
+                {locale === "zh" ? "已收" : "Received"} {item.receivedQuantity}
+              </span>
+              <span>{purchaseOrder.currencyCode} {item.unitCost.toString()} · {purchaseOrder.currencyCode} {item.lineTotal.toString()}</span>
+              <span>{locale === "zh" ? "产品快照" : "Product snapshot"}: {JSON.stringify(item.productSnapshot ?? {})}</span>
+              <span>{locale === "zh" ? "配置快照" : "Configuration snapshot"}: {JSON.stringify(item.configurationSnapshot ?? {})}</span>
+              <span>{locale === "zh" ? "入库记录" : "Inventory records"}: {item.inventoryItems.length}</span>
+            </article>
+          ))}
+        </div>
+      </section>
+      {canUpdate ? (
+        <section className="card section-card" data-endpoint={`/api/purchase-orders/${purchaseOrder.id}`}>
+          <h2>{locale === "zh" ? "采购订单操作" : "Purchase order actions"}</h2>
+          {nextStatus ? (
+            <WorkflowAction
+              body={{ status: nextStatus, expectedVersion: purchaseOrder.version }}
+              endpoint={`/api/purchase-orders/${purchaseOrder.id}/transition`}
+              label={locale === "zh" ? `转为 ${nextStatus}` : `Move to ${nextStatus}`}
+              locale={locale}
+            />
+          ) : null}
+          {cancellable ? (
+            <WorkflowAction
+              body={{ status: "CANCELLED", expectedVersion: purchaseOrder.version }}
+              confirmMessage={
+                locale === "zh"
+                  ? "确认取消此采购订单？"
+                  : "Cancel this purchase order?"
+              }
+              endpoint={`/api/purchase-orders/${purchaseOrder.id}/transition`}
+              label={locale === "zh" ? "取消采购订单" : "Cancel purchase order"}
+              locale={locale}
+            />
+          ) : null}
+          {receivable ? (
+            <details>
+              <summary>{locale === "zh" ? "登记收货" : "Record receipt"}</summary>
+              <PurchaseReceiptForm
+                expectedVersion={purchaseOrder.version}
+                lines={purchaseOrder.items
+                  .filter((item) => item.receivedQuantity < item.quantity)
+                  .map((item) => ({
+                    id: item.id,
+                    label: item.description,
+                    remaining: item.quantity - item.receivedQuantity,
+                    serialized: item.product?.serialized ?? false,
+                  }))}
+                locale={locale}
+                locations={locations.map((location) => ({
+                  id: location.id,
+                  label: `${location.warehouse.code} / ${location.code}`,
+                }))}
+                purchaseOrderId={purchaseOrder.id}
+              />
+            </details>
+          ) : null}
+          <details>
+            <summary>{locale === "zh" ? "更新条款与附件" : "Update terms and attachments"}</summary>
+            <PurchaseOrderUpdateForm
+              locale={locale}
+              purchaseOrder={purchaseOrder}
+            />
+          </details>
+        </section>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inventory\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inventory\\page.tsx"
new file mode 100644
index 0000000..adccf33
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inventory\\page.tsx"
@@ -0,0 +1,78 @@
+import { notFound } from "next/navigation";
+
+import {
+  InventoryMutationForm,
+  InventoryTransferForm,
+} from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function InventoryPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "inventory.read");
+  const [items, locations] = await Promise.all([
+    service.listInventory(),
+    service.listWarehouseLocations(),
+  ]);
+  const options = items.map((item) => ({
+    id: item.id,
+    label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code} · ${item.quantityOnHand - item.quantityReserved} ${locale === "zh" ? "可用" : "available"}`,
+    version: item.version,
+    serialized: item.product.serialized,
+    serials: item.serials.map((serial) => ({
+      id: serial.id,
+      serialNumber: serial.serialNumber,
+      status: serial.status,
+    })),
+  }));
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "库存" : "Inventory"}</h1>
+          <p>{locale === "zh" ? "按仓库、库位和序列号管理实物库存" : "Physical stock by warehouse, location and serial"}</p>
+        </div>
+      </header>
+      <section className="record-grid">
+        {items.map((item) => (
+          <article className="record-card" key={item.id}>
+            <strong>{item.product.sku} · {item.product.name}</strong>
+            <span>{item.location.warehouse.name} / {item.location.code}</span>
+            <span>{locale === "zh" ? "在库" : "On hand"} {item.quantityOnHand} · {locale === "zh" ? "预留" : "Reserved"} {item.quantityReserved}</span>
+            <span>{item.serials.map((serial) => `${serial.serialNumber} (${serial.status})`).join(", ") || (locale === "zh" ? "非序列化库存" : "Non-serialized stock")}</span>
+          </article>
+        ))}
+      </section>
+      {can(context, "inventory.update") ? (
+        <div className="two-column">
+          <details className="card section-card">
+            <summary>{locale === "zh" ? "库存操作" : "Post inventory transaction"}</summary>
+            <InventoryMutationForm items={options} locale={locale} />
+          </details>
+          <details className="card section-card">
+            <summary>{locale === "zh" ? "库存调拨" : "Transfer inventory"}</summary>
+            <InventoryTransferForm
+              items={options}
+              locale={locale}
+              locations={locations.map((location) => ({
+                id: location.id,
+                label: `${location.warehouse.code} / ${location.code}`,
+              }))}
+            />
+          </details>
+        </div>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\page.tsx"
new file mode 100644
index 0000000..171fbca
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\page.tsx"
@@ -0,0 +1,28 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { InspectionForm } from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function InspectionsPage({ params }: { params: Promise<{ locale: string }> }) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "quality.read");
+  const [rows, inventory] = await Promise.all([service.listInspections(), service.listInventory()]);
+  return (
+    <>
+      <header className="page-heading"><div><h1>{locale === "zh" ? "质量检验" : "Quality inspections"}</h1><p>{locale === "zh" ? "逐台设备检查、结果与证据追踪" : "Per-device checklists, results and evidence"}</p></div></header>
+      <section className="record-grid">
+        {rows.map((row) => <article className="record-card" key={row.id}><strong>{row.inventoryItem.product.sku} · {row.status}</strong><span>{row.inventorySerial?.serialNumber ?? (locale === "zh" ? "批次质检" : "Batch inspection")}</span><span>{locale === "zh" ? "检验员" : "Inspector"}: {row.inspector.name}</span><span>{row.notes ?? (locale === "zh" ? "无备注" : "No notes")}</span><Link href={`/${locale}/inspections/${row.id}`}>{locale === "zh" ? "查看质检详情" : "View inspection details"}</Link></article>)}
+      </section>
+      {can(context, "quality.update") ? <details className="card section-card"><summary>{locale === "zh" ? "登记质检" : "Record inspection"}</summary><InspectionForm locale={locale} items={inventory.map((item) => ({ id: item.id, label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code}`, version: item.version, serialized: item.product.serialized, serials: item.serials.map((serial) => ({ id: serial.id, serialNumber: serial.serialNumber, status: serial.status })) }))} /></details> : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\[id]\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\[id]\\page.tsx"
new file mode 100644
index 0000000..5adfd46
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\inspections\\[id]\\page.tsx"
@@ -0,0 +1,138 @@
+import { notFound } from "next/navigation";
+
+import { InspectionForm } from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+function objectValue(value: unknown): Record<string, unknown> {
+  return value && typeof value === "object" && !Array.isArray(value)
+    ? (value as Record<string, unknown>)
+    : {};
+}
+
+export default async function InspectionDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "quality.read");
+  const [inspections, inventory] = await Promise.all([
+    service.listInspections(),
+    service.listInventory(),
+  ]);
+  const inspection = inspections.find((row) => row.id === id);
+  if (!inspection) notFound();
+
+  const checklist = objectValue(inspection.checklist);
+  const evidence = Array.isArray(checklist.evidence) ? checklist.evidence : [];
+  const checks = Object.entries(checklist).filter(([key]) => key !== "evidence");
+  const history = inspections.filter(
+    (row) =>
+      row.inventoryItemId === inspection.inventoryItemId &&
+      (inspection.inventorySerialId
+        ? row.inventorySerialId === inspection.inventorySerialId
+        : row.inventorySerialId === null),
+  );
+  const inventoryOptions = inventory
+    .filter((item) => item.id === inspection.inventoryItemId)
+    .map((item) => ({
+      id: item.id,
+      label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code}`,
+      version: item.version,
+      serialized: item.product.serialized,
+      serials: item.serials.map((serial) => ({
+        id: serial.id,
+        serialNumber: serial.serialNumber,
+        status: serial.status,
+      })),
+    }));
+  const formatDate = (date: Date) =>
+    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
+      dateStyle: "medium",
+      timeStyle: "short",
+    }).format(date);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{locale === "zh" ? "质检详情" : "Inspection details"}</h1>
+          <p>{inspection.inventoryItem.product.sku} · {inspection.status}</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "检验概览" : "Inspection overview"}</h2>
+        <dl className="detail-grid">
+          <div><dt>{locale === "zh" ? "序列号" : "Serial number"}</dt><dd>{inspection.inventorySerial?.serialNumber ?? (locale === "zh" ? "批次质检" : "Batch inspection")}</dd></div>
+          <div><dt>{locale === "zh" ? "检验员" : "Inspector"}</dt><dd>{inspection.inspector.name}</dd></div>
+          <div><dt>{locale === "zh" ? "检验时间" : "Inspected at"}</dt><dd>{inspection.inspectedAt ? formatDate(inspection.inspectedAt) : (locale === "zh" ? "待检" : "Pending")}</dd></div>
+          <div><dt>{locale === "zh" ? "版本" : "Version"}</dt><dd>{inspection.version}</dd></div>
+        </dl>
+        <p>{locale === "zh" ? "备注" : "Notes"}: {inspection.notes ?? "—"}</p>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "检查清单" : "Checklist"}</h2>
+        <div className="record-grid">
+          {checks.map(([name, complete]) => (
+            <article className="record-card" key={name}>
+              <strong>{name}</strong>
+              <span>
+                {complete
+                  ? locale === "zh" ? "已完成" : "Complete"
+                  : locale === "zh" ? "未完成" : "Incomplete"}
+              </span>
+            </article>
+          ))}
+        </div>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "检验证据" : "Evidence"}</h2>
+        {evidence.length ? (
+          <pre>{JSON.stringify(evidence, null, 2)}</pre>
+        ) : (
+          <p>{locale === "zh" ? "暂无证据元数据。" : "No evidence metadata."}</p>
+        )}
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "复检历史" : "Inspection history"}</h2>
+        <div className="record-grid">
+          {history.map((row) => (
+            <article className="record-card" key={row.id}>
+              <strong>{row.status} · {row.inspector.name}</strong>
+              <span>{row.inspectedAt ? formatDate(row.inspectedAt) : (locale === "zh" ? "待检" : "Pending")}</span>
+              <span>{row.notes ?? (locale === "zh" ? "无备注" : "No notes")}</span>
+            </article>
+          ))}
+        </div>
+      </section>
+      {can(context, "quality.update") && inventoryOptions.length ? (
+        <details className="card section-card" data-endpoint="/api/inspections">
+          <summary>
+            {locale === "zh"
+              ? "创建更新记录 / 发起复检"
+              : "Create update / start reinspection"}
+          </summary>
+          <p>
+            {locale === "zh"
+              ? "质检记录为不可变历史；提交后将新增一条更新或复检记录。"
+              : "Inspection records are immutable; submitting creates a new update or reinspection record."}
+          </p>
+          <InspectionForm
+            initialInventoryId={inspection.inventoryItemId}
+            initialSerialId={inspection.inventorySerialId ?? undefined}
+            items={inventoryOptions}
+            locale={locale}
+          />
+        </details>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\page.tsx"
new file mode 100644
index 0000000..583e539
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\page.tsx"
@@ -0,0 +1,32 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ShipmentForm, WorkflowAction } from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function ShipmentsPage({ params }: { params: Promise<{ locale: string }> }) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "shipment.read");
+  const [rows, orders, inventory] = await Promise.all([service.listShipments(), service.eligibleShipmentOrders(), service.listInventory()]);
+  const canUpdate = can(context, "shipment.update");
+  return (
+    <>
+      <header className="page-heading"><div><h1>{locale === "zh" ? "物流发货" : "Shipments"}</h1><p>{locale === "zh" ? "库存预留、出库、运输与订单状态同步" : "Stock reservation, outbound issue, tracking and order sync"}</p></div></header>
+      <section className="record-grid">
+        {rows.map((row) => {
+          const next = row.status === "DRAFT" ? "BOOKED" : row.status === "BOOKED" ? "IN_TRANSIT" : row.status === "IN_TRANSIT" ? "DELIVERED" : null;
+          return <article className="record-card" key={row.id}><strong>{row.shipmentNumber} · {row.status}</strong><span>{row.salesOrder.orderNumber} · {row.method}</span><span>{row.carrier ?? (locale === "zh" ? "待定承运商" : "Carrier pending")} · {row.trackingNumber ?? (locale === "zh" ? "待录入运单" : "Tracking pending")}</span><span>{row.originPort ?? row.origin ?? "—"} → {row.destinationPort ?? row.destination ?? "—"}</span><span>{row.items.flatMap((item) => item.serials.map((serial) => serial.inventorySerial.serialNumber)).join(", ")}</span><Link href={`/${locale}/shipments/${row.id}`}>{locale === "zh" ? "查看发货详情" : "View shipment details"}</Link>{canUpdate && next ? <WorkflowAction body={{ status: next, expectedVersion: row.version }} endpoint={`/api/shipments/${row.id}/transition`} label={locale === "zh" ? `转为 ${next}` : `Move to ${next}`} locale={locale} /> : null}{canUpdate && ["DRAFT", "BOOKED"].includes(row.status) ? <WorkflowAction body={{ status: "CANCELLED", expectedVersion: row.version }} confirmMessage={locale === "zh" ? "确认取消并释放库存？" : "Cancel and release reserved stock?"} endpoint={`/api/shipments/${row.id}/transition`} label={locale === "zh" ? "取消发货" : "Cancel shipment"} locale={locale} /> : null}</article>;
+        })}
+      </section>
+      {canUpdate ? <details className="card section-card"><summary>{locale === "zh" ? "新建发货单" : "Create shipment"}</summary><ShipmentForm inventory={inventory.map((item) => ({ id: item.id, label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code} · ${item.quantityOnHand - item.quantityReserved} ${locale === "zh" ? "可用" : "available"}`, version: item.version, serialized: item.product.serialized, serials: item.serials.map((serial) => ({ id: serial.id, serialNumber: serial.serialNumber, status: serial.status })) }))} locale={locale} orders={orders.map((order) => ({ id: order.id, label: order.orderNumber, items: order.items.map((item) => ({ id: item.id, label: item.description, quantity: item.quantity })) }))} /></details> : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\[id]\\page.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\[id]\\page.tsx"
new file mode 100644
index 0000000..69adfb2
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\[locale]\\(app)\\shipments\\[id]\\page.tsx"
@@ -0,0 +1,136 @@
+import { notFound } from "next/navigation";
+
+import {
+  ShipmentUpdateForm,
+  WorkflowAction,
+} from "@/components/procurement/procurement-forms";
+import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { can, requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+export const dynamic = "force-dynamic";
+const service = new ProcurementService();
+
+export default async function ShipmentDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "shipment.read");
+  const shipment = (await service.listShipments()).find((row) => row.id === id);
+  if (!shipment) notFound();
+
+  const canUpdate = can(context, "shipment.update");
+  const nextStatus =
+    shipment.status === "DRAFT"
+      ? "BOOKED"
+      : shipment.status === "BOOKED"
+        ? "IN_TRANSIT"
+        : shipment.status === "IN_TRANSIT"
+          ? "DELIVERED"
+          : null;
+  const cancellable = ["DRAFT", "BOOKED"].includes(shipment.status);
+  const formatDate = (date: Date | null) =>
+    date
+      ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
+          dateStyle: "medium",
+          timeStyle: "short",
+        }).format(date)
+      : "—";
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{shipment.shipmentNumber}</h1>
+          <p>{shipment.salesOrder.orderNumber} · {shipment.status}</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "物流与跟踪" : "Logistics and tracking"}</h2>
+        <dl className="detail-grid">
+          <div><dt>{locale === "zh" ? "运输方式" : "Method"}</dt><dd>{shipment.method}</dd></div>
+          <div><dt>{locale === "zh" ? "承运商" : "Carrier"}</dt><dd>{shipment.carrier ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "运单号" : "Tracking number"}</dt><dd>{shipment.trackingNumber ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "协调员" : "Coordinator"}</dt><dd>{shipment.coordinator.name}</dd></div>
+          <div><dt>{locale === "zh" ? "路线" : "Route"}</dt><dd>{shipment.originPort ?? shipment.origin ?? "—"} → {shipment.destinationPort ?? shipment.destination ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "贸易术语" : "Incoterm"}</dt><dd>{shipment.incoterm ?? "—"}</dd></div>
+          <div><dt>{locale === "zh" ? "预计发运" : "Estimated departure"}</dt><dd>{formatDate(shipment.estimatedDepartureAt)}</dd></div>
+          <div><dt>{locale === "zh" ? "预计到达" : "Estimated arrival"}</dt><dd>{formatDate(shipment.estimatedArrivalAt)}</dd></div>
+          <div><dt>{locale === "zh" ? "实际发运" : "Shipped at"}</dt><dd>{formatDate(shipment.shippedAt)}</dd></div>
+          <div><dt>{locale === "zh" ? "实际送达" : "Delivered at"}</dt><dd>{formatDate(shipment.deliveredAt)}</dd></div>
+          <div><dt>{locale === "zh" ? "毛重" : "Gross weight"}</dt><dd>{shipment.grossWeightKg?.toString() ?? "—"} kg</dd></div>
+          <div><dt>{locale === "zh" ? "体积" : "Volume"}</dt><dd>{shipment.volumeCbm?.toString() ?? "—"} m³</dd></div>
+        </dl>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "发货明细与序列号" : "Items and serials"}</h2>
+        <div className="record-grid">
+          {shipment.items.map((item) => (
+            <article className="record-card" key={item.id}>
+              <strong>{item.inventoryItem?.product.sku ?? item.salesOrderItemId}</strong>
+              <span>{item.inventoryItem?.product.name ?? (locale === "zh" ? "未关联库存产品" : "No linked inventory product")}</span>
+              <span>{locale === "zh" ? "数量" : "Quantity"}: {item.quantity}</span>
+              <span>
+                {locale === "zh" ? "序列号" : "Serials"}:{" "}
+                {item.serials
+                  .map((serial) => `${serial.inventorySerial.serialNumber} (${serial.status})`)
+                  .join(", ") || "—"}
+              </span>
+            </article>
+          ))}
+        </div>
+      </section>
+      <section className="card section-card">
+        <h2>{locale === "zh" ? "运输单证" : "Shipment documents"}</h2>
+        <div className="record-grid">
+          {shipment.documents.map((document) => (
+            <article className="record-card" key={document.id}>
+              <strong>{document.documentType} · {document.fileAsset.fileName}</strong>
+              <span>{document.fileAsset.contentType}</span>
+              <span>{document.fileAsset.sizeBytes.toString()} bytes</span>
+              <span>{locale === "zh" ? "资产 ID" : "Asset ID"}: {document.fileAssetId}</span>
+            </article>
+          ))}
+          {shipment.documents.length === 0 ? (
+            <p>{locale === "zh" ? "暂无运输单证。" : "No shipment documents."}</p>
+          ) : null}
+        </div>
+      </section>
+      {canUpdate ? (
+        <section className="card section-card" data-endpoint={`/api/shipments/${shipment.id}`}>
+          <h2>{locale === "zh" ? "跟踪、单证与状态操作" : "Tracking, documents and status actions"}</h2>
+          {nextStatus ? (
+            <WorkflowAction
+              body={{ status: nextStatus, expectedVersion: shipment.version }}
+              endpoint={`/api/shipments/${shipment.id}/transition`}
+              label={locale === "zh" ? `转为 ${nextStatus}` : `Move to ${nextStatus}`}
+              locale={locale}
+            />
+          ) : null}
+          {cancellable ? (
+            <WorkflowAction
+              body={{ status: "CANCELLED", expectedVersion: shipment.version }}
+              confirmMessage={
+                locale === "zh"
+                  ? "确认取消并释放预留库存？"
+                  : "Cancel and release reserved stock?"
+              }
+              endpoint={`/api/shipments/${shipment.id}/transition`}
+              label={locale === "zh" ? "取消发货" : "Cancel shipment"}
+              locale={locale}
+            />
+          ) : null}
+          <details>
+            <summary>{locale === "zh" ? "更新跟踪与单证" : "Update tracking and documents"}</summary>
+            <ShipmentUpdateForm locale={locale} shipment={shipment} />
+          </details>
+        </section>
+      ) : null}
+    </>
+  );
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
new file mode 100644
index 0000000..3d36108
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { supplierSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); return success(await service.listSuppliers(context)); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.create"); return success(await service.createSupplier(context, supplierSchema.parse(await request.json()) as never), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
new file mode 100644
index 0000000..2d7b3ae
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
@@ -0,0 +1,96 @@
+import { z } from "zod";
+
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { writeAudit } from "@/lib/audit";
+import { supplierUpdateSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const service = new ProcurementService();
+const archiveSchema = z.object({ expectedVersion: z.number().int().positive() });
+
+export async function GET(
+  _: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "supplier.read");
+    const row = await service.getSupplier((await params).id, context);
+    if (!row) {
+      throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
+    }
+    return success(row);
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
+    requirePermission(context, "supplier.update");
+    return success(
+      await service.updateSupplier(
+        context,
+        (await params).id,
+        supplierUpdateSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function DELETE(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "supplier.update");
+    const { expectedVersion } = archiveSchema.parse(await request.json());
+    const { id } = await params;
+    const archived = await getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.supplier.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!row) {
+        throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
+      }
+      const changed = await transaction.supplier.updateMany({
+        where: { id, version: expectedVersion, deletedAt: null },
+        data: {
+          status: "ARCHIVED",
+          deletedAt: new Date(),
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "SUPPLIER_CONFLICT",
+          "Supplier changed; refresh and retry",
+          409,
+        );
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "supplier.archive",
+        entityType: "Supplier",
+        entityId: id,
+        before: { status: row.status, version: row.version },
+        after: { status: "ARCHIVED", version: row.version + 1 },
+      });
+      return { id };
+    });
+    return success(archived);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
new file mode 100644
index 0000000..7951808
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.read"); return success(await service.listPurchaseOrders(context)); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.create"); return success(await service.createPurchaseOrder(context, purchaseOrderSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\route.ts"
new file mode 100644
index 0000000..be50ced
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\route.ts"
@@ -0,0 +1,143 @@
+import { z } from "zod";
+
+import { writeAudit } from "@/lib/audit";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { assetIdListSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const service = new ProcurementService();
+const updateSchema = z.object({
+  expectedVersion: z.number().int().positive(),
+  paymentTerms: z.string().trim().max(1000).nullable().optional(),
+  shippingTerms: z.string().trim().max(1000).nullable().optional(),
+  incoterm: z.string().trim().max(20).nullable().optional(),
+  notes: z.string().trim().max(5000).nullable().optional(),
+  expectedAt: z.coerce.date().nullable().optional(),
+  attachmentIds: assetIdListSchema.optional(),
+});
+
+export async function GET(
+  _: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "purchase.read");
+    const row = await service.getPurchaseOrder((await params).id, context);
+    if (!row) {
+      throw new DomainError(
+        "PURCHASE_ORDER_NOT_FOUND",
+        "Purchase order not found",
+        404,
+      );
+    }
+    return success(row);
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
+    requirePermission(context, "purchase.update");
+    const input = updateSchema.parse(await request.json());
+    const { id } = await params;
+    const updated = await getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.purchaseOrder.findFirst({
+        where: { id, deletedAt: null },
+      });
+      if (!row) {
+        throw new DomainError(
+          "PURCHASE_ORDER_NOT_FOUND",
+          "Purchase order not found",
+          404,
+        );
+      }
+      if (input.attachmentIds) {
+        const uniqueIds = [...new Set(input.attachmentIds)];
+        const assetCount = await transaction.fileAsset.count({
+          where: { id: { in: uniqueIds }, deletedAt: null },
+        });
+        if (assetCount !== uniqueIds.length) {
+          throw new DomainError(
+            "ATTACHMENT_NOT_FOUND",
+            "One or more attachments are unavailable",
+            409,
+          );
+        }
+      }
+      const changed = await transaction.purchaseOrder.updateMany({
+        where: {
+          id,
+          version: input.expectedVersion,
+          deletedAt: null,
+        },
+        data: {
+          paymentTerms: input.paymentTerms,
+          shippingTerms: input.shippingTerms,
+          incoterm: input.incoterm,
+          notes: input.notes,
+          expectedAt: input.expectedAt,
+          ...(input.attachmentIds ? { attachments: input.attachmentIds } : {}),
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "PURCHASE_ORDER_CONFLICT",
+          "Purchase order changed; refresh and retry",
+          409,
+        );
+      }
+      if (input.attachmentIds) {
+        const previousIds = Array.isArray(row.attachments)
+          ? row.attachments.filter(
+              (value): value is string => typeof value === "string",
+            )
+          : [];
+        const removedIds = previousIds.filter(
+          (fileAssetId) => !input.attachmentIds?.includes(fileAssetId),
+        );
+        if (removedIds.length) {
+          await transaction.fileAsset.updateMany({
+            where: {
+              id: { in: removedIds },
+              entityType: "PurchaseOrder",
+              entityId: id,
+            },
+            data: { entityType: null, entityId: null },
+          });
+        }
+        if (input.attachmentIds.length) {
+          await transaction.fileAsset.updateMany({
+            where: { id: { in: input.attachmentIds }, deletedAt: null },
+            data: { entityType: "PurchaseOrder", entityId: id },
+          });
+        }
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "purchase_order.update",
+        entityType: "PurchaseOrder",
+        entityId: id,
+        before: { version: row.version, attachments: row.attachments },
+        after: {
+          version: row.version + 1,
+          attachments: input.attachmentIds ?? row.attachments,
+        },
+      });
+      return transaction.purchaseOrder.findUniqueOrThrow({ where: { id } });
+    });
+    return success(updated);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\receive\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\receive\\route.ts"
new file mode 100644
index 0000000..5fd13c5
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\receive\\route.ts"
@@ -0,0 +1,23 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderReceiptSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const service = new ProcurementService();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "purchase.update");
+    const input = purchaseOrderReceiptSchema.parse(await request.json());
+    return success(
+      await service.receivePurchaseOrder(context, (await params).id, input),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts"
new file mode 100644
index 0000000..a561303
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderTransitionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.update"); const { status, expectedVersion } = purchaseOrderTransitionSchema.parse(await request.json()); return success(await service.transitionPurchaseOrder(context, (await params).id, status, expectedVersion)); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts"
new file mode 100644
index 0000000..925e1f0
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts"
@@ -0,0 +1,6 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.read"); return success(await service.listInventory()); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts"
new file mode 100644
index 0000000..bf17bc5
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { inventoryMutationSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.update"); return success(await service.mutateInventory(context, inventoryMutationSchema.parse(await request.json()))); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transfer\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transfer\\route.ts"
new file mode 100644
index 0000000..323ab45
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transfer\\route.ts"
@@ -0,0 +1,22 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { inventoryTransferSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const service = new ProcurementService();
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "inventory.update");
+    return success(
+      await service.transferInventory(
+        context,
+        inventoryTransferSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts"
new file mode 100644
index 0000000..62b4495
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { inspectionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.read"); return success(await service.listInspections()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.update"); return success(await service.createInspection(context, inspectionSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts"
new file mode 100644
index 0000000..a8b00de
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { shipmentSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.read"); return success(await service.listShipments()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.update"); return success(await service.createShipment(context, shipmentSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\route.ts"
new file mode 100644
index 0000000..8ad76ce
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\route.ts"
@@ -0,0 +1,177 @@
+import { z } from "zod";
+
+import { writeAudit } from "@/lib/audit";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { assetIdListSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+
+const service = new ProcurementService();
+const updateSchema = z.object({
+  expectedVersion: z.number().int().positive(),
+  carrier: z.string().trim().max(200).nullable().optional(),
+  trackingNumber: z.string().trim().max(200).nullable().optional(),
+  incoterm: z.string().trim().max(20).nullable().optional(),
+  origin: z.string().trim().max(200).nullable().optional(),
+  destination: z.string().trim().max(200).nullable().optional(),
+  originPort: z.string().trim().max(100).nullable().optional(),
+  destinationPort: z.string().trim().max(100).nullable().optional(),
+  estimatedDepartureAt: z.coerce.date().nullable().optional(),
+  estimatedArrivalAt: z.coerce.date().nullable().optional(),
+  documentIds: assetIdListSchema.optional(),
+});
+
+export async function GET(
+  _: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "shipment.read");
+    const { id } = await params;
+    const row = (await service.listShipments()).find((shipment) => shipment.id === id);
+    if (!row) {
+      throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
+    }
+    return success(row);
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
+    requirePermission(context, "shipment.update");
+    const input = updateSchema.parse(await request.json());
+    const { id } = await params;
+    const updated = await getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.shipment.findFirst({
+        where: { id, deletedAt: null },
+        include: { documents: true },
+      });
+      if (!row) {
+        throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
+      }
+      const documentIds = input.documentIds
+        ? [...new Set(input.documentIds)]
+        : undefined;
+      if (documentIds) {
+        const assetCount = await transaction.fileAsset.count({
+          where: { id: { in: documentIds }, deletedAt: null },
+        });
+        if (assetCount !== documentIds.length) {
+          throw new DomainError(
+            "ATTACHMENT_NOT_FOUND",
+            "One or more shipment documents are unavailable",
+            409,
+          );
+        }
+      }
+      const changed = await transaction.shipment.updateMany({
+        where: {
+          id,
+          version: input.expectedVersion,
+          deletedAt: null,
+        },
+        data: {
+          carrier: input.carrier,
+          trackingNumber: input.trackingNumber,
+          incoterm: input.incoterm,
+          origin: input.origin,
+          destination: input.destination,
+          originPort: input.originPort,
+          destinationPort: input.destinationPort,
+          estimatedDepartureAt: input.estimatedDepartureAt,
+          estimatedArrivalAt: input.estimatedArrivalAt,
+          version: { increment: 1 },
+        },
+      });
+      if (changed.count !== 1) {
+        throw new DomainError(
+          "SHIPMENT_CONFLICT",
+          "Shipment changed; refresh and retry",
+          409,
+        );
+      }
+      if (documentIds) {
+        const previousIds = [
+          ...new Set(row.documents.map((document) => document.fileAssetId)),
+        ];
+        const removedIds = previousIds.filter(
+          (fileAssetId) => !documentIds.includes(fileAssetId),
+        );
+        const addedIds = documentIds.filter(
+          (fileAssetId) => !previousIds.includes(fileAssetId),
+        );
+        if (removedIds.length) {
+          await transaction.shipmentDocument.deleteMany({
+            where: { shipmentId: id, fileAssetId: { in: removedIds } },
+          });
+          await transaction.fileAsset.updateMany({
+            where: {
+              id: { in: removedIds },
+              entityType: "Shipment",
+              entityId: id,
+            },
+            data: { entityType: null, entityId: null },
+          });
+        }
+        if (addedIds.length) {
+          await transaction.shipmentDocument.createMany({
+            data: addedIds.map((fileAssetId) => ({
+              shipmentId: id,
+              fileAssetId,
+              documentType: "OTHER",
+            })),
+          });
+        }
+        if (documentIds.length) {
+          await transaction.fileAsset.updateMany({
+            where: { id: { in: documentIds }, deletedAt: null },
+            data: { entityType: "Shipment", entityId: id },
+          });
+        }
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "shipment.update",
+        entityType: "Shipment",
+        entityId: id,
+        before: {
+          version: row.version,
+          trackingNumber: row.trackingNumber,
+          documentIds: row.documents.map((document) => document.fileAssetId),
+        },
+        after: {
+          version: row.version + 1,
+          trackingNumber: input.trackingNumber ?? row.trackingNumber,
+          documentIds:
+            documentIds ??
+            row.documents.map((document) => document.fileAssetId),
+        },
+      });
+      return transaction.shipment.findUniqueOrThrow({
+        where: { id },
+        include: {
+          items: {
+            include: {
+              inventoryItem: { include: { product: true } },
+              serials: { include: { inventorySerial: true } },
+            },
+          },
+          documents: { include: { fileAsset: true } },
+        },
+      });
+    });
+    return success(updated);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts"
new file mode 100644
index 0000000..48e0f2e
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { shipmentTransitionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.update"); const { status, expectedVersion } = shipmentTransitionSchema.parse(await request.json()); return success(await service.transitionShipment(context, (await params).id, status, expectedVersion)); } catch (error) { return failure(error); } }
