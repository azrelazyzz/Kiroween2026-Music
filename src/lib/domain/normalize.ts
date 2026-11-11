import type { Evidence } from "@/lib/domain/types";

export type NormalizedEvidence = {
  artist?: string;
  title?: string;
  label?: string;
  catalogueNumber?: string;
  barcode?: string;
  matrix?: string;
  country?: string;
  year?: number;
  format?: string;
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeCompact(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleUpperCase("en")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function normalizeBarcode(value: string): string {
  return value.normalize("NFKC").replace(/\D/g, "");
}

export function normalizeMatrix(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleUpperCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeEvidence(evidence: Evidence): NormalizedEvidence {
  return {
    ...(evidence.artist ? { artist: normalizeText(evidence.artist) } : {}),
    ...(evidence.title ? { title: normalizeText(evidence.title) } : {}),
    ...(evidence.label ? { label: normalizeText(evidence.label) } : {}),
    ...(evidence.catalogueNumber
      ? { catalogueNumber: normalizeCompact(evidence.catalogueNumber) }
      : {}),
    ...(evidence.barcode
      ? { barcode: normalizeBarcode(evidence.barcode) }
      : {}),
    ...(evidence.matrix ? { matrix: normalizeMatrix(evidence.matrix) } : {}),
    ...(evidence.country ? { country: normalizeText(evidence.country) } : {}),
    ...(evidence.year ? { year: evidence.year } : {}),
    ...(evidence.format ? { format: normalizeText(evidence.format) } : {}),
  };
}

export function tokenDiceCoefficient(left: string, right: string): number {
  if (left === right) return left.length > 0 ? 1 : 0;

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) shared += 1;
  }

  return (2 * shared) / (leftTokens.size + rightTokens.size);
}
