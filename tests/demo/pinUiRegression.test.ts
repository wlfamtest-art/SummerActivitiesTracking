import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("Kid Mode PIN UI regression", () => {
  it("does not hardcode or prefill the demo PIN in the app component", () => {
    const source = readFileSync("components/SummerQuestApp.tsx", "utf-8");

    expect(source).not.toContain('kidPin: "1234"');
    expect(source).not.toContain("4-digit Kid Mode PIN: 1234");
    expect(source).not.toContain('useState("1234")');
  });
});
