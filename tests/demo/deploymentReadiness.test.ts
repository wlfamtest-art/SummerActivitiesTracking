import { describe, expect, it } from "vitest";

import { getDeploymentReadiness } from "../../lib/demo/deploymentReadiness";

describe("deployment readiness", () => {
  it("flags missing public Supabase configuration", () => {
    const checks = getDeploymentReadiness({
      hasSupabaseUrl: false,
      hasSupabaseAnonKey: false,
      hasDemoData: true,
    });

    expect(checks.map((check) => [check.label, check.status])).toEqual([
      ["Local demo storage", "Ready"],
      ["Export backup", "Ready"],
      ["Supabase URL", "Needed"],
      ["Supabase anon key", "Needed"],
      ["Hosted demo path", "Ready"],
    ]);
  });

  it("marks public Supabase configuration as ready when present", () => {
    const checks = getDeploymentReadiness({
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
      hasDemoData: false,
    });

    expect(checks.find((check) => check.label === "Supabase URL")?.status).toBe("Ready");
    expect(checks.find((check) => check.label === "Supabase anon key")?.status).toBe("Ready");
    expect(checks.find((check) => check.label === "Export backup")?.status).toBe("Optional");
  });
});
