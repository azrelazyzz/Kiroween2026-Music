import { z } from "zod";

const boundedText = z.string().trim().min(1).max(200);

export const providerNameSchema = z.enum([
  "musicbrainz",
  "discogs",
  "demo",
  "manual",
]);

export const evidenceSchema = z
  .object({
    artist: boundedText.optional(),
    title: boundedText.optional(),
    label: boundedText.optional(),
    catalogueNumber: boundedText.optional(),
    barcode: z.string().trim().min(6).max(32).optional(),
    matrix: z.string().trim().min(2).max(200).optional(),
    country: z.string().trim().min(2).max(80).optional(),
    year: z
      .number()
      .int()
      .min(1877)
      .max(new Date().getUTCFullYear() + 1)
      .optional(),
    format: z.string().trim().min(1).max(80).optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Provide at least one identification clue.",
  });

export const searchInputSchema = z
  .object({
    query: boundedText.optional(),
    artist: boundedText.optional(),
    title: boundedText.optional(),
    label: boundedText.optional(),
    catalogueNumber: boundedText.optional(),
    barcode: z.string().trim().min(6).max(32).optional(),
    matrix: z.string().trim().min(2).max(200).optional(),
    country: z.string().trim().min(2).max(80).optional(),
    year: z.coerce
      .number()
      .int()
      .min(1877)
      .max(new Date().getUTCFullYear() + 1)
      .optional(),
    format: z.string().trim().min(1).max(80).optional(),
    limit: z.coerce.number().int().min(1).max(20).default(12),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(
        value.query ??
        value.artist ??
        value.title ??
        value.label ??
        value.catalogueNumber ??
        value.barcode ??
        value.matrix,
      ),
    { message: "Enter a search term or identifier." },
  );

export const releaseSchema = z.object({
  source: z.object({
    provider: providerNameSchema,
    releaseId: z.string().min(1).max(200),
    url: z.string().url().optional(),
  }),
  artist: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  releaseDate: z.string().max(32).optional(),
  year: z.number().int().min(1877).max(3000).optional(),
  country: z.string().max(80).optional(),
  labels: z.array(
    z.object({
      name: z.string().min(1).max(300),
      catalogueNumber: z.string().max(200).optional(),
    }),
  ),
  formats: z.array(
    z.object({
      name: z.string().min(1).max(100),
      details: z.array(z.string().max(100)),
    }),
  ),
  barcode: z.string().max(64).optional(),
  identifiers: z.array(
    z.object({
      type: z.string().min(1).max(100),
      value: z.string().min(1).max(300),
    }),
  ),
  genres: z.array(z.string().max(100)),
  styles: z.array(z.string().max(100)),
  tracks: z.array(
    z.object({
      position: z.string().max(30).optional(),
      title: z.string().min(1).max(500),
      duration: z.string().max(30).optional(),
    }),
  ),
  coverArtUrl: z
    .string()
    .max(2048)
    .refine(
      (value) =>
        value.startsWith("/") || z.string().url().safeParse(value).success,
      "Cover art must use an absolute URL or a local asset path.",
    )
    .optional(),
  demo: z.boolean().optional(),
});

export const conditionSchema = z.enum([
  "Mint",
  "Near Mint",
  "Very Good Plus",
  "Very Good",
  "Good Plus",
  "Good",
  "Fair",
  "Poor",
]);

export const collectionCopySchema = z.object({
  id: z.string().min(1).max(100),
  ownerId: z.string().min(1).max(100),
  release: releaseSchema,
  evidence: z.object(evidenceSchema.shape).strict(),
  identificationMethod: z.enum([
    "search",
    "barcode",
    "photo",
    "runout",
    "manual",
    "demo",
  ]),
  mediaCondition: conditionSchema.optional(),
  sleeveCondition: conditionSchema.optional(),
  notes: z.string().max(5000).optional(),
  shelf: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(50)).max(30),
  favorite: z.boolean(),
  addedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const storedDemoCollectionSchema = z.object({
  version: z.literal(1),
  copies: z.array(collectionCopySchema).max(5000),
  idempotencyKeys: z.array(z.string().uuid()).max(5000),
});

export const matchCandidateSchema = z.object({
  release: releaseSchema,
  score: z.number().int().min(0).max(100),
  confidence: z.enum(["high", "possible", "verify"]),
  reasons: z.array(
    z.object({
      field: z.enum([
        "artist",
        "title",
        "label",
        "catalogueNumber",
        "barcode",
        "matrix",
        "country",
        "year",
        "format",
      ]),
      outcome: z.enum(["match", "conflict", "missing"]),
      explanation: z.string().min(1).max(300),
      points: z.number().int().min(-100).max(100),
    }),
  ),
});

export const identifyResponseSchema = z.union([
  z.object({
    data: z.array(matchCandidateSchema),
    meta: z.object({
      provider: providerNameSchema,
      demo: z.boolean(),
      resultCount: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    error: z.object({
      code: z.enum([
        "VALIDATION_ERROR",
        "PROVIDER_UNAVAILABLE",
        "PROVIDER_RATE_LIMITED",
        "VISION_NOT_CONFIGURED",
        "CAMERA_UNAVAILABLE",
        "UNAUTHORIZED",
        "SAVE_CONFLICT",
        "UNKNOWN_ERROR",
      ]),
      message: z.string().min(1).max(500),
      retryable: z.boolean(),
    }),
  }),
]);
