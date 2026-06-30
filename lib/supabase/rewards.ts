import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseRewardApprovalStatus = "approved" | "approved_for_later";
export type SupabaseRewardRedemptionRow = Record<string, unknown>;

type RpcClient = Pick<SupabaseClient, "rpc">;

export async function approveRewardRedemption(
  client: RpcClient,
  rewardRedemptionId: string,
  targetStatus: SupabaseRewardApprovalStatus,
  allowOverdraw = false,
): Promise<SupabaseRewardRedemptionRow> {
  const { data, error } = await client.rpc("approve_reward_redemption", {
    p_reward_redemption_id: rewardRedemptionId,
    p_target_status: targetStatus,
    p_allow_overdraw: allowOverdraw,
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Reward redemption approval did not return a result.");
  }

  return row as SupabaseRewardRedemptionRow;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Supabase reward approval failed.";
}
