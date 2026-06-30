// Mocked clients cannot catch RPC parameter mismatches with migration SQL, so this test reads the migration directly.
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

function extractFunctionParamNames(sql: string, functionName: string): string[] {
  const signatureMatch = sql.match(
    new RegExp(`create or replace function\\s+public\\.${functionName}\\s*\\(([\\s\\S]*?)\\)\\s*\\n?returns`, "i"),
  );

  if (!signatureMatch) {
    throw new Error(`Could not find function signature for ${functionName} in migration SQL.`);
  }

  return signatureMatch[1]
    .split(",")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/)[0]);
}

describe("Supabase RPC contract: approve_reward_redemption", () => {
  it("uses parameter names matching the migration's function signature", () => {
    const migrationSql = readFileSync("supabase/migrations/0001_initial_schema.sql", "utf-8");
    const expectedParamNames = extractFunctionParamNames(migrationSql, "approve_reward_redemption");

    expect(expectedParamNames).toEqual(["redemption_id", "target_status", "allow_overdraw"]);

    const rewardsSource = readFileSync("lib/supabase/rewards.ts", "utf-8");

    for (const paramName of expectedParamNames) {
      expect(rewardsSource).toContain(`${paramName}:`);
    }

    expect(rewardsSource).not.toMatch(/p_reward_redemption_id|p_target_status|p_allow_overdraw/);
  });
});
