import type { QuestInstanceStatus } from "./types";
import { formatLocalDate, parseStrictDateKey } from "../dates/weekdays";

export interface StreakQuestInstance {
  quest_date: string;
  status: QuestInstanceStatus;
}

export type RecentDayStatus = "completed" | "rest" | "missed" | "inactive";

export interface RecentStreakDay {
  dateKey: string;
  status: RecentDayStatus;
}

export interface CalculateCurrentStreakInput {
  today: string;
  completedQuestInstances: readonly StreakQuestInstance[];
  restDays: readonly string[];
  activeDayMarkers: readonly string[];
  lookbackDays?: number;
}

export interface CurrentStreak {
  count: number;
  recentDayStatuses: RecentStreakDay[];
}

function addDays(dateKey: string, days: number): string {
  const date = parseStrictDateKey(dateKey);

  date.setDate(date.getDate() + days);

  return formatLocalDate(date);
}

export function calculateCurrentStreak(input: CalculateCurrentStreakInput): CurrentStreak {
  const lookbackDays = input.lookbackDays ?? 14;
  const completedDays = new Set(
    input.completedQuestInstances
      .filter((instance) => instance.status === "completed")
      .map((instance) => instance.quest_date),
  );
  const restDays = new Set(input.restDays);
  const activeDays = new Set(input.activeDayMarkers);
  const recentDayStatuses: RecentStreakDay[] = [];
  let count = 0;
  let streakBroken = false;

  for (let offset = 0; offset < lookbackDays; offset += 1) {
    const dateKey = addDays(input.today, -offset);
    let status: RecentDayStatus;

    if (completedDays.has(dateKey)) {
      status = "completed";

      if (!streakBroken) {
        count += 1;
      }
    } else if (restDays.has(dateKey)) {
      status = "rest";
    } else if (activeDays.has(dateKey)) {
      status = "missed";
      streakBroken = true;
    } else {
      status = "inactive";
    }

    recentDayStatuses.push({ dateKey, status });
  }

  return {
    count,
    recentDayStatuses,
  };
}
