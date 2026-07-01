interface AnalyticsStatCardProps {
  label: string;
  value: string | number;
}

export function AnalyticsStatCard({ label, value }: AnalyticsStatCardProps) {
  return (
    <div className="rounded-2xl border border-city-teal/30 bg-city-navy-light p-4 shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-city-muted">
        {label}
      </p>
      <p className="mt-1 bg-linear-to-br from-city-teal to-city-magenta bg-clip-text text-2xl font-extrabold leading-none text-transparent">
        {value}
      </p>
    </div>
  );
}
