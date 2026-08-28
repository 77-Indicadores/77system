import { auth } from "@/auth";
import { requirePermission } from "@/domains/rbac/guards";
import { listUsers } from "@/domains/users/service";
import { getPoliticasDoUsuario, listarRecursosConcediveis } from "@/domains/rbac/policies";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requirePermission("users.manage");
  const [users, session, catalogo] = await Promise.all([
    listUsers(),
    auth(),
    listarRecursosConcediveis(),
  ]);
  // O que cada um enxerga hoje, para o painel abrir já marcado.
  const politicas = Object.fromEntries(
    await Promise.all(
      users.map(async (u) => [u.id, await getPoliticasDoUsuario(u.id)] as const),
    ),
  );

  return (
    <UsersClient
      users={users}
      currentUserEmail={session?.user?.email ?? ""}
      catalogo={catalogo}
      politicas={politicas}
    />
  );
}
