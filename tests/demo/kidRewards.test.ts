import { describe, expect, it } from "vitest";

import { getKidVisibleRewards } from "../../lib/demo/kidRewards";

describe("kid visible rewards", () => {
  it("shows every active reward, including rewards added after starter rewards", () => {
    const rewards = [
      { id: "starter-1", active: true },
      { id: "starter-2", active: true },
      { id: "starter-3", active: true },
      { id: "starter-4", active: true },
      { id: "starter-5", active: true },
      { id: "custom-new", active: true },
      { id: "hidden", active: false },
    ];

    expect(getKidVisibleRewards(rewards).map((reward) => reward.id)).toEqual([
      "starter-1",
      "starter-2",
      "starter-3",
      "starter-4",
      "starter-5",
      "custom-new",
    ]);
  });
});
