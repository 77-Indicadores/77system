import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return null;

  // Invalida tokens anteriores do mesmo e-mail
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      email,
      tokenHash: hashToken(raw),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return raw;
}

export async function validatePasswordResetToken(raw: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expires < new Date()) return null;

  return record.email;
}

export async function consumePasswordResetToken(raw: string, newPassword: string): Promise<boolean> {
  const email = await validatePasswordResetToken(raw);
  if (!email) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.passwordResetToken.updateMany({
      where: { tokenHash: hashToken(raw) },
      data: { usedAt: new Date() },
    }),
  ]);

  return true;
}
