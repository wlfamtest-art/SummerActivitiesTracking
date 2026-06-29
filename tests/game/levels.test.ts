import { describe, expect, it } from "vitest";

import { LEVELS } from "../../lib/game/constants";
import {
  getLevelForXp,
  getLevelMessage,
  getLevelProgress,
} from "../../lib/game/levels";

describe("level calculations", () => {
  it("returns level 1 at 0 XP", () => {
    expect(getLevelForXp(0)).toEqual(LEVELS[0]);
  });

  it("uses threshold boundaries for matching levels", () => {
    expect(getLevelForXp(74)).toEqual(LEVELS[0]);
    expect(getLevelForXp(75)).toEqual(LEVELS[1]);
    expect(getLevelForXp(174)).toEqual(LEVELS[1]);
    expect(getLevelForXp(175)).toEqual(LEVELS[2]);
  });

  it("returns level 20 at the legendary threshold", () => {
    expect(getLevelForXp(4800)).toEqual(LEVELS[19]);
  });

  it("caps continued XP over level 20 at level 20", () => {
    expect(getLevelForXp(6000)).toEqual(LEVELS[19]);
  });

  it("treats non-finite XP as level 1", () => {
    expect(getLevelForXp(Number.NaN)).toEqual(LEVELS[0]);
  });

  it("returns safe copies for level lookups", () => {
    const returnedLevel = getLevelForXp(0) as { title: string };
    returnedLevel.title = "Mutated Level";

    expect(getLevelForXp(0)).toEqual(LEVELS[0]);
  });

  it("returns progress values for a level in progress", () => {
    expect(getLevelProgress(100)).toEqual({
      currentLevel: LEVELS[1],
      nextLevel: LEVELS[2],
      currentXp: 100,
      nextLevelXp: 175,
      xpIntoLevel: 25,
      xpForNextLevel: 100,
      percent: 25,
    });
  });

  it("returns safe copies for progress levels", () => {
    const progress = getLevelProgress(100);
    (progress.currentLevel as { title: string }).title = "Mutated Current";
    (progress.nextLevel! as { title: string }).title = "Mutated Next";

    expect(getLevelProgress(100)).toEqual({
      currentLevel: LEVELS[1],
      nextLevel: LEVELS[2],
      currentXp: 100,
      nextLevelXp: 175,
      xpIntoLevel: 25,
      xpForNextLevel: 100,
      percent: 25,
    });
  });

  it("keeps progress full at level 20", () => {
    expect(getLevelProgress(6000)).toEqual({
      currentLevel: LEVELS[19],
      nextLevel: null,
      currentXp: 6000,
      nextLevelXp: null,
      xpIntoLevel: 1200,
      xpForNextLevel: 0,
      percent: 100,
    });
  });

  it("returns the required level 20 message exactly at level 20", () => {
    expect(getLevelMessage(4800)).toBe(
      "You’ve reached Legendary Adventurer — the highest rank! Keep completing quests to earn more Gold Coins.",
    );
  });
});
