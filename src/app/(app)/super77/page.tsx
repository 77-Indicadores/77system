import Link from "next/link";
import { DatabaseZap, Plug } from "lucide-react";
import { requirePermission } from "@/domains/rbac/guards";

const cards = [
  {
    href: "/super77/catworld",
    icon: <Plug className="size-5" />,
    title: "Catworld",
    description: "Diagnóstico da integração e status do serviço.",
  },
  {
    href: "/super77/data",
    icon: <DatabaseZap className="size-5" />,
    title: "Dados e Jobs",
    description: "Staging, materialização, cron e histórico de execuções.",
  },
];

export default async function Super77Page() {
  await requirePermission("super77.access");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Área técnica</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Super77</h1>
        <p className="mt-1 text-sm text-muted-foreground">Integrações, jobs de dados e diagnósticos de sistema.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              {card.icon}
            </div>
            <div>
              <h2 className="font-bold text-card-foreground">{card.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
