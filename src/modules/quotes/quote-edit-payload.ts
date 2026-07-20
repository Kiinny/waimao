export interface QuoteVersionUpdatePayload {
  currencyCode: string;
  exchangeRateToUsd: string;
  shipping: string;
  insurance: string;
  tax: string;
  bankFees: string;
  incoterm: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  warrantyTerms: string | null;
  remarks: string | null;
  items: Array<{
    productId: string;
    variantId: string;
    description?: string;
    quantity: number;
    unitPrice: string;
    discount: string;
  }>;
}

export function quoteVersionUpdatePayload(
  input: QuoteVersionUpdatePayload,
): QuoteVersionUpdatePayload {
  return {
    ...input,
    currencyCode: input.currencyCode.trim().toUpperCase(),
    items: input.items.map((item) => ({ ...item })),
  };
}
