import type { ApprovalMode, QuestInstanceStatus, RewardRedemptionStatus } from "../game/types";

interface ReviewQuestInstance {
  id: string;
  name: string;
  approval_mode: ApprovalMode;
  status: QuestInstanceStatus;
  completed_at: string | null;
  denied_at: string | null;
  updated_at: string;
  xp_value: number;
  coin_value: number;
}

interface ReviewReward {
  id: string;
  name: string;
}

interface ReviewRedemption {
  id: string;
  reward_id: string;
  status: RewardRedemptionStatus;
  cost: number;
  requested_at: string;
  resolved_at: string | null;
  updated_at: string;
}

export interface ParentReviewHistoryInput {
  questInstances: readonly ReviewQuestInstance[];
  rewards: readonly ReviewReward[];
  redemptions: readonly ReviewRedemption[];
  limit?: number;
}

export interface ParentReviewHistoryItem {
  id: string;
  kind: "quest" | "reward";
  title: string;
  outcome: "approved" | "approved_for_later" | "denied";
  detail: string;
  timestamp: string;
}

export function getParentReviewHistory(input: ParentReviewHistoryInput): ParentReviewHistoryItem[] {
  const rewardsById = new Map(input.rewards.map((reward) => [reward.id, reward]));
  const questHistory = input.questInstances.flatMap((instance): ParentReviewHistoryItem[] => {
    if (instance.approval_mode !== "parent") {
      return [];
    }

    if (instance.status === "completed" && instance.completed_at) {
      return [
        {
          id: `quest-approved-${instance.id}`,
          kind: "quest",
          title: instance.name,
          outcome: "approved",
          detail: `Approved. ${instance.xp_value} XP and ${instance.coin_value} coins awarded.`,
          timestamp: instance.completed_at,
        },
      ];
    }

    if (instance.status === "denied" && instance.denied_at) {
      return [
        {
          id: `quest-denied-${instance.id}`,
          kind: "quest",
          title: instance.name,
          outcome: "denied",
          detail: "Denied. No XP or coins awarded.",
          timestamp: instance.denied_at,
        },
      ];
    }

    return [];
  });
  const rewardHistory = input.redemptions.flatMap((redemption): ParentReviewHistoryItem[] => {
    const rewardName = rewardsById.get(redemption.reward_id)?.name ?? "Reward";
    const timestamp = redemption.resolved_at ?? redemption.updated_at;

    if (redemption.status === "approved") {
      return [
        {
          id: `reward-approved-${redemption.id}`,
          kind: "reward",
          title: rewardName,
          outcome: "approved",
          detail: `Approved. ${redemption.cost} coins spent.`,
          timestamp,
        },
      ];
    }

    if (redemption.status === "approved_for_later") {
      return [
        {
          id: `reward-approved-later-${redemption.id}`,
          kind: "reward",
          title: rewardName,
          outcome: "approved_for_later",
          detail: `Approved for later. ${redemption.cost} coins reserved.`,
          timestamp,
        },
      ];
    }

    if (redemption.status === "denied") {
      return [
        {
          id: `reward-denied-${redemption.id}`,
          kind: "reward",
          title: rewardName,
          outcome: "denied",
          detail: "Denied. No coins spent.",
          timestamp,
        },
      ];
    }

    return [];
  });

  return [...questHistory, ...rewardHistory]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, input.limit ?? 6);
}
