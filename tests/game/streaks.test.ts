import { describe, expect, it } from "vitest";

import {
  calculateCurrentStreak,
  type StreakQuestInstance,
} from "../../lib/game/streaks";

function completed(dateKey: string): StreakQuestInstance {
  return {
    quest_date: dateKey,
    status: "completed",
  };
}

describe("calculateCurrentStreak", () => {
  it("counts consecutive active days with completed quests", () => {
    const result = calculateCurrentStreak({
      today: "2026-06-27",
      completedQuestInstances: [
        completed("2026-06-25"),
        completed("2026-06-26"),
        completed("2026-06-27"),
      ],
      restDays: [],
      activeDayMarkers: ["2026-06-25", "2026-06-26", "2026-06-27"],
    });

    expect(result.count).toBe(3);
    expect(result.recentDayStatuses.slice(0, 3)).toEqual([
      { dateKey: "2026-06-27", status: "completed" },
      { dateKey: "2026-06-26", status: "completed" },
      { dateKey: "2026-06-25", status: "completed" },
    ]);
  });

  it("skips rest days without breaking the streak", () => {
    const result = calculateCurrentStreak({
      today: "2026-06-27",
      completedQuestInstances: [
        completed("2026-06-24"),
        completed("2026-06-26"),
        completed("2026-06-27"),
      ],
      restDays: ["2026-06-25"],
      activeDayMarkers: ["2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"],
    });

    expect(result.count).toBe(3);
    expect(result.recentDayStatuses.slice(0, 4)).toEqual([
      { dateKey: "2026-06-27", status: "completed" },
      { dateKey: "2026-06-26", status: "completed" },
      { dateKey: "2026-06-25", status: "rest" },
      { dateKey: "2026-06-24", status: "completed" },
    ]);
  });

  it("breaks on missed active days", () => {
    const result = calculateCurrentStreak({
      today: "2026-06-27",
      completedQuestInstances: [completed("2026-06-24"), completed("2026-06-27")],
      restDays: [],
      activeDayMarkers: ["2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"],
    });

    expect(result.count).toBe(1);
    expect(result.recentDayStatuses.slice(0, 3)).toEqual([
      { dateKey: "2026-06-27", status: "completed" },
      { dateKey: "2026-06-26", status: "missed" },
      { dateKey: "2026-06-25", status: "missed" },
    ]);
  });
});
