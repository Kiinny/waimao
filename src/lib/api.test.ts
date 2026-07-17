import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";

describe("API helpers", () => {
  it("creates a typed success response", async () => {
    const response = success({ id: "customer-1" }, 201);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      data: { id: "customer-1" },
    });
  });

  it("maps domain errors to safe failure responses", async () => {
    const response = failure(
      new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer not found",
      },
    });
  });

  it("does not expose unexpected error details", async () => {
    const response = failure(new Error("database credentials leaked"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  it("maps invalid request data to a safe validation failure", async () => {
    const parsed = z.object({ email: z.string().email() }).safeParse({
      email: "not-an-email",
    });
    if (parsed.success) throw new Error("Test input must be invalid");

    const response = failure(parsed.error);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
      },
    });
  });
});
