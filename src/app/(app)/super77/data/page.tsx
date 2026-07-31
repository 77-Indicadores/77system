import { Clock, DatabaseZap, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { requirePermission } from "@/domains/rbac/guards";
import { listDataOperations, queueDataSync } from "@/domains/data/service";
import { auditLog } from "@/domains/super77/audit";

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
        <h1 className="text-2xl font-semibold">Dados e Refresh</h1>
        <p className="text-sm text-muted-foreground">Staging, materializacao e agendamentos que protegem a experiencia do usuario.</p>
      </div>
      <div className="grid gap-4">
        {sources.map((source) => (
          <section key={source.key} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <DatabaseZap className="size-4 text-primary" />
                  <h2 className="font-semibold">{source.name}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
              </div>
              <form action={refresh}>
                <input name="key" type="hidden" value={source.key} />
                <Button type="submit" variant="outline">
                  <RefreshCcw className="mr-2 size-4" /> Refresh
                </Button>
              </form>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Modo</p>
                <strong>{source.mode}</strong>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Dataset</p>
                <strong>{source.datasetRef ?? "n/a"}</strong>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> Cron</p>
                <strong>{source.schedules[0]?.cronExpression ?? "manual"}</strong>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr><th className="py-2">Job</th><th>Status</th><th>Progresso</th><th>Linhas</th></tr>
                </thead>
                <tbody>
                  {source.syncJobs.length === 0 ? (
                    <tr><td className="py-3 text-muted-foreground" colSpan={4}>Nenhum job executado ainda.</td></tr>
                  ) : source.syncJobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="py-2">{job.id.slice(0, 8)}</td>
                      <td>{job.status}</td>
                      <td>{job.progress}%</td>
                      <td>{job.rowsWritten}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
