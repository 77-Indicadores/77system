"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, Star, Users } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={() => { if (!active) window.dispatchEvent(new Event("nav:start")); }}
      className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "sidebar-nav-item-active bg-[--sidebar-accent-dim] text-[--sidebar-text-active]"
          : "text-[--sidebar-text] hover:bg-white/5 hover:text-[#c8cce0]"
      }`}
      style={active ? { background: "var(--sidebar-accent-dim)", color: "var(--sidebar-text-active)" } : undefined}
    >
      <span className={active ? "opacity-100" : "opacity-60"}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export function NavLinks({
  canSuper77,
  canManageUsers,
  canIndicators,
  canRegistries,
}: {
  canSuper77: boolean;
  canManageUsers: boolean;
  canIndicators: boolean;
  canRegistries: boolean;
}) {
  const mainItems: NavItem[] = [
    canIndicators && { href: "/dashboard", label: "Indicadores", icon: <BarChart3 className="size-4" /> },
    canRegistries && { href: "/registries", label: "Cadastros", icon: <Database className="size-4" /> },
  ].filter(Boolean) as NavItem[];

  const adminItems: NavItem[] = [
    canManageUsers && { href: "/users", label: "Usuários", icon: <Users className="size-4" /> },
    canSuper77 && { href: "/super77", label: "Super77", icon: <Star className="size-4" /> },
  ].filter(Boolean) as NavItem[];

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4" aria-label="Navegação principal">
      {mainItems.length > 0 && (
        <>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[--sidebar-muted]">
            Principal
          </p>
          {mainItems.map((item) => <NavLink key={item.href} item={item} />)}
        </>
      )}

      {adminItems.length > 0 && (
        <>
          <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[--sidebar-muted]">
            Equipe 77
          </p>
          {adminItems.map((item) => <NavLink key={item.href} item={item} />)}
        </>
      )}
    </nav>
  );
}
