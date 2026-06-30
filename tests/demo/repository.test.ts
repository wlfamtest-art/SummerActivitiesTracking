import { describe, expect, it } from "vitest";

import { createDemoRepository } from "../../lib/demo/repository";

const MONDAY = "2026-06-29";

describe("demo repository", () => {
  it("runs onboarding and creates the starter plan", () => {
    const repo = createDemoRepository();
    const result = repo.onboardParent({
      familyName: "River Family",
      parentEmail: "parent@example.com",
      childName: "Mina",
      childAvatar: "🧭",
      ageBand: "younger",
      kidPin: "1234",
      timeZone: "America/Los_Angeles",
      now: "2026-06-27T12:00:00.000Z",
    });

    repo.useStarterPlan(result.child.id, "2026-06-27T12:05:00.000Z");
    const state = repo.getState();

    expect(state.children[0]).toMatchObject({
      name: "Mina",
      avatar: "🧭",
      total_xp: 0,
      coin_balance: 0,
      current_level: 1,
    });
    expect(state.assigned_quests).toHaveLength(5);
    expect(state.rewards).toHaveLength(8);
    expect(repo.verifyKidModePin("1234")).toBe(true);
  });

  it("generates daily quests, completes auto quests, submits parent quests, and unlocks Screen Time", () => {
    const repo = createStartedRepo();

    const generated = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T07:00:00.000Z");
    expect(generated.createdInstances).toHaveLength(4);
    expect(repo.getUnlockStateForQuest("starter-screen-time", MONDAY).unlocked).toBe(false);

    const reading = repo.completeQuest("starter-reading-2026-06-29", "2026-06-29T09:30:00.000Z");
    const outdoor = repo.completeQuest("starter-outdoor-play-2026-06-29", "2026-06-29T15:00:00.000Z");
    const chores = repo.completeQuest("starter-chores-2026-06-29", "2026-06-29T16:30:00.000Z");

    expect(reading.instance.status).toBe("completed");
    expect(outdoor.instance.status).toBe("completed");
    expect(chores.instance.status).toBe("submitted");
    expect(repo.getUnlockStateForQuest("starter-screen-time", MONDAY).unlocked).toBe(true);

    const stateAfterAuto = repo.getState();
    expect(stateAfterAuto.children[0]).toMatchObject({
      total_xp: 90,
      coin_balance: 18,
      current_level: 2,
    });

    repo.approveQuest("starter-chores-2026-06-29", "2026-06-29T17:00:00.000Z");
    repo.approveQuest("starter-chores-2026-06-29", "2026-06-29T17:05:00.000Z");

    const stateAfterApproval = repo.getState();
    expect(stateAfterApproval.children[0]).toMatchObject({
      total_xp: 120,
      coin_balance: 24,
      current_level: 2,
    });
    expect(stateAfterApproval.xp_transactions).toHaveLength(3);
    expect(stateAfterApproval.coin_transactions.filter((tx) => tx.reason === "quest_completed")).toHaveLength(3);
  });

  it("denies and retries a parent-approved quest without awarding", () => {
    const repo = createStartedRepo();
    repo.generateDailyQuests(MONDAY, "monday");
    repo.completeQuest("starter-chores-2026-06-29", "2026-06-29T16:30:00.000Z");
    repo.denyQuest("starter-chores-2026-06-29", "Try again after dinner.", "2026-06-29T17:00:00.000Z");
    const retried = repo.retryQuest("starter-chores-2026-06-29", "2026-06-29T17:10:00.000Z");

    expect(retried.status).toBe("not_started");
    expect(repo.getState().children[0].total_xp).toBe(0);
    expect(repo.getState().coin_transactions).toEqual([]);
  });

  it("requests rewards, rejects overdraw, and deducts once after approval", () => {
    const repo = createStartedRepo();
    repo.adjustCoins(30, "parent_adjustment", "2026-06-29T10:00:00.000Z");
    const redemption = repo.requestReward("reward-pick-dinner", "2026-06-29T18:00:00.000Z");
    repo.adjustCoins(-5, "parent_adjustment", "2026-06-29T18:30:00.000Z");

    expect(repo.getState().children[0].coin_balance).toBe(25);
    expect(() => repo.approveReward(redemption.id, "approved", false, "2026-06-29T19:00:00.000Z")).toThrow(
      "Insufficient coins for reward redemption.",
    );

    const approved = repo.approveReward(redemption.id, "approved", true, "2026-06-29T19:00:00.000Z");
    repo.approveReward(redemption.id, "approved", true, "2026-06-29T19:05:00.000Z");

    expect(approved.coinBalance).toBe(-5);
    expect(repo.getState().children[0].coin_balance).toBe(-5);
    expect(repo.getState().coin_transactions.filter((tx) => tx.reason === "reward_redeemed")).toHaveLength(1);
  });

  it("blocks duplicate pending reward requests", () => {
    const repo = createStartedRepo();
    repo.adjustCoins(30, "parent_adjustment", "2026-06-29T10:00:00.000Z");

    repo.requestReward("reward-pick-dinner", "2026-06-29T18:00:00.000Z");

    expect(() => repo.requestReward("reward-pick-dinner", "2026-06-29T18:01:00.000Z")).toThrow(
      "You already requested this reward.",
    );
    expect(repo.getState().reward_redemptions).toHaveLength(1);
  });

  it("blocks reward requests that cost more coins than the child has", () => {
    const repo = createStartedRepo();
    repo.adjustCoins(25, "parent_adjustment", "2026-06-29T10:00:00.000Z");

    expect(() => repo.requestReward("reward-pick-dinner", "2026-06-29T18:00:00.000Z")).toThrow(
      "Not enough Gold Coins for this reward yet.",
    );
    expect(repo.getState().reward_redemptions).toEqual([]);
  });

  it("lets parents edit and disable rewards", () => {
    const repo = createStartedRepo();

    const updated = repo.updateReward({
      id: "reward-pick-dessert",
      name: "Pick weekend dessert",
      icon: "🍪",
      coinCost: 35,
      description: "Choose dessert for a weekend night.",
      active: false,
      now: "2026-06-29T12:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: "reward-pick-dessert",
      name: "Pick weekend dessert",
      icon: "🍪",
      coin_cost: 35,
      description: "Choose dessert for a weekend night.",
      active: false,
      updated_at: "2026-06-29T12:00:00.000Z",
    });
    expect(repo.getState().rewards.find((reward) => reward.id === "reward-pick-dessert")).toMatchObject({
      name: "Pick weekend dessert",
      active: false,
    });
  });

  it("does not let children request disabled rewards", () => {
    const repo = createStartedRepo();
    repo.adjustCoins(100, "parent_adjustment", "2026-06-29T10:00:00.000Z");
    repo.updateReward({
      id: "reward-pick-dessert",
      name: "Pick dessert",
      icon: "🍰",
      coinCost: 20,
      description: "Choose dessert for the family.",
      active: false,
    });

    expect(() => repo.requestReward("reward-pick-dessert", "2026-06-29T18:00:00.000Z")).toThrow(
      "Unknown reward reward-pick-dessert.",
    );
  });

  it("lets parents edit and hide quests from future generated days", () => {
    const repo = createStartedRepo();

    const updated = repo.upsertQuest({
      id: "starter-reading",
      name: "Read a summer book",
      icon: "📚",
      category: "Reading",
      durationMinutes: 45,
      activeDays: ["monday"],
      suggestedTimeWindow: "morning",
      completionDeadline: "before dinner",
      approvalMode: "parent",
      parentNote: "Read one chapter.",
      active: false,
      now: "2026-06-29T12:00:00.000Z",
    });
    const result = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T13:00:00.000Z");

    expect(updated).toMatchObject({
      id: "starter-reading",
      name: "Read a summer book",
      duration_minutes: 45,
      xp_value: 70,
      coin_value: 14,
      approval_mode: "parent",
      active: false,
      updated_at: "2026-06-29T12:00:00.000Z",
    });
    expect(result.instances.map((instance) => instance.assigned_quest_id)).not.toContain("starter-reading");
  });

  it("creates a today instance when a matching quest is added after daily generation", () => {
    const repo = createStartedRepo();
    const firstGeneration = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T07:00:00.000Z");

    const quest = repo.upsertQuest({
      name: "New Monday Quest",
      icon: "✨",
      category: "Custom",
      durationMinutes: 20,
      activeDays: ["monday"],
      suggestedTimeWindow: "anytime",
      completionDeadline: "end of day",
      approvalMode: "auto",
      now: "2026-06-29T12:00:00.000Z",
    });
    const secondGeneration = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T12:01:00.000Z");

    expect(firstGeneration.createdInstances).toHaveLength(4);
    expect(secondGeneration.createdInstances).toEqual([
      expect.objectContaining({
        assigned_quest_id: quest.id,
        name: "New Monday Quest",
        quest_date: MONDAY,
      }),
    ]);
    expect(repo.getState().quest_instances.filter((instance) => instance.quest_date === MONDAY)).toHaveLength(5);
  });

  it("suppresses new quest generation on rest days", () => {
    const repo = createStartedRepo();
    repo.markRestDay(MONDAY, "rest_day", "Family day", "2026-06-28T12:00:00.000Z");

    const result = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T07:00:00.000Z");

    expect(result.restDay).toEqual({
      active: true,
      message: "No quests today — adventure resumes tomorrow.",
    });
    expect(result.createdInstances).toEqual([]);
  });

  it("clears a rest day so quests can be generated again", () => {
    const repo = createStartedRepo();
    repo.markRestDay(MONDAY, "rest_day", "Family day", "2026-06-28T12:00:00.000Z");
    repo.clearRestDay(MONDAY);

    const result = repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T07:00:00.000Z");

    expect(result.restDay).toEqual({ active: false, message: null });
    expect(result.createdInstances).toHaveLength(4);
  });

  it("exports a cloned snapshot and resets local demo data", () => {
    const repo = createStartedRepo();
    repo.adjustCoins(10, "parent_adjustment", "2026-06-29T10:00:00.000Z");

    const exported = repo.exportState();
    exported.children[0].coin_balance = 999;

    expect(repo.getState().children[0].coin_balance).toBe(10);

    repo.resetLocalState();

    const reset = repo.getState();
    expect(reset.families).toEqual([]);
    expect(reset.children).toEqual([]);
    expect(reset.coin_transactions).toEqual([]);
  });

  it("resets only one demo day and regenerates playable quests", () => {
    const repo = createStartedRepo();
    repo.generateDailyQuests(MONDAY, "monday", "2026-06-29T07:00:00.000Z");
    repo.adjustCoins(25, "parent_adjustment", "2026-06-29T08:00:00.000Z");
    repo.completeQuest("starter-reading-2026-06-29", "2026-06-29T09:30:00.000Z");
    repo.requestReward("reward-pick-dessert", "2026-06-29T10:00:00.000Z");
    repo.markRestDay(MONDAY, "rest_day", "Testing reset", "2026-06-29T11:00:00.000Z");

    const reset = repo.resetDemoDay(MONDAY, "monday", "2026-06-29T12:00:00.000Z");

    expect(reset.restDay).toEqual({ active: false, message: null });
    expect(reset.createdInstances).toHaveLength(4);

    const state = repo.getState();
    expect(state.children[0].coin_balance).toBe(25);
    expect(state.children[0].total_xp).toBe(0);
    expect(state.rest_days.some((restDay) => restDay.date === MONDAY)).toBe(false);
    expect(state.reward_redemptions).toEqual([]);
    expect(state.xp_transactions).toEqual([]);
    expect(state.coin_transactions).toEqual([
      expect.objectContaining({
        amount: 25,
        reason: "parent_adjustment",
      }),
    ]);
    expect(state.quest_instances.filter((instance) => instance.quest_date === MONDAY)).toHaveLength(4);
    expect(state.quest_instances.every((instance) => instance.status === "not_started")).toBe(true);
  });

  it("verifies the current PIN before a repository-level PIN reset", () => {
    const repo = createStartedRepo();
    const originalHash = repo.getState().users[0].kid_mode_pin_hash;

    expect(repo.verifyKidModePin("0000")).toBe(false);
    expect(repo.getState().users[0].kid_mode_pin_hash).toBe(originalHash);

    expect(repo.verifyKidModePin("1234")).toBe(true);
    repo.resetKidModePin("9876", "2026-06-29T12:00:00.000Z");

    expect(repo.verifyKidModePin("1234")).toBe(false);
    expect(repo.verifyKidModePin("9876")).toBe(true);
  });
});

function createStartedRepo() {
  const repo = createDemoRepository();
  const { child } = repo.onboardParent({
    familyName: "River Family",
    parentEmail: "parent@example.com",
    childName: "Mina",
    childAvatar: "🧭",
    ageBand: "younger",
    kidPin: "1234",
    timeZone: "America/Los_Angeles",
    now: "2026-06-27T12:00:00.000Z",
  });
  repo.useStarterPlan(child.id, "2026-06-27T12:05:00.000Z");
  return repo;
}
