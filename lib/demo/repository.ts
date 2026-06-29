import {
  generateDailyQuestInstances,
  type DailyQuestInstance,
} from "../data/daily-quests";
import { getLevelForXp } from "../game/levels";
import { calculateCoins, calculateXp } from "../game/economy";
import {
  approveQuestWithAward,
  approveRewardRedemption,
  completeQuestWithAward,
  requestRewardRedemption,
  retryDeniedQuest,
  type RewardCoinTransaction,
  type RewardQuestInstance,
  type RewardRedemptionSnapshot,
  type RewardXpTransaction,
} from "../game/rewards";
import { getUnlockState } from "../game/unlocks";
import { STARTER_QUESTS, STARTER_REWARDS } from "../game/constants";
import type { RestDayType, RewardRedemptionStatus, Weekday } from "../game/types";
import { hashKidPin, verifyKidPin } from "./pin";
import {
  createInitialState,
  loadState,
  saveState,
  type DemoAssignedQuest,
  type DemoChild,
  type DemoCoinTransaction,
  type DemoQuestInstance,
  type DemoReward,
  type DemoRewardRedemption,
  type DemoXpTransaction,
  type SummerQuestState,
} from "./store";

interface OnboardParentInput {
  familyName: string;
  parentEmail: string;
  childName: string;
  childAvatar: string;
  ageBand: "younger" | "older";
  kidPin: string;
  timeZone: string;
  now?: string;
}

interface UpsertQuestInput {
  id?: string;
  childId?: string;
  name: string;
  icon: string;
  category: DemoAssignedQuest["category"];
  durationMinutes: number;
  activeDays: readonly Weekday[];
  suggestedTimeWindow: string;
  completionDeadline: string;
  approvalMode: DemoAssignedQuest["approval_mode"];
  unlockMode?: DemoAssignedQuest["unlock_mode"];
  prerequisiteQuestIds?: readonly string[];
  parentNote?: string | null;
  active?: boolean;
  now?: string;
}

interface UpdateRewardInput {
  id: string;
  name: string;
  icon: string;
  coinCost: number;
  description: string;
  active: boolean;
  now?: string;
}

const REST_DAY_MESSAGE = "No quests today — adventure resumes tomorrow.";

function timestamp(now?: string): string {
  return now ?? new Date().toISOString();
}

function cloneState(state: SummerQuestState): SummerQuestState {
  return structuredClone(state);
}

function toRewardQuestInstance(instance: DemoQuestInstance): RewardQuestInstance {
  return {
    id: instance.id,
    assigned_quest_id: instance.assigned_quest_id,
    child_id: instance.child_id,
    quest_date: instance.quest_date,
    name: instance.name,
    approval_mode: instance.approval_mode,
    xp_value: instance.xp_value,
    coin_value: instance.coin_value,
    status: instance.status,
    submitted_at: instance.submitted_at,
    completed_at: instance.completed_at,
    denied_at: instance.denied_at,
    updated_at: instance.updated_at,
  };
}

function applyRewardQuest(instance: DemoQuestInstance, result: RewardQuestInstance): DemoQuestInstance {
  return {
    ...instance,
    status: result.status,
    submitted_at: result.submitted_at,
    completed_at: result.completed_at,
    denied_at: result.denied_at,
    updated_at: result.updated_at,
  };
}

function toRewardRedemption(redemption: DemoRewardRedemption): RewardRedemptionSnapshot {
  return { ...redemption };
}

