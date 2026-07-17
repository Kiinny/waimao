import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const { error } = await searchParams;
  const action = loginAction.bind(null, locale);

  return (
    <main className="login-page">
      <section className="login-panel">
        <form action={action} className="login-form">
          <div className="brand" style={{ color: "var(--foreground)", padding: 0 }}>
            <span className="brand-mark">A</span>
            <span>{dictionary.appName}</span>
          </div>
          <h1>{dictionary.auth.title}</h1>
          <p className="muted">{dictionary.auth.subtitle}</p>
          {error ? (
            <div className="alert-error" role="alert">
              {dictionary.auth.error}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="email">{dictionary.auth.email}</label>
            <input
              className="focus-ring"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">{dictionary.auth.password}</label>
            <input
              className="focus-ring"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
          <button className="button focus-ring" type="submit">
            {dictionary.auth.signIn}
          </button>
          <p className="muted" style={{ marginTop: 22, fontSize: 13 }}>
            <Link href={`/${locale === "en" ? "zh" : "en"}/login`}>
              {getDictionary(locale === "en" ? "zh" : "en").languageName}
            </Link>
          </p>
        </form>
      </section>
      <section className="login-hero" aria-hidden="true">
        <div className="login-hero-copy">
          <h2>{dictionary.auth.heroTitle}</h2>
          <p>{dictionary.auth.heroText}</p>
        </div>
      </section>
    </main>
  );
}
