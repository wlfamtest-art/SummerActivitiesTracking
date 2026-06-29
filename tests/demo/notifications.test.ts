import { describe, expect, it } from "vitest";

import { getKidNotifications } from "../../lib/demo/notifications";

describe("kid notifications", () => {
  it("shows recent quest approvals and denials with kid-safe copy", () => {
    const notifications = getKidNotifications({
      questInstances: [
        {
          id: "reading-1",
          name: "Reading",
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
          status: "denied",
          completed_at: null,
          denied_at: "2026-06-29T16:00:00.000Z",
          updated_at: "2026-06-29T16:00:00.000Z",
          xp_value: 30,
          coin_value: 6,
        },
      ],
      rewards: [],
      redemptions: [],
    });

    expect(notifications.map((item) => item.message)).toEqual([
      "Chores needs another try. Check with your parent if you have questions!",
      "Reading was approved. You earned 45 XP and 9 Gold Coins.",
    ]);
  });

  it("shows recent reward approval and denial decisions", () => {
    const notifications = getKidNotifications({
      questInstances: [],
      rewards: [
        { id: "reward-dessert", name: "Pick dessert" },
        { id: "reward-movie", name: "Movie night pick" },
      ],
      redemptions: [
        {
          id: "redemption-1",
          reward_id: "reward-dessert",
          status: "approved",
          updated_at: "2026-06-29T17:00:00.000Z",
          resolved_at: "2026-06-29T17:00:00.000Z",
        },
        {
          id: "redemption-2",
          reward_id: "reward-movie",
          status: "denied",
          updated_at: "2026-06-29T18:00:00.000Z",
          resolved_at: "2026-06-29T18:00:00.000Z",
        },
      ],
    });

    expect(notifications.map((item) => item.message)).toEqual([
      "Movie night pick was not approved this time. No Gold Coins were spent.",
      "Pick dessert was approved from the Treasure Chest.",
    ]);
  });
});
