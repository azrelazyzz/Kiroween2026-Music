import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { rankReleases, scoreRelease } from "@/lib/domain/matching";
import type { Evidence, Release } from "@/lib/domain/types";

function release(id: string, overrides: Partial<Release> = {}): Release {
  return {
    source: { provider: "demo", releaseId: id },
    artist: "Mara Voss",
    title: "Night Transit",
    releaseDate: "1987",
    year: 1987,
    country: "GB",
    labels: [{ name: "Afterglow Editions", catalogueNumber: "AE-017" }],
    formats: [{ name: "Vinyl", details: ["LP"] }],
    barcode: "0712345678901",
    identifiers: [{ type: "Matrix / Runout", value: "AE 017 A1 LUMEN" }],
    genres: ["Electronic"],
    styles: ["Synth-pop"],
    tracks: [],
    ...overrides,
  };
}

describe("matching", () => {
  it("prioritizes exact strong identifiers and explains every supplied clue", () => {
    const candidate = scoreRelease(
      {
        barcode: "0712 345678901",
        catalogueNumber: "AE017",
        artist: "Mara Voss",
      },
      release("uk"),
    );

    expect(candidate.score).toBe(100);
    expect(candidate.confidence).toBe("high");
    expect(candidate.reasons).toHaveLength(3);
    expect(candidate.reasons.map((item) => item.outcome)).toEqual([
      "match",
      "match",
      "match",
    ]);
  });

  it("never labels a strong identifier conflict as high confidence", () => {
    const candidate = scoreRelease(
      {
        barcode: "9999999999999",
        matrix: "AE 017 A1 LUMEN",
        catalogueNumber: "AE017",
        artist: "Mara Voss",
        title: "Night Transit",
      },
      release("conflict"),
    );

    expect(candidate.score).toBeLessThan(80);
    expect(candidate.confidence).not.toBe("high");
    expect(candidate.reasons).toContainEqual(
      expect.objectContaining({ field: "barcode", outcome: "conflict" }),
    );
  });

  it("keeps every generated score in the inclusive 0–100 range", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 80 }),
        fc.string({ maxLength: 80 }),
        (artist, title) => {
          const evidence: Evidence = {
            ...(artist ? { artist } : {}),
            ...(title ? { title } : {}),
            barcode: "0123456789012",
          };
          const result = scoreRelease(
            evidence,
            release("property", { artist, title, barcode: "9999999999999" }),
          );
          expect(Number.isInteger(result.score)).toBe(true);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        },
      ),
    );
  });

  it("ranks deterministically without mutating input releases", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 15 }),
        (ids) => {
          const releases = ids.map((id) => release(id));
          const original = structuredClone(releases);
          const evidence = { artist: "Mara Voss", title: "Night Transit" };
          const first = rankReleases(evidence, releases).map(
            (item) => item.release.source.releaseId,
          );
          const second = rankReleases(evidence, releases).map(
            (item) => item.release.source.releaseId,
          );
          expect(first).toEqual(second);
          expect(releases).toEqual(original);
        },
      ),
    );
  });
});
