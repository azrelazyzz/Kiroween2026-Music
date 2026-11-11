import type { Release, SearchInput } from "@/lib/domain/types";

export interface MetadataProvider {
  readonly name: "musicbrainz" | "discogs";
  search(input: SearchInput): Promise<Release[]>;
}

export type ProviderErrorKind =
  "rate_limited" | "unavailable" | "invalid_response";

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
