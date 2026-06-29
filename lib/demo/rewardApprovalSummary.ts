export type RewardApprovalSummary = {
  coinBalance: number;
  rewardCost: number;
  projectedBalance: number;
  willOverdraw: boolean;
};

export function getRewardApprovalSummary({
  coinBalance,
  rewardCost,
}: {
  coinBalance: number;
  rewardCost: number;
}): RewardApprovalSummary {
  const projectedBalance = coinBalance - rewardCost;

  return {
    coinBalance,
    rewardCost,
    projectedBalance,
    willOverdraw: projectedBalance < 0,
  };
}
