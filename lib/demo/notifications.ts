import type { QuestInstanceStatus, RewardRedemptionStatus } from "../game/types";

interface NotificationQuestInstance {
  id: string;
  name: string;
  status: QuestInstanceStatus;
  completed_at: string | null;
  denied_at: string | null;
  updated_at: string;
  xp_value: number;
  coin_value: number;
}

interface NotificationReward {
  id: string;
  name: string;
}

interface NotificationRedemption {
  id: string;
  reward_id: string;
  status: RewardRedemptionStatus;
  resolved_at: string | null;
  updated_at: string;
}

export interface KidNotification {
  id: string;
  kind: "approval" | "denial" | "reward";
  title: string;
  message: string;
  timestamp: string;
}

export interface KidNotificationsInput {
  questInstances: readonly NotificationQuestInstance[];
  rewards: readonly NotificationReward[];
  redemptions: readonly NotificationRedemption[];
  limit?: number;
}

export function getKidNotifications(input: KidNotificationsInput): KidNotification[] {
  const rewardsById = new Map(input.rewards.map((reward) => [reward.id, reward]));
  const questNotifications = input.questInstances.flatMap((instance): KidNotification[] => {
    if (instance.status === "completed" && instance.completed_at) {
      return [
        {
          id: `quest-approved-${instance.id}`,
          kind: "approval",
          title: "Quest approved",
          message: `${instance.name} was approved. You earned ${instance.xp_value} XP and ${instance.coin_value} Gold Coins.`,
          timestamp: instance.completed_at,
        },
      ];
    }

    if (instance.status === "denied" && instance.denied_at) {
      return [
        {
          id: `quest-denied-${instance.id}`,
          kind: "denial",
          title: "Try again",
          message: `${instance.name} needs another try. Check with your parent if you have questions!`,
          timestamp: instance.denied_at,
        },
      ];
    }

    return [];
  });

  const rewardNotifications = input.redemptions.flatMap((redemption): KidNotification[] => {
    const rewardName = rewardsById.get(redemption.reward_id)?.name ?? "Reward";
    const timestamp = redemption.resolved_at ?? redemption.updated_at;

    if (redemption.status === "approved" || redemption.status === "approved_for_later") {
      return [
        {
          id: `reward-approved-${redemption.id}`,
          kind: "reward",
          title: "Treasure approved",
          message:
            redemption.status === "approved_for_later"
              ? `${rewardName} was approved for later from the Treasure Chest.`
              : `${rewardName} was approved from the Treasure Chest.`,
          timestamp,
        },
      ];
    }

    if (redemption.status === "denied") {
      return [
        {
          id: `reward-denied-${redemption.id}`,
          kind: "denial",
          title: "Treasure update",
          message: `${rewardName} was not approved this time. No Gold Coins were spent.`,
          timestamp,
        },
      ];
    }

    return [];
  });

  return [...questNotifications, ...rewardNotifications]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, input.limit ?? 5);
}
