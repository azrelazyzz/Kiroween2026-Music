export type MetadataProviderName =
  "musicbrainz" | "discogs" | "demo" | "manual";

export type IdentificationMethod =
  "search" | "barcode" | "photo" | "runout" | "manual" | "demo";

export type Condition =
  | "Mint"
  | "Near Mint"
  | "Very Good Plus"
  | "Very Good"
  | "Good Plus"
  | "Good"
  | "Fair"
  | "Poor";

export type ReleaseSource = {
  provider: MetadataProviderName;
  releaseId: string;
  url?: string | undefined;
};

export type ReleaseLabel = {
  name: string;
  catalogueNumber?: string | undefined;
};

export type ReleaseFormat = {
  name: string;
  details: string[];
};

export type ReleaseIdentifier = {
  type: string;
  value: string;
};

export type ReleaseTrack = {
  position?: string | undefined;
  title: string;
  duration?: string | undefined;
};

export type Release = {
  source: ReleaseSource;
  artist: string;
  title: string;
  releaseDate?: string | undefined;
  year?: number | undefined;
  country?: string | undefined;
  labels: ReleaseLabel[];
  formats: ReleaseFormat[];
  barcode?: string | undefined;
  identifiers: ReleaseIdentifier[];
  genres: string[];
  styles: string[];
  tracks: ReleaseTrack[];
  coverArtUrl?: string | undefined;
  demo?: boolean | undefined;
};

export type Evidence = {
  artist?: string | undefined;
  title?: string | undefined;
  label?: string | undefined;
  catalogueNumber?: string | undefined;
  barcode?: string | undefined;
  matrix?: string | undefined;
  country?: string | undefined;
  year?: number | undefined;
  format?: string | undefined;
};

export type EvidenceField = keyof Evidence;

export type MatchReason = {
  field: EvidenceField;
  outcome: "match" | "conflict" | "missing";
  explanation: string;
  points: number;
};

export type MatchCandidate = {
  release: Release;
  score: number;
  confidence: "high" | "possible" | "verify";
  reasons: MatchReason[];
};

export type CollectionCopy = {
  id: string;
  ownerId: string;
  release: Release;
  evidence: Evidence;
  identificationMethod: IdentificationMethod;
  mediaCondition?: Condition | undefined;
  sleeveCondition?: Condition | undefined;
  notes?: string | undefined;
  shelf?: string | undefined;
  tags: string[];
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
};

export type NewCollectionCopy = Omit<
  CollectionCopy,
  "id" | "ownerId" | "addedAt" | "updatedAt"
> & {
  idempotencyKey: string;
};

export type CollectionUpdate = Partial<
  Pick<
    CollectionCopy,
    | "mediaCondition"
    | "sleeveCondition"
    | "notes"
    | "shelf"
    | "tags"
    | "favorite"
  >
>;

export type SearchInput = Evidence & {
  query?: string | undefined;
  limit?: number | undefined;
};

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "VISION_NOT_CONFIGURED"
  | "CAMERA_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "SAVE_CONFLICT"
  | "UNKNOWN_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
};

export type ApiSuccess<T> = {
  data: T;
  meta: {
    provider: MetadataProviderName;
    demo: boolean;
    resultCount: number;
  };
};

export type ApiFailure = {
  error: ApiError;
};
