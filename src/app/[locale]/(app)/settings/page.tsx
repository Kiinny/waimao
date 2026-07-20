import { notFound } from "next/navigation";

import { SettingEditor } from "@/components/management/management-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ManagementService } from "@/modules/management/management-service";

export const dynamic = "force-dynamic";
const service = new ManagementService();

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "settings.read");
  const settings = await service.listSettings(context);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "设置" : "Settings"}</h1>
          <p>{locale === "zh" ? "公司、币种、税务、银行、模板、目录和备份配置。" : "Company, currencies, taxes, banking, templates, catalogs, and backups."}</p>
        </div>
      </header>
      {settings.length ? (
        <section className="record-grid settings-grid">
          {settings.map((setting) => (
            <article className="record-card" key={setting.id}>
              <strong>{setting.namespace}.{setting.key}</strong>
              <small>v{setting.version}{setting.isSecret ? " · secret" : ""}</small>
              {can(context, "settings.update") ? (
                <SettingEditor locale={locale} setting={setting} />
              ) : (
                <pre>{JSON.stringify(setting.value, null, 2)}</pre>
              )}
            </article>
          ))}
        </section>
      ) : <section className="card empty-state">{locale === "zh" ? "暂无设置。" : "No settings configured."}</section>}
    </>
  );
}
