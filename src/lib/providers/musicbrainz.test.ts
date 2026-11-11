import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildMusicBrainzQuery,
  MusicBrainzProvider,
} from "@/lib/providers/musicbrainz";

describe("MusicBrainz provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("escapes user values and uses structured release fields", () => {
    expect(
      buildMusicBrainzQuery({
        artist: "AC/DC",
        title: "Back in Black",
        catalogueNumber: "ATL (50-732)",
        barcode: "0 123456789012",
      }),
    ).toBe(
      'artist:"AC\\/DC" AND release:"Back in Black" AND catno:"ATL \\(50\\-732\\)" AND barcode:0123456789012',
    );
  });

  it("maps a bounded provider response into the domain model", async () => {
    const providerPayload = {
      releases: [
        {
          id: "7fef4c3b-c9ee-4d7a-b689-0f9a0ef4a588",
          title: "Test Pressing",
          date: "1979-04-02",
          country: "GB",
          barcode: "0123456789012",
          "artist-credit": [{ name: "Needle Group" }],
          "label-info": [
            { "catalog-number": "NG-12", label: { name: "Needleworks" } },
          ],
          media: [
            {
              format: '12" Vinyl',
              tracks: [
                {
                  number: "A1",
                  title: "Opening Groove",
                  length: 121000,
                },
              ],
            },
          ],
          "release-group": {
            "primary-type": "Album",
            genres: [{ name: "Rock", count: 4 }],
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(providerPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const releases = await new MusicBrainzProvider().search({
      artist: "Needle Group",
      title: "Test Pressing",
      limit: 1,
    });

    expect(releases).toEqual([
      expect.objectContaining({
        artist: "Needle Group",
        title: "Test Pressing",
        year: 1979,
        country: "GB",
        barcode: "0123456789012",
        labels: [{ name: "Needleworks", catalogueNumber: "NG-12" }],
        tracks: [{ position: "A1", title: "Opening Groove", duration: "2:01" }],
      }),
    ]);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
