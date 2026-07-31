"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface Screen {
  slug: string;
  name: string;
}

interface Group {
  slug: string;
  name: string;
  screens: Screen[];
}

interface FocusNavProps {
  groups: Group[];
  currentScreenSlug: string;
  currentScreenName: string;
  currentGroupSlug: string;
}

export function FocusNav({ groups, currentScreenSlug, currentScreenName, currentGroupSlug }: FocusNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(currentGroupSlug);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close when navigating
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
      >
        {currentScreenName}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.3)" }}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed left-0 top-11 z-50 flex w-64 flex-col overflow-hidden transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          borderBottom: "1px solid var(--sidebar-border)",
          maxHeight: "calc(100vh - 44px)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "var(--sidebar-muted)" }}
          >
            Telas
          </p>
          <button
            onClick={() => setOpen(false)}
            className="grid size-6 place-items-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: "var(--sidebar-muted)" }}
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto py-2">
          {groups.map((group) => {
            const isExpanded = expandedGroup === group.slug;
            return (
              <div key={group.slug}>
                {/* Group header */}
                <button
                  onClick={() => setExpandedGroup(isExpanded ? "" : group.slug)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <span
                    className="text-[12px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: isExpanded ? "var(--sidebar-text-active)" : "var(--sidebar-muted)" }}
                  >
                    {group.name}
                  </span>
                  <ChevronRight
                    className={`size-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    style={{ color: "var(--sidebar-muted)" }}
                  />
                </button>

                {/* Screen list */}
                {isExpanded && (
                  <div className="pb-2">
                    {group.screens.map((s) => {
                      const isActive = s.slug === currentScreenSlug;
                      return (
                        <Link
                          key={s.slug}
                          href={`/dashboard/${s.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative flex items-center px-6 py-2 text-[13px] font-medium transition-colors"
                          style={{
                            color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                            background: isActive ? "var(--sidebar-accent-dim)" : undefined,
                          }}
                        >
                          {isActive && (
                            <span
                              className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                              style={{ background: "var(--sidebar-accent)" }}
                            />
                          )}
                          {s.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
