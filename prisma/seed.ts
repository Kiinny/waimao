import { PrismaPg } from "@prisma/adapter-pg";
import Decimal from "decimal.js";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { resolveSeedPassword } from "./seed-password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const permissions = [
  "dashboard.read",
  "user.read",
  "user.create",
  "user.update",
  "role.read",
  "role.create",
  "role.update",
  "customer.read",
  "customer.create",
  "customer.update",
  "customer.delete",
  "lead.read",
  "lead.create",
  "lead.update",
  "follow_up.read",
  "follow_up.create",
  "follow_up.update",
  "opportunity.read",
  "opportunity.create",
  "opportunity.update",
  "product.read",
  "product.create",
  "product.update",
  "quote.read",
  "quote.create",
  "quote.update",
  "quote.approve",
  "order.read",
  "order.create",
  "order.update",
  "payment.read",
  "payment.create",
  "payment.verify",
  "refund.create",
  "finance.profit.read",
  "supplier.read",
  "supplier.create",
  "supplier.update",
  "supplier.bank.read",
  "purchase.read",
  "purchase.create",
  "purchase.update",
  "purchase.cost.read",
  "inventory.read",
  "inventory.update",
  "quality.read",
  "quality.update",
  "shipment.read",
  "shipment.update",
  "after_sales.read",
  "after_sales.create",
  "after_sales.update",
  "task.read",
  "task.create",
  "task.update",
  "report.read",
  "report.sales.read",
  "report.collections.read",
  "report.receivables.read",
  "report.customers.read",
  "report.markets.read",
  "report.products.read",
  "report.representatives.read",
  "report.suppliers.read",
  "report.purchasing.read",
  "report.logistics.read",
  "report.after-sales.read",
  "report.profit.read",
  "report.conversion.read",
  "settings.read",
  "settings.update",
  "audit.read",
] as const;

const roleDefinitions = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Complete system access",
    permissions: ["*"],
  },
  {
    code: "SALES_MANAGER",
    name: "Sales Manager",
    description: "Sales team and commercial workflow management",
    permissions: permissions.filter(
      (code) =>
        /^(dashboard|customer|lead|follow_up|opportunity|product|quote|order|task)\./.test(
          code,
        ) ||
        [
          "report.read",
          "report.sales.read",
          "report.collections.read",
          "report.receivables.read",
          "report.customers.read",
          "report.markets.read",
          "report.products.read",
          "report.representatives.read",
          "report.conversion.read",
        ].includes(code),
    ),
  },
  {
    code: "SALES_REP",
    name: "Sales Representative",
    description: "Owned sales accounts and transactions",
    permissions: permissions.filter(
      (code) =>
        /^(dashboard|customer|lead|follow_up|opportunity|product|quote|order|task)\./.test(
          code,
        ) && !code.endsWith(".delete") ||
        [
          "report.read",
          "report.sales.read",
          "report.collections.read",
          "report.receivables.read",
          "report.customers.read",
          "report.markets.read",
          "report.products.read",
          "report.representatives.read",
        ].includes(code),
    ),
  },
  {
    code: "FINANCE",
    name: "Finance",
    description: "Payments, refunds, costs and financial reporting",
    permissions: permissions.filter(
      (code) =>
        code === "order.read" ||
        ["dashboard.", "payment.", "refund.", "finance.", "purchase.cost."].some(
          (prefix) => code.startsWith(prefix),
        ) ||
        [
          "report.read",
          "report.sales.read",
          "report.collections.read",
          "report.receivables.read",
          "report.customers.read",
          "report.markets.read",
          "report.products.read",
          "report.representatives.read",
          "report.profit.read",
        ].includes(code),
    ),
  },
  {
    code: "PROCUREMENT",
    name: "Procurement",
    description: "Suppliers and purchasing",
    permissions: permissions.filter(
      (code) =>
        ["product.read", "order.read", "inventory.read"].includes(code) ||
        ["dashboard.", "supplier.", "purchase.", "task."].some((prefix) =>
          code.startsWith(prefix),
        ) ||
        [
          "report.read",
          "report.products.read",
          "report.suppliers.read",
          "report.purchasing.read",
        ].includes(code),
    ),
  },
  {
    code: "OPERATIONS",
    name: "Operations",
    description: "Warehouse, quality, shipments and after-sales",
    permissions: permissions.filter(
      (code) =>
        ["product.read", "order.read"].includes(code) ||
        [
          "dashboard.",
          "inventory.",
          "quality.",
          "shipment.",
          "after_sales.",
          "task.",
        ].some((prefix) => code.startsWith(prefix)) ||
        ["report.read", "report.logistics.read", "report.after-sales.read"].includes(code),
    ),
  },
] as const;

const users = [
  ["admin@atlascrm.dev", "Ada Admin", "SUPER_ADMIN"],
  ["sales.manager@atlascrm.dev", "Marcus Chen", "SALES_MANAGER"],
  ["sales.asia@atlascrm.dev", "Lina Wu", "SALES_REP"],
  ["sales.emea@atlascrm.dev", "Oliver Grant", "SALES_REP"],
  ["finance@atlascrm.dev", "Sofia Patel", "FINANCE"],
  ["procurement@atlascrm.dev", "Noah Zhang", "PROCUREMENT"],
  ["warehouse@atlascrm.dev", "Mia Liu", "OPERATIONS"],
  ["logistics@atlascrm.dev", "Ethan Brooks", "OPERATIONS"],
  ["support@atlascrm.dev", "Grace Kim", "OPERATIONS"],
] as const;

function deterministicId(group: number, index: number) {
  return `00000000-0000-4000-8${group.toString(16).padStart(3, "0")}-${index
    .toString(16)
    .padStart(12, "0")}`;
}

