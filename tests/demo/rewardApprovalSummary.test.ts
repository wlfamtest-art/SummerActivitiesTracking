import { describe, expect, it } from "vitest";

import { getRewardApprovalSummary } from "../../lib/demo/rewardApprovalSummary";

describe("reward approval summary", () => {
  it("shows the current balance, cost, and projected balance", () => {
    expect(getRewardApprovalSummary({ coinBalance: 45, rewardCost: 20 })).toEqual({
      coinBalance: 45,
      rewardCost: 20,
      projectedBalance: 25,
      willOverdraw: false,
    });
  });

  it("flags reward approvals that would make the balance negative", () => {
    expect(getRewardApprovalSummary({ coinBalance: 10, rewardCost: 20 })).toEqual({
      coinBalance: 10,
      rewardCost: 20,
      projectedBalance: -10,
      willOverdraw: true,
    });
  });
});
