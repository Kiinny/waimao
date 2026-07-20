"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Locale = "en" | "zh";
type Option = { id: string; label: string };
type InventoryOption = Option & {
  version: number;
  serialized: boolean;
  serials: Array<{ id: string; serialNumber: string; status: string }>;
};
type OrderOption = Option & {
  items: Array<{ id: string; label: string; quantity: number }>;
};

const text = {
  en: {
    save: "Save",
    saving: "Saving…",
    saved: "Saved successfully.",
    failed: "Request failed.",
    addLine: "Add line",
    remove: "Remove",
    select: "Select…",
  },
  zh: {
    save: "保存",
    saving: "保存中…",
    saved: "保存成功。",
    failed: "请求失败。",
    addLine: "添加明细",
    remove: "删除",
    select: "请选择…",
  },
} as const;

function commaSeparatedValues(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function useMutation(locale: Locale) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(endpoint: string, body: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
    setError(false);
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
        throw new Error(result.error?.message ?? text[locale].failed);
      }
      setMessage(text[locale].saved);
      router.refresh();
      return true;
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : text[locale].failed);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, message, error, submit };
}

function Feedback({
  busy,
  message,
  error,
  locale,
}: {
  busy: boolean;
  message: string;
  error: boolean;
  locale: Locale;
}) {
  return (
    <>
      <button className="button" disabled={busy} type="submit">
        {busy ? text[locale].saving : text[locale].save}
      </button>
      {message ? (
        <p className={`form-feedback ${error ? "error" : "success"}`} role="status">
          {message}
        </p>
      ) : null}
    </>
  );
}

