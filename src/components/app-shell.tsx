import Link from "next/link";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";

export function AppShell({
  locale,
  user,
  permissions,
  unreadNotifications,
  children,
}: {
  locale: Locale;
  user: { name?: string | null; email?: string | null };
  permissions: readonly string[];
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const dictionary = getDictionary(locale);
  const nav = [
    ["dashboard", "D", dictionary.nav.dashboard],
    ["leads", "L", dictionary.nav.leads],
    ["customers", "C", dictionary.nav.customers],
    ["opportunities", "O", dictionary.nav.opportunities],
    ["products", "P", locale === "zh" ? "产品" : "Products"],
    ["quotes", "Q", locale === "zh" ? "报价" : "Quotes"],
    ["orders", "S", locale === "zh" ? "订单" : "Orders"],
    ["suppliers", "V", locale === "zh" ? "供应商" : "Suppliers"],
    ["purchase-orders", "B", locale === "zh" ? "采购订单" : "Purchase orders"],
    ["inventory", "I", locale === "zh" ? "库存" : "Inventory"],
    ["inspections", "Q", locale === "zh" ? "质检" : "Quality"],
    ["shipments", "H", locale === "zh" ? "物流" : "Shipments"],
    ["tickets", "A", locale === "zh" ? "售后" : "After-sales"],
    ["tasks", "T", locale === "zh" ? "任务" : "Tasks"],
    ["notifications", "N", locale === "zh" ? "通知" : "Notifications"],
    ["reports", "X", locale === "zh" ? "报表" : "Reports"],
    ["settings", "G", locale === "zh" ? "设置" : "Settings"],
    ["activity-logs", "J", locale === "zh" ? "活动日志" : "Activity logs"],
    ["users", "U", dictionary.nav.users],
    ["roles", "R", dictionary.nav.roles],
  ] as const;
  const permissionByPath: Record<string, string> = {
    dashboard: "dashboard.read",
    leads: "lead.read",
    customers: "customer.read",
    opportunities: "opportunity.read",
    products: "product.read",
    quotes: "quote.read",
    orders: "order.read",
    suppliers: "supplier.read",
    "purchase-orders": "purchase.read",
    inventory: "inventory.read",
    inspections: "quality.read",
    shipments: "shipment.read",
    tickets: "after_sales.read",
    tasks: "task.read",
    reports: "report.read",
    settings: "settings.read",
    "activity-logs": "audit.read",
    users: "user.read",
    roles: "role.read",
  };
  const visibleNav = nav.filter(
    ([path]) =>
      permissions.includes("*") ||
      permissions.includes(permissionByPath[path]),
  );
  const targetLocale = locale === "en" ? "zh" : "en";
  const targetDictionary = getDictionary(targetLocale);

  async function logout() {
    "use server";
    await signOut({ redirectTo: `/${locale}/login` });
  }

  return (
    <div className="app-grid">
      <aside className="sidebar">
        <Link className="brand" href={`/${locale}/dashboard`}>
          <span className="brand-mark">A</span>
          <span>{dictionary.appName}</span>
        </Link>
        <nav aria-label="Primary navigation">
          <div className="nav-label">{dictionary.nav.workspace}</div>
          {visibleNav.map(([path, icon, label]) => (
            <Link
              key={path}
              className="nav-link"
              href={`/${locale}/${path}`}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <form
            className="search"
            action={`/${locale}/search`}
            role="search"
          >
            <span aria-hidden="true">S</span>
            <input
              aria-label={dictionary.search.label}
              placeholder={dictionary.search.placeholder}
              name="q"
              type="search"
              required
            />
            <button type="submit">{dictionary.search.submit}</button>
          </form>
          <div className="top-actions">
            <Link
              className="icon-button notification-link"
              href={`/${locale}/notifications`}
              aria-label={dictionary.notificationsLabel}
            >
              {unreadNotifications || "!"}
            </Link>
            <Link
              className="icon-button"
              href={`/${targetLocale}/dashboard`}
              aria-label={dictionary.languageSwitch}
            >
              {targetDictionary.languageName}
            </Link>
            <ThemeToggle label={dictionary.themeLabel} />
            <form action={logout}>
              <button
                className="icon-button focus-ring"
                title={user.email ?? undefined}
                aria-label={dictionary.signOutLabel}
                type="submit"
              >
                {(user.name ?? "U").slice(0, 1).toUpperCase()}
              </button>
            </form>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
