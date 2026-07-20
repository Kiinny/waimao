import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: {
    userId: "sales-1",
    roles: ["SALES_REP"],
    permissions: ["report.read", "report.sales.read"],
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

import ReportsPage from "@/app/[locale]/(app)/reports/page";

describe("reports page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.report.mockResolvedValue({
      type: "sales",
      generatedAt: new Date("2026-07-20T12:00:00Z"),
      totals: null,
      rows: [],
    });
  });

  it("uses the day after a selected end date as the exclusive service boundary", async () => {
    await ReportsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        type: "sales",
        from: "2026-07-01",
        to: "2026-07-20",
      }),
    });

    expect(mocks.report).toHaveBeenCalledWith(mocks.context, {
      type: "sales",
      from: new Date("2026-07-01T00:00:00.000Z"),
      to: new Date("2026-07-21T00:00:00.000Z"),
    });
  });
});
