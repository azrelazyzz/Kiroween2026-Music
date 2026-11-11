import { NextResponse } from "next/server";

import {
  DEMO_BARCODE,
  demoIdentificationCandidates,
} from "@/lib/demo/fixtures";
import {
  normalizeBarcode,
  normalizeCompact,
  normalizeMatrix,
} from "@/lib/domain/normalize";
import { rankReleases } from "@/lib/domain/matching";
import { evidenceSchema } from "@/lib/domain/schemas";
import type {
  ApiFailure,
  ApiSuccess,
  MatchCandidate,
} from "@/lib/domain/types";
import { MusicBrainzProvider } from "@/lib/providers/musicbrainz";
import { ProviderError } from "@/lib/providers/types";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The identification request was not valid JSON.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  const parsed = evidenceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            parsed.error.issues[0]?.message ??
            "Check the identification clues.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  const evidence = parsed.data;
  const isDemoEvidence =
    (evidence.barcode && normalizeBarcode(evidence.barcode) === DEMO_BARCODE) ||
    (evidence.matrix &&
      ["AE 017 A1 LUMEN", "AE 017 DMM B"].includes(
        normalizeMatrix(evidence.matrix),
      )) ||
    (evidence.catalogueNumber &&
      ["AE017", "AE017D"].includes(normalizeCompact(evidence.catalogueNumber)));
  if (isDemoEvidence) {
    const candidates = rankReleases(evidence, demoIdentificationCandidates);
    return NextResponse.json<ApiSuccess<MatchCandidate[]>>({
      data: candidates,
      meta: { provider: "demo", demo: true, resultCount: candidates.length },
    });
  }

  try {
    const provider = new MusicBrainzProvider();
    const releases = await provider.search({ ...evidence, limit: 12 });
    const candidates = rankReleases(evidence, releases);
    return NextResponse.json<ApiSuccess<MatchCandidate[]>>({
      data: candidates,
      meta: {
        provider: "musicbrainz",
        demo: false,
        resultCount: candidates.length,
      },
    });
  } catch (error) {
    const providerError =
      error instanceof ProviderError
        ? error
        : new ProviderError(
            "unavailable",
            "The metadata provider is temporarily unavailable.",
            true,
          );
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code:
            providerError.kind === "rate_limited"
              ? "PROVIDER_RATE_LIMITED"
              : "PROVIDER_UNAVAILABLE",
          message: providerError.message,
          retryable: providerError.retryable,
        },
      },
      { status: providerError.kind === "rate_limited" ? 429 : 503 },
    );
  }
}
