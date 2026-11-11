import type { CollectionCopy, Release } from "@/lib/domain/types";

export const DEMO_BARCODE = "0712345678901";

export const demoIdentificationCandidates: Release[] = [
  {
    source: {
      provider: "demo",
      releaseId: "demo-night-transit-uk-1987",
    },
    artist: "Mara Voss",
    title: "Night Transit",
    releaseDate: "1987-09-14",
    year: 1987,
    country: "GB",
    labels: [{ name: "Afterglow Editions", catalogueNumber: "AE-017" }],
    formats: [{ name: "Vinyl", details: ["LP", "Album", "Stereo"] }],
    barcode: DEMO_BARCODE,
    identifiers: [{ type: "Matrix / Runout", value: "AE 017 A1 LUMEN" }],
    genres: ["Electronic"],
    styles: ["Synth-pop", "Downtempo"],
    tracks: [
      { position: "A1", title: "Signal Lights", duration: "4:12" },
      { position: "A2", title: "Underpass", duration: "5:06" },
      { position: "B1", title: "Night Transit", duration: "6:18" },
      { position: "B2", title: "Last Platform", duration: "3:54" },
    ],
    coverArtUrl: "/demo/night-transit.svg",
    demo: true,
  },
  {
    source: {
      provider: "demo",
      releaseId: "demo-night-transit-de-1988",
    },
    artist: "Mara Voss",
    title: "Night Transit",
    releaseDate: "1988",
    year: 1988,
    country: "DE",
    labels: [{ name: "Afterglow Editions", catalogueNumber: "AE-017-D" }],
    formats: [{ name: "Vinyl", details: ["LP", "Reissue"] }],
    barcode: DEMO_BARCODE,
    identifiers: [{ type: "Matrix / Runout", value: "AE 017 DMM B" }],
    genres: ["Electronic"],
    styles: ["Synth-pop", "Downtempo"],
    tracks: [
      { position: "A1", title: "Signal Lights", duration: "4:12" },
      { position: "A2", title: "Underpass", duration: "5:06" },
      { position: "B1", title: "Night Transit", duration: "6:18" },
      { position: "B2", title: "Last Platform", duration: "3:54" },
    ],
    coverArtUrl: "/demo/night-transit.svg",
    demo: true,
  },
];

const fixtureReleases: Release[] = [
  {
    source: { provider: "demo", releaseId: "demo-glass-harbour" },
    artist: "The Pale Fires",
    title: "Glass Harbour",
    releaseDate: "1976-04-03",
    year: 1976,
    country: "GB",
    labels: [{ name: "North Window", catalogueNumber: "NW-104" }],
    formats: [{ name: "Vinyl", details: ["LP", "Album"] }],
    barcode: "0712345678116",
    identifiers: [{ type: "Matrix / Runout", value: "NW 104 A-2 PEBBLE" }],
    genres: ["Rock"],
    styles: ["Art Rock", "Folk Rock"],
    tracks: [
      { position: "A1", title: "Breakwater" },
      { position: "A2", title: "Salt in the Glass" },
      { position: "B1", title: "Low Tide Choir" },
    ],
    coverArtUrl: "/demo/glass-harbour.svg",
    demo: true,
  },
  {
    source: { provider: "demo", releaseId: "demo-orbit-room" },
    artist: "Juno Quartet",
    title: "The Orbit Room",
    releaseDate: "1962",
    year: 1962,
    country: "US",
    labels: [{ name: "Helix Sound", catalogueNumber: "HS-2219" }],
    formats: [{ name: "Vinyl", details: ["LP", "Mono"] }],
    identifiers: [{ type: "Matrix / Runout", value: "HS 2219 A RVG" }],
    genres: ["Jazz"],
    styles: ["Modal", "Post Bop"],
    tracks: [
      { position: "A1", title: "Slow Ellipse", duration: "7:42" },
      { position: "A2", title: "Mercury Blue", duration: "5:31" },
      { position: "B1", title: "The Orbit Room", duration: "9:08" },
    ],
    coverArtUrl: "/demo/orbit-room.svg",
    demo: true,
  },
  {
    source: { provider: "demo", releaseId: "demo-tidal-memory" },
    artist: "Solenne Arc",
    title: "Tidal Memory",
    releaseDate: "1994-06-20",
    year: 1994,
    country: "FR",
    labels: [{ name: "Sillage", catalogueNumber: "SIL-009" }],
    formats: [{ name: "Vinyl", details: ["12 inch", "EP"] }],
    barcode: "0712345678338",
    identifiers: [{ type: "Matrix / Runout", value: "SIL 009 A MPO" }],
    genres: ["Electronic"],
    styles: ["Deep House", "Ambient House"],
    tracks: [
      { position: "A", title: "Tidal Memory", duration: "8:01" },
      { position: "B1", title: "Foam Index", duration: "5:49" },
      { position: "B2", title: "After Current", duration: "4:32" },
    ],
    coverArtUrl: "/demo/tidal-memory.svg",
    demo: true,
  },
];

function demoCopy(
  id: string,
  release: Release,
  addedAt: string,
  options: {
    favorite?: boolean | undefined;
    shelf?: string | undefined;
    tags?: string[] | undefined;
    mediaCondition?: CollectionCopy["mediaCondition"] | undefined;
    notes?: string | undefined;
  } = {},
): CollectionCopy {
  return {
    id,
    ownerId: "demo-user",
    release,
    evidence: { artist: release.artist, title: release.title },
    identificationMethod: "demo",
    mediaCondition: options.mediaCondition ?? "Very Good Plus",
    sleeveCondition: "Very Good",
    ...(options.notes ? { notes: options.notes } : {}),
    shelf: options.shelf ?? "Listening room",
    tags: options.tags ?? [],
    favorite: options.favorite ?? false,
    addedAt,
    updatedAt: addedAt,
  };
}

export const demoCollectionSeed: CollectionCopy[] = [
  demoCopy("demo-copy-glass", fixtureReleases[0]!, "2026-10-28T16:20:00.000Z", {
    favorite: true,
    tags: ["Sunday morning", "Inherited"],
    notes:
      "Fictional demo note: a quiet pressing with a handwritten inner sleeve.",
  }),
  demoCopy(
    "demo-copy-orbit-1",
    fixtureReleases[1]!,
    "2026-11-02T11:15:00.000Z",
    { favorite: true, tags: ["Jazz shelf"], mediaCondition: "Very Good" },
  ),
  demoCopy(
    "demo-copy-orbit-2",
    fixtureReleases[1]!,
    "2026-11-04T19:30:00.000Z",
    { shelf: "Trade box", tags: ["Duplicate"], mediaCondition: "Good Plus" },
  ),
  demoCopy("demo-copy-tidal", fixtureReleases[2]!, "2026-11-08T09:05:00.000Z", {
    tags: ["DJ bag", "Late night"],
    shelf: "Flight case A",
  }),
];
