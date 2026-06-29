import { describe, expect, it } from "vitest";

import { REWARD_ICON_OPTIONS } from "../../lib/demo/rewardIcons";

describe("reward icon options", () => {
  it("includes common reward icons and keeps them unique", () => {
    expect(REWARD_ICON_OPTIONS).toEqual(expect.arrayContaining(["🎟️", "🍰", "🍝", "🌙", "🎮", "🎬", "🧺"]));
    expect(new Set(REWARD_ICON_OPTIONS).size).toBe(REWARD_ICON_OPTIONS.length);
  });
});
