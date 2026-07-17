# Customer Follow-up Creation and Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working localized follow-up creation form to customer detail and include Contact- and Opportunity-related follow-up audits in customer Activity.

**Architecture:** Reuse the existing generic mutation form and validated follow-up API. Add one pure audit-query helper so relation expansion is deterministic and unit-testable, then feed it IDs from the already-scoped customer detail record.

**Tech Stack:** Next.js 16 server components, React 19, TypeScript, Prisma 7, Zod, Vitest, next-intl-style dictionaries.

## Global Constraints

- Always submit the current Customer ID.
- Optional Contact and Opportunity choices must come only from the loaded Customer detail.
- Reuse `POST /api/follow-ups`; do not add an endpoint or database migration.
- Provide English and Chinese strings plus loading, success, and failure feedback.
- Preserve all unrelated untracked workspace files.

---

### Task 1: Expand Customer Activity Follow-up Audit Scope

**Files:**
- Modify: `src/modules/crm/crm-domain.test.ts`
- Modify: `src/modules/crm/crm-domain.ts`
- Modify: `src/modules/crm/prisma-crm-repository.ts`

**Interfaces:**
- Produces: `customerActivityWhere(customerId: string, contactIds: readonly string[], opportunityIds: readonly string[])`
- Consumes: loaded Customer Contact and Opportunity IDs plus existing audit metadata paths.

- [ ] **Step 1: Write the failing domain test**

Add an assertion that `customerActivityWhere("customer-1", ["contact-1"], ["opportunity-1"])` returns direct Customer and Contact audit clauses, a customer-linked FollowUp clause, and FollowUp clauses whose metadata `contactId` and `opportunityId` match the supplied related IDs.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test src/modules/crm/crm-domain.test.ts`

Expected: failure because `customerActivityWhere` is not exported.

- [ ] **Step 3: Implement the minimal helper and repository integration**

Return a Prisma-compatible `{ OR: [...] }` object from the helper. Replace the inline Activity `where` object in `getCustomerDetail` and pass `customer.contacts.map(({ id }) => id)` plus `customer.opportunities.map(({ id }) => id)`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm test src/modules/crm/crm-domain.test.ts`

Expected: all CRM domain tests pass.

### Task 2: Add the Localized Customer Follow-up Form

**Files:**
- Modify: `src/i18n/dictionaries.test.ts`
- Modify: `src/i18n/dictionaries.ts`
- Modify: `src/app/[locale]/(app)/customers/[id]/page.tsx`

**Interfaces:**
- Consumes: `ApiMutationForm`, `customer.contacts`, `customer.opportunities`, `crm.followUpTypes`, `crm.channels`, and existing field/feedback strings.
- Produces: a POST body accepted by `followUpSchema`, including `customerId`, optional `contactId`/`opportunityId`, required `type`/`channel`/`summary`/`occurredAt`, and optional follow-up details.

- [ ] **Step 1: Write the failing localization test**

Assert that English and Chinese dictionaries expose localized `addFollowUp`, `relatedContact`, and `relatedOpportunity` strings.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test src/i18n/dictionaries.test.ts`

Expected: failure because the new relation labels do not exist.

- [ ] **Step 3: Add minimal dictionary strings and form markup**

Add the three labels to both dictionaries. Under the Follow-ups section, render a details disclosure containing `ApiMutationForm` with:

- hidden `customerId`;
- optional Contact and Opportunity selects;
- required type, channel, summary, and local datetime inputs;
- optional outcome, next action, and next-action datetime inputs;
- `dateFields={["occurredAt", "nextActionAt"]}`;
- existing localized loading, success, and failure props.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm test src/modules/crm/crm-domain.test.ts src/i18n/dictionaries.test.ts`

Expected: both files pass.

### Task 3: Verify, Report, and Commit

**Files:**
- Modify: `.superpowers/sdd/task-2-report.md`
- Include: `docs/superpowers/plans/2026-07-17-customer-follow-up-activity.md`

- [ ] **Step 1: Run the fresh full gate**

Run:

```powershell
pnpm test
pnpm typecheck
pnpm lint
$env:DATABASE_URL='postgresql://crm:crm@localhost:5432/crm'; pnpm prisma:generate
$env:DATABASE_URL='postgresql://crm:crm@localhost:5432/crm'; pnpm build
```

Expected: every command exits `0`, all tests pass, Prisma Client generates, and the production build completes.

- [ ] **Step 2: Append exact evidence to the Task 2 report**

Record the focused RED/GREEN observations, final command results, delivered form fields/feedback, and expanded Activity audit scope.

- [ ] **Step 3: Inspect and commit only scoped changes**

Run `git diff --check`, stage only the files named by this plan plus the report, inspect `git diff --cached --check`, and commit with:

```text
fix: complete customer follow-up workflow
```
