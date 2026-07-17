import { describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/rbac";
import {
  convertLead,
  moveOpportunity,
  type CrmRepository,
} from "@/modules/crm/crm-service";

const representative: AuthorizationContext = {
  userId: "sales-1",
  roles: ["SALES_REP"],
  permissions: ["lead.update", "opportunity.update"],
};

function repositoryFixture(
  overrides: Partial<CrmRepository> = {},
): CrmRepository {
  return {
    findLead: async () => ({
      id: "lead-1",
      ownerId: "sales-1",
      status: "QUALIFIED",
      companyName: "Northstar Systems",
      contactName: "Maya Chen",
      countryCode: "US",
      email: "maya@northstar.example",
      phone: "+12065550180",
    }),
    convertLeadAtomically: async (_context, lead, input) => ({
      leadId: lead.id,
      customerId: "customer-1",
      opportunityId: "opportunity-1",
      ownerId: input.ownerId,
    }),
    findOpportunity: async () => ({
      id: "opportunity-1",
      ownerId: "sales-1",
      stage: "DISCOVERY",
    }),
    updateOpportunityStage: async (_context, opportunity, input) => ({
      id: opportunity.id,
      stage: input.stage,
      lossReason: input.lossReason ?? null,
    }),
    ...overrides,
  };
}

describe("lead conversion", () => {
  it("converts customer and opportunity in one repository transaction preserving owner", async () => {
    const calls: Array<{ ownerId: string; opportunityName: string }> = [];
    const repository = repositoryFixture({
      convertLeadAtomically: async (_context, lead, input) => {
        calls.push(input);
        return {
          leadId: lead.id,
          customerId: "customer-1",
          opportunityId: "opportunity-1",
          ownerId: input.ownerId,
        };
      },
    });

    await expect(
      convertLead(repository, representative, "lead-1", {
        opportunityName: "GPU cluster refresh",
        value: "120000",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        probability: 30,
      }),
    ).resolves.toMatchObject({
      customerId: "customer-1",
      opportunityId: "opportunity-1",
      ownerId: "sales-1",
    });
    expect(calls).toEqual([
      { ownerId: "sales-1", opportunityName: "GPU cluster refresh", value: "120000", currencyCode: "USD", exchangeRateToUsd: "1", probability: 30 },
    ]);
  });

  it("rejects a foreign or already converted lead before opening conversion transaction", async () => {
    let converted = false;
    const foreign = repositoryFixture({
      findLead: async () => ({
        id: "lead-1",
        ownerId: "sales-2",
        status: "QUALIFIED",
        companyName: "Northstar Systems",
        contactName: "Maya Chen",
        countryCode: "US",
        email: null,
        phone: null,
      }),
      convertLeadAtomically: async () => {
        converted = true;
        throw new Error("must not run");
      },
    });

    await expect(
      convertLead(foreign, representative, "lead-1", {
        opportunityName: "GPU cluster refresh",
        value: "100",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        probability: 10,
      }),
    ).rejects.toThrow(/Permission denied/);
    expect(converted).toBe(false);

    const convertedLead = repositoryFixture({
      findLead: async () => ({
        id: "lead-1",
        ownerId: "sales-1",
        status: "CONVERTED",
        companyName: "Northstar Systems",
        contactName: "Maya Chen",
        countryCode: "US",
        email: null,
        phone: null,
      }),
    });
    await expect(
      convertLead(convertedLead, representative, "lead-1", {
        opportunityName: "GPU cluster refresh",
        value: "100",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        probability: 10,
      }),
    ).rejects.toThrow(/already converted/i);
  });
});

describe("opportunity movement", () => {
  it("validates the transition before persisting it", async () => {
    let persisted = false;
    const repository = repositoryFixture({
      updateOpportunityStage: async (_context, opportunity, input) => {
        persisted = true;
        return {
          id: opportunity.id,
          stage: input.stage,
          lossReason: input.lossReason ?? null,
        };
      },
    });

    await expect(
      moveOpportunity(
        repository,
        representative,
        "opportunity-1",
        "PROPOSAL",
      ),
    ).resolves.toMatchObject({ stage: "PROPOSAL" });
    expect(persisted).toBe(true);

    persisted = false;
    await expect(
      moveOpportunity(
        repository,
        representative,
        "opportunity-1",
        "LOST",
      ),
    ).rejects.toThrow(/loss reason/i);
    expect(persisted).toBe(false);
  });
});
