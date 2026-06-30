import React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { SummerQuestApp } from "../../components/SummerQuestApp";

describe("SummerQuestApp initial render", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the setup screen immediately instead of a hydration-only loading state", () => {
    const html = renderToString(<SummerQuestApp />);

    expect(html).toContain("Set up the first adventure week");
    expect(html).not.toContain("Loading Summer Quest...");
  });
});
