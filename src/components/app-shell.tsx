import Link from "next/link";

import { signOut } from "@/auth";
import type { Locale } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";

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
    ["dashboard", "⌂", dictionary.nav.dashboard],
    ["users", "♙", dictionary.nav.users],
    ["roles", "⌘", dictionary.nav.roles],
  ] as const;

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
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label={dictionary.search}
              placeholder={dictionary.search}
              type="search"
            />
          </label>
          <div className="top-actions">
            <Link
              className="icon-button notification-link"
              href={`/${locale}/dashboard#notifications`}
              aria-label="Notifications"
            >
              ♢
            </Link>
            <Link
              className="icon-button"
              href={`/${locale === "en" ? "zh" : "en"}/dashboard`}
              aria-label="Switch language"
            >
              {locale === "en" ? "中" : "EN"}
            </Link>
            <ThemeToggle />
            <form action={logout}>
              <button
                className="icon-button focus-ring"
                title={user.email ?? undefined}
                aria-label="Sign out"
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