export function createDemoRepository(initialState: SummerQuestState = createInitialState()) {
  let state = cloneState(initialState);

  function persist(): void {
    saveState(state);
  }

  function syncChildProgress(childId: string): void {
    const child = state.children.find((entry) => entry.id === childId);
    if (!child) {
      throw new Error(`Unknown child ${childId}.`);
    }

    child.total_xp = state.xp_transactions
      .filter((transaction) => transaction.child_id === childId)
      .reduce((total, transaction) => total + transaction.amount, 0);
    child.coin_balance = state.coin_transactions
      .filter((transaction) => transaction.child_id === childId)
      .reduce((total, transaction) => total + transaction.amount, 0);
    child.current_level = getLevelForXp(child.total_xp).level;
  }

  function getOnlyChild(): DemoChild {
    const child = state.children[0];
    if (!child) {
      throw new Error("Create a child profile first.");
    }
    return child;
  }

  return {
    getState(): SummerQuestState {
      return cloneState(state);
    },

    exportState(): SummerQuestState {
      return cloneState(state);
    },

    load(): SummerQuestState {
      state = loadState();
      return this.getState();
    },

    onboardParent(input: OnboardParentInput) {
      const now = timestamp(input.now);
      const family = {
        id: "family-demo",
        name: input.familyName,
        time_zone: input.timeZone,
        created_at: now,
        updated_at: now,
      };
      const user = {
        id: "user-demo",
        family_id: family.id,
        email: input.parentEmail,
        role: "parent" as const,
        kid_mode_pin_hash: hashKidPin(input.kidPin),
        created_at: now,
        updated_at: now,
      };
      const child: DemoChild = {
        id: "child-demo",
        family_id: family.id,
        name: input.childName,
        avatar: input.childAvatar,
        age_band: input.ageBand,
        total_xp: 0,
        coin_balance: 0,
        current_level: 1,
        created_at: now,
        updated_at: now,
      };

      state = {
        ...createInitialState(),
        families: [family],
        users: [user],
        children: [child],
      };
      persist();
      return { family, user, child };
    },

    verifyKidModePin(pin: string): boolean {
      return verifyKidPin(pin, state.users[0]?.kid_mode_pin_hash);
    },

    resetLocalState(): void {
      state = createInitialState();
      persist();
    },

    resetKidModePin(pin: string, nowInput?: string): void {
      const user = state.users[0];
      if (!user) {
        throw new Error("Create a parent account first.");
      }

      user.kid_mode_pin_hash = hashKidPin(pin);
      user.updated_at = timestamp(nowInput);
      persist();
    },

    updateTimeZone(timeZone: string, nowInput?: string): void {
      const family = state.families[0];
      if (!family) {
        throw new Error("Create a family first.");
      }

      family.time_zone = timeZone;
      family.updated_at = timestamp(nowInput);
      persist();
    },

    useStarterPlan(childId: string, nowInput?: string): void {
      const now = timestamp(nowInput);
      const child = state.children.find((entry) => entry.id === childId);
      if (!child) {
        throw new Error(`Unknown child ${childId}.`);
      }

      state.assigned_quests = STARTER_QUESTS.map((quest): DemoAssignedQuest => ({
        ...quest,
        active_days: [...quest.active_days],
        prerequisite_quest_ids: [...quest.prerequisite_quest_ids],
        child_id: child.id,
        active: true,
        created_at: now,
        updated_at: now,
      }));
      state.rewards = STARTER_REWARDS.map((reward) => ({
        id: reward.id,
        family_id: child.family_id,
        name: reward.name,
        icon: reward.icon,
        coin_cost: reward.cost,
        description: reward.description,
        approval_required: true,
        active: reward.active,
        created_at: now,
        updated_at: now,
      }));
      persist();
    },

    upsertQuest(input: UpsertQuestInput): DemoAssignedQuest {
      const child = input.childId
        ? state.children.find((entry) => entry.id === input.childId)
        : getOnlyChild();
      if (!child) {
        throw new Error("Create a child profile first.");
      }

      const now = timestamp(input.now);
      const xpValue = input.category === "Screen" ? 0 : calculateXp(input.durationMinutes);
      const coinValue = input.category === "Screen" ? 0 : calculateCoins(xpValue);
      const existing = input.id ? state.assigned_quests.find((entry) => entry.id === input.id) : undefined;
      const quest: DemoAssignedQuest = {
        id: input.id ?? `quest-${Date.now()}`,
        child_id: child.id,
        name: input.name,
        icon: input.icon,
        category: input.category,
        duration_minutes: input.durationMinutes,
        xp_value: xpValue,
        coin_value: coinValue,
        active_days: [...input.activeDays],
        suggested_time_window: input.suggestedTimeWindow,
        completion_deadline: input.completionDeadline,
        approval_mode: input.approvalMode,
        unlock_mode: input.unlockMode ?? "always",
        prerequisite_quest_ids: [...(input.prerequisiteQuestIds ?? [])],
        parent_note: input.parentNote ?? null,
        active: input.active ?? existing?.active ?? true,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      state.assigned_quests = existing
        ? state.assigned_quests.map((entry) => (entry.id === quest.id ? quest : entry))
        : [...state.assigned_quests, quest];
      persist();
      return { ...quest };
    },

    createReward(input: { name: string; icon: string; coinCost: number; description: string; now?: string }) {
      const family = state.families[0];
      if (!family) {
        throw new Error("Create a family first.");
      }

      const now = timestamp(input.now);
      const reward = {
        id: `reward-${Date.now()}`,
        family_id: family.id,
        name: input.name,
        icon: input.icon,
        coin_cost: input.coinCost,
        description: input.description,
        approval_required: true,
        active: true,
        created_at: now,
        updated_at: now,
      };
      state.rewards.push(reward);
      persist();
      return { ...reward };
    },

    updateReward(input: UpdateRewardInput): DemoReward {
      const reward = state.rewards.find((entry) => entry.id === input.id);
      if (!reward) {
        throw new Error(`Unknown reward ${input.id}.`);
      }

      const updated: DemoReward = {
        ...reward,
        name: input.name,
        icon: input.icon,
        coin_cost: input.coinCost,
        description: input.description,
        active: input.active,
        updated_at: timestamp(input.now),
      };

      state.rewards = state.rewards.map((entry) => (entry.id === updated.id ? updated : entry));
      persist();
      return { ...updated };
    },

    generateDailyQuests(dateKey: string, weekday: Weekday, nowInput?: string) {
      const child = getOnlyChild();
      const restDay = state.rest_days.find((entry) => entry.child_id === child.id && entry.date === dateKey);
      const result = generateDailyQuestInstances({
        assignedQuests: state.assigned_quests,
        existingInstances: state.quest_instances.filter((instance) => instance.quest_date === dateKey),
        restDay: restDay ? { type: restDay.type, message: REST_DAY_MESSAGE } : null,
        dateKey,
        weekday,
        now: nowInput,
      });

      state.quest_instances = [
        ...state.quest_instances.filter((instance) => instance.quest_date !== dateKey),
        ...(result.instances as DemoQuestInstance[]),
      ];
      persist();
      return result;
    },

    resetDemoDay(dateKey: string, weekday: Weekday, nowInput?: string) {
      const child = getOnlyChild();
      const questInstanceIds = new Set(
        state.quest_instances
          .filter((instance) => instance.child_id === child.id && instance.quest_date === dateKey)
          .map((instance) => instance.id),
      );
      const rewardRedemptionIds = new Set(
        state.reward_redemptions
          .filter((redemption) => redemption.child_id === child.id && redemption.requested_at.slice(0, 10) === dateKey)
          .map((redemption) => redemption.id),
      );

      state.quest_instances = state.quest_instances.filter((instance) => !(instance.child_id === child.id && instance.quest_date === dateKey));
      state.rest_days = state.rest_days.filter((entry) => !(entry.child_id === child.id && entry.date === dateKey));
      state.reward_redemptions = state.reward_redemptions.filter((redemption) => !rewardRedemptionIds.has(redemption.id));
      state.xp_transactions = state.xp_transactions.filter((transaction) => !transaction.quest_instance_id || !questInstanceIds.has(transaction.quest_instance_id));
      state.coin_transactions = state.coin_transactions.filter((transaction) => {
        const questTransaction = transaction.quest_instance_id && questInstanceIds.has(transaction.quest_instance_id);
        const rewardTransaction = transaction.reward_redemption_id && rewardRedemptionIds.has(transaction.reward_redemption_id);
        return !questTransaction && !rewardTransaction;
      });

      syncChildProgress(child.id);
      persist();
      return this.generateDailyQuests(dateKey, weekday, nowInput);
    },

    completeQuest(instanceId: string, nowInput?: string) {
      const instance = state.quest_instances.find((entry) => entry.id === instanceId);
      if (!instance) {
        throw new Error(`Unknown quest instance ${instanceId}.`);
      }

      const result = completeQuestWithAward({
        instance: toRewardQuestInstance(instance),
        xpTransactions: state.xp_transactions as RewardXpTransaction[],
        coinTransactions: state.coin_transactions as RewardCoinTransaction[],
        now: nowInput,
      });

      Object.assign(instance, applyRewardQuest(instance, result.instance));
      state.xp_transactions = result.xpTransactions as DemoXpTransaction[];
      state.coin_transactions = result.coinTransactions as DemoCoinTransaction[];
      syncChildProgress(instance.child_id);
      persist();
      return result;
    },

    startQuest(instanceId: string, nowInput?: string): DemoQuestInstance {
      const instance = state.quest_instances.find((entry) => entry.id === instanceId);
      if (!instance) {
        throw new Error(`Unknown quest instance ${instanceId}.`);
      }

      const now = timestamp(nowInput);
      instance.status = "in_progress";
      instance.started_at = instance.started_at ?? now;
      instance.updated_at = now;
      persist();
      return { ...instance };
    },

    approveQuest(instanceId: string, nowInput?: string) {
      const instance = state.quest_instances.find((entry) => entry.id === instanceId);
      if (!instance) {
        throw new Error(`Unknown quest instance ${instanceId}.`);
      }

      const result = approveQuestWithAward({
        instance: toRewardQuestInstance(instance),
        xpTransactions: state.xp_transactions as RewardXpTransaction[],
        coinTransactions: state.coin_transactions as RewardCoinTransaction[],
        now: nowInput,
      });

      Object.assign(instance, applyRewardQuest(instance, result.instance));
      state.xp_transactions = result.xpTransactions as DemoXpTransaction[];
      state.coin_transactions = result.coinTransactions as DemoCoinTransaction[];
      syncChildProgress(instance.child_id);
      persist();
      return result;
    },

    denyQuest(instanceId: string, note: string, nowInput?: string): DemoQuestInstance {
      const instance = state.quest_instances.find((entry) => entry.id === instanceId);
      if (!instance) {
        throw new Error(`Unknown quest instance ${instanceId}.`);
      }

      instance.status = "denied";
      instance.denial_note = note;
      instance.denied_at = timestamp(nowInput);
      instance.updated_at = instance.denied_at;
      persist();
      return { ...instance };
    },

    retryQuest(instanceId: string, nowInput?: string): DemoQuestInstance {
      const instance = state.quest_instances.find((entry) => entry.id === instanceId);
      if (!instance) {
        throw new Error(`Unknown quest instance ${instanceId}.`);
      }

      Object.assign(instance, retryDeniedQuest({ instance: toRewardQuestInstance(instance), now: nowInput }));
      instance.denial_note = null;
      persist();
      return { ...instance };
    },

    requestReward(rewardId: string, nowInput?: string): DemoRewardRedemption {
      const child = getOnlyChild();
      const reward = state.rewards.find((entry) => entry.id === rewardId && entry.active);
      if (!reward) {
        throw new Error(`Unknown reward ${rewardId}.`);
      }

      if (reward.coin_cost > child.coin_balance) {
        throw new Error("Not enough Gold Coins for this reward yet.");
      }

      const pendingRequest = state.reward_redemptions.some(
        (redemption) =>
          redemption.child_id === child.id && redemption.reward_id === reward.id && redemption.status === "requested",
      );
      if (pendingRequest) {
        throw new Error("You already requested this reward.");
      }

      const redemption = requestRewardRedemption({
        reward: {
          id: reward.id,
          child_id: child.id,
          name: reward.name,
          cost: reward.coin_cost,
          active: reward.active,
        },
        now: nowInput,
      }) as DemoRewardRedemption;

      state.reward_redemptions.push(redemption);
      persist();
      return { ...redemption };
    },

    approveReward(
      redemptionId: string,
      targetStatus: Extract<RewardRedemptionStatus, "approved" | "approved_for_later" | "denied">,
      allowOverdraw = false,
      nowInput?: string,
    ) {
      const redemption = state.reward_redemptions.find((entry) => entry.id === redemptionId);
      const child = getOnlyChild();
      if (!redemption) {
        throw new Error(`Unknown reward redemption ${redemptionId}.`);
      }

      const result = approveRewardRedemption({
        redemption: toRewardRedemption(redemption),
        targetStatus,
        coinBalance: child.coin_balance,
        coinTransactions: state.coin_transactions as RewardCoinTransaction[],
        allowOverdraw,
        now: nowInput,
      });

      Object.assign(redemption, result.redemption);
      state.coin_transactions = result.coinTransactions as DemoCoinTransaction[];
      syncChildProgress(child.id);
      persist();
      return result;
    },

    adjustCoins(amount: number, reason = "parent_adjustment", nowInput?: string): void {
      const child = getOnlyChild();
      const now = timestamp(nowInput);
      state.coin_transactions.push({
        id: `coin-adjustment-${state.coin_transactions.length + 1}`,
        child_id: child.id,
        quest_instance_id: null,
        reward_redemption_id: null,
        amount,
        reason,
        created_at: now,
      });
      syncChildProgress(child.id);
      persist();
    },

    markRestDay(date: string, type: RestDayType, note: string | null, nowInput?: string): void {
      const child = getOnlyChild();
      const now = timestamp(nowInput);
      state.rest_days = state.rest_days.filter((entry) => !(entry.child_id === child.id && entry.date === date));
      state.rest_days.push({
        id: `rest-${child.id}-${date}`,
        child_id: child.id,
        date,
        type,
        note,
        created_at: now,
        updated_at: now,
      });
      persist();
    },

    clearRestDay(date: string): void {
      const child = getOnlyChild();
      state.rest_days = state.rest_days.filter((entry) => !(entry.child_id === child.id && entry.date === date));
      persist();
    },

    getUnlockStateForQuest(questId: string, dateKey: string) {
      const quest = state.assigned_quests.find((entry) => entry.id === questId);
      if (!quest) {
        throw new Error(`Unknown quest ${questId}.`);
      }

      return getUnlockState(
        quest,
        state.quest_instances.filter((instance) => instance.quest_date === dateKey),
        state.assigned_quests.map((entry) => ({
          id: entry.id,
          name: entry.name,
          active: entry.active,
          active_days: entry.active_days,
          unlock_mode: entry.unlock_mode,
          prerequisite_quest_ids: entry.prerequisite_quest_ids,
        })),
      );
    },
  };
}
