import { NextResponse } from "next/server";
import { requirePermission } from "@/domains/rbac/guards";
import { prisma } from "@/lib/prisma";

// Demo endpoint is only available in development/test environments.
// In production it returns 404 to avoid polluting real job state.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  await requirePermission("system.jobs.view");

  const job = await prisma.integrationJob.create({
    data: { type: "demo", status: "RUNNING", progress: 0, message: "Job demo iniciado." },
  });

  return NextResponse.json({ jobId: job.id, eventsUrl: `/api/jobs/${job.id}/events` });
}
