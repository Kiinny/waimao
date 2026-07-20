import { describe, expect, it } from "vitest";

import {
  assertTaskTransition,
  assertTicketTransition,
  isTaskOverdue,
  preserveMaskedValues,
  redactSettingValue,
  redactSensitiveValues,
} from "@/modules/management/management-domain";

describe("management domain", () => {
  it("allows the documented ticket lifecycle and rejects reopening a closed ticket", () => {
    expect(() => assertTicketTransition("OPEN", "IN_PROGRESS")).not.toThrow();
    expect(() => assertTicketTransition("IN_PROGRESS", "WAITING_CUSTOMER")).not.toThrow();
    expect(() => assertTicketTransition("WAITING_CUSTOMER", "RESOLVED")).not.toThrow();
    expect(() => assertTicketTransition("RESOLVED", "CLOSED")).not.toThrow();
    expect(() => assertTicketTransition("CLOSED", "OPEN")).toThrowError(
      expect.objectContaining({ code: "INVALID_TICKET_TRANSITION", status: 409 }),
    );
  });

  it("marks only unfinished past-due tasks overdue", () => {
    const now = new Date("2026-07-20T12:00:00Z");
    expect(isTaskOverdue({ status: "OPEN", dueAt: new Date("2026-07-20T11:59:59Z") }, now)).toBe(true);
    expect(isTaskOverdue({ status: "COMPLETED", dueAt: new Date("2026-07-19T00:00:00Z") }, now)).toBe(false);
    expect(isTaskOverdue({ status: "OPEN", dueAt: null }, now)).toBe(false);
  });

  it("keeps completed and cancelled tasks terminal", () => {
    expect(() => assertTaskTransition("OPEN", "IN_PROGRESS")).not.toThrow();
    expect(() => assertTaskTransition("IN_PROGRESS", "COMPLETED")).not.toThrow();
    expect(() => assertTaskTransition("COMPLETED", "OPEN")).toThrowError(
      expect.objectContaining({ code: "INVALID_TASK_TRANSITION", status: 409 }),
    );
    expect(() => assertTaskTransition("CANCELLED", "IN_PROGRESS")).toThrowError(
      expect.objectContaining({ code: "INVALID_TASK_TRANSITION", status: 409 }),
    );
  });

  it("recursively redacts passwords, secrets, tokens, and bank accounts", () => {
    expect(
      redactSensitiveValues({
        company: "Atlas",
        passwordHash: "argon",
        nested: { authToken: "token", bankAccountNumber: "123456789" },
      }),
    ).toEqual({
      company: "Atlas",
      passwordHash: "[REDACTED]",
      nested: { authToken: "[REDACTED]", bankAccountNumber: "*****6789" },
    });
  });

  it("does not replace stored secrets with their masked presentation", () => {
    expect(
      preserveMaskedValues(
        { bankAccountNumber: "********7890", bankName: "New bank" },
        { bankAccountNumber: "001234567890", bankName: "Old bank" },
      ),
    ).toEqual({
      bankAccountNumber: "001234567890",
      bankName: "New bank",
    });
  });

  it("recursively redacts every leaf of an isSecret setting", () => {
    expect(
      redactSettingValue(
        { username: "atlas", credentials: { password: "secret", recoveryCodes: ["one", "two"] } },
        true,
      ),
    ).toEqual({
      username: "[REDACTED]",
      credentials: { password: "[REDACTED]", recoveryCodes: ["[REDACTED]", "[REDACTED]"] },
    });
  });

  it("preserves recursively masked leaves when saving an isSecret setting", () => {
    expect(
      preserveMaskedValues(
        { username: "[REDACTED]", nested: { token: "[REDACTED]" } },
        { username: "atlas", nested: { token: "stored-token" } },
        true,
      ),
    ).toEqual({ username: "atlas", nested: { token: "stored-token" } });
  });

  it("preserves masked array leaves in an isSecret setting", () => {
    expect(
      preserveMaskedValues(
        { recoveryCodes: ["[REDACTED]", "[REDACTED]"] },
        { recoveryCodes: ["stored-one", "stored-two"] },
        true,
      ),
    ).toEqual({ recoveryCodes: ["stored-one", "stored-two"] });
  });
});
