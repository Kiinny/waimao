import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import { requirePermission } from "@/lib/rbac";
import {
  assertQuoteApprovalRole,
  assertQuoteTransition,
  nextQuoteRevision,
} from "@/modules/quotes/quote-domain";

export interface TransactionQuote {
  id: string;
  ownerId: string;
  status: string;
  currentVersion: number;
  orderId: string | null;
  current: {
    id: string;
    number: number;
    immutableAt: Date | null;
    items: unknown[];
    [key: string]: unknown;
  };
}

export interface TransactionRepository {
  findQuote(
    context: AuthorizationContext,
    quoteId: string,
  ): Promise<TransactionQuote | null>;
  transitionQuote(
    context: AuthorizationContext,
    quote: TransactionQuote,
    status: string,
    note?: string,
  ): Promise<unknown>;
  createRevision(
    context: AuthorizationContext,
    quote: TransactionQuote,
    revision: ReturnType<typeof nextQuoteRevision>,
  ): Promise<unknown>;
  convertQuote(
    context: AuthorizationContext,
    quote: TransactionQuote,
  ): Promise<unknown>;
}

async function requiredQuote(
  repository: TransactionRepository,
  context: AuthorizationContext,
  quoteId: string,
  permission: string,
) {
  const quote = await repository.findQuote(context, quoteId);
  if (!quote) {
    throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
  }
  requirePermission(context, permission, { ownerId: quote.ownerId });
  return quote;
}

export async function approveQuote(
  repository: TransactionRepository,
  context: AuthorizationContext,
  quoteId: string,
  note: string,
) {
  const quote = await requiredQuote(
    repository,
    context,
    quoteId,
    "quote.approve",
  );
  assertQuoteApprovalRole(context.roles);
  assertQuoteTransition(quote.status, "APPROVED");
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new DomainError(
      "QUOTE_APPROVAL_NOTE_REQUIRED",
      "Approval requires a nonempty note",
    );
  }
  return repository.transitionQuote(
    context,
    quote,
    "APPROVED",
    trimmedNote,
  );
}

export async function transitionQuote(
  repository: TransactionRepository,
  context: AuthorizationContext,
  quoteId: string,
  status: string,
  note?: string,
) {
  if (status === "APPROVED") {
    return approveQuote(repository, context, quoteId, note ?? "");
  }
  const quote = await requiredQuote(
    repository,
    context,
    quoteId,
    "quote.update",
  );
  assertQuoteTransition(quote.status, status);
  return repository.transitionQuote(context, quote, status, note?.trim());
}

export async function reviseQuote(
  repository: TransactionRepository,
  context: AuthorizationContext,
  quoteId: string,
) {
  const quote = await requiredQuote(
    repository,
    context,
    quoteId,
    "quote.update",
  );
  const revision = nextQuoteRevision({
    currentVersion: quote.currentVersion,
    source: quote.current,
  });
  return repository.createRevision(context, quote, revision);
}

export async function convertAcceptedQuote(
  repository: TransactionRepository,
  context: AuthorizationContext,
  quoteId: string,
) {
  const quote = await requiredQuote(
    repository,
    context,
    quoteId,
    "order.create",
  );
  if (quote.orderId || quote.status === "CONVERTED") {
    throw new DomainError(
      "QUOTE_ALREADY_CONVERTED",
      "Quotation has already been converted",
      409,
    );
  }
  if (quote.status !== "ACCEPTED") {
    throw new DomainError(
      "QUOTE_NOT_ACCEPTED",
      "Only an accepted quotation can be converted",
      409,
    );
  }
  return repository.convertQuote(context, quote);
}
