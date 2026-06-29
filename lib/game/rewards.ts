import type {
  ApprovalMode,
  QuestInstanceStatus,
  RewardRedemptionStatus,
} from "./types";

export interface RewardQuestInstance {
  id: string;
  assigned_quest_id: string;
  child_id: string;
  quest_date: string;
  name: string;
  approval_mode: ApprovalMode;
  xp_value: number;
  coin_value: number;
  status: QuestInstanceStatus;
  submitted_at: string | null;
  completed_at: string | null;
  denied_at: string | null;
  updated_at: string;
}

export interface RewardXpTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface RewardCoinTransaction {
  id: string;
  child_id: string;
  quest_instance_id: string | null;
  reward_redemption_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
}

export interface QuestAwardInput {
  instance: RewardQuestInstance;
  xpTransactions: readonly RewardXpTransaction[];
  coinTransactions: readonly RewardCoinTransaction[];
  now?: string;
}

export interface QuestAwardResult {
  instance: RewardQuestInstance;
  xpTransactions: RewardXpTransaction[];
  coinTransactions: RewardCoinTransaction[];
  awarded: boolean;
}

export interface RetryDeniedQuestInput {
  instance: RewardQuestInstance;
  now?: string;
}

export interface RewardCatalogItem {
  id: string;
  child_id: string;
  name: string;
  cost: number;
  active: boolean;
}

