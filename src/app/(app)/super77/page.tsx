import Link from "next/link";
import { DatabaseZap, Plug, Users } from "lucide-react";
import { requirePermission } from "@/domains/rbac/guards";

const cards = [
  {
    href: "/super77/catworld",
    icon: <Plug className="size-5" />,
    title: "Catworld",
    description: "Diagnostico da integracao e status do servico.",
  },
  {
    href: "/super77/data",
    icon: <DatabaseZap className="size-5" />,
    title: "Dados e Jobs",
    description: "Staging, materializacao, cron e historico de execucoes.",
  },
  {
    href: "/users",
    icon: <Users className="size-5" />,
    title: "Usuarios",
    description: "Gestao de usuarios, papeis e politicas de recurso.",
  },
];

export default async function Super77Page() {
  await requirePermission("super77.access");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Super77</h1>
        <p className="text-sm text-muted-foreground">Area tecnica para integracoes, jobs e diagnosticos.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm hover:bg-muted"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
              {card.icon}
            </div>
            <div>
              <h2 className="font-semibold">{card.title}</h2>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