async function main() {
  const passwordHash = await hashPassword(resolveSeedPassword(process.env));

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: code },
      create: {
        code,
        name: code,
      },
    });
  }

  await prisma.permission.upsert({
    where: { code: "*" },
    update: { name: "All permissions" },
    create: {
      code: "*",
      name: "All permissions",
    },
  });

  const permissionRows = await prisma.permission.findMany();
  const permissionIds = new Map(
    permissionRows.map((permission) => [permission.code, permission.id]),
  );

  for (const [index, definition] of roleDefinitions.entries()) {
    const role = await prisma.role.upsert({
      where: { code: definition.code },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
        deletedAt: null,
      },
      create: {
        id: deterministicId(2, index + 1),
        code: definition.code,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: definition.permissions.map((code) => ({
        roleId: role.id,
        permissionId: permissionIds.get(code)!,
      })),
    });
  }

  const roleRows = await prisma.role.findMany();
  const roleIds = new Map(roleRows.map((role) => [role.code, role.id]));

  for (const [index, [email, name, roleCode]] of users.entries()) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        id: deterministicId(3, index + 1),
        email,
        name,
        passwordHash,
        status: "ACTIVE",
      },
    });
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: roleIds.get(roleCode)! },
    });
  }

  for (const [code, name, symbol, isBase] of [
    ["USD", "US Dollar", "$", true],
    ["CNY", "Chinese Yuan", "¥", false],
    ["EUR", "Euro", "€", false],
    ["GBP", "British Pound", "£", false],
  ] as const) {
    await prisma.currency.upsert({
      where: { code },
      update: { name, symbol, isBase, isActive: true },
      create: { code, name, symbol, isBase },
    });
  }

  await prisma.setting.upsert({
    where: { namespace_key: { namespace: "company", key: "profile" } },
    update: {
      value: {
        name: "Atlas Global Systems",
        legalName: "Atlas Global Systems Limited",
        registrationNumber: "HK-ATLAS-2026",
        address: "Shenzhen / Hong Kong",
        logoUrl: "https://atlascrm.dev/assets/logo.svg",
        defaultLocale: "en",
        baseCurrency: "USD",
      },
    },
    create: {
      id: deterministicId(4, 1),
      namespace: "company",
      key: "profile",
      value: {
        name: "Atlas Global Systems",
        legalName: "Atlas Global Systems Limited",
        registrationNumber: "HK-ATLAS-2026",
        address: "Shenzhen / Hong Kong",
        logoUrl: "https://atlascrm.dev/assets/logo.svg",
        defaultLocale: "en",
        baseCurrency: "USD",
      },
    },
  });

  const practicalSettings = [
    ["currency", "CNY", { rateToUsd: 0.139, effectiveAt: "2026-07-20T00:00:00.000Z" }],
    ["currency", "EUR", { rateToUsd: 1.16, effectiveAt: "2026-07-20T00:00:00.000Z" }],
    ["currency", "GBP", { rateToUsd: 1.34, effectiveAt: "2026-07-20T00:00:00.000Z" }],
    ["tax", "defaults", { exportRatePercent: 0, domesticRatePercent: 13 }],
    ["bank", "usd-primary", { bankName: "Atlas Trade Bank", accountName: "Atlas Global Systems Limited", bankAccountNumber: "001234567890", swift: "ATLSHKHH" }],
    ["template", "quote", { title: "Atlas Quotation", footer: "Thank you for your business.", validityDays: 14 }],
    ["catalog", "payment-terms", { values: ["100% T/T Before Purchase", "50% Deposit / 50% Before Shipment", "Net 30"] }],
    ["catalog", "incoterms", { values: ["EXW", "FOB", "CIF", "DAP", "DDP"] }],
    ["catalog", "statuses", { values: ["ACTIVE", "INACTIVE", "ARCHIVED"] }],
    ["catalog", "categories", { values: ["Server", "GPU", "Storage", "Networking", "Parts"] }],
    ["catalog", "sources", { values: ["REFERRAL", "WEB", "TRADE_SHOW", "OUTBOUND", "PARTNER"] }],
    ["backup", "policy", { schedule: "0 2 * * *", retentionDays: 30 }],
  ] as const;
  for (const [namespace, key, value] of practicalSettings) {
    await prisma.setting.upsert({
      where: { namespace_key: { namespace, key } },
      update: { value },
      create: { namespace, key, value, isSecret: namespace === "bank" },
    });
  }

  for (const [index, key] of [
    "quote",
    "sales_order",
    "purchase_order",
    "shipment",
    "ticket",
  ].entries()) {
    await prisma.sequence.upsert({
      where: { key },
      update: {},
      create: {
        id: deterministicId(5, index + 1),
        key,
        prefix: key.toUpperCase().replaceAll("_", "-"),
      },
    });
  }

  const salesOwnerIds = [deterministicId(3, 3), deterministicId(3, 4)];
  const countries = ["US", "DE", "GB", "FR", "AE", "SG", "JP", "AU", "CA", "NL"];
  const companyRoots = [
    "Northstar Systems",
    "Helios Compute",
    "Vertex Datacenter",
    "BluePeak Networks",
    "Orion Research",
    "Summit Cloud",
    "NovaGrid",
    "Cobalt Infrastructure",
    "Apex Analytics",
    "Meridian Hosting",
    "Quantum Harbor",
    "Redwood AI",
    "IronGate Servers",
    "PolarStack",
    "Silverline Labs",
    "Atlas Edge",
    "Nimbus Robotics",
    "Keystone Digital",
    "Lighthouse HPC",
    "Evergreen Compute",
  ];

  for (let index = 0; index < 20; index += 1) {
    const customerId = deterministicId(10, index + 1);
    await prisma.customer.upsert({
      where: { id: customerId },
      update: {
        companyName: companyRoots[index],
        countryCode: countries[index % countries.length],
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        status: "ACTIVE",
        level: index % 5 === 0 ? "STRATEGIC" : index % 3 === 0 ? "KEY" : "STANDARD",
        riskRating: index % 9 === 0 ? "HIGH" : index % 4 === 0 ? "MEDIUM" : "LOW",
        deletedAt: null,
      },
      create: {
        id: customerId,
        companyName: companyRoots[index],
        legalName: `${companyRoots[index]} Ltd.`,
        countryCode: countries[index % countries.length],
        website: `https://customer-${index + 1}.example`,
        email: `procurement${index + 1}@example.test`,
        phone: `+1-555-${(1000 + index).toString()}`,
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        level: index % 5 === 0 ? "STRATEGIC" : index % 3 === 0 ? "KEY" : "STANDARD",
        riskRating: index % 9 === 0 ? "HIGH" : index % 4 === 0 ? "MEDIUM" : "LOW",
        riskNotes: index % 9 === 0 ? "Credit review required before new commercial terms." : null,
      },
    });
  }

  for (let index = 0; index < 30; index += 1) {
    const customerIndex = index % 20;
    const contactId = deterministicId(11, index + 1);
    await prisma.contact.upsert({
      where: { id: contactId },
      update: {
        customerId: deterministicId(10, customerIndex + 1),
        firstName: ["Maya", "Oliver", "Amina", "Kenji", "Sofia"][index % 5],
        lastName: `Buyer ${index + 1}`,
        isPrimary: index < 20,
        deletedAt: null,
      },
      create: {
        id: contactId,
        customerId: deterministicId(10, customerIndex + 1),
        firstName: ["Maya", "Oliver", "Amina", "Kenji", "Sofia"][index % 5],
        lastName: `Buyer ${index + 1}`,
        title: index % 3 === 0 ? "IT Director" : "Procurement Manager",
        email: `contact${index + 1}@example.test`,
        phone: `+44-20-${(7000 + index).toString()}`,
        whatsapp: index % 2 === 0 ? `+44-20-${(7000 + index).toString()}` : null,
        preferredChannel: index % 2 === 0 ? "WHATSAPP" : "EMAIL",
        isPrimary: index < 20,
        language: index % 4 === 0 ? "zh" : "en",
        timezone: ["America/New_York", "Europe/Berlin", "Asia/Singapore"][index % 3],
        decisionRole: index < 20 ? "DECISION_MAKER" : "TECHNICAL",
      },
    });
  }

  const leadSources = ["Referral", "Trade Show", "Website", "Partner", "Outbound"];
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "LOST"] as const;
  for (let index = 0; index < 40; index += 1) {
    const leadId = deterministicId(12, index + 1);
    await prisma.lead.upsert({
      where: { id: leadId },
      update: {
        companyName: `Prospect ${String(index + 1).padStart(2, "0")} Technologies`,
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        status: leadStatuses[index % leadStatuses.length],
        deletedAt: null,
      },
      create: {
        id: leadId,
        companyName: `Prospect ${String(index + 1).padStart(2, "0")} Technologies`,
        contactName: `Lead Contact ${index + 1}`,
        email: `lead${index + 1}@prospect.example`,
        phone: `+86-21-${(8000 + index).toString()}`,
        countryCode: countries[index % countries.length],
        source: leadSources[index % leadSources.length],
        status: leadStatuses[index % leadStatuses.length],
        notes: index % 4 === 0 ? "Interested in refurbished GPU server availability." : "Evaluating AI server configurations.",
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        createdAt: new Date(Date.UTC(2026, 5, (index % 28) + 1)),
      },
    });
  }

  const stages = ["QUALIFICATION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
  for (let index = 0; index < 20; index += 1) {
    const opportunityId = deterministicId(13, index + 1);
    const stage = stages[index % stages.length];
    const value = String(25_000 + index * 7_500);
    await prisma.opportunity.upsert({
      where: { id: opportunityId },
      update: {
        stage,
        value,
        valueUsd: value,
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        lostReason: stage === "LOST" ? "Project funding deferred" : null,
        wonAt: stage === "WON" ? new Date(Date.UTC(2026, 6, 1)) : null,
        lostAt: stage === "LOST" ? new Date(Date.UTC(2026, 6, 2)) : null,
        deletedAt: null,
      },
      create: {
        id: opportunityId,
        customerId: deterministicId(10, index + 1),
        name: `${companyRoots[index]} GPU infrastructure`,
        stage,
        value,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        valueUsd: value,
        probability: stage === "WON" ? 100 : stage === "LOST" ? 0 : 10 + (index % 4) * 20,
        expectedCloseAt: new Date(Date.UTC(2026, 7 + (index % 4), 15)),
        lostReason: stage === "LOST" ? "Project funding deferred" : null,
        wonAt: stage === "WON" ? new Date(Date.UTC(2026, 6, 1)) : null,
        lostAt: stage === "LOST" ? new Date(Date.UTC(2026, 6, 2)) : null,
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        createdAt: new Date(Date.UTC(2026, 4 + (index % 3), (index % 28) + 1)),
      },
    });
  }

  for (let index = 0; index < 24; index += 1) {
    const followUpId = deterministicId(14, index + 1);
    const relatedToLead = index < 12;
    const occurredAt = new Date(Date.UTC(2026, 6, (index % 16) + 1, 9));
    const nextActionAt = new Date(Date.UTC(2026, 6, 18 + (index % 10), 9));
    await prisma.followUp.upsert({
      where: { id: followUpId },
      update: {
        summary: relatedToLead
          ? "Confirmed requirements and qualification criteria."
          : "Reviewed configuration, commercial terms, and next decision.",
        nextActionAt,
        deletedAt: null,
      },
      create: {
        id: followUpId,
        leadId: relatedToLead ? deterministicId(12, index + 1) : null,
        opportunityId: relatedToLead ? null : deterministicId(13, index - 11),
        customerId: relatedToLead ? null : deterministicId(10, index - 11),
        type: index % 3 === 0 ? "MEETING" : "CALL",
        channel: index % 3 === 0 ? "VIDEO" : "PHONE",
        summary: relatedToLead
          ? "Confirmed requirements and qualification criteria."
          : "Reviewed configuration, commercial terms, and next decision.",
        outcome: index % 4 === 0 ? "Technical review scheduled" : "Positive response",
        nextAction: "Send the agreed configuration and confirm next meeting.",
        occurredAt,
        nextActionAt,
        createdById: salesOwnerIds[index % salesOwnerIds.length],
      },
    });
  }

  const categories = [
    ["ai-server", "AI Server"],
    ["gpu-server", "GPU Server"],
    ["refurbished-server", "Refurbished Server"],
    ["server-component", "Server Component"],
  ] as const;
  for (const [index, [slug, name]] of categories.entries()) {
    await prisma.productCategory.upsert({
      where: { slug },
      update: { name, deletedAt: null },
      create: {
        id: deterministicId(19, index + 1),
        slug,
        name,
      },
    });
  }

  const productNames = [
    "Dell PowerEdge R760xa",
    "Dell PowerEdge R750",
    "HPE ProLiant DL380 Gen11",
    "HPE Apollo 6500 Gen10 Plus",
    "Lenovo ThinkSystem SR675 V3",
    "Supermicro AS-8125GS-TNHR",
    "Supermicro SYS-421GE-TNRT",
    "Inspur NF5488A5",
    "Huawei FusionServer Pro 2288H V5",
    "NVIDIA DGX H100",
    "NVIDIA HGX H200 Platform",
    "Dell PowerEdge XE9680",
    "HPE ProLiant DL360 Gen10",
    "Lenovo ThinkSystem SR650 V2",
    "Cisco UCS C240 M6",
    "NVIDIA L40S 48GB",
    "NVIDIA H100 80GB",
    "NVIDIA A100 80GB",
    "Samsung 3.84TB NVMe SSD",
    "Micron 64GB DDR5 RDIMM",
  ];
  for (let index = 0; index < 20; index += 1) {
    const productId = deterministicId(20, index + 1);
    const variantId = deterministicId(21, index + 1);
    const isComponent = index >= 15;
    const condition = index % 5 === 0 ? "REFURBISHED" : "NEW";
    await prisma.product.upsert({
      where: { id: productId },
      update: {
        sku: `ATL-${String(index + 1).padStart(3, "0")}`,
        name: productNames[index],
        categoryId: deterministicId(19, isComponent ? 4 : (index % 3) + 1),
        condition,
        baseModel: productNames[index],
        specifications: isComponent
          ? { interface: index < 18 ? "PCIe" : "Server component" }
          : { cpu: "2 x Intel Xeon", memory: "512GB", gpuSlots: 4 },
        referencePrice: String(5_000 + index * 2_500),
        referenceCurrencyCode: "USD",
        dimensions: isComponent
          ? { lengthCm: 30, widthCm: 12, heightCm: 5 }
          : { lengthCm: 110, widthCm: 48.2, heightCm: 8.7 },
        hsCode: isComponent ? "847330" : "847150",
        exportControlRisk: index === 9 || index === 16 ? "REVIEW_REQUIRED" : "LOW",
        media: [
          {
            kind: "IMAGE",
            objectKey: `products/atl-${String(index + 1).padStart(3, "0")}/front.jpg`,
          },
        ],
        availability: index % 4 === 0 ? "LIMITED" : "IN_STOCK",
        deletedAt: null,
      },
      create: {
        id: productId,
        sku: `ATL-${String(index + 1).padStart(3, "0")}`,
        name: productNames[index],
        description: `${productNames[index]} export configuration`,
        categoryId: deterministicId(19, isComponent ? 4 : (index % 3) + 1),
        brand: productNames[index].split(" ")[0],
        model: productNames[index],
        condition,
        baseModel: productNames[index],
        specifications: isComponent
          ? { interface: index < 18 ? "PCIe" : "Server component" }
          : { cpu: "2 x Intel Xeon", memory: "512GB", gpuSlots: 4 },
        referencePrice: String(5_000 + index * 2_500),
        referenceCurrencyCode: "USD",
        dimensions: isComponent
          ? { lengthCm: 30, widthCm: 12, heightCm: 5 }
          : { lengthCm: 110, widthCm: 48.2, heightCm: 8.7 },
        hsCode: isComponent ? "847330" : "847150",
        exportControlRisk: index === 9 || index === 16 ? "REVIEW_REQUIRED" : "LOW",
        media: [
          {
            kind: "IMAGE",
            objectKey: `products/atl-${String(index + 1).padStart(3, "0")}/front.jpg`,
          },
        ],
        availability: index % 4 === 0 ? "LIMITED" : "IN_STOCK",
        serialized: true,
      },
    });
    await prisma.productVariant.upsert({
      where: { id: variantId },
      update: {
        productId,
        sku: `ATL-${String(index + 1).padStart(3, "0")}-V1`,
        name: isComponent ? "Standard" : "Export configuration",
        configurationVersion: 1,
        configuration: isComponent
          ? { grade: condition }
          : { gpu: `${(index % 4) + 1} accelerator(s)`, ram: "512GB" },
        specifications: { warrantyMonths: condition === "REFURBISHED" ? 6 : 12 },
        cost: String(3_500 + index * 1_700),
        currencyCode: "USD",
        deletedAt: null,
      },
      create: {
        id: variantId,
        productId,
        sku: `ATL-${String(index + 1).padStart(3, "0")}-V1`,
        name: isComponent ? "Standard" : "Export configuration",
        configurationVersion: 1,
        configuration: isComponent
          ? { grade: condition }
          : { gpu: `${(index % 4) + 1} accelerator(s)`, ram: "512GB" },
        specifications: { warrantyMonths: condition === "REFURBISHED" ? 6 : 12 },
        cost: String(3_500 + index * 1_700),
        currencyCode: "USD",
      },
    });
  }

  const quoteStatuses = [
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "CONVERTED",
    "ACCEPTED",
    "SENT",
    "VIEWED",
    "APPROVED",
    "DRAFT",
  ] as const;
  for (let index = 0; index < 15; index += 1) {
    const quoteId = deterministicId(30, index + 1);
    const versionId = deterministicId(31, index + 1);
    const itemId = deterministicId(32, index + 1);
    const productIndex = index % 20;
    const total = String(25_000 + index * 4_000);
    const estimatedCost = String(17_000 + index * 2_500);
    const estimatedProfit = String(
      Number(total) - Number(estimatedCost),
    );
    const status = quoteStatuses[index];
    const immutable = ["SENT", "VIEWED", "ACCEPTED", "CONVERTED"].includes(
      status,
    );
    await prisma.quote.upsert({
      where: { id: quoteId },
      update: {
        customerId: deterministicId(10, index + 1),
        opportunityId: deterministicId(13, index + 1),
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        status,
        currentVersion: 1,
        validUntil: new Date(Date.UTC(2026, 8, index + 1)),
        approvedById: status === "DRAFT" ? null : deterministicId(3, 2),
        approvedAt:
          status === "DRAFT" ? null : new Date(Date.UTC(2026, 6, 5)),
        approvalNote: status === "DRAFT" ? null : "Commercial terms approved.",
        deletedAt: null,
      },
      create: {
        id: quoteId,
        quoteNumber: `QUOTE-${String(index + 1).padStart(6, "0")}`,
        customerId: deterministicId(10, index + 1),
        opportunityId: deterministicId(13, index + 1),
        ownerId: salesOwnerIds[index % salesOwnerIds.length],
        status,
        currentVersion: 1,
        validUntil: new Date(Date.UTC(2026, 8, index + 1)),
        approvedById: status === "DRAFT" ? null : deterministicId(3, 2),
        approvedAt:
          status === "DRAFT" ? null : new Date(Date.UTC(2026, 6, 5)),
        approvalNote: status === "DRAFT" ? null : "Commercial terms approved.",
      },
    });
    await prisma.quoteVersion.upsert({
      where: { id: versionId },
      update: {
        quoteId,
        number: 1,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        subtotal: total,
        shipping: "0",
        insurance: "0",
        tax: "0",
        bankFees: "0",
        total,
        totalUsd: total,
        estimatedCostUsd: estimatedCost,
        estimatedProfitUsd: estimatedProfit,
        estimatedMarginPercent: new Decimal(estimatedProfit)
          .div(total)
          .times(100)
          .toFixed(4),
        incoterm: "CIF",
        paymentTerms: "100% T/T Before Purchase",
        deliveryTerms: "30 days after confirmed payment",
        warrantyTerms: "12 months",
        remarks: "Export subject to final compliance review.",
        immutableAt: immutable
          ? new Date(Date.UTC(2026, 6, 6 + index))
          : null,
      },
      create: {
        id: versionId,
        quoteId,
        number: 1,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        subtotal: total,
        total,
        totalUsd: total,
        estimatedCostUsd: estimatedCost,
        estimatedProfitUsd: estimatedProfit,
        estimatedMarginPercent: new Decimal(estimatedProfit)
          .div(total)
          .times(100)
          .toFixed(4),
        incoterm: "CIF",
        paymentTerms: "100% T/T Before Purchase",
        deliveryTerms: "30 days after confirmed payment",
        warrantyTerms: "12 months",
        remarks: "Export subject to final compliance review.",
        immutableAt: immutable
          ? new Date(Date.UTC(2026, 6, 6 + index))
          : null,
      },
    });
    await prisma.quoteItem.upsert({
      where: { id: itemId },
      update: {
        quoteVersionId: versionId,
        productId: deterministicId(20, productIndex + 1),
        description: productNames[productIndex],
        configuration: {
          variantId: deterministicId(21, productIndex + 1),
          configurationVersion: 1,
          sku: `ATL-${String(productIndex + 1).padStart(3, "0")}-V1`,
        },
        quantity: 1,
        unitPrice: total,
        discount: "0",
        lineTotal: total,
        estimatedCostUsd: estimatedCost,
      },
      create: {
        id: itemId,
        quoteVersionId: versionId,
        productId: deterministicId(20, productIndex + 1),
        description: productNames[productIndex],
        configuration: {
          variantId: deterministicId(21, productIndex + 1),
          configurationVersion: 1,
          sku: `ATL-${String(productIndex + 1).padStart(3, "0")}-V1`,
        },
        quantity: 1,
        unitPrice: total,
        lineTotal: total,
        estimatedCostUsd: estimatedCost,
      },
    });

    if (index < 10) {
      const orderId = deterministicId(33, index + 1);
      const orderItemId = deterministicId(34, index + 1);
      const paymentId = deterministicId(35, index + 1);
      const paidAmount =
        index < 6 ? total : index < 8 ? String(Number(total) / 2) : total;
      const paymentStatus =
        index < 8 ? "CONFIRMED" : "PENDING";
      await prisma.salesOrder.upsert({
        where: { id: orderId },
        update: {
          customerId: deterministicId(10, index + 1),
          quoteId,
          acceptedQuoteVersionId: versionId,
          ownerId: salesOwnerIds[index % salesOwnerIds.length],
          status: index < 2 ? "PURCHASING" : "CONFIRMED",
          currencyCode: "USD",
          exchangeRateToUsd: "1",
          total,
          totalUsd: total,
          paymentTerms: "100% T/T Before Purchase",
          paymentStatus:
            index < 6 ? "PAID" : index < 8 ? "PARTIALLY_PAID" : "UNPAID",
          purchaseStatus: index < 2 ? "PURCHASING" : "NOT_STARTED",
          purchaseEligibilityFlag: index < 6,
          revenueUsd: total,
          estimatedCostUsd: estimatedCost,
          actualCostUsd: index < 2 ? estimatedCost : "0",
          grossProfitUsd: estimatedProfit,
          grossMarginPercent: new Decimal(estimatedProfit)
            .div(total)
            .times(100)
            .toFixed(4),
          netProfitEstimateUsd: estimatedProfit,
          deletedAt: null,
        },
        create: {
          id: orderId,
          orderNumber: `SALES-ORDER-${String(index + 1).padStart(6, "0")}`,
          customerId: deterministicId(10, index + 1),
          quoteId,
          acceptedQuoteVersionId: versionId,
          ownerId: salesOwnerIds[index % salesOwnerIds.length],
          status: index < 2 ? "PURCHASING" : "CONFIRMED",
          currencyCode: "USD",
          exchangeRateToUsd: "1",
          total,
          totalUsd: total,
          paymentTerms: "100% T/T Before Purchase",
          paymentStatus:
            index < 6 ? "PAID" : index < 8 ? "PARTIALLY_PAID" : "UNPAID",
          purchaseStatus: index < 2 ? "PURCHASING" : "NOT_STARTED",
          purchaseEligibilityFlag: index < 6,
          revenueUsd: total,
          estimatedCostUsd: estimatedCost,
          actualCostUsd: index < 2 ? estimatedCost : "0",
          grossProfitUsd: estimatedProfit,
          grossMarginPercent: new Decimal(estimatedProfit)
            .div(total)
            .times(100)
            .toFixed(4),
          netProfitEstimateUsd: estimatedProfit,
        },
      });
      await prisma.salesOrderItem.upsert({
        where: { id: orderItemId },
        update: {
          salesOrderId: orderId,
          productId: deterministicId(20, productIndex + 1),
          description: productNames[productIndex],
          configuration: {
            quoteVersionId: versionId,
            variantId: deterministicId(21, productIndex + 1),
          },
          quantity: 1,
          unitPrice: total,
          lineTotal: total,
        },
        create: {
          id: orderItemId,
          salesOrderId: orderId,
          productId: deterministicId(20, productIndex + 1),
          description: productNames[productIndex],
          configuration: {
            quoteVersionId: versionId,
            variantId: deterministicId(21, productIndex + 1),
          },
          quantity: 1,
          unitPrice: total,
          lineTotal: total,
        },
      });
      await prisma.payment.upsert({
        where: { id: paymentId },
        update: {
          salesOrderId: orderId,
          reference: `TT-${String(index + 1).padStart(4, "0")}`,
          status: paymentStatus,
          amount: paidAmount,
          currencyCode: "USD",
          exchangeRateToUsd: "1",
          amountUsd: paidAmount,
          proofMetadata: {
            fileName: `tt-${index + 1}.pdf`,
            objectKey: `payments/${paymentId}/proof.pdf`,
          },
          verifiedById:
            paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
          verifiedAt:
            paymentStatus === "CONFIRMED"
              ? new Date(Date.UTC(2026, 6, 10 + index))
              : null,
          receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
          deletedAt: null,
        },
        create: {
          id: paymentId,
          salesOrderId: orderId,
          reference: `TT-${String(index + 1).padStart(4, "0")}`,
          status: paymentStatus,
          amount: paidAmount,
          currencyCode: "USD",
          exchangeRateToUsd: "1",
          amountUsd: paidAmount,
          proofMetadata: {
            fileName: `tt-${index + 1}.pdf`,
            objectKey: `payments/${paymentId}/proof.pdf`,
          },
          verifiedById:
            paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
          verifiedAt:
            paymentStatus === "CONFIRMED"
              ? new Date(Date.UTC(2026, 6, 10 + index))
              : null,
          receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
        },
      });
    }
  }

  const supplierNames = ["Shenzhen Compute Supply", "NVIDIA Channel HK", "Pacific Server Parts", "EuroRack Renewed", "Vertex Logistics Hardware"];
  for (let index = 0; index < supplierNames.length; index += 1) {
    const supplierId = deterministicId(40, index + 1);
    await prisma.supplier.upsert({
      where: { id: supplierId },
      update: { name: supplierNames[index], status: "ACTIVE", deletedAt: null },
      create: { id: supplierId, code: `SUP-${String(index + 1).padStart(3, "0")}`, name: supplierNames[index], countryCode: index < 3 ? "CN" : index === 3 ? "DE" : "SG", contactName: `Supplier Contact ${index + 1}`, email: `sales${index + 1}@supplier.example`, phone: `+86-755-${(5000 + index).toString()}` },
    });
    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId,
          productId: deterministicId(20, index + 1),
        },
      },
      update: {
        supplierSku: `SUP-${index + 1}-ATL-${String(index + 1).padStart(3, "0")}`,
        leadTimeDays: 5 + index * 2,
        lastCost: String(3500 + index * 1700),
        currencyCode: "USD",
      },
      create: {
        supplierId,
        productId: deterministicId(20, index + 1),
        supplierSku: `SUP-${index + 1}-ATL-${String(index + 1).padStart(3, "0")}`,
        leadTimeDays: 5 + index * 2,
        lastCost: String(3500 + index * 1700),
        currencyCode: "USD",
      },
    });
  }
  const warehouse = await prisma.warehouse.upsert({ where: { code: "SZ-01" }, update: { name: "Shenzhen Export Warehouse", deletedAt: null }, create: { id: deterministicId(41, 1), code: "SZ-01", name: "Shenzhen Export Warehouse" } });
  const location = await prisma.warehouseLocation.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: "A-01" } }, update: { name: "Inbound QC" }, create: { id: deterministicId(42, 1), warehouseId: warehouse.id, code: "A-01", name: "Inbound QC" } });
  const seededInventorySerials: Array<{ id: string; inventoryItemId: string }> = [];
  for (let index = 0; index < 3; index += 1) {
    const inventoryId = deterministicId(43, index + 1);
    await prisma.inventoryItem.upsert({
      where: { id: inventoryId },
      update: { quantityOnHand: 1, quantityReserved: index === 0 ? 1 : 0, deletedAt: null },
      create: { id: inventoryId, productId: deterministicId(20, index + 1), locationId: location.id, quantityOnHand: 1, quantityReserved: index === 0 ? 1 : 0, unitCostUsd: String(3500 + index * 1700) },
    });
    const serial = await prisma.inventorySerial.upsert({
      where: { serialNumber: `ATLAS-${index + 1}-0001` },
      update: {
        inventoryItemId: inventoryId,
        status: index === 0 ? "RESERVED" : "AVAILABLE",
        issuedAt: null,
      },
      create: {
        id: deterministicId(47, index + 1),
        inventoryItemId: inventoryId,
        serialNumber: `ATLAS-${index + 1}-0001`,
        status: index === 0 ? "RESERVED" : "AVAILABLE",
        receivedAt: new Date(Date.UTC(2026, 6, 12)),
      },
    });
    seededInventorySerials.push({ id: serial.id, inventoryItemId: inventoryId });
    await prisma.qualityInspection.upsert({
      where: { id: deterministicId(44, index + 1) },
      update: {
        inventoryItemId: inventoryId,
        inventorySerialId: serial.id,
        inspectorId: deterministicId(3, 7),
        status: "PASSED",
        checklist: { serial: true, boot: true, burnIn: true },
        inspectedAt: new Date(Date.UTC(2026, 6, 13)),
      },
      create: {
        id: deterministicId(44, index + 1),
        inventoryItemId: inventoryId,
        inventorySerialId: serial.id,
        inspectorId: deterministicId(3, 7),
        status: "PASSED",
        checklist: { serial: true, boot: true, burnIn: true },
        inspectedAt: new Date(Date.UTC(2026, 6, 13)),
      },
    });
  }
  for (let index = 0; index < 2; index += 1) {
    const poId = deterministicId(45, index + 1);
    const poItemId = deterministicId(48, index + 1);
    await prisma.purchaseOrder.upsert({
      where: { id: poId },
      update: { supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), status: index === 0 ? "RECEIVED" : "APPROVED", receivedAt: index === 0 ? new Date(Date.UTC(2026, 6, 12)) : null },
      create: { id: poId, purchaseOrderNumber: `PURCHASE-ORDER-${String(index + 1).padStart(6, "0")}`, supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), buyerId: deterministicId(3, 6), status: index === 0 ? "RECEIVED" : "APPROVED", currencyCode: "USD", exchangeRateToUsd: "1", total: "12000", totalUsd: "12000", expectedAt: new Date(Date.UTC(2026, 7, 1)), receivedAt: index === 0 ? new Date(Date.UTC(2026, 6, 12)) : null },
    });
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: poId, id: { not: poItemId } },
    });
    await prisma.purchaseOrderItem.upsert({
      where: { id: poItemId },
      update: {
        purchaseOrderId: poId,
        salesOrderItemId: deterministicId(34, index + 1),
        productId: deterministicId(20, index + 1),
        description: productNames[index],
        productSnapshot: {
          id: deterministicId(20, index + 1),
          sku: `ATL-${String(index + 1).padStart(3, "0")}`,
          name: productNames[index],
          serialized: true,
        },
        configurationSnapshot: {
          variantId: deterministicId(21, index + 1),
          configurationVersion: 1,
        },
        quantity: 1,
        receivedQuantity: index === 0 ? 1 : 0,
        unitCost: "12000",
        lineTotal: "12000",
      },
      create: {
        id: poItemId,
        purchaseOrderId: poId,
        salesOrderItemId: deterministicId(34, index + 1),
        productId: deterministicId(20, index + 1),
        description: productNames[index],
        productSnapshot: {
          id: deterministicId(20, index + 1),
          sku: `ATL-${String(index + 1).padStart(3, "0")}`,
          name: productNames[index],
          serialized: true,
        },
        configurationSnapshot: {
          variantId: deterministicId(21, index + 1),
          configurationVersion: 1,
        },
        quantity: 1,
        receivedQuantity: index === 0 ? 1 : 0,
        unitCost: "12000",
        lineTotal: "12000",
      },
    });
    await prisma.inventoryItem.update({
      where: { id: deterministicId(43, index + 1) },
      data: { purchaseOrderItemId: poItemId },
    });
  }
  const shipment = await prisma.shipment.upsert({
    where: { shipmentNumber: "SHIPMENT-000001" },
    update: {
      status: "BOOKED",
      method: "AIR",
      carrier: "DHL Global Forwarding",
      trackingNumber: "DHL-ATLAS-001",
      origin: "Shenzhen",
      destination: "Frankfurt",
    },
    create: {
      id: deterministicId(46, 1),
      shipmentNumber: "SHIPMENT-000001",
      salesOrderId: deterministicId(33, 1),
      coordinatorId: deterministicId(3, 8),
      status: "BOOKED",
      method: "AIR",
      carrier: "DHL Global Forwarding",
      trackingNumber: "DHL-ATLAS-001",
      origin: "Shenzhen",
      destination: "Frankfurt",
    },
  });
  const shipmentItem = await prisma.shipmentItem.upsert({
    where: {
      shipmentId_salesOrderItemId: {
        shipmentId: shipment.id,
        salesOrderItemId: deterministicId(34, 1),
      },
    },
    update: {
      inventoryItemId: deterministicId(43, 1),
      quantity: 1,
    },
    create: {
      id: deterministicId(49, 1),
      shipmentId: shipment.id,
      salesOrderItemId: deterministicId(34, 1),
      inventoryItemId: deterministicId(43, 1),
      quantity: 1,
    },
  });
  await prisma.shipmentSerial.upsert({
    where: {
      shipmentItemId_inventorySerialId: {
        shipmentItemId: shipmentItem.id,
        inventorySerialId: seededInventorySerials[0].id,
      },
    },
    update: { status: "RESERVED", issuedAt: null, releasedAt: null },
    create: {
      id: deterministicId(50, 1),
      shipmentItemId: shipmentItem.id,
      inventorySerialId: seededInventorySerials[0].id,
      status: "RESERVED",
    },
  });
  await prisma.inventoryTransaction.upsert({
    where: { id: deterministicId(51, 1) },
    update: {
      inventoryItemId: deterministicId(43, 1),
      inventorySerialId: seededInventorySerials[0].id,
      type: "RESERVATION",
      quantity: 1,
      referenceType: "Shipment",
      referenceId: shipment.id,
      createdById: deterministicId(3, 8),
    },
    create: {
      id: deterministicId(51, 1),
      inventoryItemId: deterministicId(43, 1),
      inventorySerialId: seededInventorySerials[0].id,
      type: "RESERVATION",
      quantity: 1,
      referenceType: "Shipment",
      referenceId: shipment.id,
      createdById: deterministicId(3, 8),
    },
  });
  const ticketTypes = [
    "QUALITY",
    "DAMAGE",
    "MISSING_ITEM",
    "WRONG_ITEM",
    "TECHNICAL",
    "WARRANTY",
    "RETURN",
    "OTHER",
  ];
  for (let index = 0; index < 10; index += 1) {
    const status = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"][index % 5];
    await prisma.afterSalesTicket.upsert({
      where: { id: deterministicId(52, index + 1) },
      update: {
        customerId: deterministicId(10, index + 1),
        salesOrderId: deterministicId(33, index + 1),
        productId: deterministicId(20, (index % 5) + 1),
        inventorySerialId: index < 3 ? deterministicId(47, index + 1) : null,
        assignedToId: deterministicId(3, 9),
        issueType: ticketTypes[index % ticketTypes.length],
        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
        status,
        solution: ["RESOLVED", "CLOSED"].includes(status)
          ? "Replacement part supplied and customer acceptance recorded."
          : null,
        costAmount: index % 3 === 0 ? String(75 + index * 10) : null,
        costCurrencyCode: index % 3 === 0 ? "USD" : null,
        resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
          ? new Date(Date.UTC(2026, 6, 16 + index))
          : null,
        closedAt: status === "CLOSED"
          ? new Date(Date.UTC(2026, 6, 17 + index))
          : null,
        deletedAt: null,
      },
      create: {
        id: deterministicId(52, index + 1),
        ticketNumber: `TICKET-${String(index + 1).padStart(6, "0")}`,
        customerId: deterministicId(10, index + 1),
        salesOrderId: deterministicId(33, index + 1),
        productId: deterministicId(20, (index % 5) + 1),
        inventorySerialId: index < 3 ? deterministicId(47, index + 1) : null,
        assignedToId: deterministicId(3, 9),
        subject: `After-sales case ${index + 1}`,
        description: "Customer reported an issue requiring support follow-up.",
        issueType: ticketTypes[index % ticketTypes.length],
        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
        status,
        solution: ["RESOLVED", "CLOSED"].includes(status)
          ? "Replacement part supplied and customer acceptance recorded."
          : null,
        costAmount: index % 3 === 0 ? String(75 + index * 10) : null,
        costCurrencyCode: index % 3 === 0 ? "USD" : null,
        attachments: [],
        resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
          ? new Date(Date.UTC(2026, 6, 16 + index))
          : null,
        closedAt: status === "CLOSED"
          ? new Date(Date.UTC(2026, 6, 17 + index))
          : null,
      },
    });
  }
  for (let index = 0; index < 20; index += 1) {
    const status = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"][index % 4] as
      | "OPEN"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED";
    const assigneeId = deterministicId(3, (index % 8) + 2);
    const teamCode = users[(index % 8) + 1][2];
    await prisma.task.upsert({
      where: { id: deterministicId(53, index + 1) },
      update: {
        title: `Operations task ${index + 1}`,
        status,
        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
        dueAt: new Date(Date.UTC(2026, 6, 15 + index)),
        reminderAt: new Date(Date.UTC(2026, 6, 14 + index)),
        assigneeId,
        creatorId: deterministicId(3, 2),
        teamCode,
        entityType: index % 2 ? "Customer" : "AfterSalesTicket",
        entityId: index % 2
          ? deterministicId(10, (index % 20) + 1)
          : deterministicId(52, (index % 10) + 1),
        completedAt: status === "COMPLETED"
          ? new Date(Date.UTC(2026, 6, 16 + index))
          : null,
        deletedAt: null,
      },
      create: {
        id: deterministicId(53, index + 1),
        title: `Operations task ${index + 1}`,
        description: "Seeded personal/team action with a practical related record.",
        status,
        priority: ["LOW", "NORMAL", "HIGH", "URGENT"][index % 4],
        dueAt: new Date(Date.UTC(2026, 6, 15 + index)),
        reminderAt: new Date(Date.UTC(2026, 6, 14 + index)),
        assigneeId,
        creatorId: deterministicId(3, 2),
        teamCode,
        entityType: index % 2 ? "Customer" : "AfterSalesTicket",
        entityId: index % 2
          ? deterministicId(10, (index % 20) + 1)
          : deterministicId(52, (index % 10) + 1),
        completedAt: status === "COMPLETED"
          ? new Date(Date.UTC(2026, 6, 16 + index))
          : null,
      },
    });
  }
  await prisma.sequence.updateMany({
    where: { key: "ticket", nextValue: { lt: 11 } },
    data: { nextValue: 11 },
  });
  await prisma.sequence.updateMany({
    where: { key: "purchase_order", nextValue: { lt: 3 } },
    data: { nextValue: 3 },
  });
  await prisma.sequence.updateMany({
    where: { key: "shipment", nextValue: { lt: 2 } },
    data: { nextValue: 2 },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
