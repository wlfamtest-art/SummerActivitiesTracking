import { describe, expect, it } from "vitest";

import { calculateWeeklyBalance } from "../../lib/game/balance";

describe("weekly balance calculations", () => {
  it("summarizes planned and completed minutes by category including Screen", () => {
    const balance = calculateWeeklyBalance({
      assignedQuests: [
        {
          category: "Learning",
          duration_minutes: 30,
          active_days: ["monday", "wednesday"],
        },
        {
          category: "Physical",
          duration_minutes: 45,
          active_days: ["tuesday"],
        },
        {
          category: "Screen",
          duration_minutes: 20,
          active_days: ["monday", "friday"],
        },
      ],
      completedQuestInstances: [
        {
          category: "Learning",
          duration_minutes: 30,
          quest_date: "2026-06-22",
          status: "completed",
        },
        {
          category: "Screen",
          duration_minutes: 20,
          quest_date: "2026-06-26",
          status: "completed",
        },
        {
          category: "Physical",
          duration_minutes: 45,
          quest_date: "2026-06-29",
          status: "completed",
        },
        {
          category: "Creative",
          duration_minutes: 25,
          quest_date: "2026-06-23",
          status: "submitted",
        },
      ],
      excusedDateKeys: [],
      weekStartDate: "2026-06-22",
    });

    expect(balance.categories).toEqual([
      { category: "Learning", plannedMinutes: 60, completedMinutes: 30 },
      { category: "Physical", plannedMinutes: 45, completedMinutes: 0 },
      { category: "Creative", plannedMinutes: 0, completedMinutes: 0 },
      { category: "Music", plannedMinutes: 0, completedMinutes: 0 },
      { category: "Life Skills", plannedMinutes: 0, completedMinutes: 0 },
      { category: "Screen", plannedMinutes: 40, completedMinutes: 20 },
      { category: "Custom", plannedMinutes: 0, completedMinutes: 0 },
    ]);
    expect(balance.totalPlannedMinutes).toBe(145);
    expect(balance.totalCompletedMinutes).toBe(50);
  });

  it("keeps rest days excused instead of counting their planned minutes as missed", () => {
    const balance = calculateWeeklyBalance({
      assignedQuests: [
        {
          category: "Learning",
          duration_minutes: 30,
          active_days: ["monday", "tuesday", "wednesday"],
        },
      ],
      completedQuestInstances: [],
      restDays: ["2026-06-23"],
      excusedDateKeys: ["2026-06-24"],
      weekStartDate: "2026-06-22",
    });

    expect(balance.excusedDates).toEqual(["2026-06-23", "2026-06-24"]);
    expect(balance.categories.find((entry) => entry.category === "Learning")).toEqual({
      category: "Learning",
      plannedMinutes: 30,
      completedMinutes: 0,
    });
    expect(balance.totalPlannedMinutes).toBe(30);
  });

  it("returns a nudge when physical activity is not planned", () => {
    const balance = calculateWeeklyBalance({
      assignedQuests: [
        {
          category: "Learning",
          duration_minutes: 30,
          active_days: ["monday"],
        },
      ],
      completedQuestInstances: [],
      excusedDateKeys: [],
      weekStartDate: "2026-06-22",
    });

    expect(balance.nudge).toBe("No physical activity planned yet.");
  });

  it("throws a clear error for invalid week start date keys", () => {
    expect(() =>
      calculateWeeklyBalance({
        assignedQuests: [],
        completedQuestInstances: [],
        excusedDateKeys: [],
        weekStartDate: "2026-02-31",
      }),
    ).toThrow('Invalid date key "2026-02-31". Expected YYYY-MM-DD.');
  });

  it("throws a clear error for invalid balance input date keys", () => {
    expect(() =>
      calculateWeeklyBalance({
        assignedQuests: [],
        completedQuestInstances: [],
        restDays: ["2026-06-31"],
        excusedDateKeys: [],
        weekStartDate: "2026-06-22",
      }),
    ).toThrow('Invalid date key "2026-06-31". Expected YYYY-MM-DD.');
  });
});
