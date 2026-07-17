"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApiMutationForm({
  endpoint,
  method = "POST",
  submitLabel,
  loadingLabel,
  successMessage,
  failureMessage,
  numericFields = [],
  booleanFields = [],
  dateFields = [],
  redirectTo,
  className,
  children,
}: {
  endpoint: string;
  method?: "POST" | "PATCH";
  submitLabel: string;
  loadingLabel: string;
  successMessage: string;
  failureMessage: string;
  numericFields?: string[];
  booleanFields?: string[];
  dateFields?: string[];
  redirectTo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: Record<string, unknown> = {};
    for (const [key, rawValue] of formData.entries()) {
      if (typeof rawValue !== "string" || rawValue === "") continue;
      body[key] = numericFields.includes(key) ? Number(rawValue) : rawValue;
    }
    for (const key of booleanFields) body[key] = formData.has(key);
    for (const key of dateFields) {
      const rawValue = formData.get(key);
      if (typeof rawValue === "string" && rawValue) {
        body[key] = new Date(rawValue).toISOString();
      }
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || failureMessage);
      }
      setState("success");
      setMessage(successMessage);
      if (method === "POST") form.reset();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : failureMessage);
    }
  }

  return (
    <form className={className ?? "crm-form"} onSubmit={submit}>
      {children}
      <button className="button" disabled={state === "loading"} type="submit">
        {state === "loading" ? loadingLabel : submitLabel}
      </button>
      {message ? (
        <p className={state === "error" ? "form-feedback error" : "form-feedback success"} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
