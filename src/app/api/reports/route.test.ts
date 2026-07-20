import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: {
    userId: "sales-1",
    roles: ["SALES_REP"],
    permissions: ["report.read"],
  },
  report: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
  currentAuthorizationContext: async () => mocks.context,
}));
vi.mock("@/modules/management/management-service", () => ({
  ManagementService: class {
    report = mocks.report;
  },
}));

import { GET } from "@/app/api/reports/route";

describe("report export API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.report.mockResolvedValue({
      type: "sales",
      generatedAt: new Date("2026-07-20T12:00:00Z"),
      totals: null,
      rows: [{ customer: "深圳客户", salesUsd: "100.0000" }],
    });
  });

  it("passes date filters through to the report service and exports UTF-8 CSV", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/reports?type=sales&format=csv&from=2026-07-01&to=2026-07-20",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(await response.text()).toContain("深圳客户");
    expect(mocks.report).toHaveBeenCalledWith(mocks.context, {
      type: "sales",
      format: "csv",
      from: new Date("2026-07-01T00:00:00.000Z"),
      to: new Date("2026-07-21T00:00:00.000Z"),
      ownerId: undefined,
    });
  });

  it("rejects misleading Excel and PDF format requests", async () => {
    const excel = await GET(
      new Request("http://localhost/api/reports?type=sales&format=excel"),
    );
    const pdf = await GET(
      new Request("http://localhost/api/reports?type=sales&format=pdf"),
    );
    expect(excel.status).toBe(400);
    expect(pdf.status).toBe(400);
    expect(mocks.report).not.toHaveBeenCalled();
  });
});
