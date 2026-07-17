import { z } from "zod";

import { DomainError } from "@/lib/errors";

const requiredHeaders = [
  "companyName",
  "contactName",
  "email",
  "phone",
  "countryCode",
  "source",
] as const;

const leadRowSchema = z.object({
  companyName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
  email: z.union([z.literal(""), z.email()]).transform((value) => value || null),
  phone: z.string().trim().transform((value) => value || null),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  source: z.string().trim().min(1),
});

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted && character === '"' && csv[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export type LeadImportRow = z.infer<typeof leadRowSchema>;

export function previewLeadCsv(csv: string) {
  const [headers, ...rows] = parseCsvRows(csv.replace(/^\uFEFF/, ""));
  if (
    !headers ||
    requiredHeaders.some((header) => !headers.includes(header))
  ) {
    throw new DomainError(
      "CSV_HEADERS_INVALID",
      `CSV headers must include ${requiredHeaders.join(", ")}`,
    );
  }

  const validRows: LeadImportRow[] = [];
  const errors: Array<{ row: number; issues: string[] }> = [];
  for (const [rowIndex, values] of rows.entries()) {
    const record = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    const parsed = leadRowSchema.safeParse(record);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      errors.push({
        row: rowIndex + 2,
        issues: [
          ...new Set(
            parsed.error.issues.map((issue) => issue.path.join(".")),
          ),
        ],
      });
    }
  }
  return { validRows, errors, totalRows: rows.length };
}

export interface ExportLeadRow {
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  countryCode: string;
  source: string;
  status: string;
  ownerName: string;
  createdAt: Date;
}

function csvCell(value: string) {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

export function exportLeadCsv(rows: readonly ExportLeadRow[]) {
  const headers = [
    ...requiredHeaders,
    "status",
    "ownerName",
    "createdAt",
  ];
  return [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.companyName,
        row.contactName,
        row.email ?? "",
        row.phone ?? "",
        row.countryCode,
        row.source,
        row.status,
        row.ownerName,
        row.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");
}
