import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { listRegistries, parseRegistrySchema } from "@/domains/registries/service";

export default async function RegistriesPage() {
  const registries = await listRegistries();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Cadastros</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Módulos de cadastro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Módulos declarativos para substituir planilhas auxiliares e alimentar indicadores.
        </p>
      </div>

      {registries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Database className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum módulo de cadastro ativo.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Adicione um <code className="font-mono">RegistryDefinition</code> via seed ou API.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {registries.map((registry) => {
            const schema = parseRegistrySchema(registry.schemaJson);
            return (
              <Link
                key={registry.key}
                href={`/registries/${registry.key}`}
                className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Database className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h2 className="mt-4 text-[15px] font-black text-card-foreground">{registry.name}</h2>
                <p className="mt-1 min-h-9 text-[12px] text-muted-foreground">{registry.description}</p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span className="rounded-full border bg-muted/50 px-2.5 py-0.5">{schema.fields.length} campos</span>
                  <span className="rounded-full border bg-muted/50 px-2.5 py-0.5">{registry.records.length} registros</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
