import { requirePermission } from "@/domains/rbac/guards";

export default async function UsersPage() {
  await requirePermission("super77.access");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <p className="text-sm text-muted-foreground">Gestao de usuarios e permissoes por recurso.</p>
    </div>
  );
}
