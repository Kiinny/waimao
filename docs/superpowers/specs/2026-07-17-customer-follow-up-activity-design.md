# Customer Follow-up Creation and Activity Design

## Goal

Complete the customer-detail follow-up workflow by allowing a user to create a follow-up for the current customer, optionally relate it to one of that customer's Contacts or Opportunities, and show all such follow-up audit events in the customer's Activity timeline.

## UI and Data Flow

The customer detail page will reuse `ApiMutationForm` and the validated `POST /api/follow-ups` endpoint. The form will always submit the current `customerId`; it will offer optional Contact and Opportunity selectors populated only from the already-authorized customer detail result. It will collect the existing follow-up schema's required type, channel, summary, and occurred timestamp fields, plus optional outcome, next action, and next-action timestamp fields.

`ApiMutationForm` will continue to provide disabled/loading submission, localized success feedback, localized error feedback, reset after creation, and router refresh. No new endpoint, client state manager, or persistence field is required.

## Activity Query

A pure `customerActivityWhere(customerId, contactIds, opportunityIds)` helper will build the Prisma audit filter. It will retain direct Customer, Contact, and customer-linked FollowUp clauses, and add one FollowUp metadata clause for every Contact and Opportunity belonging to the customer. `getCustomerDetail` will pass the IDs from its already-scoped customer query to this helper.

This design relies on the existing follow-up audit metadata, which consistently records `customerId`, `contactId`, and `opportunityId`.

## Localization

English and Chinese dictionaries will add only the labels needed by the form: add follow-up and relation selectors. Existing field, option, follow-up type, channel, action, and feedback strings will be reused.

## Verification

- A focused domain test will prove the Activity filter includes direct customer, contact-linked, and opportunity-linked FollowUp audit clauses.
- Dictionary tests will prove the new English and Chinese labels exist.
- The focused tests will be observed failing before production changes and passing afterward.
- The full test suite, typecheck, lint, Prisma generation, and production build will run before commit.

## Scope

No new API route, database migration, attachment upload UI, Lead relation selector, or unrelated customer-detail refactor is included.
