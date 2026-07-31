import { requirePermission } from "@/domains/rbac/guards";
import { checkCatworldHealth, getCatworldConfig } from "@/domains/integrations/catworld";

export default async function CatworldPage() {
  await requirePermission("integrations.catworld.view");
  const [health, config] = await Promise.all([checkCatworldHealth(), Promise.resolve(getCatworldConfig())]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catworld</h1>
        <p className="text-sm text-muted-foreground">Diagnóstico da integração. Configuração via variáveis de ambiente.</p>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Status do serviço</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <StatusRow label="catworld-service" value={health} ok={health === "online"} />
          <StatusRow label="CATWORLD_BASE_URL" value={config.baseUrl || "não definido"} ok={config.baseUrl.length > 0} />
          <StatusRow label="CATWORLD_TOKEN" value={config.token ? "configurado" : "não definido"} ok={config.token.length > 0} />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Como configurar</h2>
        <pre className="mt-3 rounded bg-muted p-3 text-xs leading-relaxed">{`# .env (ou variáveis do container)\nCATWORLD_BASE_URL="https://catworld.exemplo.com"\nCATWORLD_TOKEN="seu-token-aqui"`}</pre>
        <p className="mt-2 text-xs text-muted-foreground">Reinicie o serviço após alterar as variáveis.</p>
      </section>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border px-3 py-2">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${ok ? "text-green-700" : "text-red-600"}`}>{value}</span>
    </div>
  );
}
