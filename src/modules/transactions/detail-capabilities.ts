import type { AuthorizationContext } from "@/lib/rbac";
import { can } from "@/lib/rbac";

function canReviewQuote(context: AuthorizationContext) {
  return (
    can(context, "quote.approve") &&
    context.roles?.some(
      (role) => role === "SUPER_ADMIN" || role === "SALES_MANAGER",
    ) === true
  );
}

export function quoteDetailCapabilities(
  context: AuthorizationContext,
  quote: { ownerId: string; immutable: boolean },
) {
  const resource = { ownerId: quote.ownerId };
  const edit = can(context, "quote.update", resource) && !quote.immutable;
  return {
    edit,
    transition: can(context, "quote.update", resource),
    approve: canReviewQuote(context),
    revise: can(context, "quote.update", resource) && quote.immutable,
    convert: can(context, "order.create", resource),
  };
}

export function orderDetailCapabilities(
  context: AuthorizationContext,
  order: { ownerId: string },
) {
  return {
    transition: can(context, "order.update", { ownerId: order.ownerId }),
    purchase: can(context, "purchase.create"),
    createPayment: can(context, "payment.create"),
    verifyPayment: can(context, "payment.verify"),
    refund: can(context, "refund.create"),
  };
}

export function productDetailCapabilities(context: AuthorizationContext) {
  return {
    edit: can(context, "product.update"),
  };
}
