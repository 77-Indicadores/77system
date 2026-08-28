import { auth } from "@/auth";
import { requirePermission } from "@/domains/rbac/guards";
import { listUsers } from "@/domains/users/service";
import { getPoliticasDeUsuarios, listarRecursosConcediveis } from "@/domains/rbac/policies";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requirePermission("users.manage");
  const [users, session, catalogo] = await Promise.all([
    listUsers(),
    auth(),
    listarRecursosConcediveis(),
  ]);
  // O que cada um enxerga hoje, para o painel abrir já marcado. Uma consulta para todos,
  // e não uma por usuário.
  const politicas = await getPoliticasDeUsuarios(users.map((u) => u.id));

  return (
    <UsersClient
      users={users}
      currentUserEmail={session?.user?.email ?? ""}
      catalogo={catalogo}
      politicas={politicas}
    />
  );
}
