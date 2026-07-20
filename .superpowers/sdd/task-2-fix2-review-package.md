# Commit list
2d22ca1 fix: complete customer follow-up workflow
7845df5 docs: design customer follow-up creation

# Stat
 .superpowers/sdd/task-2-report.md                  |  22 ++++
 .../2026-07-17-customer-follow-up-activity.md      | 120 +++++++++++++++++++++
 ...026-07-17-customer-follow-up-activity-design.md |  32 ++++++
 src/app/[locale]/(app)/customers/[id]/page.tsx     |  15 ++-
 src/i18n/dictionaries.test.ts                      |  12 +++
 src/i18n/dictionaries.ts                           |   4 +
 src/modules/crm/crm-domain.test.ts                 |  34 ++++++
 src/modules/crm/crm-domain.ts                      |  28 +++++
 src/modules/crm/prisma-crm-repository.ts           |  15 +--
 9 files changed, 274 insertions(+), 8 deletions(-)

# Full diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
index 1689c14..9d741f3 100644
--- a/.superpowers/sdd/task-2-report.md
+++ b/.superpowers/sdd/task-2-report.md
@@ -91,20 +91,42 @@ Review red/green evidence:
 
 Final fresh review gate:
 
 - Focused suite: 5 files passed, 40 tests passed, 0 failed.
 - `pnpm test`: 17 files passed, 90 tests passed, 0 failed.
 - `pnpm typecheck`: exit `0`.
 - `pnpm lint`: exit `0`.
 - `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`: exit `0`; Prisma Client 7.8.0 generated.
 - `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`: exit `0`; Next.js 16.2.10 generated 29 routes/pages.
 
