import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { userHasPermission } from "@/domains/rbac/service";

export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const allowed = await userHasPermission(session.user.email, permission);
  if (!allowed) notFound();

  return session;
}
