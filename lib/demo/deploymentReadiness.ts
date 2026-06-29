export type DeploymentReadinessStatus = "Ready" | "Needed" | "Optional";

export interface DeploymentReadinessInput {
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  hasDemoData: boolean;
}

export interface DeploymentReadinessCheck {
  label: string;
  status: DeploymentReadinessStatus;
  detail: string;
}

export function getDeploymentReadiness(input: DeploymentReadinessInput): DeploymentReadinessCheck[] {
  return [
    {
      label: "Local demo storage",
      status: "Ready",
      detail: "Progress stays in this browser for MVP testing.",
    },
    {
      label: "Export backup",
      status: input.hasDemoData ? "Ready" : "Optional",
      detail: input.hasDemoData
        ? "Download a JSON snapshot before demos, resets, or hosting tests."
        : "Create a demo family before exporting a backup.",
    },
    {
      label: "Supabase URL",
      status: input.hasSupabaseUrl ? "Ready" : "Needed",
      detail: "Set NEXT_PUBLIC_SUPABASE_URL before connecting hosted persistence.",
    },
    {
      label: "Supabase anon key",
      status: input.hasSupabaseAnonKey ? "Ready" : "Needed",
      detail: "Set NEXT_PUBLIC_SUPABASE_ANON_KEY for browser-safe Supabase access.",
    },
    {
      label: "Hosted demo path",
      status: "Ready",
      detail: "The Next.js app builds cleanly and can run as a hosted demo.",
    },
  ];
}
