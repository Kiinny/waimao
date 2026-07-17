import { currentAuthorizationContext } from "@/lib/current-user";
import { failure } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { exportLeadCsv } from "@/modules/crm/csv";
import { paginatedQuerySchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "lead.read");
    const filters = paginatedQuerySchema
      .omit({ page: true, pageSize: true })
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    const first = await repository.listLeads(context, {
      ...filters,
      page: 1,
      pageSize: 100,
    });
    const items = [...first.items];
    for (let page = 2; page <= first.pageCount; page += 1) {
      const next = await repository.listLeads(context, {
        ...filters,
        page,
        pageSize: 100,
      });
      items.push(...next.items);
    }
    const csv = exportLeadCsv(
      items.map((lead) => ({
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        countryCode: lead.countryCode,
        source: lead.source,
        status: lead.status,
        ownerName: lead.owner.name,
        createdAt: lead.createdAt,
      })),
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
