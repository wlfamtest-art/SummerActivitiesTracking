import { ACTIVITY_CATEGORIES } from "./constants";
import type { ActivityCategory, QuestInstanceStatus, Weekday } from "./types";
import {
  formatLocalDate,
  getWeekStartMonday,
  getWeekdayForDate,
  parseStrictDateKey,
} from "../dates/weekdays";

export interface WeeklyBalanceAssignedQuest {
  category: ActivityCategory;
  duration_minutes: number;
  active_days: readonly Weekday[];
}

export interface WeeklyBalanceQuestInstance {
  category: ActivityCategory;
  duration_minutes: number;
  quest_date: string;
  status: QuestInstanceStatus;
}

export interface CalculateWeeklyBalanceInput {
  assignedQuests: readonly WeeklyBalanceAssignedQuest[];
  completedQuestInstances: readonly WeeklyBalanceQuestInstance[];
  restDays?: readonly string[];
  excusedDateKeys: readonly string[];
  weekStartDate: string;
}

export interface WeeklyBalanceCategory {
  category: ActivityCategory;
  plannedMinutes: number;
  completedMinutes: number;
}

export interface WeeklyBalance {
  categories: WeeklyBalanceCategory[];
  excusedDates: string[];
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  nudge: string;
}

const DAYS_IN_WEEK = 7;

function addDays(dateKey: string, days: number): string {
  const date = parseStrictDateKey(dateKey);

  date.setDate(date.getDate() + days);

  return formatLocalDate(date);
}

function getWeekDateKeys(weekStartDate: string): string[] {
  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => addDays(weekStartDate, index));
}

function validateDateKeys(dateKeys: readonly string[]): void {
  for (const dateKey of dateKeys) {
    parseStrictDateKey(dateKey);
  }
}

function createCategoryRows(): WeeklyBalanceCategory[] {
  return ACTIVITY_CATEGORIES.map((category) => ({
    category,
    plannedMinutes: 0,
    completedMinutes: 0,
  }));
}

function findCategoryRow(
  categories: WeeklyBalanceCategory[],
  category: ActivityCategory,
): WeeklyBalanceCategory {
  return categories.find((entry) => entry.category === category)!;
}

function getNudge(categories: readonly WeeklyBalanceCategory[]): string {
  const physical = categories.find((entry) => entry.category === "Physical")!;
  const screen = categories.find((entry) => entry.category === "Screen")!;
  const creative = categories.find((entry) => entry.category === "Creative")!;
  const lifeSkills = categories.find((entry) => entry.category === "Life Skills")!;
  const activePlannedMinutes = categories
    .filter((entry) => entry.category !== "Screen")
    .reduce((total, entry) => total + entry.plannedMinutes, 0);

  if (physical.plannedMinutes === 0) {
    return "No physical activity planned yet.";
  }

  if (screen.plannedMinutes > activePlannedMinutes) {
    return "Screen time is high compared with active time.";
  }

  if (creative.plannedMinutes < 30) {
    return "Creative activities are low this week.";
  }

  if (lifeSkills.plannedMinutes >= 100) {
    return "Life skills are getting strong attention this week.";
  }

  return "Good balance this week.";
}

export function calculateWeeklyBalance(input: CalculateWeeklyBalanceInput): WeeklyBalance {
  const weekStartDate = getWeekStartMonday(input.weekStartDate);
  validateDateKeys(input.restDays ?? []);
  validateDateKeys(input.excusedDateKeys);
  validateDateKeys(input.completedQuestInstances.map((instance) => instance.quest_date));

  const weekDates = getWeekDateKeys(weekStartDate);
  const weekDateSet = new Set(weekDates);
  const excusedDates = Array.from(new Set([...(input.restDays ?? []), ...input.excusedDateKeys]))
    .filter((dateKey) => weekDateSet.has(dateKey))
    .sort();
  const excusedDateSet = new Set(excusedDates);
  const categories = createCategoryRows();

  for (const quest of input.assignedQuests) {
    for (const dateKey of weekDates) {
      if (excusedDateSet.has(dateKey)) {
        continue;
      }

      if (quest.active_days.includes(getWeekdayForDate(dateKey))) {
        findCategoryRow(categories, quest.category).plannedMinutes += quest.duration_minutes;
      }
    }
  }

  for (const instance of input.completedQuestInstances) {
    if (instance.status !== "completed" || !weekDateSet.has(instance.quest_date)) {
      continue;
    }

    findCategoryRow(categories, instance.category).completedMinutes += instance.duration_minutes;
  }

  return {
    categories,
    excusedDates,
    totalPlannedMinutes: categories.reduce((total, entry) => total + entry.plannedMinutes, 0),
    totalCompletedMinutes: categories.reduce((total, entry) => total + entry.completedMinutes, 0),
    nudge: getNudge(categories),
  };
}
