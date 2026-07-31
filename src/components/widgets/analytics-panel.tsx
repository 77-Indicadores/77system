import type { ReactNode } from "react";

export function AnalyticsPanel({
  title,
  subtitle,
  legend,
  children,
  className = ""
}: {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border bg-card ${className}`}>
      <header className="flex min-h-10 items-start justify-between gap-4 border-b px-4 py-2.5">
        <div className="border-l-[3px] border-primary pl-3">
          <h2 className="text-[13px] font-bold leading-tight text-card-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p> : null}
        </div>
        {legend ? <div className="shrink-0 text-[11px] text-muted-foreground">{legend}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
