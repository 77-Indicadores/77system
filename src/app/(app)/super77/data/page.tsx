import { CheckCircle2, Clock, DatabaseZap, XCircle, Loader2 } from "lucide-react";
import { auth } from "@/auth";
import { SyncButton } from "./sync-button";
import { requirePermission } from "@/domains/rbac/guards";
import { listDataOperations, queueDataSync } from "@/domains/data/service";
import { auditLog } from "@/domains/super77/audit";

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
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Super77</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Dados e Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fontes de dados, agendamentos e histórico de sincronização.
        </p>
      </div>

      <div className="grid gap-4">
        {sources.map((source) => {
          const lastJob = source.syncJobs[0];
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
                    {source.schedules[0]?.cronExpression ?? "manual"}
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
                        <th scope="col" className="px-3 py-2 font-bold text-muted-foreground">Iniciado</th>
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
                            {job.status === "RUNNING" ? `${job.progress}%` : "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{job.rowsWritten}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {job.startedAt
                              ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(job.startedAt)
                              : "—"}
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
