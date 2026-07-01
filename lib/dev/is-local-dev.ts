export function isLocalDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}
