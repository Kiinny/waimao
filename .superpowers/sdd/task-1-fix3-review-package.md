# Commit list
6f7037d fix: scope dashboard metrics by owner

# Stat
 .superpowers/sdd/task-1-report.md                  | 44 ++++++++++++++++++++++
 src/app/[locale]/(app)/dashboard/page.tsx          |  7 +++-
 src/components/app-shell.tsx                       |  2 +-
 src/components/theme-toggle.tsx                    |  4 +-
 src/i18n/dictionaries.test.ts                      |  4 ++
 src/i18n/dictionaries.ts                           |  4 ++
 src/modules/dashboard/dashboard-scope.test.ts      | 35 +++++++++++++++++
 src/modules/dashboard/dashboard-scope.ts           |  6 +++
 src/modules/dashboard/dashboard-service.test.ts    | 36 ++++++++++++++++++
 src/modules/dashboard/dashboard-service.ts         |  7 ++--
 .../dashboard/prisma-dashboard-repository.ts       | 12 ++++--
 11 files changed, 149 insertions(+), 12 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
index 1c867d2..50050db 100644
--- a/.superpowers/sdd/task-1-report.md
+++ b/.superpowers/sdd/task-1-report.md
@@ -168,10 +168,54 @@ pnpm build
 
   Result: PASS — exit code 0 with no warnings/errors.
 
 - Production build:
 
   ```powershell
   pnpm build
   ```
 
   Result: PASS — Next.js 16.2.10 compiled, typechecked and generated all 16 route entries.
