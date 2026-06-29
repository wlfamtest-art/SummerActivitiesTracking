import { describe, expect, it } from "vitest";

import {
  getUnlockState,
  validateUnlockRule,
  type UnlockableQuest,
  type UnlockQuestInstance,
} from "../../lib/game/unlocks";

function quest(overrides: Partial<UnlockableQuest> & Pick<UnlockableQuest, "id" | "name">): UnlockableQuest {
  return {
    active: true,
    active_days: ["monday", "tuesday"],
    unlock_mode: "always",
    prerequisite_quest_ids: [],
    ...overrides,
  };
}

function instance(
  assignedQuestId: string,
  status: UnlockQuestInstance["status"],
): UnlockQuestInstance {
  return {
    assigned_quest_id: assignedQuestId,
    status,
  };
}

describe("unlock validation", () => {
  it("accepts always unlocked quests without prerequisites", () => {
    const reading = quest({ id: "reading", name: "Reading" });

    expect(validateUnlockRule(reading, [reading])).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it("rejects self dependencies", () => {
    const reading = quest({
      id: "reading",
      name: "Reading",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["reading"],
    });

    expect(validateUnlockRule(reading, [reading]).errors).toContain(
      "Reading cannot depend on itself.",
    );
  });

  it("rejects inactive prerequisites", () => {
    const chores = quest({ id: "chores", name: "Chores", active: false });
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["chores"],
    });

    expect(validateUnlockRule(screen, [chores, screen]).errors).toContain(
      "Screen Time depends on inactive quest Chores.",
    );
  });

  it("rejects circular dependencies", () => {
    const reading = quest({
      id: "reading",
      name: "Reading",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["screen"],
    });
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["reading"],
    });

    expect(validateUnlockRule(screen, [reading, screen]).errors).toContain(
      "Screen Time has a circular unlock dependency.",
    );
  });

  it("rejects prerequisite chains that cannot unlock on a shared active day", () => {
    const weekendReading = quest({
      id: "reading",
      name: "Reading",
      active_days: ["saturday"],
    });
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      active_days: ["monday"],
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["reading"],
    });

    const result = validateUnlockRule(screen, [weekendReading, screen]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Screen Time cannot unlock from Reading because they share no active days.",
    );
    expect(result.warnings).toContain(
      "Screen Time and Reading do not share active days.",
    );
  });

  it("rejects multi-hop prerequisite chains that cannot complete on any shared active day", () => {
    const questA = quest({
      id: "quest-a",
      name: "Quest A",
      active_days: ["monday"],
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["quest-b"],
    });
    const questB = quest({
      id: "quest-b",
      name: "Quest B",
      active_days: ["monday"],
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["quest-c"],
    });
    const questC = quest({
      id: "quest-c",
      name: "Quest C",
      active_days: ["tuesday"],
    });

    const result = validateUnlockRule(questA, [questA, questB, questC]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Quest A has an impossible unlock chain through Quest C.",
    );
  });

  it("rejects after-multiple prerequisites that cannot all complete on one shared active day", () => {
    const reading = quest({
      id: "reading",
      name: "Reading",
      active_days: ["monday"],
    });
    const outdoor = quest({
      id: "outdoor",
      name: "Outdoor Play",
      active_days: ["tuesday"],
    });
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      active_days: ["monday", "tuesday"],
      unlock_mode: "after_multiple",
      prerequisite_quest_ids: ["reading", "outdoor"],
    });

    const result = validateUnlockRule(screen, [reading, outdoor, screen]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Screen Time has impossible after-multiple unlock requirements because Reading, Outdoor Play, and Screen Time share no active day.",
    );
  });
});

describe("unlock state", () => {
  it("keeps always quests unlocked", () => {
    const reading = quest({ id: "reading", name: "Reading" });

    expect(getUnlockState(reading, [])).toEqual({
      unlocked: true,
      lockedMessage: null,
    });
  });

  it("unlocks after one selected prerequisite instance is completed", () => {
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["reading", "outdoor"],
    });

    expect(
      getUnlockState(screen, [
        instance("reading", "submitted"),
        instance("outdoor", "completed"),
      ]).unlocked,
    ).toBe(true);
  });

  it("does not treat a parent-submitted prerequisite as completed", () => {
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      unlock_mode: "after_one",
      prerequisite_quest_ids: ["chores"],
    });

    expect(getUnlockState(screen, [instance("chores", "submitted")])).toEqual({
      unlocked: false,
      lockedMessage: "Locked until Chores is complete.",
    });
  });

  it("unlocks after multiple prerequisites only when all are completed", () => {
    const screen = quest({
      id: "screen",
      name: "Screen Time",
      unlock_mode: "after_multiple",
      prerequisite_quest_ids: ["reading", "outdoor"],
    });

    expect(
      getUnlockState(screen, [
        instance("reading", "completed"),
        instance("outdoor", "submitted"),
      ]),
    ).toEqual({
      unlocked: false,
      lockedMessage: "Locked until Reading and Outdoor Play are complete.",
    });

    expect(
      getUnlockState(screen, [
        instance("reading", "completed"),
        instance("outdoor", "completed"),
      ]).unlocked,
    ).toBe(true);
  });
});
