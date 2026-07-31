import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRegistryRecord, getRegistry, parseRegistrySchema, type RegistryField } from "@/domains/registries/service";

export default async function RegistryDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const registry = await getRegistry(key);
  if (!registry) notFound();

  const schema = parseRegistrySchema(registry.schemaJson);

  async function create(formData: FormData) {
    "use server";
    const payload = Object.fromEntries(
      schema.fields.map((field) => [field.name, coerceFieldValue(field, formData.get(field.name))])
    );
    await createRegistryRecord(key, payload);
    redirect(`/registries/${key}`);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 ">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              aria-label="Voltar para cadastros"
              className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg border bg-card hover:bg-muted"
              href="/registries"
              title="Voltar para cadastros"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{BRAND.name} › cadastros › {registry.key}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{registry.name}</h1>
              <p className="text-sm text-muted-foreground">{registry.description}</p>
            </div>
          </div>
          <span className="rounded-full border bg-muted px-3 py-1 text-xs font-semibold">{registry.records.length} registros</span>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 ">
        <h2 className="text-sm font-black">Novo registro</h2>
        <form action={create} className="mt-4 grid gap-3 lg:grid-cols-4">
          {schema.fields.map((field) => (
            <FieldInput field={field} key={field.name} />
          ))}
          <Button className="h-10 self-end" type="submit">
            <Plus className="mr-2 size-4" /> Adicionar
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card ">
        <header className="border-b px-5 py-4">
          <h2 className="text-sm font-black">Registros</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                {schema.fields.map((field) => (
                  <th className="px-5 py-3" key={field.name}>{field.label ?? field.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registry.records.length === 0 ? (
                <tr><td className="px-5 py-5 text-muted-foreground" colSpan={schema.fields.length}>Nenhum registro ainda.</td></tr>
              ) : registry.records.map((record) => {
                const data = record.dataJson as Record<string, unknown>;
                return (
                  <tr className="border-b last:border-0" key={record.id}>
                    {schema.fields.map((field) => (
                      <td className="px-5 py-3" key={field.name}>{formatCell(data[field.name])}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FieldInput({ field }: { field: RegistryField }) {
  if (field.type === "boolean") {
    return (
      <label className="flex h-10 items-center gap-2 self-end rounded-md border px-3 text-sm">
        <input defaultChecked={Boolean(field.default)} name={field.name} type="checkbox" />
        {field.label ?? field.name}
      </label>
    );
  }

  const type = field.type === "date" ? "date" : field.type === "decimal" || field.type === "integer" ? "number" : "text";

  return (
    <label className="text-sm font-medium">
      <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted-foreground">{field.label ?? field.name}</span>
      <Input name={field.name} required={field.required} step={field.type === "decimal" ? "0.01" : undefined} type={type} />
    </label>
  );
}

function coerceFieldValue(field: RegistryField, value: FormDataEntryValue | null) {
  if (field.type === "boolean") return value === "on";
  if (field.type === "integer") return Number.parseInt(String(value ?? 0), 10);
  if (field.type === "decimal") return Number(String(value ?? 0));
  return String(value ?? "");
}

function formatCell(value: unknown) {
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}
