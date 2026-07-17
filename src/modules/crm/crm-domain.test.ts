import { describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/rbac";
import {
  assertOpportunityTransition,
  assertOwned,
  assertPrimaryContactChange,
  findLeadDuplicates,
  isFollowUpOverdue,
  crmOwnerWhere,
  weightedForecast,
} from "@/modules/crm/crm-domain";

const representative: AuthorizationContext = {
  userId: "sales-1",
  roles: ["SALES_REP"],
  permissions: ["lead.read", "lead.update", "opportunity.update"],
};

describe("CRM ownership", () => {
  it("rejects access to another representative's record", () => {
    expect(() =>
      assertOwned(representative, { ownerId: "sales-2" }, "lead.update"),
    ).toThrowError(/Permission denied/);
  });

  it("cannot replace representative scope with a requested owner filter", () => {
    expect(crmOwnerWhere(representative, "sales-2")).toEqual({
      ownerId: "sales-1",
    });
  });

  it("allows managers to select an owner or leave team scope broad", () => {
    const manager: AuthorizationContext = {
      userId: "manager-1",
      roles: ["SALES_MANAGER"],
      permissions: ["lead.read"],
    };
    expect(crmOwnerWhere(manager, "sales-2")).toEqual({ ownerId: "sales-2" });
    expect(crmOwnerWhere(manager)).toEqual({});
  });

  it("allows a sales manager to access team records", () => {
    expect(() =>
      assertOwned(
        {
          userId: "manager-1",
          roles: ["SALES_MANAGER"],
          permissions: ["lead.update"],
        },
        { ownerId: "sales-2" },
        "lead.update",
      ),
    ).not.toThrow();
  });
});

describe("lead duplicate detection", () => {
  const rows = [
    {
      id: "lead-1",
      companyName: "Northstar Systems",
      email: "buyer@northstar.example",
      phone: "+1 206 555 0180",
    },
    {
      id: "lead-2",
      companyName: "Unrelated GmbH",
      email: "sales@unrelated.example",
      phone: "+49 30 555 0101",
    },
  ];

  it("matches normalized email, phone, or company name", () => {
    expect(
      findLeadDuplicates(
        {
          companyName: " northstar   systems ",
          email: "BUYER@NORTHSTAR.EXAMPLE",
          phone: "+1 (206) 555-0180",
        },
        rows,
      ),
    ).toEqual(["lead-1"]);
  });

  it("does not treat empty identifiers as duplicates", () => {
    expect(
      findLeadDuplicates(
        { companyName: "", email: null, phone: null },
        rows,
      ),
    ).toEqual([]);
  });
});

describe("primary contact constraint", () => {
  it("rejects a second active primary contact", () => {
    expect(() =>
      assertPrimaryContactChange(true, ["contact-1"]),
    ).toThrowError(/primary contact/i);
  });

  it("allows a non-primary contact or the only primary contact", () => {
    expect(() => assertPrimaryContactChange(false, ["contact-1"])).not.toThrow();
    expect(() => assertPrimaryContactChange(true, [])).not.toThrow();
  });
});

describe("follow-up overdue logic", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");

  it("marks an incomplete past next action as overdue", () => {
    expect(
      isFollowUpOverdue(
        {
          nextActionAt: new Date("2026-07-17T11:59:59.000Z"),
          completedAt: null,
          deletedAt: null,
        },
        now,
      ),
    ).toBe(true);
  });

  it("excludes completed, deleted, future, and unscheduled follow-ups", () => {
    expect(
      isFollowUpOverdue(
        {
          nextActionAt: new Date("2026-07-17T11:00:00.000Z"),
          completedAt: now,
          deletedAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isFollowUpOverdue(
        {
          nextActionAt: new Date("2026-07-17T11:00:00.000Z"),
          completedAt: null,
          deletedAt: now,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isFollowUpOverdue(
        {
          nextActionAt: new Date("2026-07-17T13:00:00.000Z"),
          completedAt: null,
          deletedAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isFollowUpOverdue(
        { nextActionAt: null, completedAt: null, deletedAt: null },
        now,
      ),
    ).toBe(false);
  });
});

describe("opportunity stage transitions", () => {
  it("allows forward progress, won, and lost with a reason", () => {
    expect(() =>
      assertOpportunityTransition("DISCOVERY", "PROPOSAL"),
    ).not.toThrow();
    expect(() =>
      assertOpportunityTransition("NEGOTIATION", "WON"),
    ).not.toThrow();
    expect(() =>
      assertOpportunityTransition("PROPOSAL", "LOST", "Budget withdrawn"),
    ).not.toThrow();
  });

  it("rejects backward, terminal, skipped, and unexplained lost transitions", () => {
    expect(() =>
      assertOpportunityTransition("PROPOSAL", "DISCOVERY"),
    ).toThrowError(/transition/i);
    expect(() =>
      assertOpportunityTransition("WON", "NEGOTIATION"),
    ).toThrowError(/terminal/i);
    expect(() =>
      assertOpportunityTransition("QUALIFICATION", "NEGOTIATION"),
    ).toThrowError(/transition/i);
    expect(() =>
      assertOpportunityTransition("PROPOSAL", "LOST"),
    ).toThrowError(/loss reason/i);
  });
});

describe("weighted forecast", () => {
  it("sums USD values weighted by probability with fixed precision", () => {
    expect(
      weightedForecast([
        { valueUsd: "100.00", probability: 30, stage: "DISCOVERY" },
        { valueUsd: "250.00", probability: 80, stage: "NEGOTIATION" },
        { valueUsd: "999.00", probability: 100, stage: "LOST" },
      ]),
    ).toBe("230.00");
  });

  it("treats won opportunities as fully weighted", () => {
    expect(
      weightedForecast([
        { valueUsd: "125.55", probability: 10, stage: "WON" },
      ]),
    ).toBe("125.55");
  });
});
