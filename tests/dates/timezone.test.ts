import { describe, expect, it } from "vitest";

import { getTodayInTimeZone, toLocalDateKey } from "../../lib/dates/timezone";

describe("timezone date helpers", () => {
  it("returns different local date keys for the same instant across timezones", () => {
    const instant = new Date("2026-06-27T06:30:00.000Z");

    expect(toLocalDateKey(instant, "America/Los_Angeles")).toBe("2026-06-26");
    expect(toLocalDateKey(instant, "Asia/Tokyo")).toBe("2026-06-27");
  });

  it("gets today in a requested IANA timezone using the supplied clock", () => {
    const now = new Date("2026-01-01T01:30:00.000Z");

    expect(getTodayInTimeZone("America/Los_Angeles", now)).toBe("2025-12-31");
    expect(getTodayInTimeZone("UTC", now)).toBe("2026-01-01");
  });

  it("throws a clear error for invalid timezone names", () => {
    const instant = new Date("2026-06-27T06:30:00.000Z");

    expect(() => toLocalDateKey(instant, "Not/A_Timezone")).toThrow(
      'Invalid IANA time zone "Not/A_Timezone".',
    );
    expect(() => getTodayInTimeZone("Not/A_Timezone", instant)).toThrow(
      'Invalid IANA time zone "Not/A_Timezone".',
    );
  });
});
