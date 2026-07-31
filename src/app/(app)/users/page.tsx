import { requirePermission } from "@/domains/rbac/guards";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, CircleDot, Ban } from "lucide-react";

export default async function UsersPage() {
  await requirePermission("super77.access");

  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
      scopes: { orderBy: [{ dimension: "asc" }, { value: "asc" }] },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Administração</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"} · papéis e segregação de dados por dimensão.
        </p>
      </div>

      <div className="grid gap-3">
        {users.map((user) => {
          const roleLabels = user.roles.map((ur) => ur.role.name);
          const scopesByDim = user.scopes.reduce<Record<string, string[]>>((m, s) => {
            if (!m[s.dimension]) m[s.dimension] = [];
            m[s.dimension].push(s.value);
            return m;
          }, {});
          const hasScopes = user.scopes.length > 0;

          return (
            <div key={user.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-black text-primary">
                    {(user.name ?? user.email)
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-card-foreground">{user.name ?? "—"}</p>
                    <p className="text-[12px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  {user.status === "ACTIVE" ? (
                    <CircleDot className="h-4 w-4 text-green-500" />
                  ) : (
                    <Ban className="h-4 w-4 text-primary" />
                  )}
                  <span className={`text-[11px] font-semibold ${user.status === "ACTIVE" ? "text-green-600" : "text-primary"}`}>
                    {user.status === "ACTIVE" ? "Ativo" : "Desativado"}
                  </span>
                </div>
              </div>

              {/* Roles */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {roleLabels.length > 0 ? (
                  roleLabels.map((r) => (
                    <span key={r} className="rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground">Sem papéis</span>
                )}
              </div>

              {/* Scopes */}
              {hasScopes && (
                <div className="mt-3 border-t pt-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Segregação de dados</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(scopesByDim).map(([dim, values]) => (
                      <div key={dim} className="flex items-center gap-1">
                        <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {dim}
                        </span>
                        {values.map((v) => (
                          <span key={v} className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {v}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
