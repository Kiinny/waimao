import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiFailure, ApiSuccess } from "@/lib/contracts";
import { DomainError } from "@/lib/errors";

export function success<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function failure(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: {
            issues: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof DomainError) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}
