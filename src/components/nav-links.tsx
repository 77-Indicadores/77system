"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, Star, Users } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const baseItems: NavItem[] = [
  { href: "/dashboard", label: "Indicadores", icon: <BarChart3 className="size-4" /> },
  { href: "/registries", label: "Cadastros", icon: <Database className="size-4" /> },
  { href: "/users", label: "Usuários", icon: <Users className="size-4" /> },
];

const super77Item: NavItem = {
  href: "/super77",
  label: "Super77",
  icon: <Star className="size-4" />,
};

export function NavLinks({ canSuper77 }: { canSuper77: boolean }) {
  const pathname = usePathname();
  const mainItems = baseItems;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4" aria-label="Navegação principal">
      <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[--sidebar-muted]">
        Principal
      </p>
      {mainItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "sidebar-nav-item-active bg-[--sidebar-accent-dim] text-[--sidebar-text-active]"
                : "text-[--sidebar-text] hover:bg-white/5 hover:text-[#c8cce0]"
            }`}
            style={
              active
                ? { background: "var(--sidebar-accent-dim)", color: "var(--sidebar-text-active)" }
                : undefined
            }
          >
            <span className={active ? "opacity-100" : "opacity-60"}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      {canSuper77 && (
        <>
          <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[--sidebar-muted]">
            Equipe 77
          </p>
          {(() => {
            const active = isActive(super77Item.href);
            return (
              <Link
                href={super77Item.href}
                className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "sidebar-nav-item-active"
                    : "text-[--sidebar-text] hover:bg-white/5 hover:text-[#c8cce0]"
                }`}
                style={
                  active
                    ? { background: "var(--sidebar-accent-dim)", color: "var(--sidebar-text-active)" }
                    : undefined
                }
              >
                <span className={active ? "opacity-100" : "opacity-60"}>{super77Item.icon}</span>
                {super77Item.label}
              </Link>
            );
          })()}
        </>
      )}
    </nav>
  );
}
