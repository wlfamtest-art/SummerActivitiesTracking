import { describe, expect, it } from "vitest";

import {
  approveQuestWithAward,
  approveRewardRedemption,
  completeQuestWithAward,
  getOverdrawWarning,
  requestRewardRedemption,
  retryDeniedQuest,
  type RewardCatalogItem,
  type RewardCoinTransaction,
  type RewardQuestInstance,
  type RewardRedemptionSnapshot,
} from "../../lib/game/rewards";

function questInstance(overrides: Partial<RewardQuestInstance>): RewardQuestInstance {
  return {
    id: "instance-1",
    assigned_quest_id: "reading",
    child_id: "child-1",
    quest_date: "2026-06-29",
    name: "Reading",
    approval_mode: "auto",
    xp_value: 45,
    coin_value: 9,
    status: "not_started",
    submitted_at: null,
    completed_at: null,
    denied_at: null,
    updated_at: "2026-06-29T07:00:00.000Z",
    ...overrides,
  };
}

function reward(overrides: Partial<RewardCatalogItem> = {}): RewardCatalogItem {
  return {
    id: "reward-dessert",
    child_id: "child-1",
    name: "Pick dessert",
    cost: 20,
    active: true,
    ...overrides,
  };
}

describe("quest awards", () => {
  it("auto-completes and awards XP and coins once per quest instance", () => {
    const first = completeQuestWithAward({
      instance: questInstance({}),
      xpTransactions: [],
      coinTransactions: [],
      now: "2026-06-29T12:00:00.000Z",
    });

    expect(first.instance.status).toBe("completed");
    expect(first.xpTransactions).toEqual([
      expect.objectContaining({
        quest_instance_id: "instance-1",
        amount: 45,
        reason: "quest_completed",
      }),
    ]);
    expect(first.coinTransactions).toEqual([
      expect.objectContaining({
        quest_instance_id: "instance-1",
        amount: 9,
        reason: "quest_completed",
      }),
    ]);

    const second = completeQuestWithAward({
      instance: first.instance,
      xpTransactions: first.xpTransactions,
      coinTransactions: first.coinTransactions,
      now: "2026-06-29T12:05:00.000Z",
    });

    expect(second.xpTransactions).toHaveLength(1);
    expect(second.coinTransactions).toHaveLength(1);
    expect(second.awarded).toBe(false);
  });

  it("submits parent-approved quests first and awards only on approval", () => {
    const submitted = completeQuestWithAward({
      instance: questInstance({ id: "chores-1", approval_mode: "parent", xp_value: 30, coin_value: 6 }),
      xpTransactions: [],
      coinTransactions: [],
      now: "2026-06-29T12:00:00.000Z",
    });

    expect(submitted.instance.status).toBe("submitted");
    expect(submitted.xpTransactions).toEqual([]);
    expect(submitted.coinTransactions).toEqual([]);

    const approved = approveQuestWithAward({
      instance: submitted.instance,
      xpTransactions: submitted.xpTransactions,
      coinTransactions: submitted.coinTransactions,
      now: "2026-06-29T13:00:00.000Z",
    });

    expect(approved.instance.status).toBe("completed");
    expect(approved.xpTransactions).toEqual([
      expect.objectContaining({ quest_instance_id: "chores-1", amount: 30, reason: "quest_completed" }),
    ]);
    expect(approved.coinTransactions).toEqual([
      expect.objectContaining({ quest_instance_id: "chores-1", amount: 6, reason: "quest_completed" }),
    ]);
  });

  it("resets denied quests for retry without awarding anything", () => {
    const result = retryDeniedQuest({
      instance: questInstance({
        status: "denied",
        denied_at: "2026-06-29T13:00:00.000Z",
      }),
      now: "2026-06-29T14:00:00.000Z",
    });

    expect(result).toMatchObject({
      status: "not_started",
      submitted_at: null,
      completed_at: null,
      denied_at: null,
      updated_at: "2026-06-29T14:00:00.000Z",
    });
  });
});

