# Commit list
a0a27d6 fix: enforce foundation security and workflows

# Stat
 .superpowers/sdd/task-1-report.md                  |  70 ++++++++++
 .../migration.sql                                  |  29 ++++
 prisma/schema.prisma                               |  85 ++++++------
 src/app/[locale]/(app)/dashboard/page.tsx          |  26 +++-
 src/app/[locale]/(app)/layout.tsx                  |   2 +
 src/app/[locale]/(app)/loading.tsx                 |   4 +-
 src/app/[locale]/(app)/roles/page.tsx              |  40 +++---
 src/app/[locale]/(app)/search/page.tsx             | 117 ++++++++++++++++
 src/app/[locale]/(app)/users/page.tsx              |  47 ++++---
 src/app/[locale]/(auth)/login/page.tsx             |   2 +-
 src/app/api/orders/[id]/purchase/route.ts          | 110 +++++++++++++++
 src/app/api/quotes/versions/[id]/route.ts          |  39 ++++++
 src/app/api/roles/route.ts                         |   9 +-
 src/app/globals.css                                |   9 ++
 src/app/layout.tsx                                 |   2 +-
 src/auth.ts                                        |   8 +-
 src/components/app-shell.tsx                       |  37 +++--
 src/components/empty-state.tsx                     |   2 +-
 src/components/theme-toggle.tsx                    |   2 +-
 src/i18n/dictionaries.test.ts                      |  31 +++++
 src/i18n/dictionaries.ts                           | 152 ++++++++++++++++-----
 src/lib/current-user.ts                            |  10 +-
 src/modules/auth/authorization-context.test.ts     |  95 +++++++++++++
 src/modules/auth/authorization-context.ts          |  39 ++++++
 src/modules/auth/prisma-auth-repository.ts         |   1 +
 .../auth/prisma-authorization-repository.ts        |  47 +++++++
 src/modules/orders/purchase-gate.test.ts           |  84 ++++++++++++
 src/modules/orders/purchase-gate.ts                |  71 ++++++++++
 .../quotes/prisma-quote-version-repository.ts      |  32 +++++
 src/modules/quotes/quote-service.test.ts           |  55 ++++++++
 src/modules/quotes/quote-service.ts                |  54 ++++++++
 src/modules/roles/role-permissions.test.ts         |  40 ++++++
 src/modules/roles/role-permissions.ts              |  47 +++++++
 src/proxy.ts                                       |   2 +-
 src/types/next-auth.d.ts                           |   2 -
 35 files changed, 1251 insertions(+), 151 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
