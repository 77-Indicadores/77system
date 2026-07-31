import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helperText?: string;
};

export function Input({ className, error, helperText, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors",
          "placeholder:text-muted-foreground/60",
          "focus:ring-2 focus:ring-primary focus:border-primary",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>}
    </div>
  );
}
