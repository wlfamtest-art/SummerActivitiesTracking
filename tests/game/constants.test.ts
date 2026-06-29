import { describe, expect, it } from "vitest";

import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_TEMPLATES,
  LEVELS,
  QUEST_INSTANCE_STATUSES,
  REST_DAY_TYPES,
  REWARD_REDEMPTION_STATUSES,
  STARTER_QUESTS,
  STARTER_REWARDS,
  WEEKDAYS,
} from "../../lib/game/constants";

describe("game constants", () => {
  it("defines the full 20-level progression table", () => {
    expect(LEVELS.length).toBe(20);
    expect(LEVELS).toEqual([
      { level: 1, xp: 0, title: "Trail Scout" },
      { level: 2, xp: 75, title: "Quest Rookie" },
      { level: 3, xp: 175, title: "Map Reader" },
      { level: 4, xp: 300, title: "Brave Adventurer" },
      { level: 5, xp: 450, title: "Forest Explorer" },
      { level: 6, xp: 625, title: "Treasure Seeker" },
      { level: 7, xp: 825, title: "Camp Champion" },
      { level: 8, xp: 1050, title: "Skill Builder" },
      { level: 9, xp: 1300, title: "Dragon Helper" },
      { level: 10, xp: 1575, title: "Quest Knight" },
      { level: 11, xp: 1875, title: "Adventure Captain" },
      { level: 12, xp: 2200, title: "Star Collector" },
      { level: 13, xp: 2550, title: "Challenge Master" },
      { level: 14, xp: 2925, title: "Dragon Tamer" },
      { level: 15, xp: 3325, title: "Summer Hero" },
      { level: 16, xp: 3750, title: "Legendary Scout" },
      { level: 17, xp: 4000, title: "Quest Guardian" },
      { level: 18, xp: 4250, title: "Treasure Master" },
      { level: 19, xp: 4525, title: "Summer Legend" },
      { level: 20, xp: 4800, title: "Legendary Adventurer" },
    ]);
  });

  it("defines the exact starter activity templates", () => {
    expect(ACTIVITY_TEMPLATES.map((template) => template.name)).toEqual([
      "Reading",
      "Outdoor Play",
      "Exercise",
      "Drawing",
      "Music Practice",
      "Chores",
      "Tidy Room",
      "Screen Time",
    ]);
    expect(ACTIVITY_TEMPLATES).toEqual([
      expect.objectContaining({ name: "Reading", category: "Learning", duration_minutes: 30, approval_mode: "auto" }),
      expect.objectContaining({ name: "Outdoor Play", category: "Physical", duration_minutes: 30, approval_mode: "auto" }),
      expect.objectContaining({ name: "Exercise", category: "Physical", duration_minutes: 30, approval_mode: "auto" }),
      expect.objectContaining({ name: "Drawing", category: "Creative", duration_minutes: 20, approval_mode: "auto" }),
      expect.objectContaining({ name: "Music Practice", category: "Music", duration_minutes: 30, approval_mode: "auto" }),
      expect.objectContaining({ name: "Chores", category: "Life Skills", duration_minutes: 20, approval_mode: "parent" }),
      expect.objectContaining({ name: "Tidy Room", category: "Life Skills", duration_minutes: 15, approval_mode: "parent" }),
      expect.objectContaining({ name: "Screen Time", category: "Screen", duration_minutes: 45, approval_mode: "auto" }),
    ]);
  });

  it("defines exactly the five starter quests", () => {
    expect(STARTER_QUESTS.map((quest) => quest.name)).toEqual([
      "Reading",
      "Outdoor Play",
      "Chores",
      "Drawing",
      "Screen Time",
    ]);
  });

  it("sets starter quest schedules, value, and approval modes", () => {
    const questsByName = Object.fromEntries(STARTER_QUESTS.map((quest) => [quest.name, quest]));
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const weekends = ["saturday", "sunday"];

    expect(questsByName.Reading).toMatchObject({
      duration_minutes: 30,
      active_days: weekdays,
      suggested_time_window: "morning",
      completion_deadline: "before lunch",
      approval_mode: "auto",
      xp_value: 45,
      coin_value: 9,
    });
    expect(questsByName["Outdoor Play"]).toMatchObject({
      duration_minutes: 30,
      active_days: weekdays,
      suggested_time_window: "afternoon",
      completion_deadline: "before dinner",
      approval_mode: "auto",
      xp_value: 45,
      coin_value: 9,
    });
    expect(questsByName.Chores).toMatchObject({
      duration_minutes: 20,
      active_days: weekdays,
      suggested_time_window: "before dinner",
      completion_deadline: "before dinner",
      approval_mode: "parent",
      xp_value: 30,
      coin_value: 6,
    });
    expect(questsByName.Drawing).toMatchObject({
      duration_minutes: 20,
      active_days: weekends,
      suggested_time_window: "afternoon",
      completion_deadline: "end of day",
      approval_mode: "auto",
      xp_value: 30,
      coin_value: 6,
    });
  });

  it("locks Screen Time behind Reading and Outdoor Play with no rewards", () => {
    expect(STARTER_QUESTS.find((quest) => quest.name === "Screen Time")).toMatchObject({
      name: "Screen Time",
      xp_value: 0,
      coin_value: 0,
      duration_minutes: 45,
      active_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      suggested_time_window: "evening",
      completion_deadline: "before screen time or end of day",
      approval_mode: "auto",
      unlock_mode: "after_multiple",
      prerequisite_quest_ids: ["starter-reading", "starter-outdoor-play"],
    });
  });

  it("defines the exact starter rewards", () => {
    expect(STARTER_REWARDS.map(({ name, cost }) => ({ name, cost }))).toEqual([
      { name: "Pick dessert", cost: 20 },
      { name: "Pick dinner", cost: 30 },
      { name: "Stay up 30 minutes late", cost: 40 },
      { name: "Extra 30 minutes screen time", cost: 45 },
      { name: "Movie night pick", cost: 60 },
      { name: "Ice cream trip", cost: 80 },
      { name: "Bowling trip", cost: 200 },
      { name: "Big family outing", cost: 300 },
    ]);
  });

  it("defines lowercase weekdays from Monday through Sunday", () => {
    expect(WEEKDAYS).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);
  });

  it("defines the activity categories", () => {
    expect(ACTIVITY_CATEGORIES).toEqual([
      "Learning",
      "Physical",
      "Creative",
      "Music",
      "Life Skills",
      "Screen",
      "Custom",
    ]);
  });

  it("defines persisted quest and reward statuses", () => {
    expect(QUEST_INSTANCE_STATUSES).toEqual([
      "not_started",
      "in_progress",
      "submitted",
      "completed",
      "denied",
    ]);
    expect(REWARD_REDEMPTION_STATUSES).toEqual([
      "requested",
      "approved",
      "denied",
      "approved_for_later",
      "cancelled",
    ]);
  });

  it("defines rest day types", () => {
    expect(REST_DAY_TYPES).toEqual([
      "rest_day",
      "sick_day",
      "travel_day",
      "camp_day",
      "family_day",
      "parent_excused_day",
    ]);
  });
});
