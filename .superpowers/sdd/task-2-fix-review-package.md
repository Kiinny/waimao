# Commit list
68d03e7 fix: address sales CRM review findings

# Stat
 .superpowers/sdd/task-2-report.md                  |  30 +-
 .../migration.sql                                  |   5 +
 prisma/schema.prisma                               |   4 +-
 src/app/[locale]/(app)/customers/[id]/page.tsx     |  37 ++-
 src/app/[locale]/(app)/customers/page.tsx          |  33 +--
 src/app/[locale]/(app)/dashboard/page.tsx          |  19 +-
 src/app/[locale]/(app)/leads/[id]/page.tsx         |  63 +++--
 src/app/[locale]/(app)/leads/page.tsx              |  76 +++--
 src/app/[locale]/(app)/opportunities/page.tsx      |  17 +-
 src/app/api/opportunities/route.ts                 |   2 +-
 src/app/globals.css                                |  11 +
 src/components/crm/api-mutation-form.tsx           |   7 +-
 src/components/crm/archive-button.tsx              |  53 ++++
 src/components/crm/lead-csv-import.tsx             |  45 ++-
 src/components/crm/lead-table.tsx                  |  92 ++++--
 src/components/crm/opportunity-board.tsx           |  20 +-
 src/i18n/dictionaries.test.ts                      |  11 +
 src/i18n/dictionaries.ts                           | 312 +++++++++++++++++++++
 src/modules/crm/crm-domain.test.ts                 |  66 +++++
 src/modules/crm/crm-domain.ts                      |  64 +++++
 src/modules/crm/crm-service.test.ts                |  25 ++
 src/modules/crm/crm-service.ts                     |  11 +-
 src/modules/crm/prisma-crm-repository.ts           | 109 ++++---
 src/modules/dashboard/dashboard-scope.test.ts      |  45 +++
 src/modules/dashboard/dashboard-scope.ts           |  29 ++
 src/modules/dashboard/dashboard-service.test.ts    |  47 +++-
 src/modules/dashboard/dashboard-service.ts         |  16 +-
 .../dashboard/prisma-dashboard-repository.ts       |  50 ++--
 28 files changed, 1089 insertions(+), 210 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
index 60dec98..1689c14 100644
--- a/.superpowers/sdd/task-2-report.md
+++ b/.superpowers/sdd/task-2-report.md
@@ -2,21 +2,22 @@
 
 ## Status
 
 `DONE_WITH_CONCERNS`
 
 The coherent Sales CRM scope is implemented, verified, and committed. Core server, repository, transaction, UI, validation, audit, i18n, RBAC, migration, and deterministic seed work is complete. The concerns are environment/test-surface limitations listed below rather than known failures in the verified checks.
 
 ## Commits
 
 - `cf9a122` — `feat: implement sales CRM workflows`
-- This report is committed separately so it can name the implementation commit exactly.
+- `b466523` — `docs: record sales CRM verification`
+- The review-fix commit is recorded in the parent handoff because this report is part of that commit.
 
 ## Delivered Features
 
 - Repository-backed, role-scoped dashboard with sales/operational KPI selection, sales funnel, monthly order trend, lead sources, upcoming follow-ups, recent leads/orders, and risk reminders.
 - Leads:
   - Scoped pagination, fuzzy search, country/source/status/owner/date filters.
   - Create, edit, detail, duplicate detection, follow-up timeline, and loading/success/failure UI feedback.
   - Confirmed batch status API/UI and scoped batch owner-assignment API.
   - Transactional conversion to Customer, primary Contact, and Opportunity with audit.
   - CSV parse, preview, row validation, explicit commit, and scoped/filtered export.
@@ -65,28 +66,51 @@ Final fresh gate:
   - Exit `0`; `tsc --noEmit` reported no errors.
 - `pnpm lint`
   - Exit `0`; ESLint reported no errors or warnings.
 - `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`
   - Exit `0`; Prisma Client 7.8.0 generated successfully.
 - `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`
   - Exit `0`; Next.js 16.2.10 production build compiled, typechecked, collected page data, generated 29 routes/pages, and finalized successfully.
 - `git diff --cached --check`
   - Exit `0` before the implementation commit.
 
+## Review Fix Pass
+
+The review findings were addressed with surgical changes:
+
+- Dashboard access now requires `dashboard.read` and an explicit role/domain scope. Sales managers and administrators receive global sales scope, sales representatives receive owner-only sales scope, and operations roles receive operational metrics without CRM aggregates.
+- Converted leads are immutable across edit, batch, and reconversion paths. Conversion atomically claims an unconverted lead, and unique database indexes protect converted Customer and Opportunity identities.
+- Customer timelines include direct, Contact-linked, and Opportunity-linked follow-ups. Follow-up audit metadata records all related entity IDs.
+- Opportunity ownership is inherited from the Customer. Stage updates use the Opportunity version and current stage in a conditional write to reject stale concurrent moves.
+- The CRM UI now exposes Contact and follow-up edit/archive controls, batch owner assignment, converted-lead safeguards, and localized Task 2 forms, dialogs, feedback, pagination, CSV, and board text in English and Chinese.
+- The invalid converted-lead select default was removed.
+
+Review red/green evidence:
+
+- Focused dashboard/CRM tests initially failed 11 tests for the missing access-scope, immutability, relation, ownership, and concurrency behavior; after the fixes, the focused suite passed 34/34 tests.
+- A new KPI permission regression test first failed because `dashboardKpis` did not require `dashboard.read`; after adding the guard it passed.
+
+Final fresh review gate:
+
+- Focused suite: 5 files passed, 40 tests passed, 0 failed.
+- `pnpm test`: 17 files passed, 90 tests passed, 0 failed.
+- `pnpm typecheck`: exit `0`.
+- `pnpm lint`: exit `0`.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`: exit `0`; Prisma Client 7.8.0 generated.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`: exit `0`; Next.js 16.2.10 generated 29 routes/pages.
+
 ## Self-Review
 
 - Ownership is enforced twice: API permissions gate entry and repository predicates restrict identities/aggregates. Representative-supplied `ownerId` filters cannot replace the authenticated owner scope.
 - Foreign lead/opportunity/customer/contact identities return not found at repository boundaries; mutations re-read scoped records before writes.
 - Lead conversion uses one interactive Prisma transaction for Customer, primary Contact, Opportunity, Lead conversion fields, and audit.
 - Opportunity movement checks the current stage again before updating, records audit, and applies terminal probability/timestamps consistently.
 - Follow-ups reject missing relationships, foreign-owned relationships, and mixed-owner relationships.
 - Audit writes occur in the same transaction as their corresponding CRM mutation.
 - Detail tabs use real repository relations and accurate empty states.
 - All Task 2 files were staged explicitly; existing untracked task briefs, progress ledger, review packages, and the pre-existing master plan were not modified or committed.
 
 ## Concerns
 
 - Playwright is not installed or configured in the foundation, and no browser runtime is available through the package scripts; representative E2E coverage was therefore not added or run.
 - A live PostgreSQL service was not available in this workspace. Prisma schema generation and production build were verified, but the new migration and deterministic seed were not applied against a running database.
 - The foundation has no shared Excel export service, so Task 2 delivers CSV import/export only.
-- The lead list exposes confirmed batch status changes in the UI. Owner reassignment is implemented and scoped in the API/repository, but the list UI does not yet provide a user picker.
-- Contact and follow-up update/archive operations are available through scoped APIs; the delivered detail UI emphasizes create/read workflows and does not expose every update/archive control.
diff --git a/prisma/migrations/20260717193000_sales_crm_review_guards/migration.sql b/prisma/migrations/20260717193000_sales_crm_review_guards/migration.sql
new file mode 100644
index 0000000..e8ce164
--- /dev/null
+++ b/prisma/migrations/20260717193000_sales_crm_review_guards/migration.sql
@@ -0,0 +1,5 @@
+CREATE UNIQUE INDEX "Lead_convertedCustomerId_key"
+  ON "Lead"("convertedCustomerId");
+
+CREATE UNIQUE INDEX "Lead_convertedOpportunityId_key"
+  ON "Lead"("convertedOpportunityId");
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 2d07c42..45f08bc 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -282,22 +282,22 @@ model Lead {
   id                     String     @id @default(uuid()) @db.Uuid
   companyName            String
   contactName            String
   email                  String?
   phone                  String?
   countryCode            String
   source                 String
   status                 LeadStatus @default(NEW)
   notes                  String?
   ownerId                String     @db.Uuid
-  convertedCustomerId    String?    @db.Uuid
-  convertedOpportunityId String?    @db.Uuid
+  convertedCustomerId    String?    @unique @db.Uuid
+  convertedOpportunityId String?    @unique @db.Uuid
   version                Int        @default(1)
   createdAt              DateTime   @default(now())
   updatedAt              DateTime   @updatedAt
   deletedAt              DateTime?
   owner                  User       @relation("LeadOwner", fields: [ownerId], references: [id])
   followUps              FollowUp[]
 
   @@index([ownerId, status, deletedAt])
   @@index([countryCode, source])
 }
