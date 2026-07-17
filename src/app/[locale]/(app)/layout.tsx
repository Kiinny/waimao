import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  await currentAuthorizationContext().catch(() => redirect(`/${locale}/login`));

  return (
    <AppShell locale={locale} user={session.user}>
      {children}
    </AppShell>
  );
}
