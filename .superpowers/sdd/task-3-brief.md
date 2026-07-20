# Task 3: Product and Sales Transaction Flow

Implement products, quotations, orders and customer payments.

## Requirements

- Follow established patterns and red-green TDD.
- Products support requested categories/conditions, base models, multiple configuration versions, specifications, costs, reference prices, dimensions, HS code, export-control risk, media metadata and availability.
- Quotation builder supports multiple items, custom server configuration snapshots, quantity/unit price/discount, shipping/insurance/tax/bank fees, incoterm, payment terms, delivery/warranty/remarks, exact totals and estimated profit.
- Sent quotations are immutable. Revisions create sequential immutable versions; history and copy actions work.
- Quote approval is limited to allowed roles and audited. Support Draft, Pending Approval, Approved, Sent, Viewed, Accepted, Rejected, Expired and Converted transitions.
- Generate a professional bilingual-capable PDF containing company/customer details, item images/configurations, amounts, terms, bank information and signature area.
- Convert only an accepted quotation version into one sales order transaction, preserving snapshots and preventing duplicate conversion.
- Orders expose payment, purchase, inspection, packing and shipment statuses and enforce state transitions.
- Payments support installments, currencies/rate snapshots, proof metadata, finance verification/rejection and refunds.
- Implement and test `100% T/T Before Purchase`: only confirmed net payments covering the required amount grant purchase eligibility; Super Admin override requires a nonempty reason and immutable audit record. Refunds recompute eligibility and flag already-purchasing orders.
- Calculate revenue, estimated/actual costs, gross profit/margin and net profit estimate; never expose sensitive cost/profit fields without explicit permissions.
- Working list/detail/create/update/approve/revise/convert/verify/refund UI and API flows with validation, feedback and confirmations.
- Extend deterministic seed to requested product, quotation, order and payment counts.
- Test decimal precision, versioning, transitions, duplicate conversion, payment/refund calculations, purchase eligibility, override audit and field-level redaction.
- Run focused tests, full tests, TypeScript, ESLint and build; commit.

## Report

Write `.superpowers/sdd/task-3-report.md` with status, commits, delivered features, verification, self-review, and concerns.
