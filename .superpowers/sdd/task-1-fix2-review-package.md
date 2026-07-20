# Commit list
46fe37c fix: enforce sales ownership in foundation

# Stat
 .superpowers/sdd/task-1-report.md                  | 51 ++++++++++++++++++++++
 src/app/[locale]/(app)/search/page.tsx             | 17 +++++---
 src/app/api/quotes/versions/[id]/route.ts          |  3 +-
 src/components/app-shell.tsx                       |  2 +-
 src/i18n/dictionaries.test.ts                      | 10 +++++
 src/i18n/dictionaries.ts                           | 22 ++++++++++
 src/lib/rbac.test.ts                               | 14 ++++++
 src/lib/rbac.ts                                    | 18 +++++++-
 src/modules/auth/authorization-context.test.ts     | 12 +++--
 src/modules/auth/authorization-context.ts          |  8 ++++
 .../auth/prisma-authorization-repository.ts        |  2 +
 .../quotes/prisma-quote-version-repository.ts      |  3 +-
 src/modules/quotes/quote-service.test.ts           | 50 ++++++++++++++++++++-
 src/modules/quotes/quote-service.ts                |  7 +++
 src/modules/search/search-scope.test.ts            | 35 +++++++++++++++
 src/modules/search/search-scope.ts                 | 16 +++++++
 16 files changed, 252 insertions(+), 18 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
index af7ca12..1c867d2 100644
--- a/.superpowers/sdd/task-1-report.md
+++ b/.superpowers/sdd/task-1-report.md
@@ -117,10 +117,61 @@ pnpm build
 
   ```powershell
   pnpm build
   ```
 
   Result: PASS — Next.js 16.2.10 compiled, typechecked and generated all 16 route entries, including search, quote-version update and purchase-transition boundaries.
 
 ### Remaining concern
 
 - Docker/Compose execution remains unverified because the Docker CLI is unavailable in this environment.
+
+## Ownership and localization re-review fixes
+
+### Fixes delivered
+
+- Live authorization contexts now include only current, non-deleted role codes as well as current permissions.
+- Added a pure, tested global-search ownership scope. Sales Representatives receive `ownerId = current user` filters for customer, sales-order and quotation queries; Sales Managers and wildcard administrators keep their permitted wider scope.
+- Quote-version state now loads the parent quote owner. The service used by PATCH performs ownership-aware `quote.update` authorization before checking mutability or writing changes, so cross-owner Sales Representative updates are rejected while Sales Managers and administrators retain their allowed scope.
+- Added localized English/Chinese search table headings and entity type labels, plus a localized shell sign-out accessible label.
+
+### Exact checks and results
+
+- Focused ownership/localization tests:
+
+  ```powershell
+  pnpm test src/modules/search/search-scope.test.ts src/modules/quotes/quote-service.test.ts src/lib/rbac.test.ts src/i18n/dictionaries.test.ts src/modules/auth/authorization-context.test.ts
+  ```
+
+  Result: PASS — 5 test files, 29 tests, 0 failures.
+
+- Full unit suite:
+
+  ```powershell
+  pnpm test
+  ```
+
+  Result: PASS — 11 test files, 50 tests, 0 failures.
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
+  Result: PASS — Next.js 16.2.10 compiled, typechecked and generated all 16 route entries.
diff --git a/src/app/[locale]/(app)/search/page.tsx b/src/app/[locale]/(app)/search/page.tsx
index e66c736..038b3b3 100644
--- a/src/app/[locale]/(app)/search/page.tsx
+++ b/src/app/[locale]/(app)/search/page.tsx
@@ -1,64 +1,69 @@
 import { notFound } from "next/navigation";
 
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { getPrisma } from "@/lib/prisma";
 import { can } from "@/lib/rbac";
