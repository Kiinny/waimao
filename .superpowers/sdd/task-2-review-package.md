# Commit list
b466523 docs: record sales CRM verification
cf9a122 feat: implement sales CRM workflows

# Stat
 .superpowers/sdd/task-2-report.md                  |  92 ++
 .../plans/2026-07-17-sales-crm-task-2.md           | 172 ++++
 .../20260717190000_sales_crm/migration.sql         |  56 ++
 prisma/schema.prisma                               |  22 +
 prisma/seed.ts                                     | 189 ++++-
 src/app/[locale]/(app)/customers/[id]/page.tsx     |  71 ++
 src/app/[locale]/(app)/customers/page.tsx          |  76 ++
 src/app/[locale]/(app)/dashboard/page.tsx          |  94 ++-
 src/app/[locale]/(app)/leads/[id]/page.tsx         | 114 +++
 src/app/[locale]/(app)/leads/page.tsx              | 132 +++
 src/app/[locale]/(app)/opportunities/page.tsx      |  62 ++
 .../customers/[id]/contacts/[contactId]/route.ts   |  42 +
 src/app/api/customers/[id]/contacts/route.ts       |  28 +
 src/app/api/customers/[id]/route.ts                |  46 +
 src/app/api/customers/route.ts                     |  37 +
 src/app/api/follow-ups/[id]/route.ts               |  41 +
 src/app/api/follow-ups/route.ts                    |  44 +
 src/app/api/leads/[id]/convert/route.ts            |  30 +
 src/app/api/leads/[id]/route.ts                    |  44 +
 src/app/api/leads/batch/route.ts                   |  23 +
 src/app/api/leads/export/route.ts                  |  53 ++
 src/app/api/leads/import/route.ts                  |  31 +
 src/app/api/leads/route.ts                         |  37 +
 src/app/api/opportunities/[id]/stage/route.ts      |  31 +
 src/app/api/opportunities/route.ts                 |  37 +
 src/app/globals.css                                | 362 +++++++-
 src/components/app-shell.tsx                       |   3 +
 src/components/crm/api-mutation-form.tsx           |  93 +++
 src/components/crm/lead-csv-import.tsx             |  80 ++
 src/components/crm/lead-table.tsx                  | 122 +++
 src/components/crm/opportunity-board.tsx           |  97 +++
 src/i18n/dictionaries.ts                           | 112 +++
 src/modules/crm/crm-domain.test.ts                 | 213 +++++
 src/modules/crm/crm-domain.ts                      | 168 ++++
 src/modules/crm/crm-schemas.test.ts                |  25 +
 src/modules/crm/crm-schemas.ts                     | 168 ++++
 src/modules/crm/crm-service.test.ts                | 172 ++++
 src/modules/crm/crm-service.ts                     | 120 +++
 src/modules/crm/csv.test.ts                        |  59 ++
 src/modules/crm/csv.ts                             | 134 +++
 src/modules/crm/prisma-crm-repository.ts           | 922 +++++++++++++++++++++
 src/modules/dashboard/dashboard-service.test.ts    |  53 ++
 src/modules/dashboard/dashboard-service.ts         |  53 ++
 .../dashboard/prisma-dashboard-repository.ts       | 190 ++++-
 44 files changed, 4706 insertions(+), 44 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
new file mode 100644
index 0000000..60dec98
--- /dev/null
+++ b/.superpowers/sdd/task-2-report.md
@@ -0,0 +1,92 @@
+# Task 2 Report: Sales CRM
+
+## Status
+
+`DONE_WITH_CONCERNS`
+
+The coherent Sales CRM scope is implemented, verified, and committed. Core server, repository, transaction, UI, validation, audit, i18n, RBAC, migration, and deterministic seed work is complete. The concerns are environment/test-surface limitations listed below rather than known failures in the verified checks.
+
+## Commits
+
+- `cf9a122` — `feat: implement sales CRM workflows`
+- This report is committed separately so it can name the implementation commit exactly.
+
+## Delivered Features
+
+- Repository-backed, role-scoped dashboard with sales/operational KPI selection, sales funnel, monthly order trend, lead sources, upcoming follow-ups, recent leads/orders, and risk reminders.
+- Leads:
+  - Scoped pagination, fuzzy search, country/source/status/owner/date filters.
+  - Create, edit, detail, duplicate detection, follow-up timeline, and loading/success/failure UI feedback.
+  - Confirmed batch status API/UI and scoped batch owner-assignment API.
+  - Transactional conversion to Customer, primary Contact, and Opportunity with audit.
+  - CSV parse, preview, row validation, explicit commit, and scoped/filtered export.
+- Customers:
+  - Scoped list/create/edit/detail with status, level, risk rating, and risk notes.
+  - Detail navigation for overview, contacts, follow-ups, opportunities, quotations, orders, payments, shipments, after-sales, files, and activity.
+  - Empty tabs render accurate empty states; no synthetic later-domain rows are shown.
+- Contacts:
+  - Customer-scoped create/update/archive APIs and create UI.
+  - Database-backed one-active-primary constraint.
+  - Decision role, language, timezone, preferred channel, WhatsApp, and WeChat fields.
+- Follow-ups:
+  - Scoped list/create/update/archive APIs and timeline UI.
+  - Channel, outcome, next action/date, completion, attachment metadata, and Customer/Contact/Lead/Opportunity relationships.
+  - Overdue repository query and dashboard reminders.
+- Opportunities:
+  - Scoped list/create APIs, six-stage Kanban board, drag/drop mutation feedback, audited stage changes, required loss reason, won/lost timestamps, and weighted forecast.
+- Persistence:
+  - Prisma schema and SQL migration for CRM fields, indexes, foreign keys, primary-contact partial unique index, related-record check, and loss-reason check.
+  - Deterministic seed extended to 20 customers, 30 contacts, 40 leads, 20 opportunities, and 24 follow-ups.
+- Tests:
+  - Ownership and owner-filter override, duplicates, conversion delegation/transaction boundary, primary-contact rule, overdue logic, stage transitions, weighted forecast, CSV behavior, schema module evaluation, and dashboard KPI scoping.
+
+## Exact Verification Results
+
+Red/green evidence:
+
+- Initial `pnpm test src/modules/crm/crm-domain.test.ts src/modules/crm/crm-service.test.ts src/modules/crm/csv.test.ts`
+  - RED: 3 suites failed because the three production modules did not exist.
+  - GREEN: 3 files passed, 18 tests passed.
+- `pnpm test src/modules/dashboard/dashboard-service.test.ts`
+  - RED: 2 failures, `dashboardKpis is not a function`.
+  - GREEN: dashboard service tests passed after the minimal implementation.
+- `pnpm test src/modules/crm/crm-schemas.test.ts`
+  - RED: module import failed with `.omit() cannot be used on object schemas containing refinements`.
+  - GREEN: 1 file passed, 1 test passed after deriving update fields from the unrefined base schema.
+- `pnpm test src/modules/crm/crm-domain.test.ts`
+  - RED: 2 failures, `crmOwnerWhere is not a function`.
+  - GREEN: 1 file passed, 14 tests passed after enforcing representative scope over requested owner filters.
+
+Final fresh gate:
+
+- `pnpm test`
+  - Exit `0`; 17 test files passed; 77 tests passed; 0 failed.
+- `pnpm typecheck`
+  - Exit `0`; `tsc --noEmit` reported no errors.
+- `pnpm lint`
+  - Exit `0`; ESLint reported no errors or warnings.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`
+  - Exit `0`; Prisma Client 7.8.0 generated successfully.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`
+  - Exit `0`; Next.js 16.2.10 production build compiled, typechecked, collected page data, generated 29 routes/pages, and finalized successfully.
+- `git diff --cached --check`
+  - Exit `0` before the implementation commit.
+
+## Self-Review
+
+- Ownership is enforced twice: API permissions gate entry and repository predicates restrict identities/aggregates. Representative-supplied `ownerId` filters cannot replace the authenticated owner scope.
+- Foreign lead/opportunity/customer/contact identities return not found at repository boundaries; mutations re-read scoped records before writes.
+- Lead conversion uses one interactive Prisma transaction for Customer, primary Contact, Opportunity, Lead conversion fields, and audit.
+- Opportunity movement checks the current stage again before updating, records audit, and applies terminal probability/timestamps consistently.
+- Follow-ups reject missing relationships, foreign-owned relationships, and mixed-owner relationships.
+- Audit writes occur in the same transaction as their corresponding CRM mutation.
+- Detail tabs use real repository relations and accurate empty states.
+- All Task 2 files were staged explicitly; existing untracked task briefs, progress ledger, review packages, and the pre-existing master plan were not modified or committed.
+
+## Concerns
+
+- Playwright is not installed or configured in the foundation, and no browser runtime is available through the package scripts; representative E2E coverage was therefore not added or run.
+- A live PostgreSQL service was not available in this workspace. Prisma schema generation and production build were verified, but the new migration and deterministic seed were not applied against a running database.
+- The foundation has no shared Excel export service, so Task 2 delivers CSV import/export only.
+- The lead list exposes confirmed batch status changes in the UI. Owner reassignment is implemented and scoped in the API/repository, but the list UI does not yet provide a user picker.
+- Contact and follow-up update/archive operations are available through scoped APIs; the delivered detail UI emphasizes create/read workflows and does not expose every update/archive control.
diff --git a/docs/superpowers/plans/2026-07-17-sales-crm-task-2.md b/docs/superpowers/plans/2026-07-17-sales-crm-task-2.md
new file mode 100644
index 0000000..986dffa
--- /dev/null
+++ b/docs/superpowers/plans/2026-07-17-sales-crm-task-2.md
@@ -0,0 +1,172 @@
+# Sales CRM Task 2 Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
+
+**Goal:** Deliver a role-scoped sales CRM covering dashboard insights, leads, customers, contacts, follow-ups, opportunities, CSV exchange, and deterministic representative data.
+
+**Architecture:** Extend the existing Next.js/Prisma modular monolith with pure CRM domain rules, repository interfaces that always receive the authorization context, Prisma repositories that enforce ownership again at query and transaction boundaries, thin API routes, and server-rendered pages with small client mutation controls. Database constraints back application invariants where possible.
+
+**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 7/PostgreSQL, Zod 4, Vitest, CSS.
+
+## Global Constraints
+
+- Follow existing module, API, UI, validation, audit, i18n, repository, service, and RBAC patterns.
+- Use red-green TDD for every new domain behavior.
+- Sales Representatives can only read and mutate owned CRM records.
+- Every mutation is audited and important multi-record workflows are transactional.
+- Primary controls work and mutations expose loading, success, and failure states.
+- Do not add fake records to empty detail tabs.
+
+---
+
+### Task 1: CRM domain rules
+
+**Files:**
+- Create: `src/modules/crm/crm-domain.test.ts`
+- Create: `src/modules/crm/crm-domain.ts`
+
+**Interfaces:**
+- Produces: `assertOwned`, `findLeadDuplicates`, `assertPrimaryContactChange`, `isFollowUpOverdue`, `assertOpportunityTransition`, `weightedForecast`.
+
+- [ ] **Step 1: Write failing ownership, duplicate, contact, overdue, transition, and forecast tests**
+
+```ts
+expect(() => assertOwned(rep, { ownerId: "other" }, "lead.update")).toThrow();
+expect(findLeadDuplicates(candidate, rows)).toEqual(["lead-1"]);
+expect(() => assertPrimaryContactChange(true, ["contact-1"])).toThrow();
+expect(isFollowUpOverdue(row, now)).toBe(true);
+expect(() => assertOpportunityTransition("WON", "DISCOVERY")).toThrow();
+expect(weightedForecast([{ valueUsd: "100", probability: 30 }])).toBe("30.00");
+```
+
+- [ ] **Step 2: Run `pnpm test src/modules/crm/crm-domain.test.ts` and confirm missing-module failure**
+
+- [ ] **Step 3: Implement only the tested domain rules with `DomainError` failures**
+
+- [ ] **Step 4: Run the focused test and confirm all cases pass**
+
+### Task 2: Transactional service workflows and CSV
+
+**Files:**
+- Create: `src/modules/crm/crm-service.test.ts`
+- Create: `src/modules/crm/crm-service.ts`
+- Create: `src/modules/crm/csv.ts`
+- Create: `src/modules/crm/csv.test.ts`
+
+**Interfaces:**
+- Produces: `convertLead`, `moveOpportunity`, `previewLeadCsv`, `exportLeadCsv`.
+- Consumes: authorization-aware `CrmRepository` methods and Task 1 rules.
+
+- [ ] **Step 1: Write failing tests proving conversion delegates one repository transaction, preserves owner, and rejects foreign records**
+
+- [ ] **Step 2: Run the focused service test and confirm missing exports**
+
+- [ ] **Step 3: Implement minimal services and repository contracts**
+
+- [ ] **Step 4: Write failing CSV tests for quoted cells, validation errors, and filtered export**
+
+- [ ] **Step 5: Implement the parser, preview result, and escaping export; run both focused files**
+
+### Task 3: Persistence schema and Prisma repository
+
+**Files:**
+- Modify: `prisma/schema.prisma`
+- Create: `prisma/migrations/20260717190000_sales_crm/migration.sql`
+- Create: `src/modules/crm/prisma-crm-repository.ts`
+
+**Interfaces:**
+- Produces: scoped list/detail/create/update/batch/contact/follow-up/opportunity methods implementing `CrmRepository`.
+
+- [ ] **Step 1: Add customer level/risk, contact communication fields, follow-up relations/metadata, opportunity outcome fields, indexes, and one-primary-contact partial unique index**
+
+- [ ] **Step 2: Run `pnpm prisma:generate` and verify generated client succeeds**
+
+- [ ] **Step 3: Implement every read with a repository ownership predicate and every mutation with an ownership precondition and audit record**
+
+- [ ] **Step 4: Implement conversion using one Prisma interactive transaction**
+
+### Task 4: CRM APIs
+
+**Files:**
+- Create: `src/app/api/leads/route.ts`
+- Create: `src/app/api/leads/[id]/route.ts`
+- Create: `src/app/api/leads/[id]/convert/route.ts`
+- Create: `src/app/api/leads/batch/route.ts`
+- Create: `src/app/api/leads/import/route.ts`
+- Create: `src/app/api/leads/export/route.ts`
+- Create: `src/app/api/customers/route.ts`
+- Create: `src/app/api/customers/[id]/route.ts`
+- Create: `src/app/api/customers/[id]/contacts/route.ts`
+- Create: `src/app/api/follow-ups/route.ts`
+- Create: `src/app/api/opportunities/route.ts`
+- Create: `src/app/api/opportunities/[id]/stage/route.ts`
+
+**Interfaces:**
+- Consumes: current authorization context, RBAC, Zod schemas, CRM service/repository.
+- Produces: existing `{ success, data }` / `{ success: false, error }` contracts.
+
+- [ ] **Step 1: Define strict query/body schemas including pagination bounds and ISO dates**
+
+- [ ] **Step 2: Require the matching permission before repository access**
+
+- [ ] **Step 3: Return success envelopes and pass all failures through the shared handler**
+
+- [ ] **Step 4: Ensure CSV preview does not commit until an explicit `commit: true` request**
+
+### Task 5: Dashboard and CRM user interface
+
+**Files:**
+- Modify: `src/modules/dashboard/dashboard-service.ts`
+- Modify: `src/modules/dashboard/prisma-dashboard-repository.ts`
+- Modify: `src/modules/dashboard/dashboard-service.test.ts`
+- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
+- Modify: `src/components/app-shell.tsx`
+- Modify: `src/i18n/dictionaries.ts`
+- Modify: `src/app/globals.css`
+- Create: `src/components/crm/mutation-form.tsx`
+- Create: `src/components/crm/opportunity-board.tsx`
+- Create: `src/app/[locale]/(app)/leads/page.tsx`
+- Create: `src/app/[locale]/(app)/leads/[id]/page.tsx`
+- Create: `src/app/[locale]/(app)/customers/page.tsx`
+- Create: `src/app/[locale]/(app)/customers/[id]/page.tsx`
+- Create: `src/app/[locale]/(app)/opportunities/page.tsx`
+
+**Interfaces:**
+- Produces: repository-backed KPI/funnel/trend/source/follow-up/recent/risk UI and functional CRUD/conversion/stage controls.
+
+- [ ] **Step 1: Extend the dashboard snapshot test first and confirm the repository fixture no longer compiles**
+
+- [ ] **Step 2: Add scoped aggregate queries and render each required dashboard section**
+
+- [ ] **Step 3: Add navigation and list/detail pages with real filters, empty states, and accessible controls**
+
+- [ ] **Step 4: Add client mutation controls with disabled/loading text and inline success/failure feedback**
+
+- [ ] **Step 5: Add confirmation for batch changes and drag/drop opportunity movement**
+
+### Task 6: Deterministic representative data
+
+**Files:**
+- Modify: `prisma/seed.ts`
+
+**Interfaces:**
+- Produces: exactly 20 seeded customers, 30 contacts, 40 leads, 20 opportunities, and at least 20 follow-ups owned across sales users.
+
+- [ ] **Step 1: Extend the idempotent seed with fixed IDs, dates, stages, countries, sources, owners, and follow-up outcomes**
+
+- [ ] **Step 2: Confirm all new seed writes use upsert or deterministic delete/recreate operations**
+
+### Task 7: Verification and delivery
+
+**Files:**
+- Create: `.superpowers/sdd/task-2-report.md`
+
+- [ ] **Step 1: Run focused CRM and dashboard tests**
+
+- [ ] **Step 2: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`**
+
+- [ ] **Step 3: Review every changed line for ownership, transaction, audit, scope, and false-data risks**
+
+- [ ] **Step 4: Record exact command results, deliverables, self-review, and concerns in the report**
+
+- [ ] **Step 5: Commit only Task 2 implementation and report files**
diff --git a/prisma/migrations/20260717190000_sales_crm/migration.sql b/prisma/migrations/20260717190000_sales_crm/migration.sql
new file mode 100644
index 0000000..4724bb3
--- /dev/null
+++ b/prisma/migrations/20260717190000_sales_crm/migration.sql
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
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 14054ee..2d07c42 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -225,53 +225,61 @@ model Customer {
   companyName     String
   legalName       String?
   countryCode     String
   website         String?
   email           String?
   phone           String?
   taxId           String?
   billingAddress  Json?
   shippingAddress Json?
   status          RecordStatus       @default(ACTIVE)
+  level           String             @default("STANDARD")
+  riskRating      String             @default("LOW")
+  riskNotes       String?
   ownerId         String             @db.Uuid
   version         Int                @default(1)
   createdAt       DateTime           @default(now())
   updatedAt       DateTime           @updatedAt
   deletedAt       DateTime?
   owner           User               @relation("CustomerOwner", fields: [ownerId], references: [id])
   contacts        Contact[]
+  followUps       FollowUp[]
   opportunities   Opportunity[]
   quotes          Quote[]
   orders          SalesOrder[]
   tickets         AfterSalesTicket[]
 
   @@index([ownerId, status, deletedAt])
   @@index([countryCode])
 }
 
 model Contact {
   id           String    @id @default(uuid()) @db.Uuid
   customerId   String    @db.Uuid
   firstName    String
   lastName     String
   title        String?
   email        String?
   phone        String?
+  whatsapp     String?
+  wechat       String?
+  preferredChannel String?
   isPrimary    Boolean   @default(false)
   language     String    @default("en")
   timezone     String?
   decisionRole String?
   version      Int       @default(1)
   createdAt    DateTime  @default(now())
   updatedAt    DateTime  @updatedAt
   deletedAt    DateTime?
   customer     Customer  @relation(fields: [customerId], references: [id])
+  followUps    FollowUp[]
 
   @@index([customerId, deletedAt])
   @@index([email])
 }
 
 model Lead {
   id                     String     @id @default(uuid()) @db.Uuid
   companyName            String
   contactName            String
   email                  String?
@@ -289,49 +297,63 @@ model Lead {
   deletedAt              DateTime?
   owner                  User       @relation("LeadOwner", fields: [ownerId], references: [id])
   followUps              FollowUp[]
 
   @@index([ownerId, status, deletedAt])
   @@index([countryCode, source])
 }
 
 model FollowUp {
   id            String       @id @default(uuid()) @db.Uuid
+  customerId    String?      @db.Uuid
+  contactId     String?      @db.Uuid
   leadId        String?      @db.Uuid
   opportunityId String?      @db.Uuid
   type          String
+  channel       String
   summary       String
+  outcome       String?
+  nextAction    String?
   occurredAt    DateTime
   nextActionAt  DateTime?
+  completedAt   DateTime?
+  attachments   Json?
   createdById   String       @db.Uuid
   createdAt     DateTime     @default(now())
   updatedAt     DateTime     @updatedAt
   deletedAt     DateTime?
+  customer      Customer?    @relation(fields: [customerId], references: [id])
+  contact       Contact?     @relation(fields: [contactId], references: [id])
   lead          Lead?        @relation(fields: [leadId], references: [id])
   opportunity   Opportunity? @relation(fields: [opportunityId], references: [id])
 
   @@index([leadId, occurredAt])
   @@index([opportunityId, occurredAt])
+  @@index([customerId, occurredAt])
+  @@index([contactId, occurredAt])
   @@index([nextActionAt])
 }
 
 model Opportunity {
   id                String           @id @default(uuid()) @db.Uuid
   customerId        String           @db.Uuid
   name              String
   stage             OpportunityStage @default(QUALIFICATION)
   value             Decimal          @db.Decimal(19, 4)
   currencyCode      String
   exchangeRateToUsd Decimal          @db.Decimal(24, 12)
   valueUsd          Decimal          @db.Decimal(19, 4)
   probability       Int              @default(10)
   expectedCloseAt   DateTime?
+  lostReason        String?
+  wonAt             DateTime?
+  lostAt            DateTime?
   ownerId           String           @db.Uuid
   version           Int              @default(1)
   createdAt         DateTime         @default(now())
   updatedAt         DateTime         @updatedAt
   deletedAt         DateTime?
   customer          Customer         @relation(fields: [customerId], references: [id])
   owner             User             @relation("OpportunityOwner", fields: [ownerId], references: [id])
   followUps         FollowUp[]
   quotes            Quote[]
 
diff --git a/prisma/seed.ts b/prisma/seed.ts
index 2ba0b86..ec4a443 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -20,20 +20,23 @@ const permissions = [
   "role.read",
   "role.create",
   "role.update",
   "customer.read",
   "customer.create",
   "customer.update",
   "customer.delete",
   "lead.read",
   "lead.create",
   "lead.update",
+  "follow_up.read",
+  "follow_up.create",
+  "follow_up.update",
   "opportunity.read",
   "opportunity.create",
   "opportunity.update",
   "product.read",
   "product.create",
   "product.update",
   "quote.read",
   "quote.create",
   "quote.update",
   "quote.approve",
@@ -73,32 +76,32 @@ const roleDefinitions = [
     name: "Super Admin",
     description: "Complete system access",
     permissions: ["*"],
   },
   {
     code: "SALES_MANAGER",
     name: "Sales Manager",
     description: "Sales team and commercial workflow management",
     permissions: permissions.filter(
       (code) =>
-        /^(dashboard|customer|lead|opportunity|product|quote|order|task|report)\./.test(
+        /^(dashboard|customer|lead|follow_up|opportunity|product|quote|order|task|report)\./.test(
           code,
         ) && code !== "finance.profit.read",
     ),
   },
   {
     code: "SALES_REP",
     name: "Sales Representative",
     description: "Owned sales accounts and transactions",
     permissions: permissions.filter(
       (code) =>
-        /^(dashboard|customer|lead|opportunity|product|quote|order|task)\./.test(
+        /^(dashboard|customer|lead|follow_up|opportunity|product|quote|order|task)\./.test(
           code,
         ) && !code.endsWith(".delete"),
     ),
   },
   {
     code: "FINANCE",
     name: "Finance",
     description: "Payments, refunds, costs and financial reporting",
     permissions: permissions.filter(
       (code) =>
@@ -277,19 +280,201 @@ async function main() {
     await prisma.sequence.upsert({
       where: { key },
       update: {},
       create: {
         id: deterministicId(5, index + 1),
         key,
         prefix: key.toUpperCase().replaceAll("_", "-"),
       },
     });
   }
+
+  const salesOwnerIds = [deterministicId(3, 3), deterministicId(3, 4)];
+  const countries = ["US", "DE", "GB", "FR", "AE", "SG", "JP", "AU", "CA", "NL"];
+  const companyRoots = [
+    "Northstar Systems",
+    "Helios Compute",
+    "Vertex Datacenter",
+    "BluePeak Networks",
+    "Orion Research",
+    "Summit Cloud",
+    "NovaGrid",
+    "Cobalt Infrastructure",
+    "Apex Analytics",
+    "Meridian Hosting",
+    "Quantum Harbor",
+    "Redwood AI",
+    "IronGate Servers",
+    "PolarStack",
+    "Silverline Labs",
+    "Atlas Edge",
+    "Nimbus Robotics",
+    "Keystone Digital",
+    "Lighthouse HPC",
+    "Evergreen Compute",
+  ];
+
+  for (let index = 0; index < 20; index += 1) {
+    const customerId = deterministicId(10, index + 1);
+    await prisma.customer.upsert({
+      where: { id: customerId },
+      update: {
+        companyName: companyRoots[index],
+        countryCode: countries[index % countries.length],
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        status: "ACTIVE",
+        level: index % 5 === 0 ? "STRATEGIC" : index % 3 === 0 ? "KEY" : "STANDARD",
+        riskRating: index % 9 === 0 ? "HIGH" : index % 4 === 0 ? "MEDIUM" : "LOW",
+        deletedAt: null,
+      },
+      create: {
+        id: customerId,
+        companyName: companyRoots[index],
+        legalName: `${companyRoots[index]} Ltd.`,
+        countryCode: countries[index % countries.length],
+        website: `https://customer-${index + 1}.example`,
+        email: `procurement${index + 1}@example.test`,
+        phone: `+1-555-${(1000 + index).toString()}`,
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        level: index % 5 === 0 ? "STRATEGIC" : index % 3 === 0 ? "KEY" : "STANDARD",
+        riskRating: index % 9 === 0 ? "HIGH" : index % 4 === 0 ? "MEDIUM" : "LOW",
+        riskNotes: index % 9 === 0 ? "Credit review required before new commercial terms." : null,
+      },
+    });
+  }
+
+  for (let index = 0; index < 30; index += 1) {
+    const customerIndex = index % 20;
+    const contactId = deterministicId(11, index + 1);
+    await prisma.contact.upsert({
+      where: { id: contactId },
+      update: {
+        customerId: deterministicId(10, customerIndex + 1),
+        firstName: ["Maya", "Oliver", "Amina", "Kenji", "Sofia"][index % 5],
+        lastName: `Buyer ${index + 1}`,
+        isPrimary: index < 20,
+        deletedAt: null,
+      },
+      create: {
+        id: contactId,
+        customerId: deterministicId(10, customerIndex + 1),
+        firstName: ["Maya", "Oliver", "Amina", "Kenji", "Sofia"][index % 5],
+        lastName: `Buyer ${index + 1}`,
+        title: index % 3 === 0 ? "IT Director" : "Procurement Manager",
+        email: `contact${index + 1}@example.test`,
+        phone: `+44-20-${(7000 + index).toString()}`,
+        whatsapp: index % 2 === 0 ? `+44-20-${(7000 + index).toString()}` : null,
+        preferredChannel: index % 2 === 0 ? "WHATSAPP" : "EMAIL",
+        isPrimary: index < 20,
+        language: index % 4 === 0 ? "zh" : "en",
+        timezone: ["America/New_York", "Europe/Berlin", "Asia/Singapore"][index % 3],
+        decisionRole: index < 20 ? "DECISION_MAKER" : "TECHNICAL",
+      },
+    });
+  }
+
+  const leadSources = ["Referral", "Trade Show", "Website", "Partner", "Outbound"];
+  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST"] as const;
+  for (let index = 0; index < 40; index += 1) {
+    const leadId = deterministicId(12, index + 1);
+    await prisma.lead.upsert({
+      where: { id: leadId },
+      update: {
+        companyName: `Prospect ${String(index + 1).padStart(2, "0")} Technologies`,
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        status: leadStatuses[index % leadStatuses.length],
+        deletedAt: null,
+      },
+      create: {
+        id: leadId,
+        companyName: `Prospect ${String(index + 1).padStart(2, "0")} Technologies`,
+        contactName: `Lead Contact ${index + 1}`,
+        email: `lead${index + 1}@prospect.example`,
+        phone: `+86-21-${(8000 + index).toString()}`,
+        countryCode: countries[index % countries.length],
+        source: leadSources[index % leadSources.length],
+        status: leadStatuses[index % leadStatuses.length],
+        notes: index % 4 === 0 ? "Interested in refurbished GPU server availability." : "Evaluating AI server configurations.",
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        createdAt: new Date(Date.UTC(2026, 5, (index % 28) + 1)),
+      },
+    });
+  }
+
+  const stages = ["QUALIFICATION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
+  for (let index = 0; index < 20; index += 1) {
+    const opportunityId = deterministicId(13, index + 1);
+    const stage = stages[index % stages.length];
+    const value = String(25_000 + index * 7_500);
+    await prisma.opportunity.upsert({
+      where: { id: opportunityId },
+      update: {
+        stage,
+        value,
+        valueUsd: value,
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        lostReason: stage === "LOST" ? "Project funding deferred" : null,
+        wonAt: stage === "WON" ? new Date(Date.UTC(2026, 6, 1)) : null,
+        lostAt: stage === "LOST" ? new Date(Date.UTC(2026, 6, 2)) : null,
+        deletedAt: null,
+      },
+      create: {
+        id: opportunityId,
+        customerId: deterministicId(10, index + 1),
+        name: `${companyRoots[index]} GPU infrastructure`,
+        stage,
+        value,
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        valueUsd: value,
+        probability: stage === "WON" ? 100 : stage === "LOST" ? 0 : 10 + (index % 4) * 20,
+        expectedCloseAt: new Date(Date.UTC(2026, 7 + (index % 4), 15)),
+        lostReason: stage === "LOST" ? "Project funding deferred" : null,
+        wonAt: stage === "WON" ? new Date(Date.UTC(2026, 6, 1)) : null,
+        lostAt: stage === "LOST" ? new Date(Date.UTC(2026, 6, 2)) : null,
+        ownerId: salesOwnerIds[index % salesOwnerIds.length],
+        createdAt: new Date(Date.UTC(2026, 4 + (index % 3), (index % 28) + 1)),
+      },
+    });
+  }
+
+  for (let index = 0; index < 24; index += 1) {
+    const followUpId = deterministicId(14, index + 1);
+    const relatedToLead = index < 12;
+    const occurredAt = new Date(Date.UTC(2026, 6, (index % 16) + 1, 9));
+    const nextActionAt = new Date(Date.UTC(2026, 6, 18 + (index % 10), 9));
+    await prisma.followUp.upsert({
+      where: { id: followUpId },
+      update: {
+        summary: relatedToLead
+          ? "Confirmed requirements and qualification criteria."
+          : "Reviewed configuration, commercial terms, and next decision.",
+        nextActionAt,
+        deletedAt: null,
+      },
+      create: {
+        id: followUpId,
+        leadId: relatedToLead ? deterministicId(12, index + 1) : null,
+        opportunityId: relatedToLead ? null : deterministicId(13, index - 11),
+        customerId: relatedToLead ? null : deterministicId(10, index - 11),
+        type: index % 3 === 0 ? "MEETING" : "CALL",
+        channel: index % 3 === 0 ? "VIDEO" : "PHONE",
+        summary: relatedToLead
+          ? "Confirmed requirements and qualification criteria."
+          : "Reviewed configuration, commercial terms, and next decision.",
+        outcome: index % 4 === 0 ? "Technical review scheduled" : "Positive response",
+        nextAction: "Send the agreed configuration and confirm next meeting.",
+        occurredAt,
+        nextActionAt,
+        createdById: salesOwnerIds[index % salesOwnerIds.length],
+      },
+    });
+  }
 }
 
 main()
   .then(async () => prisma.$disconnect())
   .catch(async (error) => {
     console.error(error);
     await prisma.$disconnect();
     process.exit(1);
   });
