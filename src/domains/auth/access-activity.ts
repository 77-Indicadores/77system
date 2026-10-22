import { prisma } from "@/lib/prisma";

export async function recordAccessChange(email: string, kind: "LOGIN" | "LOGOUT") {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();
  await prisma.$transaction([
    prisma.userActivity.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, lastSeenAt: now, isOnline: kind === "LOGIN" },
      update: { lastSeenAt: now, isOnline: kind === "LOGIN" },
    }),
    prisma.userAccessEvent.create({
      data: { email: normalizedEmail, kind, occurredAt: now },
    }),
  ]);
}
