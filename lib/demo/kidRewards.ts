export type KidVisibleReward = {
  active: boolean;
};

export function getKidVisibleRewards<TReward extends KidVisibleReward>(rewards: readonly TReward[]): TReward[] {
  return rewards.filter((reward) => reward.active);
}
