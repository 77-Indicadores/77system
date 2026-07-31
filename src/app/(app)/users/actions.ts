"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/domains/rbac/guards";
import { createUser, deleteUser, setUserRole, updateUser } from "@/domains/users/service";
import { clearUserScope, setUserScope } from "@/domains/rbac/scope";
import { createPasswordResetToken } from "@/domains/auth/reset";
import { sendPasswordResetEmail } from "@/domains/auth/mailer";

async function requireManage() {
  return requirePermission("users.manage");
}

export async function actionCreateUser(data: {
  name: string;
  email: string;
  password: string;
  roleKey: string;
}) {
  await requireManage();
  if (!data.name.trim() || !data.email.trim() || data.password.length < 8) {
    throw new Error("Dados inválidos: nome, e-mail e senha (mín. 8 chars) obrigatórios.");
  }
  await createUser(data);
  revalidatePath("/users");
}

export async function actionUpdateUser(id: string, data: { name?: string; email?: string }) {
  await requireManage();
  await updateUser(id, data);
  revalidatePath("/users");
}

export async function actionToggleStatus(id: string, current: "ACTIVE" | "DISABLED") {
  const session = await requireManage();
  const user = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUniqueOrThrow({ where: { id }, select: { email: true } })
  );
  if (user.email === session.user!.email) throw new Error("Não é possível desativar o próprio usuário.");
  await updateUser(id, { status: current === "ACTIVE" ? "DISABLED" : "ACTIVE" });
  revalidatePath("/users");
}

export async function actionSetRole(id: string, roleKey: string) {
  const session = await requireManage();
  const user = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUniqueOrThrow({ where: { id }, select: { email: true } })
  );
  if (user.email === session.user!.email) throw new Error("Não é possível alterar o próprio papel.");
  await setUserRole(id, roleKey);
  revalidatePath("/users");
}

export async function actionDeleteUser(id: string) {
  const session = await requireManage();
  const user = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUniqueOrThrow({ where: { id }, select: { email: true } })
  );
  if (user.email === session.user!.email) throw new Error("Não é possível excluir o próprio usuário.");
  await deleteUser(id);
  revalidatePath("/users");
}

export async function actionSetScope(id: string, dimension: string, values: string[]) {
  await requireManage();
  await setUserScope(id, dimension, values);
  revalidatePath("/users");
}

export async function actionClearScope(id: string, dimension?: string) {
  await requireManage();
  await clearUserScope(id, dimension);
  revalidatePath("/users");
}

export async function actionSendResetLink(email: string) {
  await requireManage();
  const token = await createPasswordResetToken(email);
  if (token) {
    const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(email, `${base}/reset-password?token=${token}`);
  }
}
