"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import { BRAND } from "@/lib/brand";

const SECTION_LABELS: Record<string, string> = {
  "/dashboard": "Indicadores",
  "/registries": "Cadastros",
  "/users": "Usuários",
  "/super77": "Super77",
};

function useBreadcrumb() {
  const pathname = usePathname();
  for (const [prefix, label] of Object.entries(SECTION_LABELS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "";
}

function useIsDashboardScreen() {
  const pathname = usePathname();
  // /dashboard/[slug] — not the index /dashboard
  return pathname.startsWith("/dashboard/");
}

interface AppShellProps {
  children: React.ReactNode;
  canSuper77: boolean;
  canManageUsers: boolean;
  canIndicators: boolean;
  canRegistries: boolean;
  userName: string;
  userInitials: string;
  onLogout: () => Promise<void>;
}

export function AppShell({ children, canSuper77, canManageUsers, canIndicators, canRegistries, userName, userInitials, onLogout }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumb = useBreadcrumb();
  const isFocusMode = useIsDashboardScreen();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Focus mode: sidebar-less, page owns its own topbar ──
  if (isFocusMode) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // ── Normal mode: sidebar layout ──
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-primary-foreground"
      >
        Ir para conteúdo principal
      </a>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] shrink-0 flex-col transition-transform duration-200 md:relative md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        {/* Close button – mobile only */}
        <button
          aria-label="Fechar menu"
          className="absolute right-3 top-3 grid size-7 place-items-center rounded-md transition-colors hover:bg-white/10 md:hidden"
          style={{ color: "var(--sidebar-muted)" }}
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-4" />
        </button>

        {/* Logo */}
        <Link
          href="/dashboard"
          className="block shrink-0 px-6 py-7"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <div
            className="text-[2.25rem] font-black leading-none tracking-[-0.06em] text-white"
            aria-label={BRAND.name}
          >
            {BRAND.short.slice(0, -1)}<span style={{ color: "var(--sidebar-accent)" }}>{BRAND.short.slice(-1)}</span>
          </div>
          <p
            className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "var(--sidebar-muted)" }}
          >
            {BRAND.name}
          </p>
        </Link>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <NavLinks
            canSuper77={canSuper77}
            canManageUsers={canManageUsers}
            canIndicators={canIndicators}
            canRegistries={canRegistries}
          />
        </div>

        {/* User footer */}
        <div style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
            <div
              className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "var(--sidebar-accent)" }}
            >
              {userInitials}
            </div>
            <p
              className="truncate text-[12px] font-semibold"
              style={{ color: "var(--sidebar-text)" }}
              title={userName}
            >
              {userName}
            </p>
          </div>
          <form action={onLogout} className="px-3 pb-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-muted)" }}
            >
              <LogOut className="size-3.5 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Content column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex h-12 shrink-0 items-center gap-3 border-b px-4 md:px-6"
          style={{ background: "hsl(var(--card))" }}
        >
          <button
            aria-label="Abrir menu"
            className="grid size-11 shrink-0 place-items-center rounded-md border transition-colors hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </button>

          {breadcrumb && (
            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="font-medium text-muted-foreground">{BRAND.name}</span>
              <span className="text-muted-foreground/40">›</span>
              <span className="truncate font-semibold text-foreground">{breadcrumb}</span>
            </div>
          )}
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 2xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
