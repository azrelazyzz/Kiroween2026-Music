import { describe, expect, it } from "vitest";

import { demoCollectionSeed } from "@/lib/demo/fixtures";
import { calculateCollectionAnalytics } from "@/lib/domain/analytics";

describe("collection analytics", () => {
  it("counts copies separately while grouping unique provider releases", () => {
    const analytics = calculateCollectionAnalytics(demoCollectionSeed);

    expect(analytics.totalCopies).toBe(4);
    expect(analytics.uniqueReleases).toBe(3);
    expect(analytics.favorites).toBe(2);
    expect(analytics.unidentified).toBe(0);
    expect(analytics.topGenres).toEqual([
      { label: "Jazz", count: 2 },
      { label: "Electronic", count: 1 },
      { label: "Rock", count: 1 },
    ]);
  });
});
