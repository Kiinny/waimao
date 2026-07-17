import { DomainError } from "@/lib/errors";

const IMMUTABLE_QUOTE_STATUSES = new Set([
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export interface QuoteVersionState {
  id: string;
  quoteStatus: string;
  immutableAt: Date | null;
}

export interface QuoteVersionChanges {
  remarks?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  warrantyTerms?: string | null;
}

export interface QuoteVersionRepository {
  findVersionState(versionId: string): Promise<QuoteVersionState | null>;
  updateVersion(
    versionId: string,
    changes: QuoteVersionChanges,
  ): Promise<unknown>;
}

export function assertQuoteVersionMutable(state: QuoteVersionState) {
  if (state.immutableAt || IMMUTABLE_QUOTE_STATUSES.has(state.quoteStatus)) {
    throw new DomainError(
      "QUOTE_IMMUTABLE",
      "Sent quotation versions cannot be changed",
      409,
    );
  }
}

export async function updateQuoteVersion(
  repository: QuoteVersionRepository,
  versionId: string,
  changes: QuoteVersionChanges,
) {
  const state = await repository.findVersionState(versionId);
  if (!state) {
    throw new DomainError("QUOTE_VERSION_NOT_FOUND", "Quote version not found", 404);
  }
  assertQuoteVersionMutable(state);
  return repository.updateVersion(versionId, changes);
}
