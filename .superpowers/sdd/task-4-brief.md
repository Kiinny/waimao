# Task 4: Procurement and Fulfillment

Implement supplier purchasing, inventory, quality inspection and shipments.

## Requirements

- Follow established patterns and red-green TDD.
- Supplier CRUD includes contacts, categories/brands, terms, ratings, status, bank-information masking, purchasing totals, delivery/quality rates and return history.
- Purchasing queue only exposes eligible sales orders unless an audited override exists.
- Purchase Orders support supplier, buyer, item snapshots, currency/rate, unit/total cost, terms, dates, attachments, approval and defined status transitions.
- Inventory supports warehouses/locations, serialized and bulk items, receipts, issues, reservations, releases, transfers, counts, damage and returns through immutable inventory transactions.
- Server and GPU serial numbers are globally unique; available quantity equals on-hand less reserved and cannot become negative.
- Quality inspections cover the requested checklist, result states and evidence metadata; serialized items can be inspected individually.
- Shipments support requested methods/statuses, dates, weights/volume/costs, ports, tracking and document categories; shipment transitions update the related order safely.
- Implement working list/detail/create/update/transition UI and API flows with server-side RBAC, validation, audit, loading/error/success feedback and confirmations.
- Extend deterministic seed to requested supplier, purchase-order and shipment counts and realistic inventory/inspection data.
- Test eligibility gate, PO transitions, serial uniqueness, inventory invariants, reservation concurrency, inspection result rules and shipment/order synchronization.
- Run focused tests, full tests, TypeScript, ESLint and build; commit.

## Report

Write `.superpowers/sdd/task-4-report.md` with status, commits, delivered features, verification, self-review, and concerns.