diff --git a/src/app/[locale]/(app)/customers/[id]/page.tsx b/src/app/[locale]/(app)/customers/[id]/page.tsx
index 78e6e0a..1aece0d 100644
--- a/src/app/[locale]/(app)/customers/[id]/page.tsx
+++ b/src/app/[locale]/(app)/customers/[id]/page.tsx
@@ -1,14 +1,15 @@
 import Link from "next/link";
 import { notFound } from "next/navigation";
 
 import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { ArchiveButton } from "@/components/crm/archive-button";
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { requirePermission } from "@/lib/rbac";
 import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
 
 export const dynamic = "force-dynamic";
 const repository = new PrismaCrmRepository();
 
 function Empty({ text }: { text: string }) {
@@ -16,56 +17,62 @@ function Empty({ text }: { text: string }) {
 }
 
 export default async function CustomerDetailPage({
   params,
 }: {
   params: Promise<{ locale: string; id: string }>;
 }) {
   const { locale, id } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
+  const crm = dictionary.crm;
   const context = await currentAuthorizationContext();
   requirePermission(context, "customer.read");
   const customer = await repository.getCustomerDetail(context, id);
   if (!customer) notFound();
   const tabs = dictionary.crm.tabs;
   const payments = customer.orders.flatMap((order) => order.payments);
   const shipments = customer.orders.flatMap((order) => order.shipments);
 
   return (
     <>
       <header className="page-heading">
         <div><Link className="breadcrumb" href={`/${locale}/customers`}>← {dictionary.crm.customers.title}</Link><h1>{customer.companyName}</h1><p>{customer.countryCode} · {customer.owner.name}</p></div>
-        <div className="status-group"><span className="badge">{customer.status}</span><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></div>
+        <div className="status-group"><span className="badge">{crm.statuses[customer.status]}</span><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{crm.statuses[customer.riskRating as keyof typeof crm.statuses] ?? customer.riskRating}</span></div>
       </header>
-      <nav className="detail-tabs" aria-label="Customer details">
+      <nav className="detail-tabs" aria-label={crm.detail.customerDetails}>
         {Object.entries(tabs).map(([key, label]) => <a href={`#${key}`} key={key}>{label}</a>)}
       </nav>
       <section className="card detail-section" id="overview"><h2>{tabs.overview}</h2>
-        <dl className="detail-grid"><div><dt>Legal name</dt><dd>{customer.legalName || "—"}</dd></div><div><dt>Email</dt><dd>{customer.email || "—"}</dd></div><div><dt>Phone</dt><dd>{customer.phone || "—"}</dd></div><div><dt>Level</dt><dd>{customer.level}</dd></div><div><dt>Risk notes</dt><dd>{customer.riskNotes || "—"}</dd></div></dl>
+        <dl className="detail-grid"><div><dt>{crm.fields.legalName}</dt><dd>{customer.legalName || crm.options.noValue}</dd></div><div><dt>{crm.fields.email}</dt><dd>{customer.email || crm.options.noValue}</dd></div><div><dt>{crm.fields.phone}</dt><dd>{customer.phone || crm.options.noValue}</dd></div><div><dt>{crm.fields.level}</dt><dd>{crm.statuses[customer.level as keyof typeof crm.statuses] ?? customer.level}</dd></div><div><dt>{crm.fields.riskNotes}</dt><dd>{customer.riskNotes || crm.options.noValue}</dd></div></dl>
         <details><summary>{dictionary.crm.edit}</summary><ApiMutationForm endpoint={`/api/customers/${customer.id}`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} method="PATCH" submitLabel={dictionary.crm.save} successMessage={dictionary.crm.success}>
-          <label>Company<input defaultValue={customer.companyName} name="companyName" /></label><label>Email<input defaultValue={customer.email ?? ""} name="email" type="email" /></label>
-          <label>Level<select defaultValue={customer.level} name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
-          <label>Risk<select defaultValue={customer.riskRating} name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
-          <label>Risk notes<textarea defaultValue={customer.riskNotes ?? ""} name="riskNotes" rows={3} /></label>
+          <label>{crm.fields.company}<input defaultValue={customer.companyName} name="companyName" /></label><label>{crm.fields.email}<input defaultValue={customer.email ?? ""} name="email" type="email" /></label>
+          <label>{crm.fields.level}<select defaultValue={customer.level} name="level">{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select></label>
+          <label>{crm.fields.risk}<select defaultValue={customer.riskRating} name="riskRating">{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select></label>
+          <label>{crm.fields.riskNotes}<textarea defaultValue={customer.riskNotes ?? ""} name="riskNotes" rows={3} /></label>
         </ApiMutationForm></details>
       </section>
       <section className="card detail-section" id="contacts"><h2>{tabs.contacts}</h2>
-        {customer.contacts.length ? <div className="record-grid">{customer.contacts.map((contact) => <article className="record-card" key={contact.id}><strong>{contact.firstName} {contact.lastName}</strong>{contact.isPrimary ? <span className="badge">Primary</span> : null}<span>{contact.decisionRole ?? contact.title ?? "Contact"}</span><span>{contact.email ?? contact.phone ?? "No channel"}</span><small>{contact.language} · {contact.timezone ?? "No timezone"}</small></article>)}</div> : <Empty text={dictionary.crm.empty} />}
-        <details><summary>Add contact</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
-          <label>First name<input name="firstName" required /></label><label>Last name<input name="lastName" /></label><label>Email<input name="email" type="email" /></label><label>Phone<input name="phone" /></label>
-          <label>Decision role<select name="decisionRole"><option value="">None</option><option>DECISION_MAKER</option><option>INFLUENCER</option><option>TECHNICAL</option><option>FINANCE</option><option>USER</option></select></label>
-          <label>Language<input defaultValue="en" name="language" /></label><label>Timezone<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> Primary contact</label>
+        {customer.contacts.length ? <div className="record-grid">{customer.contacts.map((contact) => <article className="record-card" key={contact.id}><strong>{contact.firstName} {contact.lastName}</strong>{contact.isPrimary ? <span className="badge">{crm.fields.primary}</span> : null}<span>{contact.decisionRole ? (crm.decisionRoles[contact.decisionRole as keyof typeof crm.decisionRoles] ?? contact.decisionRole) : (contact.title ?? crm.detail.contactFallback)}</span><span>{contact.email ?? contact.phone ?? crm.options.noChannel}</span><small>{contact.language} · {contact.timezone ?? crm.options.noTimezone}</small>
+          <details><summary>{crm.edit}</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts/${contact.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}>
+            <label>{crm.fields.firstName}<input defaultValue={contact.firstName} name="firstName" required /></label><label>{crm.fields.lastName}<input defaultValue={contact.lastName} name="lastName" /></label><label>{crm.fields.email}<input defaultValue={contact.email ?? ""} name="email" type="email" /></label><label>{crm.fields.phone}<input defaultValue={contact.phone ?? ""} name="phone" /></label>
+            <label>{crm.fields.decisionRole}<select defaultValue={contact.decisionRole ?? ""} name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{crm.fields.language}<input defaultValue={contact.language} name="language" /></label><label>{crm.fields.timezone}<input defaultValue={contact.timezone ?? ""} name="timezone" /></label><label><input defaultChecked={contact.isPrimary} name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
+          </ApiMutationForm><ArchiveButton endpoint={`/api/customers/${customer.id}/contacts/${contact.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details>
+        </article>)}</div> : <Empty text={dictionary.crm.empty} />}
+        <details><summary>{crm.actions.addContact}</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
+          <label>{crm.fields.firstName}<input name="firstName" required /></label><label>{crm.fields.lastName}<input name="lastName" /></label><label>{crm.fields.email}<input name="email" type="email" /></label><label>{crm.fields.phone}<input name="phone" /></label>
+          <label>{crm.fields.decisionRole}<select name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
+          <label>{crm.fields.language}<input defaultValue="en" name="language" /></label><label>{crm.fields.timezone}<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
         </ApiMutationForm></details>
       </section>
-      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{item.type} · {item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
-      <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{item.stage}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{crm.followUpTypes[item.type as keyof typeof crm.followUpTypes] ?? item.type} · {crm.channels[item.channel as keyof typeof crm.channels] ?? item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time><details><summary>{crm.edit}</summary><ApiMutationForm endpoint={`/api/follow-ups/${item.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}><label>{crm.fields.summary}<textarea defaultValue={item.summary} name="summary" rows={2} /></label><label>{crm.fields.outcome}<input defaultValue={item.outcome ?? ""} name="outcome" /></label><label>{crm.fields.nextAction}<input defaultValue={item.nextAction ?? ""} name="nextAction" /></label></ApiMutationForm><ArchiveButton endpoint={`/api/follow-ups/${item.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{crm.statuses[item.stage]}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="quotations"><h2>{tabs.quotations}</h2>{customer.quotes.length ? <div className="record-grid">{customer.quotes.map((item) => <article className="record-card" key={item.id}><strong>{item.quoteNumber}</strong><span>{item.status}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="orders"><h2>{tabs.orders}</h2>{customer.orders.length ? <div className="record-grid">{customer.orders.map((item) => <article className="record-card" key={item.id}><strong>{item.orderNumber}</strong><span>{item.status}</span><span>${item.totalUsd.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="payments"><h2>{tabs.payments}</h2>{payments.length ? <div className="record-grid">{payments.map((item) => <article className="record-card" key={item.id}><strong>{item.reference ?? item.id}</strong><span>{item.status}</span><span>{item.currencyCode} {item.amount.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
-      <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? "No tracking"}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? crm.options.noTracking}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="afterSales"><h2>{tabs.afterSales}</h2>{customer.tickets.length ? <div className="record-grid">{customer.tickets.map((item) => <article className="record-card" key={item.id}><strong>{item.ticketNumber}</strong><span>{item.status}</span><span>{item.subject}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="files"><h2>{tabs.files}</h2>{customer.files.length ? <div className="record-grid">{customer.files.map((item) => <article className="record-card" key={item.id}><strong>{item.fileName}</strong><span>{item.contentType}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="activity"><h2>{tabs.activity}</h2>{customer.activity.length ? <ol className="timeline">{customer.activity.map((item) => <li key={item.id}><strong>{item.action}</strong><time>{item.createdAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/customers/page.tsx b/src/app/[locale]/(app)/customers/page.tsx
index 443545a..5db1f04 100644
--- a/src/app/[locale]/(app)/customers/page.tsx
+++ b/src/app/[locale]/(app)/customers/page.tsx
@@ -18,59 +18,60 @@ function value(input: string | string[] | undefined) {
 export default async function CustomersPage({
   params,
   searchParams,
 }: {
   params: Promise<{ locale: string }>;
   searchParams: Promise<Record<string, string | string[] | undefined>>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
+  const crm = dictionary.crm;
   const context = await currentAuthorizationContext();
   requirePermission(context, "customer.read");
   const query = await searchParams;
   const result = await repository.listCustomers(context, {
     page: Number(value(query.page) ?? 1),
     query: value(query.query),
     countryCode: value(query.countryCode),
     status: value(query.status),
     level: value(query.level),
     riskRating: value(query.riskRating),
   });
 
   return (
     <>
       <header className="page-heading"><div><h1>{dictionary.crm.customers.title}</h1><p>{dictionary.crm.customers.subtitle}</p></div></header>
       <form className="card filter-bar" method="get">
-        <input defaultValue={value(query.query)} name="query" placeholder="Company, legal name, email" />
-        <input defaultValue={value(query.countryCode)} maxLength={2} name="countryCode" placeholder="Country" />
-        <select defaultValue={value(query.status) ?? ""} name="status"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select>
-        <select defaultValue={value(query.level) ?? ""} name="level"><option value="">All levels</option><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select>
-        <select defaultValue={value(query.riskRating) ?? ""} name="riskRating"><option value="">All risk</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
+        <input defaultValue={value(query.query)} name="query" placeholder={crm.fields.customerSearch} />
+        <input defaultValue={value(query.countryCode)} maxLength={2} name="countryCode" placeholder={crm.fields.country} />
+        <select defaultValue={value(query.status) ?? ""} name="status"><option value="">{crm.options.allStatuses}</option>{["ACTIVE", "INACTIVE", "ARCHIVED"].map((status) => <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>)}</select>
+        <select defaultValue={value(query.level) ?? ""} name="level"><option value="">{crm.options.allLevels}</option>{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select>
+        <select defaultValue={value(query.riskRating) ?? ""} name="riskRating"><option value="">{crm.options.allRisk}</option>{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select>
         <button className="button" type="submit">{dictionary.crm.search}</button>
       </form>
       <section className="card section-card">
-        <h2 className="section-title">{result.total} customers</h2>
-        {result.items.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Country</th><th>Status</th><th>Level</th><th>Risk</th><th>Owner</th><th>Contacts</th><th>Opportunities</th></tr></thead><tbody>
+        <h2 className="section-title">{crm.pagination.customerCount.replace("{count}", String(result.total))}</h2>
+        {result.items.length ? <div className="table-wrap"><table><thead><tr><th>{crm.fields.company}</th><th>{crm.fields.country}</th><th>{crm.fields.status}</th><th>{crm.fields.level}</th><th>{crm.fields.risk}</th><th>{crm.fields.owner}</th><th>{crm.fields.contacts}</th><th>{crm.fields.opportunities}</th></tr></thead><tbody>
           {result.items.map((customer) => <tr key={customer.id}>
             <td><Link className="table-link" href={`/${locale}/customers/${customer.id}`}>{customer.companyName}</Link></td>
-            <td>{customer.countryCode}</td><td><span className="badge">{customer.status}</span></td><td>{customer.level}</td>
-            <td><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></td>
+            <td>{customer.countryCode}</td><td><span className="badge">{crm.statuses[customer.status]}</span></td><td>{crm.statuses[customer.level as keyof typeof crm.statuses] ?? customer.level}</td>
+            <td><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{crm.statuses[customer.riskRating as keyof typeof crm.statuses] ?? customer.riskRating}</span></td>
             <td>{customer.owner.name}</td><td>{customer._count.contacts}</td><td>{customer._count.opportunities}</td>
           </tr>)}
         </tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
       </section>
       <details className="card section-card">
         <summary>{dictionary.crm.customers.new}</summary>
         <ApiMutationForm endpoint="/api/customers" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
-          <label>Company<input name="companyName" required /></label>
-          <label>Legal name<input name="legalName" /></label>
-          <label>Country<input maxLength={2} name="countryCode" required /></label>
-          <label>Email<input name="email" type="email" /></label>
-          <label>Phone<input name="phone" /></label>
-          <label>Level<select name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
-          <label>Risk<select name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
+          <label>{crm.fields.company}<input name="companyName" required /></label>
+          <label>{crm.fields.legalName}<input name="legalName" /></label>
+          <label>{crm.fields.country}<input maxLength={2} name="countryCode" required /></label>
+          <label>{crm.fields.email}<input name="email" type="email" /></label>
+          <label>{crm.fields.phone}<input name="phone" /></label>
+          <label>{crm.fields.level}<select name="level">{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select></label>
+          <label>{crm.fields.risk}<select name="riskRating">{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select></label>
         </ApiMutationForm>
       </details>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/dashboard/page.tsx b/src/app/[locale]/(app)/dashboard/page.tsx
index 3d94fdc..79c947a 100644
--- a/src/app/[locale]/(app)/dashboard/page.tsx
+++ b/src/app/[locale]/(app)/dashboard/page.tsx
@@ -1,31 +1,33 @@
 import { notFound } from "next/navigation";
 
 import { auth } from "@/auth";
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { dashboardKpis, loadDashboard } from "@/modules/dashboard/dashboard-service";
 import { PrismaDashboardRepository } from "@/modules/dashboard/prisma-dashboard-repository";
+import { dashboardAccessScope } from "@/modules/dashboard/dashboard-scope";
 
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
+  const access = dashboardAccessScope(context);
   const snapshot = await loadDashboard(
     new PrismaDashboardRepository(),
     context,
   );
   const metricLabels = {
     activeCustomers: dictionary.dashboard.customers,
     openLeads: dictionary.dashboard.openLeads,
     pipelineValueUsd: dictionary.dashboard.pipelineValueUsd,
     weightedForecastUsd: dictionary.dashboard.weightedForecastUsd,
     openQuotes: dictionary.dashboard.quotes,
@@ -58,56 +60,57 @@ export default async function DashboardPage({
           <article className="card metric" key={key}>
             <div className="metric-label">{metricLabels[key]}</div>
             <div className="metric-value">
               {typeof value === "string"
                 ? `$${Number(value).toLocaleString(locale)}`
                 : value.toLocaleString(locale)}
             </div>
           </article>
         ))}
       </section>
-      <div className="dashboard-grid">
+      {access.domain === "sales" ? <div className="dashboard-grid">
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.funnel}</h2>
-          {snapshot.salesFunnel.length ? <div className="bar-chart">{snapshot.salesFunnel.map((item) => <div className="bar-row" key={item.stage}><span>{item.stage}</span><div><i style={{ width: `${Math.max(5, item.count / maxFunnel * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
+          {snapshot.salesFunnel.length ? <div className="bar-chart">{snapshot.salesFunnel.map((item) => <div className="bar-row" key={item.stage}><span>{dictionary.crm.statuses[item.stage as keyof typeof dictionary.crm.statuses] ?? item.stage}</span><div><i style={{ width: `${Math.max(5, item.count / maxFunnel * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
         </section>
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.orderTrend}</h2>
           {snapshot.monthlyOrderTrend.length ? <div className="trend-chart">{snapshot.monthlyOrderTrend.map((item) => <div className="trend-column" key={item.month}><div style={{ height: `${Math.max(4, Number(item.valueUsd) / maxTrend * 120)}px` }} /><span>{item.month.slice(5)}</span><small>{item.count}</small></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
         </section>
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.leadSources}</h2>
           {snapshot.leadSources.length ? <ul className="distribution-list">{snapshot.leadSources.map((item) => <li key={item.source}><span>{item.source}</span><strong>{item.count}</strong></li>)}</ul> : <EmptyState title={dictionary.crm.empty} />}
         </section>
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.upcomingFollowUps}</h2>
           {snapshot.upcomingFollowUps.length ? <ol className="timeline compact">{snapshot.upcomingFollowUps.map((item) => <li key={item.id}><strong>{item.related}</strong><p>{item.summary}</p><time>{item.nextActionAt.toLocaleString(locale)}</time></li>)}</ol> : <EmptyState title={dictionary.crm.empty} />}
         </section>
-      </div>
-      <div className="dashboard-grid">
+      </div> : null}
+      <div className={access.domain === "sales" ? "dashboard-grid" : ""}>
+        {access.domain === "sales" ? (
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.recentLeads}</h2>
-          {snapshot.recentLeads.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Status</th><th>Added</th></tr></thead><tbody>{snapshot.recentLeads.map((lead) => <tr key={lead.id}><td>{lead.companyName}</td><td>{lead.status}</td><td>{lead.createdAt.toLocaleDateString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
-        </section>
+          {snapshot.recentLeads.length ? <div className="table-wrap"><table><thead><tr><th>{dictionary.dashboard.table.company}</th><th>{dictionary.dashboard.table.status}</th><th>{dictionary.dashboard.table.added}</th></tr></thead><tbody>{snapshot.recentLeads.map((lead) => <tr key={lead.id}><td>{lead.companyName}</td><td>{dictionary.crm.statuses[lead.status as keyof typeof dictionary.crm.statuses] ?? lead.status}</td><td>{lead.createdAt.toLocaleDateString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
+        </section>) : null}
         <section className="card section-card">
           <h2 className="section-title">{dictionary.dashboard.recentOrders}</h2>
-          {snapshot.recentOrders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Status</th><th>USD</th></tr></thead><tbody>{snapshot.recentOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.status}</td><td>${Number(order.totalUsd).toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
+          {snapshot.recentOrders.length ? <div className="table-wrap"><table><thead><tr><th>{dictionary.dashboard.table.order}</th><th>{dictionary.dashboard.table.status}</th><th>{dictionary.dashboard.table.usd}</th></tr></thead><tbody>{snapshot.recentOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.status}</td><td>${Number(order.totalUsd).toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
         </section>
       </div>
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
           {snapshot.dueTasks || snapshot.risks.overdueFollowUps || snapshot.risks.highRiskCustomers || snapshot.risks.staleOpportunities
-            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks} ${snapshot.risks.overdueFollowUps} overdue follow-ups, ${snapshot.risks.highRiskCustomers} high-risk customers, and ${snapshot.risks.staleOpportunities} stale opportunities.`
+            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks} ${snapshot.risks.overdueFollowUps} ${dictionary.dashboard.risks.overdueFollowUps}, ${snapshot.risks.highRiskCustomers} ${dictionary.dashboard.risks.highRiskCustomers}, ${snapshot.risks.staleOpportunities} ${dictionary.dashboard.risks.staleOpportunities}.`
             : dictionary.dashboard.risks.clear}
         </p>
       </section>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/leads/[id]/page.tsx b/src/app/[locale]/(app)/leads/[id]/page.tsx
index cdab7bb..bc3e83a 100644
--- a/src/app/[locale]/(app)/leads/[id]/page.tsx
+++ b/src/app/[locale]/(app)/leads/[id]/page.tsx
@@ -1,114 +1,125 @@
 import Link from "next/link";
 import { notFound } from "next/navigation";
 
 import { ApiMutationForm } from "@/components/crm/api-mutation-form";
+import { ArchiveButton } from "@/components/crm/archive-button";
 import { EmptyState } from "@/components/empty-state";
 import { getDictionary, isLocale } from "@/i18n/dictionaries";
 import { currentAuthorizationContext } from "@/lib/current-user";
 import { requirePermission } from "@/lib/rbac";
 import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
 
 export const dynamic = "force-dynamic";
 const repository = new PrismaCrmRepository();
 
 export default async function LeadDetailPage({
   params,
 }: {
   params: Promise<{ locale: string; id: string }>;
 }) {
   const { locale, id } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
+  const crm = dictionary.crm;
   const context = await currentAuthorizationContext();
   requirePermission(context, "lead.read");
   const lead = await repository.getLeadDetail(context, id);
   if (!lead) notFound();
 
   return (
     <>
       <header className="page-heading">
         <div>
           <Link className="breadcrumb" href={`/${locale}/leads`}>← {dictionary.crm.leads.title}</Link>
           <h1>{lead.companyName}</h1>
           <p>{lead.contactName} · {lead.countryCode} · {lead.owner.name}</p>
         </div>
-        <span className="badge">{lead.status}</span>
+        <span className="badge">{crm.statuses[lead.status]}</span>
       </header>
       <div className="two-column">
-        <section className="card section-card">
+        {lead.status !== "CONVERTED" ? <section className="card section-card">
           <h2 className="section-title">{dictionary.crm.edit}</h2>
           <ApiMutationForm
             endpoint={`/api/leads/${lead.id}`}
             failureMessage={dictionary.crm.failed}
             loadingLabel={dictionary.crm.loading}
             method="PATCH"
             submitLabel={dictionary.crm.save}
             successMessage={dictionary.crm.success}
           >
-            <label>Company<input defaultValue={lead.companyName} name="companyName" required /></label>
-            <label>Contact<input defaultValue={lead.contactName} name="contactName" required /></label>
-            <label>Email<input defaultValue={lead.email ?? ""} name="email" type="email" /></label>
-            <label>Phone<input defaultValue={lead.phone ?? ""} name="phone" /></label>
-            <label>Status<select defaultValue={lead.status} name="status">
-              {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((status) => <option key={status}>{status}</option>)}
+            <label>{crm.fields.company}<input defaultValue={lead.companyName} name="companyName" required /></label>
+            <label>{crm.fields.contact}<input defaultValue={lead.contactName} name="contactName" required /></label>
+            <label>{crm.fields.email}<input defaultValue={lead.email ?? ""} name="email" type="email" /></label>
+            <label>{crm.fields.phone}<input defaultValue={lead.phone ?? ""} name="phone" /></label>
+            <label>{crm.fields.status}<select defaultValue={lead.status} name="status">
+              {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((status) => <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>)}
             </select></label>
-            <label>Notes<textarea defaultValue={lead.notes ?? ""} name="notes" rows={4} /></label>
+            <label>{crm.fields.notes}<textarea defaultValue={lead.notes ?? ""} name="notes" rows={4} /></label>
           </ApiMutationForm>
-        </section>
+        </section> : null}
         {lead.status !== "CONVERTED" ? (
           <section className="card section-card">
             <h2 className="section-title">{dictionary.crm.leads.convert}</h2>
             <ApiMutationForm
               endpoint={`/api/leads/${lead.id}/convert`}
               failureMessage={dictionary.crm.failed}
               loadingLabel={dictionary.crm.loading}
               numericFields={["probability"]}
               redirectTo={`/${locale}/customers`}
               submitLabel={dictionary.crm.leads.convert}
               successMessage={dictionary.crm.success}
             >
-              <label>Opportunity name<input name="opportunityName" required /></label>
-              <label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
-              <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
-              <label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
-              <label>Probability<input defaultValue="10" max="100" min="0" name="probability" required type="number" /></label>
+              <label>{crm.fields.opportunityName}<input name="opportunityName" required /></label>
+              <label>{crm.fields.value}<input min="0" name="value" required step="0.01" type="number" /></label>
+              <label>{crm.fields.currency}<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
+              <label>{crm.fields.exchangeRate}<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
+              <label>{crm.fields.probability}<input defaultValue="10" max="100" min="0" name="probability" required type="number" /></label>
             </ApiMutationForm>
           </section>
         ) : (
-          <section className="card section-card"><h2>Conversion</h2><p>Customer and opportunity were created in one transaction.</p></section>
+          <section className="card section-card"><h2>{crm.detail.conversion}</h2><p>{crm.feedback.conversionComplete}</p></section>
         )}
       </div>
       <section className="card section-card">
-        <h2 className="section-title">Follow-up timeline</h2>
+        <h2 className="section-title">{crm.detail.followUpTimeline}</h2>
         <ApiMutationForm
           dateFields={["occurredAt", "nextActionAt"]}
           endpoint="/api/follow-ups"
           failureMessage={dictionary.crm.failed}
           loadingLabel={dictionary.crm.loading}
-          submitLabel="Add follow-up"
+          submitLabel={crm.actions.addFollowUp}
           successMessage={dictionary.crm.success}
         >
           <input name="leadId" type="hidden" value={lead.id} />
-          <label>Type<select name="type"><option>CALL</option><option>EMAIL</option><option>MEETING</option><option>NOTE</option></select></label>
-          <label>Channel<select name="channel"><option>PHONE</option><option>EMAIL</option><option>VIDEO</option><option>WHATSAPP</option><option>WECHAT</option></select></label>
-          <label>Summary<textarea name="summary" required rows={3} /></label>
-          <label>Outcome<input name="outcome" /></label>
-          <label>Occurred<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
-          <label>Next action<input name="nextAction" /></label>
-          <label>Next action date<input name="nextActionAt" type="datetime-local" /></label>
+          <label>{crm.fields.type}<select name="type">{["CALL", "EMAIL", "MEETING", "NOTE"].map((type) => <option key={type} value={type}>{crm.followUpTypes[type as keyof typeof crm.followUpTypes]}</option>)}</select></label>
+          <label>{crm.fields.channel}<select name="channel">{["PHONE", "EMAIL", "VIDEO", "WHATSAPP", "WECHAT"].map((channel) => <option key={channel} value={channel}>{crm.channels[channel as keyof typeof crm.channels]}</option>)}</select></label>
+          <label>{crm.fields.summary}<textarea name="summary" required rows={3} /></label>
+          <label>{crm.fields.outcome}<input name="outcome" /></label>
+          <label>{crm.fields.occurred}<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
+          <label>{crm.fields.nextAction}<input name="nextAction" /></label>
+          <label>{crm.fields.nextActionDate}<input name="nextActionAt" type="datetime-local" /></label>
         </ApiMutationForm>
         {lead.followUps.length ? (
           <ol className="timeline">
             {lead.followUps.map((followUp) => (
               <li key={followUp.id}>
-                <strong>{followUp.type} · {followUp.channel}</strong>
+                <strong>{crm.followUpTypes[followUp.type as keyof typeof crm.followUpTypes] ?? followUp.type} · {crm.channels[followUp.channel as keyof typeof crm.channels] ?? followUp.channel}</strong>
                 <p>{followUp.summary}</p>
                 <time>{followUp.occurredAt.toLocaleString(locale)}</time>
+                <details>
+                  <summary>{crm.edit}</summary>
+                  <ApiMutationForm endpoint={`/api/follow-ups/${followUp.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}>
+                    <label>{crm.fields.summary}<textarea defaultValue={followUp.summary} name="summary" required rows={2} /></label>
+                    <label>{crm.fields.outcome}<input defaultValue={followUp.outcome ?? ""} name="outcome" /></label>
+                    <label>{crm.fields.nextAction}<input defaultValue={followUp.nextAction ?? ""} name="nextAction" /></label>
+                  </ApiMutationForm>
+                  <ArchiveButton endpoint={`/api/follow-ups/${followUp.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} />
+                </details>
               </li>
             ))}
           </ol>
         ) : <EmptyState title={dictionary.crm.empty} />}
       </section>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/leads/page.tsx b/src/app/[locale]/(app)/leads/page.tsx
index 46e57fc..b44d74c 100644
--- a/src/app/[locale]/(app)/leads/page.tsx
+++ b/src/app/[locale]/(app)/leads/page.tsx
@@ -19,20 +19,21 @@ function value(input: string | string[] | undefined) {
 export default async function LeadsPage({
   params,
   searchParams,
 }: {
   params: Promise<{ locale: string }>;
   searchParams: Promise<Record<string, string | string[] | undefined>>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
+  const crm = dictionary.crm;
   const context = await currentAuthorizationContext();
   requirePermission(context, "lead.read");
   const query = await searchParams;
   const filters = {
     page: Number(value(query.page) ?? 1),
     pageSize: 20,
     query: value(query.query),
     countryCode: value(query.countryCode),
     source: value(query.source),
     status: value(query.status),
@@ -55,78 +56,107 @@ export default async function LeadsPage({
         <div>
           <h1>{dictionary.crm.leads.title}</h1>
           <p>{dictionary.crm.leads.subtitle}</p>
         </div>
         <Link className="button button-secondary" href={`/api/leads/export?${exportQuery}`}>
           {dictionary.crm.leads.export}
         </Link>
       </header>
 
       <form className="card filter-bar" method="get">
-        <input defaultValue={filters.query} name="query" placeholder="Company, contact, email, phone" />
-        <input defaultValue={filters.countryCode} maxLength={2} name="countryCode" placeholder="Country" />
-        <input defaultValue={filters.source} name="source" placeholder="Source" />
+        <input defaultValue={filters.query} name="query" placeholder={crm.fields.companySearch} />
+        <input defaultValue={filters.countryCode} maxLength={2} name="countryCode" placeholder={crm.fields.country} />
+        <input defaultValue={filters.source} name="source" placeholder={crm.fields.source} />
         <select defaultValue={filters.status ?? ""} name="status">
-          <option value="">All statuses</option>
-          <option value="NEW">New</option>
-          <option value="CONTACTED">Contacted</option>
-          <option value="QUALIFIED">Qualified</option>
-          <option value="CONVERTED">Converted</option>
-          <option value="LOST">Lost</option>
+          <option value="">{crm.options.allStatuses}</option>
+          {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"].map((status) => (
+            <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>
+          ))}
         </select>
-        <input defaultValue={value(query.createdFrom)} name="createdFrom" type="date" />
-        <input defaultValue={value(query.createdTo)} name="createdTo" type="date" />
+        <input aria-label={crm.fields.createdFrom} defaultValue={value(query.createdFrom)} name="createdFrom" type="date" />
+        <input aria-label={crm.fields.createdTo} defaultValue={value(query.createdTo)} name="createdTo" type="date" />
         <button className="button" type="submit">{dictionary.crm.search}</button>
       </form>
 
       <section className="card section-card">
         <div className="section-heading">
-          <h2 className="section-title">{result.total} leads</h2>
-          <span>Page {result.page} / {Math.max(1, result.pageCount)}</span>
+          <h2 className="section-title">{crm.pagination.leadCount.replace("{count}", String(result.total))}</h2>
+          <span>{crm.pagination.page.replace("{page}", String(result.page)).replace("{total}", String(Math.max(1, result.pageCount)))}</span>
         </div>
         <LeadTable
           emptyText={dictionary.crm.empty}
+          canAssign={context.roles?.some((role) => ["SALES_MANAGER", "SUPER_ADMIN"].includes(role)) === true}
+          labels={{
+            selected: crm.feedback.selected,
+            confirmBatch: crm.feedback.confirmBatch,
+            updating: crm.feedback.updating,
+            applyStatus: crm.actions.applyStatus,
+            assignOwner: crm.actions.assignOwner,
+            selectOwner: crm.options.selectOwner,
+            batchUpdated: crm.feedback.batchUpdated,
+            batchFailed: crm.feedback.batchFailed,
+            select: crm.options.none,
+            company: crm.fields.company,
+            contact: crm.fields.contact,
+            country: crm.fields.country,
+            source: crm.fields.source,
+            status: crm.fields.status,
+            owner: crm.fields.owner,
+            added: crm.fields.added,
+            statuses: crm.statuses,
+          }}
           leads={result.items.map((lead) => ({
             id: lead.id,
             companyName: lead.companyName,
             contactName: lead.contactName,
             countryCode: lead.countryCode,
             source: lead.source,
             status: lead.status,
+            ownerId: lead.owner.id,
             ownerName: lead.owner.name,
             createdAt: lead.createdAt.toISOString(),
           }))}
           locale={locale}
         />
         <div className="pagination">
-          {result.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page - 1) })}`}>Previous</Link> : <span />}
-          {result.page < result.pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page + 1) })}`}>Next</Link> : null}
+          {result.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page - 1) })}`}>{crm.pagination.previous}</Link> : <span />}
+          {result.page < result.pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page + 1) })}`}>{crm.pagination.next}</Link> : null}
         </div>
       </section>
 
       <div className="two-column">
         <details className="card section-card">
           <summary>{dictionary.crm.leads.new}</summary>
           <ApiMutationForm
             endpoint="/api/leads"
             failureMessage={dictionary.crm.failed}
             loadingLabel={dictionary.crm.loading}
             submitLabel={dictionary.crm.create}
             successMessage={dictionary.crm.success}
           >
-            <label>Company<input name="companyName" required /></label>
-            <label>Contact<input name="contactName" required /></label>
-            <label>Email<input name="email" type="email" /></label>
-            <label>Phone<input name="phone" /></label>
-            <label>Country<input maxLength={2} name="countryCode" required /></label>
-            <label>Source<input name="source" required /></label>
-            <label>Notes<textarea name="notes" rows={3} /></label>
+            <label>{crm.fields.company}<input name="companyName" required /></label>
+            <label>{crm.fields.contact}<input name="contactName" required /></label>
+            <label>{crm.fields.email}<input name="email" type="email" /></label>
+            <label>{crm.fields.phone}<input name="phone" /></label>
+            <label>{crm.fields.country}<input maxLength={2} name="countryCode" required /></label>
+            <label>{crm.fields.source}<input name="source" required /></label>
+            <label>{crm.fields.notes}<textarea name="notes" rows={3} /></label>
           </ApiMutationForm>
         </details>
         <details className="card section-card">
           <summary>{dictionary.crm.leads.import}</summary>
-          <LeadCsvImport />
+          <LeadCsvImport labels={{
+            label: crm.csv.label,
+            placeholder: crm.csv.placeholder,
+            checking: crm.actions.checking,
+            preview: crm.actions.preview,
+            commit: crm.actions.commit,
+            imported: crm.feedback.imported,
+            importFailed: crm.feedback.importFailed,
+            validRows: crm.feedback.validRows,
+            rowError: crm.feedback.rowError,
+          }} />
         </details>
       </div>
     </>
   );
 }
diff --git a/src/app/[locale]/(app)/opportunities/page.tsx b/src/app/[locale]/(app)/opportunities/page.tsx
index b3c46fc..eb6b6d2 100644
--- a/src/app/[locale]/(app)/opportunities/page.tsx
+++ b/src/app/[locale]/(app)/opportunities/page.tsx
@@ -12,51 +12,58 @@ export const dynamic = "force-dynamic";
 const repository = new PrismaCrmRepository();
 
 export default async function OpportunitiesPage({
   params,
 }: {
   params: Promise<{ locale: string }>;
 }) {
   const { locale } = await params;
   if (!isLocale(locale)) notFound();
   const dictionary = getDictionary(locale);
+  const crm = dictionary.crm;
   const context = await currentAuthorizationContext();
   requirePermission(context, "opportunity.read");
   const [result, customers] = await Promise.all([
     repository.listOpportunities(context, { pageSize: 100 }),
     repository.listCustomers(context, { pageSize: 100 }),
   ]);
   const forecast = weightedForecast(
     result.items.map((item) => ({
       valueUsd: item.valueUsd.toString(),
       probability: item.probability,
       stage: item.stage,
     })),
   );
 
   return (
     <>
       <header className="page-heading">
         <div><h1>{dictionary.crm.opportunities.title}</h1><p>{dictionary.crm.opportunities.subtitle}</p></div>
         <article className="card forecast-card"><span>{dictionary.crm.opportunities.forecast}</span><strong>${Number(forecast).toLocaleString(locale)}</strong></article>
       </header>
-      <OpportunityBoard opportunities={result.items.map((item) => ({
+      <OpportunityBoard labels={{
+        stagePrompt: crm.feedback.stagePrompt,
+        stageFailed: crm.feedback.stageFailed,
+        stageMoved: crm.feedback.stageMoved,
+        moving: crm.feedback.moving,
+        stages: crm.statuses,
+      }} opportunities={result.items.map((item) => ({
         id: item.id,
         name: item.name,
         stage: item.stage,
         valueUsd: item.valueUsd.toString(),
         probability: item.probability,
         customerName: item.customer.companyName,
         ownerName: item.owner.name,
       }))} />
       <details className="card section-card">
         <summary>{dictionary.crm.opportunities.new}</summary>
         <ApiMutationForm dateFields={["expectedCloseAt"]} endpoint="/api/opportunities" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} numericFields={["probability"]} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
-          <label>Customer<select name="customerId" required><option value="">Select customer</option>{customers.items.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
-          <label>Name<input name="name" required /></label><label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
-          <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" /></label><label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
-          <label>Probability<input defaultValue="10" max="100" min="0" name="probability" type="number" /></label><label>Expected close<input name="expectedCloseAt" type="datetime-local" /></label>
+          <label>{crm.fields.customer}<select name="customerId" required><option value="">{crm.options.selectCustomer}</option>{customers.items.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
+          <label>{crm.fields.name}<input name="name" required /></label><label>{crm.fields.value}<input min="0" name="value" required step="0.01" type="number" /></label>
+          <label>{crm.fields.currency}<input defaultValue="USD" maxLength={3} name="currencyCode" /></label><label>{crm.fields.exchangeRate}<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
+          <label>{crm.fields.probability}<input defaultValue="10" max="100" min="0" name="probability" type="number" /></label><label>{crm.fields.expectedClose}<input name="expectedCloseAt" type="datetime-local" /></label>
         </ApiMutationForm>
       </details>
     </>
   );
 }
diff --git a/src/app/api/opportunities/route.ts b/src/app/api/opportunities/route.ts
index 452b334..05ae200 100644
--- a/src/app/api/opportunities/route.ts
+++ b/src/app/api/opportunities/route.ts
@@ -20,18 +20,18 @@ export async function GET(request: Request) {
 }
 
 export async function POST(request: Request) {
   try {
     const context = await currentAuthorizationContext();
     requirePermission(context, "opportunity.create");
     const input = opportunitySchema.parse(await request.json());
     return success(
       await repository.createOpportunity(context, {
         ...input,
-        ownerId: input.ownerId ?? context.userId,
+        ownerId: input.ownerId,
       }),
       201,
     );
   } catch (error) {
     return failure(error);
   }
 }
diff --git a/src/app/globals.css b/src/app/globals.css
index eaffa0e..fed7426 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -300,20 +300,31 @@ th {
   cursor: wait;
   opacity: 0.6;
 }
 
 .button-secondary {
   border: 1px solid var(--border);
   background: var(--surface);
   color: var(--foreground);
 }
 
+.button-danger {
+  background: #b42318;
+}
+
+.inline-action {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  margin-top: 10px;
+}
+
 .section-heading,
 .status-group,
 .form-actions,
 .batch-bar,
 .pagination {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 12px;
 }
diff --git a/src/components/crm/api-mutation-form.tsx b/src/components/crm/api-mutation-form.tsx
index ca6dee7..b165b9f 100644
--- a/src/components/crm/api-mutation-form.tsx
+++ b/src/components/crm/api-mutation-form.tsx
@@ -54,33 +54,32 @@ export function ApiMutationForm({
     }
 
     try {
       const response = await fetch(endpoint, {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(body),
       });
       const result = (await response.json()) as {
         success: boolean;
-        error?: { message?: string };
       };
       if (!response.ok || !result.success) {
-        throw new Error(result.error?.message || failureMessage);
+        throw new Error(failureMessage);
       }
       setState("success");
       setMessage(successMessage);
       if (method === "POST") form.reset();
       if (redirectTo) router.push(redirectTo);
       router.refresh();
-    } catch (error) {
+    } catch {
       setState("error");
-      setMessage(error instanceof Error ? error.message : failureMessage);
+      setMessage(failureMessage);
     }
   }
 
   return (
     <form className={className ?? "crm-form"} onSubmit={submit}>
       {children}
       <button className="button" disabled={state === "loading"} type="submit">
         {state === "loading" ? loadingLabel : submitLabel}
       </button>
       {message ? (
diff --git a/src/components/crm/archive-button.tsx b/src/components/crm/archive-button.tsx
new file mode 100644
index 0000000..08a6825
--- /dev/null
+++ b/src/components/crm/archive-button.tsx
@@ -0,0 +1,53 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+export function ArchiveButton({
+  endpoint,
+  labels,
+}: {
+  endpoint: string;
+  labels: {
+    archive: string;
+    archiving: string;
+    confirm: string;
+    success: string;
+    failure: string;
+  };
+}) {
+  const router = useRouter();
+  const [busy, setBusy] = useState(false);
+  const [feedback, setFeedback] = useState("");
+
+  async function archive() {
+    if (!window.confirm(labels.confirm)) return;
+    setBusy(true);
+    setFeedback("");
+    try {
+      const response = await fetch(endpoint, { method: "DELETE" });
+      const result = (await response.json()) as { success: boolean };
+      if (!response.ok || !result.success) throw new Error(labels.failure);
+      setFeedback(labels.success);
+      router.refresh();
+    } catch {
+      setFeedback(labels.failure);
+    } finally {
+      setBusy(false);
+    }
+  }
+
+  return (
+    <div className="inline-action">
+      <button
+        className="button button-danger"
+        disabled={busy}
+        onClick={archive}
+        type="button"
+      >
+        {busy ? labels.archiving : labels.archive}
+      </button>
+      {feedback ? <span role="status">{feedback}</span> : null}
+    </div>
+  );
+}
diff --git a/src/components/crm/lead-csv-import.tsx b/src/components/crm/lead-csv-import.tsx
index 7dba743..3e662fd 100644
--- a/src/components/crm/lead-csv-import.tsx
+++ b/src/components/crm/lead-csv-import.tsx
@@ -1,16 +1,30 @@
 "use client";
 
 import { useRouter } from "next/navigation";
 import { useState } from "react";
 
-export function LeadCsvImport() {
+export function LeadCsvImport({
+  labels,
+}: {
+  labels: {
+    label: string;
+    placeholder: string;
+    checking: string;
+    preview: string;
+    commit: string;
+    imported: string;
+    importFailed: string;
+    validRows: string;
+    rowError: string;
+  };
+}) {
   const router = useRouter();
   const [csv, setCsv] = useState("");
   const [preview, setPreview] = useState<{
     totalRows: number;
     validRows: unknown[];
     errors: Array<{ row: number; issues: string[] }>;
   } | null>(null);
   const [feedback, setFeedback] = useState("");
   const [busy, setBusy] = useState(false);
 
@@ -22,59 +36,70 @@ export function LeadCsvImport() {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ csv, commit }),
       });
       const result = (await response.json()) as {
         success: boolean;
         data?: typeof preview & { imported?: number };
         error?: { message?: string };
       };
       if (!response.ok || !result.success || !result.data) {
-        throw new Error(result.error?.message ?? "CSV import failed");
+        throw new Error(labels.importFailed);
       }
       if (commit) {
-        setFeedback(`${result.data.imported ?? 0} leads imported.`);
+        setFeedback(
+          labels.imported.replace(
+            "{count}",
+            String(result.data.imported ?? 0),
+          ),
+        );
         setCsv("");
         setPreview(null);
         router.refresh();
       } else {
         setPreview(result.data);
       }
     } catch (error) {
-      setFeedback(error instanceof Error ? error.message : "CSV import failed");
+      setFeedback(error instanceof Error ? error.message : labels.importFailed);
     } finally {
       setBusy(false);
     }
   }
 
   return (
     <div className="crm-form">
       <textarea
-        aria-label="Lead CSV"
+        aria-label={labels.label}
         onChange={(event) => {
           setCsv(event.target.value);
           setPreview(null);
         }}
-        placeholder="companyName,contactName,email,phone,countryCode,source"
+        placeholder={labels.placeholder}
         rows={5}
         value={csv}
       />
       <div className="form-actions">
         <button className="button button-secondary" disabled={!csv || busy} onClick={() => request(false)} type="button">
-          {busy ? "Checking…" : "Preview and validate"}
+          {busy ? labels.checking : labels.preview}
         </button>
         {preview && preview.errors.length === 0 ? (
           <button className="button" disabled={busy} onClick={() => request(true)} type="button">
-            Commit {preview.validRows.length} rows
+            {labels.commit} {preview.validRows.length}
           </button>
         ) : null}
       </div>
       {preview ? (
         <p role="status">
-          {preview.validRows.length} valid / {preview.totalRows} total.
-          {preview.errors.map((error) => ` Row ${error.row}: ${error.issues.join(", ")}.`)}
+          {labels.validRows
+            .replace("{valid}", String(preview.validRows.length))
+            .replace("{total}", String(preview.totalRows))}
+          {preview.errors.map((error) =>
+            ` ${labels.rowError
+              .replace("{row}", String(error.row))
+              .replace("{issues}", error.issues.join(", "))}`,
+          )}
         </p>
       ) : null}
       {feedback ? <p role="status">{feedback}</p> : null}
     </div>
   );
 }
diff --git a/src/components/crm/lead-table.tsx b/src/components/crm/lead-table.tsx
index 23e363c..f062ba7 100644
--- a/src/components/crm/lead-table.tsx
+++ b/src/components/crm/lead-table.tsx
@@ -4,119 +4,163 @@ import Link from "next/link";
 import { useRouter } from "next/navigation";
 import { useState } from "react";
 
 interface LeadRow {
   id: string;
   companyName: string;
   contactName: string;
   countryCode: string;
   source: string;
   status: string;
+  ownerId: string;
   ownerName: string;
   createdAt: string;
 }
 
 export function LeadTable({
   locale,
   leads,
   emptyText,
+  canAssign,
+  labels,
 }: {
   locale: string;
   leads: LeadRow[];
   emptyText: string;
+  canAssign: boolean;
+  labels: {
+    selected: string;
+    confirmBatch: string;
+    updating: string;
+    applyStatus: string;
+    assignOwner: string;
+    selectOwner: string;
+    batchUpdated: string;
+    batchFailed: string;
+    select: string;
+    company: string;
+    contact: string;
+    country: string;
+    source: string;
+    status: string;
+    owner: string;
+    added: string;
+    statuses: Record<string, string>;
+  };
 }) {
   const router = useRouter();
   const [selected, setSelected] = useState<string[]>([]);
   const [status, setStatus] = useState("CONTACTED");
+  const [ownerId, setOwnerId] = useState("");
   const [feedback, setFeedback] = useState("");
   const [saving, setSaving] = useState(false);
 
-  async function batchUpdate() {
+  const owners = [
+    ...new Map(
+      leads.map((lead) => [lead.ownerId, { id: lead.ownerId, name: lead.ownerName }]),
+    ).values(),
+  ];
+
+  async function batchUpdate(input: { status?: string; ownerId?: string }) {
     if (!selected.length) return;
-    if (!window.confirm(`Update ${selected.length} selected lead(s)?`)) return;
+    if (
+      !window.confirm(
+        labels.confirmBatch.replace("{count}", String(selected.length)),
+      )
+    ) return;
     setSaving(true);
     setFeedback("");
     try {
       const response = await fetch("/api/leads/batch", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
-        body: JSON.stringify({ ids: selected, status, confirmed: true }),
+        body: JSON.stringify({ ids: selected, ...input, confirmed: true }),
       });
       const result = (await response.json()) as {
         success: boolean;
-        error?: { message?: string };
       };
       if (!response.ok || !result.success) {
-        throw new Error(result.error?.message ?? "Batch update failed");
+        throw new Error(labels.batchFailed);
       }
-      setFeedback("Selected leads updated.");
+      setFeedback(labels.batchUpdated);
       setSelected([]);
       router.refresh();
     } catch (error) {
-      setFeedback(error instanceof Error ? error.message : "Batch update failed");
+      setFeedback(error instanceof Error ? error.message : labels.batchFailed);
     } finally {
       setSaving(false);
     }
   }
 
   if (!leads.length) return <div className="empty-state">{emptyText}</div>;
   return (
     <>
       <div className="batch-bar">
-        <strong>{selected.length} selected</strong>
+        <strong>{selected.length} {labels.selected}</strong>
         <select value={status} onChange={(event) => setStatus(event.target.value)}>
-          <option value="NEW">New</option>
-          <option value="CONTACTED">Contacted</option>
-          <option value="QUALIFIED">Qualified</option>
-          <option value="LOST">Lost</option>
+          {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((value) => (
+            <option key={value} value={value}>{labels.statuses[value]}</option>
+          ))}
         </select>
-        <button className="button button-secondary" disabled={!selected.length || saving} onClick={batchUpdate} type="button">
-          {saving ? "Updating…" : "Apply status"}
+        <button className="button button-secondary" disabled={!selected.length || saving} onClick={() => batchUpdate({ status })} type="button">
+          {saving ? labels.updating : labels.applyStatus}
         </button>
+        {canAssign ? (
+          <>
+            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
+              <option value="">{labels.selectOwner}</option>
+              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
+            </select>
+            <button className="button button-secondary" disabled={!selected.length || !ownerId || saving} onClick={() => batchUpdate({ ownerId })} type="button">
+              {saving ? labels.updating : labels.assignOwner}
+            </button>
+          </>
+        ) : null}
         {feedback ? <span role="status">{feedback}</span> : null}
       </div>
       <div className="table-wrap">
         <table>
           <thead>
             <tr>
-              <th aria-label="Select" />
-              <th>Company</th>
-              <th>Contact</th>
-              <th>Country</th>
-              <th>Source</th>
-              <th>Status</th>
-              <th>Owner</th>
-              <th>Added</th>
+              <th aria-label={labels.select} />
+              <th>{labels.company}</th>
+              <th>{labels.contact}</th>
+              <th>{labels.country}</th>
+              <th>{labels.source}</th>
+              <th>{labels.status}</th>
+              <th>{labels.owner}</th>
+              <th>{labels.added}</th>
             </tr>
           </thead>
           <tbody>
             {leads.map((lead) => (
               <tr key={lead.id}>
                 <td>
                   <input
-                    aria-label={`Select ${lead.companyName}`}
+                    aria-label={`${labels.select} ${lead.companyName}`}
                     checked={selected.includes(lead.id)}
+                    disabled={lead.status === "CONVERTED"}
                     onChange={(event) =>
                       setSelected((current) =>
                         event.target.checked
                           ? [...current, lead.id]
                           : current.filter((id) => id !== lead.id),
                       )
                     }
                     type="checkbox"
                   />
                 </td>
                 <td><Link className="table-link" href={`/${locale}/leads/${lead.id}`}>{lead.companyName}</Link></td>
                 <td>{lead.contactName}</td>
                 <td>{lead.countryCode}</td>
                 <td>{lead.source}</td>
-                <td><span className="badge">{lead.status}</span></td>
+                <td><span className="badge">{labels.statuses[lead.status] ?? lead.status}</span></td>
                 <td>{lead.ownerName}</td>
                 <td>{new Date(lead.createdAt).toLocaleDateString(locale)}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     </>
   );
 }
diff --git a/src/components/crm/opportunity-board.tsx b/src/components/crm/opportunity-board.tsx
index 7a9982c..dee0c14 100644
--- a/src/components/crm/opportunity-board.tsx
+++ b/src/components/crm/opportunity-board.tsx
@@ -17,81 +17,89 @@ interface OpportunityCard {
   name: string;
   stage: string;
   valueUsd: string;
   probability: number;
   customerName: string;
   ownerName: string;
 }
 
 export function OpportunityBoard({
   opportunities,
+  labels,
 }: {
   opportunities: OpportunityCard[];
+  labels: {
+    stagePrompt: string;
+    stageFailed: string;
+    stageMoved: string;
+    moving: string;
+    stages: Record<string, string>;
+  };
 }) {
   const router = useRouter();
   const [feedback, setFeedback] = useState("");
   const [moving, setMoving] = useState("");
 
   async function move(id: string, stage: string) {
     const current = opportunities.find((item) => item.id === id);
     if (!current || current.stage === stage) return;
     const lossReason =
       stage === "LOST"
-        ? window.prompt("Loss reason (required)")
+        ? window.prompt(labels.stagePrompt)
         : undefined;
     if (stage === "LOST" && !lossReason?.trim()) return;
     setMoving(id);
     setFeedback("");
     try {
       const response = await fetch(`/api/opportunities/${id}/stage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ stage, lossReason }),
       });
       const result = (await response.json()) as {
         success: boolean;
         error?: { message?: string };
       };
       if (!response.ok || !result.success) {
-        throw new Error(result.error?.message ?? "Stage update failed");
+        throw new Error(labels.stageFailed);
       }
-      setFeedback("Opportunity moved.");
+      setFeedback(labels.stageMoved);
       router.refresh();
     } catch (error) {
-      setFeedback(error instanceof Error ? error.message : "Stage update failed");
+      setFeedback(error instanceof Error ? error.message : labels.stageFailed);
     } finally {
       setMoving("");
     }
   }
 
   return (
     <>
       {feedback ? <p className="form-feedback" role="status">{feedback}</p> : null}
       <div className="kanban">
         {stages.map((stage) => (
           <section
             className="kanban-column"
             key={stage}
             onDragOver={(event) => event.preventDefault()}
             onDrop={(event) => move(event.dataTransfer.getData("text/plain"), stage)}
           >
-            <h2>{stage.replaceAll("_", " ")}</h2>
+            <h2>{labels.stages[stage]}</h2>
             {opportunities.filter((item) => item.stage === stage).map((item) => (
               <article
                 className="opportunity-card"
                 draggable
                 key={item.id}
                 onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
               >
                 <strong>{item.name}</strong>
                 <span>{item.customerName}</span>
                 <span>${Number(item.valueUsd).toLocaleString()} · {item.probability}%</span>
                 <span>{item.ownerName}</span>
-                {moving === item.id ? <small>Moving…</small> : null}
+                {moving === item.id ? <small>{labels.moving}</small> : null}
               </article>
             ))}
           </section>
         ))}
       </div>
     </>
   );
 }
