import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
};

export function Button({ className, variant = "default", size = "default", loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "default" && "h-10 px-4 text-sm",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "lg" && "h-11 px-6 text-base",
        variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" && "border bg-card hover:bg-muted",
        variant === "ghost" && "hover:bg-muted",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
