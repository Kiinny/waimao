# Task 4 — Procurement and fulfillment

## Status

Implemented a coherent server-authorized procurement and fulfillment vertical slice. No commit was created because the shared worktree contains other task changes and the controller requested coordinated commits.

## Delivered

- Supplier list/create/update API with audit entries.
- Purchase-order creation that re-evaluates the payment gate within a Prisma transaction, honours the pre-existing audited override, generates database sequence numbers, snapshots line costs, and supports state transitions with optimistic conflict protection.
- Inventory list plus immutable transaction posting. The domain layer protects on-hand/reserved invariants and the service enforces globally unique serial numbers through the schema, serial availability and transactional mutations.
- Inspection recording with passing-checklist validation, actor/audit metadata and evidence metadata stored in the checklist payload.
- Shipment creation and transitions; in-transit and delivery transitions safely synchronize the related sales order.
- Working protected UI pages for Suppliers, Purchase orders, Inventory, Quality inspections and Shipments, each backed by its API. Supplier creation is field-based; the multi-line operational workflows use validated JSON request forms so every primary control calls the server workflow rather than being a static placeholder.
- Navigation entries and deterministic sample suppliers, warehouse/location, serialized stock, inspections, purchase orders and shipment data.

## Changed files

- `src/modules/procurement/procurement-domain.ts`
- `src/modules/procurement/procurement-domain.test.ts`
- `src/modules/procurement/procurement-schemas.ts`
- `src/modules/procurement/procurement-service.ts`
- `src/app/api/{suppliers,purchase-orders,inventory,inspections,shipments}/...`
- `src/app/[locale]/(app)/{suppliers,purchase-orders,inventory,inspections,shipments}/page.tsx`
- `src/components/procurement/workflow-json-form.tsx`
- `src/components/app-shell.tsx`
- `prisma/seed.ts`

## Verification

- `node_modules/.bin/vitest.CMD run src/modules/procurement/procurement-domain.test.ts` — passed (4 tests).
- `node_modules/.bin/tsc.CMD --noEmit` — passed after seed correction.
- `node_modules/.bin/eslint.CMD src/modules/procurement src/app/api/suppliers src/app/api/purchase-orders src/app/api/inventory src/app/api/inspections src/app/api/shipments src/components/procurement` — passed.

## Self-review and concerns

- All API mutations require the existing role permissions and use transactions/audits. Existing global unique `InventorySerial.serialNumber` is used for serial control.
- Operational forms intentionally accept structured JSON for nested line items/evidence; a later UX pass can replace these with row editors without altering contracts.
- The schema already provided the required core models. Supplier scoring/bank masking and extended shipment metrics/doc categories remain candidates for a future schema migration; no destructive schema change was made in this shared dirty worktree.

## Review fixes — 2026-07-20

### Correctness and transaction boundaries

- Serialized inventory now requires exactly one serial number for every supported manual mutation. Serialized `COUNT` is rejected because an aggregate count cannot safely reconcile per-device identity.
- Serial transitions are explicit and validated: receipt creates `AVAILABLE`, reservation moves `AVAILABLE → RESERVED`, release moves `RESERVED → AVAILABLE`, outbound issue moves `RESERVED → ISSUED`, damage moves `AVAILABLE → DAMAGED`, and return moves `ISSUED → AVAILABLE`.
- Reserved outbound issue now decrements both on-hand and reserved balances. Return restores on-hand without creating a duplicate serial.
- Inventory balance writes use a conditional `updateMany` guard containing id, expected version, on-hand and reserved quantities. Concurrent reservations fail with `INVENTORY_CONFLICT` and the enclosing Prisma transaction rolls back.
- Multiple shipment lines using the same inventory row are aggregated before one conditional stock update, preventing double-counting and false self-conflicts.
- Purchase-order creation reloads the order inside the transaction, requires the `PURCHASING` state, re-runs the precise payment/refund gate, accepts only a persisted audited override, validates every line belongs to that order and prevents cumulative over-purchasing.
- Generic purchase-order transitions can no longer mark goods received. The receiving endpoint validates PO line ownership, remaining quantity and serialized receipt counts, then atomically updates line receipts, inventory, serials, immutable transactions, PO state and audit.
- Inventory transfer validates destination, availability and serial ownership, updates source/destination balances conditionally, moves serial ownership and records the transfer/audit atomically.
- Serialized inspections target a specific inventory serial and validate that it belongs to the inventory item. Passing inspections still require a completed checklist.
- Shipment creation validates sales-order line ownership, cumulative active shipment quantity, matching inventory product, available stock and a passing item/serial inspection. It reserves inventory and serials atomically and records a `ShipmentSerial` trail.
- Shipment cancellation releases reserved balances and serials. In-transit transition issues reserved balances and serials. Both paths create immutable inventory transactions.
- Shipment transition and sales-order synchronization use optimistic versions. Partial, fully shipped and fully delivered quantities derive `PARTIALLY_SHIPPED`, `SHIPPED` and `DELIVERED` states without prematurely completing the order.

