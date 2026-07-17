import Link from "next/link";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";

export function AppShell({
  locale,
  user,
  children,
}: {
  locale: Locale;
  user: { name?: string | null; email?: string | null };
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
    ["users", "U", dictionary.nav.users],
    ["roles", "R", dictionary.nav.roles],
  ] as const;
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
          {nav.map(([path, icon, label]) => (
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
              href={`/${locale}/dashboard#notifications`}
              aria-label={dictionary.notificationsLabel}
            >
              !
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