+
+## Dashboard scope and accessibility re-review fixes
+
+### Fixes delivered
+
+- Dashboard service/repository contracts now receive the complete live authorization context rather than only a user ID.
+- Sales Representative dashboard customer/quote/order counts and recent-customer identities now use the same `ownerId` scope as global search. Sales Managers and wildcard administrators retain their permitted broader scope. Due-task metrics remain assignee-scoped to the current user.
+- Added localized English/Chinese accessible labels for the dashboard metrics region and theme toggle.
+
+### Exact checks and results
+
+- Focused dashboard/accessibility tests:
+
+  ```powershell
+  pnpm test src/modules/dashboard/dashboard-service.test.ts src/modules/dashboard/dashboard-scope.test.ts src/i18n/dictionaries.test.ts
+  ```
+
+  Result: PASS — 3 test files, 8 tests, 0 failures.
+
+- Focused TypeScript integration:
+
+  ```powershell
+  pnpm typecheck
+  ```
+
+  Result: PASS — `tsc --noEmit`, exit code 0.
+
+- Full unit suite:
+
+  ```powershell
+  pnpm test
+  ```
+
+  Result: PASS — 13 test files, 54 tests, 0 failures.
+
+- Full TypeScript, ESLint and production build:
+
+  ```powershell
+  pnpm typecheck
+  pnpm lint
+  pnpm build
+  ```
+
+  Result: PASS — TypeScript and ESLint exited 0; Next.js 16.2.10 compiled, typechecked and generated all 16 route entries.
diff --git a/src/app/[locale]/(app)/dashboard/page.tsx b/src/app/[locale]/(app)/dashboard/page.tsx
index ef3aa5f..6652367 100644
--- a/src/app/[locale]/(app)/dashboard/page.tsx
+++ b/src/app/[locale]/(app)/dashboard/page.tsx
@@ -14,41 +14,44 @@ export default async function DashboardPage({
 }: {
   params: Promise<{ locale: string }>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const session = await auth();
   const context = await currentAuthorizationContext();
   const dictionary = getDictionary(locale);
   const snapshot = await loadDashboard(
     new PrismaDashboardRepository(),
-    context.userId,
+    context,
   );
   const metrics = [
     [dictionary.dashboard.customers, snapshot.activeCustomers],
     [dictionary.dashboard.quotes, snapshot.openQuotes],
     [dictionary.dashboard.orders, snapshot.activeOrders],
     [dictionary.dashboard.tasks, snapshot.dueTasks],
   ] as const;
 
   return (
     <>
       <header className="page-heading">
         <div>
           <h1>
             {dictionary.dashboard.title}
             {session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
           </h1>
           <p>{dictionary.dashboard.subtitle}</p>
         </div>
       </header>
-      <section className="metrics" aria-label="Business metrics">
+      <section
+        className="metrics"
+        aria-label={dictionary.dashboard.metricsLabel}
+      >
         {metrics.map(([label, value]) => (
           <article className="card metric" key={label}>
             <div className="metric-label">{label}</div>
             <div className="metric-value">{value.toLocaleString(locale)}</div>
           </article>
         ))}
       </section>
       <section className="card section-card">
         <h2 className="section-title">{dictionary.dashboard.recent}</h2>
         {snapshot.recentCustomers.length ? (
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 9d8f594..9d0b840 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -74,21 +74,21 @@ export function AppShell({
             >
               !
             </Link>
             <Link
               className="icon-button"
               href={`/${targetLocale}/dashboard`}
               aria-label={dictionary.languageSwitch}
             >
               {targetDictionary.languageName}
             </Link>
-            <ThemeToggle />
+            <ThemeToggle label={dictionary.themeLabel} />
             <form action={logout}>
               <button
                 className="icon-button focus-ring"
                 title={user.email ?? undefined}
                 aria-label={dictionary.signOutLabel}
                 type="submit"
               >
                 {(user.name ?? "U").slice(0, 1).toUpperCase()}
               </button>
             </form>
diff --git a/src/components/theme-toggle.tsx b/src/components/theme-toggle.tsx
index 9a96192..63fa046 100644
--- a/src/components/theme-toggle.tsx
+++ b/src/components/theme-toggle.tsx
@@ -1,30 +1,30 @@
 "use client";
 
 import { useEffect } from "react";
 
-export function ThemeToggle() {
+export function ThemeToggle({ label }: { label: string }) {
   useEffect(() => {
     const enabled =
       localStorage.getItem("atlas-theme") === "dark" ||
       (!localStorage.getItem("atlas-theme") &&
         matchMedia("(prefers-color-scheme: dark)").matches);
     document.documentElement.classList.toggle("dark", enabled);
   }, []);
 
   function toggleTheme() {
     const next = !document.documentElement.classList.contains("dark");
     document.documentElement.classList.toggle("dark", next);
     localStorage.setItem("atlas-theme", next ? "dark" : "light");
   }
 
   return (
     <button
       type="button"
       className="icon-button focus-ring"
-      aria-label="Toggle color theme"
+      aria-label={label}
       onClick={toggleTheme}
     >
       T
     </button>
   );
 }
diff --git a/src/i18n/dictionaries.test.ts b/src/i18n/dictionaries.test.ts
index 930afb0..9e91a7b 100644
--- a/src/i18n/dictionaries.test.ts
+++ b/src/i18n/dictionaries.test.ts
@@ -24,18 +24,22 @@ describe("locale dictionaries", () => {
   });
 
   it("provides Chinese search labels and shell accessibility text", () => {
     const dictionary = getDictionary("zh");
 
     expect(dictionary.search.table.type).toBe("\u7c7b\u578b");
     expect(dictionary.search.entities.customer).toBe("\u5ba2\u6237");
     expect(dictionary.search.entities.order).toBe("\u8ba2\u5355");
     expect(dictionary.search.entities.quote).toBe("\u62a5\u4ef7");
     expect(dictionary.signOutLabel).toBe("\u9000\u51fa\u767b\u5f55");
+    expect(dictionary.themeLabel).toBe("\u5207\u6362\u989c\u8272\u4e3b\u9898");
+    expect(dictionary.dashboard.metricsLabel).toBe(
+      "\u4e1a\u52a1\u6307\u6807",
+    );
   });
 
   it("keeps English punctuation readable", () => {
     expect(getDictionary("en").search.placeholder).toBe(
       "Search customers, orders, quotes\u2026",
     );
   });
 });
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index 43be60b..adbcb89 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -1,19 +1,20 @@
 export const locales = ["en", "zh"] as const;
 export type Locale = (typeof locales)[number];
 
 const dictionaries = {
   en: {
     appName: "Atlas CRM",
     languageName: "English",
     languageSwitch: "Switch language",
     signOutLabel: "Sign out",
+    themeLabel: "Toggle color theme",
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
@@ -26,20 +27,21 @@ const dictionaries = {
         reference: "Reference",
         statusCountry: "Status / Country",
       },
       entities: {
         customer: "Customer",
         order: "Order",
         quote: "Quote",
       },
     },
     dashboard: {
+      metricsLabel: "Business metrics",
       title: "Good to see you",
       subtitle: "Here is the current operating picture.",
       customers: "Active customers",
       quotes: "Open quotations",
       orders: "Orders in progress",
       tasks: "Tasks due",
       recent: "Recently added customers",
       empty: "No customers have been added yet.",
       table: {
         company: "Company",
@@ -85,20 +87,21 @@ const dictionaries = {
       heroTitle: "Trade operations, without the blind spots.",
       heroText:
         "Bring customer context, commercial decisions and fulfillment progress into one trusted workspace.",
     },
   },
   zh: {
     appName: "Atlas \u5916\u8d38 CRM",
     languageName: "\u4e2d\u6587",
     languageSwitch: "\u5207\u6362\u8bed\u8a00",
     signOutLabel: "\u9000\u51fa\u767b\u5f55",
+    themeLabel: "\u5207\u6362\u989c\u8272\u4e3b\u9898",
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
@@ -113,20 +116,21 @@ const dictionaries = {
         reference: "\u53c2\u8003\u53f7",
         statusCountry: "\u72b6\u6001 / \u56fd\u5bb6\u5730\u533a",
       },
       entities: {
         customer: "\u5ba2\u6237",
         order: "\u8ba2\u5355",
         quote: "\u62a5\u4ef7",
       },
     },
     dashboard: {
+      metricsLabel: "\u4e1a\u52a1\u6307\u6807",
       title: "\u6b22\u8fce\u56de\u6765",
       subtitle:
         "\u8fd9\u662f\u5f53\u524d\u4e1a\u52a1\u8fd0\u8425\u6982\u89c8\u3002",
       customers: "\u6d3b\u8dc3\u5ba2\u6237",
       quotes: "\u8fdb\u884c\u4e2d\u62a5\u4ef7",
       orders: "\u5c65\u7ea6\u4e2d\u8ba2\u5355",
       tasks: "\u5f85\u529e\u4efb\u52a1",
       recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
       empty: "\u6682\u65f6\u8fd8\u6ca1\u6709\u5ba2\u6237\u6570\u636e\u3002",
       table: {
diff --git a/src/modules/dashboard/dashboard-scope.test.ts b/src/modules/dashboard/dashboard-scope.test.ts
new file mode 100644
index 0000000..77eae35
--- /dev/null
+++ b/src/modules/dashboard/dashboard-scope.test.ts
@@ -0,0 +1,35 @@
+import { describe, expect, it } from "vitest";
+
+import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
+
+describe("dashboard ownership scope", () => {
+  it("limits Sales Representative metrics and identities to owned records", () => {
+    expect(
+      dashboardOwnershipFilter({
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toEqual({ ownerId: "sales-1" });
+  });
+
+  it("keeps Sales Manager metrics broad", () => {
+    expect(
+      dashboardOwnershipFilter({
+        userId: "manager-1",
+        roles: ["SALES_MANAGER"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toEqual({});
+  });
+
+  it("keeps wildcard administrator metrics broad", () => {
+    expect(
+      dashboardOwnershipFilter({
+        userId: "admin-1",
+        roles: ["SUPER_ADMIN"],
+        permissions: ["*"],
+      }),
+    ).toEqual({});
+  });
+});
diff --git a/src/modules/dashboard/dashboard-scope.ts b/src/modules/dashboard/dashboard-scope.ts
new file mode 100644
index 0000000..81a7f44
--- /dev/null
+++ b/src/modules/dashboard/dashboard-scope.ts
@@ -0,0 +1,6 @@
+import type { AuthorizationContext } from "@/lib/rbac";
+import { searchOwnershipFilter } from "@/modules/search/search-scope";
+
+export function dashboardOwnershipFilter(context: AuthorizationContext) {
+  return searchOwnershipFilter(context);
+}
diff --git a/src/modules/dashboard/dashboard-service.test.ts b/src/modules/dashboard/dashboard-service.test.ts
new file mode 100644
index 0000000..10f1cb6
--- /dev/null
+++ b/src/modules/dashboard/dashboard-service.test.ts
@@ -0,0 +1,36 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  loadDashboard,
+  type DashboardRepository,
+  type DashboardSnapshot,
+} from "@/modules/dashboard/dashboard-service";
+import type { AuthorizationContext } from "@/lib/rbac";
+
+const snapshot: DashboardSnapshot = {
+  activeCustomers: 2,
+  openQuotes: 3,
+  activeOrders: 4,
+  dueTasks: 1,
+  recentCustomers: [],
+};
+
+describe("dashboard service", () => {
+  it("passes the complete authorization context to the repository", async () => {
+    const contexts: AuthorizationContext[] = [];
+    const repository: DashboardRepository = {
+      loadSnapshot: async (context) => {
+        contexts.push(context);
+        return snapshot;
+      },
+    };
+    const context: AuthorizationContext = {
+      userId: "sales-1",
+      roles: ["SALES_REP"],
+      permissions: ["dashboard.read", "customer.read"],
+    };
+
+    await expect(loadDashboard(repository, context)).resolves.toBe(snapshot);
+    expect(contexts).toEqual([context]);
+  });
+});
diff --git a/src/modules/dashboard/dashboard-service.ts b/src/modules/dashboard/dashboard-service.ts
index 0ec553a..c712aeb 100644
--- a/src/modules/dashboard/dashboard-service.ts
+++ b/src/modules/dashboard/dashboard-service.ts
@@ -5,19 +5,20 @@ export interface DashboardSnapshot {
   dueTasks: number;
   recentCustomers: Array<{
     id: string;
     companyName: string;
     countryCode: string;
     createdAt: Date;
   }>;
 }
 
 export interface DashboardRepository {
-  loadSnapshot(userId: string): Promise<DashboardSnapshot>;
+  loadSnapshot(context: AuthorizationContext): Promise<DashboardSnapshot>;
 }
 
 export function loadDashboard(
   repository: DashboardRepository,
-  userId: string,
+  context: AuthorizationContext,
 ) {
-  return repository.loadSnapshot(userId);
+  return repository.loadSnapshot(context);
 }
+import type { AuthorizationContext } from "@/lib/rbac";
diff --git a/src/modules/dashboard/prisma-dashboard-repository.ts b/src/modules/dashboard/prisma-dashboard-repository.ts
index 3c7d154..3a82ea4 100644
--- a/src/modules/dashboard/prisma-dashboard-repository.ts
+++ b/src/modules/dashboard/prisma-dashboard-repository.ts
@@ -1,46 +1,50 @@
 import { getPrisma } from "@/lib/prisma";
 import type {
   DashboardRepository,
   DashboardSnapshot,
 } from "@/modules/dashboard/dashboard-service";
+import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
 
 export class PrismaDashboardRepository implements DashboardRepository {
-  async loadSnapshot(userId: string): Promise<DashboardSnapshot> {
+  async loadSnapshot(context: Parameters<DashboardRepository["loadSnapshot"]>[0]): Promise<DashboardSnapshot> {
     const prisma = getPrisma();
+    const ownership = dashboardOwnershipFilter(context);
     const [activeCustomers, openQuotes, activeOrders, dueTasks, recentCustomers] =
       await prisma.$transaction([
         prisma.customer.count({
-          where: { status: "ACTIVE", deletedAt: null },
+          where: { status: "ACTIVE", deletedAt: null, ...ownership },
         }),
         prisma.quote.count({
           where: {
             status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
             deletedAt: null,
+            ...ownership,
           },
         }),
         prisma.salesOrder.count({
           where: {
             status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
             deletedAt: null,
+            ...ownership,
           },
         }),
         prisma.task.count({
           where: {
-            assigneeId: userId,
+            assigneeId: context.userId,
             status: { in: ["OPEN", "IN_PROGRESS"] },
             dueAt: { lte: new Date() },
             deletedAt: null,
           },
         }),
         prisma.customer.findMany({
-          where: { deletedAt: null },
+          where: { deletedAt: null, ...ownership },
           orderBy: { createdAt: "desc" },
           take: 5,
           select: {
             id: true,
             companyName: true,
             countryCode: true,
             createdAt: true,
           },
         }),
       ]);
