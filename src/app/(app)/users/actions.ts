"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/domains/rbac/guards";
import { createUser, deleteUser, setUserRole, updateUser } from "@/domains/users/service";
import { clearUserScope, setUserScope } from "@/domains/rbac/scope";
import { setPoliticasDoUsuario } from "@/domains/rbac/policies";
import { createPasswordResetToken, INVITE_TTL_MS } from "@/domains/auth/reset";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/domains/auth/mailer";

async function requireManage() {
  return requirePermission("users.manage");
}

/**
 * Cria o usuário e devolve o que deu errado, em vez de estourar.
 *
 * Erro de server action chega ao navegador sem mensagem em produção — a tela mostraria
 * "erro inesperado" para um e-mail repetido. Aqui o motivo volta como texto.
 */
export async function actionCreateUser(data: {
  name: string;
  email: string;
  password: string;
  roleKey: string;
  /** Manda o convite por e-mail; a senha inicial deixa de ser necessária. */
  convidar?: boolean;
}): Promise<{ erro?: string; aviso?: string; convite?: string }> {
  await requireManage();
  if (!data.name.trim()) return { erro: "Informe o nome completo." };
  if (!data.email.trim()) return { erro: "Informe o e-mail." };
  const convidar = data.convidar !== false;
  if (!convidar && data.password.length < 8) {
    return { erro: "A senha inicial precisa de pelo menos 8 caracteres." };
  }

  const email = data.email.toLowerCase().trim();
  const { prisma } = await import("@/lib/prisma");
  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existente) return { erro: `Já existe um usuário com o e-mail ${email}.` };

  /*
   * No convite ninguém escolhe a senha por ele: a conta nasce com uma senha aleatória que
   * nunca é dita a ninguém, e quem entra define a sua pelo link. Sem isso haveria uma
   * senha conhecida por duas pessoas circulando por aí.
   */
  const senha = convidar ? randomUUID() + randomUUID() : data.password;

  try {
    await createUser({ ...data, email, password: senha });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível criar o usuário." };
  }
  revalidatePath("/users");
  if (!convidar) return {};

  /*
   * O usuário já existe a esta altura. Falha de e-mail não desfaz a criação — devolve o
   * link para o administrador entregar por outro caminho.
   */
  const convite = await linkDeDefinicaoDeSenha(email);
  try {
    await sendWelcomeEmail(email, data.name, convite);
    return { aviso: `Convite enviado para ${email}. O link vale por 24 horas.` };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : "falha ao enviar";
    return {
      aviso: `Usuário criado, mas o e-mail não saiu (${motivo}). Envie este link — ele vale por 24 horas:`,
      convite,
    };
  }
}

async function linkDeDefinicaoDeSenha(email: string) {
  const token = await createPasswordResetToken(email, INVITE_TTL_MS);
  const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  return `${base}/reset-password?token=${token}`;
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

/** Substitui os grupos, telas e cadastros que o usuário enxerga. */
export async function actionSetPolicies(
  id: string,
  alvo: { grupos: string[]; telas: string[]; cadastros?: string[] },
) {
  await requireManage();
  await setPoliticasDoUsuario(id, { ...alvo, cadastros: alvo.cadastros ?? [] });
  revalidatePath("/users");
  revalidatePath("/dashboard");
  revalidatePath("/registries");
}

/**
 * Gera o link de definição de senha e tenta enviá-lo.
 *
 * O link volta sempre. Sem servidor de e-mail configurado — ou com ele fora do ar — o
 * envio falha, e antes disso derrubava a tela inteira: quem administra ficava sem link e
 * sem explicação, e a pessoa sem acesso. Agora o administrador copia e entrega por onde
 * puder, que é o que ele faria de qualquer forma.
 */
export async function actionSendResetLink(email: string): Promise<{ link: string; enviado: boolean; erro?: string }> {
  await requireManage();
  const token = await createPasswordResetToken(email, INVITE_TTL_MS);
  if (!token) return { link: "", enviado: false, erro: "Usuário inativo ou inexistente." };

  const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, link);
    return { link, enviado: true };
  } catch (erro) {
    return { link, enviado: false, erro: erro instanceof Error ? erro.message : "falha ao enviar" };
  }
}
