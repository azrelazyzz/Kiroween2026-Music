import { NextResponse } from "next/server";

import { searchInputSchema } from "@/lib/domain/schemas";
import type { ApiFailure, ApiSuccess, Release } from "@/lib/domain/types";
import { MusicBrainzProvider } from "@/lib/providers/musicbrainz";
import { ProviderError } from "@/lib/providers/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(
    [...url.searchParams.entries()].filter(
      ([, value]) => value.trim().length > 0,
    ),
  );
  const parsed = searchInputSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            parsed.error.issues[0]?.message ?? "Check the search fields.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  try {
    const provider = new MusicBrainzProvider();
    const releases = await provider.search(parsed.data);
    return NextResponse.json<ApiSuccess<Release[]>>({
      data: releases,
      meta: {
        provider: "musicbrainz",
        demo: false,
        resultCount: releases.length,
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