+import { searchOwnershipFilter } from "@/modules/search/search-scope";
 
 export const dynamic = "force-dynamic";
 
 export default async function SearchPage({
   params,
   searchParams,
 }: {
   params: Promise<{ locale: string }>;
   searchParams: Promise<{ q?: string }>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
   const context = await currentAuthorizationContext();
   const query = ((await searchParams).q ?? "").trim().slice(0, 100);
   const prisma = getPrisma();
+  const ownership = searchOwnershipFilter(context);
 
   const [customers, orders, quotes] = query
     ? await Promise.all([
         can(context, "customer.read")
           ? prisma.customer.findMany({
               where: {
                 deletedAt: null,
+                ...ownership,
                 companyName: { contains: query, mode: "insensitive" },
               },
               select: {
                 id: true,
                 companyName: true,
                 countryCode: true,
               },
               take: 10,
             })
           : [],
         can(context, "order.read")
           ? prisma.salesOrder.findMany({
               where: {
                 deletedAt: null,
+                ...ownership,
                 orderNumber: { contains: query, mode: "insensitive" },
               },
               select: { id: true, orderNumber: true, status: true },
               take: 10,
             })
           : [],
         can(context, "quote.read")
           ? prisma.quote.findMany({
               where: {
                 deletedAt: null,
+                ...ownership,
                 quoteNumber: { contains: query, mode: "insensitive" },
               },
               select: { id: true, quoteNumber: true, status: true },
               take: 10,
             })
           : [],
       ])
     : [[], [], []];
   const resultCount = customers.length + orders.length + quotes.length;
 
@@ -71,43 +76,43 @@ export default async function SearchPage({
             {dictionary.search.results}: <strong>{query || "-"}</strong>
           </p>
         </div>
       </header>
       <section className="card section-card" aria-live="polite">
         {resultCount ? (
           <div className="table-wrap">
             <table>
               <thead>
                 <tr>
-                  <th>Type</th>
-                  <th>Reference</th>
-                  <th>Status / Country</th>
+                  <th>{dictionary.search.table.type}</th>
+                  <th>{dictionary.search.table.reference}</th>
+                  <th>{dictionary.search.table.statusCountry}</th>
                 </tr>
               </thead>
               <tbody>
                 {customers.map((customer) => (
                   <tr key={`customer-${customer.id}`}>
-                    <td>Customer</td>
+                    <td>{dictionary.search.entities.customer}</td>
                     <td>{customer.companyName}</td>
                     <td>{customer.countryCode}</td>
                   </tr>
                 ))}
                 {orders.map((order) => (
                   <tr key={`order-${order.id}`}>
-                    <td>Order</td>
+                    <td>{dictionary.search.entities.order}</td>
                     <td>{order.orderNumber}</td>
                     <td>{order.status}</td>
                   </tr>
                 ))}
                 {quotes.map((quote) => (
                   <tr key={`quote-${quote.id}`}>
-                    <td>Quote</td>
+                    <td>{dictionary.search.entities.quote}</td>
                     <td>{quote.quoteNumber}</td>
                     <td>{quote.status}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : (
           <EmptyState title={dictionary.search.empty} />
         )}
diff --git a/src/app/api/quotes/versions/[id]/route.ts b/src/app/api/quotes/versions/[id]/route.ts
index 69fe3d1..75a768c 100644
--- a/src/app/api/quotes/versions/[id]/route.ts
+++ b/src/app/api/quotes/versions/[id]/route.ts
@@ -1,15 +1,14 @@
 import { z } from "zod";
 
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { failure, success } from "@/lib/http";
-import { requirePermission } from "@/lib/rbac";
 import { createPrismaQuoteVersionRepository } from "@/modules/quotes/prisma-quote-version-repository";
 import { updateQuoteVersion } from "@/modules/quotes/quote-service";
 
 const updateSchema = z
   .object({
     remarks: z.string().max(5000).nullable().optional(),
     paymentTerms: z.string().max(1000).nullable().optional(),
     deliveryTerms: z.string().max(1000).nullable().optional(),
     warrantyTerms: z.string().max(1000).nullable().optional(),
   })
@@ -17,23 +16,23 @@ const updateSchema = z
   .refine((input) => Object.keys(input).length > 0, {
     message: "At least one editable field is required",
   });
 
 export async function PATCH(
   request: Request,
   { params }: { params: Promise<{ id: string }> },
 ) {
   try {
     const context = await currentAuthorizationContext();
-    requirePermission(context, "quote.update");
     const { id } = await params;
     const input = updateSchema.parse(await request.json());
     const version = await updateQuoteVersion(
       createPrismaQuoteVersionRepository(),
+      context,
       id,
       input,
     );
     return success(version);
   } catch (error) {
     return failure(error);
   }
 }
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index c21fcca..9d8f594 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -79,21 +79,21 @@ export function AppShell({
               href={`/${targetLocale}/dashboard`}
               aria-label={dictionary.languageSwitch}
             >
               {targetDictionary.languageName}
             </Link>
             <ThemeToggle />
             <form action={logout}>
               <button
                 className="icon-button focus-ring"
                 title={user.email ?? undefined}
-                aria-label="Sign out"
+                aria-label={dictionary.signOutLabel}
                 type="submit"
               >
                 {(user.name ?? "U").slice(0, 1).toUpperCase()}
               </button>
             </form>
           </div>
         </header>
         <main className="content">{children}</main>
       </div>
     </div>
diff --git a/src/i18n/dictionaries.test.ts b/src/i18n/dictionaries.test.ts
index 04766e1..930afb0 100644
--- a/src/i18n/dictionaries.test.ts
+++ b/src/i18n/dictionaries.test.ts
@@ -16,16 +16,26 @@ describe("locale dictionaries", () => {
     const dictionary = getDictionary("zh");
 
     expect(dictionary.users.title).toBe("\u7528\u6237");
     expect(dictionary.roles.title).toBe("\u89d2\u8272");
     expect(dictionary.dashboard.table.company).toBe("\u516c\u53f8");
     expect(dictionary.dashboard.risks.title).toBe(
       "\u901a\u77e5\u4e0e\u98ce\u9669",
     );
   });
 
+  it("provides Chinese search labels and shell accessibility text", () => {
+    const dictionary = getDictionary("zh");
+
+    expect(dictionary.search.table.type).toBe("\u7c7b\u578b");
+    expect(dictionary.search.entities.customer).toBe("\u5ba2\u6237");
+    expect(dictionary.search.entities.order).toBe("\u8ba2\u5355");
+    expect(dictionary.search.entities.quote).toBe("\u62a5\u4ef7");
+    expect(dictionary.signOutLabel).toBe("\u9000\u51fa\u767b\u5f55");
+  });
+
   it("keeps English punctuation readable", () => {
     expect(getDictionary("en").search.placeholder).toBe(
       "Search customers, orders, quotes\u2026",
     );
   });
 });
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index 264c25b..43be60b 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -1,32 +1,43 @@
 export const locales = ["en", "zh"] as const;
 export type Locale = (typeof locales)[number];
 
 const dictionaries = {
   en: {
     appName: "Atlas CRM",
     languageName: "English",
     languageSwitch: "Switch language",
+    signOutLabel: "Sign out",
     notificationsLabel: "View notifications and risks",
     nav: {
       workspace: "Workspace",
       dashboard: "Dashboard",
       users: "Users",
       roles: "Roles",
     },
     search: {
       label: "Global search",
       placeholder: "Search customers, orders, quotes\u2026",
       submit: "Search",
       title: "Search",
       results: "Results for",
       empty: "No matching customers, orders or quotes.",
+      table: {
+        type: "Type",
+        reference: "Reference",
+        statusCountry: "Status / Country",
+      },
+      entities: {
+        customer: "Customer",
+        order: "Order",
+        quote: "Quote",
+      },
     },
     dashboard: {
       title: "Good to see you",
       subtitle: "Here is the current operating picture.",
       customers: "Active customers",
       quotes: "Open quotations",
       orders: "Orders in progress",
       tasks: "Tasks due",
       recent: "Recently added customers",
       empty: "No customers have been added yet.",
@@ -73,36 +84,47 @@ const dictionaries = {
       error: "Email or password is incorrect, or this account is inactive.",
       heroTitle: "Trade operations, without the blind spots.",
       heroText:
         "Bring customer context, commercial decisions and fulfillment progress into one trusted workspace.",
     },
   },
   zh: {
     appName: "Atlas \u5916\u8d38 CRM",
     languageName: "\u4e2d\u6587",
     languageSwitch: "\u5207\u6362\u8bed\u8a00",
+    signOutLabel: "\u9000\u51fa\u767b\u5f55",
     notificationsLabel: "\u67e5\u770b\u901a\u77e5\u4e0e\u98ce\u9669",
     nav: {
       workspace: "\u5de5\u4f5c\u53f0",
       dashboard: "\u4eea\u8868\u76d8",
       users: "\u7528\u6237",
       roles: "\u89d2\u8272",
     },
     search: {
       label: "\u5168\u5c40\u641c\u7d22",
       placeholder:
         "\u641c\u7d22\u5ba2\u6237\u3001\u8ba2\u5355\u3001\u62a5\u4ef7\u2026",
       submit: "\u641c\u7d22",
       title: "\u641c\u7d22",
       results: "\u641c\u7d22\u7ed3\u679c",
       empty:
         "\u672a\u627e\u5230\u5339\u914d\u7684\u5ba2\u6237\u3001\u8ba2\u5355\u6216\u62a5\u4ef7\u3002",
+      table: {
+        type: "\u7c7b\u578b",
+        reference: "\u53c2\u8003\u53f7",
+        statusCountry: "\u72b6\u6001 / \u56fd\u5bb6\u5730\u533a",
+      },
+      entities: {
+        customer: "\u5ba2\u6237",
+        order: "\u8ba2\u5355",
+        quote: "\u62a5\u4ef7",
+      },
     },
     dashboard: {
       title: "\u6b22\u8fce\u56de\u6765",
       subtitle:
         "\u8fd9\u662f\u5f53\u524d\u4e1a\u52a1\u8fd0\u8425\u6982\u89c8\u3002",
       customers: "\u6d3b\u8dc3\u5ba2\u6237",
       quotes: "\u8fdb\u884c\u4e2d\u62a5\u4ef7",
       orders: "\u5c65\u7ea6\u4e2d\u8ba2\u5355",
       tasks: "\u5f85\u529e\u4efb\u52a1",
       recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
diff --git a/src/lib/rbac.test.ts b/src/lib/rbac.test.ts
index 9bdb53c..f3527cd 100644
--- a/src/lib/rbac.test.ts
+++ b/src/lib/rbac.test.ts
@@ -18,20 +18,34 @@ describe("RBAC", () => {
 
   it("denies an unlisted permission", () => {
     expect(can(salesRep, "customer.delete")).toBe(false);
   });
 
   it("enforces ownership for scoped access", () => {
     expect(can(salesRep, "customer.update", { ownerId: "sales-1" })).toBe(true);
     expect(can(salesRep, "customer.update", { ownerId: "sales-2" })).toBe(false);
   });
 
+  it("allows a sales manager to act across owned sales records", () => {
+    expect(
+      can(
+        {
+          userId: "manager-1",
+          roles: ["SALES_MANAGER"],
+          permissions: ["quote.update"],
+        },
+        "quote.update",
+        { ownerId: "sales-1" },
+      ),
+    ).toBe(true);
+  });
+
   it.each(["purchase.cost.read", "finance.profit.read"] as const)(
     "does not infer the sensitive %s permission",
     (permission) => {
       expect(can(salesRep, permission)).toBe(false);
     },
   );
 
   it("permits an explicit sensitive permission", () => {
     expect(
       can(
diff --git a/src/lib/rbac.ts b/src/lib/rbac.ts
index 23f4977..b0f9c9b 100644
--- a/src/lib/rbac.ts
+++ b/src/lib/rbac.ts
@@ -1,44 +1,58 @@
 import { AuthorizationError } from "@/lib/errors";
 
 export const SENSITIVE_PERMISSIONS = [
   "purchase.cost.read",
   "finance.profit.read",
 ] as const;
 
 export interface AuthorizationContext {
   userId: string;
+  roles?: readonly string[];
   permissions: readonly string[];
 }
 
 export interface OwnedResource {
   ownerId?: string | null;
 }
 
+export function hasGlobalOwnershipScope(
+  context: AuthorizationContext,
+  permission?: string,
+) {
+  return (
+    context.permissions.includes("*") ||
+    (permission
+      ? context.permissions.includes(`${permission}.all`)
+      : false) ||
+    context.roles?.includes("SUPER_ADMIN") === true ||
+    context.roles?.includes("SALES_MANAGER") === true
+  );
+}
+
 export function can(
   context: AuthorizationContext,
   permission: string,
   resource?: OwnedResource,
 ) {
   const hasPermission =
     context.permissions.includes("*") ||
     context.permissions.includes(permission);
 
   if (!hasPermission) {
     return false;
   }
 
   if (resource?.ownerId) {
     return (
       resource.ownerId === context.userId ||
-      context.permissions.includes(`${permission}.all`) ||
-      context.permissions.includes("*")
+      hasGlobalOwnershipScope(context, permission)
     );
   }
 
   return true;
 }
 
 export function requirePermission(
   context: AuthorizationContext,
   permission: string,
   resource?: OwnedResource,
diff --git a/src/modules/auth/authorization-context.test.ts b/src/modules/auth/authorization-context.test.ts
index 998ddb1..98be094 100644
--- a/src/modules/auth/authorization-context.test.ts
+++ b/src/modules/auth/authorization-context.test.ts
@@ -15,81 +15,85 @@ function repositoryFor(
 }
 
 describe("server authorization context", () => {
   it("loads only current permissions from non-deleted roles", async () => {
     const repository = repositoryFor(() => ({
       id: "user-1",
       status: "ACTIVE",
       deletedAt: null,
       roles: [
         {
+          code: "SALES_REP",
           deletedAt: null,
           permissions: ["user.read", "role.read", "user.read"],
         },
         {
+          code: "SUPER_ADMIN",
           deletedAt: new Date("2026-01-01"),
           permissions: ["*", "finance.profit.read"],
         },
       ],
     }));
 
     await expect(loadAuthorizationContext(repository, "user-1")).resolves.toEqual(
       {
         userId: "user-1",
+        roles: ["SALES_REP"],
         permissions: ["user.read", "role.read"],
       },
     );
   });
 
   it.each(["INACTIVE", "LOCKED"] as const)(
     "rejects a %s user even when the session token still exists",
     async (status) => {
       const repository = repositoryFor(() => ({
         id: "user-1",
         status,
         deletedAt: null,
-        roles: [{ deletedAt: null, permissions: ["*"] }],
+        roles: [{ code: "SUPER_ADMIN", deletedAt: null, permissions: ["*"] }],
       }));
 
       await expect(
         loadAuthorizationContext(repository, "user-1"),
       ).rejects.toMatchObject({
         code: "UNAUTHENTICATED",
         status: 401,
       });
     },
   );
 
   it("rejects a soft-deleted user", async () => {
     const repository = repositoryFor(() => ({
       id: "user-1",
       status: "ACTIVE",
       deletedAt: new Date("2026-01-01"),
-      roles: [{ deletedAt: null, permissions: ["*"] }],
+      roles: [{ code: "SUPER_ADMIN", deletedAt: null, permissions: ["*"] }],
     }));
 
     await expect(
       loadAuthorizationContext(repository, "user-1"),
     ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
   });
 
   it("does not retain permissions removed after the session was issued", async () => {
     let roleDeleted = false;
     const repository = repositoryFor(() => ({
       id: "user-1",
       status: "ACTIVE",
       deletedAt: null,
       roles: [
         {
+          code: "SALES_REP",
           deletedAt: roleDeleted ? new Date("2026-01-01") : null,
           permissions: ["role.update"],
         },
       ],
     }));
 
     await expect(loadAuthorizationContext(repository, "user-1")).resolves
-      .toMatchObject({ permissions: ["role.update"] });
+      .toMatchObject({ roles: ["SALES_REP"], permissions: ["role.update"] });
     roleDeleted = true;
     await expect(loadAuthorizationContext(repository, "user-1")).resolves
-      .toMatchObject({ permissions: [] });
+      .toMatchObject({ roles: [], permissions: [] });
   });
 });
diff --git a/src/modules/auth/authorization-context.ts b/src/modules/auth/authorization-context.ts
index 6217c86..242a662 100644
--- a/src/modules/auth/authorization-context.ts
+++ b/src/modules/auth/authorization-context.ts
@@ -1,18 +1,19 @@
 import { DomainError } from "@/lib/errors";
 import type { AuthorizationContext } from "@/lib/rbac";
 
 export interface AuthorizationUserRecord {
   id: string;
   status: "ACTIVE" | "INACTIVE" | "LOCKED";
   deletedAt: Date | null;
   roles: Array<{
+    code: string;
     deletedAt: Date | null;
     permissions: string[];
   }>;
 }
 
 export interface AuthorizationRepository {
   findAuthorizationUser(
     userId: string,
   ): Promise<AuthorizationUserRecord | null>;
 }
@@ -21,19 +22,26 @@ export async function loadAuthorizationContext(
   repository: AuthorizationRepository,
   userId: string,
 ): Promise<AuthorizationContext> {
   const user = await repository.findAuthorizationUser(userId);
   if (!user || user.status !== "ACTIVE" || user.deletedAt) {
     throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
   }
 
   return {
     userId: user.id,
+    roles: [
+      ...new Set(
+        user.roles
+          .filter((role) => role.deletedAt === null)
+          .map((role) => role.code),
+      ),
+    ],
     permissions: [
       ...new Set(
         user.roles
           .filter((role) => role.deletedAt === null)
           .flatMap((role) => role.permissions),
       ),
     ],
   };
 }
diff --git a/src/modules/auth/prisma-authorization-repository.ts b/src/modules/auth/prisma-authorization-repository.ts
index 8bd6688..f458be7 100644
--- a/src/modules/auth/prisma-authorization-repository.ts
+++ b/src/modules/auth/prisma-authorization-repository.ts
@@ -12,36 +12,38 @@ export function createPrismaAuthorizationRepository(): AuthorizationRepository {
       const user = await getPrisma().user.findUnique({
         where: { id: userId },
         select: {
           id: true,
           status: true,
           deletedAt: true,
           roles: {
             select: {
               role: {
                 select: {
+                  code: true,
                   deletedAt: true,
                   permissions: {
                     select: { permission: { select: { code: true } } },
                   },
                 },
               },
             },
           },
         },
       });
       if (!user) return null;
 
       return {
         id: user.id,
         status: user.status,
         deletedAt: user.deletedAt,
         roles: user.roles.map(({ role }) => ({
+          code: role.code,
           deletedAt: role.deletedAt,
           permissions: role.permissions.map(
             ({ permission }) => permission.code,
           ),
         })),
       };
     },
   };
 }
diff --git a/src/modules/quotes/prisma-quote-version-repository.ts b/src/modules/quotes/prisma-quote-version-repository.ts
index 44795e7..e2d7b80 100644
--- a/src/modules/quotes/prisma-quote-version-repository.ts
+++ b/src/modules/quotes/prisma-quote-version-repository.ts
@@ -5,28 +5,29 @@ import type {
 } from "@/modules/quotes/quote-service";
 
 export function createPrismaQuoteVersionRepository(): QuoteVersionRepository {
   return {
     async findVersionState(versionId) {
       const version = await getPrisma().quoteVersion.findUnique({
         where: { id: versionId },
         select: {
           id: true,
           immutableAt: true,
-          quote: { select: { status: true } },
+          quote: { select: { status: true, ownerId: true } },
         },
       });
       if (!version) return null;
       return {
         id: version.id,
         immutableAt: version.immutableAt,
         quoteStatus: version.quote.status,
+        quoteOwnerId: version.quote.ownerId,
       };
     },
     updateVersion(versionId, changes: QuoteVersionChanges) {
       return getPrisma().quoteVersion.update({
         where: { id: versionId },
         data: changes,
       });
     },
   };
 }
diff --git a/src/modules/quotes/quote-service.test.ts b/src/modules/quotes/quote-service.test.ts
index 2fcbf70..6fe44f1 100644
--- a/src/modules/quotes/quote-service.test.ts
+++ b/src/modules/quotes/quote-service.test.ts
@@ -13,43 +13,89 @@ function repositoryFor(state: QuoteVersionState) {
     findVersionState: async () => state,
     updateVersion: async (_id, changes) => {
       updates.push(changes);
       return { id: state.id, ...changes };
     },
   };
   return { repository, updates };
 }
 
 describe("quotation immutability", () => {
+  const salesRep = {
+    userId: "sales-1",
+    roles: ["SALES_REP"],
+    permissions: ["quote.update"],
+  };
+
   it("updates an editable draft version", async () => {
     const state = repositoryFor({
       id: "version-1",
       quoteStatus: "DRAFT",
       immutableAt: null,
+      quoteOwnerId: "sales-1",
     });
 
     await expect(
-      updateQuoteVersion(state.repository, "version-1", {
+      updateQuoteVersion(state.repository, salesRep, "version-1", {
         remarks: "Updated terms",
       }),
     ).resolves.toMatchObject({ remarks: "Updated terms" });
     expect(state.updates).toEqual([{ remarks: "Updated terms" }]);
   });
 
   it.each(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"])(
     "rejects changes when a quotation is %s",
     async (quoteStatus) => {
       const state = repositoryFor({
         id: "version-1",
         quoteStatus,
         immutableAt: new Date("2026-01-01"),
+        quoteOwnerId: "sales-1",
       });
 
       await expect(
-        updateQuoteVersion(state.repository, "version-1", {
+        updateQuoteVersion(state.repository, salesRep, "version-1", {
           remarks: "Tampered",
         }),
       ).rejects.toMatchObject({ code: "QUOTE_IMMUTABLE", status: 409 });
       expect(state.updates).toEqual([]);
     },
   );
+
+  it("rejects a Sales Representative updating another owner's draft", async () => {
+    const state = repositoryFor({
+      id: "version-1",
+      quoteStatus: "DRAFT",
+      immutableAt: null,
+      quoteOwnerId: "sales-2",
+    });
+
+    await expect(
+      updateQuoteVersion(state.repository, salesRep, "version-1", {
+        remarks: "Cross-owner change",
+      }),
+    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
+    expect(state.updates).toEqual([]);
+  });
+
+  it("allows a Sales Manager updating a representative's draft", async () => {
+    const state = repositoryFor({
+      id: "version-1",
+      quoteStatus: "DRAFT",
+      immutableAt: null,
+      quoteOwnerId: "sales-2",
+    });
+
+    await expect(
+      updateQuoteVersion(
+        state.repository,
+        {
+          userId: "manager-1",
+          roles: ["SALES_MANAGER"],
+          permissions: ["quote.update"],
+        },
+        "version-1",
+        { remarks: "Manager review" },
+      ),
+    ).resolves.toMatchObject({ remarks: "Manager review" });
+  });
 });
diff --git a/src/modules/quotes/quote-service.ts b/src/modules/quotes/quote-service.ts
index 901eba8..23d48f8 100644
--- a/src/modules/quotes/quote-service.ts
+++ b/src/modules/quotes/quote-service.ts
@@ -1,25 +1,28 @@
 import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { requirePermission } from "@/lib/rbac";
 
 const IMMUTABLE_QUOTE_STATUSES = new Set([
   "SENT",
   "VIEWED",
   "ACCEPTED",
   "REJECTED",
   "EXPIRED",
   "CONVERTED",
 ]);
 
 export interface QuoteVersionState {
   id: string;
   quoteStatus: string;
   immutableAt: Date | null;
+  quoteOwnerId: string;
 }
 
 export interface QuoteVersionChanges {
   remarks?: string | null;
   paymentTerms?: string | null;
   deliveryTerms?: string | null;
   warrantyTerms?: string | null;
 }
 
 export interface QuoteVersionRepository {
@@ -35,20 +38,24 @@ export function assertQuoteVersionMutable(state: QuoteVersionState) {
     throw new DomainError(
       "QUOTE_IMMUTABLE",
       "Sent quotation versions cannot be changed",
       409,
     );
   }
 }
 
 export async function updateQuoteVersion(
   repository: QuoteVersionRepository,
+  context: AuthorizationContext,
   versionId: string,
   changes: QuoteVersionChanges,
 ) {
   const state = await repository.findVersionState(versionId);
   if (!state) {
     throw new DomainError("QUOTE_VERSION_NOT_FOUND", "Quote version not found", 404);
   }
+  requirePermission(context, "quote.update", {
+    ownerId: state.quoteOwnerId,
+  });
   assertQuoteVersionMutable(state);
   return repository.updateVersion(versionId, changes);
 }
diff --git a/src/modules/search/search-scope.test.ts b/src/modules/search/search-scope.test.ts
new file mode 100644
index 0000000..211d298
--- /dev/null
+++ b/src/modules/search/search-scope.test.ts
@@ -0,0 +1,35 @@
+import { describe, expect, it } from "vitest";
+
+import { searchOwnershipFilter } from "@/modules/search/search-scope";
+
+describe("global search ownership scope", () => {
+  it("limits a Sales Representative to records they own", () => {
+    expect(
+      searchOwnershipFilter({
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["customer.read", "order.read", "quote.read"],
+      }),
+    ).toEqual({ ownerId: "sales-1" });
+  });
+
+  it("keeps Sales Manager search scope broad", () => {
+    expect(
+      searchOwnershipFilter({
+        userId: "manager-1",
+        roles: ["SALES_MANAGER"],
+        permissions: ["customer.read", "order.read", "quote.read"],
+      }),
+    ).toEqual({});
+  });
+
+  it("keeps wildcard administrator search scope broad", () => {
+    expect(
+      searchOwnershipFilter({
+        userId: "admin-1",
+        roles: ["SUPER_ADMIN"],
+        permissions: ["*"],
+      }),
+    ).toEqual({});
+  });
+});
diff --git a/src/modules/search/search-scope.ts b/src/modules/search/search-scope.ts
new file mode 100644
index 0000000..4490615
--- /dev/null
+++ b/src/modules/search/search-scope.ts
@@ -0,0 +1,16 @@
+import type { AuthorizationContext } from "@/lib/rbac";
+import { hasGlobalOwnershipScope } from "@/lib/rbac";
+
+export function searchOwnershipFilter(context: AuthorizationContext) {
+  const isSalesRepresentative =
+    context.roles?.includes("SALES_REP") === true;
+
+  if (
+    isSalesRepresentative &&
+    !hasGlobalOwnershipScope(context)
+  ) {
+    return { ownerId: context.userId };
+  }
+
+  return {};
+}