index ae6a534..af7ca12 100644
--- a/.superpowers/sdd/task-1-report.md
+++ b/.superpowers/sdd/task-1-report.md
@@ -47,10 +47,80 @@ pnpm lint
 pnpm build
 ```
 
 ## Self-review findings and remaining concerns
 
 - The exact large business-domain seed volumes are intentionally deferred to Tasks 2–5, whose briefs own the customer/contact/lead/opportunity/product/order/procurement/ticket/task counts. Task 1 provides deterministic identity and foundation seed data.
 - Docker/Compose syntax and runtime startup could not be executed locally because Docker is unavailable; configuration should be checked in a Docker-enabled environment.
 - User and role foundations currently expose list/create operations only. Later management work can add update/deactivation flows while reusing the transaction-scoped audit pattern.
 - The generated Prisma client is intentionally ignored and must be produced with `pnpm prisma:generate` after install; the README and Docker build both do this.
 - The task brief and progress ledger were not modified.
+
+## Review fixes
+
+### Status
+
+`DONE_WITH_CONCERNS`
+
+### Fixes delivered
+
+- Replaced non-ASCII source literals in dictionaries and shell controls with stable Unicode escapes or ASCII, corrected the login/shell language switches, and localized dashboard, user and role headings/tables in English and Chinese.
+- Replaced JWT permission trust with a live server authorization context. Every protected page and API request now reloads the user, rejects inactive/locked/soft-deleted users, excludes soft-deleted roles, and rebuilds current permissions. Role and permission claims are no longer copied into the JWT-backed session.
+- Added exact role-permission validation. Duplicate and unknown codes now produce structured `VALIDATION_ERROR` responses rather than being silently deduplicated or ignored.
+- Converted top search to a real accessible GET search flow over permission-visible customers, sales orders and quotations. The notification control now navigates to a labeled, focusable dashboard notification/risk section with live overdue-task data.
+- Added tested quote-version immutability at the service and PATCH API boundary. Sent-or-later quote versions and versions with `immutableAt` reject mutation.
+- Added a tested `100% T/T Before Purchase` payment/refund gate and POST transition API. Only super-admin wildcard access can supply a nonempty override reason; the transaction records the override actor, reason, time and immutable audit-log relation.
+- Added a follow-up migration and schema relations for override actor/audit metadata. Quote items now use `ON DELETE RESTRICT` rather than destructive cascade from immutable quote versions.
+
+### Red/green and final verification
+
+- Focused review-fix tests:
+
+  ```powershell
+  pnpm test src/i18n/dictionaries.test.ts src/modules/auth/authorization-context.test.ts src/modules/roles/role-permissions.test.ts src/modules/quotes/quote-service.test.ts src/modules/orders/purchase-gate.test.ts
+  ```
+
+  Result: PASS — 5 test files, 23 tests, 0 failures.
+
+- Full unit suite:
+
+  ```powershell
+  pnpm test
+  ```
+
+  Result: PASS — 10 test files, 43 tests, 0 failures.
+
+- Prisma schema:
+
+  ```powershell
+  node node_modules\prisma\build\index.js validate
+  ```
+
+  Result: PASS — `The schema at prisma\schema.prisma is valid`.
+
+- TypeScript:
+
+  ```powershell
+  pnpm typecheck
+  ```
+
+  Result: PASS — `tsc --noEmit`, exit code 0.
+
+- ESLint:
+
+  ```powershell
+  pnpm lint
+  ```
+
+  Result: PASS — exit code 0 with no warnings/errors.
+
+- Production build:
+
+  ```powershell
+  pnpm build
+  ```
+
+  Result: PASS — Next.js 16.2.10 compiled, typechecked and generated all 16 route entries, including search, quote-version update and purchase-transition boundaries.
+
+### Remaining concern
+
+- Docker/Compose execution remains unverified because the Docker CLI is unavailable in this environment.
diff --git a/prisma/migrations/20260717180000_enforce_quote_and_purchase_guards/migration.sql b/prisma/migrations/20260717180000_enforce_quote_and_purchase_guards/migration.sql
new file mode 100644
index 0000000..b2dfaef
--- /dev/null
+++ b/prisma/migrations/20260717180000_enforce_quote_and_purchase_guards/migration.sql
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
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 0f905c2..14054ee 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -128,20 +128,21 @@ model User {
   ownedQuotes        Quote[]             @relation("QuoteOwner")
   ownedOrders        SalesOrder[]        @relation("OrderOwner")
   purchaseOrders     PurchaseOrder[]     @relation("PurchaseBuyer")
   inspections        QualityInspection[] @relation("InspectionInspector")
   shipments          Shipment[]          @relation("ShipmentCoordinator")
   assignedTickets    AfterSalesTicket[]  @relation("TicketAssignee")
   assignedTasks      Task[]              @relation("TaskAssignee")
   createdTasks       Task[]              @relation("TaskCreator")
   notifications      Notification[]
   uploadedFiles      FileAsset[]         @relation("FileUploader")
+  purchaseOverrides  SalesOrder[]        @relation("OrderPurchaseOverrideActor")
 
   @@index([status, deletedAt])
 }
 
 model Role {
   id          String           @id @default(uuid()) @db.Uuid
   code        String           @unique
   name        String
   description String?
   isSystem    Boolean          @default(false)
@@ -195,31 +196,32 @@ model LoginAttempt {
   userAgent String?
   reason    String?
   createdAt DateTime @default(now())
   user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
 
   @@index([email, createdAt])
   @@index([userId, createdAt])
 }
 
 model AuditLog {
-  id         String   @id @default(uuid()) @db.Uuid
-  actorId    String?  @db.Uuid
-  action     String
-  entityType String
-  entityId   String?
-  before     Json?
-  after      Json?
-  metadata   Json?
-  ipAddress  String?
-  createdAt  DateTime @default(now())
-  actor      User?    @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
+  id                    String      @id @default(uuid()) @db.Uuid
+  actorId               String?     @db.Uuid
+  action                String
+  entityType            String
+  entityId              String?
+  before                Json?
+  after                 Json?
+  metadata              Json?
+  ipAddress             String?
+  createdAt             DateTime    @default(now())
+  actor                 User?       @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
+  purchaseOverrideOrder SalesOrder? @relation("OrderPurchaseOverrideAudit")
 
   @@index([entityType, entityId, createdAt])
   @@index([actorId, createdAt])
 }
 
 model Customer {
   id              String             @id @default(uuid()) @db.Uuid
   companyName     String
   legalName       String?
   countryCode     String
@@ -443,58 +445,63 @@ model QuoteItem {
   id               String       @id @default(uuid()) @db.Uuid
   quoteVersionId   String       @db.Uuid
   productId        String?      @db.Uuid
   description      String
   configuration    Json?
   quantity         Int
   unitPrice        Decimal      @db.Decimal(19, 4)
   discount         Decimal      @default(0) @db.Decimal(19, 4)
   lineTotal        Decimal      @db.Decimal(19, 4)
   estimatedCostUsd Decimal?     @db.Decimal(19, 4)
-  quoteVersion     QuoteVersion @relation(fields: [quoteVersionId], references: [id], onDelete: Cascade)
+  quoteVersion     QuoteVersion @relation(fields: [quoteVersionId], references: [id], onDelete: Restrict)
   product          Product?     @relation(fields: [productId], references: [id])
 
   @@index([quoteVersionId])
   @@index([productId])
 }
 
 model SalesOrder {
-  id                     String             @id @default(uuid()) @db.Uuid
-  orderNumber            String             @unique
-  customerId             String             @db.Uuid
-  quoteId                String?            @unique @db.Uuid
-  ownerId                String             @db.Uuid
-  status                 OrderStatus        @default(DRAFT)
-  currencyCode           String
-  exchangeRateToUsd      Decimal            @db.Decimal(24, 12)
-  total                  Decimal            @db.Decimal(19, 4)
-  totalUsd               Decimal            @db.Decimal(19, 4)
-  paymentTerms           String
-  purchaseOverrideReason String?
-  purchaseOverriddenAt   DateTime?
-  version                Int                @default(1)
-  createdAt              DateTime           @default(now())
-  updatedAt              DateTime           @updatedAt
-  deletedAt              DateTime?
-  customer               Customer           @relation(fields: [customerId], references: [id])
-  quote                  Quote?             @relation(fields: [quoteId], references: [id])
-  owner                  User               @relation("OrderOwner", fields: [ownerId], references: [id])
-  items                  SalesOrderItem[]
-  payments               Payment[]
-  refunds                Refund[]
-  costs                  Cost[]
-  purchaseOrders         PurchaseOrder[]
-  shipments              Shipment[]
-  tickets                AfterSalesTicket[]
+  id                      String             @id @default(uuid()) @db.Uuid
+  orderNumber             String             @unique
+  customerId              String             @db.Uuid
+  quoteId                 String?            @unique @db.Uuid
+  ownerId                 String             @db.Uuid
+  status                  OrderStatus        @default(DRAFT)
+  currencyCode            String
+  exchangeRateToUsd       Decimal            @db.Decimal(24, 12)
+  total                   Decimal            @db.Decimal(19, 4)
+  totalUsd                Decimal            @db.Decimal(19, 4)
+  paymentTerms            String
+  purchaseOverrideReason  String?
+  purchaseOverrideActorId String?            @db.Uuid
+  purchaseOverrideAuditId String?            @unique @db.Uuid
+  purchaseOverriddenAt    DateTime?
+  version                 Int                @default(1)
+  createdAt               DateTime           @default(now())
+  updatedAt               DateTime           @updatedAt
+  deletedAt               DateTime?
+  customer                Customer           @relation(fields: [customerId], references: [id])
+  quote                   Quote?             @relation(fields: [quoteId], references: [id])
+  owner                   User               @relation("OrderOwner", fields: [ownerId], references: [id])
+  purchaseOverrideActor   User?              @relation("OrderPurchaseOverrideActor", fields: [purchaseOverrideActorId], references: [id], onDelete: Restrict)
+  purchaseOverrideAudit   AuditLog?          @relation("OrderPurchaseOverrideAudit", fields: [purchaseOverrideAuditId], references: [id], onDelete: Restrict)
+  items                   SalesOrderItem[]
+  payments                Payment[]
+  refunds                 Refund[]
+  costs                   Cost[]
+  purchaseOrders          PurchaseOrder[]
+  shipments               Shipment[]
+  tickets                 AfterSalesTicket[]
 
   @@index([ownerId, status, deletedAt])
   @@index([customerId])
+  @@index([purchaseOverrideActorId])
 }
 
 model SalesOrderItem {
   id            String              @id @default(uuid()) @db.Uuid
   salesOrderId  String              @db.Uuid
   productId     String?             @db.Uuid
   description   String
   configuration Json?
   quantity      Int
   unitPrice     Decimal             @db.Decimal(19, 4)
diff --git a/src/app/[locale]/(app)/dashboard/page.tsx b/src/app/[locale]/(app)/dashboard/page.tsx
index 8f42de9..ef3aa5f 100644
--- a/src/app/[locale]/(app)/dashboard/page.tsx
+++ b/src/app/[locale]/(app)/dashboard/page.tsx
@@ -1,32 +1,34 @@
 import { notFound } from "next/navigation";
 
 import { auth } from "@/auth";
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
 import { loadDashboard } from "@/modules/dashboard/dashboard-service";
 import { PrismaDashboardRepository } from "@/modules/dashboard/prisma-dashboard-repository";
 
 export const dynamic = "force-dynamic";
 
 export default async function DashboardPage({
   params,
 }: {
   params: Promise<{ locale: string }>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const session = await auth();
+  const context = await currentAuthorizationContext();
   const dictionary = getDictionary(locale);
   const snapshot = await loadDashboard(
     new PrismaDashboardRepository(),
-    session!.user.id,
+    context.userId,
   );
   const metrics = [
     [dictionary.dashboard.customers, snapshot.activeCustomers],
     [dictionary.dashboard.quotes, snapshot.openQuotes],
     [dictionary.dashboard.orders, snapshot.activeOrders],
     [dictionary.dashboard.tasks, snapshot.dueTasks],
   ] as const;
 
   return (
     <>
@@ -47,34 +49,48 @@ export default async function DashboardPage({
           </article>
         ))}
       </section>
       <section className="card section-card">
         <h2 className="section-title">{dictionary.dashboard.recent}</h2>
         {snapshot.recentCustomers.length ? (
           <div className="table-wrap">
             <table>
               <thead>
                 <tr>
-                  <th>Company</th>
-                  <th>Country</th>
-                  <th>Added</th>
+                  <th>{dictionary.dashboard.table.company}</th>
+                  <th>{dictionary.dashboard.table.country}</th>
+                  <th>{dictionary.dashboard.table.added}</th>
                 </tr>
               </thead>
               <tbody>
                 {snapshot.recentCustomers.map((customer) => (
                   <tr key={customer.id}>
                     <td>{customer.companyName}</td>
                     <td>{customer.countryCode}</td>
                     <td>{customer.createdAt.toLocaleDateString(locale)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : (
           <EmptyState title={dictionary.dashboard.empty} />
         )}
       </section>
-      <section id="notifications" aria-label="Notifications" />
+      <section
+        className="card section-card"
+        id="notifications"
+        aria-labelledby="notifications-title"
+        tabIndex={-1}
+      >
+        <h2 className="section-title" id="notifications-title">
+          {dictionary.dashboard.risks.title}
+        </h2>
+        <p className="muted">
+          {snapshot.dueTasks
+            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks}`
+            : dictionary.dashboard.risks.clear}
+        </p>
+      </section>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/layout.tsx b/src/app/[locale]/(app)/layout.tsx
index 1ff1d40..36be3f7 100644
--- a/src/app/[locale]/(app)/layout.tsx
+++ b/src/app/[locale]/(app)/layout.tsx
@@ -1,24 +1,26 @@
 import { redirect, notFound } from "next/navigation";
 
 import { auth } from "@/auth";
 import { AppShell } from "@/components/app-shell";
 import { isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
 
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
+  await currentAuthorizationContext().catch(() => redirect(`/${locale}/login`));
 
   return (
     <AppShell locale={locale} user={session.user}>
       {children}
     </AppShell>
   );
 }
diff --git a/src/app/[locale]/(app)/loading.tsx b/src/app/[locale]/(app)/loading.tsx
index fa58857..57ddf13 100644
--- a/src/app/[locale]/(app)/loading.tsx
+++ b/src/app/[locale]/(app)/loading.tsx
@@ -1,10 +1,10 @@
 export default function Loading() {
   return (
     <div className="card empty-state" role="status" aria-live="polite">
       <div>
-        <div style={{ fontSize: 28 }}>◌</div>
-        <p className="muted">Loading workspace…</p>
+        <div style={{ fontSize: 20 }}>...</div>
+        <p className="muted">Loading workspace...</p>
       </div>
     </div>
   );
 }
