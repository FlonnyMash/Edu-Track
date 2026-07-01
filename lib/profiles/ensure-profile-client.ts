export async function ensureProfileSession(): Promise<void> {
  await fetch("/api/profile/ensure", { method: "POST" });
}
