import { describe, expect, it } from "vitest";

import { calculateCoins, calculateXp } from "../../lib/game/economy";

describe("economy calculations", () => {
  it.each([
    { durationMinutes: 15, xp: 25, coins: 5 },
    { durationMinutes: 20, xp: 30, coins: 6 },
    { durationMinutes: 30, xp: 45, coins: 9 },
    { durationMinutes: 45, xp: 70, coins: 14 },
    { durationMinutes: 60, xp: 90, coins: 18 },
  ])(
    "calculates $xp XP and $coins coins for $durationMinutes minutes",
    ({ durationMinutes, xp, coins }) => {
      expect(calculateXp(durationMinutes)).toBe(xp);
      expect(calculateCoins(xp)).toBe(coins);
    },
  );

  it("clamps invalid XP inputs to 0", () => {
    expect(calculateXp(-10)).toBe(0);
    expect(calculateXp(Number.NaN)).toBe(0);
  });

  it("clamps invalid coin inputs to 0", () => {
    expect(calculateCoins(-25)).toBe(0);
    expect(calculateCoins(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
