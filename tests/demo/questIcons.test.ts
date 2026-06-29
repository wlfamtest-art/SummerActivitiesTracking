import { describe, expect, it } from "vitest";

import { QUEST_ICON_OPTIONS } from "../../lib/demo/questIcons";

describe("quest icon options", () => {
  it("includes common quest icons and keeps them unique", () => {
    expect(QUEST_ICON_OPTIONS).toEqual(expect.arrayContaining(["✨", "📚", "🏃", "🎨", "🎵", "🧹", "🌳"]));
    expect(new Set(QUEST_ICON_OPTIONS).size).toBe(QUEST_ICON_OPTIONS.length);
  });
});
