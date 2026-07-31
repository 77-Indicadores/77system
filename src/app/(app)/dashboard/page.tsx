import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { listVisibleDashboardGroups } from "@/domains/indicators/service";

export default async function DashboardPage() {
  const groups = await listVisibleDashboardGroups();
  const totalScreens = groups.reduce((t, g) => t + g.screens.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Central Analítica</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Indicadores</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Dashboards com permissão por tela e dados materializados.
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

      {/* Groups */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.slug} className="rounded-xl border bg-card p-5">
            <div className="mb-4">
              <h2 className="font-bold text-foreground">{group.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="space-y-1.5">
              {group.screens.map((screen) => (
                <Link
                  key={screen.slug}
                  href={`/dashboard/${screen.slug}`}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
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
    </div>
  );
}
