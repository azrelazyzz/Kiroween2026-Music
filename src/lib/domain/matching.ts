import {
  normalizeBarcode,
  normalizeCompact,
  normalizeEvidence,
  normalizeMatrix,
  normalizeText,
  tokenDiceCoefficient,
} from "@/lib/domain/normalize";
import type {
  Evidence,
  EvidenceField,
  MatchCandidate,
  MatchReason,
  Release,
} from "@/lib/domain/types";

function reason(
  field: EvidenceField,
  outcome: MatchReason["outcome"],
  explanation: string,
  points: number,
): MatchReason {
  return { field, outcome, explanation, points };
}

function compareText(
  field: "artist" | "title",
  expected: string,
  actual: string,
): MatchReason {
  const normalizedActual = normalizeText(actual);
  if (expected === normalizedActual) {
    return reason(field, "match", `Exact ${field} match`, 18);
  }

  const similarity = tokenDiceCoefficient(expected, normalizedActual);
  if (similarity >= 0.5) {
    return reason(
      field,
      "match",
      `Similar ${field} wording`,
      Math.max(1, Math.round(similarity * 14)),
    );
  }

  return reason(field, "conflict", `${field} differs`, -12);
}

function firstLabel(release: Release): string | undefined {
  return release.labels[0]?.name;
}

function catalogueNumbers(release: Release): string[] {
  return release.labels.flatMap((label) =>
    label.catalogueNumber ? [normalizeCompact(label.catalogueNumber)] : [],
  );
}

function matrixValues(release: Release): string[] {
  return release.identifiers
    .filter((identifier) => /matrix|runout/i.test(identifier.type))
    .map((identifier) => normalizeMatrix(identifier.value));
}

function formatValues(release: Release): string[] {
  return release.formats.flatMap((format) => [
    normalizeText(format.name),
    ...format.details.map(normalizeText),
  ]);
}

function compareBarcode(expected: string, actual?: string): MatchReason {
  if (!actual) {
    return reason("barcode", "missing", "Candidate has no barcode", 0);
  }

  const normalizedActual = normalizeBarcode(actual);
  if (expected === normalizedActual) {
    return reason("barcode", "match", "Exact barcode match", 55);
  }

  const withoutLeadingZero = (value: string) => value.replace(/^0/, "");
  if (
    expected.length >= 12 &&
    withoutLeadingZero(expected) === withoutLeadingZero(normalizedActual)
  ) {
    return reason("barcode", "match", "Compatible UPC/EAN barcode", 20);
  }

  return reason("barcode", "conflict", "Barcode conflicts", -45);
}

function compareCatalogue(expected: string, release: Release): MatchReason {
  const values = catalogueNumbers(release);
  if (values.length === 0) {
    return reason(
      "catalogueNumber",
      "missing",
      "Candidate has no catalogue number",
      0,
    );
  }
  if (values.includes(expected)) {
    return reason(
      "catalogueNumber",
      "match",
      "Exact catalogue number match",
      35,
    );
  }
  if (
    values.some((value) => value.includes(expected) || expected.includes(value))
  ) {
    return reason(
      "catalogueNumber",
      "match",
      "Partial catalogue number match",
      20,
    );
  }
  return reason(
    "catalogueNumber",
    "conflict",
    "Catalogue number conflicts",
    -25,
  );
}

function compareMatrix(expected: string, release: Release): MatchReason {
  const values = matrixValues(release);
  if (values.length === 0) {
    return reason("matrix", "missing", "Candidate has no runout data", 0);
  }
  if (values.includes(expected)) {
    return reason("matrix", "match", "Exact runout match", 50);
  }
  if (
    values.some((value) => value.includes(expected) || expected.includes(value))
  ) {
    return reason("matrix", "match", "Runout tokens overlap", 30);
  }
  return reason("matrix", "conflict", "Runout marking conflicts", -25);
}

