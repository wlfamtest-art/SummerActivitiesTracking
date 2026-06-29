const PRIVATE_KEYS = new Set(["childName", "parentNote", "denialNote", "rewardDescription"]);

export function track(eventName: string, properties: Record<string, unknown> = {}): void {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") {
    return;
  }

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => !PRIVATE_KEYS.has(key)),
  );

  globalThis.dispatchEvent?.(
    new CustomEvent("summer-quest-analytics", {
      detail: { eventName, properties: safeProperties },
    }),
  );
}
