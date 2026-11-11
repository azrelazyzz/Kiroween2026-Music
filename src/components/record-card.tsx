"use client";

import { Heart, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/artwork";
import type { CollectionCopy } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function RecordCard({ copy }: { copy: CollectionCopy }) {
  const format = copy.release.formats[0]?.name;

  return (
    <article className="group min-w-0">
      <Link
        href={`/collection/${copy.id}`}
        className="block rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--ink)] focus-visible:outline-none"
      >
        <div className="relative">
          <Artwork
            src={copy.release.coverArtUrl}
            alt={`Cover of ${copy.release.title} by ${copy.release.artist}`}
            className="rounded-[0.35rem] transition duration-500 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:shadow-[0_34px_70px_rgba(0,0,0,0.48)]"
          />
          {copy.favorite ? (
            <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-[var(--ink)]/78 text-[#e78694] backdrop-blur">
              <Heart className="size-4 fill-current" aria-label="Favorite" />
            </span>
          ) : null}
          {copy.release.demo ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-[var(--paper)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[var(--ink)] uppercase shadow">
              Fictional demo
            </span>
          ) : null}
        </div>
        <div className="flex items-start gap-3 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display truncate text-xl leading-tight text-[var(--paper)]">
              {copy.release.title}
            </h2>
            <p className="mt-1 truncate text-sm text-white/52">
              {copy.release.artist}
            </p>
            <p className="mt-2 text-[11px] tracking-[0.08em] text-white/32 uppercase">
              {[copy.release.year, copy.release.country, format]
                .filter(Boolean)
                .join(" · ") || "Edition not specified"}
            </p>
          </div>
          <MoreHorizontal
            className={cn("mt-1 size-5 shrink-0 text-white/28")}
            aria-hidden="true"
          />
        </div>
      </Link>
    </article>
  );
}
