"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { useCollection } from "@/components/collection-provider";
import { PageHeading } from "@/components/page-heading";
import { RecordCard } from "@/components/record-card";

type SortMode = "recent" | "artist" | "title" | "year";

export default function CollectionPage() {
  const { copies, loading } = useCollection();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en");
    return copies
      .filter((copy) => !favoritesOnly || copy.favorite)
      .filter((copy) => {
        if (!needle) return true;
        return [
          copy.release.artist,
          copy.release.title,
          copy.release.labels.map((label) => label.name).join(" "),
          copy.release.labels.map((label) => label.catalogueNumber).join(" "),
          copy.shelf,
          copy.tags.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("en")
          .includes(needle);
      })
      .sort((left, right) => {
        if (sort === "artist")
          return left.release.artist.localeCompare(right.release.artist);
        if (sort === "title")
          return left.release.title.localeCompare(right.release.title);
        if (sort === "year")
          return (left.release.year ?? 9999) - (right.release.year ?? 9999);
        return right.addedAt.localeCompare(left.addedAt);
      });
  }, [copies, favoritesOnly, query, sort]);

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="Your shelves"
        title="The collection"
        description={`${copies.length} physical ${copies.length === 1 ? "copy" : "copies"}, including intentional duplicates.`}
      />

      <div className="mt-12 flex flex-col gap-3 rounded-[1.4rem] bg-white/[0.045] p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1" htmlFor="collection-search">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/35"
            aria-hidden="true"
          />
          <span className="sr-only">Search collection</span>
          <input
            id="collection-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search artist, title, label, shelf, or tag"
            className="h-12 w-full rounded-2xl bg-transparent pr-4 pl-11 text-sm text-white outline-none placeholder:text-white/28 focus:bg-white/5 focus:ring-2 focus:ring-[var(--brass)]/60"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-white/45">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Sort records</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 rounded-xl bg-[#24201e] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-[var(--brass)]"
          >
            <option value="recent">Recently added</option>
            <option value="artist">Artist A–Z</option>
            <option value="title">Title A–Z</option>
            <option value="year">Release year</option>
          </select>
        </label>
        <button
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((value) => !value)}
          className={`h-11 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--brass)] ${
            favoritesOnly
              ? "bg-[var(--oxblood)] text-white"
              : "bg-white/6 text-white/55 hover:text-white"
          }`}
        >
          Favorites
        </button>
      </div>

      <p className="mt-5 text-xs text-white/35" aria-live="polite">
        {loading
          ? "Loading collection…"
          : `${visible.length} ${visible.length === 1 ? "copy" : "copies"} shown`}
      </p>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-md bg-white/6"
            />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-7">
          {visible.map((copy) => (
            <RecordCard key={copy.id} copy={copy} />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-[2rem] bg-white/4 px-6 py-20 text-center">
          <p className="font-display text-4xl">
            No record found in that crate.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/42">
            Try a broader search or clear the favorites filter. Your saved
            records have not been changed.
          </p>
        </div>
      )}
    </div>
  );
}
