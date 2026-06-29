import { describe, expect, it } from "vitest";

import { getParentReviewHistory } from "../../lib/demo/reviewHistory";

describe("parent review history", () => {
  it("combines recent quest and reward decisions newest first", () => {
    const history = getParentReviewHistory({
      questInstances: [
        {
          id: "reading-1",
          name: "Reading",
          approval_mode: "auto",
          status: "completed",
          completed_at: "2026-06-29T15:00:00.000Z",
          denied_at: null,
          updated_at: "2026-06-29T15:00:00.000Z",
          xp_value: 45,
          coin_value: 9,
        },
        {
          id: "chores-1",
          name: "Chores",
          approval_mode: "parent",
          status: "completed",
          completed_at: "2026-06-29T17:00:00.000Z",
          denied_at: null,
          updated_at: "2026-06-29T17:00:00.000Z",
          xp_value: 30,
          coin_value: 6,
        },
        {
          id: "room-1",
          name: "Clean room",
          approval_mode: "parent",
          status: "denied",
          completed_at: null,
          denied_at: "2026-06-29T18:00:00.000Z",
          updated_at: "2026-06-29T18:00:00.000Z",
          xp_value: 20,
          coin_value: 4,
        },
      ],
      rewards: [{ id: "reward-movie", name: "Movie night pick" }],
      redemptions: [
        {
          id: "redemption-1",
          reward_id: "reward-movie",
          status: "approved_for_later",
          cost: 60,
          requested_at: "2026-06-29T16:00:00.000Z",
          resolved_at: "2026-06-29T19:00:00.000Z",
          updated_at: "2026-06-29T19:00:00.000Z",
        },
      ],
    });

    expect(history.map((item) => item.title)).toEqual(["Movie night pick", "Clean room", "Chores"]);
    expect(history.map((item) => item.outcome)).toEqual(["approved_for_later", "denied", "approved"]);
    expect(history.map((item) => item.detail)).toEqual([
      "Approved for later. 60 coins reserved.",
      "Denied. No XP or coins awarded.",
      "Approved. 30 XP and 6 coins awarded.",
    ]);
  });
});
