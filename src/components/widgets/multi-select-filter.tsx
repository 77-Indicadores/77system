"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export type SelectOption = { label: string; value: string };

/**
 * Multi-select filter with checkboxes, "All" shortcut and selected count badge.
 * Use for dimensions: empresa, obra, cliente, conta, fornecedor.
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
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

  const allSelected = value.length === 0 || value.length === options.length;

  function toggle(v: string) {
    if (value.includes(v)) {
      const next = value.filter((x) => x !== v);
      onChange(next.length === options.length || next.length === 0 ? [] : next);
    } else {
      const next = [...value, v];
      onChange(next.length === options.length ? [] : next);
    }
  }

  const displayLabel = allSelected
    ? "Todos"
    : value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? "1 selecionado"
      : `${value.length} selecionados`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 min-w-[120px] items-center justify-between gap-2 rounded-md border bg-card px-3 text-[12px] font-medium text-card-foreground shadow-sm hover:bg-muted/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}:
        </span>
        <span className="font-semibold">{displayLabel}</span>
        {!allSelected && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-card shadow-lg">
          <div className="border-b px-3 py-2">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {allSelected ? "Todos selecionados" : "Selecionar todos"}
            </button>
          </div>
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
            {options.map((opt) => {
              const checked = allSelected || value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(opt.value)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] hover:bg-muted/50"
                >
                  <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
