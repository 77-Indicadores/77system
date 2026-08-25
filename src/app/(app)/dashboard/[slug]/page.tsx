import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { FocusNav } from "@/components/focus-nav";
import { FreshnessBadge } from "@/components/widgets/freshness-badge";
import { getFinancialRevenueSummary } from "@/domains/indicators/financial";
import { listVisibleDashboardGroups, requireDashboardAccess } from "@/domains/indicators/service";
import { cronToFreshnessSeconds } from "@/domains/data/schedule";
import { prisma } from "@/lib/prisma";
import { FinancialDashboardClient } from "./financial-dashboard-client";

export default async function DashboardScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [screen, allGroups] = await Promise.all([requireDashboardAccess(slug), listVisibleDashboardGroups()]);
  if (!screen) notFound();

  const [summary, schedule] = await Promise.all([
    getFinancialRevenueSummary(),
    prisma.dataRefreshSchedule.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const freshnessSeconds = schedule ? cronToFreshnessSeconds(schedule.cronExpression) : 86400;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header
        className="flex h-11 shrink-0 items-center gap-2 px-4"
        style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link
          href="/dashboard"
          aria-label="Voltar para indicadores"
          className="grid size-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-white/10"
          style={{ color: "var(--sidebar-text)" }}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <span className="h-4 w-px shrink-0" style={{ background: "var(--sidebar-border)" }} />

        <FocusNav
          groups={allGroups.map((g) => ({
            slug: g.slug,
            name: g.name,
            screens: g.screens.map((s) => ({ slug: s.slug, name: s.name })),
          }))}
          currentScreenSlug={screen.slug}
          currentScreenName={screen.name}
          currentGroupSlug={screen.group.slug}
        />

        <div className="flex-1" />

        <FreshnessBadge updatedAt={summary.updatedAt} freshnessSeconds={freshnessSeconds} />
        <a
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-3 text-[12px] font-medium text-white/70 hover:bg-white/10"
          href="/api/exports/excel"
        >
          <Download className="size-3" /> Excel
        </a>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 2xl:px-10">
        <FinancialDashboardClient
          screenName={screen.name}
          screenDescription={screen.description}
          summary={summary}
        />
      </div>
    </div>
  );
}
