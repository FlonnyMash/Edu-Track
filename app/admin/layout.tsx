export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-dvh px-4 py-8">{children}</div>
  );
}