diff --git a/src/app/[locale]/(app)/roles/page.tsx b/src/app/[locale]/(app)/roles/page.tsx
index 630443c..e383fce 100644
--- a/src/app/[locale]/(app)/roles/page.tsx
+++ b/src/app/[locale]/(app)/roles/page.tsx
@@ -1,53 +1,55 @@
-import { auth } from "@/auth";
+import { notFound } from "next/navigation";
+
 import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
 import { getPrisma } from "@/lib/prisma";
 import { can } from "@/lib/rbac";
 
 export const dynamic = "force-dynamic";
 
-export default async function RolesPage() {
-  const session = await auth();
-  if (
-    !can(
-      {
-        userId: session!.user.id,
-        permissions: session!.user.permissions,
-      },
-      "role.read",
-    )
-  ) {
-    return <EmptyState title="You do not have access to role management." />;
+export default async function RolesPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  if (!can(context, "role.read")) {
+    return <EmptyState title={dictionary.roles.denied} />;
   }
   const roles = await getPrisma().role.findMany({
     where: { deletedAt: null },
     include: { _count: { select: { users: true, permissions: true } } },
     orderBy: { name: "asc" },
   });
 
   return (
     <>
       <header className="page-heading">
         <div>
-          <h1>Roles</h1>
-          <p>System responsibilities and permission coverage.</p>
+          <h1>{dictionary.roles.title}</h1>
+          <p>{dictionary.roles.subtitle}</p>
         </div>
       </header>
       <section className="card section-card">
         <div className="table-wrap">
           <table>
             <thead>
               <tr>
-                <th>Role</th>
-                <th>Code</th>
-                <th>Users</th>
-                <th>Permissions</th>
+                <th>{dictionary.roles.table.role}</th>
+                <th>{dictionary.roles.table.code}</th>
+                <th>{dictionary.roles.table.users}</th>
+                <th>{dictionary.roles.table.permissions}</th>
               </tr>
             </thead>
             <tbody>
               {roles.map((role) => (
                 <tr key={role.id}>
                   <td>
                     <strong>{role.name}</strong>
                     <div className="muted">{role.description}</div>
                   </td>
                   <td>{role.code}</td>
diff --git a/src/app/[locale]/(app)/search/page.tsx b/src/app/[locale]/(app)/search/page.tsx
new file mode 100644
index 0000000..e66c736
--- /dev/null
+++ b/src/app/[locale]/(app)/search/page.tsx
@@ -0,0 +1,117 @@
+import { notFound } from "next/navigation";
+
+import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { getPrisma } from "@/lib/prisma";
+import { can } from "@/lib/rbac";
+
+export const dynamic = "force-dynamic";
+
+export default async function SearchPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<{ q?: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  const query = ((await searchParams).q ?? "").trim().slice(0, 100);
+  const prisma = getPrisma();
+
+  const [customers, orders, quotes] = query
+    ? await Promise.all([
+        can(context, "customer.read")
+          ? prisma.customer.findMany({
+              where: {
+                deletedAt: null,
+                companyName: { contains: query, mode: "insensitive" },
+              },
+              select: {
+                id: true,
+                companyName: true,
+                countryCode: true,
+              },
+              take: 10,
+            })
+          : [],
+        can(context, "order.read")
+          ? prisma.salesOrder.findMany({
+              where: {
+                deletedAt: null,
+                orderNumber: { contains: query, mode: "insensitive" },
+              },
+              select: { id: true, orderNumber: true, status: true },
+              take: 10,
+            })
+          : [],
+        can(context, "quote.read")
+          ? prisma.quote.findMany({
+              where: {
+                deletedAt: null,
+                quoteNumber: { contains: query, mode: "insensitive" },
+              },
+              select: { id: true, quoteNumber: true, status: true },
+              take: 10,
+            })
+          : [],
+      ])
+    : [[], [], []];
+  const resultCount = customers.length + orders.length + quotes.length;
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{dictionary.search.title}</h1>
+          <p>
+            {dictionary.search.results}: <strong>{query || "-"}</strong>
+          </p>
+        </div>
+      </header>
+      <section className="card section-card" aria-live="polite">
+        {resultCount ? (
+          <div className="table-wrap">
+            <table>
+              <thead>
+                <tr>
+                  <th>Type</th>
+                  <th>Reference</th>
+                  <th>Status / Country</th>
+                </tr>
+              </thead>
+              <tbody>
+                {customers.map((customer) => (
+                  <tr key={`customer-${customer.id}`}>
+                    <td>Customer</td>
+                    <td>{customer.companyName}</td>
+                    <td>{customer.countryCode}</td>
+                  </tr>
+                ))}
+                {orders.map((order) => (
+                  <tr key={`order-${order.id}`}>
+                    <td>Order</td>
+                    <td>{order.orderNumber}</td>
+                    <td>{order.status}</td>
+                  </tr>
+                ))}
+                {quotes.map((quote) => (
+                  <tr key={`quote-${quote.id}`}>
+                    <td>Quote</td>
+                    <td>{quote.quoteNumber}</td>
+                    <td>{quote.status}</td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </div>
+        ) : (
+          <EmptyState title={dictionary.search.empty} />
+        )}
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/users/page.tsx b/src/app/[locale]/(app)/users/page.tsx
index 5e6f9e9..16ce953 100644
--- a/src/app/[locale]/(app)/users/page.tsx
+++ b/src/app/[locale]/(app)/users/page.tsx
@@ -1,74 +1,79 @@
-import { auth } from "@/auth";
+import { notFound } from "next/navigation";
+
 import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
 import { getPrisma } from "@/lib/prisma";
 import { can } from "@/lib/rbac";
 
 export const dynamic = "force-dynamic";
 
-export default async function UsersPage() {
-  const session = await auth();
-  if (
-    !can(
-      {
-        userId: session!.user.id,
-        permissions: session!.user.permissions,
-      },
-      "user.read",
-    )
-  ) {
-    return <EmptyState title="You do not have access to user management." />;
+export default async function UsersPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  if (!can(context, "user.read")) {
+    return <EmptyState title={dictionary.users.denied} />;
   }
 
   const users = await getPrisma().user.findMany({
     where: { deletedAt: null },
     select: {
       id: true,
       name: true,
       email: true,
       status: true,
-      roles: { select: { role: { select: { name: true } } } },
+      roles: {
+        where: { role: { deletedAt: null } },
+        select: { role: { select: { name: true } } },
+      },
     },
     orderBy: { name: "asc" },
   });
 
   return (
     <>
       <header className="page-heading">
         <div>
-          <h1>Users</h1>
-          <p>Accounts, access status and assigned roles.</p>
+          <h1>{dictionary.users.title}</h1>
+          <p>{dictionary.users.subtitle}</p>
         </div>
       </header>
       <section className="card section-card">
         {users.length ? (
           <div className="table-wrap">
             <table>
               <thead>
                 <tr>
-                  <th>Name</th>
-                  <th>Email</th>
-                  <th>Role</th>
-                  <th>Status</th>
+                  <th>{dictionary.users.table.name}</th>
+                  <th>{dictionary.users.table.email}</th>
+                  <th>{dictionary.users.table.role}</th>
+                  <th>{dictionary.users.table.status}</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map((user) => (
                   <tr key={user.id}>
                     <td>{user.name}</td>
                     <td>{user.email}</td>
                     <td>{user.roles.map(({ role }) => role.name).join(", ")}</td>
                     <td>
                       <span className="badge">{user.status}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : (
-          <EmptyState title="No users found." />
+          <EmptyState title={dictionary.users.empty} />
         )}
       </section>
     </>
   );
 }
diff --git a/src/app/[locale]/(auth)/login/page.tsx b/src/app/[locale]/(auth)/login/page.tsx
index 9388de5..224c1b7 100644
--- a/src/app/[locale]/(auth)/login/page.tsx
+++ b/src/app/[locale]/(auth)/login/page.tsx
@@ -56,21 +56,21 @@ export default async function LoginPage({
               autoComplete="current-password"
               minLength={8}
               required
             />
           </div>
           <button className="button focus-ring" type="submit">
             {dictionary.auth.signIn}
           </button>
           <p className="muted" style={{ marginTop: 22, fontSize: 13 }}>
             <Link href={`/${locale === "en" ? "zh" : "en"}/login`}>
-              {locale === "en" ? "中文" : "English"}
+              {getDictionary(locale === "en" ? "zh" : "en").languageName}
             </Link>
           </p>
         </form>
       </section>
       <section className="login-hero" aria-hidden="true">
         <div className="login-hero-copy">
           <h2>{dictionary.auth.heroTitle}</h2>
           <p>{dictionary.auth.heroText}</p>
         </div>
       </section>
diff --git a/src/app/api/orders/[id]/purchase/route.ts b/src/app/api/orders/[id]/purchase/route.ts
new file mode 100644
index 0000000..3a23d63
--- /dev/null
+++ b/src/app/api/orders/[id]/purchase/route.ts
@@ -0,0 +1,110 @@
+import { z } from "zod";
+
+import { writeAudit } from "@/lib/audit";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { AuthorizationError, DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
+
+const requestSchema = z.object({
+  overrideReason: z.string().optional(),
+});
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "purchase.create");
+    const { id } = await params;
+    const input = requestSchema.parse(await request.json());
+
+    const order = await getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.salesOrder.findFirst({
+        where: { id, deletedAt: null },
+        include: {
+          payments: {
+            where: { status: "CONFIRMED", deletedAt: null },
+            select: { amountUsd: true },
+          },
+          refunds: {
+            where: { refundedAt: { not: null }, deletedAt: null },
+            select: { amountUsd: true },
+          },
+        },
+      });
+      if (!current) {
+        throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
+      }
+      if (current.status !== "CONFIRMED") {
+        throw new DomainError(
+          "INVALID_ORDER_TRANSITION",
+          "Only confirmed orders can enter purchasing",
+          409,
+        );
+      }
+
+      if (
+        input.overrideReason !== undefined &&
+        !context.permissions.includes("*")
+      ) {
+        throw new AuthorizationError("order.purchase.override");
+      }
+
+      const gate = authorizePurchaseTransition(
+        {
+          paymentTerms: current.paymentTerms,
+          orderTotalUsd: current.totalUsd.toString(),
+          confirmedPaymentsUsd: current.payments.map(({ amountUsd }) =>
+            amountUsd.toString(),
+          ),
+          confirmedRefundsUsd: current.refunds.map(({ amountUsd }) =>
+            amountUsd.toString(),
+          ),
+        },
+        input.overrideReason === undefined
+          ? undefined
+          : { actorId: context.userId, reason: input.overrideReason },
+      );
+
+      if (!gate.overridden) {
+        return transaction.salesOrder.update({
+          where: { id },
+          data: { status: "PURCHASING", version: { increment: 1 } },
+          select: { id: true, orderNumber: true, status: true, version: true },
+        });
+      }
+
+      const audit = await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "sales_order.purchase_override",
+        entityType: "SalesOrder",
+        entityId: id,
+        metadata: {
+          reason: gate.override.reason,
+          requiredUsd: current.totalUsd.toString(),
+          netPaidUsd: gate.netPaidUsd,
+        },
+      });
+      return transaction.salesOrder.update({
+        where: { id },
+        data: {
+          status: "PURCHASING",
+          version: { increment: 1 },
+          purchaseOverrideActorId: gate.override.actorId,
+          purchaseOverrideReason: gate.override.reason,
+          purchaseOverrideAuditId: (audit as { id: string }).id,
+          purchaseOverriddenAt: new Date(),
+        },
+        select: { id: true, orderNumber: true, status: true, version: true },
+      });
+    });
+
+    return success(order);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/quotes/versions/[id]/route.ts b/src/app/api/quotes/versions/[id]/route.ts
new file mode 100644
index 0000000..69fe3d1
--- /dev/null
+++ b/src/app/api/quotes/versions/[id]/route.ts
@@ -0,0 +1,39 @@
+import { z } from "zod";
+
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { createPrismaQuoteVersionRepository } from "@/modules/quotes/prisma-quote-version-repository";
+import { updateQuoteVersion } from "@/modules/quotes/quote-service";
+
+const updateSchema = z
+  .object({
+    remarks: z.string().max(5000).nullable().optional(),
+    paymentTerms: z.string().max(1000).nullable().optional(),
+    deliveryTerms: z.string().max(1000).nullable().optional(),
+    warrantyTerms: z.string().max(1000).nullable().optional(),
+  })
+  .strict()
+  .refine((input) => Object.keys(input).length > 0, {
+    message: "At least one editable field is required",
+  });
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "quote.update");
+    const { id } = await params;
+    const input = updateSchema.parse(await request.json());
+    const version = await updateQuoteVersion(
+      createPrismaQuoteVersionRepository(),
+      id,
+      input,
+    );
+    return success(version);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/roles/route.ts b/src/app/api/roles/route.ts
index ca02c7d..85bc08a 100644
--- a/src/app/api/roles/route.ts
+++ b/src/app/api/roles/route.ts
@@ -1,17 +1,18 @@
 import { z } from "zod";
 
 import { writeAudit } from "@/lib/audit";
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { failure, success } from "@/lib/http";
 import { getPrisma } from "@/lib/prisma";
 import { requirePermission } from "@/lib/rbac";
+import { resolvePermissionIds } from "@/modules/roles/role-permissions";
 
 const createRoleSchema = z.object({
   code: z
     .string()
     .trim()
     .min(2)
     .max(40)
     .regex(/^[A-Z][A-Z0-9_]+$/),
   name: z.string().trim().min(2).max(100),
   description: z.string().trim().max(300).optional(),
@@ -36,29 +37,33 @@ export async function GET() {
 }
 
 export async function POST(request: Request) {
   try {
     const context = await currentAuthorizationContext();
     requirePermission(context, "role.create");
     const input = createRoleSchema.parse(await request.json());
     const role = await getPrisma().$transaction(async (transaction) => {
       const permissions = await transaction.permission.findMany({
         where: { code: { in: input.permissions } },
-        select: { id: true },
+        select: { id: true, code: true },
       });
+      const permissionIds = resolvePermissionIds(
+        input.permissions,
+        permissions,
+      );
       const created = await transaction.role.create({
         data: {
           code: input.code,
           name: input.name,
           description: input.description,
           permissions: {
-            create: permissions.map(({ id }) => ({ permissionId: id })),
+            create: permissionIds.map((permissionId) => ({ permissionId })),
           },
         },
         select: { id: true, code: true, name: true, description: true },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "role.create",
         entityType: "Role",
         entityId: created.id,
         after: created,
diff --git a/src/app/globals.css b/src/app/globals.css
index a0b063e..bab40b3 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -156,20 +156,29 @@ a {
 }
 
 .search input {
   width: 100%;
   border: 0;
   outline: 0;
   background: transparent;
   color: var(--foreground);
 }
 
+.search button {
+  border: 0;
+  background: transparent;
+  color: var(--accent);
+  font-size: 12px;
+  font-weight: 750;
+  cursor: pointer;
+}
+
 .top-actions {
   display: flex;
   align-items: center;
   gap: 8px;
 }
 
 .icon-button {
   display: grid;
   min-width: 38px;
   height: 38px;
diff --git a/src/app/layout.tsx b/src/app/layout.tsx
index 059516c..021c92a 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,17 +1,17 @@
 import type { Metadata } from "next";
 import "./globals.css";
 
 export const metadata: Metadata = {
   title: {
     default: "Atlas CRM",
-    template: "%s · Atlas CRM",
+    template: "%s \u00b7 Atlas CRM",
   },
   description: "Foreign-trade operations, from first contact to delivery.",
 };
 
 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
 }>) {
   return (
diff --git a/src/auth.ts b/src/auth.ts
index 8cf9b36..cf99511 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -43,25 +43,19 @@ export const { handlers, auth, signIn, signOut } = NextAuth({
           ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
           userAgent: request.headers.get("user-agent") ?? undefined,
         });
       },
     }),
   ],
   callbacks: {
     authorized({ auth: session }) {
       return Boolean(session?.user);
     },
-    jwt({ token, user }) {
-      if (user) {
-        token.roles = user.roles;
-        token.permissions = user.permissions;
-      }
+    jwt({ token }) {
       return token;
     },
     session({ session, token }) {
       session.user.id = token.sub ?? "";
-      session.user.roles = (token.roles as string[]) ?? [];
-      session.user.permissions = (token.permissions as string[]) ?? [];
       return session;
     },
   },
 });
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index bfd70c5..c21fcca 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -1,32 +1,34 @@
 import Link from "next/link";
 
 import { signOut } from "@/auth";
+import { ThemeToggle } from "@/components/theme-toggle";
 import type { Locale } from "@/i18n/dictionaries";
 import { getDictionary } from "@/i18n/dictionaries";
-import { ThemeToggle } from "@/components/theme-toggle";
 
 export function AppShell({
   locale,
   user,
   children,
 }: {
   locale: Locale;
   user: { name?: string | null; email?: string | null };
   children: React.ReactNode;
 }) {
   const dictionary = getDictionary(locale);
   const nav = [
-    ["dashboard", "⌂", dictionary.nav.dashboard],
-    ["users", "♙", dictionary.nav.users],
-    ["roles", "⌘", dictionary.nav.roles],
+    ["dashboard", "D", dictionary.nav.dashboard],
+    ["users", "U", dictionary.nav.users],
+    ["roles", "R", dictionary.nav.roles],
   ] as const;
+  const targetLocale = locale === "en" ? "zh" : "en";
+  const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }
 
   return (
     <div className="app-grid">
       <aside className="sidebar">
         <Link className="brand" href={`/${locale}/dashboard`}>
@@ -42,42 +44,49 @@ export function AppShell({
               href={`/${locale}/${path}`}
             >
               <span aria-hidden="true">{icon}</span>
               <span>{label}</span>
             </Link>
           ))}
         </nav>
       </aside>
       <div className="app-main">
         <header className="topbar">
-          <label className="search">
-            <span aria-hidden="true">⌕</span>
+          <form
+            className="search"
+            action={`/${locale}/search`}
+            role="search"
+          >
+            <span aria-hidden="true">S</span>
             <input
-              aria-label={dictionary.search}
-              placeholder={dictionary.search}
+              aria-label={dictionary.search.label}
+              placeholder={dictionary.search.placeholder}
+              name="q"
               type="search"
+              required
             />
-          </label>
+            <button type="submit">{dictionary.search.submit}</button>
+          </form>
           <div className="top-actions">
             <Link
               className="icon-button notification-link"
               href={`/${locale}/dashboard#notifications`}
-              aria-label="Notifications"
+              aria-label={dictionary.notificationsLabel}
             >
-              ♢
+              !
             </Link>
             <Link
               className="icon-button"
-              href={`/${locale === "en" ? "zh" : "en"}/dashboard`}
-              aria-label="Switch language"
+              href={`/${targetLocale}/dashboard`}
+              aria-label={dictionary.languageSwitch}
             >
-              {locale === "en" ? "中" : "EN"}
+              {targetDictionary.languageName}
             </Link>
             <ThemeToggle />
             <form action={logout}>
               <button
                 className="icon-button focus-ring"
                 title={user.email ?? undefined}
                 aria-label="Sign out"
                 type="submit"
               >
                 {(user.name ?? "U").slice(0, 1).toUpperCase()}
diff --git a/src/components/empty-state.tsx b/src/components/empty-state.tsx
index f86d3e2..9a38868 100644
--- a/src/components/empty-state.tsx
+++ b/src/components/empty-state.tsx
@@ -1,17 +1,17 @@
 export function EmptyState({
   title,
   description,
 }: {
   title: string;
   description?: string;
 }) {
   return (
     <div className="empty-state">
       <div>
-        <div style={{ fontSize: 32, marginBottom: 10 }}>◇</div>
+        <div style={{ fontSize: 24, marginBottom: 10 }}>--</div>
         <strong>{title}</strong>
         {description ? <p className="muted">{description}</p> : null}
       </div>
     </div>
   );
 }
diff --git a/src/components/theme-toggle.tsx b/src/components/theme-toggle.tsx
index 1e4e08f..9a96192 100644
--- a/src/components/theme-toggle.tsx
+++ b/src/components/theme-toggle.tsx
@@ -17,14 +17,14 @@ export function ThemeToggle() {
     localStorage.setItem("atlas-theme", next ? "dark" : "light");
   }
 
   return (
     <button
       type="button"
       className="icon-button focus-ring"
       aria-label="Toggle color theme"
       onClick={toggleTheme}
     >
-      ◐
+      T
     </button>
   );
 }
diff --git a/src/i18n/dictionaries.test.ts b/src/i18n/dictionaries.test.ts
new file mode 100644
index 0000000..04766e1
--- /dev/null
+++ b/src/i18n/dictionaries.test.ts
@@ -0,0 +1,31 @@
+import { describe, expect, it } from "vitest";
+
+import { getDictionary } from "@/i18n/dictionaries";
+
+describe("locale dictionaries", () => {
+  it("contains readable Chinese navigation and authentication copy", () => {
+    const dictionary = getDictionary("zh");
+
+    expect(dictionary.appName).toBe("Atlas \u5916\u8d38 CRM");
+    expect(dictionary.nav.dashboard).toBe("\u4eea\u8868\u76d8");
+    expect(dictionary.auth.signIn).toBe("\u5b89\u5168\u767b\u5f55");
+    expect(dictionary.languageName).toBe("\u4e2d\u6587");
+  });
+
+  it("provides localized user, role, dashboard and risk headings", () => {
+    const dictionary = getDictionary("zh");
+
+    expect(dictionary.users.title).toBe("\u7528\u6237");
+    expect(dictionary.roles.title).toBe("\u89d2\u8272");
+    expect(dictionary.dashboard.table.company).toBe("\u516c\u53f8");
+    expect(dictionary.dashboard.risks.title).toBe(
+      "\u901a\u77e5\u4e0e\u98ce\u9669",
+    );
+  });
+
+  it("keeps English punctuation readable", () => {
+    expect(getDictionary("en").search.placeholder).toBe(
+      "Search customers, orders, quotes\u2026",
+    );
+  });
+});
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index 4a234b1..264c25b 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -1,81 +1,171 @@
 export const locales = ["en", "zh"] as const;
 export type Locale = (typeof locales)[number];
 
 const dictionaries = {
   en: {
     appName: "Atlas CRM",
+    languageName: "English",
+    languageSwitch: "Switch language",
+    notificationsLabel: "View notifications and risks",
     nav: {
       workspace: "Workspace",
       dashboard: "Dashboard",
-      customers: "Customers",
-      opportunities: "Opportunities",
-      quotes: "Quotes",
-      operations: "Operations",
       users: "Users",
       roles: "Roles",
     },
-    search: "Search customers, orders, quotes…",
+    search: {
+      label: "Global search",
+      placeholder: "Search customers, orders, quotes\u2026",
+      submit: "Search",
+      title: "Search",
+      results: "Results for",
+      empty: "No matching customers, orders or quotes.",
+    },
     dashboard: {
       title: "Good to see you",
       subtitle: "Here is the current operating picture.",
       customers: "Active customers",
       quotes: "Open quotations",
       orders: "Orders in progress",
       tasks: "Tasks due",
       recent: "Recently added customers",
       empty: "No customers have been added yet.",
+      table: {
+        company: "Company",
+        country: "Country",
+        added: "Added",
+      },
+      risks: {
+        title: "Notifications and risks",
+        clear: "No urgent risks need your attention.",
+        overdueTasks: "overdue tasks require attention.",
+      },
+    },
+    users: {
+      title: "Users",
+      subtitle: "Accounts, access status and assigned roles.",
+      denied: "You do not have access to user management.",
+      empty: "No users found.",
+      table: {
+        name: "Name",
+        email: "Email",
+        role: "Role",
+        status: "Status",
+      },
+    },
+    roles: {
+      title: "Roles",
+      subtitle: "System responsibilities and permission coverage.",
+      denied: "You do not have access to role management.",
+      table: {
+        role: "Role",
+        code: "Code",
+        users: "Users",
+        permissions: "Permissions",
+      },
     },
     auth: {
       title: "Welcome back",
       subtitle: "Sign in to continue to your workspace.",
       email: "Work email",
       password: "Password",
       signIn: "Sign in securely",
       error: "Email or password is incorrect, or this account is inactive.",
       heroTitle: "Trade operations, without the blind spots.",
       heroText:
         "Bring customer context, commercial decisions and fulfillment progress into one trusted workspace.",
     },
   },
   zh: {
-    appName: "Atlas 外贸 CRM",
+    appName: "Atlas \u5916\u8d38 CRM",
+    languageName: "\u4e2d\u6587",
+    languageSwitch: "\u5207\u6362\u8bed\u8a00",
+    notificationsLabel: "\u67e5\u770b\u901a\u77e5\u4e0e\u98ce\u9669",
     nav: {
-      workspace: "工作台",
-      dashboard: "仪表盘",
-      customers: "客户",
-      opportunities: "商机",
-      quotes: "报价",
-      operations: "运营",
-      users: "用户",
-      roles: "角色",
+      workspace: "\u5de5\u4f5c\u53f0",
+      dashboard: "\u4eea\u8868\u76d8",
+      users: "\u7528\u6237",
+      roles: "\u89d2\u8272",
+    },
+    search: {
+      label: "\u5168\u5c40\u641c\u7d22",
+      placeholder:
+        "\u641c\u7d22\u5ba2\u6237\u3001\u8ba2\u5355\u3001\u62a5\u4ef7\u2026",
+      submit: "\u641c\u7d22",
+      title: "\u641c\u7d22",
+      results: "\u641c\u7d22\u7ed3\u679c",
+      empty:
+        "\u672a\u627e\u5230\u5339\u914d\u7684\u5ba2\u6237\u3001\u8ba2\u5355\u6216\u62a5\u4ef7\u3002",
     },
-    search: "搜索客户、订单、报价…",
     dashboard: {
-      title: "欢迎回来",
-      subtitle: "这是当前业务运营概览。",
-      customers: "活跃客户",
-      quotes: "进行中报价",
-      orders: "履约中订单",
-      tasks: "待办任务",
-      recent: "最近新增客户",
-      empty: "暂时还没有客户数据。",
+      title: "\u6b22\u8fce\u56de\u6765",
+      subtitle:
+        "\u8fd9\u662f\u5f53\u524d\u4e1a\u52a1\u8fd0\u8425\u6982\u89c8\u3002",
+      customers: "\u6d3b\u8dc3\u5ba2\u6237",
+      quotes: "\u8fdb\u884c\u4e2d\u62a5\u4ef7",
+      orders: "\u5c65\u7ea6\u4e2d\u8ba2\u5355",
+      tasks: "\u5f85\u529e\u4efb\u52a1",
+      recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
+      empty: "\u6682\u65f6\u8fd8\u6ca1\u6709\u5ba2\u6237\u6570\u636e\u3002",
+      table: {
+        company: "\u516c\u53f8",
+        country: "\u56fd\u5bb6/\u5730\u533a",
+        added: "\u65b0\u589e\u65e5\u671f",
+      },
+      risks: {
+        title: "\u901a\u77e5\u4e0e\u98ce\u9669",
+        clear: "\u76ee\u524d\u6ca1\u6709\u9700\u8981\u7acb\u5373\u5904\u7406\u7684\u98ce\u9669\u3002",
+        overdueTasks:
+          "\u4e2a\u903e\u671f\u4efb\u52a1\u9700\u8981\u5904\u7406\u3002",
+      },
+    },
+    users: {
+      title: "\u7528\u6237",
+      subtitle:
+        "\u7ba1\u7406\u8d26\u6237\u3001\u8bbf\u95ee\u72b6\u6001\u4e0e\u5df2\u5206\u914d\u89d2\u8272\u3002",
+      denied:
+        "\u60a8\u6ca1\u6709\u8bbf\u95ee\u7528\u6237\u7ba1\u7406\u7684\u6743\u9650\u3002",
+      empty: "\u672a\u627e\u5230\u7528\u6237\u3002",
+      table: {
+        name: "\u59d3\u540d",
+        email: "\u90ae\u7bb1",
+        role: "\u89d2\u8272",
+        status: "\u72b6\u6001",
+      },
+    },
+    roles: {
+      title: "\u89d2\u8272",
+      subtitle:
+        "\u7ba1\u7406\u7cfb\u7edf\u804c\u8d23\u4e0e\u6743\u9650\u8303\u56f4\u3002",
+      denied:
+        "\u60a8\u6ca1\u6709\u8bbf\u95ee\u89d2\u8272\u7ba1\u7406\u7684\u6743\u9650\u3002",
+      table: {
+        role: "\u89d2\u8272",
+        code: "\u4ee3\u7801",
+        users: "\u7528\u6237\u6570",
+        permissions: "\u6743\u9650\u6570",
+      },
     },
     auth: {
-      title: "欢迎回来",
-      subtitle: "登录后进入您的工作台。",
-      email: "工作邮箱",
-      password: "密码",
-      signIn: "安全登录",
-      error: "邮箱或密码错误，或该账户已停用。",
-      heroTitle: "让每一个外贸环节清晰可见。",
-      heroText: "在一个可信工作台中连接客户信息、商务决策与履约进度。",
+      title: "\u6b22\u8fce\u56de\u6765",
+      subtitle:
+        "\u767b\u5f55\u540e\u8fdb\u5165\u60a8\u7684\u5de5\u4f5c\u53f0\u3002",
+      email: "\u5de5\u4f5c\u90ae\u7bb1",
+      password: "\u5bc6\u7801",
+      signIn: "\u5b89\u5168\u767b\u5f55",
+      error:
+        "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u6216\u8be5\u8d26\u6237\u5df2\u505c\u7528\u3002",
+      heroTitle:
+        "\u8ba9\u6bcf\u4e00\u4e2a\u5916\u8d38\u73af\u8282\u6e05\u6670\u53ef\u89c1\u3002",
+      heroText:
+        "\u5728\u4e00\u4e2a\u53ef\u4fe1\u5de5\u4f5c\u53f0\u4e2d\u8fde\u63a5\u5ba2\u6237\u4fe1\u606f\u3001\u5546\u52a1\u51b3\u7b56\u4e0e\u5c65\u7ea6\u8fdb\u5ea6\u3002",
     },
   },
 } as const;
 
 export function isLocale(value: string): value is Locale {
   return locales.includes(value as Locale);
 }
 
 export function getDictionary(locale: Locale) {
   return dictionaries[locale];
diff --git a/src/lib/current-user.ts b/src/lib/current-user.ts
index 7bcad77..088e978 100644
--- a/src/lib/current-user.ts
+++ b/src/lib/current-user.ts
@@ -1,15 +1,17 @@
 import { auth } from "@/auth";
 import { DomainError } from "@/lib/errors";
 import type { AuthorizationContext } from "@/lib/rbac";
+import { loadAuthorizationContext } from "@/modules/auth/authorization-context";
+import { createPrismaAuthorizationRepository } from "@/modules/auth/prisma-authorization-repository";
 
 export async function currentAuthorizationContext(): Promise<AuthorizationContext> {
   const session = await auth();
   if (!session?.user) {
     throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
   }
 
-  return {
-    userId: session.user.id,
-    permissions: session.user.permissions,
-  };
+  return loadAuthorizationContext(
+    createPrismaAuthorizationRepository(),
+    session.user.id,
+  );
 }
diff --git a/src/modules/auth/authorization-context.test.ts b/src/modules/auth/authorization-context.test.ts
new file mode 100644
index 0000000..998ddb1
--- /dev/null
+++ b/src/modules/auth/authorization-context.test.ts
@@ -0,0 +1,95 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  loadAuthorizationContext,
+  type AuthorizationRepository,
+  type AuthorizationUserRecord,
+} from "@/modules/auth/authorization-context";
+
+function repositoryFor(
+  loadUser: () => AuthorizationUserRecord | null,
+): AuthorizationRepository {
+  return {
+    findAuthorizationUser: async () => loadUser(),
+  };
+}
+
+describe("server authorization context", () => {
+  it("loads only current permissions from non-deleted roles", async () => {
+    const repository = repositoryFor(() => ({
+      id: "user-1",
+      status: "ACTIVE",
+      deletedAt: null,
+      roles: [
+        {
+          deletedAt: null,
+          permissions: ["user.read", "role.read", "user.read"],
+        },
+        {
+          deletedAt: new Date("2026-01-01"),
+          permissions: ["*", "finance.profit.read"],
+        },
+      ],
+    }));
+
+    await expect(loadAuthorizationContext(repository, "user-1")).resolves.toEqual(
+      {
+        userId: "user-1",
+        permissions: ["user.read", "role.read"],
+      },
+    );
+  });
+
+  it.each(["INACTIVE", "LOCKED"] as const)(
+    "rejects a %s user even when the session token still exists",
+    async (status) => {
+      const repository = repositoryFor(() => ({
+        id: "user-1",
+        status,
+        deletedAt: null,
+        roles: [{ deletedAt: null, permissions: ["*"] }],
+      }));
+
+      await expect(
+        loadAuthorizationContext(repository, "user-1"),
+      ).rejects.toMatchObject({
+        code: "UNAUTHENTICATED",
+        status: 401,
+      });
+    },
+  );
+
+  it("rejects a soft-deleted user", async () => {
+    const repository = repositoryFor(() => ({
+      id: "user-1",
+      status: "ACTIVE",
+      deletedAt: new Date("2026-01-01"),
+      roles: [{ deletedAt: null, permissions: ["*"] }],
+    }));
+
+    await expect(
+      loadAuthorizationContext(repository, "user-1"),
+    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
+  });
+
+  it("does not retain permissions removed after the session was issued", async () => {
+    let roleDeleted = false;
+    const repository = repositoryFor(() => ({
+      id: "user-1",
+      status: "ACTIVE",
+      deletedAt: null,
+      roles: [
+        {
+          deletedAt: roleDeleted ? new Date("2026-01-01") : null,
+          permissions: ["role.update"],
+        },
+      ],
+    }));
+
+    await expect(loadAuthorizationContext(repository, "user-1")).resolves
+      .toMatchObject({ permissions: ["role.update"] });
+    roleDeleted = true;
+    await expect(loadAuthorizationContext(repository, "user-1")).resolves
+      .toMatchObject({ permissions: [] });
+  });
+});
diff --git a/src/modules/auth/authorization-context.ts b/src/modules/auth/authorization-context.ts
new file mode 100644
index 0000000..6217c86
--- /dev/null
+++ b/src/modules/auth/authorization-context.ts
@@ -0,0 +1,39 @@
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+
+export interface AuthorizationUserRecord {
+  id: string;
+  status: "ACTIVE" | "INACTIVE" | "LOCKED";
+  deletedAt: Date | null;
+  roles: Array<{
+    deletedAt: Date | null;
+    permissions: string[];
+  }>;
+}
+
+export interface AuthorizationRepository {
+  findAuthorizationUser(
+    userId: string,
+  ): Promise<AuthorizationUserRecord | null>;
+}
+
+export async function loadAuthorizationContext(
+  repository: AuthorizationRepository,
+  userId: string,
+): Promise<AuthorizationContext> {
+  const user = await repository.findAuthorizationUser(userId);
+  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
+    throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
+  }
+
+  return {
+    userId: user.id,
+    permissions: [
+      ...new Set(
+        user.roles
+          .filter((role) => role.deletedAt === null)
+          .flatMap((role) => role.permissions),
+      ),
+    ],
+  };
+}
diff --git a/src/modules/auth/prisma-auth-repository.ts b/src/modules/auth/prisma-auth-repository.ts
index e025b9d..ed4ac77 100644
--- a/src/modules/auth/prisma-auth-repository.ts
+++ b/src/modules/auth/prisma-auth-repository.ts
@@ -7,20 +7,21 @@ import type {
 
 export function createPrismaAuthRepository(): AuthRepository {
   const prisma = getPrisma();
 
   return {
     async findByEmail(email): Promise<LoginIdentity | null> {
       const user = await prisma.user.findFirst({
         where: { email, deletedAt: null },
         include: {
           roles: {
+            where: { role: { deletedAt: null } },
             include: {
               role: {
                 include: {
                   permissions: { include: { permission: true } },
                 },
               },
             },
           },
         },
       });
diff --git a/src/modules/auth/prisma-authorization-repository.ts b/src/modules/auth/prisma-authorization-repository.ts
new file mode 100644
index 0000000..8bd6688
--- /dev/null
+++ b/src/modules/auth/prisma-authorization-repository.ts
@@ -0,0 +1,47 @@
+import { getPrisma } from "@/lib/prisma";
+import type {
+  AuthorizationRepository,
+  AuthorizationUserRecord,
+} from "@/modules/auth/authorization-context";
+
+export function createPrismaAuthorizationRepository(): AuthorizationRepository {
+  return {
+    async findAuthorizationUser(
+      userId,
+    ): Promise<AuthorizationUserRecord | null> {
+      const user = await getPrisma().user.findUnique({
+        where: { id: userId },
+        select: {
+          id: true,
+          status: true,
+          deletedAt: true,
+          roles: {
+            select: {
+              role: {
+                select: {
+                  deletedAt: true,
+                  permissions: {
+                    select: { permission: { select: { code: true } } },
+                  },
+                },
+              },
+            },
+          },
+        },
+      });
+      if (!user) return null;
+
+      return {
+        id: user.id,
+        status: user.status,
+        deletedAt: user.deletedAt,
+        roles: user.roles.map(({ role }) => ({
+          deletedAt: role.deletedAt,
+          permissions: role.permissions.map(
+            ({ permission }) => permission.code,
+          ),
+        })),
+      };
+    },
+  };
+}
diff --git a/src/modules/orders/purchase-gate.test.ts b/src/modules/orders/purchase-gate.test.ts
new file mode 100644
index 0000000..306dbf8
--- /dev/null
+++ b/src/modules/orders/purchase-gate.test.ts
@@ -0,0 +1,84 @@
+import { describe, expect, it } from "vitest";
+
+import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
+
+const beforePurchaseOrder = {
+  paymentTerms: "100% T/T Before Purchase",
+  orderTotalUsd: "1000.00",
+  confirmedPaymentsUsd: ["600.10", "399.90"],
+  confirmedRefundsUsd: [],
+};
+
+describe("purchase payment gate", () => {
+  it("allows purchasing when confirmed net payments cover the order", () => {
+    expect(authorizePurchaseTransition(beforePurchaseOrder)).toEqual({
+      eligible: true,
+      overridden: false,
+      netPaidUsd: "1000",
+    });
+  });
+
+  it("blocks purchasing after a refund reduces confirmed coverage", () => {
+    expect(() =>
+      authorizePurchaseTransition({
+        ...beforePurchaseOrder,
+        confirmedRefundsUsd: ["0.01"],
+      }),
+    ).toThrowError(
+      expect.objectContaining({
+        code: "PURCHASE_PAYMENT_REQUIRED",
+        status: 409,
+      }),
+    );
+  });
+
+  it("requires a nonempty reason and actor for a super-admin override", () => {
+    expect(() =>
+      authorizePurchaseTransition(
+        {
+          ...beforePurchaseOrder,
+          confirmedPaymentsUsd: ["999.99"],
+        },
+        { actorId: "admin-1", reason: "   " },
+      ),
+    ).toThrowError(
+      expect.objectContaining({
+        code: "PURCHASE_OVERRIDE_REASON_REQUIRED",
+        status: 400,
+      }),
+    );
+  });
+
+  it("returns immutable override metadata for an authorized exception", () => {
+    expect(
+      authorizePurchaseTransition(
+        {
+          ...beforePurchaseOrder,
+          confirmedPaymentsUsd: ["500"],
+        },
+        {
+          actorId: "admin-1",
+          reason: "Supplier allocation expires today",
+        },
+      ),
+    ).toEqual({
+      eligible: true,
+      overridden: true,
+      netPaidUsd: "500",
+      override: {
+        actorId: "admin-1",
+        reason: "Supplier allocation expires today",
+      },
+    });
+  });
+
+  it("does not apply the payment gate to other payment terms", () => {
+    expect(
+      authorizePurchaseTransition({
+        ...beforePurchaseOrder,
+        paymentTerms: "30% deposit, balance before shipment",
+        confirmedPaymentsUsd: [],
+      }),
+    ).toMatchObject({ eligible: true, overridden: false, netPaidUsd: "0" });
+  });
+});
diff --git a/src/modules/orders/purchase-gate.ts b/src/modules/orders/purchase-gate.ts
new file mode 100644
index 0000000..45f423c
--- /dev/null
+++ b/src/modules/orders/purchase-gate.ts
@@ -0,0 +1,71 @@
+import Decimal from "decimal.js";
+
+import { DomainError } from "@/lib/errors";
+
+export interface PurchaseGateInput {
+  paymentTerms: string;
+  orderTotalUsd: string;
+  confirmedPaymentsUsd: string[];
+  confirmedRefundsUsd: string[];
+}
+
+export interface PurchaseOverride {
+  actorId: string;
+  reason: string;
+}
+
+export function authorizePurchaseTransition(
+  input: PurchaseGateInput,
+  override?: PurchaseOverride,
+) {
+  const paid = input.confirmedPaymentsUsd.reduce(
+    (sum, amount) => sum.plus(amount),
+    new Decimal(0),
+  );
+  const refunded = input.confirmedRefundsUsd.reduce(
+    (sum, amount) => sum.plus(amount),
+    new Decimal(0),
+  );
+  const netPaid = paid.minus(refunded);
+  const requiresFullPayment =
+    input.paymentTerms === "100% T/T Before Purchase";
+
+  if (!requiresFullPayment || netPaid.gte(input.orderTotalUsd)) {
+    return {
+      eligible: true as const,
+      overridden: false as const,
+      netPaidUsd: netPaid.toString(),
+    };
+  }
+
+  if (!override) {
+    throw new DomainError(
+      "PURCHASE_PAYMENT_REQUIRED",
+      "Confirmed net payments must cover the order before purchasing",
+      409,
+      {
+        requiredUsd: new Decimal(input.orderTotalUsd).toString(),
+        netPaidUsd: netPaid.toString(),
+      },
+    );
+  }
+
+  const reason = override.reason.trim();
+  if (!override.actorId || !reason) {
+    throw new DomainError(
+      "PURCHASE_OVERRIDE_REASON_REQUIRED",
+      "A purchase override requires an actor and nonempty reason",
+      400,
+    );
+  }
+
+  return {
+    eligible: true as const,
+    overridden: true as const,
+    netPaidUsd: netPaid.toString(),
+    override: {
+      actorId: override.actorId,
+      reason,
+    },
+  };
+}
diff --git a/src/modules/quotes/prisma-quote-version-repository.ts b/src/modules/quotes/prisma-quote-version-repository.ts
new file mode 100644
index 0000000..44795e7
--- /dev/null
+++ b/src/modules/quotes/prisma-quote-version-repository.ts
@@ -0,0 +1,32 @@
+import { getPrisma } from "@/lib/prisma";
+import type {
+  QuoteVersionChanges,
+  QuoteVersionRepository,
+} from "@/modules/quotes/quote-service";
+
+export function createPrismaQuoteVersionRepository(): QuoteVersionRepository {
+  return {
+    async findVersionState(versionId) {
+      const version = await getPrisma().quoteVersion.findUnique({
+        where: { id: versionId },
+        select: {
+          id: true,
+          immutableAt: true,
+          quote: { select: { status: true } },
+        },
+      });
+      if (!version) return null;
+      return {
+        id: version.id,
+        immutableAt: version.immutableAt,
+        quoteStatus: version.quote.status,
+      };
+    },
+    updateVersion(versionId, changes: QuoteVersionChanges) {
+      return getPrisma().quoteVersion.update({
+        where: { id: versionId },
+        data: changes,
+      });
+    },
+  };
+}
diff --git a/src/modules/quotes/quote-service.test.ts b/src/modules/quotes/quote-service.test.ts
new file mode 100644
index 0000000..2fcbf70
--- /dev/null
+++ b/src/modules/quotes/quote-service.test.ts
@@ -0,0 +1,55 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  updateQuoteVersion,
+  type QuoteVersionRepository,
+  type QuoteVersionState,
+} from "@/modules/quotes/quote-service";
+
+function repositoryFor(state: QuoteVersionState) {
+  const updates: Array<Parameters<QuoteVersionRepository["updateVersion"]>[1]> =
+    [];
+  const repository: QuoteVersionRepository = {
+    findVersionState: async () => state,
+    updateVersion: async (_id, changes) => {
+      updates.push(changes);
+      return { id: state.id, ...changes };
+    },
+  };
+  return { repository, updates };
+}
+
+describe("quotation immutability", () => {
+  it("updates an editable draft version", async () => {
+    const state = repositoryFor({
+      id: "version-1",
+      quoteStatus: "DRAFT",
+      immutableAt: null,
+    });
+
+    await expect(
+      updateQuoteVersion(state.repository, "version-1", {
+        remarks: "Updated terms",
+      }),
+    ).resolves.toMatchObject({ remarks: "Updated terms" });
+    expect(state.updates).toEqual([{ remarks: "Updated terms" }]);
+  });
+
+  it.each(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"])(
+    "rejects changes when a quotation is %s",
+    async (quoteStatus) => {
+      const state = repositoryFor({
+        id: "version-1",
+        quoteStatus,
+        immutableAt: new Date("2026-01-01"),
+      });
+
+      await expect(
+        updateQuoteVersion(state.repository, "version-1", {
+          remarks: "Tampered",
+        }),
+      ).rejects.toMatchObject({ code: "QUOTE_IMMUTABLE", status: 409 });
+      expect(state.updates).toEqual([]);
+    },
+  );
+});
diff --git a/src/modules/quotes/quote-service.ts b/src/modules/quotes/quote-service.ts
new file mode 100644
index 0000000..901eba8
--- /dev/null
+++ b/src/modules/quotes/quote-service.ts
@@ -0,0 +1,54 @@
+import { DomainError } from "@/lib/errors";
+
+const IMMUTABLE_QUOTE_STATUSES = new Set([
+  "SENT",
+  "VIEWED",
+  "ACCEPTED",
+  "REJECTED",
+  "EXPIRED",
+  "CONVERTED",
+]);
+
+export interface QuoteVersionState {
+  id: string;
+  quoteStatus: string;
+  immutableAt: Date | null;
+}
+
+export interface QuoteVersionChanges {
+  remarks?: string | null;
+  paymentTerms?: string | null;
+  deliveryTerms?: string | null;
+  warrantyTerms?: string | null;
+}
+
+export interface QuoteVersionRepository {
+  findVersionState(versionId: string): Promise<QuoteVersionState | null>;
+  updateVersion(
+    versionId: string,
+    changes: QuoteVersionChanges,
+  ): Promise<unknown>;
+}
+
+export function assertQuoteVersionMutable(state: QuoteVersionState) {
+  if (state.immutableAt || IMMUTABLE_QUOTE_STATUSES.has(state.quoteStatus)) {
+    throw new DomainError(
+      "QUOTE_IMMUTABLE",
+      "Sent quotation versions cannot be changed",
+      409,
+    );
+  }
+}
+
+export async function updateQuoteVersion(
+  repository: QuoteVersionRepository,
+  versionId: string,
+  changes: QuoteVersionChanges,
+) {
+  const state = await repository.findVersionState(versionId);
+  if (!state) {
+    throw new DomainError("QUOTE_VERSION_NOT_FOUND", "Quote version not found", 404);
+  }
+  assertQuoteVersionMutable(state);
+  return repository.updateVersion(versionId, changes);
+}
diff --git a/src/modules/roles/role-permissions.test.ts b/src/modules/roles/role-permissions.test.ts
new file mode 100644
index 0000000..bcfa1f4
--- /dev/null
+++ b/src/modules/roles/role-permissions.test.ts
@@ -0,0 +1,40 @@
+import { describe, expect, it } from "vitest";
+
+import { resolvePermissionIds } from "@/modules/roles/role-permissions";
+
+const available = [
+  { id: "permission-1", code: "user.read" },
+  { id: "permission-2", code: "role.read" },
+];
+
+describe("role permission validation", () => {
+  it("resolves each known permission exactly once", () => {
+    expect(
+      resolvePermissionIds(["role.read", "user.read"], available),
+    ).toEqual(["permission-2", "permission-1"]);
+  });
+
+  it("rejects duplicate permission codes with structured details", () => {
+    expect(() =>
+      resolvePermissionIds(["user.read", "user.read"], available),
+    ).toThrowError(
+      expect.objectContaining({
+        code: "VALIDATION_ERROR",
+        status: 400,
+        details: { duplicatePermissions: ["user.read"] },
+      }),
+    );
+  });
+
+  it("rejects unknown permission codes with structured details", () => {
+    expect(() =>
+      resolvePermissionIds(["user.read", "finance.secret"], available),
+    ).toThrowError(
+      expect.objectContaining({
+        code: "VALIDATION_ERROR",
+        status: 400,
+        details: { unknownPermissions: ["finance.secret"] },
+      }),
+    );
+  });
+});
diff --git a/src/modules/roles/role-permissions.ts b/src/modules/roles/role-permissions.ts
new file mode 100644
index 0000000..87c8462
--- /dev/null
+++ b/src/modules/roles/role-permissions.ts
@@ -0,0 +1,47 @@
+import { DomainError } from "@/lib/errors";
+
+export interface AvailablePermission {
+  id: string;
+  code: string;
+}
+
+export function resolvePermissionIds(
+  requestedCodes: string[],
+  availablePermissions: AvailablePermission[],
+) {
+  const duplicatePermissions = [
+    ...new Set(
+      requestedCodes.filter(
+        (code, index) => requestedCodes.indexOf(code) !== index,
+      ),
+    ),
+  ];
+  if (duplicatePermissions.length) {
+    throw new DomainError(
+      "VALIDATION_ERROR",
+      "Duplicate permission codes are not allowed",
+      400,
+      { duplicatePermissions },
+    );
+  }
+
+  const permissionByCode = new Map(
+    availablePermissions.map((permission) => [
+      permission.code,
+      permission.id,
+    ]),
+  );
+  const unknownPermissions = requestedCodes.filter(
+    (code) => !permissionByCode.has(code),
+  );
+  if (unknownPermissions.length) {
+    throw new DomainError(
+      "VALIDATION_ERROR",
+      "Unknown permission codes are not allowed",
+      400,
+      { unknownPermissions },
+    );
+  }
+
+  return requestedCodes.map((code) => permissionByCode.get(code)!);
+}
diff --git a/src/proxy.ts b/src/proxy.ts
index 1e1d498..12639c9 100644
--- a/src/proxy.ts
+++ b/src/proxy.ts
@@ -1,17 +1,17 @@
 import { NextResponse } from "next/server";
 
 import { auth } from "@/auth";
 
 export default auth((request) => {
   const pathname = request.nextUrl.pathname;
-  const isProtected = /^\/(en|zh)\/(dashboard|users|roles)/.test(pathname);
+  const isProtected = /^\/(en|zh)\/(dashboard|users|roles|search)/.test(pathname);
 
   if (isProtected && !request.auth) {
     const locale = pathname.split("/")[1] || "en";
     return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
   }
 
   return NextResponse.next();
 });
 
 export const config = {
diff --git a/src/types/next-auth.d.ts b/src/types/next-auth.d.ts
index 2e85355..53872b6 100644
--- a/src/types/next-auth.d.ts
+++ b/src/types/next-auth.d.ts
@@ -5,15 +5,13 @@ declare module "next-auth" {
     roles: string[];
     permissions: string[];
   }
 
   interface Session {
     user: {
       id: string;
       name?: string | null;
       email?: string | null;
       image?: string | null;
-      roles: string[];
-      permissions: string[];
     };
   }
 }
