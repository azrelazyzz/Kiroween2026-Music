import { z } from "zod";

import type { Release, SearchInput } from "@/lib/domain/types";
import { normalizeBarcode } from "@/lib/domain/normalize";
import { type MetadataProvider, ProviderError } from "@/lib/providers/types";

const musicBrainzResponseSchema = z.object({
  releases: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        date: z.string().optional(),
        country: z.string().optional(),
        barcode: z.string().optional(),
        "artist-credit": z
          .array(
            z.object({
              name: z.string(),
              joinphrase: z.string().optional(),
            }),
          )
          .optional(),
        "label-info": z
          .array(
            z.object({
              "catalog-number": z.string().nullable().optional(),
              label: z
                .object({
                  name: z.string(),
                })
                .nullable()
                .optional(),
            }),
          )
          .optional(),
        media: z
          .array(
            z.object({
              format: z.string().optional(),
              title: z.string().optional(),
              tracks: z
                .array(
                  z.object({
                    position: z.number().optional(),
                    number: z.string().optional(),
                    title: z.string().optional(),
                    length: z.number().nullable().optional(),
                    recording: z
                      .object({
                        title: z.string().optional(),
                        length: z.number().nullable().optional(),
                      })
                      .optional(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
        "release-group": z
          .object({
            "primary-type": z.string().optional(),
            "secondary-types": z.array(z.string()).optional(),
            genres: z
              .array(
                z.object({ name: z.string(), count: z.number().optional() }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

type MusicBrainzRelease = z.infer<
  typeof musicBrainzResponseSchema
>["releases"][number];

let nextRequestAt = 0;
const inFlight = new Map<string, Promise<Release[]>>();

function escapeLucene(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/([+\-&|!(){}\[\]^"~*?:\\/])/g, "\\$1")
    .trim();
}

function quotedField(field: string, value: string): string {
  return `${field}:"${escapeLucene(value)}"`;
}

export function buildMusicBrainzQuery(input: SearchInput): string {
  const fields: string[] = [];
  if (input.query) fields.push(escapeLucene(input.query));
  if (input.artist) fields.push(quotedField("artist", input.artist));
  if (input.title) fields.push(quotedField("release", input.title));
  if (input.label) fields.push(quotedField("label", input.label));
  if (input.catalogueNumber) {
    fields.push(quotedField("catno", input.catalogueNumber));
  }
  if (input.barcode) {
    fields.push(`barcode:${normalizeBarcode(input.barcode)}`);
  }
  if (input.country) fields.push(quotedField("country", input.country));
  if (input.year) fields.push(`date:${input.year}`);
  if (input.format) fields.push(quotedField("format", input.format));
  return fields.join(" AND ");
}

async function waitForRateWindow(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + 1_100;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

function formatDuration(milliseconds?: number | null): string | undefined {
  if (!milliseconds || milliseconds < 0) return undefined;
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function mapRelease(item: MusicBrainzRelease): Release {
  const artist =
    item["artist-credit"]
      ?.map((credit) => `${credit.name}${credit.joinphrase ?? ""}`)
      .join("") || "Unknown artist";
  const yearMatch = item.date?.match(/^\d{4}/);
  const genres =
    item["release-group"]?.genres?.map((genre) => genre.name) ?? [];
  const primaryType = item["release-group"]?.["primary-type"];
  const secondaryTypes = item["release-group"]?.["secondary-types"] ?? [];

  return {
    source: {
      provider: "musicbrainz",
      releaseId: item.id,
      url: `https://musicbrainz.org/release/${item.id}`,
    },
    artist,
    title: item.title,
    ...(item.date ? { releaseDate: item.date } : {}),
    ...(yearMatch ? { year: Number(yearMatch[0]) } : {}),
    ...(item.country ? { country: item.country } : {}),
    labels: (item["label-info"] ?? []).flatMap((labelInfo) => {
      if (!labelInfo.label?.name) return [];
      return [
        {
          name: labelInfo.label.name,
          ...(labelInfo["catalog-number"]
            ? { catalogueNumber: labelInfo["catalog-number"] }
            : {}),
        },
      ];
    }),
    formats: (item.media ?? []).map((medium) => ({
      name: medium.format ?? "Unknown format",
      details: [
        ...(medium.title ? [medium.title] : []),
        ...(primaryType ? [primaryType] : []),
        ...secondaryTypes,
      ],
    })),
    ...(item.barcode ? { barcode: item.barcode } : {}),
    identifiers: [],
    genres,
    styles: [],
    tracks: (item.media ?? []).flatMap((medium) =>
      (medium.tracks ?? []).map((track) => {
        const title = track.title ?? track.recording?.title ?? "Untitled track";
        const duration = formatDuration(
          track.length ?? track.recording?.length,
        );
        return {
          ...((track.number ?? track.position)
            ? { position: track.number ?? String(track.position) }
            : {}),
          title,
          ...(duration ? { duration } : {}),
        };
      }),
    ),
    coverArtUrl: `https://coverartarchive.org/release/${item.id}/front-500`,
  };
}

async function fetchSearch(query: string, limit: number): Promise<Release[]> {
  await waitForRateWindow();
  const url = new URL("https://musicbrainz.org/ws/2/release");
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));

  const contact =
    process.env.MUSICBRAINZ_CONTACT ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `MusicCataloguingApp/0.1.0 (${contact})`,
      },
      signal: controller.signal,
      next: { revalidate: 900 },
    });

    if (response.status === 429 || response.status === 503) {
      throw new ProviderError(
        "rate_limited",
        "MusicBrainz is busy. Please wait a moment and try again.",
        true,
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        "unavailable",
        "MusicBrainz could not complete this search.",
        response.status >= 500,
      );
    }

    const payload: unknown = await response.json();
    const parsed = musicBrainzResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProviderError(
        "invalid_response",
        "MusicBrainz returned data in an unexpected format.",
        false,
      );
    }
    return parsed.data.releases.map(mapRelease);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(
        "unavailable",
        "MusicBrainz took too long to respond.",
        true,
      );
    }
    throw new ProviderError(
      "unavailable",
      "MusicBrainz is temporarily unavailable.",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export class MusicBrainzProvider implements MetadataProvider {
  readonly name = "musicbrainz" as const;

  async search(input: SearchInput): Promise<Release[]> {
    const query = buildMusicBrainzQuery(input);
    if (!query) return [];
    const key = `${query}|${input.limit ?? 12}`;
    const existing = inFlight.get(key);
    if (existing) return existing;

    const request = fetchSearch(query, input.limit ?? 12).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, request);
    return request;
  }
}
