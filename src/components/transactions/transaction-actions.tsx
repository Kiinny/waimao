"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Feedback = "idle" | "loading" | "success" | "error";

async function requestJson(
  endpoint: string,
  method: "POST" | "PATCH",
  body: unknown,
) {
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
    throw new Error(result.error?.message ?? "Action failed");
  }
  return result;
}

function FeedbackText({
  state,
  message,
}: {
  state: Feedback;
  message: string;
}) {
  return message ? (
    <p
      className={state === "error" ? "form-feedback error" : "form-feedback success"}
      role="status"
    >
      {message}
    </p>
  ) : null;
}

export function TransactionAction({
  endpoint,
  label,
  body = {},
  confirmMessage,
}: {
  endpoint: string;
  label: string;
  body?: Record<string, unknown>;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<Feedback>("idle");
  const [message, setMessage] = useState("");

  async function run() {
    if (!window.confirm(confirmMessage)) return;
    setState("loading");
    setMessage("");
    try {
      await requestJson(endpoint, "POST", body);
      setState("success");
      setMessage("Completed");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <span>
      <button
        className="button button-secondary"
        disabled={state === "loading"}
        onClick={run}
        type="button"
      >
        {state === "loading" ? "Working..." : label}
      </button>
      <FeedbackText message={message} state={state} />
    </span>
  );
}

function useTransactionSubmit() {
  const router = useRouter();
  const [state, setState] = useState<Feedback>("idle");
  const [message, setMessage] = useState("");
  return {
    state,
    message,
    async submit(endpoint: string, body: unknown, successMessage: string) {
      setState("loading");
      setMessage("");
      try {
        await requestJson(endpoint, "POST", body);
        setState("success");
        setMessage(successMessage);
        router.refresh();
        return true;
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Action failed");
        return false;
      }
    },
  };
}

export function ProductCreateForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const action = useTransactionSubmit();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      sku: data.get("sku"),
      name: data.get("name"),
      categoryId: data.get("categoryId"),
      condition: data.get("condition"),
      baseModel: data.get("baseModel") || null,
      specifications: { summary: data.get("specifications") },
      referencePrice: data.get("referencePrice") || null,
      referenceCurrencyCode: "USD",
      dimensions: {
        lengthCm: Number(data.get("lengthCm")),
        widthCm: Number(data.get("widthCm")),
        heightCm: Number(data.get("heightCm")),
      },
      hsCode: data.get("hsCode") || null,
      exportControlRisk: data.get("exportControlRisk"),
      media: [],
      availability: data.get("availability"),
      variants: [
        {
          sku: data.get("variantSku"),
          name: data.get("variantName"),
          configurationVersion: 1,
          configuration: { summary: data.get("configuration") },
          cost: data.get("cost") || null,
          currencyCode: "USD",
        },
      ],
    };
    if (await action.submit("/api/products", body, "Product created")) form.reset();
  }
  return (
    <form className="crm-form" onSubmit={submit}>
      <label>SKU<input name="sku" required /></label>
      <label>Name<input name="name" required /></label>
      <label>Category<select name="categoryId" required><option value="">Select</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Condition<select name="condition"><option>NEW</option><option>REFURBISHED</option><option>USED</option><option>OPEN_BOX</option></select></label>
      <label>Base model<input name="baseModel" /></label>
      <label>Specifications<input name="specifications" required /></label>
      <label>Reference price<input min="0" name="referencePrice" step="0.0001" type="number" /></label>
      <label>Variant SKU<input name="variantSku" required /></label>
      <label>Configuration name<input name="variantName" required /></label>
      <label>Configuration<input name="configuration" required /></label>
      <label>Estimated cost USD<input min="0" name="cost" step="0.0001" type="number" /></label>
      <label>Length cm<input min="0" name="lengthCm" step="0.1" type="number" /></label>
      <label>Width cm<input min="0" name="widthCm" step="0.1" type="number" /></label>
      <label>Height cm<input min="0" name="heightCm" step="0.1" type="number" /></label>
      <label>HS code<input name="hsCode" /></label>
      <label>Export risk<select name="exportControlRisk"><option>LOW</option><option>REVIEW_REQUIRED</option><option>RESTRICTED</option></select></label>
      <label>Availability<select name="availability"><option>AVAILABLE</option><option>IN_STOCK</option><option>LIMITED</option><option>ON_REQUEST</option><option>UNAVAILABLE</option></select></label>
      <button className="button" disabled={action.state === "loading"} type="submit">Create product</button>
      <FeedbackText message={action.message} state={action.state} />
    </form>
  );
}

