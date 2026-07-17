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
        /^(dashboard|customer|lead|opportunity|product|quote|order|task|report)\./.test(
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
        /^(dashboard|customer|lead|opportunity|product|quote|order|task)\./.test(
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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
