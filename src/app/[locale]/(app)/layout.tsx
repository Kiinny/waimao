import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { getPrisma } from "@/lib/prisma";

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
  const context = await currentAuthorizationContext().catch(() =>
    redirect(`/${locale}/login`),
  );
  const unreadNotifications = await getPrisma().notification.count({
    where: { userId: context.userId, readAt: null },
  });

  return (
    <AppShell
      locale={locale}
      permissions={context.permissions}
      unreadNotifications={unreadNotifications}
      user={session.user}
    >
      {children}
    </AppShell>
  );
}
