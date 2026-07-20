# Foreign Trade CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task with TDD and review checkpoints.

**Goal:** Build a production-oriented bilingual foreign-trade CRM for AI servers, GPU servers, refurbished servers, and related hardware exports.

**Architecture:** A modular Next.js App Router monolith uses PostgreSQL and Prisma for transactional data, MinIO for files, and Graphile Worker for background work. UI routes, API routes, domain services, repositories, authorization, audit, and state machines remain separated by clear module boundaries.

**Tech Stack:** Node.js 24, pnpm, Next.js, TypeScript strict, Tailwind CSS, PostgreSQL 17, Prisma, Auth.js, Zod, React Hook Form, Recharts, MinIO, Graphile Worker, Vitest, Playwright, Docker Compose.

## Global Constraints

- Single-company system with English as default and Chinese switching.
- Desktop and tablet workflows must be complete; mobile uses responsive cards and stepped forms.
- All forms validate on client and server; all protected actions enforce server-side RBAC.
- Money uses fixed-point decimals with source currency, manual exchange-rate snapshot, and USD base amount.
- Sent quotations are immutable and revised through versions.
- A `100% T/T Before Purchase` order cannot enter purchasing until confirmed payments cover the required amount, except a reasoned and audited Super Admin override.
- Sales Representatives cannot read purchase costs or detailed profit.
- Important records are cancelled, archived, refunded, or soft-deleted rather than physically deleted.
- No static placeholders or nonfunctional primary buttons.

---

### Task 1: Foundation platform

Initialize dependencies and tests; add the complete Prisma schema, migrations and deterministic seed; implement shared API envelopes, error handling, authentication primitives, RBAC, audit, money utilities, internationalization, responsive application shell, login flow, user/role management foundations, Docker services, and environment examples.

### Task 2: Sales CRM

Implement the role-aware dashboard plus Leads, Customers, Contacts, Follow-ups, and Opportunities. Include list/detail/create/update flows, filters, ownership enforcement, customer timeline, lead conversion, opportunity board, reminders, and representative seed data.

### Task 3: Product and sales transaction flow

Implement Products/configurations, quotation builder/versioning/approval/PDF, Sales Orders, Payments, Refunds, exchange-rate snapshots, purchase eligibility, and estimated/actual profit calculations with field-level security.

### Task 4: Procurement and fulfillment

Implement Suppliers, Purchase Orders, Inventory, serial-number control, inventory transactions, Quality Inspections, and Shipments with payment gates, reservations, inspection evidence, and document metadata.

### Task 5: Management closeout

Implement After-sales, Tasks, Notifications, Reports, Settings, Activity Logs, exports, worker schedules, backup/restore scripts, full README and deployment documentation.

### Task 6: Whole-system verification

Run unit, integration and E2E tests; TypeScript, ESLint, production build, migration/seed checks and Docker validation. Fix all critical/important review findings and perform final requirements coverage review.
