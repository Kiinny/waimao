import { describe, expect, it } from "vitest";

import { productSnapshot } from "@/modules/products/product-domain";

describe("product snapshots", () => {
  it("preserves the complete selected configuration for later transactions", () => {
    expect(
      productSnapshot(
        {
          id: "product-1",
          sku: "GPU-R760",
          name: "Dell PowerEdge R760xa",
          category: "GPU Server",
          condition: "REFURBISHED",
          baseModel: "PowerEdge R760xa",
          specifications: { cpu: "2 x Xeon Gold", gpuSlots: 4 },
          dimensions: { lengthCm: 107.5, widthCm: 48.2, heightCm: 8.7 },
          hsCode: "847150",
          exportControlRisk: "REVIEW_REQUIRED",
          media: [{ kind: "IMAGE", objectKey: "products/r760/front.jpg" }],
          availability: "IN_STOCK",
        },
        {
          id: "variant-1",
          sku: "GPU-R760-V2",
          name: "4 x L40S",
          configurationVersion: 2,
          configuration: { gpu: "4 x NVIDIA L40S", ram: "512GB" },
          specifications: { psu: "2 x 2800W" },
        },
      ),
    ).toEqual({
      productId: "product-1",
      variantId: "variant-1",
      sku: "GPU-R760-V2",
      name: "Dell PowerEdge R760xa / 4 x L40S",
      category: "GPU Server",
      condition: "REFURBISHED",
      baseModel: "PowerEdge R760xa",
      configurationVersion: 2,
      configuration: { gpu: "4 x NVIDIA L40S", ram: "512GB" },
      specifications: {
        cpu: "2 x Xeon Gold",
        gpuSlots: 4,
        psu: "2 x 2800W",
      },
      dimensions: { lengthCm: 107.5, widthCm: 48.2, heightCm: 8.7 },
      hsCode: "847150",
      exportControlRisk: "REVIEW_REQUIRED",
      media: [{ kind: "IMAGE", objectKey: "products/r760/front.jpg" }],
      availability: "IN_STOCK",
    });
  });
});
