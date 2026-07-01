import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 focus:border-[var(--accent-teal)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-teal)]/30",
        className
      )}
      {...props}
    />
  );
}
