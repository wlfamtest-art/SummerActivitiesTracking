import { WEEKDAYS } from "../game/constants";
import type { Weekday } from "../game/types";
import { toLocalDateKey } from "./timezone";

const WEEKDAY_BY_UTC_DAY: readonly Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseStrictDateKey(dateKey: string): Date {
  const match = DATE_KEY_PATTERN.exec(dateKey);

  if (!match) {
    throw new Error(`Invalid date key "${dateKey}". Expected YYYY-MM-DD.`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date key "${dateKey}". Expected YYYY-MM-DD.`);
  }

  return date;
}

function getDateKey(dateOrDateKey: Date | string, timeZone?: string): string {
  if (typeof dateOrDateKey === "string") {
    return dateOrDateKey;
  }

  return timeZone ? toLocalDateKey(dateOrDateKey, timeZone) : formatLocalDate(dateOrDateKey);
}

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === "string" && WEEKDAYS.includes(value as Weekday);
}

export function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getWeekdayForDate(dateOrDateKey: Date | string, timeZone?: string): Weekday {
  const dateKey = getDateKey(dateOrDateKey, timeZone);
  const date = parseStrictDateKey(dateKey);

  return WEEKDAY_BY_UTC_DAY[date.getDay()];
}

export function getWeekStartMonday(dateOrDateKey: Date | string, timeZone?: string): string {
  const dateKey = getDateKey(dateOrDateKey, timeZone);
  const date = parseStrictDateKey(dateKey);
  const daysSinceMonday = (date.getDay() + 6) % 7;

  date.setDate(date.getDate() - daysSinceMonday);

  return formatLocalDate(date);
}

export function getDateForWeekday(weekStartMonday: string, weekday: Weekday): string {
  const date = parseStrictDateKey(weekStartMonday);
  const offset = WEEKDAYS.indexOf(weekday);

  if (offset < 0) {
    throw new Error(`Invalid weekday "${weekday}".`);
  }

  date.setDate(date.getDate() + offset);

  return formatLocalDate(date);
}
