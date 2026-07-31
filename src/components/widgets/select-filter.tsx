"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = { label: string; value: string };

/**
 * Single-select filter dropdown — opaque, keyboard-accessible.
 * Replaces native <select> in dashboard filter bars.
 */
export function SelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 min-w-[110px] items-center justify-between gap-2 rounded-md border bg-card px-3 text-[12px] font-medium text-card-foreground shadow-sm hover:bg-muted/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}:
        </span>
        <span className="font-semibold">{selected?.label ?? "—"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-full overflow-auto rounded-md border bg-card shadow-lg"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] hover:bg-muted/50"
            >
              <Check className={`h-3.5 w-3.5 flex-shrink-0 ${opt.value === value ? "text-primary" : "text-transparent"}`} />
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