export function QuoteCreateForm({
  customers,
  configurations,
}: {
  customers: Array<{ id: string; companyName: string }>;
  configurations: Array<{
    id: string;
    productId: string;
    label: string;
  }>;
}) {
  const action = useTransactionSubmit();
  const [itemRows, setItemRows] = useState([0]);
  const [nextItemRow, setNextItemRow] = useState(1);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const items = itemRows.map((row) => {
      const selected = configurations.find(
        ({ id }) => id === data.get(`variantId_${row}`),
      );
      if (!selected) throw new Error("Select a configuration for every item");
      return {
        productId: selected.productId,
        variantId: selected.id,
        quantity: Number(data.get(`quantity_${row}`)),
        unitPrice: data.get(`unitPrice_${row}`),
        discount: data.get(`discount_${row}`) || "0",
      };
    });
    const body = {
      customerId: data.get("customerId"),
      currencyCode: data.get("currencyCode"),
      exchangeRateToUsd: data.get("exchangeRateToUsd"),
      shipping: data.get("shipping") || "0",
      insurance: data.get("insurance") || "0",
      tax: data.get("tax") || "0",
      bankFees: data.get("bankFees") || "0",
      incoterm: data.get("incoterm") || null,
      paymentTerms: data.get("paymentTerms") || null,
      deliveryTerms: data.get("deliveryTerms") || null,
      warrantyTerms: data.get("warrantyTerms") || null,
      remarks: data.get("remarks") || null,
      items,
    };
    if (await action.submit("/api/quotes", body, "Quotation created")) form.reset();
  }
  return (
    <form className="crm-form" onSubmit={submit}>
      <label>Customer<select name="customerId" required><option value="">Select</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
      {itemRows.map((row, index) => (
        <fieldset className="card" key={row}>
          <legend>Item {index + 1}</legend>
          <label>Configuration<select name={`variantId_${row}`} required><option value="">Select</option>{configurations.map((configuration) => <option key={configuration.id} value={configuration.id}>{configuration.label}</option>)}</select></label>
          <label>Quantity<input defaultValue="1" min="1" name={`quantity_${row}`} required type="number" /></label>
          <label>Unit price<input min="0.0001" name={`unitPrice_${row}`} required step="0.0001" type="number" /></label>
          <label>Discount<input defaultValue="0" min="0" name={`discount_${row}`} step="0.0001" type="number" /></label>
          {itemRows.length > 1 ? (
            <button className="button button-secondary" onClick={() => setItemRows((current) => current.filter((item) => item !== row))} type="button">Remove item</button>
          ) : null}
        </fieldset>
      ))}
      <button
        className="button button-secondary"
        onClick={() => {
          setItemRows((current) => [...current, nextItemRow]);
          setNextItemRow((current) => current + 1);
        }}
        type="button"
      >
        Add item
      </button>
      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
      <label>Shipping<input defaultValue="0" min="0" name="shipping" step="0.0001" type="number" /></label>
      <label>Insurance<input defaultValue="0" min="0" name="insurance" step="0.0001" type="number" /></label>
      <label>Tax<input defaultValue="0" min="0" name="tax" step="0.0001" type="number" /></label>
      <label>Bank fees<input defaultValue="0" min="0" name="bankFees" step="0.0001" type="number" /></label>
      <label>Incoterm<input defaultValue="CIF" name="incoterm" /></label>
      <label>Payment terms<input defaultValue="100% T/T Before Purchase" name="paymentTerms" /></label>
      <label>Delivery terms<input defaultValue="30 days after confirmed payment" name="deliveryTerms" /></label>
      <label>Warranty<input defaultValue="12 months" name="warrantyTerms" /></label>
      <label>Remarks<textarea name="remarks" /></label>
      <button className="button" disabled={action.state === "loading"} type="submit">Create quotation</button>
      <FeedbackText message={action.message} state={action.state} />
    </form>
  );
}

export function PaymentCreateForm({ orderId }: { orderId: string }) {
  const action = useTransactionSubmit();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      await action.submit(
        "/api/payments",
        {
          salesOrderId: orderId,
          reference: data.get("reference") || null,
          amount: data.get("amount"),
          currencyCode: data.get("currencyCode"),
          exchangeRateToUsd: data.get("exchangeRateToUsd"),
          receivedAt: new Date().toISOString(),
          proofMetadata: {
            fileName: data.get("proofFileName"),
            objectKey: data.get("proofObjectKey"),
          },
        },
        "Payment submitted for finance verification",
      )
    )
      form.reset();
  }
  return (
    <form className="crm-form" onSubmit={submit}>
      <label>Reference<input name="reference" /></label>
      <label>Amount<input min="0.0001" name="amount" required step="0.0001" type="number" /></label>
      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
      <label>Proof file name<input name="proofFileName" required /></label>
      <label>Proof object key<input name="proofObjectKey" required /></label>
      <button className="button" disabled={action.state === "loading"} type="submit">Submit payment</button>
      <FeedbackText message={action.message} state={action.state} />
    </form>
  );
}

export function RefundForm({ paymentId }: { paymentId: string }) {
  const action = useTransactionSubmit();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Record this refund and recompute purchase eligibility?")) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      await action.submit(
        `/api/payments/${paymentId}/refund`,
        {
          amount: data.get("amount"),
          currencyCode: data.get("currencyCode"),
          exchangeRateToUsd: data.get("exchangeRateToUsd"),
          reason: data.get("reason"),
        },
        "Refund recorded",
      )
    )
      form.reset();
  }
  return (
    <form className="crm-form" onSubmit={submit}>
      <label>Refund amount<input min="0.0001" name="amount" required step="0.0001" type="number" /></label>
      <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
      <label>Rate to USD<input defaultValue="1" min="0.000000000001" name="exchangeRateToUsd" required step="0.000000000001" type="number" /></label>
      <label>Reason<input name="reason" required /></label>
      <button className="button button-secondary" disabled={action.state === "loading"} type="submit">Refund</button>
      <FeedbackText message={action.message} state={action.state} />
    </form>
  );
}
