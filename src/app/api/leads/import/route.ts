import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { previewLeadCsv } from "@/modules/crm/csv";
import { leadCsvImportSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "lead.create");
    const input = leadCsvImportSchema.parse(await request.json());
    const preview = previewLeadCsv(input.csv);
    if (!input.commit || preview.errors.length) {
      return success({ committed: false, ...preview });
    }
    const created = await repository.importLeadsAtomically(
      context,
      preview.validRows,
      input.ownerId ?? context.userId,
    );
    return success(
      { committed: true, imported: created.length, errors: [] },
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
