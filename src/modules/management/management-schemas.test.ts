import { describe, expect, it } from "vitest";

import {
  reportQuerySchema,
  settingsUpdateSchema,
  taskSchema,
  ticketSchema,
  ticketUpdateSchema,
} from "@/modules/management/management-schemas";

describe("management schemas", () => {
  it("normalizes a date-only report upper bound to the next day", () => {
    expect(
      reportQuerySchema.parse({ type: "sales", to: "2026-07-20" }).to,
    ).toEqual(new Date("2026-07-21T00:00:00.000Z"));
  });

  it("accepts supported ticket relations and rejects negative costs", () => {
    const base = {
      customerId: "00000000-0000-4000-8000-000000000001",
      subject: "Damaged chassis",
      description: "Panel bent on arrival",
      issueType: "DAMAGE",
      priority: "HIGH",
      costAmount: "-1",
      costCurrencyCode: "USD",
    };
    expect(ticketSchema.safeParse(base).success).toBe(false);
    expect(ticketSchema.safeParse({ ...base, costAmount: "12.50" }).success).toBe(true);
  });

  it("requires a valid company profile and positive manual rates", () => {
    expect(
      settingsUpdateSchema.safeParse({
        namespace: "currency",
        key: "EUR",
        value: { rateToUsd: 0 },
      }).success,
    ).toBe(false);
    expect(
      settingsUpdateSchema.safeParse({
        namespace: "company",
        key: "profile",
        value: { name: "Atlas Global", baseCurrency: "USD", defaultLocale: "en" },
      }).success,
    ).toBe(true);
  });

  it("requires a real solution when resolving or closing a ticket", () => {
    expect(ticketUpdateSchema.safeParse({ expectedVersion: 1, status: "RESOLVED" }).success).toBe(false);
    expect(
      ticketUpdateSchema.safeParse({
        expectedVersion: 1,
        status: "CLOSED",
        solution: "Replaced the failed power supply and confirmed burn-in.",
      }).success,
    ).toBe(true);
  });

  it("prevents direct terminal task creation", () => {
    const base = {
      title: "Call customer",
      priority: "NORMAL",
      assigneeId: "11111111-1111-4111-8111-111111111111",
    };
    expect(taskSchema.safeParse({ ...base, status: "COMPLETED" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...base, status: "OPEN" }).success).toBe(true);
  });

  it("truthfully supports JSON and CSV report formats only", () => {
    expect(reportQuerySchema.safeParse({ type: "sales", format: "csv" }).success).toBe(true);
    expect(reportQuerySchema.safeParse({ type: "sales", format: "excel" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ type: "sales", format: "pdf" }).success).toBe(false);
  });
});
