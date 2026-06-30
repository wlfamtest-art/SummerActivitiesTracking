import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("today key integration", () => {
  it("does not hardcode the old demo date in app components", () => {
    const source = readFileSync("components/SummerQuestApp.tsx", "utf-8");

    expect(source).not.toContain("2026-06-29");
  });
});
