export interface ProductSnapshotSource {
  id: string;
  sku: string;
  name: string;
  category: string;
  condition: string;
  baseModel: string | null;
  specifications: Record<string, unknown>;
  dimensions: Record<string, unknown> | null;
  hsCode: string | null;
  exportControlRisk: string;
  media: unknown[];
  availability: string;
}

export interface ProductVariantSnapshotSource {
  id: string;
  sku: string;
  name: string;
  configurationVersion: number;
  configuration: Record<string, unknown>;
  specifications: Record<string, unknown>;
}

export function productSnapshot(
  product: ProductSnapshotSource,
  variant: ProductVariantSnapshotSource,
) {
  return {
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku,
    name: `${product.name} / ${variant.name}`,
    category: product.category,
    condition: product.condition,
    baseModel: product.baseModel,
    configurationVersion: variant.configurationVersion,
    configuration: structuredClone(variant.configuration),
    specifications: {
      ...structuredClone(product.specifications),
      ...structuredClone(variant.specifications),
    },
    dimensions: product.dimensions
      ? structuredClone(product.dimensions)
      : null,
    hsCode: product.hsCode,
    exportControlRisk: product.exportControlRisk,
    media: structuredClone(product.media),
    availability: product.availability,
  };
}
