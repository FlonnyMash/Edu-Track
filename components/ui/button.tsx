import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}) {
  const variants = {
    default:
      "bg-[var(--accent-pink)] text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,107,157,0.3)]",
    secondary:
      "bg-[var(--accent-teal)] text-[var(--night-purple)] hover:opacity-90",
    outline:
      "border border-[var(--accent-pink)]/40 text-[var(--foreground)] hover:bg-[var(--accent-pink)]/10",
    ghost: "hover:bg-white/10",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    default: "h-11 px-5 py-2 text-sm",
    sm: "h-9 px-3 text-xs",
    lg: "h-13 px-8 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