diff --git a/src/i18n/dictionaries.test.ts b/src/i18n/dictionaries.test.ts
index 9e91a7b..ebd50d7 100644
--- a/src/i18n/dictionaries.test.ts
+++ b/src/i18n/dictionaries.test.ts
@@ -35,11 +35,22 @@ describe("locale dictionaries", () => {
     expect(dictionary.dashboard.metricsLabel).toBe(
       "\u4e1a\u52a1\u6307\u6807",
     );
   });
 
   it("keeps English punctuation readable", () => {
     expect(getDictionary("en").search.placeholder).toBe(
       "Search customers, orders, quotes\u2026",
     );
   });
+
+  it("localizes Task 2 forms, dialogs, feedback, pagination, and boards", () => {
+    const dictionary = getDictionary("zh").crm;
+
+    expect(dictionary.fields.opportunityName).toBe("\u5546\u673a\u540d\u79f0");
+    expect(dictionary.actions.assignOwner).toBe("\u5206\u914d\u8d1f\u8d23\u4eba");
+    expect(dictionary.feedback.archiveConfirm).toContain("\u5f52\u6863");
+    expect(dictionary.pagination.previous).toBe("\u4e0a\u4e00\u9875");
+    expect(dictionary.statuses.NEGOTIATION).toBe("\u8c08\u5224");
+    expect(dictionary.channels.WECHAT).toBe("\u5fae\u4fe1");
+  });
 });
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index 853a636..3d13c50 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -52,38 +52,194 @@ const dictionaries = {
       leadSources: "Lead sources",
       upcomingFollowUps: "Upcoming follow-ups",
       recentLeads: "Recent leads",
       recentOrders: "Recent orders",
       recent: "Recently added customers",
       empty: "No customers have been added yet.",
       table: {
         company: "Company",
         country: "Country",
         added: "Added",
+        createdFrom: "Created from",
+        createdTo: "Created to",
+        order: "Order",
+        status: "Status",
+        usd: "USD",
       },
       risks: {
         title: "Notifications and risks",
         clear: "No urgent risks need your attention.",
         overdueTasks: "overdue tasks require attention.",
+        overdueFollowUps: "overdue follow-ups",
+        highRiskCustomers: "high-risk customers",
+        staleOpportunities: "stale opportunities",
       },
     },
     crm: {
       create: "Create",
       save: "Save changes",
       edit: "Edit",
       view: "View",
       search: "Search",
       filters: "Filters",
       empty: "No records match the current scope and filters.",
       loading: "Saving…",
       success: "Saved successfully.",
       failed: "The change could not be saved.",
+      actions: {
+        addContact: "Add contact",
+        addFollowUp: "Add follow-up",
+        archive: "Archive",
+        archiving: "Archiving…",
+        assignOwner: "Assign owner",
+        applyStatus: "Apply status",
+        preview: "Preview and validate",
+        checking: "Checking…",
+        commit: "Commit",
+      },
+      fields: {
+        company: "Company",
+        companySearch: "Company, contact, email, phone",
+        customerSearch: "Company, legal name, email",
+        contact: "Contact",
+        firstName: "First name",
+        lastName: "Last name",
+        legalName: "Legal name",
+        email: "Email",
+        phone: "Phone",
+        country: "Country",
+        source: "Source",
+        status: "Status",
+        owner: "Owner",
+        added: "Added",
+        createdFrom: "Created from",
+        createdTo: "Created to",
+        notes: "Notes",
+        level: "Level",
+        risk: "Risk",
+        riskNotes: "Risk notes",
+        contacts: "Contacts",
+        opportunities: "Opportunities",
+        decisionRole: "Decision role",
+        language: "Language",
+        timezone: "Timezone",
+        primary: "Primary contact",
+        customer: "Customer",
+        name: "Name",
+        value: "Value",
+        currency: "Currency",
+        exchangeRate: "USD exchange rate",
+        probability: "Probability",
+        expectedClose: "Expected close",
+        opportunityName: "Opportunity name",
+        type: "Type",
+        channel: "Channel",
+        summary: "Summary",
+        outcome: "Outcome",
+        occurred: "Occurred",
+        nextAction: "Next action",
+        nextActionDate: "Next action date",
+        order: "Order",
+        amountUsd: "USD",
+      },
+      options: {
+        allStatuses: "All statuses",
+        allLevels: "All levels",
+        allRisk: "All risk ratings",
+        selectCustomer: "Select customer",
+        selectOwner: "Select owner",
+        none: "None",
+        noChannel: "No channel",
+        noTimezone: "No timezone",
+        noTracking: "No tracking",
+        noValue: "—",
+      },
+      statuses: {
+        NEW: "New",
+        CONTACTED: "Contacted",
+        QUALIFIED: "Qualified",
+        CONVERTED: "Converted",
+        LOST: "Lost",
+        ACTIVE: "Active",
+        INACTIVE: "Inactive",
+        ARCHIVED: "Archived",
+        STANDARD: "Standard",
+        KEY: "Key",
+        STRATEGIC: "Strategic",
+        LOW: "Low",
+        MEDIUM: "Medium",
+        HIGH: "High",
+        QUALIFICATION: "Qualification",
+        DISCOVERY: "Discovery",
+        PROPOSAL: "Proposal",
+        NEGOTIATION: "Negotiation",
+        WON: "Won",
+      },
+      followUpTypes: {
+        NOTE: "Note",
+        CALL: "Call",
+        MEETING: "Meeting",
+        EMAIL: "Email",
+        MESSAGE: "Message",
+      },
+      channels: {
+        EMAIL: "Email",
+        PHONE: "Phone",
+        WHATSAPP: "WhatsApp",
+        WECHAT: "WeChat",
+        VIDEO: "Video",
+        IN_PERSON: "In person",
+      },
+      decisionRoles: {
+        DECISION_MAKER: "Decision maker",
+        INFLUENCER: "Influencer",
+        TECHNICAL: "Technical",
+        FINANCE: "Finance",
+        USER: "User",
+      },
+      feedback: {
+        selected: "selected",
+        updating: "Updating…",
+        batchUpdated: "Selected leads updated.",
+        batchFailed: "Batch update failed.",
+        confirmBatch: "Update {count} selected lead(s)?",
+        archiveConfirm: "Archive this record?",
+        archived: "Record archived.",
+        archiveFailed: "The record could not be archived.",
+        conversionComplete: "Customer and opportunity were created in one transaction.",
+        imported: "{count} leads imported.",
+        importFailed: "CSV import failed.",
+        validRows: "{valid} valid / {total} total.",
+        rowError: "Row {row}: {issues}.",
+        stagePrompt: "Loss reason (required)",
+        stageFailed: "Stage update failed.",
+        stageMoved: "Opportunity moved.",
+        moving: "Moving…",
+      },
+      pagination: {
+        page: "Page {page} / {total}",
+        previous: "Previous",
+        next: "Next",
+        leadCount: "{count} leads",
+        customerCount: "{count} customers",
+      },
+      csv: {
+        label: "Lead CSV",
+        placeholder: "companyName,contactName,email,phone,countryCode,source",
+        rows: "rows",
+      },
+      detail: {
+        customerDetails: "Customer details",
+        conversion: "Conversion",
+        followUpTimeline: "Follow-up timeline",
+        contactFallback: "Contact",
+      },
       leads: {
         title: "Leads",
         subtitle: "Qualify prospects and turn them into customer opportunities.",
         new: "New lead",
         convert: "Convert lead",
         import: "CSV import",
         export: "Export current view",
       },
       customers: {
         title: "Customers",
@@ -198,39 +354,195 @@ const dictionaries = {
       leadSources: "\u7ebf\u7d22\u6765\u6e90",
       upcomingFollowUps: "\u5373\u5c06\u5230\u671f\u8ddf\u8fdb",
       recentLeads: "\u6700\u8fd1\u7ebf\u7d22",
       recentOrders: "\u6700\u8fd1\u8ba2\u5355",
       recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
       empty: "\u6682\u65f6\u8fd8\u6ca1\u6709\u5ba2\u6237\u6570\u636e\u3002",
       table: {
         company: "\u516c\u53f8",
         country: "\u56fd\u5bb6/\u5730\u533a",
         added: "\u65b0\u589e\u65e5\u671f",
+        createdFrom: "\u521b\u5efa\u65e5\u671f\u8d77",
+        createdTo: "\u521b\u5efa\u65e5\u671f\u6b62",
+        order: "\u8ba2\u5355",
+        status: "\u72b6\u6001",
+        usd: "\u7f8e\u5143",
       },
       risks: {
         title: "\u901a\u77e5\u4e0e\u98ce\u9669",
         clear: "\u76ee\u524d\u6ca1\u6709\u9700\u8981\u7acb\u5373\u5904\u7406\u7684\u98ce\u9669\u3002",
         overdueTasks:
           "\u4e2a\u903e\u671f\u4efb\u52a1\u9700\u8981\u5904\u7406\u3002",
+        overdueFollowUps: "\u4e2a\u903e\u671f\u8ddf\u8fdb",
+        highRiskCustomers: "\u4e2a\u9ad8\u98ce\u9669\u5ba2\u6237",
+        staleOpportunities: "\u4e2a\u4e45\u672a\u66f4\u65b0\u5546\u673a",
       },
     },
     crm: {
       create: "\u521b\u5efa",
       save: "\u4fdd\u5b58\u66f4\u6539",
       edit: "\u7f16\u8f91",
       view: "\u67e5\u770b",
       search: "\u641c\u7d22",
       filters: "\u7b5b\u9009",
       empty: "\u5f53\u524d\u6743\u9650\u8303\u56f4\u548c\u7b5b\u9009\u6761\u4ef6\u4e0b\u6682\u65e0\u8bb0\u5f55\u3002",
       loading: "\u6b63\u5728\u4fdd\u5b58\u2026",
       success: "\u4fdd\u5b58\u6210\u529f\u3002",
       failed: "\u65e0\u6cd5\u4fdd\u5b58\u66f4\u6539\u3002",
+      actions: {
+        addContact: "\u6dfb\u52a0\u8054\u7cfb\u4eba",
+        addFollowUp: "\u6dfb\u52a0\u8ddf\u8fdb",
+        archive: "\u5f52\u6863",
+        archiving: "\u6b63\u5728\u5f52\u6863\u2026",
+        assignOwner: "\u5206\u914d\u8d1f\u8d23\u4eba",
+        applyStatus: "\u5e94\u7528\u72b6\u6001",
+        preview: "\u9884\u89c8\u5e76\u9a8c\u8bc1",
+        checking: "\u6b63\u5728\u68c0\u67e5\u2026",
+        commit: "\u63d0\u4ea4",
+      },
+      fields: {
+        company: "\u516c\u53f8",
+        companySearch: "\u516c\u53f8\u3001\u8054\u7cfb\u4eba\u3001\u90ae\u7bb1\u6216\u7535\u8bdd",
+        customerSearch: "\u516c\u53f8\u3001\u6cd5\u5b9a\u540d\u79f0\u6216\u90ae\u7bb1",
+        contact: "\u8054\u7cfb\u4eba",
+        firstName: "\u540d",
+        lastName: "\u59d3",
+        legalName: "\u6cd5\u5b9a\u540d\u79f0",
+        email: "\u90ae\u7bb1",
+        phone: "\u7535\u8bdd",
+        country: "\u56fd\u5bb6/\u5730\u533a",
+        source: "\u6765\u6e90",
+        status: "\u72b6\u6001",
+        owner: "\u8d1f\u8d23\u4eba",
+        added: "\u65b0\u589e\u65e5\u671f",
+        createdFrom: "\u521b\u5efa\u65e5\u671f\u8d77",
+        createdTo: "\u521b\u5efa\u65e5\u671f\u6b62",
+        notes: "\u5907\u6ce8",
+        level: "\u7ea7\u522b",
+        risk: "\u98ce\u9669",
+        riskNotes: "\u98ce\u9669\u5907\u6ce8",
+        contacts: "\u8054\u7cfb\u4eba",
+        opportunities: "\u5546\u673a",
+        decisionRole: "\u51b3\u7b56\u89d2\u8272",
+        language: "\u8bed\u8a00",
+        timezone: "\u65f6\u533a",
+        primary: "\u4e3b\u8054\u7cfb\u4eba",
+        customer: "\u5ba2\u6237",
+        name: "\u540d\u79f0",
+        value: "\u91d1\u989d",
+        currency: "\u5e01\u79cd",
+        exchangeRate: "\u7f8e\u5143\u6c47\u7387",
+        probability: "\u6982\u7387",
+        expectedClose: "\u9884\u8ba1\u7ed3\u5355",
+        opportunityName: "\u5546\u673a\u540d\u79f0",
+        type: "\u7c7b\u578b",
+        channel: "\u6e20\u9053",
+        summary: "\u6458\u8981",
+        outcome: "\u7ed3\u679c",
+        occurred: "\u53d1\u751f\u65f6\u95f4",
+        nextAction: "\u4e0b\u4e00\u6b65\u884c\u52a8",
+        nextActionDate: "\u4e0b\u4e00\u6b65\u65e5\u671f",
+        order: "\u8ba2\u5355",
+        amountUsd: "\u7f8e\u5143",
+      },
+      options: {
+        allStatuses: "\u5168\u90e8\u72b6\u6001",
+        allLevels: "\u5168\u90e8\u7ea7\u522b",
+        allRisk: "\u5168\u90e8\u98ce\u9669\u7b49\u7ea7",
+        selectCustomer: "\u9009\u62e9\u5ba2\u6237",
+        selectOwner: "\u9009\u62e9\u8d1f\u8d23\u4eba",
+        none: "\u65e0",
+        noChannel: "\u65e0\u8054\u7cfb\u6e20\u9053",
+        noTimezone: "\u65e0\u65f6\u533a",
+        noTracking: "\u65e0\u8ddf\u8e2a\u53f7",
+        noValue: "\u2014",
+      },
+      statuses: {
+        NEW: "\u65b0\u7ebf\u7d22",
+        CONTACTED: "\u5df2\u8054\u7cfb",
+        QUALIFIED: "\u5df2\u8bc4\u4f30",
+        CONVERTED: "\u5df2\u8f6c\u5316",
+        LOST: "\u5df2\u4e22\u5931",
+        ACTIVE: "\u6d3b\u8dc3",
+        INACTIVE: "\u505c\u7528",
+        ARCHIVED: "\u5df2\u5f52\u6863",
+        STANDARD: "\u6807\u51c6",
+        KEY: "\u91cd\u70b9",
+        STRATEGIC: "\u6218\u7565",
+        LOW: "\u4f4e",
+        MEDIUM: "\u4e2d",
+        HIGH: "\u9ad8",
+        QUALIFICATION: "\u8d44\u683c\u8bc4\u4f30",
+        DISCOVERY: "\u9700\u6c42\u53d1\u73b0",
+        PROPOSAL: "\u65b9\u6848",
+        NEGOTIATION: "\u8c08\u5224",
+        WON: "\u5df2\u8d62\u5355",
+      },
+      followUpTypes: {
+        NOTE: "\u5907\u5fd8",
+        CALL: "\u7535\u8bdd",
+        MEETING: "\u4f1a\u8bae",
+        EMAIL: "\u90ae\u4ef6",
+        MESSAGE: "\u6d88\u606f",
+      },
+      channels: {
+        EMAIL: "\u90ae\u4ef6",
+        PHONE: "\u7535\u8bdd",
+        WHATSAPP: "WhatsApp",
+        WECHAT: "\u5fae\u4fe1",
+        VIDEO: "\u89c6\u9891",
+        IN_PERSON: "\u7ebf\u4e0b\u4f1a\u9762",
+      },
+      decisionRoles: {
+        DECISION_MAKER: "\u51b3\u7b56\u4eba",
+        INFLUENCER: "\u5f71\u54cd\u8005",
+        TECHNICAL: "\u6280\u672f",
+        FINANCE: "\u8d22\u52a1",
+        USER: "\u7528\u6237",
+      },
+      feedback: {
+        selected: "\u5df2\u9009",
+        updating: "\u6b63\u5728\u66f4\u65b0\u2026",
+        batchUpdated: "\u5df2\u66f4\u65b0\u9009\u4e2d\u7ebf\u7d22\u3002",
+        batchFailed: "\u6279\u91cf\u66f4\u65b0\u5931\u8d25\u3002",
+        confirmBatch: "\u786e\u8ba4\u66f4\u65b0 {count} \u6761\u9009\u4e2d\u7ebf\u7d22\uff1f",
+        archiveConfirm: "\u786e\u8ba4\u5f52\u6863\u8be5\u8bb0\u5f55\uff1f",
+        archived: "\u8bb0\u5f55\u5df2\u5f52\u6863\u3002",
+        archiveFailed: "\u65e0\u6cd5\u5f52\u6863\u8be5\u8bb0\u5f55\u3002",
+        conversionComplete: "\u5ba2\u6237\u4e0e\u5546\u673a\u5df2\u5728\u540c\u4e00\u4e8b\u52a1\u4e2d\u521b\u5efa\u3002",
+        imported: "\u5df2\u5bfc\u5165 {count} \u6761\u7ebf\u7d22\u3002",
+        importFailed: "CSV \u5bfc\u5165\u5931\u8d25\u3002",
+        validRows: "{valid} \u6761\u6709\u6548 / \u5171 {total} \u6761\u3002",
+        rowError: "\u7b2c {row} \u884c\uff1a{issues}\u3002",
+        stagePrompt: "\u4e22\u5355\u539f\u56e0\uff08\u5fc5\u586b\uff09",
+        stageFailed: "\u5546\u673a\u9636\u6bb5\u66f4\u65b0\u5931\u8d25\u3002",
+        stageMoved: "\u5546\u673a\u5df2\u79fb\u52a8\u3002",
+        moving: "\u6b63\u5728\u79fb\u52a8\u2026",
+      },
+      pagination: {
+        page: "\u7b2c {page} / {total} \u9875",
+        previous: "\u4e0a\u4e00\u9875",
+        next: "\u4e0b\u4e00\u9875",
+        leadCount: "\u5171 {count} \u6761\u7ebf\u7d22",
+        customerCount: "\u5171 {count} \u4e2a\u5ba2\u6237",
+      },
+      csv: {
+        label: "\u7ebf\u7d22 CSV",
+        placeholder: "companyName,contactName,email,phone,countryCode,source",
+        rows: "\u884c",
+      },
+      detail: {
+        customerDetails: "\u5ba2\u6237\u8be6\u60c5",
+        conversion: "\u8f6c\u5316",
+        followUpTimeline: "\u8ddf\u8fdb\u65f6\u95f4\u7ebf",
+        contactFallback: "\u8054\u7cfb\u4eba",
+      },
       leads: {
         title: "\u7ebf\u7d22",
         subtitle: "\u8bc4\u4f30\u6f5c\u5728\u5ba2\u6237\uff0c\u5e76\u8f6c\u5316\u4e3a\u5ba2\u6237\u4e0e\u5546\u673a\u3002",
         new: "\u65b0\u5efa\u7ebf\u7d22",
         convert: "\u8f6c\u5316\u7ebf\u7d22",
         import: "CSV \u5bfc\u5165",
         export: "\u5bfc\u51fa\u5f53\u524d\u89c6\u56fe",
       },
       customers: {
         title: "\u5ba2\u6237",
diff --git a/src/modules/crm/crm-domain.test.ts b/src/modules/crm/crm-domain.test.ts
index a8259c3..ad4ed0f 100644
--- a/src/modules/crm/crm-domain.test.ts
+++ b/src/modules/crm/crm-domain.test.ts
@@ -1,20 +1,25 @@
 import { describe, expect, it } from "vitest";
 
 import type { AuthorizationContext } from "@/lib/rbac";
 import {
   assertOpportunityTransition,
   assertOwned,
   assertPrimaryContactChange,
   findLeadDuplicates,
   isFollowUpOverdue,
   crmOwnerWhere,
+  assertLeadMutable,
+  customerTimelineWhere,
+  followUpRelationMetadata,
+  opportunityStageGuard,
+  resolveOpportunityOwner,
   weightedForecast,
 } from "@/modules/crm/crm-domain";
 
 const representative: AuthorizationContext = {
   userId: "sales-1",
   roles: ["SALES_REP"],
   permissions: ["lead.read", "lead.update", "opportunity.update"],
 };
 
 describe("CRM ownership", () => {
@@ -87,20 +92,81 @@ describe("lead duplicate detection", () => {
   it("does not treat empty identifiers as duplicates", () => {
     expect(
       findLeadDuplicates(
         { companyName: "", email: null, phone: null },
         rows,
       ),
     ).toEqual([]);
   });
 });
 
+describe("converted lead immutability", () => {
+  it("rejects edits and batch changes after conversion", () => {
+    expect(() => assertLeadMutable("CONVERTED")).toThrowError(/converted/i);
+    expect(() => assertLeadMutable("QUALIFIED")).not.toThrow();
+  });
+});
+
+describe("customer relationship invariants", () => {
+  it("loads direct, contact, and opportunity follow-ups into the timeline", () => {
+    expect(customerTimelineWhere("customer-1")).toEqual({
+      deletedAt: null,
+      OR: [
+        { customerId: "customer-1" },
+        { contact: { customerId: "customer-1" } },
+        { opportunity: { customerId: "customer-1" } },
+      ],
+    });
+  });
+
+  it("records every follow-up relationship in audit metadata", () => {
+    expect(
+      followUpRelationMetadata({
+        customerId: "customer-1",
+        contactId: "contact-1",
+        leadId: "lead-1",
+        opportunityId: "opportunity-1",
+      }),
+    ).toEqual({
+      customerId: "customer-1",
+      contactId: "contact-1",
+      leadId: "lead-1",
+      opportunityId: "opportunity-1",
+    });
+  });
+});
+
+describe("opportunity consistency", () => {
+  it("inherits customer ownership and rejects mismatched requested owners", () => {
+    expect(resolveOpportunityOwner("sales-1")).toBe("sales-1");
+    expect(resolveOpportunityOwner("sales-1", "sales-1")).toBe("sales-1");
+    expect(() =>
+      resolveOpportunityOwner("sales-1", "sales-2"),
+    ).toThrowError(/owner/i);
+  });
+
+  it("builds a stage update guard from id, current stage, and version", () => {
+    expect(
+      opportunityStageGuard({
+        id: "opportunity-1",
+        stage: "DISCOVERY",
+        version: 7,
+      }),
+    ).toEqual({
+      id: "opportunity-1",
+      stage: "DISCOVERY",
+      version: 7,
+      deletedAt: null,
+    });
+  });
+});
+
 describe("primary contact constraint", () => {
   it("rejects a second active primary contact", () => {
     expect(() =>
       assertPrimaryContactChange(true, ["contact-1"]),
     ).toThrowError(/primary contact/i);
   });
 
   it("allows a non-primary contact or the only primary contact", () => {
     expect(() => assertPrimaryContactChange(false, ["contact-1"])).not.toThrow();
     expect(() => assertPrimaryContactChange(true, [])).not.toThrow();
diff --git a/src/modules/crm/crm-domain.ts b/src/modules/crm/crm-domain.ts
index b43ebba..bcd41ce 100644
--- a/src/modules/crm/crm-domain.ts
+++ b/src/modules/crm/crm-domain.ts
@@ -22,20 +22,71 @@ export interface OwnedCrmRecord {
 }
 
 export function assertOwned(
   context: AuthorizationContext,
   record: OwnedCrmRecord,
   permission: string,
 ) {
   requirePermission(context, permission, record);
 }
 
+export function assertLeadMutable(status: string) {
+  if (status === "CONVERTED") {
+    throw new DomainError(
+      "LEAD_ALREADY_CONVERTED",
+      "Lead is already converted and is immutable",
+      409,
+    );
+  }
+}
+
+export function customerTimelineWhere(customerId: string) {
+  return {
+    deletedAt: null,
+    OR: [
+      { customerId },
+      { contact: { customerId } },
+      { opportunity: { customerId } },
+    ],
+  };
+}
+
+export interface FollowUpRelationIds {
+  customerId?: string | null;
+  contactId?: string | null;
+  leadId?: string | null;
+  opportunityId?: string | null;
+}
+
+export function followUpRelationMetadata(input: FollowUpRelationIds) {
+  return {
+    customerId: input.customerId ?? null,
+    contactId: input.contactId ?? null,
+    leadId: input.leadId ?? null,
+    opportunityId: input.opportunityId ?? null,
+  };
+}
+
+export function resolveOpportunityOwner(
+  customerOwnerId: string,
+  requestedOwnerId?: string,
+) {
+  if (requestedOwnerId && requestedOwnerId !== customerOwnerId) {
+    throw new DomainError(
+      "OPPORTUNITY_OWNER_MISMATCH",
+      "Opportunity owner must match the customer owner",
+      409,
+    );
+  }
+  return customerOwnerId;
+}
+
 interface DuplicateCandidate {
   companyName?: string | null;
   email?: string | null;
   phone?: string | null;
 }
 
 interface DuplicateRow extends DuplicateCandidate {
   id: string;
 }
 
@@ -101,20 +152,33 @@ export const opportunityStages = [
   "QUALIFICATION",
   "DISCOVERY",
   "PROPOSAL",
   "NEGOTIATION",
   "WON",
   "LOST",
 ] as const;
 
 export type OpportunityStageValue = (typeof opportunityStages)[number];
 
+export function opportunityStageGuard(opportunity: {
+  id: string;
+  stage: OpportunityStageValue;
+  version: number;
+}) {
+  return {
+    id: opportunity.id,
+    stage: opportunity.stage,
+    version: opportunity.version,
+    deletedAt: null,
+  };
+}
+
 const activeStages = opportunityStages.slice(0, 4);
 
 export function assertOpportunityTransition(
   current: OpportunityStageValue,
   next: OpportunityStageValue,
   lossReason?: string | null,
 ) {
   if (current === "WON" || current === "LOST") {
     throw new DomainError(
       "OPPORTUNITY_TERMINAL",
diff --git a/src/modules/crm/crm-service.test.ts b/src/modules/crm/crm-service.test.ts
index 8abe875..71e4fac 100644
--- a/src/modules/crm/crm-service.test.ts
+++ b/src/modules/crm/crm-service.test.ts
@@ -12,38 +12,40 @@ const representative: AuthorizationContext = {
   roles: ["SALES_REP"],
   permissions: ["lead.update", "opportunity.update"],
 };
 
 function repositoryFixture(
   overrides: Partial<CrmRepository> = {},
 ): CrmRepository {
   return {
     findLead: async () => ({
       id: "lead-1",
+      version: 1,
       ownerId: "sales-1",
       status: "QUALIFIED",
       companyName: "Northstar Systems",
       contactName: "Maya Chen",
       countryCode: "US",
       email: "maya@northstar.example",
       phone: "+12065550180",
     }),
     convertLeadAtomically: async (_context, lead, input) => ({
       leadId: lead.id,
       customerId: "customer-1",
       opportunityId: "opportunity-1",
       ownerId: input.ownerId,
     }),
     findOpportunity: async () => ({
       id: "opportunity-1",
       ownerId: "sales-1",
       stage: "DISCOVERY",
+      version: 3,
     }),
     updateOpportunityStage: async (_context, opportunity, input) => ({
       id: opportunity.id,
       stage: input.stage,
       lossReason: input.lossReason ?? null,
     }),
     ...overrides,
   };
 }
 
@@ -78,20 +80,21 @@ describe("lead conversion", () => {
     expect(calls).toEqual([
       { ownerId: "sales-1", opportunityName: "GPU cluster refresh", value: "120000", currencyCode: "USD", exchangeRateToUsd: "1", probability: 30 },
     ]);
   });
 
   it("rejects a foreign or already converted lead before opening conversion transaction", async () => {
     let converted = false;
     const foreign = repositoryFixture({
       findLead: async () => ({
         id: "lead-1",
+        version: 1,
         ownerId: "sales-2",
         status: "QUALIFIED",
         companyName: "Northstar Systems",
         contactName: "Maya Chen",
         countryCode: "US",
         email: null,
         phone: null,
       }),
       convertLeadAtomically: async () => {
         converted = true;
@@ -106,20 +109,21 @@ describe("lead conversion", () => {
         currencyCode: "USD",
         exchangeRateToUsd: "1",
         probability: 10,
       }),
     ).rejects.toThrow(/Permission denied/);
     expect(converted).toBe(false);
 
     const convertedLead = repositoryFixture({
       findLead: async () => ({
         id: "lead-1",
+        version: 2,
         ownerId: "sales-1",
         status: "CONVERTED",
         companyName: "Northstar Systems",
         contactName: "Maya Chen",
         countryCode: "US",
         email: null,
         phone: null,
       }),
     });
     await expect(
@@ -162,11 +166,32 @@ describe("opportunity movement", () => {
     await expect(
       moveOpportunity(
         repository,
         representative,
         "opportunity-1",
         "LOST",
       ),
     ).rejects.toThrow(/loss reason/i);
     expect(persisted).toBe(false);
   });
+
+  it("passes the read version to the guarded stage update", async () => {
+    const seenVersions: number[] = [];
+    const repository = repositoryFixture({
+      updateOpportunityStage: async (_context, opportunity, input) => {
+        seenVersions.push(opportunity.version);
+        return {
+          id: opportunity.id,
+          stage: input.stage,
+          lossReason: input.lossReason ?? null,
+        };
+      },
+    });
+    await moveOpportunity(
+      repository,
+      representative,
+      "opportunity-1",
+      "PROPOSAL",
+    );
+    expect(seenVersions).toEqual([3]);
+  });
 });
diff --git a/src/modules/crm/crm-service.ts b/src/modules/crm/crm-service.ts
index 11dca6b..e061f84 100644
--- a/src/modules/crm/crm-service.ts
+++ b/src/modules/crm/crm-service.ts
@@ -1,33 +1,36 @@
 import { DomainError } from "@/lib/errors";
 import type { AuthorizationContext } from "@/lib/rbac";
 import {
+  assertLeadMutable,
   assertOpportunityTransition,
   assertOwned,
   type OpportunityStageValue,
 } from "@/modules/crm/crm-domain";
 
 export interface LeadForConversion {
   id: string;
+  version: number;
   ownerId: string;
   status: string;
   companyName: string;
   contactName: string;
   countryCode: string;
   email: string | null;
   phone: string | null;
 }
 
 export interface OpportunityForStage {
   id: string;
   ownerId: string;
   stage: OpportunityStageValue;
+  version: number;
 }
 
 export interface ConvertLeadInput {
   opportunityName: string;
   value: string;
   currencyCode: string;
   exchangeRateToUsd: string;
   probability: number;
 }
 
@@ -73,27 +76,21 @@ export async function convertLead(
   repository: CrmRepository,
   context: AuthorizationContext,
   leadId: string,
   input: ConvertLeadInput,
 ) {
   const lead = await repository.findLead(context, leadId);
   if (!lead) {
     throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
   }
   assertOwned(context, lead, "lead.update");
-  if (lead.status === "CONVERTED") {
-    throw new DomainError(
-      "LEAD_ALREADY_CONVERTED",
-      "Lead is already converted",
-      409,
-    );
-  }
+  assertLeadMutable(lead.status);
   return repository.convertLeadAtomically(context, lead, {
     ...input,
     ownerId: lead.ownerId,
   });
 }
 
 export async function moveOpportunity(
   repository: CrmRepository,
   context: AuthorizationContext,
   opportunityId: string,
diff --git a/src/modules/crm/prisma-crm-repository.ts b/src/modules/crm/prisma-crm-repository.ts
index 9485f68..a4d9e67 100644
--- a/src/modules/crm/prisma-crm-repository.ts
+++ b/src/modules/crm/prisma-crm-repository.ts
@@ -1,21 +1,26 @@
 import Decimal from "decimal.js";
 
 import type { Prisma } from "@/generated/prisma/client";
 import { getPrisma } from "@/lib/prisma";
 import { writeAudit } from "@/lib/audit";
 import { DomainError } from "@/lib/errors";
 import type { AuthorizationContext } from "@/lib/rbac";
 import {
+  assertLeadMutable,
   assertPrimaryContactChange,
   crmOwnerWhere,
+  customerTimelineWhere,
   findLeadDuplicates,
+  followUpRelationMetadata,
+  opportunityStageGuard,
+  resolveOpportunityOwner,
 } from "@/modules/crm/crm-domain";
 import type {
   AtomicConversionInput,
   CrmRepository,
   LeadForConversion,
   OpportunityForStage,
 } from "@/modules/crm/crm-service";
 import { searchOwnershipFilter } from "@/modules/search/search-scope";
 
 export interface LeadFilters {
@@ -109,21 +114,21 @@ export interface OpportunityFilters {
 }
 
 export interface CreateOpportunityData {
   customerId: string;
   name: string;
   value: string;
   currencyCode: string;
   exchangeRateToUsd: string;
   probability: number;
   expectedCloseAt?: Date | null;
-  ownerId: string;
+  ownerId?: string;
 }
 
 function ownerIdFor(context: AuthorizationContext) {
   return searchOwnershipFilter(context).ownerId;
 }
 
 function ownershipWhere(
   context: AuthorizationContext,
   requestedOwnerId?: string,
 ) {
@@ -203,20 +208,21 @@ export class PrismaCrmRepository implements CrmRepository {
   }
 
   async findLead(
     context: AuthorizationContext,
     id: string,
   ): Promise<LeadForConversion | null> {
     return getPrisma().lead.findFirst({
       where: { id, deletedAt: null, ...ownershipWhere(context) },
       select: {
         id: true,
+        version: true,
         ownerId: true,
         status: true,
         companyName: true,
         contactName: true,
         countryCode: true,
         email: true,
         phone: true,
       },
     });
   }
@@ -300,63 +306,80 @@ export class PrismaCrmRepository implements CrmRepository {
     });
   }
 
   async updateLead(
     context: AuthorizationContext,
     id: string,
     input: Partial<Omit<CreateLeadData, "ownerId">>,
   ) {
     const existing = await this.findLead(context, id);
     if (!existing) throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
+    assertLeadMutable(existing.status);
     return getPrisma().$transaction(async (transaction) => {
-      const lead = await transaction.lead.update({
-        where: { id },
+      const result = await transaction.lead.updateMany({
+        where: { id, deletedAt: null, status: { not: "CONVERTED" } },
         data: { ...input, version: { increment: 1 } },
       });
+      if (result.count !== 1) {
+        throw new DomainError(
+          "LEAD_ALREADY_CONVERTED",
+          "Converted leads are immutable",
+          409,
+        );
+      }
+      const lead = await transaction.lead.findUniqueOrThrow({ where: { id } });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "lead.update",
         entityType: "Lead",
         entityId: id,
         before: { status: existing.status },
         after: { status: lead.status, version: lead.version },
       });
       return lead;
     });
   }
 
   async batchLeads(
     context: AuthorizationContext,
     ids: string[],
     input: { ownerId?: string; status?: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" },
   ) {
     const prisma = getPrisma();
     const scoped = await prisma.lead.findMany({
       where: { id: { in: ids }, deletedAt: null, ...ownershipWhere(context) },
-      select: { id: true },
+      select: { id: true, status: true },
     });
     if (scoped.length !== new Set(ids).size) {
       throw new DomainError("LEAD_NOT_FOUND", "One or more leads were not found", 404);
     }
+    scoped.forEach((lead) => assertLeadMutable(lead.status));
     const ownId = ownerIdFor(context);
     if (input.ownerId && ownId) {
       throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.assign", 403);
     }
     return prisma.$transaction(async (transaction) => {
       const result = await transaction.lead.updateMany({
-        where: { id: { in: ids } },
+        where: { id: { in: ids }, status: { not: "CONVERTED" } },
         data: {
           ...(input.ownerId ? { ownerId: input.ownerId } : {}),
           ...(input.status ? { status: input.status } : {}),
           version: { increment: 1 },
         },
       });
+      if (result.count !== scoped.length) {
+        throw new DomainError(
+          "LEAD_ALREADY_CONVERTED",
+          "Converted leads are immutable",
+          409,
+        );
+      }
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "lead.batch_update",
         entityType: "Lead",
         metadata: { ids, ...input },
       });
       return result;
     });
   }
 
@@ -374,20 +397,37 @@ export class PrismaCrmRepository implements CrmRepository {
           ...ownershipWhere(context),
         },
       });
       if (!current) {
         throw new DomainError(
           "LEAD_CONVERSION_CONFLICT",
           "Lead cannot be converted",
           409,
         );
       }
+      const claimed = await transaction.lead.updateMany({
+        where: {
+          id: current.id,
+          status: { not: "CONVERTED" },
+          convertedCustomerId: null,
+          convertedOpportunityId: null,
+          version: current.version,
+        },
+        data: { status: "CONVERTED", version: { increment: 1 } },
+      });
+      if (claimed.count !== 1) {
+        throw new DomainError(
+          "LEAD_CONVERSION_CONFLICT",
+          "Lead cannot be converted",
+          409,
+        );
+      }
       const customer = await transaction.customer.create({
         data: {
           companyName: current.companyName,
           countryCode: current.countryCode,
           email: current.email,
           phone: current.phone,
           ownerId: input.ownerId,
           contacts: {
             create: {
               firstName: current.contactName,
@@ -410,24 +450,22 @@ export class PrismaCrmRepository implements CrmRepository {
           currencyCode: input.currencyCode,
           exchangeRateToUsd: input.exchangeRateToUsd,
           valueUsd,
           probability: input.probability,
           ownerId: input.ownerId,
         },
       });
       await transaction.lead.update({
         where: { id: current.id },
         data: {
-          status: "CONVERTED",
           convertedCustomerId: customer.id,
           convertedOpportunityId: opportunity.id,
-          version: { increment: 1 },
         },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "lead.convert",
         entityType: "Lead",
         entityId: current.id,
         metadata: {
           customerId: customer.id,
           opportunityId: opportunity.id,
@@ -480,53 +518,56 @@ export class PrismaCrmRepository implements CrmRepository {
     return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
   }
 
   async getCustomerDetail(context: AuthorizationContext, id: string) {
     const prisma = getPrisma();
     const customer = await prisma.customer.findFirst({
       where: { id, deletedAt: null, ...ownershipWhere(context) },
       include: {
         owner: { select: { id: true, name: true, email: true } },
         contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
-        followUps: { where: { deletedAt: null }, orderBy: { occurredAt: "desc" } },
         opportunities: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
         quotes: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
         orders: {
           where: { deletedAt: null },
           orderBy: { updatedAt: "desc" },
           include: {
             payments: { where: { deletedAt: null } },
             shipments: { where: { deletedAt: null } },
           },
         },
         tickets: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
       },
     });
     if (!customer) return null;
-    const [files, activity] = await prisma.$transaction([
+    const [followUps, files, activity] = await prisma.$transaction([
+      prisma.followUp.findMany({
+        where: customerTimelineWhere(id),
+        orderBy: { occurredAt: "desc" },
+      }),
       prisma.fileAsset.findMany({
         where: { entityType: "Customer", entityId: id, deletedAt: null },
         orderBy: { createdAt: "desc" },
       }),
       prisma.auditLog.findMany({
         where: {
           OR: [
             { entityType: "Customer", entityId: id },
             { entityType: "Contact", metadata: { path: ["customerId"], equals: id } },
             { entityType: "FollowUp", metadata: { path: ["customerId"], equals: id } },
           ],
         },
         orderBy: { createdAt: "desc" },
         take: 50,
       }),
     ]);
-    return { ...customer, files, activity };
+    return { ...customer, followUps, files, activity };
   }
 
   async createCustomer(context: AuthorizationContext, input: CreateCustomerData) {
     const ownId = ownerIdFor(context);
     if (ownId && input.ownerId !== ownId) {
       throw new DomainError("PERMISSION_DENIED", "Permission denied: customer.create", 403);
     }
     return getPrisma().$transaction(async (transaction) => {
       const customer = await transaction.customer.create({ data: input });
       await writeAudit(transaction, {
@@ -717,25 +758,21 @@ export class PrismaCrmRepository implements CrmRepository {
     }
     return getPrisma().$transaction(async (transaction) => {
       const followUp = await transaction.followUp.create({
         data: { ...input, createdById: context.userId },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "follow_up.create",
         entityType: "FollowUp",
         entityId: followUp.id,
-        metadata: {
-          customerId: input.customerId,
-          leadId: input.leadId,
-          opportunityId: input.opportunityId,
-        },
+        metadata: followUpRelationMetadata(input),
       });
       return followUp;
     });
   }
 
   async updateFollowUp(
     context: AuthorizationContext,
     id: string,
     input: Partial<Omit<FollowUpData, "customerId" | "contactId" | "leadId" | "opportunityId">>,
   ) {
@@ -743,41 +780,49 @@ export class PrismaCrmRepository implements CrmRepository {
       where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
     });
     if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
     return getPrisma().$transaction(async (transaction) => {
       const followUp = await transaction.followUp.update({ where: { id }, data: input });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "follow_up.update",
         entityType: "FollowUp",
         entityId: id,
+        metadata: followUpRelationMetadata(existing),
       });
       return followUp;
     });
   }
 
   async deleteFollowUp(context: AuthorizationContext, id: string) {
     const existing = await getPrisma().followUp.findFirst({
       where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
-      select: { id: true },
+      select: {
+        id: true,
+        customerId: true,
+        contactId: true,
+        leadId: true,
+        opportunityId: true,
+      },
     });
     if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
     return getPrisma().$transaction(async (transaction) => {
       const followUp = await transaction.followUp.update({
         where: { id },
         data: { deletedAt: new Date() },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "follow_up.archive",
         entityType: "FollowUp",
         entityId: id,
+        metadata: followUpRelationMetadata(existing),
       });
       return followUp;
     });
   }
 
   private async resolveRelatedOwners(input: FollowUpData) {
     const prisma = getPrisma();
     const owners: string[] = [];
     if (input.customerId) {
       const row = await prisma.customer.findFirst({ where: { id: input.customerId, deletedAt: null }, select: { ownerId: true } });
@@ -833,82 +878,82 @@ export class PrismaCrmRepository implements CrmRepository {
 
   async createOpportunity(
     context: AuthorizationContext,
     input: CreateOpportunityData,
   ) {
     const customer = await getPrisma().customer.findFirst({
       where: { id: input.customerId, deletedAt: null, ...ownershipWhere(context) },
       select: { ownerId: true },
     });
     if (!customer) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
-    const ownId = ownerIdFor(context);
-    if (ownId && input.ownerId !== ownId) {
-      throw new DomainError("PERMISSION_DENIED", "Permission denied: opportunity.create", 403);
-    }
+    const ownerId = resolveOpportunityOwner(customer.ownerId, input.ownerId);
     const valueUsd = new Decimal(input.value).times(input.exchangeRateToUsd).toFixed(4);
     return getPrisma().$transaction(async (transaction) => {
       const opportunity = await transaction.opportunity.create({
-        data: { ...input, valueUsd },
+        data: { ...input, ownerId, valueUsd },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "opportunity.create",
         entityType: "Opportunity",
         entityId: opportunity.id,
         after: { id: opportunity.id, stage: opportunity.stage, ownerId: opportunity.ownerId },
       });
       return opportunity;
     });
   }
 
   async findOpportunity(
     context: AuthorizationContext,
     id: string,
   ): Promise<OpportunityForStage | null> {
     return getPrisma().opportunity.findFirst({
       where: { id, deletedAt: null, ...ownershipWhere(context) },
-      select: { id: true, ownerId: true, stage: true },
+      select: { id: true, ownerId: true, stage: true, version: true },
     });
   }
 
   async updateOpportunityStage(
     context: AuthorizationContext,
     opportunity: OpportunityForStage,
     input: {
       stage: OpportunityForStage["stage"];
       lossReason?: string | null;
     },
   ) {
-    const current = await this.findOpportunity(context, opportunity.id);
-    if (!current || current.stage !== opportunity.stage) {
-      throw new DomainError(
-        "OPPORTUNITY_STAGE_CONFLICT",
-        "Opportunity stage changed; refresh and retry",
-        409,
-      );
-    }
     return getPrisma().$transaction(async (transaction) => {
-      const updated = await transaction.opportunity.update({
-        where: { id: opportunity.id },
+      const guard = opportunityStageGuard(opportunity);
+      const result = await transaction.opportunity.updateMany({
+        where: { ...guard, ...ownershipWhere(context) },
         data: {
           stage: input.stage,
           lostReason: input.stage === "LOST" ? input.lossReason : null,
           lostAt: input.stage === "LOST" ? new Date() : null,
           wonAt: input.stage === "WON" ? new Date() : null,
           probability:
             input.stage === "WON"
               ? 100
               : input.stage === "LOST"
                 ? 0
                 : undefined,
           version: { increment: 1 },
         },
+      });
+      if (result.count !== 1) {
+        throw new DomainError(
+          "OPPORTUNITY_STAGE_CONFLICT",
+          "Opportunity stage changed; refresh and retry",
+          409,
+        );
+      }
+      const updated = await transaction.opportunity.findUniqueOrThrow({
+        where: { id: opportunity.id },
         select: { id: true, stage: true, lostReason: true },
       });
       await writeAudit(transaction, {
         actorId: context.userId,
         action: "opportunity.stage_change",
         entityType: "Opportunity",
         entityId: opportunity.id,
         before: { stage: opportunity.stage },
         after: { stage: updated.stage, lossReason: updated.lostReason },
       });
diff --git a/src/modules/dashboard/dashboard-scope.test.ts b/src/modules/dashboard/dashboard-scope.test.ts
index 77eae35..3f92666 100644
--- a/src/modules/dashboard/dashboard-scope.test.ts
+++ b/src/modules/dashboard/dashboard-scope.test.ts
@@ -1,35 +1,80 @@
 import { describe, expect, it } from "vitest";
 
 import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
+import { dashboardAccessScope } from "@/modules/dashboard/dashboard-scope";
 
 describe("dashboard ownership scope", () => {
   it("limits Sales Representative metrics and identities to owned records", () => {
     expect(
       dashboardOwnershipFilter({
         userId: "sales-1",
         roles: ["SALES_REP"],
         permissions: ["dashboard.read"],
       }),
     ).toEqual({ ownerId: "sales-1" });
   });
 
+  it("assigns representatives to the owned sales domain", () => {
+    expect(
+      dashboardAccessScope({
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toEqual({ domain: "sales", ownerId: "sales-1" });
+  });
+
   it("keeps Sales Manager metrics broad", () => {
     expect(
       dashboardOwnershipFilter({
         userId: "manager-1",
         roles: ["SALES_MANAGER"],
         permissions: ["dashboard.read"],
       }),
     ).toEqual({});
+    expect(
+      dashboardAccessScope({
+        userId: "manager-1",
+        roles: ["SALES_MANAGER"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toEqual({ domain: "sales" });
   });
 
   it("keeps wildcard administrator metrics broad", () => {
     expect(
       dashboardOwnershipFilter({
         userId: "admin-1",
         roles: ["SUPER_ADMIN"],
         permissions: ["*"],
       }),
     ).toEqual({});
+    expect(
+      dashboardAccessScope({
+        userId: "admin-1",
+        roles: ["SUPER_ADMIN"],
+        permissions: ["*"],
+      }),
+    ).toEqual({ domain: "sales" });
+  });
+
+  it("assigns operational roles to a non-sales domain", () => {
+    expect(
+      dashboardAccessScope({
+        userId: "ops-1",
+        roles: ["OPERATIONS"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toEqual({ domain: "operations" });
+  });
+
+  it("rejects roles outside the explicit dashboard domains", () => {
+    expect(() =>
+      dashboardAccessScope({
+        userId: "custom-1",
+        roles: ["CUSTOM"],
+        permissions: ["dashboard.read"],
+      }),
+    ).toThrowError(/dashboard/i);
   });
 });
diff --git a/src/modules/dashboard/dashboard-scope.ts b/src/modules/dashboard/dashboard-scope.ts
index 81a7f44..0c667d3 100644
--- a/src/modules/dashboard/dashboard-scope.ts
+++ b/src/modules/dashboard/dashboard-scope.ts
@@ -1,6 +1,35 @@
 import type { AuthorizationContext } from "@/lib/rbac";
+import { AuthorizationError } from "@/lib/errors";
 import { searchOwnershipFilter } from "@/modules/search/search-scope";
 
+export type DashboardAccessScope =
+  | { domain: "sales"; ownerId?: string }
+  | { domain: "operations" };
+
+export function dashboardAccessScope(
+  context: AuthorizationContext,
+): DashboardAccessScope {
+  if (
+    context.permissions.includes("*") ||
+    context.roles?.includes("SUPER_ADMIN") ||
+    context.roles?.includes("SALES_MANAGER")
+  ) {
+    return { domain: "sales" };
+  }
+  if (context.roles?.includes("SALES_REP")) {
+    return { domain: "sales", ownerId: context.userId };
+  }
+  if (
+    context.roles?.some((role) =>
+      ["FINANCE", "PROCUREMENT", "OPERATIONS"].includes(role),
+    )
+  ) {
+    return { domain: "operations" };
+  }
+  throw new AuthorizationError("dashboard.read");
+}
+
 export function dashboardOwnershipFilter(context: AuthorizationContext) {
+  dashboardAccessScope(context);
   return searchOwnershipFilter(context);
 }
diff --git a/src/modules/dashboard/dashboard-service.test.ts b/src/modules/dashboard/dashboard-service.test.ts
index 8a0a3d7..1fc8037 100644
--- a/src/modules/dashboard/dashboard-service.test.ts
+++ b/src/modules/dashboard/dashboard-service.test.ts
@@ -41,23 +41,68 @@ describe("dashboard service", () => {
     };
     const context: AuthorizationContext = {
       userId: "sales-1",
       roles: ["SALES_REP"],
       permissions: ["dashboard.read", "customer.read"],
     };
 
     await expect(loadDashboard(repository, context)).resolves.toBe(snapshot);
     expect(contexts).toEqual([context]);
   });
+
+  it("requires dashboard.read before calling the repository", async () => {
+    let called = false;
+    const repository: DashboardRepository = {
+      loadSnapshot: async () => {
+        called = true;
+        return snapshot;
+      },
+    };
+
+    await expect(
+      loadDashboard(repository, {
+        userId: "sales-1",
+        roles: ["SALES_REP"],
+        permissions: ["customer.read"],
+      }),
+    ).rejects.toThrow(/dashboard\.read/);
+    expect(called).toBe(false);
+  });
+
+  it("rejects a role outside the explicit dashboard domains", async () => {
+    const repository: DashboardRepository = {
+      loadSnapshot: async () => snapshot,
+    };
+    await expect(
+      loadDashboard(repository, {
+        userId: "custom-1",
+        roles: ["CUSTOM"],
+        permissions: ["dashboard.read"],
+      }),
+    ).rejects.toThrow(/dashboard/i);
+  });
 });
 
 describe("dashboard KPI selection", () => {
+  it("does not expose KPI values without dashboard.read", () => {
+    expect(() =>
+      dashboardKpis(
+        {
+          userId: "sales-1",
+          roles: ["SALES_REP"],
+          permissions: ["customer.read"],
+        },
+        snapshot,
+      ),
+    ).toThrowError(/dashboard\.read/);
+  });
+
   it("shows sales pipeline KPIs to sales roles", () => {
     expect(
       dashboardKpis(
         {
           userId: "sales-1",
           roles: ["SALES_REP"],
           permissions: ["dashboard.read"],
         },
         snapshot,
       ),
@@ -73,17 +118,15 @@ describe("dashboard KPI selection", () => {
     expect(
       dashboardKpis(
         {
           userId: "ops-1",
           roles: ["OPERATIONS"],
           permissions: ["dashboard.read"],
         },
         snapshot,
       ),
     ).toEqual([
-      ["activeCustomers", 2],
-      ["openQuotes", 3],
       ["activeOrders", 4],
       ["dueTasks", 1],
     ]);
   });
 });
diff --git a/src/modules/dashboard/dashboard-service.ts b/src/modules/dashboard/dashboard-service.ts
index b4b6532..d900ece 100644
--- a/src/modules/dashboard/dashboard-service.ts
+++ b/src/modules/dashboard/dashboard-service.ts
@@ -38,40 +38,40 @@ export interface DashboardSnapshot {
     overdueFollowUps: number;
     highRiskCustomers: number;
     staleOpportunities: number;
   };
 }
 
 export interface DashboardRepository {
   loadSnapshot(context: AuthorizationContext): Promise<DashboardSnapshot>;
 }
 
-export function loadDashboard(
+export async function loadDashboard(
   repository: DashboardRepository,
   context: AuthorizationContext,
 ) {
+  requirePermission(context, "dashboard.read");
+  dashboardAccessScope(context);
   return repository.loadSnapshot(context);
 }
 
 export function dashboardKpis(
   context: AuthorizationContext,
   snapshot: DashboardSnapshot,
 ) {
-  const salesRole =
-    context.roles?.includes("SALES_REP") ||
-    context.roles?.includes("SALES_MANAGER") ||
-    context.roles?.includes("SUPER_ADMIN");
-  return salesRole
+  requirePermission(context, "dashboard.read");
+  const access = dashboardAccessScope(context);
+  return access.domain === "sales"
     ? ([
         ["activeCustomers", snapshot.activeCustomers],
         ["openLeads", snapshot.openLeads],
         ["pipelineValueUsd", snapshot.pipelineValueUsd],
         ["weightedForecastUsd", snapshot.weightedForecastUsd],
       ] as const)
     : ([
-        ["activeCustomers", snapshot.activeCustomers],
-        ["openQuotes", snapshot.openQuotes],
         ["activeOrders", snapshot.activeOrders],
         ["dueTasks", snapshot.dueTasks],
       ] as const);
 }
 import type { AuthorizationContext } from "@/lib/rbac";
+import { requirePermission } from "@/lib/rbac";
+import { dashboardAccessScope } from "@/modules/dashboard/dashboard-scope";
diff --git a/src/modules/dashboard/prisma-dashboard-repository.ts b/src/modules/dashboard/prisma-dashboard-repository.ts
index bc1e512..17e1be4 100644
--- a/src/modules/dashboard/prisma-dashboard-repository.ts
+++ b/src/modules/dashboard/prisma-dashboard-repository.ts
@@ -1,35 +1,49 @@
 import Decimal from "decimal.js";
 
 import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
 import type {
   DashboardRepository,
   DashboardSnapshot,
 } from "@/modules/dashboard/dashboard-service";
-import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
+import {
+  dashboardAccessScope,
+  dashboardOwnershipFilter,
+} from "@/modules/dashboard/dashboard-scope";
 import { weightedForecast } from "@/modules/crm/crm-domain";
 
 export class PrismaDashboardRepository implements DashboardRepository {
   async loadSnapshot(context: Parameters<DashboardRepository["loadSnapshot"]>[0]): Promise<DashboardSnapshot> {
+    requirePermission(context, "dashboard.read");
     const prisma = getPrisma();
+    const access = dashboardAccessScope(context);
     const ownership = dashboardOwnershipFilter(context);
-    const ownerId = dashboardOwnershipFilter(context).ownerId;
-    const followUpScope = ownerId
-      ? {
+    const ownerId = access.domain === "sales" ? access.ownerId : undefined;
+    const noSalesRows = { id: "00000000-0000-0000-0000-000000000000" };
+    const salesOwnership =
+      access.domain === "sales" ? ownership : noSalesRows;
+    const orderOwnership =
+      access.domain === "sales" ? ownership : {};
+    const followUpScope =
+      access.domain === "operations"
+        ? noSalesRows
+        : ownerId
+          ? {
           OR: [
             { customer: { ownerId } },
             { contact: { customer: { ownerId } } },
             { lead: { ownerId } },
             { opportunity: { ownerId } },
           ],
         }
-      : {};
+          : {};
     const now = new Date();
     const twelveMonthsAgo = new Date(now);
     twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11, 1);
     twelveMonthsAgo.setUTCHours(0, 0, 0, 0);
     const staleBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
     const [
       activeCustomers,
       openLeads,
       openQuotes,
       activeOrders,
@@ -41,146 +55,146 @@ export class PrismaDashboardRepository implements DashboardRepository {
       upcomingFollowUps,
       recentLeads,
       recentOrders,
       trendOrders,
       overdueFollowUps,
       highRiskCustomers,
       staleOpportunities,
     ] =
       await prisma.$transaction([
         prisma.customer.count({
-          where: { status: "ACTIVE", deletedAt: null, ...ownership },
+          where: { status: "ACTIVE", deletedAt: null, ...salesOwnership },
         }),
         prisma.lead.count({
           where: {
             status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
             deletedAt: null,
-            ...ownership,
+            ...salesOwnership,
           },
         }),
         prisma.quote.count({
           where: {
             status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
             deletedAt: null,
-            ...ownership,
+            ...salesOwnership,
           },
         }),
         prisma.salesOrder.count({
           where: {
             status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
             deletedAt: null,
-            ...ownership,
+            ...orderOwnership,
           },
         }),
         prisma.task.count({
           where: {
             assigneeId: context.userId,
             status: { in: ["OPEN", "IN_PROGRESS"] },
             dueAt: { lte: new Date() },
             deletedAt: null,
           },
         }),
         prisma.customer.findMany({
-          where: { deletedAt: null, ...ownership },
+          where: { deletedAt: null, ...salesOwnership },
           orderBy: { createdAt: "desc" },
           take: 5,
           select: {
             id: true,
             companyName: true,
             countryCode: true,
             createdAt: true,
           },
         }),
         prisma.opportunity.groupBy({
           by: ["stage"],
-          where: { deletedAt: null, ...ownership },
+          where: { deletedAt: null, ...salesOwnership },
           orderBy: { stage: "asc" },
           _count: { id: true },
           _sum: { valueUsd: true },
         }),
         prisma.opportunity.findMany({
           where: {
             deletedAt: null,
             stage: { not: "LOST" },
-            ...ownership,
+            ...salesOwnership,
           },
           select: { valueUsd: true, probability: true, stage: true },
         }),
         prisma.lead.groupBy({
           by: ["source"],
-          where: { deletedAt: null, ...ownership },
+          where: { deletedAt: null, ...salesOwnership },
           _count: { id: true },
           orderBy: { _count: { source: "desc" } },
           take: 8,
         }),
         prisma.followUp.findMany({
           where: {
             deletedAt: null,
             completedAt: null,
             nextActionAt: { gte: now },
             ...followUpScope,
           },
           orderBy: { nextActionAt: "asc" },
           take: 6,
           include: {
             customer: { select: { companyName: true } },
             lead: { select: { companyName: true } },
             opportunity: { select: { name: true } },
           },
         }),
         prisma.lead.findMany({
-          where: { deletedAt: null, ...ownership },
+          where: { deletedAt: null, ...salesOwnership },
           orderBy: { createdAt: "desc" },
           take: 5,
           select: { id: true, companyName: true, status: true, createdAt: true },
         }),
         prisma.salesOrder.findMany({
-          where: { deletedAt: null, ...ownership },
+          where: { deletedAt: null, ...orderOwnership },
           orderBy: { createdAt: "desc" },
           take: 5,
           select: {
             id: true,
             orderNumber: true,
             status: true,
             totalUsd: true,
             createdAt: true,
           },
         }),
         prisma.salesOrder.findMany({
           where: {
             deletedAt: null,
             createdAt: { gte: twelveMonthsAgo },
-            ...ownership,
+            ...orderOwnership,
           },
           select: { createdAt: true, totalUsd: true },
         }),
         prisma.followUp.count({
           where: {
             deletedAt: null,
             completedAt: null,
             nextActionAt: { lt: now },
             ...followUpScope,
           },
         }),
         prisma.customer.count({
           where: {
             deletedAt: null,
             riskRating: "HIGH",
-            ...ownership,
+            ...salesOwnership,
           },
         }),
         prisma.opportunity.count({
           where: {
             deletedAt: null,
             stage: { notIn: ["WON", "LOST"] },
             updatedAt: { lt: staleBefore },
-            ...ownership,
+            ...salesOwnership,
           },
         }),
       ]);
 
     const monthly = new Map<string, { count: number; valueUsd: Decimal }>();
     for (const order of trendOrders) {
       const month = order.createdAt.toISOString().slice(0, 7);
       const entry = monthly.get(month) ?? { count: 0, valueUsd: new Decimal(0) };
       entry.count += 1;
       entry.valueUsd = entry.valueUsd.plus(order.totalUsd.toString());
