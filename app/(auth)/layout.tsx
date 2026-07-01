export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="bg-linear-to-r from-city-magenta to-city-teal bg-clip-text text-2xl font-bold text-transparent">
          Edu Track
        </h1>
      </div>
      {children}
    </div>
  );
}
