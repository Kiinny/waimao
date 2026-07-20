import Link from "next/link";
import { notFound } from "next/navigation";

import {
  MutationButton,
  TaskCreateForm,
} from "@/components/management/management-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ManagementService } from "@/modules/management/management-service";

export const dynamic = "force-dynamic";
const service = new ManagementService();
const statuses = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

function TaskCard({
  task,
  locale,
  editable,
}: {
  task: Awaited<ReturnType<ManagementService["listTasks"]>>[number];
  locale: "en" | "zh";
  editable: boolean;
}) {
  return (
    <article className={`record-card ${task.overdue ? "task-overdue" : ""}`}>
      <strong>{task.title}</strong>
      <span>{task.priority} · {task.status}</span>
      <span>{task.assignee.name}{task.teamCode ? ` · ${task.teamCode}` : ""}</span>
      <time>{task.dueAt ? task.dueAt.toLocaleString(locale) : (locale === "zh" ? "无截止日期" : "No due date")}</time>
      {task.overdue ? <span className="risk risk-high">{locale === "zh" ? "已逾期" : "Overdue"}</span> : null}
      {task.entityType ? <small>{task.entityType} · {task.entityId}</small> : null}
      {editable && !["COMPLETED", "CANCELLED"].includes(task.status) ? (
        <MutationButton
          body={{ expectedVersion: task.version, status: task.status === "OPEN" ? "IN_PROGRESS" : "COMPLETED" }}
          endpoint={`/api/tasks/${task.id}`}
          label={task.status === "OPEN" ? (locale === "zh" ? "开始" : "Start") : (locale === "zh" ? "完成" : "Complete")}
          locale={locale}
        />
      ) : null}
    </article>
  );
}

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "task.read");
  const view = (await searchParams).view ?? "list";
  const [tasks, users] = await Promise.all([
    service.listTasks(context),
    service.listTaskAssignees(),
  ]);
  const editable = can(context, "task.update");

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "任务" : "Tasks"}</h1>
          <p>{locale === "zh" ? "个人与团队任务、提醒和逾期工作。" : "Personal and team work, reminders, and overdue items."}</p>
        </div>
        <nav className="view-switcher" aria-label="Task view">
          {["list", "kanban", "calendar"].map((value) => (
            <Link className={view === value ? "badge" : ""} href={`/${locale}/tasks?view=${value}`} key={value}>
              {value}
            </Link>
          ))}
        </nav>
      </header>
      {!tasks.length ? (
        <section className="card empty-state">{locale === "zh" ? "暂无任务。" : "No tasks in your scope."}</section>
      ) : view === "kanban" ? (
        <section className="kanban task-kanban">
          {statuses.map((status) => (
            <div className="kanban-column" key={status}>
              <h2>{status}</h2>
              {tasks.filter((task) => task.status === status).map((task) => (
                <TaskCard editable={editable} key={task.id} locale={locale} task={task} />
              ))}
            </div>
          ))}
        </section>
      ) : view === "calendar" ? (
        <section className="calendar-grid">
          {tasks.filter((task) => task.dueAt).map((task) => (
            <div className="calendar-day" key={task.id}>
              <time>{task.dueAt!.toLocaleDateString(locale)}</time>
              <TaskCard editable={editable} locale={locale} task={task} />
            </div>
          ))}
        </section>
      ) : (
        <section className="record-grid">
          {tasks.map((task) => <TaskCard editable={editable} key={task.id} locale={locale} task={task} />)}
        </section>
      )}
      {can(context, "task.create") ? (
        <details className="card section-card">
          <summary>{locale === "zh" ? "新建任务" : "Create task"}</summary>
          <TaskCreateForm
            locale={locale}
            users={users.map((user) => ({ id: user.id, label: user.name }))}
            teams={[...new Set(users.flatMap((user) => user.roles.map(({ role }) => role.code)))]}
          />
        </details>
      ) : null}
    </>
  );
}
