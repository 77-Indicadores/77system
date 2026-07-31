import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "data.refresh.triggered"
  | "data.sync_job.cancelled"
  | "integration.connection.updated"
  | "user.role.assigned"
  | "user.role.removed"
  | "system.settings.changed";

export async function auditLog(
  actor: string,
  action: AuditAction,
  opts?: { resourceType?: string; resourceId?: string; metadata?: Prisma.InputJsonObject }
) {
  return prisma.auditLog.create({
    data: {
      actor,
      action,
      resourceType: opts?.resourceType ?? null,
      resourceId: opts?.resourceId ?? null,
      metadataJson: opts?.metadata,
    },
  });
}

export async function listAuditLogs(opts?: { actor?: string; action?: string; limit?: number }) {
  return prisma.auditLog.findMany({
    where: {
      ...(opts?.actor ? { actor: opts.actor } : {}),
      ...(opts?.action ? { action: opts.action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
}