export interface RewardRedemptionSnapshot {
  id: string;
  reward_id: string;
  child_id: string;
  status: RewardRedemptionStatus;
  cost: number;
  requested_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestRewardRedemptionInput {
  reward: RewardCatalogItem;
  now?: string;
  id?: string;
}

export interface ApproveRewardRedemptionInput {
  redemption: RewardRedemptionSnapshot;
  targetStatus: Extract<RewardRedemptionStatus, "approved" | "approved_for_later" | "denied">;
  coinBalance: number;
  coinTransactions: readonly RewardCoinTransaction[];
  allowOverdraw?: boolean;
  now?: string;
}

export interface ApproveRewardRedemptionResult {
  redemption: RewardRedemptionSnapshot;
  coinBalance: number;
  coinTransactions: RewardCoinTransaction[];
  warning: string | null;
}

export interface OverdrawWarningInput {
  coinBalance: number;
  cost: number;
}

const QUEST_COMPLETED_REASON = "quest_completed";
const REWARD_REDEEMED_REASON = "reward_redeemed";

function getTimestamp(now?: string): string {
  return now ?? new Date().toISOString();
}

function hasXpAward(
  transactions: readonly RewardXpTransaction[],
  questInstanceId: string,
): boolean {
  return transactions.some(
    (transaction) =>
      transaction.quest_instance_id === questInstanceId &&
      transaction.reason === QUEST_COMPLETED_REASON,
  );
}

function hasCoinQuestAward(
  transactions: readonly RewardCoinTransaction[],
  questInstanceId: string,
): boolean {
  return transactions.some(
    (transaction) =>
      transaction.quest_instance_id === questInstanceId &&
      transaction.reason === QUEST_COMPLETED_REASON,
  );
}

function hasRewardDeduction(
  transactions: readonly RewardCoinTransaction[],
  redemptionId: string,
): boolean {
  return transactions.some(
    (transaction) =>
      transaction.reward_redemption_id === redemptionId &&
      transaction.reason === REWARD_REDEEMED_REASON,
  );
}

function awardQuestTransactions(
  input: QuestAwardInput,
  completedInstance: RewardQuestInstance,
  timestamp: string,
): Omit<QuestAwardResult, "instance"> {
  const xpTransactions = [...input.xpTransactions];
  const coinTransactions = [...input.coinTransactions];
  let awarded = false;

  if (!hasXpAward(xpTransactions, completedInstance.id)) {
    xpTransactions.push({
      id: `xp-${completedInstance.id}-${QUEST_COMPLETED_REASON}`,
      child_id: completedInstance.child_id,
      quest_instance_id: completedInstance.id,
      amount: completedInstance.xp_value,
      reason: QUEST_COMPLETED_REASON,
      created_at: timestamp,
    });
    awarded = true;
  }

  if (!hasCoinQuestAward(coinTransactions, completedInstance.id)) {
    coinTransactions.push({
      id: `coin-${completedInstance.id}-${QUEST_COMPLETED_REASON}`,
      child_id: completedInstance.child_id,
      quest_instance_id: completedInstance.id,
      reward_redemption_id: null,
      amount: completedInstance.coin_value,
      reason: QUEST_COMPLETED_REASON,
      created_at: timestamp,
    });
    awarded = true;
  }

  return {
    xpTransactions,
    coinTransactions,
    awarded,
  };
}

export function completeQuestWithAward(input: QuestAwardInput): QuestAwardResult {
  const timestamp = getTimestamp(input.now);

  if (input.instance.approval_mode === "parent") {
    return {
      instance: {
        ...input.instance,
        status: input.instance.status === "completed" ? "completed" : "submitted",
        submitted_at: input.instance.submitted_at ?? timestamp,
        denied_at: null,
        updated_at: timestamp,
      },
      xpTransactions: [...input.xpTransactions],
      coinTransactions: [...input.coinTransactions],
      awarded: false,
    };
  }

  const completedInstance: RewardQuestInstance = {
    ...input.instance,
    status: "completed",
    completed_at: input.instance.completed_at ?? timestamp,
    denied_at: null,
    updated_at: timestamp,
  };
  const award = awardQuestTransactions(input, completedInstance, timestamp);

  return {
    instance: completedInstance,
    ...award,
  };
}

export function approveQuestWithAward(input: QuestAwardInput): QuestAwardResult {
  const timestamp = getTimestamp(input.now);
  const completedInstance: RewardQuestInstance = {
    ...input.instance,
    status: "completed",
    completed_at: input.instance.completed_at ?? timestamp,
    denied_at: null,
    updated_at: timestamp,
  };
  const award = awardQuestTransactions(input, completedInstance, timestamp);

  return {
    instance: completedInstance,
    ...award,
  };
}

export function retryDeniedQuest(input: RetryDeniedQuestInput): RewardQuestInstance {
  const timestamp = getTimestamp(input.now);

  if (input.instance.status !== "denied") {
    return {
      ...input.instance,
      updated_at: timestamp,
    };
  }

  return {
    ...input.instance,
    status: "not_started",
    submitted_at: null,
    completed_at: null,
    denied_at: null,
    updated_at: timestamp,
  };
}

export function requestRewardRedemption(
  input: RequestRewardRedemptionInput,
): RewardRedemptionSnapshot {
  const timestamp = getTimestamp(input.now);

  return {
    id: input.id ?? `redemption-${input.reward.id}-${timestamp}`,
    reward_id: input.reward.id,
    child_id: input.reward.child_id,
    status: "requested",
    cost: input.reward.cost,
    requested_at: timestamp,
    resolved_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function getOverdrawWarning(input: OverdrawWarningInput): string | null {
  const resultingBalance = input.coinBalance - input.cost;

  if (resultingBalance >= 0) {
    return null;
  }

  return `Approving this reward will reduce the coin balance below zero. Current balance: ${input.coinBalance}. Resulting balance: ${resultingBalance}. Continue?`;
}

export function approveRewardRedemption(
  input: ApproveRewardRedemptionInput,
): ApproveRewardRedemptionResult {
  const timestamp = getTimestamp(input.now);
  const shouldDeduct =
    input.targetStatus === "approved" || input.targetStatus === "approved_for_later";
  const existingDeduction = hasRewardDeduction(input.coinTransactions, input.redemption.id);
  const warning = shouldDeduct && !existingDeduction
    ? getOverdrawWarning({
        coinBalance: input.coinBalance,
        cost: input.redemption.cost,
      })
    : null;
  const isIdempotentApprovalRepeat =
    existingDeduction && shouldDeduct && input.redemption.status === input.targetStatus;

  if (input.redemption.status !== "requested") {
    if (isIdempotentApprovalRepeat) {
      return {
        redemption: { ...input.redemption },
        coinBalance: input.coinBalance,
        coinTransactions: [...input.coinTransactions],
        warning,
      };
    }

    throw new Error("Only requested redemptions can be resolved.");
  }

  if (warning && !input.allowOverdraw && !existingDeduction) {
    throw new Error("Insufficient coins for reward redemption.");
  }

  const resolvedRedemption: RewardRedemptionSnapshot = {
    ...input.redemption,
    status: input.targetStatus,
    resolved_at: input.redemption.resolved_at ?? timestamp,
    updated_at: timestamp,
  };

  if (!shouldDeduct || existingDeduction) {
    return {
      redemption: resolvedRedemption,
      coinBalance: input.coinBalance,
      coinTransactions: [...input.coinTransactions],
      warning,
    };
  }

  const transaction: RewardCoinTransaction = {
    id: `coin-${input.redemption.id}-${REWARD_REDEEMED_REASON}`,
    child_id: input.redemption.child_id,
    quest_instance_id: null,
    reward_redemption_id: input.redemption.id,
    amount: -input.redemption.cost,
    reason: REWARD_REDEEMED_REASON,
    created_at: timestamp,
  };

  return {
    redemption: resolvedRedemption,
    coinBalance: input.coinBalance - input.redemption.cost,
    coinTransactions: [...input.coinTransactions, transaction],
    warning,
  };
}
