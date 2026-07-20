import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { reportQuerySchema } from "@/modules/management/management-schemas";
import { ManagementService } from "@/modules/management/management-service";
import { toCsv } from "@/modules/management/reporting";

const service = new ManagementService();

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "report.read");
    const url = new URL(request.url);
    const query = reportQuerySchema.parse({
      type: url.searchParams.get("type") ?? "sales",
      format: url.searchParams.get("format") ?? "json",
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
    });
    const report = await service.report(context, query);
    if (query.format === "json") return success(report);

    const name = `${query.type}-report`;
    const csv = `\uFEFF${toCsv(report.rows)}`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.csv"`,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
