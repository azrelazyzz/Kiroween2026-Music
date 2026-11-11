import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  normalizeBarcode,
  normalizeEvidence,
  normalizeMatrix,
  normalizeText,
} from "@/lib/domain/normalize";

describe("identifier normalization", () => {
  it("normalizes representative record identifiers without changing source evidence", () => {
    const evidence = {
      artist: "  Mara   VOSS ",
      barcode: "0 712-345-678901",
      matrix: " ae-017 / a1  lumen ",
    };
    const original = structuredClone(evidence);

    expect(normalizeEvidence(evidence)).toEqual({
      artist: "mara voss",
      barcode: "0712345678901",
      matrix: "AE 017 A1 LUMEN",
    });
    expect(evidence).toEqual(original);
  });

  it("is idempotent for text and matrix keys", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        expect(normalizeText(normalizeText(value))).toBe(normalizeText(value));
        expect(normalizeMatrix(normalizeMatrix(value))).toBe(
          normalizeMatrix(value),
        );
      }),
    );
  });

  it("produces digit-only barcodes while preserving leading zeroes", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        expect(normalizeBarcode(value)).toMatch(/^\d*$/);
      }),
    );
    expect(normalizeBarcode("00 123-45")).toBe("0012345");
  });
});
