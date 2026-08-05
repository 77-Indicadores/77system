import { CheckCircle2, Clock, DatabaseZap, XCircle, Loader2 } from "lucide-react";
import { auth } from "@/auth";
import { SaveScheduleButton, SyncButton, JobsLivePoller, LiveClock } from "./sync-button";
import { requirePermission } from "@/domains/rbac/guards";
import { listDataOperations, queueDataSync, saveDataRefreshSchedule } from "@/domains/data/service";
import { auditLog } from "@/domains/super77/audit";
import { revalidatePath } from "next/cache";

const STATUS_ICON: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="size-4 text-green-500" />,
  FAILED:  <XCircle className="size-4 text-destructive" />,
  RUNNING: <Loader2 className="size-4 animate-spin text-amber-500" />,
  QUEUED:  <Clock className="size-4 text-muted-foreground" />,
};

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "Sucesso",
  FAILED:  "Erro",
  RUNNING: "Em execução",
  QUEUED:  "Na fila",
};

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function Super77DataPage() {
  await requirePermission("system.jobs.view");
  const sources = await listDataOperations();

  async function refresh(formData: FormData) {
    "use server";
    const session = await auth();
    await requirePermission("system.jobs.manage");
    const key = String(formData.get("key"));
    const job = await queueDataSync(key, { triggeredBy: session!.user!.email! });
    await auditLog(session!.user!.email!, "data.refresh.triggered", {
      resourceType: "data_source",
      resourceId: key,
      metadata: { jobId: job.id } satisfies Record<string, string>,
    });
    revalidatePath("/super77/data");
  }

  async function updateSchedule(formData: FormData) {
    "use server";
    const session = await auth();
    await requirePermission("system.jobs.manage");

    const key = String(formData.get("key"));
    const scheduleId = String(formData.get("scheduleId") ?? "");
    const cronExpression = String(formData.get("cronExpression") ?? "");
    const isActive = formData.get("isActive") === "on";

    const schedule = await saveDataRefreshSchedule(key, {
      scheduleId: scheduleId || undefined,
      cronExpression,
      isActive,
    });

    await auditLog(session!.user!.email!, "data.schedule.updated", {
      resourceType: "data_refresh_schedule",
      resourceId: schedule.id,
      metadata: { dataSourceKey: key, cronExpression: schedule.cronExpression } satisfies Record<string, string>,
    });
    revalidatePath("/super77/data");
  }

  const activeJobCount = sources.reduce(
    (n, s) => n + s.syncJobs.filter((j) => j.status === "QUEUED" || j.status === "RUNNING").length,
    0
  );

  return (
    <div className="space-y-6">
      <JobsLivePoller activeJobCount={activeJobCount} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Super77</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Dados e Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fontes de dados, agendamentos e histórico de sincronização.
          </p>
        </div>
        <LiveClock />
      </div>

      <div className="grid gap-4">
        {sources.map((source) => {
          const lastJob = source.syncJobs[0];
          const schedule = source.schedules[0];
          return (
            <section key={source.key} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="size-4 text-primary" />
                    <h2 className="font-bold text-card-foreground">{source.name}</h2>
                    <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {source.mode}
                    </span>
                  </div>
                  {source.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
                  )}
                </div>
                <form action={refresh}>
                  <input name="key" type="hidden" value={source.key} />
                  <SyncButton />
                </form>
              </div>

              {/* Meta grid */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Dataset</p>
                  <p className="mt-1 text-[13px] font-semibold text-card-foreground">{source.datasetRef ?? "—"}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Cron</p>
                  <p className="mt-1 font-mono text-[13px] font-semibold text-card-foreground">
                    {schedule?.cronExpression ?? "manual"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {schedule?.isActive === false ? "Inativo" : "Ativo"}
                    {schedule?.nextRunAt
                      ? ` · próx. ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(schedule.nextRunAt)}`
                      : " · sem próxima execução"}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Última execução</p>
                  {lastJob ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      {STATUS_ICON[lastJob.status]}
                      <span className="text-[13px] font-semibold text-card-foreground">
                        {STATUS_LABEL[lastJob.status]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        · {lastJob.rowsWritten} linhas
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">Nunca executado</p>
                  )}
                </div>
              </div>

              <form action={updateSchedule} className="mt-4 rounded-md border bg-muted/20 p-3">
                <input name="key" type="hidden" value={source.key} />
                <input name="scheduleId" type="hidden" value={schedule?.id ?? ""} />
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Editar cron
                    </span>
                    <input
                      name="cronExpression"
                      defaultValue={schedule?.cronExpression ?? "*/15 * * * *"}
                      placeholder="*/15 * * * *"
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold">
                    <input name="isActive" type="checkbox" defaultChecked={schedule?.isActive ?? true} />
                    Ativo
                  </label>
                  <SaveScheduleButton />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Use 5 campos cron. Intervalos como */15 * * * * recalculam a proxima execucao automaticamente.
                </p>
              </form>

              {/* Jobs table */}
              {source.syncJobs.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-[12px]">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Job ID</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Status</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Progresso</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Linhas</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Início</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Fim</th>
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Retry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {source.syncJobs.map((job) => (
                        <tr key={job.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono text-muted-foreground">{job.id.slice(0, 8)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {STATUS_ICON[job.status]}
                              <span>{STATUS_LABEL[job.status]}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {job.status === "RUNNING" || job.status === "SUCCESS" ? `${job.progress}%` : "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{job.rowsWritten}</td>
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">
                            {job.startedAt ? fmt.format(job.startedAt) : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">
                            {job.finishedAt ? fmt.format(job.finishedAt) : "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {job.retryCount > 0 ? `${job.retryCount}/${job.maxRetries}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Error message */}
              {lastJob?.errorMessage && (
                <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-[11px] text-primary">
                  {lastJob.errorMessage}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
