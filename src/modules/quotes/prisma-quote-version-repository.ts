import { getPrisma } from "@/lib/prisma";
import type {
  QuoteVersionChanges,
  QuoteVersionRepository,
} from "@/modules/quotes/quote-service";

export function createPrismaQuoteVersionRepository(): QuoteVersionRepository {
  return {
    async findVersionState(versionId) {
      const version = await getPrisma().quoteVersion.findUnique({
        where: { id: versionId },
        select: {
          id: true,
          immutableAt: true,
          quote: { select: { status: true, ownerId: true } },
        },
      });
      if (!version) return null;
      return {
        id: version.id,
        immutableAt: version.immutableAt,
        quoteStatus: version.quote.status,
        quoteOwnerId: version.quote.ownerId,
      };
    },
    updateVersion(versionId, changes: QuoteVersionChanges) {
      return getPrisma().quoteVersion.update({
        where: { id: versionId },
        data: changes,
      });
    },
  };
}