export function PurchaseOrderForm({
  locale,
  suppliers,
  orders,
}: {
  locale: Locale;
  suppliers: Option[];
  orders: OrderOption[];
}) {
  const mutation = useMutation(locale);
  const [salesOrderId, setSalesOrderId] = useState(orders[0]?.id ?? "");
  const activeOrder = orders.find((order) => order.id === salesOrderId);
  const [lines, setLines] = useState([
    { salesOrderItemId: orders[0]?.items[0]?.id ?? "", quantity: 1, unitCost: "" },
  ]);
  const labels =
    locale === "zh"
      ? {
          supplier: "供应商",
          order: "销售订单",
          currency: "币种",
          rate: "兑 USD 汇率",
          payment: "付款条款",
          shipping: "运输条款",
          incoterm: "贸易术语",
          expected: "预计到货",
          attachments: "附件资产 ID（逗号分隔）",
          line: "销售订单明细",
          quantity: "数量",
          cost: "采购单价",
        }
      : {
          supplier: "Supplier",
          order: "Sales order",
          currency: "Currency",
          rate: "Rate to USD",
          payment: "Payment terms",
          shipping: "Shipping terms",
          incoterm: "Incoterm",
          expected: "Expected receipt",
          attachments: "Attachment asset IDs (comma separated)",
          line: "Sales order line",
          quantity: "Quantity",
          cost: "Unit cost",
        };

  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit("/api/purchase-orders", {
          supplierId: data.get("supplierId"),
          salesOrderId,
          currencyCode: data.get("currencyCode"),
          exchangeRateToUsd: data.get("exchangeRateToUsd"),
          paymentTerms: data.get("paymentTerms") || undefined,
          shippingTerms: data.get("shippingTerms") || undefined,
          incoterm: data.get("incoterm") || undefined,
          expectedAt: data.get("expectedAt") || undefined,
          attachmentIds: commaSeparatedValues(data.get("attachmentIds")),
          items: lines.map((line) => ({
            salesOrderItemId: line.salesOrderItemId,
            quantity: Number(line.quantity),
            unitCost: line.unitCost,
          })),
        });
      }}
    >
      <label>
        {labels.supplier}
        <select name="supplierId" required>
          <option value="">{text[locale].select}</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.order}
        <select
          required
          value={salesOrderId}
          onChange={(event) => {
            const id = event.target.value;
            const order = orders.find((candidate) => candidate.id === id);
            setSalesOrderId(id);
            setLines([
              {
                salesOrderItemId: order?.items[0]?.id ?? "",
                quantity: 1,
                unitCost: "",
              },
            ]);
          }}
        >
          <option value="">{text[locale].select}</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.currency}
        <input defaultValue="USD" maxLength={3} name="currencyCode" required />
      </label>
      <label>
        {labels.rate}
        <input defaultValue="1" inputMode="decimal" name="exchangeRateToUsd" required />
      </label>
      <label>
        {labels.payment}
        <input name="paymentTerms" />
      </label>
      <label>
        {labels.shipping}
        <input name="shippingTerms" />
      </label>
      <label>
        {labels.incoterm}
        <input name="incoterm" placeholder="FOB" />
      </label>
      <label>
        {labels.expected}
        <input name="expectedAt" type="date" />
      </label>
      <label>
        {labels.attachments}
        <input name="attachmentIds" />
      </label>
      <div className="workflow-lines">
        {lines.map((line, index) => (
          <div className="workflow-line" key={index}>
            <label>
              {labels.line}
              <select
                required
                value={line.salesOrderItemId}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? { ...candidate, salesOrderItemId: event.target.value }
                        : candidate,
                    ),
                  )
                }
              >
                <option value="">{text[locale].select}</option>
                {activeOrder?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} × {item.quantity}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {labels.quantity}
              <input
                min={1}
                required
                type="number"
                value={line.quantity}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? { ...candidate, quantity: Number(event.target.value) }
                        : candidate,
                    ),
                  )
                }
              />
            </label>
            <label>
              {labels.cost}
              <input
                inputMode="decimal"
                required
                value={line.unitCost}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? { ...candidate, unitCost: event.target.value }
                        : candidate,
                    ),
                  )
                }
              />
            </label>
            {lines.length > 1 ? (
              <button
                className="button button-secondary"
                onClick={() =>
                  setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))
                }
                type="button"
              >
                {text[locale].remove}
              </button>
            ) : null}
          </div>
        ))}
        <button
          className="button button-secondary"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                salesOrderItemId: activeOrder?.items[0]?.id ?? "",
                quantity: 1,
                unitCost: "",
              },
            ])
          }
          type="button"
        >
          {text[locale].addLine}
        </button>
      </div>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function InventoryMutationForm({
  locale,
  items,
}: {
  locale: Locale;
  items: InventoryOption[];
}) {
  const mutation = useMutation(locale);
  const [inventoryId, setInventoryId] = useState(items[0]?.id ?? "");
  const active = items.find((item) => item.id === inventoryId);
  const labels =
    locale === "zh"
      ? { item: "库存记录", type: "操作", quantity: "数量", serial: "序列号", notes: "备注" }
      : { item: "Inventory item", type: "Action", quantity: "Quantity", serial: "Serial number", notes: "Notes" };
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit("/api/inventory/transactions", {
          inventoryItemId: inventoryId,
          expectedVersion: active?.version,
          type: data.get("type"),
          quantity: Number(data.get("quantity")),
          serialNumber: data.get("serialNumber") || undefined,
          notes: data.get("notes") || undefined,
        });
      }}
    >
      <label>
        {labels.item}
        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {labels.type}
        <select name="type">
          {["RECEIPT", "RESERVATION", "RELEASE", "ISSUE", "DAMAGE", "RETURN", "COUNT"].map(
            (type) => (
              <option key={type}>{type}</option>
            ),
          )}
        </select>
      </label>
      <label>
        {labels.quantity}
        <input defaultValue={1} min={1} name="quantity" required type="number" />
      </label>
      <label>
        {labels.serial}
        <input
          list={`serials-${inventoryId}`}
          name="serialNumber"
          required={active?.serialized}
        />
        <datalist id={`serials-${inventoryId}`}>
          {active?.serials.map((serial) => (
            <option key={serial.id} value={serial.serialNumber}>
              {serial.status}
            </option>
          ))}
        </datalist>
      </label>
      <label>
        {labels.notes}
        <textarea name="notes" />
      </label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function InventoryTransferForm({
  locale,
  items,
  locations,
}: {
  locale: Locale;
  items: InventoryOption[];
  locations: Option[];
}) {
  const mutation = useMutation(locale);
  const [inventoryId, setInventoryId] = useState(items[0]?.id ?? "");
  const active = items.find((item) => item.id === inventoryId);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const serials = String(data.get("serialNumbers") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        await mutation.submit("/api/inventory/transfer", {
          inventoryItemId: inventoryId,
          expectedVersion: active?.version,
          toLocationId: data.get("toLocationId"),
          quantity: Number(data.get("quantity")),
          serialNumbers: serials.length ? serials : undefined,
          notes: data.get("notes") || undefined,
        });
      }}
    >
      <label>
        {locale === "zh" ? "库存记录" : "Inventory item"}
        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "目标库位" : "Destination location"}
        <select name="toLocationId" required>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "数量" : "Quantity"}
        <input defaultValue={1} min={1} name="quantity" required type="number" />
      </label>
      <label>
        {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
        <input name="serialNumbers" required={active?.serialized} />
      </label>
      <label>
        {locale === "zh" ? "备注" : "Notes"}
        <textarea name="notes" />
      </label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function InspectionForm({
  locale,
  items,
  initialInventoryId,
  initialSerialId,
}: {
  locale: Locale;
  items: InventoryOption[];
  initialInventoryId?: string;
  initialSerialId?: string;
}) {
  const mutation = useMutation(locale);
  const [inventoryId, setInventoryId] = useState(
    initialInventoryId ?? items[0]?.id ?? "",
  );
  const active = items.find((item) => item.id === inventoryId);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit("/api/inspections", {
          inventoryItemId: inventoryId,
          inventorySerialId: data.get("inventorySerialId") || undefined,
          status: data.get("status"),
          checklist: {
            appearance: data.has("appearance"),
            serialVerified: data.has("serialVerified"),
            boot: data.has("boot"),
            burnIn: data.has("burnIn"),
            ports: data.has("ports"),
          },
          notes: data.get("notes") || undefined,
          evidence:
            data.get("evidenceObjectKey") && data.get("evidenceFileName")
              ? [
                  {
                    objectKey: data.get("evidenceObjectKey"),
                    fileName: data.get("evidenceFileName"),
                  },
                ]
              : [],
        });
      }}
    >
      <label>
        {locale === "zh" ? "库存记录" : "Inventory item"}
        <select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "序列号" : "Serial number"}
        <select
          defaultValue={initialSerialId ?? ""}
          name="inventorySerialId"
          required={active?.serialized}
        >
          <option value="">{text[locale].select}</option>
          {active?.serials
            .filter((serial) => ["AVAILABLE", "RESERVED"].includes(serial.status))
            .map((serial) => (
              <option key={serial.id} value={serial.id}>
                {serial.serialNumber} · {serial.status}
              </option>
            ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "结果" : "Result"}
        <select name="status">
          {["PENDING", "PASSED", "FAILED", "CONDITIONAL"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <fieldset className="checklist-fieldset">
        <legend>{locale === "zh" ? "质检清单" : "Inspection checklist"}</legend>
        {[
          ["appearance", locale === "zh" ? "外观" : "Appearance"],
          ["serialVerified", locale === "zh" ? "序列号核对" : "Serial verified"],
          ["boot", locale === "zh" ? "启动测试" : "Boot test"],
          ["burnIn", locale === "zh" ? "烤机测试" : "Burn-in"],
          ["ports", locale === "zh" ? "端口测试" : "Port test"],
        ].map(([name, label]) => (
          <label key={name}>
            <input name={name} type="checkbox" /> {label}
          </label>
        ))}
      </fieldset>
      <label>
        {locale === "zh" ? "证据文件名" : "Evidence file name"}
        <input name="evidenceFileName" />
      </label>
      <label>
        {locale === "zh" ? "对象存储路径" : "Object storage key"}
        <input name="evidenceObjectKey" />
      </label>
      <label>
        {locale === "zh" ? "备注" : "Notes"}
        <textarea name="notes" />
      </label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function ShipmentForm({
  locale,
  orders,
  inventory,
}: {
  locale: Locale;
  orders: OrderOption[];
  inventory: InventoryOption[];
}) {
  const mutation = useMutation(locale);
  const [salesOrderId, setSalesOrderId] = useState(orders[0]?.id ?? "");
  const activeOrder = orders.find((order) => order.id === salesOrderId);
  const [lines, setLines] = useState([
    {
      salesOrderItemId: orders[0]?.items[0]?.id ?? "",
      inventoryItemId: inventory[0]?.id ?? "",
      quantity: 1,
      serialNumbers: "",
    },
  ]);
  const inventoryById = useMemo(
    () => new Map(inventory.map((item) => [item.id, item])),
    [inventory],
  );
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit("/api/shipments", {
          salesOrderId,
          method: data.get("method"),
          carrier: data.get("carrier") || undefined,
          trackingNumber: data.get("trackingNumber") || undefined,
          incoterm: data.get("incoterm") || undefined,
          origin: data.get("origin") || undefined,
          destination: data.get("destination") || undefined,
          originPort: data.get("originPort") || undefined,
          destinationPort: data.get("destinationPort") || undefined,
          grossWeightKg: data.get("grossWeightKg") || undefined,
          volumeCbm: data.get("volumeCbm") || undefined,
          freightCost: data.get("freightCost") || undefined,
          freightCurrencyCode: data.get("freightCurrencyCode") || undefined,
          freightExchangeRateToUsd:
            data.get("freightExchangeRateToUsd") || undefined,
          estimatedDepartureAt: data.get("estimatedDepartureAt") || undefined,
          estimatedArrivalAt: data.get("estimatedArrivalAt") || undefined,
          documentIds: commaSeparatedValues(data.get("documentIds")),
          items: lines.map((line) => {
            const serialNumbers = line.serialNumbers
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);
            return {
              salesOrderItemId: line.salesOrderItemId,
              inventoryItemId: line.inventoryItemId,
              quantity: Number(line.quantity),
              serialNumbers: serialNumbers.length ? serialNumbers : undefined,
            };
          }),
        });
      }}
    >
      <label>
        {locale === "zh" ? "销售订单" : "Sales order"}
        <select
          value={salesOrderId}
          onChange={(event) => {
            setSalesOrderId(event.target.value);
            const order = orders.find((candidate) => candidate.id === event.target.value);
            setLines((current) =>
              current.map((line, index) => ({
                ...line,
                salesOrderItemId: index === 0 ? order?.items[0]?.id ?? "" : "",
              })),
            );
          }}
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "运输方式" : "Method"}
        <select name="method">
          {["AIR", "SEA", "ROAD", "RAIL", "COURIER", "CUSTOMER_PICKUP"].map(
            (method) => (
              <option key={method}>{method}</option>
            ),
          )}
        </select>
      </label>
      {[
        ["carrier", locale === "zh" ? "承运商" : "Carrier"],
        ["trackingNumber", locale === "zh" ? "运单号" : "Tracking number"],
        ["incoterm", locale === "zh" ? "贸易术语" : "Incoterm"],
        ["origin", locale === "zh" ? "起运地" : "Origin"],
        ["destination", locale === "zh" ? "目的地" : "Destination"],
        ["originPort", locale === "zh" ? "起运港" : "Origin port"],
        ["destinationPort", locale === "zh" ? "目的港" : "Destination port"],
        ["grossWeightKg", locale === "zh" ? "毛重（kg）" : "Gross weight (kg)"],
        ["volumeCbm", locale === "zh" ? "体积（m³）" : "Volume (m³)"],
        ["freightCost", locale === "zh" ? "运费" : "Freight cost"],
        ["freightCurrencyCode", locale === "zh" ? "运费币种" : "Freight currency"],
        ["freightExchangeRateToUsd", locale === "zh" ? "运费兑 USD 汇率" : "Freight rate to USD"],
        ["documentIds", locale === "zh" ? "单证资产 ID（逗号分隔）" : "Document asset IDs (comma separated)"],
      ].map(([name, label]) => (
        <label key={name}>
          {label}
          <input name={name} />
        </label>
      ))}
      <label>
        {locale === "zh" ? "预计发运" : "Estimated departure"}
        <input name="estimatedDepartureAt" type="date" />
      </label>
      <label>
        {locale === "zh" ? "预计到达" : "Estimated arrival"}
        <input name="estimatedArrivalAt" type="date" />
      </label>
      <div className="workflow-lines">
        {lines.map((line, index) => {
          const stock = inventoryById.get(line.inventoryItemId);
          return (
            <div className="workflow-line" key={index}>
              <label>
                {locale === "zh" ? "订单明细" : "Order line"}
                <select
                  value={line.salesOrderItemId}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((candidate, rowIndex) =>
                        rowIndex === index
                          ? { ...candidate, salesOrderItemId: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                >
                  {activeOrder?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} × {item.quantity}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {locale === "zh" ? "库存记录" : "Inventory item"}
                <select
                  value={line.inventoryItemId}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((candidate, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...candidate,
                              inventoryItemId: event.target.value,
                              serialNumbers: "",
                            }
                          : candidate,
                      ),
                    )
                  }
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {locale === "zh" ? "数量" : "Quantity"}
                <input
                  min={1}
                  type="number"
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((candidate, rowIndex) =>
                        rowIndex === index
                          ? { ...candidate, quantity: Number(event.target.value) }
                          : candidate,
                      ),
                    )
                  }
                />
              </label>
              <label>
                {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
                <input
                  list={`shipment-serials-${index}`}
                  required={stock?.serialized}
                  value={line.serialNumbers}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((candidate, rowIndex) =>
                        rowIndex === index
                          ? { ...candidate, serialNumbers: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <datalist id={`shipment-serials-${index}`}>
                  {stock?.serials
                    .filter((serial) => serial.status === "AVAILABLE")
                    .map((serial) => (
                      <option key={serial.id} value={serial.serialNumber} />
                    ))}
                </datalist>
              </label>
              {lines.length > 1 ? (
                <button
                  className="button button-secondary"
                  onClick={() =>
                    setLines((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  type="button"
                >
                  {text[locale].remove}
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          className="button button-secondary"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                salesOrderItemId: activeOrder?.items[0]?.id ?? "",
                inventoryItemId: inventory[0]?.id ?? "",
                quantity: 1,
                serialNumbers: "",
              },
            ])
          }
          type="button"
        >
          {text[locale].addLine}
        </button>
      </div>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function WorkflowAction({
  locale,
  endpoint,
  body,
  label,
  confirmMessage,
}: {
  locale: Locale;
  endpoint: string;
  body: Record<string, unknown>;
  label: string;
  confirmMessage?: string;
}) {
  const mutation = useMutation(locale);
  return (
    <div className="inline-action">
      <button
        className="button button-secondary"
        disabled={mutation.busy}
        onClick={() => {
          if (!confirmMessage || window.confirm(confirmMessage)) {
            void mutation.submit(endpoint, body);
          }
        }}
        type="button"
      >
        {mutation.busy ? text[locale].saving : label}
      </button>
      {mutation.message ? (
        <span className={`form-feedback ${mutation.error ? "error" : "success"}`}>
          {mutation.message}
        </span>
      ) : null}
    </div>
  );
}

export function PurchaseReceiptForm({
  locale,
  purchaseOrderId,
  expectedVersion,
  lines,
  locations,
}: {
  locale: Locale;
  purchaseOrderId: string;
  expectedVersion: number;
  lines: Array<{ id: string; label: string; remaining: number; serialized: boolean }>;
  locations: Option[];
}) {
  const mutation = useMutation(locale);
  const [lineId, setLineId] = useState(lines[0]?.id ?? "");
  const activeLine = lines.find((line) => line.id === lineId);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const serialNumbers = String(data.get("serialNumbers") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        await mutation.submit(`/api/purchase-orders/${purchaseOrderId}/receive`, {
          expectedVersion,
          locationId: data.get("locationId"),
          items: [
            {
              purchaseOrderItemId: lineId,
              quantity: Number(data.get("quantity")),
              serialNumbers: serialNumbers.length ? serialNumbers : undefined,
            },
          ],
        });
      }}
    >
      <label>
        {locale === "zh" ? "采购明细" : "Purchase line"}
        <select value={lineId} onChange={(event) => setLineId(event.target.value)}>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.label} · {locale === "zh" ? "待收" : "remaining"} {line.remaining}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "入库库位" : "Receiving location"}
        <select name="locationId">
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {locale === "zh" ? "本次收货数量" : "Receipt quantity"}
        <input
          defaultValue={1}
          max={activeLine?.remaining}
          min={1}
          name="quantity"
          type="number"
        />
      </label>
      <label>
        {locale === "zh" ? "序列号（逗号分隔）" : "Serials (comma separated)"}
        <input name="serialNumbers" required={activeLine?.serialized} />
      </label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function SupplierCreateForm({
  locale,
  productOptions,
}: {
  locale: Locale;
  productOptions: Option[];
}) {
  const mutation = useMutation(locale);
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const saved = await mutation.submit("/api/suppliers", {
          code: data.get("code"),
          name: data.get("name"),
          countryCode: data.get("countryCode"),
          status: data.get("status"),
          contactName: data.get("contactName") || null,
          email: data.get("email") || null,
          phone: data.get("phone") || null,
          productRelations: data
            .getAll("productIds")
            .filter((value): value is string => typeof value === "string")
            .map((productId) => ({ productId })),
        });
        if (saved) form.reset();
      }}
    >
      <label>{locale === "zh" ? "供应商编号" : "Supplier code"}<input name="code" required /></label>
      <label>{locale === "zh" ? "名称" : "Name"}<input name="name" required /></label>
      <label>{locale === "zh" ? "国家/地区代码" : "Country/region code"}<input maxLength={2} name="countryCode" required /></label>
      <label>
        {locale === "zh" ? "状态" : "Status"}
        <select defaultValue="ACTIVE" name="status">
          <option value="ACTIVE">{locale === "zh" ? "启用" : "Active"}</option>
          <option value="INACTIVE">{locale === "zh" ? "停用" : "Inactive"}</option>
        </select>
      </label>
      <label>{locale === "zh" ? "联系人" : "Contact"}<input name="contactName" /></label>
      <label>{locale === "zh" ? "电子邮箱" : "Email"}<input name="email" type="email" /></label>
      <label>{locale === "zh" ? "电话" : "Phone"}<input name="phone" /></label>
      <label>
        {locale === "zh" ? "供应产品" : "Products supplied"}
        <select multiple name="productIds" size={Math.min(8, Math.max(3, productOptions.length))}>
          {productOptions.map((product) => (
            <option key={product.id} value={product.id}>{product.label}</option>
          ))}
        </select>
      </label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function SupplierEditForm({
  locale,
  supplier,
  productOptions,
}: {
  locale: Locale;
  supplier: {
    id: string;
    code: string;
    name: string;
    countryCode: string;
    supplierType: string;
    status: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    taxId: string | null;
    paymentTerms: string | null;
    leadTimeDays: number | null;
    minimumOrderValue: { toString(): string } | string | null;
    rating: number | null;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    notes: string | null;
    version: number;
    products: Array<{
      productId: string;
      supplierSku: string | null;
      leadTimeDays: number | null;
      lastCost: { toString(): string } | string | null;
      currencyCode: string | null;
    }>;
  };
  productOptions: Option[];
}) {
  const mutation = useMutation(locale);
  const labels =
    locale === "zh"
      ? {
          code: "供应商编号",
          name: "名称",
          country: "国家/地区代码",
          type: "供应商类型",
          contact: "联系人",
          email: "电子邮箱",
          phone: "电话",
          website: "网站",
          tax: "税务编号",
          terms: "付款条款",
          leadTime: "交货周期（天）",
          minimum: "最低订单金额",
          rating: "评级（1–5）",
          bank: "开户行",
          accountName: "账户名称",
          accountNumber: "新银行账号（留空则不变）",
          notes: "备注",
        }
      : {
          code: "Supplier code",
          name: "Name",
          country: "Country/region code",
          type: "Supplier type",
          contact: "Contact",
          email: "Email",
          phone: "Phone",
          website: "Website",
          tax: "Tax ID",
          terms: "Payment terms",
          leadTime: "Lead time (days)",
          minimum: "Minimum order value",
          rating: "Rating (1–5)",
          bank: "Bank",
          accountName: "Account name",
          accountNumber: "New bank account number (leave blank to keep)",
          notes: "Notes",
        };
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const bankAccountNumber = String(data.get("bankAccountNumber") ?? "").trim();
        const productRelations = data
          .getAll("productIds")
          .filter((value): value is string => typeof value === "string")
          .map((productId) => {
            const current = supplier.products.find(
              (relation) => relation.productId === productId,
            );
            return current
              ? {
                  productId,
                  supplierSku: current.supplierSku,
                  leadTimeDays: current.leadTimeDays,
                  lastCost: current.lastCost?.toString() ?? null,
                  currencyCode: current.currencyCode,
                }
              : { productId };
          });
        await mutation.submit(
          `/api/suppliers/${supplier.id}`,
          {
            expectedVersion: supplier.version,
            code: data.get("code"),
            name: data.get("name"),
            countryCode: data.get("countryCode"),
            supplierType: data.get("supplierType"),
            status: data.get("status"),
            contactName: data.get("contactName") || null,
            email: data.get("email") || null,
            phone: data.get("phone") || null,
            website: data.get("website") || null,
            taxId: data.get("taxId") || null,
            paymentTerms: data.get("paymentTerms") || null,
            leadTimeDays: data.get("leadTimeDays")
              ? Number(data.get("leadTimeDays"))
              : null,
            minimumOrderValue: data.get("minimumOrderValue") || null,
            rating: data.get("rating") ? Number(data.get("rating")) : null,
            bankName: data.get("bankName") || null,
            bankAccountName: data.get("bankAccountName") || null,
            ...(bankAccountNumber ? { bankAccountNumber } : {}),
            productRelations,
            notes: data.get("notes") || null,
          },
          "PATCH",
        );
      }}
    >
      <label>{labels.code}<input defaultValue={supplier.code} name="code" required /></label>
      <label>{labels.name}<input defaultValue={supplier.name} name="name" required /></label>
      <label>{labels.country}<input defaultValue={supplier.countryCode} maxLength={2} name="countryCode" required /></label>
      <label>
        {labels.type}
        <select defaultValue={supplier.supplierType} name="supplierType">
          {["MANUFACTURER", "DISTRIBUTOR", "BROKER", "REFURBISHER", "LOGISTICS", "OTHER"].map(
            (type) => <option key={type}>{type}</option>,
          )}
        </select>
      </label>
      <label>
        {locale === "zh" ? "状态" : "Status"}
        <select defaultValue={supplier.status} name="status">
          <option value="ACTIVE">{locale === "zh" ? "启用" : "Active"}</option>
          <option value="INACTIVE">{locale === "zh" ? "停用" : "Inactive"}</option>
        </select>
      </label>
      <label>{labels.contact}<input defaultValue={supplier.contactName ?? ""} name="contactName" /></label>
      <label>{labels.email}<input defaultValue={supplier.email ?? ""} name="email" type="email" /></label>
      <label>{labels.phone}<input defaultValue={supplier.phone ?? ""} name="phone" /></label>
      <label>{labels.website}<input defaultValue={supplier.website ?? ""} name="website" type="url" /></label>
      <label>{labels.tax}<input defaultValue={supplier.taxId ?? ""} name="taxId" /></label>
      <label>{labels.terms}<input defaultValue={supplier.paymentTerms ?? ""} name="paymentTerms" /></label>
      <label>{labels.leadTime}<input defaultValue={supplier.leadTimeDays ?? ""} min={0} name="leadTimeDays" type="number" /></label>
      <label>{labels.minimum}<input defaultValue={supplier.minimumOrderValue?.toString() ?? ""} inputMode="decimal" name="minimumOrderValue" /></label>
      <label>{labels.rating}<input defaultValue={supplier.rating ?? ""} max={5} min={1} name="rating" type="number" /></label>
      <label>{labels.bank}<input defaultValue={supplier.bankName ?? ""} name="bankName" /></label>
      <label>{labels.accountName}<input defaultValue={supplier.bankAccountName ?? ""} name="bankAccountName" /></label>
      <label>{labels.accountNumber}<input name="bankAccountNumber" placeholder={supplier.bankAccountNumber ?? ""} /></label>
      <label>
        {locale === "zh" ? "供应产品" : "Products supplied"}
        <select
          defaultValue={supplier.products.map((relation) => relation.productId)}
          multiple
          name="productIds"
          size={Math.min(8, Math.max(3, productOptions.length))}
        >
          {productOptions.map((product) => (
            <option key={product.id} value={product.id}>{product.label}</option>
          ))}
        </select>
      </label>
      <label>{labels.notes}<textarea defaultValue={supplier.notes ?? ""} name="notes" /></label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function SupplierArchiveAction({
  locale,
  supplierId,
  expectedVersion,
}: {
  locale: Locale;
  supplierId: string;
  expectedVersion: number;
}) {
  const mutation = useMutation(locale);
  return (
    <div className="inline-action">
      <button
        className="button button-secondary"
        disabled={mutation.busy}
        onClick={() => {
          const confirmed = window.confirm(
            locale === "zh"
              ? "确认归档此供应商？归档后将从活跃供应商列表隐藏。"
              : "Archive this supplier? It will be hidden from active supplier lists.",
          );
          if (confirmed) {
            void mutation.submit(
              `/api/suppliers/${supplierId}`,
              { expectedVersion },
              "DELETE",
            );
          }
        }}
        type="button"
      >
        {mutation.busy
          ? text[locale].saving
          : locale === "zh"
            ? "归档供应商"
            : "Archive supplier"}
      </button>
      {mutation.message ? (
        <span className={`form-feedback ${mutation.error ? "error" : "success"}`}>
          {mutation.message}
        </span>
      ) : null}
    </div>
  );
}

export function PurchaseOrderUpdateForm({
  locale,
  purchaseOrder,
}: {
  locale: Locale;
  purchaseOrder: {
    id: string;
    version: number;
    paymentTerms: string | null;
    shippingTerms: string | null;
    incoterm: string | null;
    notes: string | null;
    expectedAt: Date | string | null;
    attachments: unknown;
  };
}) {
  const mutation = useMutation(locale);
  const attachmentIds = Array.isArray(purchaseOrder.attachments)
    ? purchaseOrder.attachments.filter((value): value is string => typeof value === "string")
    : [];
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit(
          `/api/purchase-orders/${purchaseOrder.id}`,
          {
            expectedVersion: purchaseOrder.version,
            paymentTerms: data.get("paymentTerms") || null,
            shippingTerms: data.get("shippingTerms") || null,
            incoterm: data.get("incoterm") || null,
            notes: data.get("notes") || null,
            expectedAt: data.get("expectedAt") || null,
            attachmentIds: commaSeparatedValues(data.get("attachmentIds")),
          },
          "PATCH",
        );
      }}
    >
      <label>{locale === "zh" ? "付款条款" : "Payment terms"}<input defaultValue={purchaseOrder.paymentTerms ?? ""} name="paymentTerms" /></label>
      <label>{locale === "zh" ? "运输条款" : "Shipping terms"}<input defaultValue={purchaseOrder.shippingTerms ?? ""} name="shippingTerms" /></label>
      <label>{locale === "zh" ? "贸易术语" : "Incoterm"}<input defaultValue={purchaseOrder.incoterm ?? ""} name="incoterm" /></label>
      <label>{locale === "zh" ? "预计到货" : "Expected receipt"}<input defaultValue={purchaseOrder.expectedAt ? new Date(purchaseOrder.expectedAt).toISOString().slice(0, 10) : ""} name="expectedAt" type="date" /></label>
      <label>{locale === "zh" ? "附件资产 ID（逗号分隔）" : "Attachment asset IDs (comma separated)"}<input defaultValue={attachmentIds.join(", ")} name="attachmentIds" /></label>
      <label>{locale === "zh" ? "备注" : "Notes"}<textarea defaultValue={purchaseOrder.notes ?? ""} name="notes" /></label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}

export function ShipmentUpdateForm({
  locale,
  shipment,
}: {
  locale: Locale;
  shipment: {
    id: string;
    version: number;
    carrier: string | null;
    trackingNumber: string | null;
    incoterm: string | null;
    origin: string | null;
    destination: string | null;
    originPort: string | null;
    destinationPort: string | null;
    estimatedDepartureAt: Date | string | null;
    estimatedArrivalAt: Date | string | null;
    documents: Array<{ fileAssetId: string }>;
  };
}) {
  const mutation = useMutation(locale);
  const fields = [
    ["carrier", locale === "zh" ? "承运商" : "Carrier", shipment.carrier],
    ["trackingNumber", locale === "zh" ? "运单号" : "Tracking number", shipment.trackingNumber],
    ["incoterm", locale === "zh" ? "贸易术语" : "Incoterm", shipment.incoterm],
    ["origin", locale === "zh" ? "起运地" : "Origin", shipment.origin],
    ["destination", locale === "zh" ? "目的地" : "Destination", shipment.destination],
    ["originPort", locale === "zh" ? "起运港" : "Origin port", shipment.originPort],
    ["destinationPort", locale === "zh" ? "目的港" : "Destination port", shipment.destinationPort],
  ] as const;
  return (
    <form
      className="crm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await mutation.submit(
          `/api/shipments/${shipment.id}`,
          {
            expectedVersion: shipment.version,
            carrier: data.get("carrier") || null,
            trackingNumber: data.get("trackingNumber") || null,
            incoterm: data.get("incoterm") || null,
            origin: data.get("origin") || null,
            destination: data.get("destination") || null,
            originPort: data.get("originPort") || null,
            destinationPort: data.get("destinationPort") || null,
            estimatedDepartureAt: data.get("estimatedDepartureAt") || null,
            estimatedArrivalAt: data.get("estimatedArrivalAt") || null,
            documentIds: commaSeparatedValues(data.get("documentIds")),
          },
          "PATCH",
        );
      }}
    >
      {fields.map(([name, label, value]) => (
        <label key={name}>{label}<input defaultValue={value ?? ""} name={name} /></label>
      ))}
      <label>{locale === "zh" ? "预计发运" : "Estimated departure"}<input defaultValue={shipment.estimatedDepartureAt ? new Date(shipment.estimatedDepartureAt).toISOString().slice(0, 10) : ""} name="estimatedDepartureAt" type="date" /></label>
      <label>{locale === "zh" ? "预计到达" : "Estimated arrival"}<input defaultValue={shipment.estimatedArrivalAt ? new Date(shipment.estimatedArrivalAt).toISOString().slice(0, 10) : ""} name="estimatedArrivalAt" type="date" /></label>
      <label>{locale === "zh" ? "单证资产 ID（逗号分隔）" : "Document asset IDs (comma separated)"}<input defaultValue={shipment.documents.map((document) => document.fileAssetId).join(", ")} name="documentIds" /></label>
      <Feedback locale={locale} {...mutation} />
    </form>
  );
}