diff --git a/src/app/[locale]/(app)/customers/[id]/page.tsx b/src/app/[locale]/(app)/customers/[id]/page.tsx
new file mode 100644
index 0000000..78e6e0a
--- /dev/null
+++ b/src/app/[locale]/(app)/customers/[id]/page.tsx
@@ -0,0 +1,71 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaCrmRepository();
+
+function Empty({ text }: { text: string }) {
+  return <EmptyState title={text} />;
+}
+
+export default async function CustomerDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "customer.read");
+  const customer = await repository.getCustomerDetail(context, id);
+  if (!customer) notFound();
+  const tabs = dictionary.crm.tabs;
+  const payments = customer.orders.flatMap((order) => order.payments);
+  const shipments = customer.orders.flatMap((order) => order.shipments);
+
+  return (
+    <>
+      <header className="page-heading">
+        <div><Link className="breadcrumb" href={`/${locale}/customers`}>← {dictionary.crm.customers.title}</Link><h1>{customer.companyName}</h1><p>{customer.countryCode} · {customer.owner.name}</p></div>
+        <div className="status-group"><span className="badge">{customer.status}</span><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></div>
+      </header>
+      <nav className="detail-tabs" aria-label="Customer details">
+        {Object.entries(tabs).map(([key, label]) => <a href={`#${key}`} key={key}>{label}</a>)}
+      </nav>
+      <section className="card detail-section" id="overview"><h2>{tabs.overview}</h2>
+        <dl className="detail-grid"><div><dt>Legal name</dt><dd>{customer.legalName || "—"}</dd></div><div><dt>Email</dt><dd>{customer.email || "—"}</dd></div><div><dt>Phone</dt><dd>{customer.phone || "—"}</dd></div><div><dt>Level</dt><dd>{customer.level}</dd></div><div><dt>Risk notes</dt><dd>{customer.riskNotes || "—"}</dd></div></dl>
+        <details><summary>{dictionary.crm.edit}</summary><ApiMutationForm endpoint={`/api/customers/${customer.id}`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} method="PATCH" submitLabel={dictionary.crm.save} successMessage={dictionary.crm.success}>
+          <label>Company<input defaultValue={customer.companyName} name="companyName" /></label><label>Email<input defaultValue={customer.email ?? ""} name="email" type="email" /></label>
+          <label>Level<select defaultValue={customer.level} name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
+          <label>Risk<select defaultValue={customer.riskRating} name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
+          <label>Risk notes<textarea defaultValue={customer.riskNotes ?? ""} name="riskNotes" rows={3} /></label>
+        </ApiMutationForm></details>
+      </section>
+      <section className="card detail-section" id="contacts"><h2>{tabs.contacts}</h2>
+        {customer.contacts.length ? <div className="record-grid">{customer.contacts.map((contact) => <article className="record-card" key={contact.id}><strong>{contact.firstName} {contact.lastName}</strong>{contact.isPrimary ? <span className="badge">Primary</span> : null}<span>{contact.decisionRole ?? contact.title ?? "Contact"}</span><span>{contact.email ?? contact.phone ?? "No channel"}</span><small>{contact.language} · {contact.timezone ?? "No timezone"}</small></article>)}</div> : <Empty text={dictionary.crm.empty} />}
+        <details><summary>Add contact</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
+          <label>First name<input name="firstName" required /></label><label>Last name<input name="lastName" /></label><label>Email<input name="email" type="email" /></label><label>Phone<input name="phone" /></label>
+          <label>Decision role<select name="decisionRole"><option value="">None</option><option>DECISION_MAKER</option><option>INFLUENCER</option><option>TECHNICAL</option><option>FINANCE</option><option>USER</option></select></label>
+          <label>Language<input defaultValue="en" name="language" /></label><label>Timezone<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> Primary contact</label>
+        </ApiMutationForm></details>
+      </section>
+      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{item.type} · {item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{item.stage}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="quotations"><h2>{tabs.quotations}</h2>{customer.quotes.length ? <div className="record-grid">{customer.quotes.map((item) => <article className="record-card" key={item.id}><strong>{item.quoteNumber}</strong><span>{item.status}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="orders"><h2>{tabs.orders}</h2>{customer.orders.length ? <div className="record-grid">{customer.orders.map((item) => <article className="record-card" key={item.id}><strong>{item.orderNumber}</strong><span>{item.status}</span><span>${item.totalUsd.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="payments"><h2>{tabs.payments}</h2>{payments.length ? <div className="record-grid">{payments.map((item) => <article className="record-card" key={item.id}><strong>{item.reference ?? item.id}</strong><span>{item.status}</span><span>{item.currencyCode} {item.amount.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? "No tracking"}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="afterSales"><h2>{tabs.afterSales}</h2>{customer.tickets.length ? <div className="record-grid">{customer.tickets.map((item) => <article className="record-card" key={item.id}><strong>{item.ticketNumber}</strong><span>{item.status}</span><span>{item.subject}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="files"><h2>{tabs.files}</h2>{customer.files.length ? <div className="record-grid">{customer.files.map((item) => <article className="record-card" key={item.id}><strong>{item.fileName}</strong><span>{item.contentType}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="activity"><h2>{tabs.activity}</h2>{customer.activity.length ? <ol className="timeline">{customer.activity.map((item) => <li key={item.id}><strong>{item.action}</strong><time>{item.createdAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/customers/page.tsx b/src/app/[locale]/(app)/customers/page.tsx
new file mode 100644
index 0000000..443545a
--- /dev/null
+++ b/src/app/[locale]/(app)/customers/page.tsx
@@ -0,0 +1,76 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaCrmRepository();
+
+function value(input: string | string[] | undefined) {
+  return typeof input === "string" ? input : undefined;
+}
+
+export default async function CustomersPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<Record<string, string | string[] | undefined>>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "customer.read");
+  const query = await searchParams;
+  const result = await repository.listCustomers(context, {
+    page: Number(value(query.page) ?? 1),
+    query: value(query.query),
+    countryCode: value(query.countryCode),
+    status: value(query.status),
+    level: value(query.level),
+    riskRating: value(query.riskRating),
+  });
+
+  return (
+    <>
+      <header className="page-heading"><div><h1>{dictionary.crm.customers.title}</h1><p>{dictionary.crm.customers.subtitle}</p></div></header>
+      <form className="card filter-bar" method="get">
+        <input defaultValue={value(query.query)} name="query" placeholder="Company, legal name, email" />
+        <input defaultValue={value(query.countryCode)} maxLength={2} name="countryCode" placeholder="Country" />
+        <select defaultValue={value(query.status) ?? ""} name="status"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select>
+        <select defaultValue={value(query.level) ?? ""} name="level"><option value="">All levels</option><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select>
+        <select defaultValue={value(query.riskRating) ?? ""} name="riskRating"><option value="">All risk</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
+        <button className="button" type="submit">{dictionary.crm.search}</button>
+      </form>
+      <section className="card section-card">
+        <h2 className="section-title">{result.total} customers</h2>
+        {result.items.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Country</th><th>Status</th><th>Level</th><th>Risk</th><th>Owner</th><th>Contacts</th><th>Opportunities</th></tr></thead><tbody>
+          {result.items.map((customer) => <tr key={customer.id}>
+            <td><Link className="table-link" href={`/${locale}/customers/${customer.id}`}>{customer.companyName}</Link></td>
+            <td>{customer.countryCode}</td><td><span className="badge">{customer.status}</span></td><td>{customer.level}</td>
+            <td><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></td>
+            <td>{customer.owner.name}</td><td>{customer._count.contacts}</td><td>{customer._count.opportunities}</td>
+          </tr>)}
+        </tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
+      </section>
+      <details className="card section-card">
+        <summary>{dictionary.crm.customers.new}</summary>
+        <ApiMutationForm endpoint="/api/customers" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
+          <label>Company<input name="companyName" required /></label>
+          <label>Legal name<input name="legalName" /></label>
+          <label>Country<input maxLength={2} name="countryCode" required /></label>
+          <label>Email<input name="email" type="email" /></label>
+          <label>Phone<input name="phone" /></label>
+          <label>Level<select name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
+          <label>Risk<select name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
+        </ApiMutationForm>
+      </details>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/dashboard/page.tsx b/src/app/[locale]/(app)/dashboard/page.tsx
index 6652367..3d94fdc 100644
--- a/src/app/[locale]/(app)/dashboard/page.tsx
+++ b/src/app/[locale]/(app)/dashboard/page.tsx
@@ -1,99 +1,113 @@
 import { notFound } from "next/navigation";
 
 import { auth } from "@/auth";
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
-import { loadDashboard } from "@/modules/dashboard/dashboard-service";
+import { dashboardKpis, loadDashboard } from "@/modules/dashboard/dashboard-service";
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
   const context = await currentAuthorizationContext();
   const dictionary = getDictionary(locale);
   const snapshot = await loadDashboard(
     new PrismaDashboardRepository(),
     context,
   );
-  const metrics = [
-    [dictionary.dashboard.customers, snapshot.activeCustomers],
-    [dictionary.dashboard.quotes, snapshot.openQuotes],
-    [dictionary.dashboard.orders, snapshot.activeOrders],
-    [dictionary.dashboard.tasks, snapshot.dueTasks],
-  ] as const;
+  const metricLabels = {
+    activeCustomers: dictionary.dashboard.customers,
+    openLeads: dictionary.dashboard.openLeads,
+    pipelineValueUsd: dictionary.dashboard.pipelineValueUsd,
+    weightedForecastUsd: dictionary.dashboard.weightedForecastUsd,
+    openQuotes: dictionary.dashboard.quotes,
+    activeOrders: dictionary.dashboard.orders,
+    dueTasks: dictionary.dashboard.tasks,
+  };
+  const metrics = dashboardKpis(context, snapshot);
+  const maxFunnel = Math.max(1, ...snapshot.salesFunnel.map((item) => item.count));
+  const maxTrend = Math.max(
+    1,
+    ...snapshot.monthlyOrderTrend.map((item) => Number(item.valueUsd)),
+  );
 
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
       <section
         className="metrics"
         aria-label={dictionary.dashboard.metricsLabel}
       >
-        {metrics.map(([label, value]) => (
-          <article className="card metric" key={label}>
-            <div className="metric-label">{label}</div>
-            <div className="metric-value">{value.toLocaleString(locale)}</div>
+        {metrics.map(([key, value]) => (
+          <article className="card metric" key={key}>
+            <div className="metric-label">{metricLabels[key]}</div>
+            <div className="metric-value">
+              {typeof value === "string"
+                ? `$${Number(value).toLocaleString(locale)}`
+                : value.toLocaleString(locale)}
+            </div>
           </article>
         ))}
       </section>
-      <section className="card section-card">
-        <h2 className="section-title">{dictionary.dashboard.recent}</h2>
-        {snapshot.recentCustomers.length ? (
-          <div className="table-wrap">
-            <table>
-              <thead>
-                <tr>
-                  <th>{dictionary.dashboard.table.company}</th>
-                  <th>{dictionary.dashboard.table.country}</th>
-                  <th>{dictionary.dashboard.table.added}</th>
-                </tr>
-              </thead>
-              <tbody>
-                {snapshot.recentCustomers.map((customer) => (
-                  <tr key={customer.id}>
-                    <td>{customer.companyName}</td>
-                    <td>{customer.countryCode}</td>
-                    <td>{customer.createdAt.toLocaleDateString(locale)}</td>
-                  </tr>
-                ))}
-              </tbody>
-            </table>
-          </div>
-        ) : (
-          <EmptyState title={dictionary.dashboard.empty} />
-        )}
-      </section>
+      <div className="dashboard-grid">
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.funnel}</h2>
+          {snapshot.salesFunnel.length ? <div className="bar-chart">{snapshot.salesFunnel.map((item) => <div className="bar-row" key={item.stage}><span>{item.stage}</span><div><i style={{ width: `${Math.max(5, item.count / maxFunnel * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.orderTrend}</h2>
+          {snapshot.monthlyOrderTrend.length ? <div className="trend-chart">{snapshot.monthlyOrderTrend.map((item) => <div className="trend-column" key={item.month}><div style={{ height: `${Math.max(4, Number(item.valueUsd) / maxTrend * 120)}px` }} /><span>{item.month.slice(5)}</span><small>{item.count}</small></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.leadSources}</h2>
+          {snapshot.leadSources.length ? <ul className="distribution-list">{snapshot.leadSources.map((item) => <li key={item.source}><span>{item.source}</span><strong>{item.count}</strong></li>)}</ul> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.upcomingFollowUps}</h2>
+          {snapshot.upcomingFollowUps.length ? <ol className="timeline compact">{snapshot.upcomingFollowUps.map((item) => <li key={item.id}><strong>{item.related}</strong><p>{item.summary}</p><time>{item.nextActionAt.toLocaleString(locale)}</time></li>)}</ol> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+      </div>
+      <div className="dashboard-grid">
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.recentLeads}</h2>
+          {snapshot.recentLeads.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Status</th><th>Added</th></tr></thead><tbody>{snapshot.recentLeads.map((lead) => <tr key={lead.id}><td>{lead.companyName}</td><td>{lead.status}</td><td>{lead.createdAt.toLocaleDateString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.dashboard.recentOrders}</h2>
+          {snapshot.recentOrders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Status</th><th>USD</th></tr></thead><tbody>{snapshot.recentOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.status}</td><td>${Number(order.totalUsd).toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
+        </section>
+      </div>
       <section
         className="card section-card"
         id="notifications"
         aria-labelledby="notifications-title"
         tabIndex={-1}
       >
         <h2 className="section-title" id="notifications-title">
           {dictionary.dashboard.risks.title}
         </h2>
         <p className="muted">
-          {snapshot.dueTasks
-            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks}`
+          {snapshot.dueTasks || snapshot.risks.overdueFollowUps || snapshot.risks.highRiskCustomers || snapshot.risks.staleOpportunities
+            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks} ${snapshot.risks.overdueFollowUps} overdue follow-ups, ${snapshot.risks.highRiskCustomers} high-risk customers, and ${snapshot.risks.staleOpportunities} stale opportunities.`
             : dictionary.dashboard.risks.clear}
         </p>
       </section>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/leads/[id]/page.tsx b/src/app/[locale]/(app)/leads/[id]/page.tsx
new file mode 100644
index 0000000..cdab7bb
--- /dev/null
+++ b/src/app/[locale]/(app)/leads/[id]/page.tsx
@@ -0,0 +1,114 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaCrmRepository();
+
+export default async function LeadDetailPage({
+  params,
+}: {
+  params: Promise<{ locale: string; id: string }>;
+}) {
+  const { locale, id } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "lead.read");
+  const lead = await repository.getLeadDetail(context, id);
+  if (!lead) notFound();
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <Link className="breadcrumb" href={`/${locale}/leads`}>← {dictionary.crm.leads.title}</Link>
+          <h1>{lead.companyName}</h1>
+          <p>{lead.contactName} · {lead.countryCode} · {lead.owner.name}</p>
+        </div>
+        <span className="badge">{lead.status}</span>
+      </header>
+      <div className="two-column">
+        <section className="card section-card">
+          <h2 className="section-title">{dictionary.crm.edit}</h2>
+          <ApiMutationForm
+            endpoint={`/api/leads/${lead.id}`}
+            failureMessage={dictionary.crm.failed}
+            loadingLabel={dictionary.crm.loading}
+            method="PATCH"
+            submitLabel={dictionary.crm.save}
+            successMessage={dictionary.crm.success}
+          >
+            <label>Company<input defaultValue={lead.companyName} name="companyName" required /></label>
+            <label>Contact<input defaultValue={lead.contactName} name="contactName" required /></label>
+            <label>Email<input defaultValue={lead.email ?? ""} name="email" type="email" /></label>
+            <label>Phone<input defaultValue={lead.phone ?? ""} name="phone" /></label>
+            <label>Status<select defaultValue={lead.status} name="status">
+              {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((status) => <option key={status}>{status}</option>)}
+            </select></label>
+            <label>Notes<textarea defaultValue={lead.notes ?? ""} name="notes" rows={4} /></label>
+          </ApiMutationForm>
+        </section>
+        {lead.status !== "CONVERTED" ? (
+          <section className="card section-card">
+            <h2 className="section-title">{dictionary.crm.leads.convert}</h2>
+            <ApiMutationForm
+              endpoint={`/api/leads/${lead.id}/convert`}
+              failureMessage={dictionary.crm.failed}
+              loadingLabel={dictionary.crm.loading}
+              numericFields={["probability"]}
+              redirectTo={`/${locale}/customers`}
+              submitLabel={dictionary.crm.leads.convert}
+              successMessage={dictionary.crm.success}
+            >
+              <label>Opportunity name<input name="opportunityName" required /></label>
+              <label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
+              <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
+              <label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
+              <label>Probability<input defaultValue="10" max="100" min="0" name="probability" required type="number" /></label>
+            </ApiMutationForm>
+          </section>
+        ) : (
+          <section className="card section-card"><h2>Conversion</h2><p>Customer and opportunity were created in one transaction.</p></section>
+        )}
+      </div>
+      <section className="card section-card">
+        <h2 className="section-title">Follow-up timeline</h2>
+        <ApiMutationForm
+          dateFields={["occurredAt", "nextActionAt"]}
+          endpoint="/api/follow-ups"
+          failureMessage={dictionary.crm.failed}
+          loadingLabel={dictionary.crm.loading}
+          submitLabel="Add follow-up"
+          successMessage={dictionary.crm.success}
+        >
+          <input name="leadId" type="hidden" value={lead.id} />
+          <label>Type<select name="type"><option>CALL</option><option>EMAIL</option><option>MEETING</option><option>NOTE</option></select></label>
+          <label>Channel<select name="channel"><option>PHONE</option><option>EMAIL</option><option>VIDEO</option><option>WHATSAPP</option><option>WECHAT</option></select></label>
+          <label>Summary<textarea name="summary" required rows={3} /></label>
+          <label>Outcome<input name="outcome" /></label>
+          <label>Occurred<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
+          <label>Next action<input name="nextAction" /></label>
+          <label>Next action date<input name="nextActionAt" type="datetime-local" /></label>
+        </ApiMutationForm>
+        {lead.followUps.length ? (
+          <ol className="timeline">
+            {lead.followUps.map((followUp) => (
+              <li key={followUp.id}>
+                <strong>{followUp.type} · {followUp.channel}</strong>
+                <p>{followUp.summary}</p>
+                <time>{followUp.occurredAt.toLocaleString(locale)}</time>
+              </li>
+            ))}
+          </ol>
+        ) : <EmptyState title={dictionary.crm.empty} />}
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/leads/page.tsx b/src/app/[locale]/(app)/leads/page.tsx
new file mode 100644
index 0000000..46e57fc
--- /dev/null
+++ b/src/app/[locale]/(app)/leads/page.tsx
@@ -0,0 +1,132 @@
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { LeadCsvImport } from "@/components/crm/lead-csv-import";
+import { LeadTable } from "@/components/crm/lead-table";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaCrmRepository();
+
+function value(input: string | string[] | undefined) {
+  return typeof input === "string" ? input : undefined;
+}
+
+export default async function LeadsPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<Record<string, string | string[] | undefined>>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "lead.read");
+  const query = await searchParams;
+  const filters = {
+    page: Number(value(query.page) ?? 1),
+    pageSize: 20,
+    query: value(query.query),
+    countryCode: value(query.countryCode),
+    source: value(query.source),
+    status: value(query.status),
+    createdFrom: value(query.createdFrom)
+      ? new Date(`${value(query.createdFrom)}T00:00:00.000Z`)
+      : undefined,
+    createdTo: value(query.createdTo)
+      ? new Date(`${value(query.createdTo)}T23:59:59.999Z`)
+      : undefined,
+  };
+  const result = await repository.listLeads(context, filters);
+  const exportQuery = new URLSearchParams();
+  for (const [key, raw] of Object.entries(query)) {
+    if (typeof raw === "string" && key !== "page") exportQuery.set(key, raw);
+  }
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>{dictionary.crm.leads.title}</h1>
+          <p>{dictionary.crm.leads.subtitle}</p>
+        </div>
+        <Link className="button button-secondary" href={`/api/leads/export?${exportQuery}`}>
+          {dictionary.crm.leads.export}
+        </Link>
+      </header>
+
+      <form className="card filter-bar" method="get">
+        <input defaultValue={filters.query} name="query" placeholder="Company, contact, email, phone" />
+        <input defaultValue={filters.countryCode} maxLength={2} name="countryCode" placeholder="Country" />
+        <input defaultValue={filters.source} name="source" placeholder="Source" />
+        <select defaultValue={filters.status ?? ""} name="status">
+          <option value="">All statuses</option>
+          <option value="NEW">New</option>
+          <option value="CONTACTED">Contacted</option>
+          <option value="QUALIFIED">Qualified</option>
+          <option value="CONVERTED">Converted</option>
+          <option value="LOST">Lost</option>
+        </select>
+        <input defaultValue={value(query.createdFrom)} name="createdFrom" type="date" />
+        <input defaultValue={value(query.createdTo)} name="createdTo" type="date" />
+        <button className="button" type="submit">{dictionary.crm.search}</button>
+      </form>
+
+      <section className="card section-card">
+        <div className="section-heading">
+          <h2 className="section-title">{result.total} leads</h2>
+          <span>Page {result.page} / {Math.max(1, result.pageCount)}</span>
+        </div>
+        <LeadTable
+          emptyText={dictionary.crm.empty}
+          leads={result.items.map((lead) => ({
+            id: lead.id,
+            companyName: lead.companyName,
+            contactName: lead.contactName,
+            countryCode: lead.countryCode,
+            source: lead.source,
+            status: lead.status,
+            ownerName: lead.owner.name,
+            createdAt: lead.createdAt.toISOString(),
+          }))}
+          locale={locale}
+        />
+        <div className="pagination">
+          {result.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page - 1) })}`}>Previous</Link> : <span />}
+          {result.page < result.pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page + 1) })}`}>Next</Link> : null}
+        </div>
+      </section>
+
+      <div className="two-column">
+        <details className="card section-card">
+          <summary>{dictionary.crm.leads.new}</summary>
+          <ApiMutationForm
+            endpoint="/api/leads"
+            failureMessage={dictionary.crm.failed}
+            loadingLabel={dictionary.crm.loading}
+            submitLabel={dictionary.crm.create}
+            successMessage={dictionary.crm.success}
+          >
+            <label>Company<input name="companyName" required /></label>
+            <label>Contact<input name="contactName" required /></label>
+            <label>Email<input name="email" type="email" /></label>
+            <label>Phone<input name="phone" /></label>
+            <label>Country<input maxLength={2} name="countryCode" required /></label>
+            <label>Source<input name="source" required /></label>
+            <label>Notes<textarea name="notes" rows={3} /></label>
+          </ApiMutationForm>
+        </details>
+        <details className="card section-card">
+          <summary>{dictionary.crm.leads.import}</summary>
+          <LeadCsvImport />
+        </details>
+      </div>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/opportunities/page.tsx b/src/app/[locale]/(app)/opportunities/page.tsx
new file mode 100644
index 0000000..b3c46fc
--- /dev/null
+++ b/src/app/[locale]/(app)/opportunities/page.tsx
@@ -0,0 +1,62 @@
+import { notFound } from "next/navigation";
+
+import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { OpportunityBoard } from "@/components/crm/opportunity-board";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { requirePermission } from "@/lib/rbac";
+import { weightedForecast } from "@/modules/crm/crm-domain";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+export const dynamic = "force-dynamic";
+const repository = new PrismaCrmRepository();
+
+export default async function OpportunitiesPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const context = await currentAuthorizationContext();
+  requirePermission(context, "opportunity.read");
+  const [result, customers] = await Promise.all([
+    repository.listOpportunities(context, { pageSize: 100 }),
+    repository.listCustomers(context, { pageSize: 100 }),
+  ]);
+  const forecast = weightedForecast(
+    result.items.map((item) => ({
+      valueUsd: item.valueUsd.toString(),
+      probability: item.probability,
+      stage: item.stage,
+    })),
+  );
+
+  return (
+    <>
+      <header className="page-heading">
+        <div><h1>{dictionary.crm.opportunities.title}</h1><p>{dictionary.crm.opportunities.subtitle}</p></div>
+        <article className="card forecast-card"><span>{dictionary.crm.opportunities.forecast}</span><strong>${Number(forecast).toLocaleString(locale)}</strong></article>
+      </header>
+      <OpportunityBoard opportunities={result.items.map((item) => ({
+        id: item.id,
+        name: item.name,
+        stage: item.stage,
+        valueUsd: item.valueUsd.toString(),
+        probability: item.probability,
+        customerName: item.customer.companyName,
+        ownerName: item.owner.name,
+      }))} />
+      <details className="card section-card">
+        <summary>{dictionary.crm.opportunities.new}</summary>
+        <ApiMutationForm dateFields={["expectedCloseAt"]} endpoint="/api/opportunities" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} numericFields={["probability"]} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
+          <label>Customer<select name="customerId" required><option value="">Select customer</option>{customers.items.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
+          <label>Name<input name="name" required /></label><label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
+          <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" /></label><label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
+          <label>Probability<input defaultValue="10" max="100" min="0" name="probability" type="number" /></label><label>Expected close<input name="expectedCloseAt" type="datetime-local" /></label>
+        </ApiMutationForm>
+      </details>
+    </>
+  );
+}
diff --git a/src/app/api/customers/[id]/contacts/[contactId]/route.ts b/src/app/api/customers/[id]/contacts/[contactId]/route.ts
new file mode 100644
index 0000000..2573d2a
--- /dev/null
+++ b/src/app/api/customers/[id]/contacts/[contactId]/route.ts
@@ -0,0 +1,42 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { updateContactSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string; contactId: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.update");
+    const { id, contactId } = await params;
+    return success(
+      await repository.updateContact(
+        context,
+        id,
+        contactId,
+        updateContactSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function DELETE(
+  _request: Request,
+  { params }: { params: Promise<{ id: string; contactId: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.update");
+    const { id, contactId } = await params;
+    return success(await repository.deleteContact(context, id, contactId));
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/customers/[id]/contacts/route.ts b/src/app/api/customers/[id]/contacts/route.ts
new file mode 100644
index 0000000..fa78dc0
--- /dev/null
+++ b/src/app/api/customers/[id]/contacts/route.ts
@@ -0,0 +1,28 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { contactSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.update");
+    const { id } = await params;
+    return success(
+      await repository.createContact(
+        context,
+        id,
+        contactSchema.parse(await request.json()),
+      ),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/customers/[id]/route.ts b/src/app/api/customers/[id]/route.ts
new file mode 100644
index 0000000..73875d1
--- /dev/null
+++ b/src/app/api/customers/[id]/route.ts
@@ -0,0 +1,46 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { updateCustomerSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.read");
+    const { id } = await params;
+    const customer = await repository.getCustomerDetail(context, id);
+    if (!customer) {
+      throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
+    }
+    return success(customer);
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
+    requirePermission(context, "customer.update");
+    const { id } = await params;
+    return success(
+      await repository.updateCustomer(
+        context,
+        id,
+        updateCustomerSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/customers/route.ts b/src/app/api/customers/route.ts
new file mode 100644
index 0000000..9bece04
--- /dev/null
+++ b/src/app/api/customers/route.ts
@@ -0,0 +1,37 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { createCustomerSchema, paginatedQuerySchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.read");
+    const filters = paginatedQuerySchema.parse(
+      Object.fromEntries(new URL(request.url).searchParams),
+    );
+    return success(await repository.listCustomers(context, filters));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "customer.create");
+    const input = createCustomerSchema.parse(await request.json());
+    return success(
+      await repository.createCustomer(context, {
+        ...input,
+        ownerId: input.ownerId ?? context.userId,
+      }),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/follow-ups/[id]/route.ts b/src/app/api/follow-ups/[id]/route.ts
new file mode 100644
index 0000000..94444b7
--- /dev/null
+++ b/src/app/api/follow-ups/[id]/route.ts
@@ -0,0 +1,41 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { updateFollowUpSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function PATCH(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "follow_up.update");
+    const { id } = await params;
+    return success(
+      await repository.updateFollowUp(
+        context,
+        id,
+        updateFollowUpSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function DELETE(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "follow_up.update");
+    const { id } = await params;
+    return success(await repository.deleteFollowUp(context, id));
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/follow-ups/route.ts b/src/app/api/follow-ups/route.ts
new file mode 100644
index 0000000..3752739
--- /dev/null
+++ b/src/app/api/follow-ups/route.ts
@@ -0,0 +1,44 @@
+import { z } from "zod";
+
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { followUpSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+const querySchema = z.object({
+  overdue: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
+  customerId: z.uuid().optional(),
+  leadId: z.uuid().optional(),
+  opportunityId: z.uuid().optional(),
+});
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "follow_up.read");
+    const filters = querySchema.parse(
+      Object.fromEntries(new URL(request.url).searchParams),
+    );
+    return success(await repository.listFollowUps(context, filters));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "follow_up.create");
+    return success(
+      await repository.createFollowUp(
+        context,
+        followUpSchema.parse(await request.json()),
+      ),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/[id]/convert/route.ts b/src/app/api/leads/[id]/convert/route.ts
new file mode 100644
index 0000000..4e02be2
--- /dev/null
+++ b/src/app/api/leads/[id]/convert/route.ts
@@ -0,0 +1,30 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { convertLeadSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+import { convertLead } from "@/modules/crm/crm-service";
+
+const repository = new PrismaCrmRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.update");
+    requirePermission(context, "customer.create");
+    requirePermission(context, "opportunity.create");
+    const { id } = await params;
+    const result = await convertLead(
+      repository,
+      context,
+      id,
+      convertLeadSchema.parse(await request.json()),
+    );
+    return success(result, 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/[id]/route.ts b/src/app/api/leads/[id]/route.ts
new file mode 100644
index 0000000..22ca763
--- /dev/null
+++ b/src/app/api/leads/[id]/route.ts
@@ -0,0 +1,44 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { updateLeadSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(
+  _request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.read");
+    const { id } = await params;
+    const lead = await repository.getLeadDetail(context, id);
+    if (!lead) throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
+    return success(lead);
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
+    requirePermission(context, "lead.update");
+    const { id } = await params;
+    return success(
+      await repository.updateLead(
+        context,
+        id,
+        updateLeadSchema.parse(await request.json()),
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/batch/route.ts b/src/app/api/leads/batch/route.ts
new file mode 100644
index 0000000..30c291f
--- /dev/null
+++ b/src/app/api/leads/batch/route.ts
@@ -0,0 +1,23 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { batchLeadSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.update");
+    const input = batchLeadSchema.parse(await request.json());
+    return success(
+      await repository.batchLeads(context, input.ids, {
+        ownerId: input.ownerId,
+        status: input.status,
+      }),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/export/route.ts b/src/app/api/leads/export/route.ts
new file mode 100644
index 0000000..273eb4b
--- /dev/null
+++ b/src/app/api/leads/export/route.ts
@@ -0,0 +1,53 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { exportLeadCsv } from "@/modules/crm/csv";
+import { paginatedQuerySchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.read");
+    const filters = paginatedQuerySchema
+      .omit({ page: true, pageSize: true })
+      .parse(Object.fromEntries(new URL(request.url).searchParams));
+    const first = await repository.listLeads(context, {
+      ...filters,
+      page: 1,
+      pageSize: 100,
+    });
+    const items = [...first.items];
+    for (let page = 2; page <= first.pageCount; page += 1) {
+      const next = await repository.listLeads(context, {
+        ...filters,
+        page,
+        pageSize: 100,
+      });
+      items.push(...next.items);
+    }
+    const csv = exportLeadCsv(
+      items.map((lead) => ({
+        companyName: lead.companyName,
+        contactName: lead.contactName,
+        email: lead.email,
+        phone: lead.phone,
+        countryCode: lead.countryCode,
+        source: lead.source,
+        status: lead.status,
+        ownerName: lead.owner.name,
+        createdAt: lead.createdAt,
+      })),
+    );
+    return new Response(csv, {
+      headers: {
+        "Content-Type": "text/csv; charset=utf-8",
+        "Content-Disposition": 'attachment; filename="leads.csv"',
+      },
+    });
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/import/route.ts b/src/app/api/leads/import/route.ts
new file mode 100644
index 0000000..a933958
--- /dev/null
+++ b/src/app/api/leads/import/route.ts
@@ -0,0 +1,31 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { previewLeadCsv } from "@/modules/crm/csv";
+import { leadCsvImportSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.create");
+    const input = leadCsvImportSchema.parse(await request.json());
+    const preview = previewLeadCsv(input.csv);
+    if (!input.commit || preview.errors.length) {
+      return success({ committed: false, ...preview });
+    }
+    const created = await repository.importLeadsAtomically(
+      context,
+      preview.validRows,
+      input.ownerId ?? context.userId,
+    );
+    return success(
+      { committed: true, imported: created.length, errors: [] },
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/leads/route.ts b/src/app/api/leads/route.ts
new file mode 100644
index 0000000..fff6aa2
--- /dev/null
+++ b/src/app/api/leads/route.ts
@@ -0,0 +1,37 @@
+import { createLeadSchema, paginatedQuerySchema } from "@/modules/crm/crm-schemas";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.read");
+    const query = paginatedQuerySchema.parse(
+      Object.fromEntries(new URL(request.url).searchParams),
+    );
+    return success(await repository.listLeads(context, query));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "lead.create");
+    const input = createLeadSchema.parse(await request.json());
+    return success(
+      await repository.createLead(context, {
+        ...input,
+        ownerId: input.ownerId ?? context.userId,
+      }),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/opportunities/[id]/stage/route.ts b/src/app/api/opportunities/[id]/stage/route.ts
new file mode 100644
index 0000000..21bea0d
--- /dev/null
+++ b/src/app/api/opportunities/[id]/stage/route.ts
@@ -0,0 +1,31 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { opportunityStageChangeSchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+import { moveOpportunity } from "@/modules/crm/crm-service";
+
+const repository = new PrismaCrmRepository();
+
+export async function POST(
+  request: Request,
+  { params }: { params: Promise<{ id: string }> },
+) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "opportunity.update");
+    const { id } = await params;
+    const input = opportunityStageChangeSchema.parse(await request.json());
+    return success(
+      await moveOpportunity(
+        repository,
+        context,
+        id,
+        input.stage,
+        input.lossReason,
+      ),
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/opportunities/route.ts b/src/app/api/opportunities/route.ts
new file mode 100644
index 0000000..452b334
--- /dev/null
+++ b/src/app/api/opportunities/route.ts
@@ -0,0 +1,37 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { opportunitySchema, paginatedQuerySchema } from "@/modules/crm/crm-schemas";
+import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
+
+const repository = new PrismaCrmRepository();
+
+export async function GET(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "opportunity.read");
+    const filters = paginatedQuerySchema.parse(
+      Object.fromEntries(new URL(request.url).searchParams),
+    );
+    return success(await repository.listOpportunities(context, filters));
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "opportunity.create");
+    const input = opportunitySchema.parse(await request.json());
+    return success(
+      await repository.createOpportunity(context, {
+        ...input,
+        ownerId: input.ownerId ?? context.userId,
+      }),
+      201,
+    );
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/globals.css b/src/app/globals.css
index bab40b3..eaffa0e 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -27,21 +27,22 @@
 
 body {
   margin: 0;
   background: var(--background);
   color: var(--foreground);
   font-family: Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
 }
 
 button,
 input,
-select {
+select,
+textarea {
   font: inherit;
 }
 
 a {
   color: inherit;
   text-decoration: none;
 }
 
 .focus-ring:focus-visible {
   outline: 3px solid color-mix(in srgb, var(--accent), transparent 70%);
@@ -288,20 +289,361 @@ th {
   gap: 8px;
   padding: 0 17px;
   border: 0;
   border-radius: 10px;
   background: var(--accent);
   color: white;
   font-weight: 700;
   cursor: pointer;
 }
 
+.button:disabled {
+  cursor: wait;
+  opacity: 0.6;
+}
+
+.button-secondary {
+  border: 1px solid var(--border);
+  background: var(--surface);
+  color: var(--foreground);
+}
+
+.section-heading,
+.status-group,
+.form-actions,
+.batch-bar,
+.pagination {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 12px;
+}
+
+.filter-bar {
+  display: grid;
+  grid-template-columns: minmax(180px, 2fr) repeat(5, minmax(105px, 1fr)) auto;
+  gap: 10px;
+  padding: 14px;
+}
+
+.filter-bar input,
+.filter-bar select,
+.crm-form input,
+.crm-form select,
+.crm-form textarea {
+  width: 100%;
+  min-height: 42px;
+  padding: 9px 11px;
+  border: 1px solid var(--border);
+  border-radius: 9px;
+  background: var(--background);
+  color: var(--foreground);
+}
+
+.crm-form {
+  display: grid;
+  grid-template-columns: repeat(2, minmax(0, 1fr));
+  gap: 14px;
+  margin-top: 18px;
+}
+
+.crm-form label {
+  display: grid;
+  gap: 6px;
+  color: var(--muted);
+  font-size: 13px;
+  font-weight: 650;
+}
+
+.crm-form textarea,
+.crm-form .form-feedback,
+.crm-form .form-actions {
+  grid-column: 1 / -1;
+}
+
+.form-feedback {
+  margin: 0;
+}
+
+.form-feedback.error {
+  color: #bf3030;
+}
+
+.form-feedback.success {
+  color: #14753c;
+}
+
+.two-column,
+.dashboard-grid {
+  display: grid;
+  grid-template-columns: repeat(2, minmax(0, 1fr));
+  gap: 20px;
+}
+
+details summary {
+  cursor: pointer;
+  font-weight: 750;
+}
+
+.batch-bar {
+  justify-content: flex-start;
+  margin-bottom: 12px;
+  padding: 10px;
+  border-radius: 10px;
+  background: var(--background);
+}
+
+.batch-bar select {
+  min-height: 38px;
+  border: 1px solid var(--border);
+  border-radius: 8px;
+  background: var(--surface);
+  color: var(--foreground);
+}
+
+.table-link,
+.breadcrumb,
+.pagination a {
+  color: var(--accent);
+  font-weight: 700;
+}
+
+.pagination {
+  margin-top: 14px;
+}
+
+.risk {
+  display: inline-flex;
+  padding: 4px 8px;
+  border-radius: 999px;
+  font-size: 12px;
+  font-weight: 750;
+}
+
+.risk-low {
+  background: #e8f8ef;
+  color: #14753c;
+}
+
+.risk-medium {
+  background: #fff6d8;
+  color: #8a6200;
+}
+
+.risk-high {
+  background: #ffebeb;
+  color: #ad2929;
+}
+
+.timeline {
+  display: grid;
+  gap: 14px;
+  padding-left: 22px;
+}
+
+.timeline li {
+  padding-left: 8px;
+}
+
+.timeline p {
+  margin: 5px 0;
+}
+
+.timeline time,
+.record-card small {
+  color: var(--muted);
+  font-size: 12px;
+}
+
+.detail-tabs {
+  position: sticky;
+  z-index: 5;
+  top: 76px;
+  display: flex;
+  overflow-x: auto;
+  gap: 6px;
+  padding: 10px;
+  border: 1px solid var(--border);
+  border-radius: 12px;
+  background: var(--surface);
+}
+
+.detail-tabs a {
+  white-space: nowrap;
+  padding: 7px 10px;
+  border-radius: 8px;
+  color: var(--muted);
+  font-size: 13px;
+  font-weight: 700;
+}
+
+.detail-tabs a:hover {
+  background: var(--accent-soft);
+  color: var(--accent);
+}
+
+.detail-section {
+  scroll-margin-top: 140px;
+  margin-top: 16px;
+  padding: 22px;
+}
+
+.detail-section h2 {
+  margin-top: 0;
+}
+
+.detail-grid,
+.record-grid {
+  display: grid;
+  grid-template-columns: repeat(3, minmax(0, 1fr));
+  gap: 12px;
+}
+
+.detail-grid div,
+.record-card {
+  display: grid;
+  align-content: start;
+  gap: 6px;
+  padding: 14px;
+  border: 1px solid var(--border);
+  border-radius: 11px;
+  background: var(--background);
+}
+
+.detail-grid dt {
+  color: var(--muted);
+  font-size: 12px;
+  font-weight: 700;
+  text-transform: uppercase;
+}
+
+.detail-grid dd {
+  margin: 0;
+}
+
+.kanban {
+  display: grid;
+  overflow-x: auto;
+  grid-template-columns: repeat(6, minmax(230px, 1fr));
+  gap: 12px;
+  padding-bottom: 10px;
+}
+
+.kanban-column {
+  min-height: 330px;
+  padding: 12px;
+  border: 1px solid var(--border);
+  border-radius: 13px;
+  background: color-mix(in srgb, var(--background), var(--surface) 30%);
+}
+
+.kanban-column h2 {
+  margin: 0 0 12px;
+  font-size: 12px;
+  letter-spacing: 0.05em;
+}
+
+.opportunity-card {
+  display: grid;
+  gap: 6px;
+  margin-bottom: 9px;
+  padding: 13px;
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  background: var(--surface);
+  box-shadow: 0 5px 16px rgb(18 38 67 / 6%);
+  cursor: grab;
+  font-size: 13px;
+}
+
+.opportunity-card span {
+  color: var(--muted);
+}
+
+.forecast-card {
+  display: grid;
+  gap: 5px;
+  padding: 13px 18px;
+}
+
+.forecast-card span {
+  color: var(--muted);
+  font-size: 12px;
+}
+
+.forecast-card strong {
+  font-size: 22px;
+}
+
+.bar-chart,
+.distribution-list {
+  display: grid;
+  gap: 11px;
+  padding: 0;
+}
+
+.bar-row {
+  display: grid;
+  grid-template-columns: 110px 1fr 36px;
+  align-items: center;
+  gap: 10px;
+  font-size: 12px;
+}
+
+.bar-row div {
+  height: 10px;
+  overflow: hidden;
+  border-radius: 999px;
+  background: var(--background);
+}
+
+.bar-row i {
+  display: block;
+  height: 100%;
+  border-radius: inherit;
+  background: var(--accent);
+}
+
+.trend-chart {
+  display: flex;
+  min-height: 160px;
+  align-items: flex-end;
+  gap: 8px;
+}
+
+.trend-column {
+  display: grid;
+  min-width: 28px;
+  flex: 1;
+  justify-items: center;
+  gap: 4px;
+  color: var(--muted);
+  font-size: 11px;
+}
+
+.trend-column div {
+  width: min(28px, 75%);
+  border-radius: 5px 5px 0 0;
+  background: var(--accent);
+}
+
+.distribution-list {
+  list-style: none;
+}
+
+.distribution-list li {
+  display: flex;
+  justify-content: space-between;
+  padding-bottom: 9px;
+  border-bottom: 1px solid var(--border);
+}
+
 .empty-state {
   display: grid;
   min-height: 220px;
   place-items: center;
   padding: 28px;
   text-align: center;
 }
 
 .login-page {
   display: grid;
@@ -423,20 +765,29 @@ th {
   }
 
   .nav-link {
     justify-content: center;
   }
 
   .metrics {
     grid-template-columns: repeat(2, minmax(0, 1fr));
   }
 
+  .filter-bar {
+    grid-template-columns: repeat(3, minmax(0, 1fr));
+  }
+
+  .detail-grid,
+  .record-grid {
+    grid-template-columns: repeat(2, minmax(0, 1fr));
+  }
+
   .login-page {
     grid-template-columns: 1fr;
   }
 
   .login-hero {
     display: none;
   }
 }
 
 @media (max-width: 620px) {
@@ -488,11 +839,20 @@ th {
     display: none;
   }
 
   .content {
     padding: 22px 15px 90px;
   }
 
   .metrics {
     grid-template-columns: 1fr;
   }
+
+  .two-column,
+  .dashboard-grid,
+  .crm-form,
+  .filter-bar,
+  .detail-grid,
+  .record-grid {
+    grid-template-columns: 1fr;
+  }
 }
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 9d0b840..6164cb8 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -10,20 +10,23 @@ export function AppShell({
   user,
   children,
 }: {
   locale: Locale;
   user: { name?: string | null; email?: string | null };
   children: React.ReactNode;
 }) {
   const dictionary = getDictionary(locale);
   const nav = [
     ["dashboard", "D", dictionary.nav.dashboard],
+    ["leads", "L", dictionary.nav.leads],
+    ["customers", "C", dictionary.nav.customers],
+    ["opportunities", "O", dictionary.nav.opportunities],
     ["users", "U", dictionary.nav.users],
     ["roles", "R", dictionary.nav.roles],
   ] as const;
   const targetLocale = locale === "en" ? "zh" : "en";
   const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }
diff --git a/src/components/crm/api-mutation-form.tsx b/src/components/crm/api-mutation-form.tsx
new file mode 100644
index 0000000..ca6dee7
--- /dev/null
+++ b/src/components/crm/api-mutation-form.tsx
@@ -0,0 +1,93 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+export function ApiMutationForm({
+  endpoint,
+  method = "POST",
+  submitLabel,
+  loadingLabel,
+  successMessage,
+  failureMessage,
+  numericFields = [],
+  booleanFields = [],
+  dateFields = [],
+  redirectTo,
+  className,
+  children,
+}: {
+  endpoint: string;
+  method?: "POST" | "PATCH";
+  submitLabel: string;
+  loadingLabel: string;
+  successMessage: string;
+  failureMessage: string;
+  numericFields?: string[];
+  booleanFields?: string[];
+  dateFields?: string[];
+  redirectTo?: string;
+  className?: string;
+  children: React.ReactNode;
+}) {
+  const router = useRouter();
+  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
+  const [message, setMessage] = useState("");
+
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setState("loading");
+    setMessage("");
+    const form = event.currentTarget;
+    const formData = new FormData(form);
+    const body: Record<string, unknown> = {};
+    for (const [key, rawValue] of formData.entries()) {
+      if (typeof rawValue !== "string" || rawValue === "") continue;
+      body[key] = numericFields.includes(key) ? Number(rawValue) : rawValue;
+    }
+    for (const key of booleanFields) body[key] = formData.has(key);
+    for (const key of dateFields) {
+      const rawValue = formData.get(key);
+      if (typeof rawValue === "string" && rawValue) {
+        body[key] = new Date(rawValue).toISOString();
+      }
+    }
+
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
+        throw new Error(result.error?.message || failureMessage);
+      }
+      setState("success");
+      setMessage(successMessage);
+      if (method === "POST") form.reset();
+      if (redirectTo) router.push(redirectTo);
+      router.refresh();
+    } catch (error) {
+      setState("error");
+      setMessage(error instanceof Error ? error.message : failureMessage);
+    }
+  }
+
+  return (
+    <form className={className ?? "crm-form"} onSubmit={submit}>
+      {children}
+      <button className="button" disabled={state === "loading"} type="submit">
+        {state === "loading" ? loadingLabel : submitLabel}
+      </button>
+      {message ? (
+        <p className={state === "error" ? "form-feedback error" : "form-feedback success"} role="status">
+          {message}
+        </p>
+      ) : null}
+    </form>
+  );
+}
diff --git a/src/components/crm/lead-csv-import.tsx b/src/components/crm/lead-csv-import.tsx
new file mode 100644
index 0000000..7dba743
--- /dev/null
+++ b/src/components/crm/lead-csv-import.tsx
@@ -0,0 +1,80 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+export function LeadCsvImport() {
+  const router = useRouter();
+  const [csv, setCsv] = useState("");
+  const [preview, setPreview] = useState<{
+    totalRows: number;
+    validRows: unknown[];
+    errors: Array<{ row: number; issues: string[] }>;
+  } | null>(null);
+  const [feedback, setFeedback] = useState("");
+  const [busy, setBusy] = useState(false);
+
+  async function request(commit: boolean) {
+    setBusy(true);
+    setFeedback("");
+    try {
+      const response = await fetch("/api/leads/import", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ csv, commit }),
+      });
+      const result = (await response.json()) as {
+        success: boolean;
+        data?: typeof preview & { imported?: number };
+        error?: { message?: string };
+      };
+      if (!response.ok || !result.success || !result.data) {
+        throw new Error(result.error?.message ?? "CSV import failed");
+      }
+      if (commit) {
+        setFeedback(`${result.data.imported ?? 0} leads imported.`);
+        setCsv("");
+        setPreview(null);
+        router.refresh();
+      } else {
+        setPreview(result.data);
+      }
+    } catch (error) {
+      setFeedback(error instanceof Error ? error.message : "CSV import failed");
+    } finally {
+      setBusy(false);
+    }
+  }
+
+  return (
+    <div className="crm-form">
+      <textarea
+        aria-label="Lead CSV"
+        onChange={(event) => {
+          setCsv(event.target.value);
+          setPreview(null);
+        }}
+        placeholder="companyName,contactName,email,phone,countryCode,source"
+        rows={5}
+        value={csv}
+      />
+      <div className="form-actions">
+        <button className="button button-secondary" disabled={!csv || busy} onClick={() => request(false)} type="button">
+          {busy ? "Checking…" : "Preview and validate"}
+        </button>
+        {preview && preview.errors.length === 0 ? (
+          <button className="button" disabled={busy} onClick={() => request(true)} type="button">
+            Commit {preview.validRows.length} rows
+          </button>
+        ) : null}
+      </div>
+      {preview ? (
+        <p role="status">
+          {preview.validRows.length} valid / {preview.totalRows} total.
+          {preview.errors.map((error) => ` Row ${error.row}: ${error.issues.join(", ")}.`)}
+        </p>
+      ) : null}
+      {feedback ? <p role="status">{feedback}</p> : null}
+    </div>
+  );
+}
diff --git a/src/components/crm/lead-table.tsx b/src/components/crm/lead-table.tsx
new file mode 100644
index 0000000..23e363c
--- /dev/null
+++ b/src/components/crm/lead-table.tsx
@@ -0,0 +1,122 @@
+"use client";
+
+import Link from "next/link";
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+interface LeadRow {
+  id: string;
+  companyName: string;
+  contactName: string;
+  countryCode: string;
+  source: string;
+  status: string;
+  ownerName: string;
+  createdAt: string;
+}
+
+export function LeadTable({
+  locale,
+  leads,
+  emptyText,
+}: {
+  locale: string;
+  leads: LeadRow[];
+  emptyText: string;
+}) {
+  const router = useRouter();
+  const [selected, setSelected] = useState<string[]>([]);
+  const [status, setStatus] = useState("CONTACTED");
+  const [feedback, setFeedback] = useState("");
+  const [saving, setSaving] = useState(false);
+
+  async function batchUpdate() {
+    if (!selected.length) return;
+    if (!window.confirm(`Update ${selected.length} selected lead(s)?`)) return;
+    setSaving(true);
+    setFeedback("");
+    try {
+      const response = await fetch("/api/leads/batch", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ ids: selected, status, confirmed: true }),
+      });
+      const result = (await response.json()) as {
+        success: boolean;
+        error?: { message?: string };
+      };
+      if (!response.ok || !result.success) {
+        throw new Error(result.error?.message ?? "Batch update failed");
+      }
+      setFeedback("Selected leads updated.");
+      setSelected([]);
+      router.refresh();
+    } catch (error) {
+      setFeedback(error instanceof Error ? error.message : "Batch update failed");
+    } finally {
+      setSaving(false);
+    }
+  }
+
+  if (!leads.length) return <div className="empty-state">{emptyText}</div>;
+  return (
+    <>
+      <div className="batch-bar">
+        <strong>{selected.length} selected</strong>
+        <select value={status} onChange={(event) => setStatus(event.target.value)}>
+          <option value="NEW">New</option>
+          <option value="CONTACTED">Contacted</option>
+          <option value="QUALIFIED">Qualified</option>
+          <option value="LOST">Lost</option>
+        </select>
+        <button className="button button-secondary" disabled={!selected.length || saving} onClick={batchUpdate} type="button">
+          {saving ? "Updating…" : "Apply status"}
+        </button>
+        {feedback ? <span role="status">{feedback}</span> : null}
+      </div>
+      <div className="table-wrap">
+        <table>
+          <thead>
+            <tr>
+              <th aria-label="Select" />
+              <th>Company</th>
+              <th>Contact</th>
+              <th>Country</th>
+              <th>Source</th>
+              <th>Status</th>
+              <th>Owner</th>
+              <th>Added</th>
+            </tr>
+          </thead>
+          <tbody>
+            {leads.map((lead) => (
+              <tr key={lead.id}>
+                <td>
+                  <input
+                    aria-label={`Select ${lead.companyName}`}
+                    checked={selected.includes(lead.id)}
+                    onChange={(event) =>
+                      setSelected((current) =>
+                        event.target.checked
+                          ? [...current, lead.id]
+                          : current.filter((id) => id !== lead.id),
+                      )
+                    }
+                    type="checkbox"
+                  />
+                </td>
+                <td><Link className="table-link" href={`/${locale}/leads/${lead.id}`}>{lead.companyName}</Link></td>
+                <td>{lead.contactName}</td>
+                <td>{lead.countryCode}</td>
+                <td>{lead.source}</td>
+                <td><span className="badge">{lead.status}</span></td>
+                <td>{lead.ownerName}</td>
+                <td>{new Date(lead.createdAt).toLocaleDateString(locale)}</td>
+              </tr>
+            ))}
+          </tbody>
+        </table>
+      </div>
+    </>
+  );
+}
diff --git a/src/components/crm/opportunity-board.tsx b/src/components/crm/opportunity-board.tsx
new file mode 100644
index 0000000..7a9982c
--- /dev/null
+++ b/src/components/crm/opportunity-board.tsx
@@ -0,0 +1,97 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+const stages = [
+  "QUALIFICATION",
+  "DISCOVERY",
+  "PROPOSAL",
+  "NEGOTIATION",
+  "WON",
+  "LOST",
+] as const;
+
+interface OpportunityCard {
+  id: string;
+  name: string;
+  stage: string;
+  valueUsd: string;
+  probability: number;
+  customerName: string;
+  ownerName: string;
+}
+
+export function OpportunityBoard({
+  opportunities,
+}: {
+  opportunities: OpportunityCard[];
+}) {
+  const router = useRouter();
+  const [feedback, setFeedback] = useState("");
+  const [moving, setMoving] = useState("");
+
+  async function move(id: string, stage: string) {
+    const current = opportunities.find((item) => item.id === id);
+    if (!current || current.stage === stage) return;
+    const lossReason =
+      stage === "LOST"
+        ? window.prompt("Loss reason (required)")
+        : undefined;
+    if (stage === "LOST" && !lossReason?.trim()) return;
+    setMoving(id);
+    setFeedback("");
+    try {
+      const response = await fetch(`/api/opportunities/${id}/stage`, {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ stage, lossReason }),
+      });
+      const result = (await response.json()) as {
+        success: boolean;
+        error?: { message?: string };
+      };
+      if (!response.ok || !result.success) {
+        throw new Error(result.error?.message ?? "Stage update failed");
+      }
+      setFeedback("Opportunity moved.");
+      router.refresh();
+    } catch (error) {
+      setFeedback(error instanceof Error ? error.message : "Stage update failed");
+    } finally {
+      setMoving("");
+    }
+  }
+
+  return (
+    <>
+      {feedback ? <p className="form-feedback" role="status">{feedback}</p> : null}
+      <div className="kanban">
+        {stages.map((stage) => (
+          <section
+            className="kanban-column"
+            key={stage}
+            onDragOver={(event) => event.preventDefault()}
+            onDrop={(event) => move(event.dataTransfer.getData("text/plain"), stage)}
+          >
+            <h2>{stage.replaceAll("_", " ")}</h2>
+            {opportunities.filter((item) => item.stage === stage).map((item) => (
+              <article
+                className="opportunity-card"
+                draggable
+                key={item.id}
+                onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
+              >
+                <strong>{item.name}</strong>
+                <span>{item.customerName}</span>
+                <span>${Number(item.valueUsd).toLocaleString()} · {item.probability}%</span>
+                <span>{item.ownerName}</span>
+                {moving === item.id ? <small>Moving…</small> : null}
+              </article>
+            ))}
+          </section>
+        ))}
+      </div>
+    </>
+  );
+}
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index adbcb89..853a636 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -5,20 +5,23 @@ const dictionaries = {
   en: {
     appName: "Atlas CRM",
     languageName: "English",
     languageSwitch: "Switch language",
     signOutLabel: "Sign out",
     themeLabel: "Toggle color theme",
     notificationsLabel: "View notifications and risks",
     nav: {
       workspace: "Workspace",
       dashboard: "Dashboard",
+      leads: "Leads",
+      customers: "Customers",
+      opportunities: "Opportunities",
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
@@ -34,33 +37,86 @@ const dictionaries = {
       },
     },
     dashboard: {
       metricsLabel: "Business metrics",
       title: "Good to see you",
       subtitle: "Here is the current operating picture.",
       customers: "Active customers",
       quotes: "Open quotations",
       orders: "Orders in progress",
       tasks: "Tasks due",
+      openLeads: "Open leads",
+      pipelineValueUsd: "Pipeline value (USD)",
+      weightedForecastUsd: "Weighted forecast (USD)",
+      funnel: "Sales funnel",
+      orderTrend: "Monthly order trend",
+      leadSources: "Lead sources",
+      upcomingFollowUps: "Upcoming follow-ups",
+      recentLeads: "Recent leads",
+      recentOrders: "Recent orders",
       recent: "Recently added customers",
       empty: "No customers have been added yet.",
       table: {
         company: "Company",
         country: "Country",
         added: "Added",
       },
       risks: {
         title: "Notifications and risks",
         clear: "No urgent risks need your attention.",
         overdueTasks: "overdue tasks require attention.",
       },
     },
+    crm: {
+      create: "Create",
+      save: "Save changes",
+      edit: "Edit",
+      view: "View",
+      search: "Search",
+      filters: "Filters",
+      empty: "No records match the current scope and filters.",
+      loading: "Saving…",
+      success: "Saved successfully.",
+      failed: "The change could not be saved.",
+      leads: {
+        title: "Leads",
+        subtitle: "Qualify prospects and turn them into customer opportunities.",
+        new: "New lead",
+        convert: "Convert lead",
+        import: "CSV import",
+        export: "Export current view",
+      },
+      customers: {
+        title: "Customers",
+        subtitle: "Owned accounts, contacts, risk, and complete relationship history.",
+        new: "New customer",
+      },
+      opportunities: {
+        title: "Opportunities",
+        subtitle: "Move qualified deals through the validated sales pipeline.",
+        new: "New opportunity",
+        forecast: "Weighted forecast",
+      },
+      tabs: {
+        overview: "Overview",
+        contacts: "Contacts",
+        followUps: "Follow-ups",
+        opportunities: "Opportunities",
+        quotations: "Quotations",
+        orders: "Orders",
+        payments: "Payments",
+        shipments: "Shipments",
+        afterSales: "After-sales",
+        files: "Files",
+        activity: "Activity",
+      },
+    },
     users: {
       title: "Users",
       subtitle: "Accounts, access status and assigned roles.",
       denied: "You do not have access to user management.",
       empty: "No users found.",
       table: {
         name: "Name",
         email: "Email",
         role: "Role",
         status: "Status",
@@ -92,20 +148,23 @@ const dictionaries = {
   zh: {
     appName: "Atlas \u5916\u8d38 CRM",
     languageName: "\u4e2d\u6587",
     languageSwitch: "\u5207\u6362\u8bed\u8a00",
     signOutLabel: "\u9000\u51fa\u767b\u5f55",
     themeLabel: "\u5207\u6362\u989c\u8272\u4e3b\u9898",
     notificationsLabel: "\u67e5\u770b\u901a\u77e5\u4e0e\u98ce\u9669",
     nav: {
       workspace: "\u5de5\u4f5c\u53f0",
       dashboard: "\u4eea\u8868\u76d8",
+      leads: "\u7ebf\u7d22",
+      customers: "\u5ba2\u6237",
+      opportunities: "\u5546\u673a",
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
@@ -124,34 +183,87 @@ const dictionaries = {
     },
     dashboard: {
       metricsLabel: "\u4e1a\u52a1\u6307\u6807",
       title: "\u6b22\u8fce\u56de\u6765",
       subtitle:
         "\u8fd9\u662f\u5f53\u524d\u4e1a\u52a1\u8fd0\u8425\u6982\u89c8\u3002",
       customers: "\u6d3b\u8dc3\u5ba2\u6237",
       quotes: "\u8fdb\u884c\u4e2d\u62a5\u4ef7",
       orders: "\u5c65\u7ea6\u4e2d\u8ba2\u5355",
       tasks: "\u5f85\u529e\u4efb\u52a1",
+      openLeads: "\u8fdb\u884c\u4e2d\u7ebf\u7d22",
+      pipelineValueUsd: "\u9500\u552e\u7ba1\u9053\uff08USD\uff09",
+      weightedForecastUsd: "\u52a0\u6743\u9884\u6d4b\uff08USD\uff09",
+      funnel: "\u9500\u552e\u6f0f\u6597",
+      orderTrend: "\u6708\u5ea6\u8ba2\u5355\u8d8b\u52bf",
+      leadSources: "\u7ebf\u7d22\u6765\u6e90",
+      upcomingFollowUps: "\u5373\u5c06\u5230\u671f\u8ddf\u8fdb",
+      recentLeads: "\u6700\u8fd1\u7ebf\u7d22",
+      recentOrders: "\u6700\u8fd1\u8ba2\u5355",
       recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
       empty: "\u6682\u65f6\u8fd8\u6ca1\u6709\u5ba2\u6237\u6570\u636e\u3002",
       table: {
         company: "\u516c\u53f8",
         country: "\u56fd\u5bb6/\u5730\u533a",
         added: "\u65b0\u589e\u65e5\u671f",
       },
       risks: {
         title: "\u901a\u77e5\u4e0e\u98ce\u9669",
         clear: "\u76ee\u524d\u6ca1\u6709\u9700\u8981\u7acb\u5373\u5904\u7406\u7684\u98ce\u9669\u3002",
         overdueTasks:
           "\u4e2a\u903e\u671f\u4efb\u52a1\u9700\u8981\u5904\u7406\u3002",
       },
     },
+    crm: {
+      create: "\u521b\u5efa",
+      save: "\u4fdd\u5b58\u66f4\u6539",
+      edit: "\u7f16\u8f91",
+      view: "\u67e5\u770b",
+      search: "\u641c\u7d22",
+      filters: "\u7b5b\u9009",
+      empty: "\u5f53\u524d\u6743\u9650\u8303\u56f4\u548c\u7b5b\u9009\u6761\u4ef6\u4e0b\u6682\u65e0\u8bb0\u5f55\u3002",
+      loading: "\u6b63\u5728\u4fdd\u5b58\u2026",
+      success: "\u4fdd\u5b58\u6210\u529f\u3002",
+      failed: "\u65e0\u6cd5\u4fdd\u5b58\u66f4\u6539\u3002",
+      leads: {
+        title: "\u7ebf\u7d22",
+        subtitle: "\u8bc4\u4f30\u6f5c\u5728\u5ba2\u6237\uff0c\u5e76\u8f6c\u5316\u4e3a\u5ba2\u6237\u4e0e\u5546\u673a\u3002",
+        new: "\u65b0\u5efa\u7ebf\u7d22",
+        convert: "\u8f6c\u5316\u7ebf\u7d22",
+        import: "CSV \u5bfc\u5165",
+        export: "\u5bfc\u51fa\u5f53\u524d\u89c6\u56fe",
+      },
+      customers: {
+        title: "\u5ba2\u6237",
+        subtitle: "\u7ba1\u7406\u5ba2\u6237\u3001\u8054\u7cfb\u4eba\u3001\u98ce\u9669\u4e0e\u5b8c\u6574\u5f80\u6765\u8bb0\u5f55\u3002",
+        new: "\u65b0\u5efa\u5ba2\u6237",
+      },
+      opportunities: {
+        title: "\u5546\u673a",
+        subtitle: "\u5728\u53d7\u63a7\u9500\u552e\u6d41\u7a0b\u4e2d\u63a8\u8fdb\u5408\u683c\u5546\u673a\u3002",
+        new: "\u65b0\u5efa\u5546\u673a",
+        forecast: "\u52a0\u6743\u9884\u6d4b",
+      },
+      tabs: {
+        overview: "\u6982\u89c8",
+        contacts: "\u8054\u7cfb\u4eba",
+        followUps: "\u8ddf\u8fdb",
+        opportunities: "\u5546\u673a",
+        quotations: "\u62a5\u4ef7",
+        orders: "\u8ba2\u5355",
+        payments: "\u6536\u6b3e",
+        shipments: "\u53d1\u8d27",
+        afterSales: "\u552e\u540e",
+        files: "\u6587\u4ef6",
+        activity: "\u6d3b\u52a8",
+      },
+    },
     users: {
       title: "\u7528\u6237",
       subtitle:
         "\u7ba1\u7406\u8d26\u6237\u3001\u8bbf\u95ee\u72b6\u6001\u4e0e\u5df2\u5206\u914d\u89d2\u8272\u3002",
       denied:
         "\u60a8\u6ca1\u6709\u8bbf\u95ee\u7528\u6237\u7ba1\u7406\u7684\u6743\u9650\u3002",
       empty: "\u672a\u627e\u5230\u7528\u6237\u3002",
       table: {
         name: "\u59d3\u540d",
         email: "\u90ae\u7bb1",
diff --git a/src/modules/crm/crm-domain.test.ts b/src/modules/crm/crm-domain.test.ts
new file mode 100644
index 0000000..a8259c3
--- /dev/null
+++ b/src/modules/crm/crm-domain.test.ts
@@ -0,0 +1,213 @@
+import { describe, expect, it } from "vitest";
+
+import type { AuthorizationContext } from "@/lib/rbac";
+import {
+  assertOpportunityTransition,
+  assertOwned,
+  assertPrimaryContactChange,
+  findLeadDuplicates,
+  isFollowUpOverdue,
+  crmOwnerWhere,
+  weightedForecast,
+} from "@/modules/crm/crm-domain";
+
+const representative: AuthorizationContext = {
+  userId: "sales-1",
+  roles: ["SALES_REP"],
+  permissions: ["lead.read", "lead.update", "opportunity.update"],
+};
+
+describe("CRM ownership", () => {
+  it("rejects access to another representative's record", () => {
+    expect(() =>
+      assertOwned(representative, { ownerId: "sales-2" }, "lead.update"),
+    ).toThrowError(/Permission denied/);
+  });
+
+  it("cannot replace representative scope with a requested owner filter", () => {
+    expect(crmOwnerWhere(representative, "sales-2")).toEqual({
+      ownerId: "sales-1",
+    });
+  });
+
+  it("allows managers to select an owner or leave team scope broad", () => {
+    const manager: AuthorizationContext = {
+      userId: "manager-1",
+      roles: ["SALES_MANAGER"],
+      permissions: ["lead.read"],
+    };
+    expect(crmOwnerWhere(manager, "sales-2")).toEqual({ ownerId: "sales-2" });
+    expect(crmOwnerWhere(manager)).toEqual({});
+  });
+
+  it("allows a sales manager to access team records", () => {
+    expect(() =>
+      assertOwned(
+        {
+          userId: "manager-1",
+          roles: ["SALES_MANAGER"],
+          permissions: ["lead.update"],
+        },
+        { ownerId: "sales-2" },
+        "lead.update",
+      ),
+    ).not.toThrow();
+  });
+});
+
+describe("lead duplicate detection", () => {
+  const rows = [
+    {
+      id: "lead-1",
+      companyName: "Northstar Systems",
+      email: "buyer@northstar.example",
+      phone: "+1 206 555 0180",
+    },
+    {
+      id: "lead-2",
+      companyName: "Unrelated GmbH",
+      email: "sales@unrelated.example",
+      phone: "+49 30 555 0101",
+    },
+  ];
+
+  it("matches normalized email, phone, or company name", () => {
+    expect(
+      findLeadDuplicates(
+        {
+          companyName: " northstar   systems ",
+          email: "BUYER@NORTHSTAR.EXAMPLE",
+          phone: "+1 (206) 555-0180",
+        },
+        rows,
+      ),
+    ).toEqual(["lead-1"]);
+  });
+
+  it("does not treat empty identifiers as duplicates", () => {
+    expect(
+      findLeadDuplicates(
+        { companyName: "", email: null, phone: null },
+        rows,
+      ),
+    ).toEqual([]);
+  });
+});
+
+describe("primary contact constraint", () => {
+  it("rejects a second active primary contact", () => {
+    expect(() =>
+      assertPrimaryContactChange(true, ["contact-1"]),
+    ).toThrowError(/primary contact/i);
+  });
+
+  it("allows a non-primary contact or the only primary contact", () => {
+    expect(() => assertPrimaryContactChange(false, ["contact-1"])).not.toThrow();
+    expect(() => assertPrimaryContactChange(true, [])).not.toThrow();
+  });
+});
+
+describe("follow-up overdue logic", () => {
+  const now = new Date("2026-07-17T12:00:00.000Z");
+
+  it("marks an incomplete past next action as overdue", () => {
+    expect(
+      isFollowUpOverdue(
+        {
+          nextActionAt: new Date("2026-07-17T11:59:59.000Z"),
+          completedAt: null,
+          deletedAt: null,
+        },
+        now,
+      ),
+    ).toBe(true);
+  });
+
+  it("excludes completed, deleted, future, and unscheduled follow-ups", () => {
+    expect(
+      isFollowUpOverdue(
+        {
+          nextActionAt: new Date("2026-07-17T11:00:00.000Z"),
+          completedAt: now,
+          deletedAt: null,
+        },
+        now,
+      ),
+    ).toBe(false);
+    expect(
+      isFollowUpOverdue(
+        {
+          nextActionAt: new Date("2026-07-17T11:00:00.000Z"),
+          completedAt: null,
+          deletedAt: now,
+        },
+        now,
+      ),
+    ).toBe(false);
+    expect(
+      isFollowUpOverdue(
+        {
+          nextActionAt: new Date("2026-07-17T13:00:00.000Z"),
+          completedAt: null,
+          deletedAt: null,
+        },
+        now,
+      ),
+    ).toBe(false);
+    expect(
+      isFollowUpOverdue(
+        { nextActionAt: null, completedAt: null, deletedAt: null },
+        now,
+      ),
+    ).toBe(false);
+  });
+});
+
+describe("opportunity stage transitions", () => {
+  it("allows forward progress, won, and lost with a reason", () => {
+    expect(() =>
+      assertOpportunityTransition("DISCOVERY", "PROPOSAL"),
+    ).not.toThrow();
+    expect(() =>
+      assertOpportunityTransition("NEGOTIATION", "WON"),
+    ).not.toThrow();
+    expect(() =>
+      assertOpportunityTransition("PROPOSAL", "LOST", "Budget withdrawn"),
+    ).not.toThrow();
+  });
+
+  it("rejects backward, terminal, skipped, and unexplained lost transitions", () => {
+    expect(() =>
+      assertOpportunityTransition("PROPOSAL", "DISCOVERY"),
+    ).toThrowError(/transition/i);
+    expect(() =>
+      assertOpportunityTransition("WON", "NEGOTIATION"),
+    ).toThrowError(/terminal/i);
+    expect(() =>
+      assertOpportunityTransition("QUALIFICATION", "NEGOTIATION"),
+    ).toThrowError(/transition/i);
+    expect(() =>
+      assertOpportunityTransition("PROPOSAL", "LOST"),
+    ).toThrowError(/loss reason/i);
+  });
+});
+
+describe("weighted forecast", () => {
+  it("sums USD values weighted by probability with fixed precision", () => {
+    expect(
+      weightedForecast([
+        { valueUsd: "100.00", probability: 30, stage: "DISCOVERY" },
+        { valueUsd: "250.00", probability: 80, stage: "NEGOTIATION" },
+        { valueUsd: "999.00", probability: 100, stage: "LOST" },
+      ]),
+    ).toBe("230.00");
+  });
+
+  it("treats won opportunities as fully weighted", () => {
+    expect(
+      weightedForecast([
+        { valueUsd: "125.55", probability: 10, stage: "WON" },
+      ]),
+    ).toBe("125.55");
+  });
+});
diff --git a/src/modules/crm/crm-domain.ts b/src/modules/crm/crm-domain.ts
new file mode 100644
index 0000000..b43ebba
--- /dev/null
+++ b/src/modules/crm/crm-domain.ts
@@ -0,0 +1,168 @@
+import Decimal from "decimal.js";
+
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { hasGlobalOwnershipScope, requirePermission } from "@/lib/rbac";
+
+export function crmOwnerWhere(
+  context: AuthorizationContext,
+  requestedOwnerId?: string,
+) {
+  const representativeScope =
+    context.roles?.includes("SALES_REP") &&
+    !hasGlobalOwnershipScope(context)
+      ? context.userId
+      : undefined;
+  const ownerId = representativeScope ?? requestedOwnerId;
+  return ownerId ? { ownerId } : {};
+}
+
+export interface OwnedCrmRecord {
+  ownerId: string;
+}
+
+export function assertOwned(
+  context: AuthorizationContext,
+  record: OwnedCrmRecord,
+  permission: string,
+) {
+  requirePermission(context, permission, record);
+}
+
+interface DuplicateCandidate {
+  companyName?: string | null;
+  email?: string | null;
+  phone?: string | null;
+}
+
+interface DuplicateRow extends DuplicateCandidate {
+  id: string;
+}
+
+function normalizedText(value?: string | null) {
+  return value?.trim().toLocaleLowerCase().replace(/\s+/g, " ") ?? "";
+}
+
+function normalizedPhone(value?: string | null) {
+  return value?.replace(/\D/g, "") ?? "";
+}
+
+export function findLeadDuplicates(
+  candidate: DuplicateCandidate,
+  rows: readonly DuplicateRow[],
+) {
+  const companyName = normalizedText(candidate.companyName);
+  const email = normalizedText(candidate.email);
+  const phone = normalizedPhone(candidate.phone);
+
+  return rows
+    .filter(
+      (row) =>
+        (companyName !== "" &&
+          normalizedText(row.companyName) === companyName) ||
+        (email !== "" && normalizedText(row.email) === email) ||
+        (phone !== "" && normalizedPhone(row.phone) === phone),
+    )
+    .map((row) => row.id);
+}
+
+export function assertPrimaryContactChange(
+  isPrimary: boolean,
+  existingPrimaryContactIds: readonly string[],
+) {
+  if (isPrimary && existingPrimaryContactIds.length > 0) {
+    throw new DomainError(
+      "PRIMARY_CONTACT_EXISTS",
+      "This customer already has an active primary contact",
+      409,
+    );
+  }
+}
+
+export interface FollowUpSchedule {
+  nextActionAt: Date | null;
+  completedAt: Date | null;
+  deletedAt: Date | null;
+}
+
+export function isFollowUpOverdue(
+  followUp: FollowUpSchedule,
+  now = new Date(),
+) {
+  return (
+    followUp.nextActionAt !== null &&
+    followUp.nextActionAt < now &&
+    followUp.completedAt === null &&
+    followUp.deletedAt === null
+  );
+}
+
+export const opportunityStages = [
+  "QUALIFICATION",
+  "DISCOVERY",
+  "PROPOSAL",
+  "NEGOTIATION",
+  "WON",
+  "LOST",
+] as const;
+
+export type OpportunityStageValue = (typeof opportunityStages)[number];
+
+const activeStages = opportunityStages.slice(0, 4);
+
+export function assertOpportunityTransition(
+  current: OpportunityStageValue,
+  next: OpportunityStageValue,
+  lossReason?: string | null,
+) {
+  if (current === "WON" || current === "LOST") {
+    throw new DomainError(
+      "OPPORTUNITY_TERMINAL",
+      "A terminal opportunity cannot change stage",
+      409,
+    );
+  }
+  if (current === next) return;
+  if (next === "LOST") {
+    if (!lossReason?.trim()) {
+      throw new DomainError(
+        "LOSS_REASON_REQUIRED",
+        "A loss reason is required",
+      );
+    }
+    return;
+  }
+
+  const currentIndex = activeStages.indexOf(current);
+  const nextIndex = activeStages.indexOf(next);
+  const validSequentialMove = nextIndex === currentIndex + 1;
+  const validWonMove = current === "NEGOTIATION" && next === "WON";
+  if (!validSequentialMove && !validWonMove) {
+    throw new DomainError(
+      "INVALID_STAGE_TRANSITION",
+      `Invalid opportunity transition from ${current} to ${next}`,
+      409,
+    );
+  }
+}
+
+export interface ForecastOpportunity {
+  valueUsd: string;
+  probability: number;
+  stage: OpportunityStageValue;
+}
+
+export function weightedForecast(
+  opportunities: readonly ForecastOpportunity[],
+) {
+  return opportunities
+    .filter(({ stage }) => stage !== "LOST")
+    .reduce((total, opportunity) => {
+      const probability =
+        opportunity.stage === "WON" ? 100 : opportunity.probability;
+      return total.plus(
+        new Decimal(opportunity.valueUsd).times(probability).dividedBy(100),
+      );
+    }, new Decimal(0))
+    .toFixed(2);
+}
diff --git a/src/modules/crm/crm-schemas.test.ts b/src/modules/crm/crm-schemas.test.ts
new file mode 100644
index 0000000..2fb7356
--- /dev/null
+++ b/src/modules/crm/crm-schemas.test.ts
@@ -0,0 +1,25 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  followUpSchema,
+  updateFollowUpSchema,
+} from "@/modules/crm/crm-schemas";
+
+describe("CRM schemas", () => {
+  it("loads create and update follow-up schemas without composing from a refined schema", () => {
+    expect(
+      followUpSchema.safeParse({
+        leadId: "00000000-0000-4000-8000-000000000001",
+        type: "CALL",
+        channel: "PHONE",
+        summary: "Qualified requirements",
+        occurredAt: "2026-07-17T10:00:00.000Z",
+      }).success,
+    ).toBe(true);
+    expect(
+      updateFollowUpSchema.safeParse({
+        summary: "Confirmed the next technical review",
+      }).success,
+    ).toBe(true);
+  });
+});
diff --git a/src/modules/crm/crm-schemas.ts b/src/modules/crm/crm-schemas.ts
new file mode 100644
index 0000000..cbbe26b
--- /dev/null
+++ b/src/modules/crm/crm-schemas.ts
@@ -0,0 +1,168 @@
+import { z } from "zod";
+
+const nullableText = z.string().trim().max(500).nullable().optional();
+const optionalDate = z
+  .string()
+  .datetime()
+  .transform((value) => new Date(value))
+  .nullable()
+  .optional();
+
+export const leadStatusSchema = z.enum([
+  "NEW",
+  "CONTACTED",
+  "QUALIFIED",
+  "CONVERTED",
+  "LOST",
+]);
+
+export const createLeadSchema = z.object({
+  companyName: z.string().trim().min(2).max(180),
+  contactName: z.string().trim().min(1).max(120),
+  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
+  phone: nullableText,
+  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
+  source: z.string().trim().min(1).max(80),
+  status: leadStatusSchema.exclude(["CONVERTED"]).optional(),
+  notes: z.string().trim().max(4000).nullable().optional(),
+  ownerId: z.uuid().optional(),
+});
+
+export const updateLeadSchema = createLeadSchema
+  .omit({ ownerId: true })
+  .partial()
+  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
+
+export const convertLeadSchema = z.object({
+  opportunityName: z.string().trim().min(2).max(180),
+  value: z.string().regex(/^\d+(\.\d{1,4})?$/),
+  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
+  exchangeRateToUsd: z.string().regex(/^\d+(\.\d{1,12})?$/),
+  probability: z.number().int().min(0).max(100),
+});
+
+export const batchLeadSchema = z.object({
+  ids: z.array(z.uuid()).min(1).max(100),
+  ownerId: z.uuid().optional(),
+  status: leadStatusSchema.exclude(["CONVERTED"]).optional(),
+  confirmed: z.literal(true),
+}).refine((value) => value.ownerId || value.status, "An assignment or status is required");
+
+export const customerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
+
+export const createCustomerSchema = z.object({
+  companyName: z.string().trim().min(2).max(180),
+  legalName: nullableText,
+  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
+  website: z.union([z.url(), z.literal(""), z.null()]).optional().transform((value) => value || null),
+  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
+  phone: nullableText,
+  taxId: nullableText,
+  status: customerStatusSchema.optional(),
+  level: z.enum(["STANDARD", "KEY", "STRATEGIC"]).optional(),
+  riskRating: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
+  riskNotes: z.string().trim().max(2000).nullable().optional(),
+  ownerId: z.uuid().optional(),
+});
+
+export const updateCustomerSchema = createCustomerSchema
+  .omit({ ownerId: true })
+  .partial()
+  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
+
+export const contactSchema = z.object({
+  firstName: z.string().trim().min(1).max(80),
+  lastName: z.string().trim().max(80),
+  title: nullableText,
+  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
+  phone: nullableText,
+  whatsapp: nullableText,
+  wechat: nullableText,
+  preferredChannel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "WECHAT", "VIDEO"]).nullable().optional(),
+  isPrimary: z.boolean().optional(),
+  language: z.string().trim().min(2).max(12).optional(),
+  timezone: nullableText,
+  decisionRole: z.enum(["DECISION_MAKER", "INFLUENCER", "TECHNICAL", "FINANCE", "USER"]).nullable().optional(),
+});
+
+export const updateContactSchema = contactSchema
+  .partial()
+  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
+
+const followUpFields = z.object({
+  customerId: z.uuid().nullable().optional(),
+  contactId: z.uuid().nullable().optional(),
+  leadId: z.uuid().nullable().optional(),
+  opportunityId: z.uuid().nullable().optional(),
+  type: z.enum(["NOTE", "CALL", "MEETING", "EMAIL", "MESSAGE"]),
+  channel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "WECHAT", "VIDEO", "IN_PERSON"]),
+  summary: z.string().trim().min(2).max(4000),
+  outcome: nullableText,
+  nextAction: nullableText,
+  occurredAt: z.string().datetime().transform((value) => new Date(value)),
+  nextActionAt: optionalDate,
+  completedAt: optionalDate,
+  attachments: z.array(z.object({
+    fileName: z.string().trim().min(1).max(255),
+    objectKey: z.string().trim().min(1).max(500),
+    contentType: z.string().trim().min(1).max(120),
+    sizeBytes: z.number().int().nonnegative(),
+  })).max(20).optional(),
+});
+
+export const followUpSchema = followUpFields.refine(
+  (value) => value.customerId || value.contactId || value.leadId || value.opportunityId,
+  "A related CRM record is required",
+);
+
+export const updateFollowUpSchema = followUpFields
+  .omit({ customerId: true, contactId: true, leadId: true, opportunityId: true })
+  .partial()
+  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
+
+export const opportunityStageSchema = z.enum([
+  "QUALIFICATION",
+  "DISCOVERY",
+  "PROPOSAL",
+  "NEGOTIATION",
+  "WON",
+  "LOST",
+]);
+
+export const opportunitySchema = z.object({
+  customerId: z.uuid(),
+  name: z.string().trim().min(2).max(180),
+  value: z.string().regex(/^\d+(\.\d{1,4})?$/),
+  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
+  exchangeRateToUsd: z.string().regex(/^\d+(\.\d{1,12})?$/),
+  probability: z.number().int().min(0).max(100),
+  expectedCloseAt: optionalDate,
+  ownerId: z.uuid().optional(),
+});
+
+export const opportunityStageChangeSchema = z.object({
+  stage: opportunityStageSchema,
+  lossReason: z.string().trim().min(2).max(1000).nullable().optional(),
+});
+
+export const paginatedQuerySchema = z.object({
+  page: z.coerce.number().int().min(1).optional(),
+  pageSize: z.coerce.number().int().min(1).max(100).optional(),
+  query: z.string().trim().max(200).optional(),
+  countryCode: z.string().trim().length(2).optional(),
+  source: z.string().trim().max(80).optional(),
+  status: z.string().trim().max(40).optional(),
+  ownerId: z.uuid().optional(),
+  createdFrom: z.string().datetime().transform((value) => new Date(value)).optional(),
+  createdTo: z.string().datetime().transform((value) => new Date(value)).optional(),
+  level: z.string().trim().max(40).optional(),
+  riskRating: z.string().trim().max(40).optional(),
+  stage: z.string().trim().max(40).optional(),
+  customerId: z.uuid().optional(),
+});
+
+export const leadCsvImportSchema = z.object({
+  csv: z.string().min(1).max(5_000_000),
+  commit: z.boolean().default(false),
+  ownerId: z.uuid().optional(),
+});
diff --git a/src/modules/crm/crm-service.test.ts b/src/modules/crm/crm-service.test.ts
new file mode 100644
index 0000000..8abe875
--- /dev/null
+++ b/src/modules/crm/crm-service.test.ts
@@ -0,0 +1,172 @@
+import { describe, expect, it } from "vitest";
+
+import type { AuthorizationContext } from "@/lib/rbac";
+import {
+  convertLead,
+  moveOpportunity,
+  type CrmRepository,
+} from "@/modules/crm/crm-service";
+
+const representative: AuthorizationContext = {
+  userId: "sales-1",
+  roles: ["SALES_REP"],
+  permissions: ["lead.update", "opportunity.update"],
+};
+
+function repositoryFixture(
+  overrides: Partial<CrmRepository> = {},
+): CrmRepository {
+  return {
+    findLead: async () => ({
+      id: "lead-1",
+      ownerId: "sales-1",
+      status: "QUALIFIED",
+      companyName: "Northstar Systems",
+      contactName: "Maya Chen",
+      countryCode: "US",
+      email: "maya@northstar.example",
+      phone: "+12065550180",
+    }),
+    convertLeadAtomically: async (_context, lead, input) => ({
+      leadId: lead.id,
+      customerId: "customer-1",
+      opportunityId: "opportunity-1",
+      ownerId: input.ownerId,
+    }),
+    findOpportunity: async () => ({
+      id: "opportunity-1",
+      ownerId: "sales-1",
+      stage: "DISCOVERY",
+    }),
+    updateOpportunityStage: async (_context, opportunity, input) => ({
+      id: opportunity.id,
+      stage: input.stage,
+      lossReason: input.lossReason ?? null,
+    }),
+    ...overrides,
+  };
+}
+
+describe("lead conversion", () => {
+  it("converts customer and opportunity in one repository transaction preserving owner", async () => {
+    const calls: Array<{ ownerId: string; opportunityName: string }> = [];
+    const repository = repositoryFixture({
+      convertLeadAtomically: async (_context, lead, input) => {
+        calls.push(input);
+        return {
+          leadId: lead.id,
+          customerId: "customer-1",
+          opportunityId: "opportunity-1",
+          ownerId: input.ownerId,
+        };
+      },
+    });
+
+    await expect(
+      convertLead(repository, representative, "lead-1", {
+        opportunityName: "GPU cluster refresh",
+        value: "120000",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        probability: 30,
+      }),
+    ).resolves.toMatchObject({
+      customerId: "customer-1",
+      opportunityId: "opportunity-1",
+      ownerId: "sales-1",
+    });
+    expect(calls).toEqual([
+      { ownerId: "sales-1", opportunityName: "GPU cluster refresh", value: "120000", currencyCode: "USD", exchangeRateToUsd: "1", probability: 30 },
+    ]);
+  });
+
+  it("rejects a foreign or already converted lead before opening conversion transaction", async () => {
+    let converted = false;
+    const foreign = repositoryFixture({
+      findLead: async () => ({
+        id: "lead-1",
+        ownerId: "sales-2",
+        status: "QUALIFIED",
+        companyName: "Northstar Systems",
+        contactName: "Maya Chen",
+        countryCode: "US",
+        email: null,
+        phone: null,
+      }),
+      convertLeadAtomically: async () => {
+        converted = true;
+        throw new Error("must not run");
+      },
+    });
+
+    await expect(
+      convertLead(foreign, representative, "lead-1", {
+        opportunityName: "GPU cluster refresh",
+        value: "100",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        probability: 10,
+      }),
+    ).rejects.toThrow(/Permission denied/);
+    expect(converted).toBe(false);
+
+    const convertedLead = repositoryFixture({
+      findLead: async () => ({
+        id: "lead-1",
+        ownerId: "sales-1",
+        status: "CONVERTED",
+        companyName: "Northstar Systems",
+        contactName: "Maya Chen",
+        countryCode: "US",
+        email: null,
+        phone: null,
+      }),
+    });
+    await expect(
+      convertLead(convertedLead, representative, "lead-1", {
+        opportunityName: "GPU cluster refresh",
+        value: "100",
+        currencyCode: "USD",
+        exchangeRateToUsd: "1",
+        probability: 10,
+      }),
+    ).rejects.toThrow(/already converted/i);
+  });
+});
+
+describe("opportunity movement", () => {
+  it("validates the transition before persisting it", async () => {
+    let persisted = false;
+    const repository = repositoryFixture({
+      updateOpportunityStage: async (_context, opportunity, input) => {
+        persisted = true;
+        return {
+          id: opportunity.id,
+          stage: input.stage,
+          lossReason: input.lossReason ?? null,
+        };
+      },
+    });
+
+    await expect(
+      moveOpportunity(
+        repository,
+        representative,
+        "opportunity-1",
+        "PROPOSAL",
+      ),
+    ).resolves.toMatchObject({ stage: "PROPOSAL" });
+    expect(persisted).toBe(true);
+
+    persisted = false;
+    await expect(
+      moveOpportunity(
+        repository,
+        representative,
+        "opportunity-1",
+        "LOST",
+      ),
+    ).rejects.toThrow(/loss reason/i);
+    expect(persisted).toBe(false);
+  });
+});
diff --git a/src/modules/crm/crm-service.ts b/src/modules/crm/crm-service.ts
new file mode 100644
index 0000000..11dca6b
--- /dev/null
+++ b/src/modules/crm/crm-service.ts
@@ -0,0 +1,120 @@
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+import {
+  assertOpportunityTransition,
+  assertOwned,
+  type OpportunityStageValue,
+} from "@/modules/crm/crm-domain";
+
+export interface LeadForConversion {
+  id: string;
+  ownerId: string;
+  status: string;
+  companyName: string;
+  contactName: string;
+  countryCode: string;
+  email: string | null;
+  phone: string | null;
+}
+
+export interface OpportunityForStage {
+  id: string;
+  ownerId: string;
+  stage: OpportunityStageValue;
+}
+
+export interface ConvertLeadInput {
+  opportunityName: string;
+  value: string;
+  currencyCode: string;
+  exchangeRateToUsd: string;
+  probability: number;
+}
+
+export interface AtomicConversionInput extends ConvertLeadInput {
+  ownerId: string;
+}
+
+export interface ConversionResult {
+  leadId: string;
+  customerId: string;
+  opportunityId: string;
+  ownerId: string;
+}
+
+export interface StageUpdateResult {
+  id: string;
+  stage: OpportunityStageValue;
+  lossReason: string | null;
+}
+
+export interface CrmRepository {
+  findLead(
+    context: AuthorizationContext,
+    id: string,
+  ): Promise<LeadForConversion | null>;
+  convertLeadAtomically(
+    context: AuthorizationContext,
+    lead: LeadForConversion,
+    input: AtomicConversionInput,
+  ): Promise<ConversionResult>;
+  findOpportunity(
+    context: AuthorizationContext,
+    id: string,
+  ): Promise<OpportunityForStage | null>;
+  updateOpportunityStage(
+    context: AuthorizationContext,
+    opportunity: OpportunityForStage,
+    input: { stage: OpportunityStageValue; lossReason?: string | null },
+  ): Promise<StageUpdateResult>;
+}
+
+export async function convertLead(
+  repository: CrmRepository,
+  context: AuthorizationContext,
+  leadId: string,
+  input: ConvertLeadInput,
+) {
+  const lead = await repository.findLead(context, leadId);
+  if (!lead) {
+    throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
+  }
+  assertOwned(context, lead, "lead.update");
+  if (lead.status === "CONVERTED") {
+    throw new DomainError(
+      "LEAD_ALREADY_CONVERTED",
+      "Lead is already converted",
+      409,
+    );
+  }
+  return repository.convertLeadAtomically(context, lead, {
+    ...input,
+    ownerId: lead.ownerId,
+  });
+}
+
+export async function moveOpportunity(
+  repository: CrmRepository,
+  context: AuthorizationContext,
+  opportunityId: string,
+  stage: OpportunityStageValue,
+  lossReason?: string | null,
+) {
+  const opportunity = await repository.findOpportunity(
+    context,
+    opportunityId,
+  );
+  if (!opportunity) {
+    throw new DomainError(
+      "OPPORTUNITY_NOT_FOUND",
+      "Opportunity not found",
+      404,
+    );
+  }
+  assertOwned(context, opportunity, "opportunity.update");
+  assertOpportunityTransition(opportunity.stage, stage, lossReason);
+  return repository.updateOpportunityStage(context, opportunity, {
+    stage,
+    lossReason,
+  });
+}
diff --git a/src/modules/crm/csv.test.ts b/src/modules/crm/csv.test.ts
new file mode 100644
index 0000000..59ae7bd
--- /dev/null
+++ b/src/modules/crm/csv.test.ts
@@ -0,0 +1,59 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  exportLeadCsv,
+  previewLeadCsv,
+} from "@/modules/crm/csv";
+
+describe("lead CSV preview", () => {
+  it("parses quoted commas and reports row validation errors before commit", () => {
+    const result = previewLeadCsv(
+      [
+        "companyName,contactName,email,phone,countryCode,source",
+        '"Northstar, Inc.",Maya Chen,maya@northstar.example,+12065550180,US,Referral',
+        "Invalid Co,Ivy,not-an-email,,USA,",
+      ].join("\n"),
+    );
+
+    expect(result.validRows).toHaveLength(1);
+    expect(result.validRows[0]).toMatchObject({
+      companyName: "Northstar, Inc.",
+      countryCode: "US",
+    });
+    expect(result.errors).toEqual([
+      expect.objectContaining({
+        row: 3,
+        issues: expect.arrayContaining(["email", "countryCode", "source"]),
+      }),
+    ]);
+  });
+
+  it("rejects a file with missing required headers", () => {
+    expect(() =>
+      previewLeadCsv("companyName,email\nExample,buyer@example.com"),
+    ).toThrowError(/headers/i);
+  });
+});
+
+describe("lead CSV export", () => {
+  it("escapes values and emits only the records supplied by the scoped query", () => {
+    const csv = exportLeadCsv([
+      {
+        companyName: "Northstar, Inc.",
+        contactName: 'Maya "MJ" Chen',
+        email: "maya@northstar.example",
+        phone: "+12065550180",
+        countryCode: "US",
+        source: "Referral",
+        status: "QUALIFIED",
+        ownerName: "Lina Wu",
+        createdAt: new Date("2026-07-01T00:00:00.000Z"),
+      },
+    ]);
+
+    expect(csv).toContain('"Northstar, Inc."');
+    expect(csv).toContain('"Maya ""MJ"" Chen"');
+    expect(csv).toContain("2026-07-01T00:00:00.000Z");
+    expect(csv.split("\n")).toHaveLength(2);
+  });
+});
diff --git a/src/modules/crm/csv.ts b/src/modules/crm/csv.ts
new file mode 100644
index 0000000..7d9ebfd
--- /dev/null
+++ b/src/modules/crm/csv.ts
@@ -0,0 +1,134 @@
+import { z } from "zod";
+
+import { DomainError } from "@/lib/errors";
+
+const requiredHeaders = [
+  "companyName",
+  "contactName",
+  "email",
+  "phone",
+  "countryCode",
+  "source",
+] as const;
+
+const leadRowSchema = z.object({
+  companyName: z.string().trim().min(1),
+  contactName: z.string().trim().min(1),
+  email: z.union([z.literal(""), z.email()]).transform((value) => value || null),
+  phone: z.string().trim().transform((value) => value || null),
+  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
+  source: z.string().trim().min(1),
+});
+
+function parseCsvRows(csv: string) {
+  const rows: string[][] = [];
+  let row: string[] = [];
+  let cell = "";
+  let quoted = false;
+
+  for (let index = 0; index < csv.length; index += 1) {
+    const character = csv[index];
+    if (quoted && character === '"' && csv[index + 1] === '"') {
+      cell += '"';
+      index += 1;
+    } else if (character === '"') {
+      quoted = !quoted;
+    } else if (character === "," && !quoted) {
+      row.push(cell);
+      cell = "";
+    } else if ((character === "\n" || character === "\r") && !quoted) {
+      if (character === "\r" && csv[index + 1] === "\n") index += 1;
+      row.push(cell);
+      if (row.some((value) => value !== "")) rows.push(row);
+      row = [];
+      cell = "";
+    } else {
+      cell += character;
+    }
+  }
+  row.push(cell);
+  if (row.some((value) => value !== "")) rows.push(row);
+  return rows;
+}
+
+export type LeadImportRow = z.infer<typeof leadRowSchema>;
+
+export function previewLeadCsv(csv: string) {
+  const [headers, ...rows] = parseCsvRows(csv.replace(/^\uFEFF/, ""));
+  if (
+    !headers ||
+    requiredHeaders.some((header) => !headers.includes(header))
+  ) {
+    throw new DomainError(
+      "CSV_HEADERS_INVALID",
+      `CSV headers must include ${requiredHeaders.join(", ")}`,
+    );
+  }
+
+  const validRows: LeadImportRow[] = [];
+  const errors: Array<{ row: number; issues: string[] }> = [];
+  for (const [rowIndex, values] of rows.entries()) {
+    const record = Object.fromEntries(
+      headers.map((header, index) => [header, values[index] ?? ""]),
+    );
+    const parsed = leadRowSchema.safeParse(record);
+    if (parsed.success) {
+      validRows.push(parsed.data);
+    } else {
+      errors.push({
+        row: rowIndex + 2,
+        issues: [
+          ...new Set(
+            parsed.error.issues.map((issue) => issue.path.join(".")),
+          ),
+        ],
+      });
+    }
+  }
+  return { validRows, errors, totalRows: rows.length };
+}
+
+export interface ExportLeadRow {
+  companyName: string;
+  contactName: string;
+  email: string | null;
+  phone: string | null;
+  countryCode: string;
+  source: string;
+  status: string;
+  ownerName: string;
+  createdAt: Date;
+}
+
+function csvCell(value: string) {
+  return /[",\r\n]/.test(value)
+    ? `"${value.replaceAll('"', '""')}"`
+    : value;
+}
+
+export function exportLeadCsv(rows: readonly ExportLeadRow[]) {
+  const headers = [
+    ...requiredHeaders,
+    "status",
+    "ownerName",
+    "createdAt",
+  ];
+  return [
+    headers.join(","),
+    ...rows.map((row) =>
+      [
+        row.companyName,
+        row.contactName,
+        row.email ?? "",
+        row.phone ?? "",
+        row.countryCode,
+        row.source,
+        row.status,
+        row.ownerName,
+        row.createdAt.toISOString(),
+      ]
+        .map(csvCell)
+        .join(","),
+    ),
+  ].join("\n");
+}
diff --git a/src/modules/crm/prisma-crm-repository.ts b/src/modules/crm/prisma-crm-repository.ts
new file mode 100644
index 0000000..9485f68
--- /dev/null
+++ b/src/modules/crm/prisma-crm-repository.ts
@@ -0,0 +1,922 @@
+import Decimal from "decimal.js";
+
+import type { Prisma } from "@/generated/prisma/client";
+import { getPrisma } from "@/lib/prisma";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+import {
+  assertPrimaryContactChange,
+  crmOwnerWhere,
+  findLeadDuplicates,
+} from "@/modules/crm/crm-domain";
+import type {
+  AtomicConversionInput,
+  CrmRepository,
+  LeadForConversion,
+  OpportunityForStage,
+} from "@/modules/crm/crm-service";
+import { searchOwnershipFilter } from "@/modules/search/search-scope";
+
+export interface LeadFilters {
+  page?: number;
+  pageSize?: number;
+  query?: string;
+  countryCode?: string;
+  source?: string;
+  status?: string;
+  ownerId?: string;
+  createdFrom?: Date;
+  createdTo?: Date;
+}
+
+export interface CreateLeadData {
+  companyName: string;
+  contactName: string;
+  email?: string | null;
+  phone?: string | null;
+  countryCode: string;
+  source: string;
+  status?: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
+  notes?: string | null;
+  ownerId: string;
+}
+
+export interface CustomerFilters {
+  page?: number;
+  pageSize?: number;
+  query?: string;
+  countryCode?: string;
+  status?: string;
+  level?: string;
+  riskRating?: string;
+  ownerId?: string;
+}
+
+export interface CreateCustomerData {
+  companyName: string;
+  legalName?: string | null;
+  countryCode: string;
+  website?: string | null;
+  email?: string | null;
+  phone?: string | null;
+  taxId?: string | null;
+  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
+  level?: string;
+  riskRating?: string;
+  riskNotes?: string | null;
+  ownerId: string;
+}
+
+export interface ContactData {
+  firstName: string;
+  lastName: string;
+  title?: string | null;
+  email?: string | null;
+  phone?: string | null;
+  whatsapp?: string | null;
+  wechat?: string | null;
+  preferredChannel?: string | null;
+  isPrimary?: boolean;
+  language?: string;
+  timezone?: string | null;
+  decisionRole?: string | null;
+}
+
+export interface FollowUpData {
+  customerId?: string | null;
+  contactId?: string | null;
+  leadId?: string | null;
+  opportunityId?: string | null;
+  type: string;
+  channel: string;
+  summary: string;
+  outcome?: string | null;
+  nextAction?: string | null;
+  occurredAt: Date;
+  nextActionAt?: Date | null;
+  completedAt?: Date | null;
+  attachments?: Prisma.InputJsonValue;
+}
+
+export interface OpportunityFilters {
+  page?: number;
+  pageSize?: number;
+  query?: string;
+  stage?: string;
+  ownerId?: string;
+  customerId?: string;
+}
+
+export interface CreateOpportunityData {
+  customerId: string;
+  name: string;
+  value: string;
+  currencyCode: string;
+  exchangeRateToUsd: string;
+  probability: number;
+  expectedCloseAt?: Date | null;
+  ownerId: string;
+}
+
+function ownerIdFor(context: AuthorizationContext) {
+  return searchOwnershipFilter(context).ownerId;
+}
+
+function ownershipWhere(
+  context: AuthorizationContext,
+  requestedOwnerId?: string,
+) {
+  return crmOwnerWhere(context, requestedOwnerId);
+}
+
+function relatedOwnershipWhere(context: AuthorizationContext) {
+  const ownerId = ownerIdFor(context);
+  return ownerId
+    ? {
+        OR: [
+          { customer: { ownerId } },
+          { contact: { customer: { ownerId } } },
+          { lead: { ownerId } },
+          { opportunity: { ownerId } },
+        ],
+      }
+    : {};
+}
+
+function pagination(page = 1, pageSize = 20) {
+  return {
+    page: Math.max(1, page),
+    pageSize: Math.min(100, Math.max(1, pageSize)),
+  };
+}
+
+export class PrismaCrmRepository implements CrmRepository {
+  async listLeads(context: AuthorizationContext, filters: LeadFilters = {}) {
+    const { page, pageSize } = pagination(filters.page, filters.pageSize);
+    const where: Prisma.LeadWhereInput = {
+      deletedAt: null,
+      ...ownershipWhere(context, filters.ownerId),
+      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
+      ...(filters.source ? { source: filters.source } : {}),
+      ...(filters.status
+        ? { status: filters.status as Prisma.EnumLeadStatusFilter["equals"] }
+        : {}),
+      ...(filters.createdFrom || filters.createdTo
+        ? {
+            createdAt: {
+              ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
+              ...(filters.createdTo ? { lte: filters.createdTo } : {}),
+            },
+          }
+        : {}),
+      ...(filters.query
+        ? {
+            OR: [
+              { companyName: { contains: filters.query, mode: "insensitive" } },
+              { contactName: { contains: filters.query, mode: "insensitive" } },
+              { email: { contains: filters.query, mode: "insensitive" } },
+              { phone: { contains: filters.query, mode: "insensitive" } },
+            ],
+          }
+        : {}),
+    };
+    const prisma = getPrisma();
+    const [total, items] = await prisma.$transaction([
+      prisma.lead.count({ where }),
+      prisma.lead.findMany({
+        where,
+        orderBy: { createdAt: "desc" },
+        skip: (page - 1) * pageSize,
+        take: pageSize,
+        include: {
+          owner: { select: { id: true, name: true } },
+          followUps: {
+            where: { deletedAt: null },
+            orderBy: { occurredAt: "desc" },
+            take: 1,
+          },
+        },
+      }),
+    ]);
+    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
+  }
+
+  async findLead(
+    context: AuthorizationContext,
+    id: string,
+  ): Promise<LeadForConversion | null> {
+    return getPrisma().lead.findFirst({
+      where: { id, deletedAt: null, ...ownershipWhere(context) },
+      select: {
+        id: true,
+        ownerId: true,
+        status: true,
+        companyName: true,
+        contactName: true,
+        countryCode: true,
+        email: true,
+        phone: true,
+      },
+    });
+  }
+
+  getLeadDetail(context: AuthorizationContext, id: string) {
+    return getPrisma().lead.findFirst({
+      where: { id, deletedAt: null, ...ownershipWhere(context) },
+      include: {
+        owner: { select: { id: true, name: true, email: true } },
+        followUps: {
+          where: { deletedAt: null },
+          orderBy: { occurredAt: "desc" },
+        },
+      },
+    });
+  }
+
+  async createLead(context: AuthorizationContext, input: CreateLeadData) {
+    const scopedOwnerId = ownerIdFor(context);
+    if (scopedOwnerId && input.ownerId !== scopedOwnerId) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.create", 403);
+    }
+    const prisma = getPrisma();
+    const candidates = await prisma.lead.findMany({
+      where: {
+        deletedAt: null,
+        ...ownershipWhere(context),
+        OR: [
+          { companyName: { equals: input.companyName, mode: "insensitive" } },
+          ...(input.email
+            ? [{ email: { equals: input.email, mode: "insensitive" as const } }]
+            : []),
+          ...(input.phone ? [{ phone: input.phone }] : []),
+        ],
+      },
+      select: { id: true, companyName: true, email: true, phone: true },
+    });
+    const duplicateIds = findLeadDuplicates(input, candidates);
+    if (duplicateIds.length) {
+      throw new DomainError("LEAD_DUPLICATE", "Potential duplicate lead", 409, {
+        duplicateIds,
+      });
+    }
+    return prisma.$transaction(async (transaction) => {
+      const lead = await transaction.lead.create({ data: input });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "lead.create",
+        entityType: "Lead",
+        entityId: lead.id,
+        after: { id: lead.id, companyName: lead.companyName, ownerId: lead.ownerId },
+      });
+      return lead;
+    });
+  }
+
+  async importLeadsAtomically(
+    context: AuthorizationContext,
+    rows: Array<Omit<CreateLeadData, "ownerId">>,
+    ownerId = context.userId,
+  ) {
+    const scopedOwnerId = ownerIdFor(context);
+    if (scopedOwnerId && ownerId !== scopedOwnerId) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.create", 403);
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const created = [];
+      for (const row of rows) {
+        const lead = await transaction.lead.create({
+          data: { ...row, ownerId },
+        });
+        created.push(lead);
+      }
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "lead.csv_import",
+        entityType: "Lead",
+        metadata: { ids: created.map(({ id }) => id), count: created.length },
+      });
+      return created;
+    });
+  }
+
+  async updateLead(
+    context: AuthorizationContext,
+    id: string,
+    input: Partial<Omit<CreateLeadData, "ownerId">>,
+  ) {
+    const existing = await this.findLead(context, id);
+    if (!existing) throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
+    return getPrisma().$transaction(async (transaction) => {
+      const lead = await transaction.lead.update({
+        where: { id },
+        data: { ...input, version: { increment: 1 } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "lead.update",
+        entityType: "Lead",
+        entityId: id,
+        before: { status: existing.status },
+        after: { status: lead.status, version: lead.version },
+      });
+      return lead;
+    });
+  }
+
+  async batchLeads(
+    context: AuthorizationContext,
+    ids: string[],
+    input: { ownerId?: string; status?: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" },
+  ) {
+    const prisma = getPrisma();
+    const scoped = await prisma.lead.findMany({
+      where: { id: { in: ids }, deletedAt: null, ...ownershipWhere(context) },
+      select: { id: true },
+    });
+    if (scoped.length !== new Set(ids).size) {
+      throw new DomainError("LEAD_NOT_FOUND", "One or more leads were not found", 404);
+    }
+    const ownId = ownerIdFor(context);
+    if (input.ownerId && ownId) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.assign", 403);
+    }
+    return prisma.$transaction(async (transaction) => {
+      const result = await transaction.lead.updateMany({
+        where: { id: { in: ids } },
+        data: {
+          ...(input.ownerId ? { ownerId: input.ownerId } : {}),
+          ...(input.status ? { status: input.status } : {}),
+          version: { increment: 1 },
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "lead.batch_update",
+        entityType: "Lead",
+        metadata: { ids, ...input },
+      });
+      return result;
+    });
+  }
+
+  async convertLeadAtomically(
+    context: AuthorizationContext,
+    lead: LeadForConversion,
+    input: AtomicConversionInput,
+  ) {
+    return getPrisma().$transaction(async (transaction) => {
+      const current = await transaction.lead.findFirst({
+        where: {
+          id: lead.id,
+          deletedAt: null,
+          status: { not: "CONVERTED" },
+          ...ownershipWhere(context),
+        },
+      });
+      if (!current) {
+        throw new DomainError(
+          "LEAD_CONVERSION_CONFLICT",
+          "Lead cannot be converted",
+          409,
+        );
+      }
+      const customer = await transaction.customer.create({
+        data: {
+          companyName: current.companyName,
+          countryCode: current.countryCode,
+          email: current.email,
+          phone: current.phone,
+          ownerId: input.ownerId,
+          contacts: {
+            create: {
+              firstName: current.contactName,
+              lastName: "",
+              email: current.email,
+              phone: current.phone,
+              isPrimary: true,
+            },
+          },
+        },
+      });
+      const valueUsd = new Decimal(input.value)
+        .times(input.exchangeRateToUsd)
+        .toFixed(4);
+      const opportunity = await transaction.opportunity.create({
+        data: {
+          customerId: customer.id,
+          name: input.opportunityName,
+          value: input.value,
+          currencyCode: input.currencyCode,
+          exchangeRateToUsd: input.exchangeRateToUsd,
+          valueUsd,
+          probability: input.probability,
+          ownerId: input.ownerId,
+        },
+      });
+      await transaction.lead.update({
+        where: { id: current.id },
+        data: {
+          status: "CONVERTED",
+          convertedCustomerId: customer.id,
+          convertedOpportunityId: opportunity.id,
+          version: { increment: 1 },
+        },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "lead.convert",
+        entityType: "Lead",
+        entityId: current.id,
+        metadata: {
+          customerId: customer.id,
+          opportunityId: opportunity.id,
+        },
+      });
+      return {
+        leadId: current.id,
+        customerId: customer.id,
+        opportunityId: opportunity.id,
+        ownerId: input.ownerId,
+      };
+    });
+  }
+
+  async listCustomers(context: AuthorizationContext, filters: CustomerFilters = {}) {
+    const { page, pageSize } = pagination(filters.page, filters.pageSize);
+    const where: Prisma.CustomerWhereInput = {
+      deletedAt: null,
+      ...ownershipWhere(context, filters.ownerId),
+      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
+      ...(filters.status
+        ? { status: filters.status as Prisma.EnumRecordStatusFilter["equals"] }
+        : {}),
+      ...(filters.level ? { level: filters.level } : {}),
+      ...(filters.riskRating ? { riskRating: filters.riskRating } : {}),
+      ...(filters.query
+        ? {
+            OR: [
+              { companyName: { contains: filters.query, mode: "insensitive" } },
+              { legalName: { contains: filters.query, mode: "insensitive" } },
+              { email: { contains: filters.query, mode: "insensitive" } },
+            ],
+          }
+        : {}),
+    };
+    const prisma = getPrisma();
+    const [total, items] = await prisma.$transaction([
+      prisma.customer.count({ where }),
+      prisma.customer.findMany({
+        where,
+        orderBy: { updatedAt: "desc" },
+        skip: (page - 1) * pageSize,
+        take: pageSize,
+        include: {
+          owner: { select: { id: true, name: true } },
+          _count: { select: { contacts: true, opportunities: true, orders: true } },
+        },
+      }),
+    ]);
+    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
+  }
+
+  async getCustomerDetail(context: AuthorizationContext, id: string) {
+    const prisma = getPrisma();
+    const customer = await prisma.customer.findFirst({
+      where: { id, deletedAt: null, ...ownershipWhere(context) },
+      include: {
+        owner: { select: { id: true, name: true, email: true } },
+        contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
+        followUps: { where: { deletedAt: null }, orderBy: { occurredAt: "desc" } },
+        opportunities: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
+        quotes: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
+        orders: {
+          where: { deletedAt: null },
+          orderBy: { updatedAt: "desc" },
+          include: {
+            payments: { where: { deletedAt: null } },
+            shipments: { where: { deletedAt: null } },
+          },
+        },
+        tickets: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
+      },
+    });
+    if (!customer) return null;
+    const [files, activity] = await prisma.$transaction([
+      prisma.fileAsset.findMany({
+        where: { entityType: "Customer", entityId: id, deletedAt: null },
+        orderBy: { createdAt: "desc" },
+      }),
+      prisma.auditLog.findMany({
+        where: {
+          OR: [
+            { entityType: "Customer", entityId: id },
+            { entityType: "Contact", metadata: { path: ["customerId"], equals: id } },
+            { entityType: "FollowUp", metadata: { path: ["customerId"], equals: id } },
+          ],
+        },
+        orderBy: { createdAt: "desc" },
+        take: 50,
+      }),
+    ]);
+    return { ...customer, files, activity };
+  }
+
+  async createCustomer(context: AuthorizationContext, input: CreateCustomerData) {
+    const ownId = ownerIdFor(context);
+    if (ownId && input.ownerId !== ownId) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: customer.create", 403);
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const customer = await transaction.customer.create({ data: input });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "customer.create",
+        entityType: "Customer",
+        entityId: customer.id,
+        after: { id: customer.id, companyName: customer.companyName, ownerId: customer.ownerId },
+      });
+      return customer;
+    });
+  }
+
+  async updateCustomer(
+    context: AuthorizationContext,
+    id: string,
+    input: Partial<Omit<CreateCustomerData, "ownerId">>,
+  ) {
+    const existing = await this.getCustomerDetail(context, id);
+    if (!existing) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
+    return getPrisma().$transaction(async (transaction) => {
+      const customer = await transaction.customer.update({
+        where: { id },
+        data: { ...input, version: { increment: 1 } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "customer.update",
+        entityType: "Customer",
+        entityId: id,
+        before: { status: existing.status, level: existing.level, riskRating: existing.riskRating },
+        after: { status: customer.status, level: customer.level, riskRating: customer.riskRating },
+      });
+      return customer;
+    });
+  }
+
+  async createContact(
+    context: AuthorizationContext,
+    customerId: string,
+    input: ContactData,
+  ) {
+    const customer = await getPrisma().customer.findFirst({
+      where: { id: customerId, deletedAt: null, ...ownershipWhere(context) },
+      select: { id: true },
+    });
+    if (!customer) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
+    const existingPrimary = input.isPrimary
+      ? await getPrisma().contact.findMany({
+          where: { customerId, isPrimary: true, deletedAt: null },
+          select: { id: true },
+        })
+      : [];
+    assertPrimaryContactChange(
+      input.isPrimary === true,
+      existingPrimary.map(({ id }) => id),
+    );
+    return getPrisma().$transaction(async (transaction) => {
+      const contact = await transaction.contact.create({
+        data: { customerId, ...input },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "contact.create",
+        entityType: "Contact",
+        entityId: contact.id,
+        metadata: { customerId },
+      });
+      return contact;
+    });
+  }
+
+  async updateContact(
+    context: AuthorizationContext,
+    customerId: string,
+    contactId: string,
+    input: Partial<ContactData>,
+  ) {
+    const contact = await getPrisma().contact.findFirst({
+      where: {
+        id: contactId,
+        customerId,
+        deletedAt: null,
+        customer: { deletedAt: null, ...ownershipWhere(context) },
+      },
+    });
+    if (!contact) throw new DomainError("CONTACT_NOT_FOUND", "Contact not found", 404);
+    if (input.isPrimary) {
+      const primary = await getPrisma().contact.findMany({
+        where: { customerId, isPrimary: true, deletedAt: null, id: { not: contactId } },
+        select: { id: true },
+      });
+      assertPrimaryContactChange(true, primary.map(({ id }) => id));
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const updated = await transaction.contact.update({
+        where: { id: contactId },
+        data: { ...input, version: { increment: 1 } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "contact.update",
+        entityType: "Contact",
+        entityId: contactId,
+        metadata: { customerId },
+      });
+      return updated;
+    });
+  }
+
+  async deleteContact(
+    context: AuthorizationContext,
+    customerId: string,
+    contactId: string,
+  ) {
+    const contact = await getPrisma().contact.findFirst({
+      where: {
+        id: contactId,
+        customerId,
+        deletedAt: null,
+        customer: { deletedAt: null, ...ownershipWhere(context) },
+      },
+    });
+    if (!contact) throw new DomainError("CONTACT_NOT_FOUND", "Contact not found", 404);
+    return getPrisma().$transaction(async (transaction) => {
+      const deleted = await transaction.contact.update({
+        where: { id: contactId },
+        data: { deletedAt: new Date(), isPrimary: false, version: { increment: 1 } },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "contact.archive",
+        entityType: "Contact",
+        entityId: contactId,
+        metadata: { customerId },
+      });
+      return deleted;
+    });
+  }
+
+  listFollowUps(
+    context: AuthorizationContext,
+    filters: { overdue?: boolean; customerId?: string; leadId?: string; opportunityId?: string } = {},
+  ) {
+    return getPrisma().followUp.findMany({
+      where: {
+        deletedAt: null,
+        ...relatedOwnershipWhere(context),
+        ...(filters.customerId ? { customerId: filters.customerId } : {}),
+        ...(filters.leadId ? { leadId: filters.leadId } : {}),
+        ...(filters.opportunityId ? { opportunityId: filters.opportunityId } : {}),
+        ...(filters.overdue
+          ? { nextActionAt: { lt: new Date() }, completedAt: null }
+          : {}),
+      },
+      orderBy: filters.overdue ? { nextActionAt: "asc" } : { occurredAt: "desc" },
+      include: {
+        customer: { select: { id: true, companyName: true } },
+        lead: { select: { id: true, companyName: true } },
+        opportunity: { select: { id: true, name: true } },
+      },
+    });
+  }
+
+  async createFollowUp(context: AuthorizationContext, input: FollowUpData) {
+    const relatedIds = [
+      input.customerId,
+      input.contactId,
+      input.leadId,
+      input.opportunityId,
+    ].filter((id): id is string => Boolean(id));
+    const owners = await this.resolveRelatedOwners(input);
+    if (!relatedIds.length || owners.length !== relatedIds.length) {
+      throw new DomainError("FOLLOW_UP_RELATION_REQUIRED", "A related CRM record is required");
+    }
+    const uniqueOwners = [...new Set(owners)];
+    if (uniqueOwners.length !== 1) {
+      throw new DomainError(
+        "FOLLOW_UP_RELATION_MISMATCH",
+        "Related CRM records must have the same owner",
+        409,
+      );
+    }
+    const [ownerId] = uniqueOwners;
+    const scopedOwner = ownerIdFor(context);
+    if (scopedOwner && ownerId !== scopedOwner) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.update", 403);
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const followUp = await transaction.followUp.create({
+        data: { ...input, createdById: context.userId },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "follow_up.create",
+        entityType: "FollowUp",
+        entityId: followUp.id,
+        metadata: {
+          customerId: input.customerId,
+          leadId: input.leadId,
+          opportunityId: input.opportunityId,
+        },
+      });
+      return followUp;
+    });
+  }
+
+  async updateFollowUp(
+    context: AuthorizationContext,
+    id: string,
+    input: Partial<Omit<FollowUpData, "customerId" | "contactId" | "leadId" | "opportunityId">>,
+  ) {
+    const existing = await getPrisma().followUp.findFirst({
+      where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
+    });
+    if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
+    return getPrisma().$transaction(async (transaction) => {
+      const followUp = await transaction.followUp.update({ where: { id }, data: input });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "follow_up.update",
+        entityType: "FollowUp",
+        entityId: id,
+      });
+      return followUp;
+    });
+  }
+
+  async deleteFollowUp(context: AuthorizationContext, id: string) {
+    const existing = await getPrisma().followUp.findFirst({
+      where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
+      select: { id: true },
+    });
+    if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
+    return getPrisma().$transaction(async (transaction) => {
+      const followUp = await transaction.followUp.update({
+        where: { id },
+        data: { deletedAt: new Date() },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "follow_up.archive",
+        entityType: "FollowUp",
+        entityId: id,
+      });
+      return followUp;
+    });
+  }
+
+  private async resolveRelatedOwners(input: FollowUpData) {
+    const prisma = getPrisma();
+    const owners: string[] = [];
+    if (input.customerId) {
+      const row = await prisma.customer.findFirst({ where: { id: input.customerId, deletedAt: null }, select: { ownerId: true } });
+      if (row) owners.push(row.ownerId);
+    }
+    if (input.contactId) {
+      const row = await prisma.contact.findFirst({ where: { id: input.contactId, deletedAt: null }, select: { customer: { select: { ownerId: true } } } });
+      if (row) owners.push(row.customer.ownerId);
+    }
+    if (input.leadId) {
+      const row = await prisma.lead.findFirst({ where: { id: input.leadId, deletedAt: null }, select: { ownerId: true } });
+      if (row) owners.push(row.ownerId);
+    }
+    if (input.opportunityId) {
+      const row = await prisma.opportunity.findFirst({ where: { id: input.opportunityId, deletedAt: null }, select: { ownerId: true } });
+      if (row) owners.push(row.ownerId);
+    }
+    return owners;
+  }
+
+  async listOpportunities(
+    context: AuthorizationContext,
+    filters: OpportunityFilters = {},
+  ) {
+    const { page, pageSize } = pagination(filters.page, filters.pageSize);
+    const where: Prisma.OpportunityWhereInput = {
+      deletedAt: null,
+      ...ownershipWhere(context, filters.ownerId),
+      ...(filters.customerId ? { customerId: filters.customerId } : {}),
+      ...(filters.stage
+        ? { stage: filters.stage as Prisma.EnumOpportunityStageFilter["equals"] }
+        : {}),
+      ...(filters.query
+        ? { name: { contains: filters.query, mode: "insensitive" } }
+        : {}),
+    };
+    const prisma = getPrisma();
+    const [total, items] = await prisma.$transaction([
+      prisma.opportunity.count({ where }),
+      prisma.opportunity.findMany({
+        where,
+        orderBy: [{ stage: "asc" }, { expectedCloseAt: "asc" }],
+        skip: (page - 1) * pageSize,
+        take: pageSize,
+        include: {
+          owner: { select: { id: true, name: true } },
+          customer: { select: { id: true, companyName: true } },
+        },
+      }),
+    ]);
+    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
+  }
+
+  async createOpportunity(
+    context: AuthorizationContext,
+    input: CreateOpportunityData,
+  ) {
+    const customer = await getPrisma().customer.findFirst({
+      where: { id: input.customerId, deletedAt: null, ...ownershipWhere(context) },
+      select: { ownerId: true },
+    });
+    if (!customer) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
+    const ownId = ownerIdFor(context);
+    if (ownId && input.ownerId !== ownId) {
+      throw new DomainError("PERMISSION_DENIED", "Permission denied: opportunity.create", 403);
+    }
+    const valueUsd = new Decimal(input.value).times(input.exchangeRateToUsd).toFixed(4);
+    return getPrisma().$transaction(async (transaction) => {
+      const opportunity = await transaction.opportunity.create({
+        data: { ...input, valueUsd },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "opportunity.create",
+        entityType: "Opportunity",
+        entityId: opportunity.id,
+        after: { id: opportunity.id, stage: opportunity.stage, ownerId: opportunity.ownerId },
+      });
+      return opportunity;
+    });
+  }
+
+  async findOpportunity(
+    context: AuthorizationContext,
+    id: string,
+  ): Promise<OpportunityForStage | null> {
+    return getPrisma().opportunity.findFirst({
+      where: { id, deletedAt: null, ...ownershipWhere(context) },
+      select: { id: true, ownerId: true, stage: true },
+    });
+  }
+
+  async updateOpportunityStage(
+    context: AuthorizationContext,
+    opportunity: OpportunityForStage,
+    input: {
+      stage: OpportunityForStage["stage"];
+      lossReason?: string | null;
+    },
+  ) {
+    const current = await this.findOpportunity(context, opportunity.id);
+    if (!current || current.stage !== opportunity.stage) {
+      throw new DomainError(
+        "OPPORTUNITY_STAGE_CONFLICT",
+        "Opportunity stage changed; refresh and retry",
+        409,
+      );
+    }
+    return getPrisma().$transaction(async (transaction) => {
+      const updated = await transaction.opportunity.update({
+        where: { id: opportunity.id },
+        data: {
+          stage: input.stage,
+          lostReason: input.stage === "LOST" ? input.lossReason : null,
+          lostAt: input.stage === "LOST" ? new Date() : null,
+          wonAt: input.stage === "WON" ? new Date() : null,
+          probability:
+            input.stage === "WON"
+              ? 100
+              : input.stage === "LOST"
+                ? 0
+                : undefined,
+          version: { increment: 1 },
+        },
+        select: { id: true, stage: true, lostReason: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "opportunity.stage_change",
+        entityType: "Opportunity",
+        entityId: opportunity.id,
+        before: { stage: opportunity.stage },
+        after: { stage: updated.stage, lossReason: updated.lostReason },
+      });
+      return {
+        id: updated.id,
+        stage: updated.stage,
+        lossReason: updated.lostReason,
+      };
+    });
+  }
+}
diff --git a/src/modules/dashboard/dashboard-service.test.ts b/src/modules/dashboard/dashboard-service.test.ts
index 10f1cb6..8a0a3d7 100644
--- a/src/modules/dashboard/dashboard-service.test.ts
+++ b/src/modules/dashboard/dashboard-service.test.ts
@@ -1,25 +1,40 @@
 import { describe, expect, it } from "vitest";
 
 import {
+  dashboardKpis,
   loadDashboard,
   type DashboardRepository,
   type DashboardSnapshot,
 } from "@/modules/dashboard/dashboard-service";
 import type { AuthorizationContext } from "@/lib/rbac";
 
 const snapshot: DashboardSnapshot = {
   activeCustomers: 2,
+  openLeads: 5,
+  pipelineValueUsd: "250000.00",
+  weightedForecastUsd: "112500.00",
   openQuotes: 3,
   activeOrders: 4,
   dueTasks: 1,
   recentCustomers: [],
+  salesFunnel: [],
+  monthlyOrderTrend: [],
+  leadSources: [],
+  upcomingFollowUps: [],
+  recentLeads: [],
+  recentOrders: [],
+  risks: {
+    overdueFollowUps: 2,
+    highRiskCustomers: 1,
+    staleOpportunities: 3,
+  },
 };
 
 describe("dashboard service", () => {
   it("passes the complete authorization context to the repository", async () => {
     const contexts: AuthorizationContext[] = [];
     const repository: DashboardRepository = {
       loadSnapshot: async (context) => {
         contexts.push(context);
         return snapshot;
       },
@@ -27,10 +42,48 @@ describe("dashboard service", () => {
     const context: AuthorizationContext = {
       userId: "sales-1",
       roles: ["SALES_REP"],
       permissions: ["dashboard.read", "customer.read"],
     };
 
     await expect(loadDashboard(repository, context)).resolves.toBe(snapshot);
     expect(contexts).toEqual([context]);
   });
 });
+
+describe("dashboard KPI selection", () => {
+  it("shows sales pipeline KPIs to sales roles", () => {
+    expect(
+      dashboardKpis(
+        {
+          userId: "sales-1",
+          roles: ["SALES_REP"],
+          permissions: ["dashboard.read"],
+        },
+        snapshot,
+      ),
+    ).toEqual([
+      ["activeCustomers", 2],
+      ["openLeads", 5],
+      ["pipelineValueUsd", "250000.00"],
+      ["weightedForecastUsd", "112500.00"],
+    ]);
+  });
+
+  it("keeps operational KPIs for non-sales roles", () => {
+    expect(
+      dashboardKpis(
+        {
+          userId: "ops-1",
+          roles: ["OPERATIONS"],
+          permissions: ["dashboard.read"],
+        },
+        snapshot,
+      ),
+    ).toEqual([
+      ["activeCustomers", 2],
+      ["openQuotes", 3],
+      ["activeOrders", 4],
+      ["dueTasks", 1],
+    ]);
+  });
+});
diff --git a/src/modules/dashboard/dashboard-service.ts b/src/modules/dashboard/dashboard-service.ts
index c712aeb..b4b6532 100644
--- a/src/modules/dashboard/dashboard-service.ts
+++ b/src/modules/dashboard/dashboard-service.ts
@@ -1,24 +1,77 @@
 export interface DashboardSnapshot {
   activeCustomers: number;
+  openLeads: number;
+  pipelineValueUsd: string;
+  weightedForecastUsd: string;
   openQuotes: number;
   activeOrders: number;
   dueTasks: number;
   recentCustomers: Array<{
     id: string;
     companyName: string;
     countryCode: string;
     createdAt: Date;
   }>;
+  salesFunnel: Array<{ stage: string; count: number; valueUsd: string }>;
+  monthlyOrderTrend: Array<{ month: string; count: number; valueUsd: string }>;
+  leadSources: Array<{ source: string; count: number }>;
+  upcomingFollowUps: Array<{
+    id: string;
+    summary: string;
+    nextActionAt: Date;
+    related: string;
+  }>;
+  recentLeads: Array<{
+    id: string;
+    companyName: string;
+    status: string;
+    createdAt: Date;
+  }>;
+  recentOrders: Array<{
+    id: string;
+    orderNumber: string;
+    status: string;
+    totalUsd: string;
+    createdAt: Date;
+  }>;
+  risks: {
+    overdueFollowUps: number;
+    highRiskCustomers: number;
+    staleOpportunities: number;
+  };
 }
 
 export interface DashboardRepository {
   loadSnapshot(context: AuthorizationContext): Promise<DashboardSnapshot>;
 }
 
 export function loadDashboard(
   repository: DashboardRepository,
   context: AuthorizationContext,
 ) {
   return repository.loadSnapshot(context);
 }
+
+export function dashboardKpis(
+  context: AuthorizationContext,
+  snapshot: DashboardSnapshot,
+) {
+  const salesRole =
+    context.roles?.includes("SALES_REP") ||
+    context.roles?.includes("SALES_MANAGER") ||
+    context.roles?.includes("SUPER_ADMIN");
+  return salesRole
+    ? ([
+        ["activeCustomers", snapshot.activeCustomers],
+        ["openLeads", snapshot.openLeads],
+        ["pipelineValueUsd", snapshot.pipelineValueUsd],
+        ["weightedForecastUsd", snapshot.weightedForecastUsd],
+      ] as const)
+    : ([
+        ["activeCustomers", snapshot.activeCustomers],
+        ["openQuotes", snapshot.openQuotes],
+        ["activeOrders", snapshot.activeOrders],
+        ["dueTasks", snapshot.dueTasks],
+      ] as const);
+}
 import type { AuthorizationContext } from "@/lib/rbac";
diff --git a/src/modules/dashboard/prisma-dashboard-repository.ts b/src/modules/dashboard/prisma-dashboard-repository.ts
index 3a82ea4..bc1e512 100644
--- a/src/modules/dashboard/prisma-dashboard-repository.ts
+++ b/src/modules/dashboard/prisma-dashboard-repository.ts
@@ -1,26 +1,69 @@
+import Decimal from "decimal.js";
+
 import { getPrisma } from "@/lib/prisma";
 import type {
   DashboardRepository,
   DashboardSnapshot,
 } from "@/modules/dashboard/dashboard-service";
 import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
+import { weightedForecast } from "@/modules/crm/crm-domain";
 
 export class PrismaDashboardRepository implements DashboardRepository {
   async loadSnapshot(context: Parameters<DashboardRepository["loadSnapshot"]>[0]): Promise<DashboardSnapshot> {
     const prisma = getPrisma();
     const ownership = dashboardOwnershipFilter(context);
-    const [activeCustomers, openQuotes, activeOrders, dueTasks, recentCustomers] =
+    const ownerId = dashboardOwnershipFilter(context).ownerId;
+    const followUpScope = ownerId
+      ? {
+          OR: [
+            { customer: { ownerId } },
+            { contact: { customer: { ownerId } } },
+            { lead: { ownerId } },
+            { opportunity: { ownerId } },
+          ],
+        }
+      : {};
+    const now = new Date();
+    const twelveMonthsAgo = new Date(now);
+    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11, 1);
+    twelveMonthsAgo.setUTCHours(0, 0, 0, 0);
+    const staleBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
+    const [
+      activeCustomers,
+      openLeads,
+      openQuotes,
+      activeOrders,
+      dueTasks,
+      recentCustomers,
+      funnel,
+      activeOpportunityValues,
+      leadSources,
+      upcomingFollowUps,
+      recentLeads,
+      recentOrders,
+      trendOrders,
+      overdueFollowUps,
+      highRiskCustomers,
+      staleOpportunities,
+    ] =
       await prisma.$transaction([
         prisma.customer.count({
           where: { status: "ACTIVE", deletedAt: null, ...ownership },
         }),
+        prisma.lead.count({
+          where: {
+            status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
+            deletedAt: null,
+            ...ownership,
+          },
+        }),
         prisma.quote.count({
           where: {
             status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
             deletedAt: null,
             ...ownership,
           },
         }),
         prisma.salesOrder.count({
           where: {
             status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
@@ -40,21 +83,166 @@ export class PrismaDashboardRepository implements DashboardRepository {
           where: { deletedAt: null, ...ownership },
           orderBy: { createdAt: "desc" },
           take: 5,
           select: {
             id: true,
             companyName: true,
             countryCode: true,
             createdAt: true,
           },
         }),
+        prisma.opportunity.groupBy({
+          by: ["stage"],
+          where: { deletedAt: null, ...ownership },
+          orderBy: { stage: "asc" },
+          _count: { id: true },
+          _sum: { valueUsd: true },
+        }),
+        prisma.opportunity.findMany({
+          where: {
+            deletedAt: null,
+            stage: { not: "LOST" },
+            ...ownership,
+          },
+          select: { valueUsd: true, probability: true, stage: true },
+        }),
+        prisma.lead.groupBy({
+          by: ["source"],
+          where: { deletedAt: null, ...ownership },
+          _count: { id: true },
+          orderBy: { _count: { source: "desc" } },
+          take: 8,
+        }),
+        prisma.followUp.findMany({
+          where: {
+            deletedAt: null,
+            completedAt: null,
+            nextActionAt: { gte: now },
+            ...followUpScope,
+          },
+          orderBy: { nextActionAt: "asc" },
+          take: 6,
+          include: {
+            customer: { select: { companyName: true } },
+            lead: { select: { companyName: true } },
+            opportunity: { select: { name: true } },
+          },
+        }),
+        prisma.lead.findMany({
+          where: { deletedAt: null, ...ownership },
+          orderBy: { createdAt: "desc" },
+          take: 5,
+          select: { id: true, companyName: true, status: true, createdAt: true },
+        }),
+        prisma.salesOrder.findMany({
+          where: { deletedAt: null, ...ownership },
+          orderBy: { createdAt: "desc" },
+          take: 5,
+          select: {
+            id: true,
+            orderNumber: true,
+            status: true,
+            totalUsd: true,
+            createdAt: true,
+          },
+        }),
+        prisma.salesOrder.findMany({
+          where: {
+            deletedAt: null,
+            createdAt: { gte: twelveMonthsAgo },
+            ...ownership,
+          },
+          select: { createdAt: true, totalUsd: true },
+        }),
+        prisma.followUp.count({
+          where: {
+            deletedAt: null,
+            completedAt: null,
+            nextActionAt: { lt: now },
+            ...followUpScope,
+          },
+        }),
+        prisma.customer.count({
+          where: {
+            deletedAt: null,
+            riskRating: "HIGH",
+            ...ownership,
+          },
+        }),
+        prisma.opportunity.count({
+          where: {
+            deletedAt: null,
+            stage: { notIn: ["WON", "LOST"] },
+            updatedAt: { lt: staleBefore },
+            ...ownership,
+          },
+        }),
       ]);
 
+    const monthly = new Map<string, { count: number; valueUsd: Decimal }>();
+    for (const order of trendOrders) {
+      const month = order.createdAt.toISOString().slice(0, 7);
+      const entry = monthly.get(month) ?? { count: 0, valueUsd: new Decimal(0) };
+      entry.count += 1;
+      entry.valueUsd = entry.valueUsd.plus(order.totalUsd.toString());
+      monthly.set(month, entry);
+    }
+
     return {
       activeCustomers,
+      openLeads,
+      pipelineValueUsd: activeOpportunityValues
+        .reduce((total, item) => total.plus(item.valueUsd.toString()), new Decimal(0))
+        .toFixed(2),
+      weightedForecastUsd: weightedForecast(
+        activeOpportunityValues.map((item) => ({
+          valueUsd: item.valueUsd.toString(),
+          probability: item.probability,
+          stage: item.stage,
+        })),
+      ),
       openQuotes,
       activeOrders,
       dueTasks,
       recentCustomers,
+      salesFunnel: funnel.map((item) => ({
+        stage: item.stage,
+        count: (item._count as { id: number }).id,
+        valueUsd:
+          (item._sum as { valueUsd: Decimal | null }).valueUsd?.toFixed(2) ??
+          "0.00",
+      })),
+      monthlyOrderTrend: [...monthly.entries()]
+        .sort(([left], [right]) => left.localeCompare(right))
+        .map(([month, item]) => ({
+          month,
+          count: item.count,
+          valueUsd: item.valueUsd.toFixed(2),
+        })),
+      leadSources: leadSources.map((item) => ({
+        source: item.source,
+        count: (item._count as { id: number }).id,
+      })),
+      upcomingFollowUps: upcomingFollowUps
+        .filter(
+          (item): item is typeof item & { nextActionAt: Date } =>
+            item.nextActionAt !== null,
+        )
+        .map((item) => ({
+          id: item.id,
+          summary: item.summary,
+          nextActionAt: item.nextActionAt,
+          related:
+            item.customer?.companyName ??
+            item.lead?.companyName ??
+            item.opportunity?.name ??
+            "CRM",
+        })),
+      recentLeads,
+      recentOrders: recentOrders.map((order) => ({
+        ...order,
+        totalUsd: order.totalUsd.toFixed(2),
+      })),
+      risks: { overdueFollowUps, highRiskCustomers, staleOpportunities },
     };
   }
 }
