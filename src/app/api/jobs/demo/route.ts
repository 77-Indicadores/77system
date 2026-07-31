import { NextResponse } from "next/server";
import { requirePermission } from "@/domains/rbac/guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requirePermission("system.jobs.view");
  const job = await prisma.integrationJob.create({
    data: { type: "demo", status: "RUNNING", progress: 0, message: "Job demo iniciado." }
  });

  return NextResponse.json({ jobId: job.id, eventsUrl: `/api/jobs/${job.id}/events` });
}