describe("reward redemption transactions", () => {
  it("creates a requested redemption without reserving coins", () => {
    const result = requestRewardRedemption({
      reward: reward(),
      now: "2026-06-29T15:00:00.000Z",
    });

    expect(result).toEqual({
      id: "redemption-reward-dessert-2026-06-29T15:00:00.000Z",
      reward_id: "reward-dessert",
      child_id: "child-1",
      status: "requested",
      cost: 20,
      requested_at: "2026-06-29T15:00:00.000Z",
      resolved_at: null,
      created_at: "2026-06-29T15:00:00.000Z",
      updated_at: "2026-06-29T15:00:00.000Z",
    });
  });

  it("deducts coins only when a requested redemption is approved", () => {
    const redemption = requestRewardRedemption({
      reward: reward(),
      now: "2026-06-29T15:00:00.000Z",
    });

    const result = approveRewardRedemption({
      redemption,
      targetStatus: "approved",
      coinBalance: 25,
      coinTransactions: [],
      now: "2026-06-29T16:00:00.000Z",
    });

    expect(result.coinBalance).toBe(5);
    expect(result.redemption.status).toBe("approved");
    expect(result.coinTransactions).toEqual([
      expect.objectContaining({
        reward_redemption_id: redemption.id,
        amount: -20,
        reason: "reward_redeemed",
      }),
    ]);
  });

  it("deducts for approved-for-later and prevents duplicate deduction", () => {
    const redemption = requestRewardRedemption({
      reward: reward({ cost: 10 }),
      now: "2026-06-29T15:00:00.000Z",
    });

    const first = approveRewardRedemption({
      redemption,
      targetStatus: "approved_for_later",
      coinBalance: 20,
      coinTransactions: [],
      now: "2026-06-29T16:00:00.000Z",
    });
    const second = approveRewardRedemption({
      redemption: first.redemption,
      targetStatus: "approved_for_later",
      coinBalance: first.coinBalance,
      coinTransactions: first.coinTransactions,
      now: "2026-06-29T16:05:00.000Z",
    });

    expect(first.coinBalance).toBe(10);
    expect(second.coinBalance).toBe(10);
    expect(second.coinTransactions).toHaveLength(1);
  });

  it("does not allow an approved redemption with an existing deduction to be changed to denied", () => {
    const approvedRedemption: RewardRedemptionSnapshot = {
      id: "redemption-1",
      reward_id: "reward-dessert",
      child_id: "child-1",
      status: "approved",
      cost: 20,
      requested_at: "2026-06-29T15:00:00.000Z",
      resolved_at: "2026-06-29T16:00:00.000Z",
      created_at: "2026-06-29T15:00:00.000Z",
      updated_at: "2026-06-29T16:00:00.000Z",
    };
    const redemptionTransactions: RewardCoinTransaction[] = [
      {
        id: "coin-redemption-1-reward_redeemed",
        child_id: "child-1",
        quest_instance_id: null,
        reward_redemption_id: "redemption-1",
        amount: -20,
        reason: "reward_redeemed",
        created_at: "2026-06-29T16:00:00.000Z",
      },
    ];

    expect(() =>
      approveRewardRedemption({
        redemption: approvedRedemption,
        targetStatus: "denied",
        coinBalance: 5,
        coinTransactions: redemptionTransactions,
        now: "2026-06-29T17:00:00.000Z",
      }),
    ).toThrow("Only requested redemptions can be resolved.");
  });

  it("repeating the same approval target with an existing deduction is idempotent", () => {
    const redemption = requestRewardRedemption({
      reward: reward({ cost: 10 }),
      now: "2026-06-29T15:00:00.000Z",
    });
    const first = approveRewardRedemption({
      redemption,
      targetStatus: "approved",
      coinBalance: 20,
      coinTransactions: [],
      now: "2026-06-29T16:00:00.000Z",
    });

    const second = approveRewardRedemption({
      redemption: first.redemption,
      targetStatus: "approved",
      coinBalance: first.coinBalance,
      coinTransactions: first.coinTransactions,
      now: "2026-06-29T17:00:00.000Z",
    });

    expect(second.redemption).toEqual(first.redemption);
    expect(second.coinBalance).toBe(first.coinBalance);
    expect(second.coinTransactions).toEqual(first.coinTransactions);
  });

  it("rejects overdraw unless explicitly allowed and returns warning math", () => {
    const redemption = requestRewardRedemption({
      reward: reward({ cost: 30 }),
      now: "2026-06-29T15:00:00.000Z",
    });

    expect(
      getOverdrawWarning({
        coinBalance: 20,
        cost: 30,
      }),
    ).toBe(
      "Approving this reward will reduce the coin balance below zero. Current balance: 20. Resulting balance: -10. Continue?",
    );
    expect(() =>
      approveRewardRedemption({
        redemption,
        targetStatus: "approved",
        coinBalance: 20,
        coinTransactions: [],
        now: "2026-06-29T16:00:00.000Z",
      }),
    ).toThrow("Insufficient coins for reward redemption.");

    const allowed = approveRewardRedemption({
      redemption,
      targetStatus: "approved",
      coinBalance: 20,
      coinTransactions: [],
      allowOverdraw: true,
      now: "2026-06-29T16:00:00.000Z",
    });

    expect(allowed.coinBalance).toBe(-10);
  });
});