### Model and API expansion

- Added an additive migration `20260720010000_procurement_fulfillment_review_fixes` with supplier type/rating/terms/tax/site/notes and bank fields; PO terms/address/notes/attachments/receipt timestamp; PO product/configuration snapshots; serial-linked inventory transactions and inspections; shipment method, ports, weight, volume, freight snapshots and estimated dates; `ShipmentSerial` and `ShipmentDocument`.
- Supplier responses and audit summaries mask bank account numbers.
- Added `POST /api/purchase-orders/:id/receive` and `POST /api/inventory/transfer`.
- Transition and inventory APIs now require expected versions.

### Usable workflow UI

- Removed the raw-JSON workflow form from the primary procurement experience.
- Added field-based, bilingual forms for linked purchase orders with repeatable lines, PO receiving, manual inventory mutations, warehouse transfer, serial-specific inspections and shipments with repeatable lines/logistics metrics.
- Added permission-derived PO/shipment transition actions and cancellation confirmation.
- Purchase, inventory, inspection and shipment list cards expose operational detail, serials, receiving controls and status changes.

### Fresh verification

- `vitest run` for procurement domain, schemas, service guards and purchase payment gate: **23/23 passed**.
- `prisma validate`: **passed**.
- `tsc --noEmit`: **passed**.
- Focused ESLint for procurement modules, APIs, components and the four workflow pages: **passed**.

### Remaining concerns

- Docker/PostgreSQL was unavailable in this worker session, so the additive migration was validated by Prisma but not applied to a live empty database; no live PostgreSQL integration or concurrent-transaction test was executed.
- The full repository test suite and production build were not run in this bounded fix pass.
- Supplier list/create remains the earlier basic UI; expanded rating, terms and masked bank fields are present in the schema/API but do not yet have a dedicated supplier detail/edit screen.
- Purchase-order and shipment attachments/documents have safe schema/service associations, but the field-based pages do not yet include the file uploader/document-category picker. Shipment shorthand document IDs are currently categorized as `OTHER`.
- PO/shipment operational details and transitions are embedded in their list cards rather than separate `/[id]` pages.
- Full database integration and production build remain for the controller’s whole-system verification task.

## Important review fixes — 2026-07-20

### Delivered

- Purchase-order list/detail reads now pass the authorization context through a server-side supplier presenter. Bank account numbers are masked by default and returned in full only with the explicit `supplier.bank.read` permission; the permission is seeded for the procurement role through its existing `supplier.*` assignment.
- Stock-reserving shipment creation now writes the shipment as `BOOKED` in the same Prisma transaction that reserves inventory and updates the sales order to `FULFILLING` / `BOOKED`. Existing valid explicit transitions remain available, including legacy `DRAFT → BOOKED`; new shipments continue from `BOOKED → IN_TRANSIT`.
- Supplier create/update schemas now support `ACTIVE` / `INACTIVE` status and validated, duplicate-free product relationships. The service validates linked active products and atomically replaces relationship rows during updates.
- Supplier create/edit UI now provides bilingual status controls and named product choices showing SKU, product name, category and brand. Supplier details display category names rather than category UUIDs.
- Purchase-order attachment IDs and shipment document IDs now reject duplicates on create and detail-update APIs.

### TDD and verification

- Red run: the new focused tests failed on unmasked PO suppliers, DRAFT shipment creation, absent supplier status/relations, missing relationship UI, and accepted duplicate asset IDs.
- Bundled Node runtime, Vitest `startVitest` equivalent for procurement domain/schema/service/UI plus purchase gate: **43/43 passed**.
- PostgreSQL integration file: **5 tests skipped** because `RUN_POSTGRES_INTEGRATION=1` was not enabled; its shipment workflow expectation was updated for the new initial `BOOKED` state.
- Bundled TypeScript compiler API equivalent to `tsc --noEmit`: **0 diagnostics**.
- Bundled ESLint API over Task 4 modules, components, routes/pages and `prisma/seed.ts`: **0 errors, 0 warnings**.

### Concerns

- The shell does not expose a `node` executable on `PATH`, so verification used the desktop app’s bundled Node runtime programmatically. The standard `.CMD` wrappers could not be invoked directly in this worker.
- Live PostgreSQL integration remains pending in an environment with `RUN_POSTGRES_INTEGRATION=1` and a reachable test database.
- No commit was created.

### Controller verification — 2026-07-20

- Enabled `RUN_POSTGRES_INTEGRATION=1` against the local PostgreSQL instance: **5/5 passed**, including concurrent purchase allocation, inventory reservation, serialized receiving, quality gate, shipment issue and delivery synchronization.
- Re-review found no remaining Critical or Important Task 4 code defect.
- Production `next build`: **passed**.
