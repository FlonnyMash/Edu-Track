export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-teal)] bg-clip-text text-transparent">
          Edu Track
        </h1>
      </div>
      {children}
    </main>
  );
}
