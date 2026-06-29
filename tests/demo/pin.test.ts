import { describe, expect, it } from "vitest";

import { hashKidPin, verifyKidPin } from "../../lib/demo/pin";

describe("Kid Mode PIN helper", () => {
  it("hashes and verifies a four-digit PIN without exposing plaintext", () => {
    const hash = hashKidPin("1234");

    expect(hash).not.toBe("1234");
    expect(verifyKidPin("1234", hash)).toBe(true);
    expect(verifyKidPin("4321", hash)).toBe(false);
  });

  it("rejects non-four-digit PIN values", () => {
    expect(() => hashKidPin("123")).toThrow("Kid Mode PIN must be exactly 4 digits.");
    expect(() => hashKidPin("abcd")).toThrow("Kid Mode PIN must be exactly 4 digits.");
  });
});
