import { beforeEach, describe, expect, it } from "vitest";

import { loadState } from "../../lib/demo/store";

const storageKey = "summer-quest-demo-state";

describe("demo store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to an empty state when stored demo data cannot be parsed", () => {
    window.localStorage.setItem(storageKey, "{bad-json");

    const state = loadState();

    expect(state.children).toEqual([]);
    expect(window.localStorage.getItem(storageKey)).toBeNull();
  });
});
