import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const taskFourSources = [
  "src/components/procurement/procurement-forms.tsx",
  "src/app/[locale]/(app)/suppliers/page.tsx",
  "src/app/[locale]/(app)/purchase-orders/page.tsx",
  "src/app/[locale]/(app)/inventory/page.tsx",
  "src/app/[locale]/(app)/inspections/page.tsx",
  "src/app/[locale]/(app)/shipments/page.tsx",
];

function source(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("procurement UI contract", () => {
  it("keeps Task 4 forms and pages free of common mojibake and bilingual", () => {
    const combined = taskFourSources.map(source).join("\n");

    for (const marker of ["鈥", "閲囪", "璐ㄩ", "搴撳", "鎿嶄", "璇锋", "锟斤拷", "�"]) {
      expect(combined).not.toContain(marker);
    }
    expect(combined).toContain("Purchase orders");
    expect(combined).toContain("采购订单");
    expect(combined).toContain("Quality inspections");
    expect(combined).toContain("质量检验");
    expect(combined).toContain("Shipments");
    expect(combined).toContain("物流发货");
  });

  it("exposes attachment and document asset workflows in procurement forms", () => {
    const forms = source("src/components/procurement/procurement-forms.tsx");

    expect(forms).toContain("attachmentIds");
    expect(forms).toContain("documentIds");
    expect(forms).toContain("附件资产 ID");
    expect(forms).toContain("Document asset IDs");
  });

  it.each([
    ["suppliers", "SupplierEditForm", "/api/suppliers/"],
    ["purchase-orders", "PurchaseOrderUpdateForm", "/api/purchase-orders/"],
    ["inspections", "InspectionForm", "/api/inspections"],
    ["shipments", "ShipmentUpdateForm", "/api/shipments/"],
  ])("provides a functional %s detail page", (segment, formName, endpoint) => {
    const path = `src/app/[locale]/(app)/${segment}/[id]/page.tsx`;

    expect(existsSync(resolve(root, path))).toBe(true);
    const detail = source(path);
    expect(detail).toContain(formName);
    expect(detail).toContain(endpoint);
    expect(detail).toContain('locale === "zh"');
  });

  it.each(["suppliers", "purchase-orders", "inspections", "shipments"])(
    "links %s list records to their detail route",
    (segment) => {
      const list = source(`src/app/[locale]/(app)/${segment}/page.tsx`);
      expect(list).toContain(`/${"${locale}"}/${segment}/`);
    },
  );

  it("provides minimal mutation routes for supplier archive and detail updates", () => {
    const suppliers = source("src/app/api/suppliers/[id]/route.ts");
    const purchaseOrders = source("src/app/api/purchase-orders/[id]/route.ts");
    const shipments = source("src/app/api/shipments/[id]/route.ts");

    expect(suppliers).toContain("export async function DELETE");
    expect(purchaseOrders).toContain("export async function PATCH");
    expect(shipments).toContain("export async function PATCH");
  });

  it("provides bilingual status and named product relationship controls for suppliers", () => {
    const forms = source("src/components/procurement/procurement-forms.tsx");
    const list = source("src/app/[locale]/(app)/suppliers/page.tsx");
    const detail = source("src/app/[locale]/(app)/suppliers/[id]/page.tsx");

    expect(forms).toContain("SupplierCreateForm");
    expect(forms).toContain('name="status"');
    expect(forms).toContain('name="productIds"');
    expect(forms).toContain("Products supplied");
    expect(forms).toContain("供应产品");
    expect(list).toContain("productOptions");
    expect(detail).toContain("product.category.name");
  });
});
