import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Sakelar (toggle) — checkbox asli yang disembunyikan secara visual, jadi tetap
 * bisa dipakai keyboard/pembaca layar & klik label, tampil sebagai toggle.
 */
export function Switch({
  className,
  size = "md",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & { size?: "sm" | "md" }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          "bg-input peer-checked:bg-primary peer-focus-visible:ring-ring rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:bg-white after:shadow after:transition-transform",
          size === "md"
            ? "h-6 w-11 after:size-5 peer-checked:after:translate-x-5"
            : "h-5 w-9 after:size-4 peer-checked:after:translate-x-4",
        )}
      />
    </span>
  );
}
