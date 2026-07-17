import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      service: "atlas-crm",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: "unavailable", service: "atlas-crm" },
      { status: 503 },
    );
  }
}
