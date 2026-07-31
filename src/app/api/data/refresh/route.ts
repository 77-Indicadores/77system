import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requirePermission } from "@/domains/rbac/guards";
import { queueDataSync } from "@/domains/data/service";
import { auditLog } from "@/domains/super77/audit";

export async function POST(request: Request) {
  const session = await auth();
  await requirePermission("system.jobs.manage");

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "catworld-financeiro";

  const job = await queueDataSync(key, { triggeredBy: session!.user!.email! });

  await auditLog(session!.user!.email!, "data.refresh.triggered", {
    resourceType: "data_source",
    resourceId: key,
    metadata: { jobId: job.id } satisfies Record<string, string>,
  });

  return NextResponse.json({ jobId: job.id, status: job.status });
}
