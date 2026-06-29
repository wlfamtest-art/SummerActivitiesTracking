import { describe, expect, it } from "vitest";

import {
  formatLocalDate,
  getDateForWeekday,
  getWeekdayForDate,
  getWeekStartMonday,
  isWeekday,
} from "../../lib/dates/weekdays";

describe("weekday date helpers", () => {
  it("validates only lowercase weekday values from constants", () => {
    expect(isWeekday("monday")).toBe(true);
    expect(isWeekday("sunday")).toBe(true);
    expect(isWeekday("Monday")).toBe(false);
    expect(isWeekday("weekday")).toBe(false);
  });

  it("returns the Monday week start for dates in the same week", () => {
    expect(getWeekStartMonday("2026-06-22")).toBe("2026-06-22");
    expect(getWeekStartMonday("2026-06-25")).toBe("2026-06-22");
  });

  it("returns the date for a weekday in a Monday-start week", () => {
    expect(getDateForWeekday("2026-06-29", "monday")).toBe("2026-06-29");
    expect(getDateForWeekday("2026-06-29", "friday")).toBe("2026-07-03");
    expect(getDateForWeekday("2026-06-29", "sunday")).toBe("2026-07-05");
  });

  it("maps Sunday to sunday and returns the previous Monday as week start", () => {
    expect(getWeekdayForDate("2026-06-28")).toBe("sunday");
    expect(getWeekStartMonday("2026-06-28")).toBe("2026-06-22");
  });

  it("throws a clear error for invalid date keys", () => {
    expect(() => getWeekdayForDate("2026-02-31")).toThrow(
      'Invalid date key "2026-02-31". Expected YYYY-MM-DD.',
    );
    expect(() => getWeekStartMonday("2026-6-22")).toThrow(
      'Invalid date key "2026-6-22". Expected YYYY-MM-DD.',
    );
  });

  it("converts dates to lowercase weekdays without Sunday/Monday index drift", () => {
    expect(getWeekdayForDate(new Date("2026-06-22T12:00:00Z"), "UTC")).toBe("monday");
    expect(getWeekdayForDate(new Date("2026-06-28T12:00:00Z"), "UTC")).toBe("sunday");
  });

  it("formats local calendar components instead of slicing UTC strings", () => {
    const localDate = new Date(2026, 0, 5);

    expect(formatLocalDate(localDate)).toBe("2026-01-05");
  });
});
