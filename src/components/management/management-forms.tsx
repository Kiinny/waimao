"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Locale = "en" | "zh";
type Option = { id: string; label: string };

function useMutation(locale: Locale) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function mutate(endpoint: string, body: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
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
        throw new Error(result.error?.message ?? "Request failed");
      }
      setMessage(locale === "zh" ? "已保存。" : "Saved.");
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, mutate };
}

function Feedback({
  locale,
  busy,
  message,
}: {
  locale: Locale;
  busy: boolean;
  message: string;
}) {
  return (
    <>
      <button className="button" disabled={busy} type="submit">
        {busy
          ? locale === "zh"
            ? "保存中…"
            : "Saving…"
          : locale === "zh"
            ? "保存"
            : "Save"}
      </button>
      {message ? <p className="form-feedback" role="status">{message}</p> : null}
    </>
  );
}

export function TicketCreateForm({
  locale,
  options,
}: {
  locale: Locale;
  options: {
    customers: Option[];
    orders: Option[];
    products: Option[];
    serials: Option[];
    users: Option[];
  };
}) {
  const mutation = useMutation(locale);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const saved = await mutation.mutate("/api/tickets", {
          customerId: data.get("customerId"),
          salesOrderId: data.get("salesOrderId") || null,
          productId: data.get("productId") || null,
          inventorySerialId: data.get("inventorySerialId") || null,
          assignedToId: data.get("assignedToId") || null,
          subject: data.get("subject"),
          description: data.get("description"),
          issueType: data.get("issueType"),
          priority: data.get("priority"),
          costAmount: data.get("costAmount") || null,
          costCurrencyCode: data.get("costAmount")
            ? data.get("costCurrencyCode")
            : null,
        });
        if (saved) form.reset();
      }}
    >
      <label>
        {locale === "zh" ? "客户" : "Customer"}
        <select name="customerId" required>
          <option value="">—</option>
          {options.customers.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "销售订单" : "Sales order"}
        <select name="salesOrderId">
          <option value="">—</option>
          {options.orders.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "产品" : "Product"}
        <select name="productId">
          <option value="">—</option>
          {options.products.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "序列号" : "Serial"}
        <select name="inventorySerialId">
          <option value="">—</option>
          {options.serials.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "负责人" : "Assignee"}
        <select name="assignedToId">
          <option value="">—</option>
          {options.users.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "问题类型" : "Issue type"}
        <select defaultValue="QUALITY" name="issueType">
          {["QUALITY", "DAMAGE", "MISSING_ITEM", "WRONG_ITEM", "TECHNICAL", "WARRANTY", "RETURN", "OTHER"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "优先级" : "Priority"}
        <select defaultValue="NORMAL" name="priority">
          {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "主题" : "Subject"}
        <input name="subject" required />
      </label>
      <label>
        {locale === "zh" ? "成本" : "Cost"}
        <input inputMode="decimal" name="costAmount" />
      </label>
      <label>
        {locale === "zh" ? "成本币种" : "Cost currency"}
        <input defaultValue="USD" maxLength={3} name="costCurrencyCode" />
      </label>
      <label>
        {locale === "zh" ? "描述" : "Description"}
        <textarea name="description" required />
      </label>
      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
    </form>
  );
}

export function TicketResolutionForm({
  locale,
  endpoint,
  expectedVersion,
  status,
  existingSolution,
}: {
  locale: Locale;
  endpoint: string;
  expectedVersion: number;
  status: "RESOLVED" | "CLOSED";
  existingSolution?: string | null;
}) {
  const mutation = useMutation(locale);
  return (
    <form
      className="inline-action"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void mutation.mutate(
          endpoint,
          {
            expectedVersion,
            status,
            solution: data.get("solution"),
          },
          "PATCH",
        );
      }}
    >
      <label>
        {locale === "zh" ? "解决方案" : "Solution"}
        <textarea
          defaultValue={existingSolution ?? ""}
          name="solution"
          required
          rows={3}
        />
      </label>
      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
    </form>
  );
}

export function TaskCreateForm({
  locale,
  users,
  teams,
}: {
  locale: Locale;
  users: Option[];
  teams: string[];
}) {
  const mutation = useMutation(locale);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const saved = await mutation.mutate("/api/tasks", {
          title: data.get("title"),
          description: data.get("description") || null,
          priority: data.get("priority"),
          assigneeId: data.get("assigneeId"),
          teamCode: data.get("teamCode") || null,
          entityType: data.get("entityType") || null,
          entityId: data.get("entityId") || null,
          dueAt: data.get("dueAt") || null,
          reminderAt: data.get("reminderAt") || null,
        });
        if (saved) form.reset();
      }}
    >
      <label>{locale === "zh" ? "标题" : "Title"}<input name="title" required /></label>
      <label>
        {locale === "zh" ? "负责人" : "Assignee"}
        <select name="assigneeId" required>
          {users.map((user) => <option key={user.id} value={user.id}>{user.label}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "优先级" : "Priority"}
        <select defaultValue="NORMAL" name="priority">
          {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        {locale === "zh" ? "团队" : "Team"}
        <select name="teamCode">
          <option value="">{locale === "zh" ? "个人任务" : "Personal task"}</option>
          {teams.map((team) => <option key={team} value={team}>{team}</option>)}
        </select>
      </label>
      <label>{locale === "zh" ? "截止日期" : "Due date"}<input name="dueAt" type="datetime-local" /></label>
      <label>{locale === "zh" ? "提醒时间" : "Reminder"}<input name="reminderAt" type="datetime-local" /></label>
      <label>{locale === "zh" ? "关联类型" : "Related type"}<input name="entityType" placeholder="Customer, Order, Ticket…" /></label>
      <label>{locale === "zh" ? "关联 ID" : "Related ID"}<input name="entityId" /></label>
      <label>{locale === "zh" ? "描述" : "Description"}<textarea name="description" /></label>
      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
    </form>
  );
}

export function MutationButton({
  locale,
  endpoint,
  body,
  label,
  method = "PATCH",
}: {
  locale: Locale;
  endpoint: string;
  body: unknown;
  label: string;
  method?: "PATCH" | "POST";
}) {
  const mutation = useMutation(locale);
  return (
    <span className="inline-action">
      <button
        className="button button-secondary"
        disabled={mutation.busy}
        onClick={() => void mutation.mutate(endpoint, body, method)}
        type="button"
      >
        {mutation.busy ? "…" : label}
      </button>
      {mutation.message ? <small>{mutation.message}</small> : null}
    </span>
  );
}

export function SettingEditor({
  locale,
  setting,
}: {
  locale: Locale;
  setting: {
    namespace: string;
    key: string;
    value: unknown;
    version: number;
    isSecret: boolean;
  };
}) {
  const mutation = useMutation(locale);
  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2));
  return (
    <form
      className="setting-editor"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          void mutation.mutate(
            "/api/settings",
            {
              namespace: setting.namespace,
              key: setting.key,
              value: JSON.parse(value),
              expectedVersion: setting.version,
              isSecret: setting.isSecret,
            },
            "PUT",
          );
        } catch {
          // Invalid JSON stays visible for correction.
        }
      }}
    >
      <textarea
        aria-label={`${setting.namespace}.${setting.key}`}
        onChange={(event) => setValue(event.target.value)}
        rows={8}
        value={value}
      />
      <Feedback locale={locale} busy={mutation.busy} message={mutation.message} />
    </form>
  );
}
