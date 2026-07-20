# Task 4 fix review package

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
index a09619c..bb141ee 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -886,19 +886,50 @@ async function main() {
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
+  }
+  const warehouse = await prisma.warehouse.upsert({ where: { code: "SZ-01" }, update: { name: "Shenzhen Export Warehouse", deletedAt: null }, create: { id: deterministicId(41, 1), code: "SZ-01", name: "Shenzhen Export Warehouse" } });
+  const location = await prisma.warehouseLocation.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: "A-01" } }, update: { name: "Inbound QC" }, create: { id: deterministicId(42, 1), warehouseId: warehouse.id, code: "A-01", name: "Inbound QC" } });
+  for (let index = 0; index < 3; index += 1) {
+    const inventoryId = deterministicId(43, index + 1);
+    await prisma.inventoryItem.upsert({
+      where: { id: inventoryId },
+      update: { quantityOnHand: 2, quantityReserved: index === 0 ? 1 : 0, deletedAt: null },
+      create: { id: inventoryId, productId: deterministicId(20, index + 1), locationId: location.id, quantityOnHand: 2, quantityReserved: index === 0 ? 1 : 0, unitCostUsd: String(3500 + index * 1700) },
+    });
+    await prisma.inventorySerial.upsert({ where: { serialNumber: `ATLAS-${index + 1}-0001` }, update: { inventoryItemId: inventoryId, status: index === 0 ? "RESERVED" : "AVAILABLE" }, create: { inventoryItemId: inventoryId, serialNumber: `ATLAS-${index + 1}-0001`, status: index === 0 ? "RESERVED" : "AVAILABLE", receivedAt: new Date(Date.UTC(2026, 6, 12)) } });
+    await prisma.qualityInspection.upsert({ where: { id: deterministicId(44, index + 1) }, update: { inventoryItemId: inventoryId, status: "PASSED", checklist: { serial: true, boot: true, burnIn: true } }, create: { id: deterministicId(44, index + 1), inventoryItemId: inventoryId, inspectorId: deterministicId(3, 7), status: "PASSED", checklist: { serial: true, boot: true, burnIn: true }, inspectedAt: new Date(Date.UTC(2026, 6, 13)) } });
+  }
+  for (let index = 0; index < 2; index += 1) {
+    const poId = deterministicId(45, index + 1);
+    await prisma.purchaseOrder.upsert({
+      where: { id: poId },
+      update: { supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), status: index === 0 ? "SENT" : "APPROVED" },
+      create: { id: poId, purchaseOrderNumber: `PURCHASE-ORDER-${String(index + 1).padStart(6, "0")}`, supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), buyerId: deterministicId(3, 6), status: index === 0 ? "SENT" : "APPROVED", currencyCode: "USD", exchangeRateToUsd: "1", total: "12000", totalUsd: "12000", expectedAt: new Date(Date.UTC(2026, 7, 1)), items: { create: { salesOrderItemId: deterministicId(34, index + 1), description: productNames[index], quantity: 1, unitCost: "12000", lineTotal: "12000" } } },
+    });
+  }
+  await prisma.shipment.upsert({ where: { shipmentNumber: "SHIPMENT-000001" }, update: { status: "BOOKED" }, create: { id: deterministicId(46, 1), shipmentNumber: "SHIPMENT-000001", salesOrderId: deterministicId(33, 1), coordinatorId: deterministicId(3, 8), status: "BOOKED", carrier: "DHL Global Forwarding", trackingNumber: "DHL-ATLAS-001", origin: "Shenzhen", destination: "Frankfurt", items: { create: { salesOrderItemId: deterministicId(34, 1), quantity: 1 } } } });
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
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\migration_lock.toml" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\migration_lock.toml"
new file mode 100644
index 0000000..1eed3a5
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\migration_lock.toml"
@@ -0,0 +1,2 @@
+# Please do not edit this file manually
+provider = "postgresql"
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717173000_initial\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717173000_initial\\migration.sql"
new file mode 100644
index 0000000..d8370b8
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717173000_initial\\migration.sql"
@@ -0,0 +1,1158 @@
+-- CreateSchema
+CREATE SCHEMA IF NOT EXISTS "public";
+
+-- CreateEnum
+CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');
+
+-- CreateEnum
+CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
+
+-- CreateEnum
+CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
+
+-- CreateEnum
+CREATE TYPE "OpportunityStage" AS ENUM ('QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
+
+-- CreateEnum
+CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');
+
+-- CreateEnum
+CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PURCHASING', 'FULFILLING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'RESERVATION', 'RELEASE', 'TRANSFER', 'COUNT', 'DAMAGE', 'RETURN');
+
+-- CreateEnum
+CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL');
+
+-- CreateEnum
+CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
+
+-- CreateTable
+CREATE TABLE "User" (
+    "id" UUID NOT NULL,
+    "email" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "passwordHash" TEXT NOT NULL,
+    "locale" TEXT NOT NULL DEFAULT 'en',
+    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
+    "lastLoginAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Role" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "isSystem" BOOLEAN NOT NULL DEFAULT false,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Permission" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "UserRole" (
+    "userId" UUID NOT NULL,
+    "roleId" UUID NOT NULL,
+    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
+);
+
+-- CreateTable
+CREATE TABLE "RolePermission" (
+    "roleId" UUID NOT NULL,
+    "permissionId" UUID NOT NULL,
+
+    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
+);
+
+-- CreateTable
+CREATE TABLE "LoginAttempt" (
+    "id" UUID NOT NULL,
+    "userId" UUID,
+    "email" TEXT NOT NULL,
+    "success" BOOLEAN NOT NULL,
+    "ipAddress" TEXT,
+    "userAgent" TEXT,
+    "reason" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "AuditLog" (
+    "id" UUID NOT NULL,
+    "actorId" UUID,
+    "action" TEXT NOT NULL,
+    "entityType" TEXT NOT NULL,
+    "entityId" TEXT,
+    "before" JSONB,
+    "after" JSONB,
+    "metadata" JSONB,
+    "ipAddress" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Customer" (
+    "id" UUID NOT NULL,
+    "companyName" TEXT NOT NULL,
+    "legalName" TEXT,
+    "countryCode" TEXT NOT NULL,
+    "website" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "taxId" TEXT,
+    "billingAddress" JSONB,
+    "shippingAddress" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "ownerId" UUID NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Contact" (
+    "id" UUID NOT NULL,
+    "customerId" UUID NOT NULL,
+    "firstName" TEXT NOT NULL,
+    "lastName" TEXT NOT NULL,
+    "title" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
+    "language" TEXT NOT NULL DEFAULT 'en',
+    "timezone" TEXT,
+    "decisionRole" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Lead" (
+    "id" UUID NOT NULL,
+    "companyName" TEXT NOT NULL,
+    "contactName" TEXT NOT NULL,
+    "email" TEXT,
+    "phone" TEXT,
+    "countryCode" TEXT NOT NULL,
+    "source" TEXT NOT NULL,
+    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
+    "notes" TEXT,
+    "ownerId" UUID NOT NULL,
+    "convertedCustomerId" UUID,
+    "convertedOpportunityId" UUID,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "FollowUp" (
+    "id" UUID NOT NULL,
+    "leadId" UUID,
+    "opportunityId" UUID,
+    "type" TEXT NOT NULL,
+    "summary" TEXT NOT NULL,
+    "occurredAt" TIMESTAMP(3) NOT NULL,
+    "nextActionAt" TIMESTAMP(3),
+    "createdById" UUID NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Opportunity" (
+    "id" UUID NOT NULL,
+    "customerId" UUID NOT NULL,
+    "name" TEXT NOT NULL,
+    "stage" "OpportunityStage" NOT NULL DEFAULT 'QUALIFICATION',
+    "value" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "valueUsd" DECIMAL(19,4) NOT NULL,
+    "probability" INTEGER NOT NULL DEFAULT 10,
+    "expectedCloseAt" TIMESTAMP(3),
+    "ownerId" UUID NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ProductCategory" (
+    "id" UUID NOT NULL,
+    "name" TEXT NOT NULL,
+    "slug" TEXT NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Product" (
+    "id" UUID NOT NULL,
+    "sku" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "categoryId" UUID NOT NULL,
+    "brand" TEXT,
+    "model" TEXT,
+    "specifications" JSONB,
+    "serialized" BOOLEAN NOT NULL DEFAULT true,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ProductVariant" (
+    "id" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "sku" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "configuration" JSONB NOT NULL,
+    "cost" DECIMAL(19,4),
+    "currencyCode" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Quote" (
+    "id" UUID NOT NULL,
+    "quoteNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "opportunityId" UUID,
+    "ownerId" UUID NOT NULL,
+    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
+    "currentVersion" INTEGER NOT NULL DEFAULT 1,
+    "validUntil" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QuoteVersion" (
+    "id" UUID NOT NULL,
+    "quoteId" UUID NOT NULL,
+    "number" INTEGER NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "subtotal" DECIMAL(19,4) NOT NULL,
+    "shipping" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "insurance" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "tax" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "bankFees" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "incoterm" TEXT,
+    "paymentTerms" TEXT,
+    "deliveryTerms" TEXT,
+    "warrantyTerms" TEXT,
+    "remarks" TEXT,
+    "immutableAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QuoteItem" (
+    "id" UUID NOT NULL,
+    "quoteVersionId" UUID NOT NULL,
+    "productId" UUID,
+    "description" TEXT NOT NULL,
+    "configuration" JSONB,
+    "quantity" INTEGER NOT NULL,
+    "unitPrice" DECIMAL(19,4) NOT NULL,
+    "discount" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+    "estimatedCostUsd" DECIMAL(19,4),
+
+    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SalesOrder" (
+    "id" UUID NOT NULL,
+    "orderNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "quoteId" UUID,
+    "ownerId" UUID NOT NULL,
+    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "paymentTerms" TEXT NOT NULL,
+    "purchaseOverrideReason" TEXT,
+    "purchaseOverriddenAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SalesOrderItem" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "productId" UUID,
+    "description" TEXT NOT NULL,
+    "configuration" JSONB,
+    "quantity" INTEGER NOT NULL,
+    "unitPrice" DECIMAL(19,4) NOT NULL,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+
+    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Payment" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "reference" TEXT,
+    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "receivedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Refund" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "paymentId" UUID,
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "reason" TEXT NOT NULL,
+    "refundedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Cost" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "category" TEXT NOT NULL,
+    "description" TEXT NOT NULL,
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "incurredAt" TIMESTAMP(3) NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Supplier" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "countryCode" TEXT NOT NULL,
+    "contactName" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "address" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SupplierProduct" (
+    "supplierId" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "supplierSku" TEXT,
+    "leadTimeDays" INTEGER,
+    "lastCost" DECIMAL(19,4),
+    "currencyCode" TEXT,
+
+    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("supplierId","productId")
+);
+
+-- CreateTable
+CREATE TABLE "PurchaseOrder" (
+    "id" UUID NOT NULL,
+    "purchaseOrderNumber" TEXT NOT NULL,
+    "supplierId" UUID NOT NULL,
+    "salesOrderId" UUID,
+    "buyerId" UUID NOT NULL,
+    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "expectedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "PurchaseOrderItem" (
+    "id" UUID NOT NULL,
+    "purchaseOrderId" UUID NOT NULL,
+    "salesOrderItemId" UUID,
+    "description" TEXT NOT NULL,
+    "quantity" INTEGER NOT NULL,
+    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
+    "unitCost" DECIMAL(19,4) NOT NULL,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+
+    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Warehouse" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "address" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "WarehouseLocation" (
+    "id" UUID NOT NULL,
+    "warehouseId" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventoryItem" (
+    "id" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "locationId" UUID NOT NULL,
+    "purchaseOrderItemId" UUID,
+    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
+    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
+    "unitCostUsd" DECIMAL(19,4),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventorySerial" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "serialNumber" TEXT NOT NULL,
+    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
+    "receivedAt" TIMESTAMP(3),
+    "issuedAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "InventorySerial_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventoryTransaction" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "type" "InventoryTransactionType" NOT NULL,
+    "quantity" INTEGER NOT NULL,
+    "fromLocationId" UUID,
+    "toLocationId" UUID,
+    "referenceType" TEXT,
+    "referenceId" TEXT,
+    "notes" TEXT,
+    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "createdById" UUID NOT NULL,
+
+    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QualityInspection" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "inspectorId" UUID NOT NULL,
+    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
+    "checklist" JSONB,
+    "notes" TEXT,
+    "inspectedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Shipment" (
+    "id" UUID NOT NULL,
+    "shipmentNumber" TEXT NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "coordinatorId" UUID NOT NULL,
+    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
+    "carrier" TEXT,
+    "trackingNumber" TEXT,
+    "incoterm" TEXT,
+    "origin" TEXT,
+    "destination" TEXT,
+    "shippedAt" TIMESTAMP(3),
+    "deliveredAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ShipmentItem" (
+    "id" UUID NOT NULL,
+    "shipmentId" UUID NOT NULL,
+    "salesOrderItemId" UUID NOT NULL,
+    "quantity" INTEGER NOT NULL,
+
+    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "AfterSalesTicket" (
+    "id" UUID NOT NULL,
+    "ticketNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "salesOrderId" UUID,
+    "assignedToId" UUID,
+    "subject" TEXT NOT NULL,
+    "description" TEXT NOT NULL,
+    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
+    "status" TEXT NOT NULL DEFAULT 'OPEN',
+    "resolution" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "closedAt" TIMESTAMP(3),
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "AfterSalesTicket_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Task" (
+    "id" UUID NOT NULL,
+    "title" TEXT NOT NULL,
+    "description" TEXT,
+    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
+    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
+    "dueAt" TIMESTAMP(3),
+    "assigneeId" UUID NOT NULL,
+    "creatorId" UUID NOT NULL,
+    "entityType" TEXT,
+    "entityId" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "completedAt" TIMESTAMP(3),
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Notification" (
+    "id" UUID NOT NULL,
+    "userId" UUID NOT NULL,
+    "type" TEXT NOT NULL,
+    "title" TEXT NOT NULL,
+    "message" TEXT NOT NULL,
+    "link" TEXT,
+    "readAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "FileAsset" (
+    "id" UUID NOT NULL,
+    "bucket" TEXT NOT NULL,
+    "objectKey" TEXT NOT NULL,
+    "fileName" TEXT NOT NULL,
+    "contentType" TEXT NOT NULL,
+    "sizeBytes" BIGINT NOT NULL,
+    "checksum" TEXT,
+    "entityType" TEXT,
+    "entityId" TEXT,
+    "uploaderId" UUID NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Currency" (
+    "code" CHAR(3) NOT NULL,
+    "name" TEXT NOT NULL,
+    "symbol" TEXT NOT NULL,
+    "decimals" INTEGER NOT NULL DEFAULT 2,
+    "isActive" BOOLEAN NOT NULL DEFAULT true,
+    "isBase" BOOLEAN NOT NULL DEFAULT false,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
+);
+
+-- CreateTable
+CREATE TABLE "ExchangeRate" (
+    "id" UUID NOT NULL,
+    "currencyCode" CHAR(3) NOT NULL,
+    "rateToUsd" DECIMAL(24,12) NOT NULL,
+    "effectiveAt" TIMESTAMP(3) NOT NULL,
+    "source" TEXT NOT NULL DEFAULT 'MANUAL',
+    "createdById" UUID,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Setting" (
+    "id" UUID NOT NULL,
+    "namespace" TEXT NOT NULL,
+    "key" TEXT NOT NULL,
+    "value" JSONB NOT NULL,
+    "isSecret" BOOLEAN NOT NULL DEFAULT false,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Sequence" (
+    "id" UUID NOT NULL,
+    "key" TEXT NOT NULL,
+    "prefix" TEXT NOT NULL,
+    "nextValue" BIGINT NOT NULL DEFAULT 1,
+    "padding" INTEGER NOT NULL DEFAULT 6,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateIndex
+CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
+
+-- CreateIndex
+CREATE INDEX "User_status_deletedAt_idx" ON "User"("status", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
+
+-- CreateIndex
+CREATE INDEX "Role_deletedAt_idx" ON "Role"("deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
+
+-- CreateIndex
+CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
+
+-- CreateIndex
+CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
+
+-- CreateIndex
+CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "Customer_ownerId_status_deletedAt_idx" ON "Customer"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Customer_countryCode_idx" ON "Customer"("countryCode");
+
+-- CreateIndex
+CREATE INDEX "Contact_customerId_deletedAt_idx" ON "Contact"("customerId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Contact_email_idx" ON "Contact"("email");
+
+-- CreateIndex
+CREATE INDEX "Lead_ownerId_status_deletedAt_idx" ON "Lead"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Lead_countryCode_source_idx" ON "Lead"("countryCode", "source");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_leadId_occurredAt_idx" ON "FollowUp"("leadId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_opportunityId_occurredAt_idx" ON "FollowUp"("opportunityId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_nextActionAt_idx" ON "FollowUp"("nextActionAt");
+
+-- CreateIndex
+CREATE INDEX "Opportunity_ownerId_stage_deletedAt_idx" ON "Opportunity"("ownerId", "stage", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Opportunity_customerId_idx" ON "Opportunity"("customerId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
+
+-- CreateIndex
+CREATE INDEX "Product_categoryId_status_deletedAt_idx" ON "Product"("categoryId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
+
+-- CreateIndex
+CREATE INDEX "ProductVariant_productId_deletedAt_idx" ON "ProductVariant"("productId", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
+
+-- CreateIndex
+CREATE INDEX "Quote_ownerId_status_deletedAt_idx" ON "Quote"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");
+
+-- CreateIndex
+CREATE INDEX "QuoteVersion_quoteId_createdAt_idx" ON "QuoteVersion"("quoteId", "createdAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "QuoteVersion_quoteId_number_key" ON "QuoteVersion"("quoteId", "number");
+
+-- CreateIndex
+CREATE INDEX "QuoteItem_quoteVersionId_idx" ON "QuoteItem"("quoteVersionId");
+
+-- CreateIndex
+CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "SalesOrder_quoteId_key" ON "SalesOrder"("quoteId");
+
+-- CreateIndex
+CREATE INDEX "SalesOrder_ownerId_status_deletedAt_idx" ON "SalesOrder"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");
+
+-- CreateIndex
+CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");
+
+-- CreateIndex
+CREATE INDEX "Payment_salesOrderId_status_deletedAt_idx" ON "Payment"("salesOrderId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Refund_salesOrderId_deletedAt_idx" ON "Refund"("salesOrderId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");
+
+-- CreateIndex
+CREATE INDEX "Cost_salesOrderId_category_deletedAt_idx" ON "Cost"("salesOrderId", "category", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");
+
+-- CreateIndex
+CREATE INDEX "Supplier_status_deletedAt_idx" ON "Supplier"("status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Supplier_countryCode_idx" ON "Supplier"("countryCode");
+
+-- CreateIndex
+CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "PurchaseOrder_purchaseOrderNumber_key" ON "PurchaseOrder"("purchaseOrderNumber");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrder_supplierId_status_deletedAt_idx" ON "PurchaseOrder"("supplierId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrder_salesOrderId_idx" ON "PurchaseOrder"("salesOrderId");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrderItem_salesOrderItemId_idx" ON "PurchaseOrderItem"("salesOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "WarehouseLocation_warehouseId_code_key" ON "WarehouseLocation"("warehouseId", "code");
+
+-- CreateIndex
+CREATE INDEX "InventoryItem_locationId_deletedAt_idx" ON "InventoryItem"("locationId", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "InventoryItem_productId_locationId_purchaseOrderItemId_key" ON "InventoryItem"("productId", "locationId", "purchaseOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "InventorySerial_serialNumber_key" ON "InventorySerial"("serialNumber");
+
+-- CreateIndex
+CREATE INDEX "InventorySerial_inventoryItemId_status_idx" ON "InventorySerial"("inventoryItemId", "status");
+
+-- CreateIndex
+CREATE INDEX "InventoryTransaction_inventoryItemId_occurredAt_idx" ON "InventoryTransaction"("inventoryItemId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");
+
+-- CreateIndex
+CREATE INDEX "QualityInspection_inventoryItemId_status_idx" ON "QualityInspection"("inventoryItemId", "status");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
+
+-- CreateIndex
+CREATE INDEX "Shipment_salesOrderId_status_deletedAt_idx" ON "Shipment"("salesOrderId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ShipmentItem_shipmentId_salesOrderItemId_key" ON "ShipmentItem"("shipmentId", "salesOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "AfterSalesTicket_ticketNumber_key" ON "AfterSalesTicket"("ticketNumber");
+
+-- CreateIndex
+CREATE INDEX "AfterSalesTicket_assignedToId_status_deletedAt_idx" ON "AfterSalesTicket"("assignedToId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "AfterSalesTicket_customerId_idx" ON "AfterSalesTicket"("customerId");
+
+-- CreateIndex
+CREATE INDEX "Task_assigneeId_status_dueAt_deletedAt_idx" ON "Task"("assigneeId", "status", "dueAt", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Task_entityType_entityId_idx" ON "Task"("entityType", "entityId");
+
+-- CreateIndex
+CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "FileAsset_objectKey_key" ON "FileAsset"("objectKey");
+
+-- CreateIndex
+CREATE INDEX "FileAsset_entityType_entityId_deletedAt_idx" ON "FileAsset"("entityType", "entityId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "ExchangeRate_effectiveAt_idx" ON "ExchangeRate"("effectiveAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ExchangeRate_currencyCode_effectiveAt_key" ON "ExchangeRate"("currencyCode", "effectiveAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Setting_namespace_key_key" ON "Setting"("namespace", "key");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Sequence_key_key" ON "Sequence"("key");
+
+-- AddForeignKey
+ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Payment" ADD CONSTRAINT "Payment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Refund" ADD CONSTRAINT "Refund_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Cost" ADD CONSTRAINT "Cost_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventorySerial" ADD CONSTRAINT "InventorySerial_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717180000_enforce_quote_and_purchase_guards\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717180000_enforce_quote_and_purchase_guards\\migration.sql"
new file mode 100644
index 0000000..b2dfaef
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717180000_enforce_quote_and_purchase_guards\\migration.sql"
@@ -0,0 +1,29 @@
+-- Preserve immutable quote history by preventing parent deletion.
+ALTER TABLE "QuoteItem"
+DROP CONSTRAINT "QuoteItem_quoteVersionId_fkey";
+
+ALTER TABLE "QuoteItem"
+ADD CONSTRAINT "QuoteItem_quoteVersionId_fkey"
+FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- Record the actor and immutable audit event for purchase-gate overrides.
+ALTER TABLE "SalesOrder"
+ADD COLUMN "purchaseOverrideActorId" UUID,
+ADD COLUMN "purchaseOverrideAuditId" UUID;
+
+CREATE UNIQUE INDEX "SalesOrder_purchaseOverrideAuditId_key"
+ON "SalesOrder"("purchaseOverrideAuditId");
+
+CREATE INDEX "SalesOrder_purchaseOverrideActorId_idx"
+ON "SalesOrder"("purchaseOverrideActorId");
+
+ALTER TABLE "SalesOrder"
+ADD CONSTRAINT "SalesOrder_purchaseOverrideActorId_fkey"
+FOREIGN KEY ("purchaseOverrideActorId") REFERENCES "User"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
+
+ALTER TABLE "SalesOrder"
+ADD CONSTRAINT "SalesOrder_purchaseOverrideAuditId_fkey"
+FOREIGN KEY ("purchaseOverrideAuditId") REFERENCES "AuditLog"("id")
+ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717190000_sales_crm\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717190000_sales_crm\\migration.sql"
new file mode 100644
index 0000000..4724bb3
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717190000_sales_crm\\migration.sql"
@@ -0,0 +1,56 @@
+ALTER TABLE "Customer"
+  ADD COLUMN "level" TEXT NOT NULL DEFAULT 'STANDARD',
+  ADD COLUMN "riskRating" TEXT NOT NULL DEFAULT 'LOW',
+  ADD COLUMN "riskNotes" TEXT;
+
+ALTER TABLE "Contact"
+  ADD COLUMN "whatsapp" TEXT,
+  ADD COLUMN "wechat" TEXT,
+  ADD COLUMN "preferredChannel" TEXT;
+
+ALTER TABLE "FollowUp"
+  ADD COLUMN "customerId" UUID,
+  ADD COLUMN "contactId" UUID,
+  ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'EMAIL',
+  ADD COLUMN "outcome" TEXT,
+  ADD COLUMN "nextAction" TEXT,
+  ADD COLUMN "completedAt" TIMESTAMP(3),
+  ADD COLUMN "attachments" JSONB;
+
+ALTER TABLE "Opportunity"
+  ADD COLUMN "lostReason" TEXT,
+  ADD COLUMN "wonAt" TIMESTAMP(3),
+  ADD COLUMN "lostAt" TIMESTAMP(3);
+
+ALTER TABLE "FollowUp"
+  ADD CONSTRAINT "FollowUp_customerId_fkey"
+  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
+  ON DELETE SET NULL ON UPDATE CASCADE;
+
+ALTER TABLE "FollowUp"
+  ADD CONSTRAINT "FollowUp_contactId_fkey"
+  FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
+  ON DELETE SET NULL ON UPDATE CASCADE;
+
+CREATE INDEX "FollowUp_customerId_occurredAt_idx"
+  ON "FollowUp"("customerId", "occurredAt");
+
+CREATE INDEX "FollowUp_contactId_occurredAt_idx"
+  ON "FollowUp"("contactId", "occurredAt");
+
+CREATE UNIQUE INDEX "Contact_one_active_primary_per_customer"
+  ON "Contact"("customerId")
+  WHERE "isPrimary" = TRUE AND "deletedAt" IS NULL;
+
+ALTER TABLE "FollowUp"
+  ADD CONSTRAINT "FollowUp_related_record_check"
+  CHECK (
+    "customerId" IS NOT NULL OR
+    "contactId" IS NOT NULL OR
+    "leadId" IS NOT NULL OR
+    "opportunityId" IS NOT NULL
+  );
+
+ALTER TABLE "Opportunity"
+  ADD CONSTRAINT "Opportunity_loss_reason_check"
+  CHECK ("stage" <> 'LOST' OR length(trim("lostReason")) > 0);
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717193000_sales_crm_review_guards\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717193000_sales_crm_review_guards\\migration.sql"
new file mode 100644
index 0000000..e8ce164
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717193000_sales_crm_review_guards\\migration.sql"
@@ -0,0 +1,5 @@
+CREATE UNIQUE INDEX "Lead_convertedCustomerId_key"
+  ON "Lead"("convertedCustomerId");
+
+CREATE UNIQUE INDEX "Lead_convertedOpportunityId_key"
+  ON "Lead"("convertedOpportunityId");
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717200000_sales_transactions\\migration.sql" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717200000_sales_transactions\\migration.sql"
new file mode 100644
index 0000000..1984e0d
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\prisma\\migrations\\20260717200000_sales_transactions\\migration.sql"
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
index 0000000..2c9bbf4
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts"
@@ -0,0 +1,183 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertInspectionResult,
+  assertPurchaseOrderLineOwnership,
+  assertPurchaseOrderTransition,
+  assertShipmentTransition,
+  aggregateInventoryReservations,
+  deriveShipmentOrderState,
+  inventoryBalanceAfter,
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
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: false })).toThrow(
+      "checklist",
+    );
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: true })).not.toThrow();
+  });
+
+  it("synchronizes only valid shipment transitions", () => {
+    expect(() => assertShipmentTransition("BOOKED", "IN_TRANSIT")).not.toThrow();
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
index 0000000..6ce7b49
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts"
@@ -0,0 +1,282 @@
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
+  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
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
+  if (status === "PASSED" && Object.values(checklist).some((complete) => !complete)) {
+    throw new DomainError(
+      "INSPECTION_CHECKLIST_INCOMPLETE",
+      "A passing inspection requires every checklist item to be complete",
+      409,
+    );
+  }
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
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts"
new file mode 100644
index 0000000..fe8a931
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.test.ts"
@@ -0,0 +1,90 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  inspectionSchema,
+  inventoryMutationSchema,
+  purchaseOrderSchema,
+  shipmentSchema,
+  supplierSchema,
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
index 0000000..1a0aaff
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts"
@@ -0,0 +1,120 @@
+import { z } from "zod";
+
+const uuid = z.string().uuid();
+const money = z.string().regex(/^\d+(?:\.\d{1,4})?$/);
+const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
+const rate = z.string().regex(/^\d+(?:\.\d{1,12})?$/).refine((value) => Number(value) > 0);
+const json = z.record(z.string(), z.json());
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
+  attachmentIds: z.array(uuid).max(20).optional(),
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
+  documentIds: z.array(uuid).max(20).optional(),
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
index 0000000..566f1bf
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.test.ts"
@@ -0,0 +1,151 @@
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
+import { ProcurementService, maskBankAccount } from "@/modules/procurement/procurement-service";
+
+const context = {
+  userId: "045a6c7e-d408-41af-8b6f-8b5e525d76c8",
+  roleCodes: ["OPERATIONS"],
+  permissions: ["inventory.update"],
+  isSuperAdmin: false,
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
index 0000000..a768191
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts"
@@ -0,0 +1,1702 @@
+import Decimal from "decimal.js";
+
+import type { Prisma } from "@/generated/prisma/client";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
+import {
+  assertInspectionResult,
+  assertPurchaseOrderLineOwnership,
+  assertPurchaseOrderTransition,
+  assertShipmentTransition,
+  aggregateInventoryReservations,
+  deriveShipmentOrderState,
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
+function supplierPresentation<T extends { bankAccountNumber?: string | null }>(supplier: T) {
+  return {
+    ...supplier,
+    bankAccountNumber: maskBankAccount(supplier.bankAccountNumber),
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
+  listSuppliers() {
+    return getPrisma()
+      .supplier.findMany({
+        where: { deletedAt: null },
+        orderBy: { updatedAt: "desc" },
+        include: {
+          _count: { select: { purchaseOrders: true, products: true } },
+        },
+      })
+      .then((rows) => rows.map(supplierPresentation));
+  }
+
+  getSupplier(id: string) {
+    return getPrisma()
+      .supplier.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          products: { include: { product: true } },
+          purchaseOrders: { orderBy: { updatedAt: "desc" }, take: 20 },
+        },
+      })
+      .then((row) => (row ? supplierPresentation(row) : null));
+  }
+
+  createSupplier(context: AuthorizationContext, input: SupplierInput) {
+    return getPrisma().$transaction(async (transaction) => {
+      const row = await transaction.supplier.create({
+        data: {
+          ...input,
+          address: input.address ?? undefined,
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
+      return supplierPresentation(row);
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
+      const { expectedVersion: _, ...changes } = input;
+      void _;
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
+      return supplierPresentation(updated);
+    });
+  }
+
+  listPurchaseOrders() {
+    return getPrisma().purchaseOrder.findMany({
+      where: { deletedAt: null },
+      orderBy: { updatedAt: "desc" },
+      include: {
+        supplier: true,
+        salesOrder: {
+          select: {
+            orderNumber: true,
+            purchaseEligibilityFlag: true,
+            purchaseOverrideAuditId: true,
+          },
+        },
+        buyer: { select: { name: true } },
+        items: { include: { product: true } },
+      },
+    });
+  }
+
+  getPurchaseOrder(id: string) {
+    return getPrisma().purchaseOrder.findFirst({
+      where: { id, deletedAt: null },
+      include: {
+        supplier: true,
+        salesOrder: { select: { orderNumber: true } },
+        buyer: { select: { name: true } },
+        items: { include: { product: true, inventoryItems: true } },
+      },
+    });
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
+
+      if (input.salesOrderId) {
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
+        for (const requested of input.items) {
+          const source = linkedItems.get(requested.salesOrderItemId!);
+          const alreadyPurchased = order.purchaseOrders
+            .flatMap((purchaseOrder) => purchaseOrder.items)
+            .filter((item) => item.salesOrderItemId === source!.id)
+            .reduce((sum, item) => sum + item.quantity, 0);
+          if (alreadyPurchased + requested.quantity > source!.quantity) {
+            throw new DomainError(
+              "PURCHASE_ORDER_OVER_QUANTITY",
+              `Purchase quantity exceeds sales order item ${source!.id}`,
+              409,
+            );
+          }
+        }
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
+          const passed = await transaction.qualityInspection.groupBy({
+            by: ["inventorySerialId"],
+            where: {
+              inventorySerialId: { in: serials.map((serial) => serial.id) },
+              status: "PASSED",
+            },
+          });
+          if (passed.length !== serials.length) {
+            throw new DomainError(
+              "SHIPMENT_INSPECTION_REQUIRED",
+              "Every serialized shipment unit requires a passing inspection",
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
+          const passed = await transaction.qualityInspection.findFirst({
+            where: { inventoryItemId: inventory.id, status: "PASSED" },
+          });
+          if (!passed) {
+            throw new DomainError(
+              "SHIPMENT_INSPECTION_REQUIRED",
+              "Inventory requires a passing inspection before shipment",
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
index 0000000..fb9b6ef
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\procurement-forms.tsx"
@@ -0,0 +1,940 @@
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
+}: {
+  locale: Locale;
+  items: InventoryOption[];
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
+        <select name="inventorySerialId" required={active?.serialized}>
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
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
new file mode 100644
index 0000000..6e4cb31
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { supplierSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); return success(await service.listSuppliers()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.create"); return success(await service.createSupplier(context, supplierSchema.parse(await request.json()) as never), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
new file mode 100644
index 0000000..0ea61c7
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
@@ -0,0 +1,9 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { supplierUpdateSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); const row = await service.getSupplier((await params).id); if (!row) throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404); return success(row); } catch (error) { return failure(error); } }
+export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.update"); return success(await service.updateSupplier(context, (await params).id, supplierUpdateSchema.parse(await request.json()))); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
new file mode 100644
index 0000000..0504922
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.read"); return success(await service.listPurchaseOrders()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.create"); return success(await service.createPurchaseOrder(context, purchaseOrderSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
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
