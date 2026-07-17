# Sales CRM Task 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a role-scoped sales CRM covering dashboard insights, leads, customers, contacts, follow-ups, opportunities, CSV exchange, and deterministic representative data.

**Architecture:** Extend the existing Next.js/Prisma modular monolith with pure CRM domain rules, repository interfaces that always receive the authorization context, Prisma repositories that enforce ownership again at query and transaction boundaries, thin API routes, and server-rendered pages with small client mutation controls. Database constraints back application invariants where possible.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 7/PostgreSQL, Zod 4, Vitest, CSS.

## Global Constraints

- Follow existing module, API, UI, validation, audit, i18n, repository, service, and RBAC patterns.
- Use red-green TDD for every new domain behavior.
- Sales Representatives can only read and mutate owned CRM records.
- Every mutation is audited and important multi-record workflows are transactional.
- Primary controls work and mutations expose loading, success, and failure states.
- Do not add fake records to empty detail tabs.

---

### Task 1: CRM domain rules

**Files:**
- Create: `src/modules/crm/crm-domain.test.ts`
- Create: `src/modules/crm/crm-domain.ts`

**Interfaces:**
- Produces: `assertOwned`, `findLeadDuplicates`, `assertPrimaryContactChange`, `isFollowUpOverdue`, `assertOpportunityTransition`, `weightedForecast`.

- [ ] **Step 1: Write failing ownership, duplicate, contact, overdue, transition, and forecast tests**

```ts
expect(() => assertOwned(rep, { ownerId: "other" }, "lead.update")).toThrow();
expect(findLeadDuplicates(candidate, rows)).toEqual(["lead-1"]);
expect(() => assertPrimaryContactChange(true, ["contact-1"])).toThrow();
expect(isFollowUpOverdue(row, now)).toBe(true);
expect(() => assertOpportunityTransition("WON", "DISCOVERY")).toThrow();
expect(weightedForecast([{ valueUsd: "100", probability: 30 }])).toBe("30.00");
```

- [ ] **Step 2: Run `pnpm test src/modules/crm/crm-domain.test.ts` and confirm missing-module failure**

- [ ] **Step 3: Implement only the tested domain rules with `DomainError` failures**

- [ ] **Step 4: Run the focused test and confirm all cases pass**

### Task 2: Transactional service workflows and CSV

**Files:**
- Create: `src/modules/crm/crm-service.test.ts`
- Create: `src/modules/crm/crm-service.ts`
- Create: `src/modules/crm/csv.ts`
- Create: `src/modules/crm/csv.test.ts`

**Interfaces:**
- Produces: `convertLead`, `moveOpportunity`, `previewLeadCsv`, `exportLeadCsv`.
- Consumes: authorization-aware `CrmRepository` methods and Task 1 rules.

- [ ] **Step 1: Write failing tests proving conversion delegates one repository transaction, preserves owner, and rejects foreign records**

- [ ] **Step 2: Run the focused service test and confirm missing exports**

- [ ] **Step 3: Implement minimal services and repository contracts**

- [ ] **Step 4: Write failing CSV tests for quoted cells, validation errors, and filtered export**

- [ ] **Step 5: Implement the parser, preview result, and escaping export; run both focused files**

### Task 3: Persistence schema and Prisma repository

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260717190000_sales_crm/migration.sql`
- Create: `src/modules/crm/prisma-crm-repository.ts`

**Interfaces:**
- Produces: scoped list/detail/create/update/batch/contact/follow-up/opportunity methods implementing `CrmRepository`.

- [ ] **Step 1: Add customer level/risk, contact communication fields, follow-up relations/metadata, opportunity outcome fields, indexes, and one-primary-contact partial unique index**

- [ ] **Step 2: Run `pnpm prisma:generate` and verify generated client succeeds**

- [ ] **Step 3: Implement every read with a repository ownership predicate and every mutation with an ownership precondition and audit record**

- [ ] **Step 4: Implement conversion using one Prisma interactive transaction**

### Task 4: CRM APIs

**Files:**
- Create: `src/app/api/leads/route.ts`
- Create: `src/app/api/leads/[id]/route.ts`
- Create: `src/app/api/leads/[id]/convert/route.ts`
- Create: `src/app/api/leads/batch/route.ts`
- Create: `src/app/api/leads/import/route.ts`
- Create: `src/app/api/leads/export/route.ts`
- Create: `src/app/api/customers/route.ts`
- Create: `src/app/api/customers/[id]/route.ts`
- Create: `src/app/api/customers/[id]/contacts/route.ts`
- Create: `src/app/api/follow-ups/route.ts`
- Create: `src/app/api/opportunities/route.ts`
- Create: `src/app/api/opportunities/[id]/stage/route.ts`

**Interfaces:**
- Consumes: current authorization context, RBAC, Zod schemas, CRM service/repository.
- Produces: existing `{ success, data }` / `{ success: false, error }` contracts.

- [ ] **Step 1: Define strict query/body schemas including pagination bounds and ISO dates**

- [ ] **Step 2: Require the matching permission before repository access**

- [ ] **Step 3: Return success envelopes and pass all failures through the shared handler**

- [ ] **Step 4: Ensure CSV preview does not commit until an explicit `commit: true` request**

### Task 5: Dashboard and CRM user interface

**Files:**
- Modify: `src/modules/dashboard/dashboard-service.ts`
- Modify: `src/modules/dashboard/prisma-dashboard-repository.ts`
- Modify: `src/modules/dashboard/dashboard-service.test.ts`
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/i18n/dictionaries.ts`
- Modify: `src/app/globals.css`
- Create: `src/components/crm/mutation-form.tsx`
- Create: `src/components/crm/opportunity-board.tsx`
- Create: `src/app/[locale]/(app)/leads/page.tsx`
- Create: `src/app/[locale]/(app)/leads/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/customers/page.tsx`
- Create: `src/app/[locale]/(app)/customers/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/opportunities/page.tsx`

**Interfaces:**
- Produces: repository-backed KPI/funnel/trend/source/follow-up/recent/risk UI and functional CRUD/conversion/stage controls.

- [ ] **Step 1: Extend the dashboard snapshot test first and confirm the repository fixture no longer compiles**

- [ ] **Step 2: Add scoped aggregate queries and render each required dashboard section**

- [ ] **Step 3: Add navigation and list/detail pages with real filters, empty states, and accessible controls**

- [ ] **Step 4: Add client mutation controls with disabled/loading text and inline success/failure feedback**

- [ ] **Step 5: Add confirmation for batch changes and drag/drop opportunity movement**

### Task 6: Deterministic representative data

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: exactly 20 seeded customers, 30 contacts, 40 leads, 20 opportunities, and at least 20 follow-ups owned across sales users.

- [ ] **Step 1: Extend the idempotent seed with fixed IDs, dates, stages, countries, sources, owners, and follow-up outcomes**

- [ ] **Step 2: Confirm all new seed writes use upsert or deterministic delete/recreate operations**

### Task 7: Verification and delivery

**Files:**
- Create: `.superpowers/sdd/task-2-report.md`

- [ ] **Step 1: Run focused CRM and dashboard tests**

- [ ] **Step 2: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`**

- [ ] **Step 3: Review every changed line for ownership, transaction, audit, scope, and false-data risks**

- [ ] **Step 4: Record exact command results, deliverables, self-review, and concerns in the report**

- [ ] **Step 5: Commit only Task 2 implementation and report files**
