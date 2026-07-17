import { describe, expect, it } from "vitest";

import {
  followUpSchema,
  updateFollowUpSchema,
} from "@/modules/crm/crm-schemas";

describe("CRM schemas", () => {
  it("loads create and update follow-up schemas without composing from a refined schema", () => {
    expect(
      followUpSchema.safeParse({
        leadId: "00000000-0000-4000-8000-000000000001",
        type: "CALL",
        channel: "PHONE",
        summary: "Qualified requirements",
        occurredAt: "2026-07-17T10:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      updateFollowUpSchema.safeParse({
        summary: "Confirmed the next technical review",
      }).success,
    ).toBe(true);
  });
});
