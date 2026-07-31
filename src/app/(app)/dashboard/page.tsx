import Link from "next/link";
import { ArrowRight, BarChart3, LayoutDashboard } from "lucide-react";
import { listVisibleDashboardGroups } from "@/domains/indicators/service";

export default async function DashboardPage() {
  const groups = await listVisibleDashboardGroups();
  const totalScreens = groups.reduce((t, g) => t + g.screens.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Indicadores</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Dashboards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dados materializados, acesso por permissão e atualização automática.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border bg-card px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Grupos</p>
            <strong className="text-2xl font-black tabular-nums">{groups.length}</strong>
          </div>
          <div className="rounded-lg border bg-card px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Telas</p>
            <strong className="text-2xl font-black tabular-nums">{totalScreens}</strong>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center">
          <LayoutDashboard className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum dashboard disponível para este usuário.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Verifique as permissões ou execute o seed inicial.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div key={group.slug} className="rounded-xl border bg-card p-5">
              <div className="mb-4">
                <h2 className="font-bold text-card-foreground">{group.name}</h2>
                {group.description && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{group.description}</p>
                )}
              </div>
              <div className="space-y-1.5">
                {group.screens.map((screen) => (
                  <Link
                    key={screen.slug}
                    href={`/dashboard/${screen.slug}`}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-[13px] font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-primary" />
                      {screen.name}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
