import { describe, expect, it, vi } from "vitest";

import { approveRewardRedemption } from "../../lib/supabase/rewards";

function createClient(data: unknown, error: unknown = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe("Supabase reward approvals", () => {
  it("approves reward redemptions through the RPC and returns the first array row", async () => {
    const row = { id: "redemption-1", status: "approved", child_id: "child-1" };
    const client = createClient([row]);

    await expect(approveRewardRedemption(client as any, "redemption-1", "approved", false)).resolves.toEqual(row);
    expect(client.rpc).toHaveBeenCalledWith("approve_reward_redemption", {
      p_reward_redemption_id: "redemption-1",
      p_target_status: "approved",
      p_allow_overdraw: false,
    });
  });

  it("returns a single row result from the RPC", async () => {
    const row = { id: "redemption-2", status: "approved_for_later", child_id: "child-1" };
    const client = createClient(row);

    await expect(approveRewardRedemption(client as any, "redemption-2", "approved_for_later", true)).resolves.toEqual(row);
  });

  it("throws the Supabase RPC error message", async () => {
    const client = createClient(null, { message: "Approving this reward would reduce the coin balance below zero." });

    await expect(approveRewardRedemption(client as any, "redemption-3", "approved", false)).rejects.toThrow(
      "Approving this reward would reduce the coin balance below zero.",
    );
  });

  it("throws when the RPC does not return a row", async () => {
    const client = createClient([]);

    await expect(approveRewardRedemption(client as any, "redemption-4", "approved", false)).rejects.toThrow(
      "Reward redemption approval did not return a result.",
    );
  });
});
