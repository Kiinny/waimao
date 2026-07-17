import { z } from "zod";

import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { createPrismaQuoteVersionRepository } from "@/modules/quotes/prisma-quote-version-repository";
import { updateQuoteVersion } from "@/modules/quotes/quote-service";

const updateSchema = z
  .object({
    remarks: z.string().max(5000).nullable().optional(),
    paymentTerms: z.string().max(1000).nullable().optional(),
    deliveryTerms: z.string().max(1000).nullable().optional(),
    warrantyTerms: z.string().max(1000).nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one editable field is required",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const version = await updateQuoteVersion(
      createPrismaQuoteVersionRepository(),
      context,
      id,
      input,
    );
    return success(version);
  } catch (error) {
    return failure(error);
  }
}
