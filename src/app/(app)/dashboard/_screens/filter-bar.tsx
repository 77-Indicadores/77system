"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Loader2 } from "lucide-react";

type SelectOption = { value: string; label: string };

type FilterField =
  | { type: "select"; key: string; placeholder: string; options: SelectOption[]; defaultValue?: string }
  | { type: "text";   key: string; placeholder: string; defaultValue?: string };

export function FilterBar({ fields }: { fields: FilterField[] }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => { router.push(`${pathname}?${next.toString()}`); });
    },
    [router, pathname, params],
  );

  const hasAny = fields.some((f) => params.get(f.key) && params.get(f.key) !== f.defaultValue);

  return (
    <div className={`flex flex-wrap items-center gap-2 transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {fields.map((f) => {
        const val = params.get(f.key) ?? f.defaultValue ?? "";
        if (f.type === "select") {
          return (
            <select
              key={f.key}
              value={val}
              onChange={(e) => set(f.key, e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-[12px] outline-none focus:border-primary"
            >
              <option value="">{f.placeholder}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={f.key}
            type="search"
            value={val}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="h-8 w-48 rounded-md border bg-background px-2 text-[12px] outline-none focus:border-primary"
          />
        );
      })}
      {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}

      {hasAny && !isPending && (
        <button
          onClick={() => {
            const next = new URLSearchParams();
            startTransition(() => { router.push(`${pathname}?${next.toString()}`); });
          }}
          className="h-8 rounded-md border px-3 text-[12px] text-muted-foreground hover:bg-muted"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
