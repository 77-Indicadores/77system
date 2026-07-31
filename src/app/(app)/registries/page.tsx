import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { listRegistries, parseRegistrySchema } from "@/domains/registries/service";

export default async function RegistriesPage() {
  const registries = await listRegistries();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground">77System &gt; cadastros</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Cadastros</h1>
        <p className="text-sm text-muted-foreground">Modulos declarativos para substituir planilhas auxiliares e alimentar indicadores.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {registries.map((registry) => {
          const schema = parseRegistrySchema(registry.schemaJson);
          return (
            <Link className="group rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" href={`/registries/${registry.key}`} key={registry.key}>
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-lg bg-slate-950 text-white">
                  <Database className="size-5" />
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-5 text-lg font-black">{registry.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{registry.description}</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full border px-3 py-1">{schema.fields.length} campos</span>
                <span className="rounded-full border px-3 py-1">{registry.records.length} registros recentes</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
