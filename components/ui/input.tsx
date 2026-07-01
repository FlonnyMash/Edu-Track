import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm placeholder:text-white/40 focus:border-[var(--accent-teal)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-teal)]/30",
        className
      )}
      {...props}
    />
  );
}