+## Final Customer Follow-up Fix
+
+- Customer detail now includes a working follow-up creation form that always relates the record to the current Customer and optionally adds one of that Customer's Contacts or Opportunities.
+- The form reuses the validated `POST /api/follow-ups` API and existing mutation component. It supports type, channel, summary, occurred time, outcome, next action, and next-action time with localized loading, success, and error feedback.
+- Customer Activity now includes FollowUp audit entries whose metadata relates through `contactId` or `opportunityId`, in addition to direct `customerId` entries.
+- English and Chinese relation labels were added.
+
+Focused red/green evidence:
+
+- Activity test RED: 1 failure, `customerActivityWhere is not a function`.
+- Activity test GREEN: 20/20 CRM domain tests passed.
+- Localization test RED: 1 failure because `relatedContact` was missing.
+- Combined focused GREEN: 2 files passed, 26 tests passed.
+
+Fresh final gate:
+
+- `npm test`: exit `0`; 17 files passed, 92 tests passed.
+- `npm run typecheck`: exit `0`.
+- `npm run lint`: exit `0`.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm npm run prisma:generate`: exit `0`; Prisma Client 7.8.0 generated.
+- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm npm run build`: exit `0`; Next.js 16.2.10 generated 29 routes/pages.
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
diff --git a/docs/superpowers/plans/2026-07-17-customer-follow-up-activity.md b/docs/superpowers/plans/2026-07-17-customer-follow-up-activity.md
new file mode 100644
index 0000000..8fd9a13
--- /dev/null
+++ b/docs/superpowers/plans/2026-07-17-customer-follow-up-activity.md
@@ -0,0 +1,120 @@
+# Customer Follow-up Creation and Activity Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
+
+**Goal:** Add a working localized follow-up creation form to customer detail and include Contact- and Opportunity-related follow-up audits in customer Activity.
+
+**Architecture:** Reuse the existing generic mutation form and validated follow-up API. Add one pure audit-query helper so relation expansion is deterministic and unit-testable, then feed it IDs from the already-scoped customer detail record.
+
+**Tech Stack:** Next.js 16 server components, React 19, TypeScript, Prisma 7, Zod, Vitest, next-intl-style dictionaries.
+
+## Global Constraints
+
+- Always submit the current Customer ID.
+- Optional Contact and Opportunity choices must come only from the loaded Customer detail.
+- Reuse `POST /api/follow-ups`; do not add an endpoint or database migration.
+- Provide English and Chinese strings plus loading, success, and failure feedback.
+- Preserve all unrelated untracked workspace files.
+
+---
+
+### Task 1: Expand Customer Activity Follow-up Audit Scope
+
+**Files:**
+- Modify: `src/modules/crm/crm-domain.test.ts`
+- Modify: `src/modules/crm/crm-domain.ts`
+- Modify: `src/modules/crm/prisma-crm-repository.ts`
+
+**Interfaces:**
+- Produces: `customerActivityWhere(customerId: string, contactIds: readonly string[], opportunityIds: readonly string[])`
+- Consumes: loaded Customer Contact and Opportunity IDs plus existing audit metadata paths.
+
+- [ ] **Step 1: Write the failing domain test**
+
+Add an assertion that `customerActivityWhere("customer-1", ["contact-1"], ["opportunity-1"])` returns direct Customer and Contact audit clauses, a customer-linked FollowUp clause, and FollowUp clauses whose metadata `contactId` and `opportunityId` match the supplied related IDs.
+
+- [ ] **Step 2: Run the focused test and verify RED**
+
+Run: `pnpm test src/modules/crm/crm-domain.test.ts`
+
+Expected: failure because `customerActivityWhere` is not exported.
+
+- [ ] **Step 3: Implement the minimal helper and repository integration**
+
+Return a Prisma-compatible `{ OR: [...] }` object from the helper. Replace the inline Activity `where` object in `getCustomerDetail` and pass `customer.contacts.map(({ id }) => id)` plus `customer.opportunities.map(({ id }) => id)`.
+
+- [ ] **Step 4: Run the focused test and verify GREEN**
+
+Run: `pnpm test src/modules/crm/crm-domain.test.ts`
+
+Expected: all CRM domain tests pass.
+
+### Task 2: Add the Localized Customer Follow-up Form
+
+**Files:**
+- Modify: `src/i18n/dictionaries.test.ts`
+- Modify: `src/i18n/dictionaries.ts`
+- Modify: `src/app/[locale]/(app)/customers/[id]/page.tsx`
+
+**Interfaces:**
+- Consumes: `ApiMutationForm`, `customer.contacts`, `customer.opportunities`, `crm.followUpTypes`, `crm.channels`, and existing field/feedback strings.
+- Produces: a POST body accepted by `followUpSchema`, including `customerId`, optional `contactId`/`opportunityId`, required `type`/`channel`/`summary`/`occurredAt`, and optional follow-up details.
+
+- [ ] **Step 1: Write the failing localization test**
+
+Assert that English and Chinese dictionaries expose localized `addFollowUp`, `relatedContact`, and `relatedOpportunity` strings.
+
+- [ ] **Step 2: Run the focused test and verify RED**
+
+Run: `pnpm test src/i18n/dictionaries.test.ts`
+
+Expected: failure because the new relation labels do not exist.
+
+- [ ] **Step 3: Add minimal dictionary strings and form markup**
+
+Add the three labels to both dictionaries. Under the Follow-ups section, render a details disclosure containing `ApiMutationForm` with:
+
+- hidden `customerId`;
+- optional Contact and Opportunity selects;
+- required type, channel, summary, and local datetime inputs;
+- optional outcome, next action, and next-action datetime inputs;
+- `dateFields={["occurredAt", "nextActionAt"]}`;
+- existing localized loading, success, and failure props.
+
+- [ ] **Step 4: Run focused tests and verify GREEN**
+
+Run: `pnpm test src/modules/crm/crm-domain.test.ts src/i18n/dictionaries.test.ts`
+
+Expected: both files pass.
+
+### Task 3: Verify, Report, and Commit
+
+**Files:**
+- Modify: `.superpowers/sdd/task-2-report.md`
+- Include: `docs/superpowers/plans/2026-07-17-customer-follow-up-activity.md`
+
+- [ ] **Step 1: Run the fresh full gate**
+
+Run:
+
+```powershell
+pnpm test
+pnpm typecheck
+pnpm lint
+$env:DATABASE_URL='postgresql://crm:crm@localhost:5432/crm'; pnpm prisma:generate
+$env:DATABASE_URL='postgresql://crm:crm@localhost:5432/crm'; pnpm build
+```
+
+Expected: every command exits `0`, all tests pass, Prisma Client generates, and the production build completes.
+
+- [ ] **Step 2: Append exact evidence to the Task 2 report**
+
+Record the focused RED/GREEN observations, final command results, delivered form fields/feedback, and expanded Activity audit scope.
+
+- [ ] **Step 3: Inspect and commit only scoped changes**
+
+Run `git diff --check`, stage only the files named by this plan plus the report, inspect `git diff --cached --check`, and commit with:
+
+```text
+fix: complete customer follow-up workflow
+```
diff --git a/docs/superpowers/specs/2026-07-17-customer-follow-up-activity-design.md b/docs/superpowers/specs/2026-07-17-customer-follow-up-activity-design.md
new file mode 100644
index 0000000..cf7910c
--- /dev/null
+++ b/docs/superpowers/specs/2026-07-17-customer-follow-up-activity-design.md
@@ -0,0 +1,32 @@
+# Customer Follow-up Creation and Activity Design
+
+## Goal
+
+Complete the customer-detail follow-up workflow by allowing a user to create a follow-up for the current customer, optionally relate it to one of that customer's Contacts or Opportunities, and show all such follow-up audit events in the customer's Activity timeline.
+
+## UI and Data Flow
+
+The customer detail page will reuse `ApiMutationForm` and the validated `POST /api/follow-ups` endpoint. The form will always submit the current `customerId`; it will offer optional Contact and Opportunity selectors populated only from the already-authorized customer detail result. It will collect the existing follow-up schema's required type, channel, summary, and occurred timestamp fields, plus optional outcome, next action, and next-action timestamp fields.
+
+`ApiMutationForm` will continue to provide disabled/loading submission, localized success feedback, localized error feedback, reset after creation, and router refresh. No new endpoint, client state manager, or persistence field is required.
+
+## Activity Query
+
+A pure `customerActivityWhere(customerId, contactIds, opportunityIds)` helper will build the Prisma audit filter. It will retain direct Customer, Contact, and customer-linked FollowUp clauses, and add one FollowUp metadata clause for every Contact and Opportunity belonging to the customer. `getCustomerDetail` will pass the IDs from its already-scoped customer query to this helper.
+
+This design relies on the existing follow-up audit metadata, which consistently records `customerId`, `contactId`, and `opportunityId`.
+
+## Localization
+
+English and Chinese dictionaries will add only the labels needed by the form: add follow-up and relation selectors. Existing field, option, follow-up type, channel, action, and feedback strings will be reused.
+
+## Verification
+
+- A focused domain test will prove the Activity filter includes direct customer, contact-linked, and opportunity-linked FollowUp audit clauses.
+- Dictionary tests will prove the new English and Chinese labels exist.
+- The focused tests will be observed failing before production changes and passing afterward.
+- The full test suite, typecheck, lint, Prisma generation, and production build will run before commit.
+
+## Scope
+
+No new API route, database migration, attachment upload UI, Lead relation selector, or unrelated customer-detail refactor is included.
diff --git a/src/app/[locale]/(app)/customers/[id]/page.tsx b/src/app/[locale]/(app)/customers/[id]/page.tsx
index 1aece0d..9f3566d 100644
--- a/src/app/[locale]/(app)/customers/[id]/page.tsx
+++ b/src/app/[locale]/(app)/customers/[id]/page.tsx
@@ -57,21 +57,34 @@ export default async function CustomerDetailPage({
             <label>{crm.fields.firstName}<input defaultValue={contact.firstName} name="firstName" required /></label><label>{crm.fields.lastName}<input defaultValue={contact.lastName} name="lastName" /></label><label>{crm.fields.email}<input defaultValue={contact.email ?? ""} name="email" type="email" /></label><label>{crm.fields.phone}<input defaultValue={contact.phone ?? ""} name="phone" /></label>
             <label>{crm.fields.decisionRole}<select defaultValue={contact.decisionRole ?? ""} name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{crm.fields.language}<input defaultValue={contact.language} name="language" /></label><label>{crm.fields.timezone}<input defaultValue={contact.timezone ?? ""} name="timezone" /></label><label><input defaultChecked={contact.isPrimary} name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
           </ApiMutationForm><ArchiveButton endpoint={`/api/customers/${customer.id}/contacts/${contact.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details>
         </article>)}</div> : <Empty text={dictionary.crm.empty} />}
         <details><summary>{crm.actions.addContact}</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
           <label>{crm.fields.firstName}<input name="firstName" required /></label><label>{crm.fields.lastName}<input name="lastName" /></label><label>{crm.fields.email}<input name="email" type="email" /></label><label>{crm.fields.phone}<input name="phone" /></label>
           <label>{crm.fields.decisionRole}<select name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
           <label>{crm.fields.language}<input defaultValue="en" name="language" /></label><label>{crm.fields.timezone}<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
         </ApiMutationForm></details>
       </section>
-      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{crm.followUpTypes[item.type as keyof typeof crm.followUpTypes] ?? item.type} · {crm.channels[item.channel as keyof typeof crm.channels] ?? item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time><details><summary>{crm.edit}</summary><ApiMutationForm endpoint={`/api/follow-ups/${item.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}><label>{crm.fields.summary}<textarea defaultValue={item.summary} name="summary" rows={2} /></label><label>{crm.fields.outcome}<input defaultValue={item.outcome ?? ""} name="outcome" /></label><label>{crm.fields.nextAction}<input defaultValue={item.nextAction ?? ""} name="nextAction" /></label></ApiMutationForm><ArchiveButton endpoint={`/api/follow-ups/${item.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
+      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{crm.followUpTypes[item.type as keyof typeof crm.followUpTypes] ?? item.type} · {crm.channels[item.channel as keyof typeof crm.channels] ?? item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time><details><summary>{crm.edit}</summary><ApiMutationForm endpoint={`/api/follow-ups/${item.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}><label>{crm.fields.summary}<textarea defaultValue={item.summary} name="summary" rows={2} /></label><label>{crm.fields.outcome}<input defaultValue={item.outcome ?? ""} name="outcome" /></label><label>{crm.fields.nextAction}<input defaultValue={item.nextAction ?? ""} name="nextAction" /></label></ApiMutationForm><ArchiveButton endpoint={`/api/follow-ups/${item.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details></li>)}</ol> : <Empty text={dictionary.crm.empty} />}
+        <details><summary>{crm.actions.addFollowUp}</summary><ApiMutationForm dateFields={["occurredAt", "nextActionAt"]} endpoint="/api/follow-ups" failureMessage={crm.failed} loadingLabel={crm.loading} submitLabel={crm.create} successMessage={crm.success}>
+          <input name="customerId" type="hidden" value={customer.id} />
+          <label>{crm.fields.relatedContact}<select defaultValue="" name="contactId"><option value="">{crm.options.none}</option>{customer.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select></label>
+          <label>{crm.fields.relatedOpportunity}<select defaultValue="" name="opportunityId"><option value="">{crm.options.none}</option>{customer.opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.name}</option>)}</select></label>
+          <label>{crm.fields.type}<select name="type" required>{Object.entries(crm.followUpTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
+          <label>{crm.fields.channel}<select name="channel" required>{Object.entries(crm.channels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
+          <label>{crm.fields.summary}<textarea minLength={2} name="summary" required rows={3} /></label>
+          <label>{crm.fields.occurred}<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
+          <label>{crm.fields.outcome}<input name="outcome" /></label>
+          <label>{crm.fields.nextAction}<input name="nextAction" /></label>
+          <label>{crm.fields.nextActionDate}<input name="nextActionAt" type="datetime-local" /></label>
+        </ApiMutationForm></details>
+      </section>
       <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{crm.statuses[item.stage]}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="quotations"><h2>{tabs.quotations}</h2>{customer.quotes.length ? <div className="record-grid">{customer.quotes.map((item) => <article className="record-card" key={item.id}><strong>{item.quoteNumber}</strong><span>{item.status}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="orders"><h2>{tabs.orders}</h2>{customer.orders.length ? <div className="record-grid">{customer.orders.map((item) => <article className="record-card" key={item.id}><strong>{item.orderNumber}</strong><span>{item.status}</span><span>${item.totalUsd.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="payments"><h2>{tabs.payments}</h2>{payments.length ? <div className="record-grid">{payments.map((item) => <article className="record-card" key={item.id}><strong>{item.reference ?? item.id}</strong><span>{item.status}</span><span>{item.currencyCode} {item.amount.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? crm.options.noTracking}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="afterSales"><h2>{tabs.afterSales}</h2>{customer.tickets.length ? <div className="record-grid">{customer.tickets.map((item) => <article className="record-card" key={item.id}><strong>{item.ticketNumber}</strong><span>{item.status}</span><span>{item.subject}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="files"><h2>{tabs.files}</h2>{customer.files.length ? <div className="record-grid">{customer.files.map((item) => <article className="record-card" key={item.id}><strong>{item.fileName}</strong><span>{item.contentType}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
       <section className="card detail-section" id="activity"><h2>{tabs.activity}</h2>{customer.activity.length ? <ol className="timeline">{customer.activity.map((item) => <li key={item.id}><strong>{item.action}</strong><time>{item.createdAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
     </>
   );
diff --git a/src/i18n/dictionaries.test.ts b/src/i18n/dictionaries.test.ts
index ebd50d7..619cd4f 100644
--- a/src/i18n/dictionaries.test.ts
+++ b/src/i18n/dictionaries.test.ts
@@ -46,11 +46,23 @@ describe("locale dictionaries", () => {
   it("localizes Task 2 forms, dialogs, feedback, pagination, and boards", () => {
     const dictionary = getDictionary("zh").crm;
 
     expect(dictionary.fields.opportunityName).toBe("\u5546\u673a\u540d\u79f0");
     expect(dictionary.actions.assignOwner).toBe("\u5206\u914d\u8d1f\u8d23\u4eba");
     expect(dictionary.feedback.archiveConfirm).toContain("\u5f52\u6863");
     expect(dictionary.pagination.previous).toBe("\u4e0a\u4e00\u9875");
     expect(dictionary.statuses.NEGOTIATION).toBe("\u8c08\u5224");
     expect(dictionary.channels.WECHAT).toBe("\u5fae\u4fe1");
   });
+
+  it("localizes customer follow-up creation relations in English and Chinese", () => {
+    const english = getDictionary("en").crm;
+    const chinese = getDictionary("zh").crm;
+
+    expect(english.actions.addFollowUp).toBe("Add follow-up");
+    expect(english.fields.relatedContact).toBe("Related contact");
+    expect(english.fields.relatedOpportunity).toBe("Related opportunity");
+    expect(chinese.actions.addFollowUp).toBe("\u6dfb\u52a0\u8ddf\u8fdb");
+    expect(chinese.fields.relatedContact).toBe("\u5173\u8054\u8054\u7cfb\u4eba");
+    expect(chinese.fields.relatedOpportunity).toBe("\u5173\u8054\u5546\u673a");
+  });
 });
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
index 3d13c50..8b8904b 100644
--- a/src/i18n/dictionaries.ts
+++ b/src/i18n/dictionaries.ts
@@ -117,20 +117,22 @@ const dictionaries = {
         level: "Level",
         risk: "Risk",
         riskNotes: "Risk notes",
         contacts: "Contacts",
         opportunities: "Opportunities",
         decisionRole: "Decision role",
         language: "Language",
         timezone: "Timezone",
         primary: "Primary contact",
         customer: "Customer",
+        relatedContact: "Related contact",
+        relatedOpportunity: "Related opportunity",
         name: "Name",
         value: "Value",
         currency: "Currency",
         exchangeRate: "USD exchange rate",
         probability: "Probability",
         expectedClose: "Expected close",
         opportunityName: "Opportunity name",
         type: "Type",
         channel: "Channel",
         summary: "Summary",
@@ -420,20 +422,22 @@ const dictionaries = {
         level: "\u7ea7\u522b",
         risk: "\u98ce\u9669",
         riskNotes: "\u98ce\u9669\u5907\u6ce8",
         contacts: "\u8054\u7cfb\u4eba",
         opportunities: "\u5546\u673a",
         decisionRole: "\u51b3\u7b56\u89d2\u8272",
         language: "\u8bed\u8a00",
         timezone: "\u65f6\u533a",
         primary: "\u4e3b\u8054\u7cfb\u4eba",
         customer: "\u5ba2\u6237",
+        relatedContact: "\u5173\u8054\u8054\u7cfb\u4eba",
+        relatedOpportunity: "\u5173\u8054\u5546\u673a",
         name: "\u540d\u79f0",
         value: "\u91d1\u989d",
         currency: "\u5e01\u79cd",
         exchangeRate: "\u7f8e\u5143\u6c47\u7387",
         probability: "\u6982\u7387",
         expectedClose: "\u9884\u8ba1\u7ed3\u5355",
         opportunityName: "\u5546\u673a\u540d\u79f0",
         type: "\u7c7b\u578b",
         channel: "\u6e20\u9053",
         summary: "\u6458\u8981",
diff --git a/src/modules/crm/crm-domain.test.ts b/src/modules/crm/crm-domain.test.ts
index ad4ed0f..e47de24 100644
--- a/src/modules/crm/crm-domain.test.ts
+++ b/src/modules/crm/crm-domain.test.ts
@@ -2,20 +2,21 @@ import { describe, expect, it } from "vitest";
 
 import type { AuthorizationContext } from "@/lib/rbac";
 import {
   assertOpportunityTransition,
   assertOwned,
   assertPrimaryContactChange,
   findLeadDuplicates,
   isFollowUpOverdue,
   crmOwnerWhere,
   assertLeadMutable,
+  customerActivityWhere,
   customerTimelineWhere,
   followUpRelationMetadata,
   opportunityStageGuard,
   resolveOpportunityOwner,
   weightedForecast,
 } from "@/modules/crm/crm-domain";
 
 const representative: AuthorizationContext = {
   userId: "sales-1",
   roles: ["SALES_REP"],
@@ -100,20 +101,53 @@ describe("lead duplicate detection", () => {
 });
 
 describe("converted lead immutability", () => {
   it("rejects edits and batch changes after conversion", () => {
     expect(() => assertLeadMutable("CONVERTED")).toThrowError(/converted/i);
     expect(() => assertLeadMutable("QUALIFIED")).not.toThrow();
   });
 });
 
 describe("customer relationship invariants", () => {
+  it("loads contact- and opportunity-related follow-up audits into customer activity", () => {
+    expect(
+      customerActivityWhere(
+        "customer-1",
+        ["contact-1"],
+        ["opportunity-1"],
+      ),
+    ).toEqual({
+      OR: [
+        { entityType: "Customer", entityId: "customer-1" },
+        {
+          entityType: "Contact",
+          metadata: { path: ["customerId"], equals: "customer-1" },
+        },
+        {
+          entityType: "FollowUp",
+          metadata: { path: ["customerId"], equals: "customer-1" },
+        },
+        {
+          entityType: "FollowUp",
+          metadata: { path: ["contactId"], equals: "contact-1" },
+        },
+        {
+          entityType: "FollowUp",
+          metadata: {
+            path: ["opportunityId"],
+            equals: "opportunity-1",
+          },
+        },
+      ],
+    });
+  });
+
   it("loads direct, contact, and opportunity follow-ups into the timeline", () => {
     expect(customerTimelineWhere("customer-1")).toEqual({
       deletedAt: null,
       OR: [
         { customerId: "customer-1" },
         { contact: { customerId: "customer-1" } },
         { opportunity: { customerId: "customer-1" } },
       ],
     });
   });
diff --git a/src/modules/crm/crm-domain.ts b/src/modules/crm/crm-domain.ts
index bcd41ce..0e7fe6a 100644
--- a/src/modules/crm/crm-domain.ts
+++ b/src/modules/crm/crm-domain.ts
@@ -43,20 +43,48 @@ export function customerTimelineWhere(customerId: string) {
   return {
     deletedAt: null,
     OR: [
       { customerId },
       { contact: { customerId } },
       { opportunity: { customerId } },
     ],
   };
 }
 
+export function customerActivityWhere(
+  customerId: string,
+  contactIds: readonly string[],
+  opportunityIds: readonly string[],
+) {
+  return {
+    OR: [
+      { entityType: "Customer", entityId: customerId },
+      {
+        entityType: "Contact",
+        metadata: { path: ["customerId"], equals: customerId },
+      },
+      {
+        entityType: "FollowUp",
+        metadata: { path: ["customerId"], equals: customerId },
+      },
+      ...contactIds.map((contactId) => ({
+        entityType: "FollowUp",
+        metadata: { path: ["contactId"], equals: contactId },
+      })),
+      ...opportunityIds.map((opportunityId) => ({
+        entityType: "FollowUp",
+        metadata: { path: ["opportunityId"], equals: opportunityId },
+      })),
+    ],
+  };
+}
+
 export interface FollowUpRelationIds {
   customerId?: string | null;
   contactId?: string | null;
   leadId?: string | null;
   opportunityId?: string | null;
 }
 
 export function followUpRelationMetadata(input: FollowUpRelationIds) {
   return {
     customerId: input.customerId ?? null,
diff --git a/src/modules/crm/prisma-crm-repository.ts b/src/modules/crm/prisma-crm-repository.ts
index a4d9e67..bb19d2e 100644
--- a/src/modules/crm/prisma-crm-repository.ts
+++ b/src/modules/crm/prisma-crm-repository.ts
@@ -2,20 +2,21 @@ import Decimal from "decimal.js";
 
 import type { Prisma } from "@/generated/prisma/client";
 import { getPrisma } from "@/lib/prisma";
 import { writeAudit } from "@/lib/audit";
 import { DomainError } from "@/lib/errors";
 import type { AuthorizationContext } from "@/lib/rbac";
 import {
   assertLeadMutable,
   assertPrimaryContactChange,
   crmOwnerWhere,
+  customerActivityWhere,
   customerTimelineWhere,
   findLeadDuplicates,
   followUpRelationMetadata,
   opportunityStageGuard,
   resolveOpportunityOwner,
 } from "@/modules/crm/crm-domain";
 import type {
   AtomicConversionInput,
   CrmRepository,
   LeadForConversion,
@@ -542,27 +543,27 @@ export class PrismaCrmRepository implements CrmRepository {
     const [followUps, files, activity] = await prisma.$transaction([
       prisma.followUp.findMany({
         where: customerTimelineWhere(id),
         orderBy: { occurredAt: "desc" },
       }),
       prisma.fileAsset.findMany({
         where: { entityType: "Customer", entityId: id, deletedAt: null },
         orderBy: { createdAt: "desc" },
       }),
       prisma.auditLog.findMany({
-        where: {
-          OR: [
-            { entityType: "Customer", entityId: id },
-            { entityType: "Contact", metadata: { path: ["customerId"], equals: id } },
-            { entityType: "FollowUp", metadata: { path: ["customerId"], equals: id } },
-          ],
-        },
+        where: customerActivityWhere(
+          id,
+          customer.contacts.map(({ id: contactId }) => contactId),
+          customer.opportunities.map(
+            ({ id: opportunityId }) => opportunityId,
+          ),
+        ),
         orderBy: { createdAt: "desc" },
         take: 50,
       }),
     ]);
     return { ...customer, followUps, files, activity };
   }
 
   async createCustomer(context: AuthorizationContext, input: CreateCustomerData) {
     const ownId = ownerIdFor(context);
     if (ownId && input.ownerId !== ownId) {
