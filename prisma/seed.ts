import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEVELOPMENT_PASSWORD = "ChangeMe123!";

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
  "refund.create",
  "finance.profit.read",
  "supplier.read",
  "supplier.create",
  "supplier.update",
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
  "after_sales.update",
  "task.read",
  "task.update",
  "report.read",
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
        /^(dashboard|customer|lead|follow_up|opportunity|product|quote|order|task|report)\./.test(
          code,
        ) && code !== "finance.profit.read",
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
        ) && !code.endsWith(".delete"),
    ),
  },
  {
    code: "FINANCE",
    name: "Finance",
    description: "Payments, refunds, costs and financial reporting",
    permissions: permissions.filter(
      (code) =>
        code === "order.read" ||
        ["dashboard.", "payment.", "refund.", "finance.", "purchase.cost.", "report."].some(
          (prefix) => code.startsWith(prefix),
        ),
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
        ),
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
        ].some((prefix) => code.startsWith(prefix)),
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
  const passwordHash = await hashPassword(DEVELOPMENT_PASSWORD);

  for (const [index, code] of permissions.entries()) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: code },
      create: {
        id: deterministicId(1, index + 1),
        code,
        name: code,
      },
    });
  }

  await prisma.permission.upsert({
    where: { code: "*" },
    update: { name: "All permissions" },
    create: {
      id: deterministicId(1, 999),
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
    update: {},
    create: {
      id: deterministicId(4, 1),
      namespace: "company",
      key: "profile",
      value: {
        name: "Atlas Global Systems",
        defaultLocale: "en",
        baseCurrency: "USD",
      },
    },
  });

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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
