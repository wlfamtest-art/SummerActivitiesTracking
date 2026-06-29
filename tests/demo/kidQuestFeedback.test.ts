import { describe, expect, it } from "vitest";

import { getKidQuestFeedback } from "../../lib/demo/kidQuestFeedback";

describe("kid quest feedback", () => {
  it("celebrates auto-awarded quest rewards", () => {
    expect(
      getKidQuestFeedback({
        name: "Read 20 minutes",
        icon: "📚",
        status: "completed",
        approvalMode: "auto",
        xpValue: 20,
        coinValue: 5,
      }),
    ).toEqual({
      icon: "📚",
      title: "Quest complete!",
      message: "Read 20 minutes earned 20 XP and 5 Gold Coins.",
      tone: "success",
    });
  });

  it("explains parent-review quest submissions", () => {
    expect(
      getKidQuestFeedback({
        name: "Clean room",
        icon: "🧺",
        status: "submitted",
        approvalMode: "parent",
        xpValue: 30,
        coinValue: 10,
      }),
    ).toEqual({
      icon: "🧺",
      title: "Sent to parent!",
      message: "Clean room is waiting for approval. Rewards unlock after your parent says yes.",
      tone: "review",
    });
  });
});