export function scoreRelease(
  evidence: Evidence,
  release: Release,
): MatchCandidate {
  const normalized = normalizeEvidence(evidence);
  const reasons: MatchReason[] = [];

  if (normalized.barcode) {
    reasons.push(compareBarcode(normalized.barcode, release.barcode));
  }
  if (normalized.matrix) {
    reasons.push(compareMatrix(normalized.matrix, release));
  }
  if (normalized.catalogueNumber) {
    reasons.push(compareCatalogue(normalized.catalogueNumber, release));
  }
  if (normalized.artist) {
    reasons.push(compareText("artist", normalized.artist, release.artist));
  }
  if (normalized.title) {
    reasons.push(compareText("title", normalized.title, release.title));
  }
  if (normalized.label) {
    const candidateLabel = firstLabel(release);
    if (!candidateLabel) {
      reasons.push(reason("label", "missing", "Candidate has no label", 0));
    } else if (normalized.label === normalizeText(candidateLabel)) {
      reasons.push(reason("label", "match", "Exact label match", 12));
    } else if (
      tokenDiceCoefficient(normalized.label, normalizeText(candidateLabel)) >=
      0.5
    ) {
      reasons.push(reason("label", "match", "Similar label name", 7));
    } else {
      reasons.push(reason("label", "conflict", "Label differs", -5));
    }
  }
  if (normalized.country) {
    if (!release.country) {
      reasons.push(reason("country", "missing", "Candidate has no country", 0));
    } else if (normalized.country === normalizeText(release.country)) {
      reasons.push(reason("country", "match", "Country matches", 8));
    } else {
      reasons.push(reason("country", "conflict", "Country differs", -4));
    }
  }
  if (normalized.year) {
    if (!release.year) {
      reasons.push(reason("year", "missing", "Candidate has no year", 0));
    } else if (normalized.year === release.year) {
      reasons.push(reason("year", "match", "Release year matches", 8));
    } else if (Math.abs(normalized.year - release.year) === 1) {
      reasons.push(reason("year", "match", "Release year is adjacent", 4));
    } else {
      reasons.push(reason("year", "conflict", "Release year differs", -4));
    }
  }
  if (normalized.format) {
    const formats = formatValues(release);
    if (formats.length === 0) {
      reasons.push(reason("format", "missing", "Candidate has no format", 0));
    } else if (formats.includes(normalized.format)) {
      reasons.push(reason("format", "match", "Format matches", 8));
    } else if (
      formats.some(
        (format) =>
          format.includes(normalized.format ?? "") ||
          normalized.format?.includes(format),
      )
    ) {
      reasons.push(reason("format", "match", "Format details overlap", 4));
    } else {
      reasons.push(reason("format", "conflict", "Format differs", -4));
    }
  }

  const strongConflict = reasons.some(
    (item) =>
      item.outcome === "conflict" &&
      ["barcode", "matrix", "catalogueNumber"].includes(item.field),
  );
  const rawScore = reasons.reduce((sum, item) => sum + item.points, 0);
  let score = Math.max(0, Math.min(100, Math.round(rawScore)));
  if (strongConflict) score = Math.min(score, 79);

  const confidence = score >= 80 ? "high" : score >= 50 ? "possible" : "verify";
  return { release, score, confidence, reasons };
}

function exactStrongMatches(candidate: MatchCandidate): number {
  return candidate.reasons.filter(
    (item) =>
      item.outcome === "match" &&
      item.points >= 35 &&
      ["barcode", "matrix", "catalogueNumber"].includes(item.field),
  ).length;
}

export function rankReleases(
  evidence: Evidence,
  releases: readonly Release[],
): MatchCandidate[] {
  return releases
    .map((release) => scoreRelease(evidence, release))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      if (scoreDifference !== 0) return scoreDifference;

      const strongDifference =
        exactStrongMatches(right) - exactStrongMatches(left);
      if (strongDifference !== 0) return strongDifference;

      const dateDifference = (left.release.releaseDate ?? "9999").localeCompare(
        right.release.releaseDate ?? "9999",
      );
      if (dateDifference !== 0) return dateDifference;

      return left.release.source.releaseId.localeCompare(
        right.release.source.releaseId,
      );
    });
}
